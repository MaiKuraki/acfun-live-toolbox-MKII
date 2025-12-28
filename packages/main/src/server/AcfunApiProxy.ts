import express from 'express';
import { DataManager } from '../persistence/DataManager';
import { IPluginManager } from '../types/contracts';

import { TokenManager } from './TokenManager';
import { RoomManager } from '../rooms/RoomManager';
import { DatabaseManager } from '../persistence/DatabaseManager';
import { rateLimitManager } from './ApiRateLimitManager';
import { AcfunApiProxyConfig,  ApiResponse } from './types/AcfunApiTypes';
import { DanmuSQLiteWriter } from '../persistence/DanmuSQLiteWriter';

/**
 * AcFun API代理服务
 * 为外部插件提供HTTP接口访问acfunlive-http-api功能
 */
export class AcfunApiProxy {
  private acfunApi: any;
  private tokenManager: TokenManager;
  private config: AcfunApiProxyConfig;
  
  private databaseManager?: DatabaseManager;
  private pluginManager?: IPluginManager;
  private dataManager = DataManager.getInstance();
  private roomManager?: RoomManager;
  private static readonly STREAM_STATUS_TTL_MS = 3000;
  private streamStatusCache = new Map<string, { ts: number; resp: ApiResponse }>();
  private streamStatusInFlight = new Map<string, Promise<ApiResponse>>();

  constructor(config: AcfunApiProxyConfig = {}, tokenManager?: TokenManager, databaseManager?: DatabaseManager) {
    this.config = {
      enableAuth: true,
      enableRateLimit: true,
      enableRetry: true,
      allowedOrigins: ['http://localhost:*', 'http://127.0.0.1:*'],
      ...config
    };

    // 使用传入的TokenManager或创建新实例
    this.tokenManager = tokenManager || TokenManager.getInstance();
    
    // 从TokenManager获取API实例
    this.acfunApi = this.tokenManager.getApiInstance();

    // 初始化独立的服务
    
    this.databaseManager = databaseManager;

    this.initializeAuthentication();
  }

  public setPluginManager(pm: IPluginManager): void {
    this.pluginManager = pm;
  }

  public setRoomManager(rm: RoomManager): void {
    this.roomManager = rm;
  }

  private broadcast(kind: string, event: string, data: any): void {
    try {
      const pm = this.pluginManager;
      if (!pm) return;
      const plugins = pm.getInstalledPlugins().filter(p => p.enabled);
      for (const p of plugins) {
        const channel = `plugin:${p.id}:overlay`;
        this.dataManager.publish(channel, { event, payload: data }, { ttlMs: 120000, persist: true, meta: { kind } });
      }
    } catch {}
  }

  /**
   * 初始化认证
   */
  private async initializeAuthentication(): Promise<void> {
    try {
      // TokenManager会自动处理认证状态
      if (this.tokenManager.isAuthenticated()) {
        console.log('[AcfunApiProxy] Authentication initialized successfully');
      } else {
        console.log('[AcfunApiProxy] No valid authentication found');
      }
    } catch (error) {
      console.warn('[AcfunApiProxy] Failed to initialize authentication:', error);
    }
  }

  /**
   * 创建Express路由处理器
   */
  public createRoutes(): express.Router {
    const router = express.Router();

    // 中间件：CORS处理
    router.use((req, res, next) => {
      const origin = req.get('Origin');
      if (this.isOriginAllowed(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Plugin-ID');
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // 中间件：速率限制
    if (this.config.enableRateLimit) {
      router.use((req, res, next) => {
        const clientId = this.getClientId(req);
        const endpoint = `${req.method} ${req.path || ''}`;
        const limitResult = rateLimitManager.checkLimit(clientId, endpoint);
        if (!limitResult.allowed) {
          return res.status(429).json({ success: false, error: 'Rate limit exceeded', code: 429, retryAfter: limitResult.retryAfter });
        }
        (req as any).__endpoint = endpoint;
        next();
      });
    }

    // 中间件：认证检查
    if (this.config.enableAuth) {
      router.use((req, res, next) => {
        // 简单的插件ID检查（可选）
        const pluginId = req.headers['x-plugin-id'] || req.query.pluginId || req.body?.pluginId;
        if (pluginId) {
          // 将插件ID添加到请求对象
          (req as any).pluginId = pluginId;
        }
        next();
      });
    }

    // API代理路由
    router.all('/*splat', async (req, res) => {
      try {
        const splat = (req.params as any).splat;
        const apiPath: string = Array.isArray(splat) ? splat.join('/') : (splat || '');
        
        // 处理特定的 API 端点
        const response = await this.handleSpecificEndpoint(req, apiPath);
        if (response) {
          try { rateLimitManager.recordRequest(this.getClientId(req), (req as any).__endpoint, Boolean(response.success)); } catch {}
          return res.status(response.code || (response.success ? 200 : 500)).json(response);
        }

        // 通用 API 代理 - 不支持的端点
        const proxyResponse: ApiResponse = { success: false, error: `Unsupported API endpoint: ${req.method} /${apiPath}`, code: 404 };
        try { rateLimitManager.recordRequest(this.getClientId(req), (req as any).__endpoint, false); } catch {}
        res.status(proxyResponse.code || (proxyResponse.success ? 200 : 500)).json(proxyResponse);
      } catch (error) {
        console.error('[AcfunApiProxy] Route error:', error);
        try { rateLimitManager.recordRequest(this.getClientId(req), (req as any).__endpoint, false); } catch {}
        res.status(500).json({ success: false, error: 'Internal server error', code: 500 });
      }
    });

    return router;
  }

  /**
   * 处理特定的 API 端点
   */
  private async handleSpecificEndpoint(req: express.Request, apiPath: string): Promise<ApiResponse | null> {
    const method = req.method.toUpperCase();
    const pathSegments = apiPath.split('/').filter(Boolean);

    // 认证相关端点
    if (pathSegments[0] === 'auth') {
      return await this.handleAuthEndpoints(method, pathSegments.slice(1), req);
    }

    // 弹幕相关端点
    if (pathSegments[0] === 'danmu') {
      return await this.handleDanmuEndpoints(method, pathSegments.slice(1), req);
    }

    // 用户相关端点
    if (pathSegments[0] === 'user') {
      return await this.handleUserEndpoints(method, pathSegments.slice(1), req);
    }

    // 直播相关端点
    if (pathSegments[0] === 'live') {
      return await this.handleLiveEndpoints(method, pathSegments.slice(1), req);
    }

    // 礼物相关端点
    if (pathSegments[0] === 'gift') {
      return await this.handleGiftEndpoints(method, pathSegments.slice(1), req);
    }

    // 房管相关端点
    if (pathSegments[0] === 'manager') {
      return await this.handleManagerEndpoints(method, pathSegments.slice(1), req);
    }

    // 本地房间管理端点
    if (pathSegments[0] === 'room') {
      return await this.handleRoomEndpoints(method, pathSegments.slice(1), req);
    }

    // 徽章相关端点
    if (pathSegments[0] === 'badge') {
      return await this.handleBadgeEndpoints(method, pathSegments.slice(1), req);
    }

    // 直播预告相关端点
    if (pathSegments[0] === 'preview') {
      return await this.handlePreviewEndpoints(method, pathSegments.slice(1), req);
    }

    // 直播回放相关端点
    if (pathSegments[0] === 'replay') {
      return await this.handleReplayEndpoints(method, pathSegments.slice(1), req);
    }

    // EventSource 相关端点
    

    return null; // 未匹配到特定端点，使用通用代理
  }

  /**
   * 处理本地房间管理相关端点
   */
  private async handleRoomEndpoints(method: string, pathSegments: string[], req: express.Request): Promise<ApiResponse> {
    try {
      if (!this.roomManager) {
        return { success: false, error: 'RoomManager not initialized', code: 503 };
      }

      switch (pathSegments[0]) {
        case 'list':
          if (method === 'GET') {
            const rooms = this.roomManager.getAllRooms();
            // 过滤掉 circular structure (adapter) 避免序列化错误
            const safeRooms = rooms.map(r => ({
              roomId: r.roomId,
              status: r.status,
              connectedAt: r.connectedAt,
              eventCount: r.eventCount,
              priority: r.priority,
              label: r.label,
              liveId: r.liveId,
              streamInfo: r.streamInfo,
              isManager: r.isManager,
              lastError: r.lastError?.message
            }));
            return { success: true, data: safeRooms, code: 200 };
          }
          break;

        case 'status':
          if (method === 'GET') {
            const roomId = req.query.roomId as string;
            if (!roomId) return { success: false, error: 'roomId is required', code: 400 };
            const room = this.roomManager.getRoomInfo(roomId);
            if (!room) return { success: false, error: `找不到房间id${roomId}的信息`, code: 404 };
            
            const safeRoom = {
              roomId: room.roomId,
              status: room.status,
              connectedAt: room.connectedAt,
              eventCount: room.eventCount,
              priority: room.priority,
              label: room.label,
              liveId: room.liveId,
              streamInfo: room.streamInfo,
              isManager: room.isManager,
              lastError: room.lastError?.message
            };
            return { success: true, data: safeRoom, code: 200 };
          }
          break;
          
        case 'add':
          if (method === 'POST') {
             const { roomId } = req.body;
             if (!roomId) return { success: false, error: 'roomId is required', code: 400 };
             const roomIdStr = String(roomId);
             // 提前检查，给出更具体的错误提示
             if (this.roomManager.getRoomInfo(roomIdStr)) {
               return { success: false, error: `房间 ${roomIdStr} 已在管理列表中`, code: 400 };
             }

             const success = await this.roomManager.addRoom(roomIdStr);
             return { success, code: success ? 200 : 400, error: success ? undefined : `Failed to add room ${roomIdStr}` };
          }
          break;

        case 'remove':
          if (method === 'POST') {
             const { roomId } = req.body;
             if (!roomId) return { success: false, error: 'roomId is required', code: 400 };
             const roomIdStr = String(roomId);
             // 提前检查，给出更具体的错误提示
             if (!this.roomManager.getRoomInfo(roomIdStr)) {
               return { success: false, error: `未找到房间 ${roomIdStr}，无法移除`, code: 404 };
             }

             const success = await this.roomManager.removeRoom(roomIdStr);
             return { success, code: success ? 200 : 400, error: success ? undefined : `Failed to remove room ${roomIdStr}` };
          }
          break;
      }

      return { success: false, error: `Unsupported room endpoint: ${method} /${pathSegments.join('/')}`, code: 404 };
    } catch (error: any) {
      console.error('[AcfunApiProxy] Room endpoint error:', error);
      return { success: false, error: error.message || 'Room endpoint error', code: 500 };
    }
  }

  /**
   * 处理认证相关端点
   */
  private async handleAuthEndpoints(method: string, pathSegments: string[], req: express.Request): Promise<ApiResponse> {
    try {
      switch (pathSegments[0]) {
        case 'status':
          if (method === 'GET') {
            const validation = await this.tokenManager.validateToken();
            return {
              success: true,
              data: {
                authenticated: !!validation?.isValid,
                reason: validation?.reason,
                timestamp: Date.now()
              },
              code: 200
            };
          }
          break;

        case 'qr-login':
          if (method === 'POST') {
            const result = await this.acfunApi.auth.qrLogin();
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'qr-status':
          if (method === 'GET') {
            const result = await this.acfunApi.auth.checkQrLoginStatus();
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'token':
          if (method === 'POST') {
            const { token } = req.body;
            if (!token) {
              return {
                success: false,
                error: 'Token is required',
                code: 400
              };
            }
            await this.tokenManager.updateTokenInfo(typeof token === 'string' ? JSON.parse(token) : token);
            return {
              success: true,
              data: { message: 'Token updated successfully' },
              code: 200
            };
          } else if (method === 'DELETE') {
            await this.tokenManager.clearTokenInfo();
            return {
              success: true,
              data: { message: 'Token cleared successfully' },
              code: 200
            };
          }
          break;
      }

      return {
        success: false,
        error: `Unsupported auth endpoint: ${method} /${pathSegments.join('/')}`,
        code: 404
      };
    } catch (error: any) {
      console.error('[AcfunApiProxy] Auth endpoint error:', error);
      return {
        success: false,
        error: error.message || 'Auth endpoint error',
        code: 500
      };
    }
  }

  /**
   * 处理弹幕相关端点
   */
  private async handleDanmuEndpoints(method: string, pathSegments: string[], req: express.Request): Promise<ApiResponse> {
    try {
      switch (pathSegments[0]) {
        case 'connection-state':
          if (method === 'GET') {
            const tokenInfo = this.acfunApi.getHttpClient().getValidatedTokenInfo();
            if (!tokenInfo.tokenInfo) {
              return { success: false, error: '未登录或token无效', code: 401 };
            }
            const uid = String(tokenInfo.tokenInfo.userID || '');
            if (!uid) {
              return { success: false, error: '无法解析用户ID', code: 400 };
            }
            const rm = this.roomManager;
            const info = rm ? rm.getRoomInfo(uid) : null;
            const connected = !!info && String(info.status) === 'connected';
            const sessionId = (connected && (rm as any)?.getAdapterSessionId ? String((rm as any).getAdapterSessionId(uid) || '') : undefined);
            return { success: true, data: { connected, sessionId }, code: 200 };
          }
          break;
        case 'start':
          if (method === 'POST') {
            const { liverUID, callback } = req.body;
            if (!liverUID) {
              return {
                success: false,
                error: 'liverUID is required',
                code: 400
              };
            }

            const db = this.databaseManager?.getDb();
            const writer = db ? new DanmuSQLiteWriter(db) : null;
            let startedSessionId: string | null = null;
            let currentLiveId: string | null = null;
            const danmuCallback = (event: any) => {
              if (writer) {
                try {
                  if (!currentLiveId && startedSessionId && this.acfunApi?.danmu) {
                    const detail = this.acfunApi.danmu.getSessionDetail(startedSessionId);
                    if (detail && detail.success && (detail as any).data) {
                      currentLiveId = String((detail as any).data.liveID || '');
                    }
                  }
                  if (currentLiveId) {
                    writer.handleEvent(String(currentLiveId), String(liverUID), event).catch(err => { try { console.warn('[AcfunApiProxy] persist error:', err); } catch {} });
                  }
                } catch {}
              }
              try { console.log('[AcfunApiProxy] Danmu event:', event); } catch {}
            };

            const result = await this.acfunApi.danmu.startDanmu(liverUID, danmuCallback);
            if (result && result.success) {
              try {
                startedSessionId = String((result as any).data?.sessionId || '');
                if (startedSessionId && this.acfunApi?.danmu) {
                  const detail = this.acfunApi.danmu.getSessionDetail(startedSessionId);
                  if (detail && detail.success && (detail as any).data) {
                    currentLiveId = String((detail as any).data.liveID || '');
                  }
                }
              } catch {}
              this.broadcast('room', 'danmu-start', { liverUID, ts: Date.now(), sessionId: (result.data as any)?.sessionId });
            }
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'stop':
          if (method === 'POST') {
            const { sessionId } = req.body;
            if (!sessionId) {
              return {
                success: false,
                error: 'sessionId is required',
                code: 400
              };
            }

            const result = await this.acfunApi.danmu.stopDanmu(sessionId);
            if (result && result.success) {
              this.broadcast('room', 'danmu-stop', { sessionId, ts: Date.now() });
            }
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'room-info':
          if (method === 'GET') {
            const liverUID = req.query.liverUID as string;
            if (!liverUID) {
              return {
                success: false,
                error: 'liverUID is required',
                code: 400
              };
            }

            const result = await this.acfunApi.danmu.getLiveRoomInfo(liverUID);
            try {
              if (result && result.success && this.databaseManager) {
                const db = this.databaseManager.getDb();
                const stmt = db.prepare(`
                  INSERT INTO rooms_meta (
                    live_id,
                    room_id, streamer_name, streamer_user_id,
                    title, cover_url, status, is_live,
                    viewer_count, online_count, like_count, live_cover,
                    category_id, category_name, sub_category_id, sub_category_name,
                    created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                  ON CONFLICT(live_id) DO UPDATE SET
                    room_id=excluded.room_id,
                    streamer_name=excluded.streamer_name,
                    streamer_user_id=excluded.streamer_user_id,
                    title=excluded.title,
                    cover_url=excluded.cover_url,
                    status=excluded.status,
                    is_live=excluded.is_live,
                    viewer_count=excluded.viewer_count,
                    online_count=excluded.online_count,
                    like_count=excluded.like_count,
                    live_cover=excluded.live_cover,
                    category_id=excluded.category_id,
                    category_name=excluded.category_name,
                    sub_category_id=excluded.sub_category_id,
                    sub_category_name=excluded.sub_category_name
                `);
                const data: any = result.data || {};
                const owner = data.owner || {};
                const title = typeof data.title === 'string' ? data.title : '';
                const cover = typeof data.coverUrl === 'string' ? data.coverUrl : '';
                const status = data.liveID ? 'open' : 'closed';
                const isLive = data.liveID ? 1 : 0;
                const viewerCount = typeof data.viewerCount === 'number' ? data.viewerCount : (typeof data.onlineCount === 'number' ? data.onlineCount : 0);
                const liveCover = typeof data.liveCover === 'string' ? data.liveCover : null;
                const categoryId = data.categoryID ?? data.categoryId ?? null;
                const categoryName = data.categoryName ?? null;
                const subCategoryId = data.subCategoryID ?? data.subCategoryId ?? null;
                const subCategoryName = data.subCategoryName ?? null;
                const likeCount = typeof data.likeCount === 'number' ? data.likeCount : 0;
                stmt.run(
                  String(data.liveID ? String(data.liveID) : String(liverUID)),
                  String(liverUID),
                  owner.userName || owner.nickname || owner.name || '',
                  owner.userID != null ? String(owner.userID) : String(liverUID),
                  title,
                  cover,
                  status,
                  isLive,
                  viewerCount,
                  viewerCount,
                  likeCount,
                  liveCover,
                  categoryId != null ? String(categoryId) : '',
                  categoryName != null ? String(categoryName) : '',
                  subCategoryId != null ? String(subCategoryId) : '',
                  subCategoryName != null ? String(subCategoryName) : '',
                  (err: any) => {
                    try { stmt.finalize(); } catch {}
                    if (err) { try { console.warn('[rooms_meta] upsert error via /api/acfun/danmu/room-info', err); } catch {} }
                    else { try { console.info('[rooms_meta] upsert route=/api/acfun/danmu/room-info room=' + String(liverUID) + ' status=' + String(status) + ' isLive=' + String(isLive) + ' viewer=' + String(viewerCount)); } catch {} }
                  }
                );
              }
            } catch {}
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'send':
          if (method === 'POST') {
            const { liveId, content } = req.body as { liveId?: string; content?: string };
            const lid = String(liveId || '').trim();
            const text = String(content || '').trim();
            if (!lid) {
              return { success: false, error: 'liveId is required', code: 400 };
            }
            if (!text) {
              return { success: false, error: 'content is required', code: 400 };
            }
            const validation = await this.tokenManager.validateToken();
            if (!validation.isValid) {
              return { success: false, error: validation.reason || 'unauthorized', code: 401 };
            }
            const result = await this.acfunApi.danmu.sendDanmu(lid, text);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;
      }

      return {
        success: false,
        error: `Unsupported danmu endpoint: ${method} /${pathSegments.join('/')}`,
        code: 404
      };
    } catch (error: any) {
      console.error('[AcfunApiProxy] Danmu endpoint error:', error);
      return {
        success: false,
        error: error.message || 'Danmu endpoint error',
        code: 500
      };
    }
  }

  /**
   * 处理用户相关端点
   */
  private async handleUserEndpoints(method: string, pathSegments: string[], req: express.Request): Promise<ApiResponse> {
    try {
      switch (pathSegments[0]) {
        case 'info':
          if (method === 'GET') {
            const userId = req.query.userId as string;
            console.log('[AcfunApiProxy] getUserInfo called with userId:', userId);
            if (!userId) {
              console.log('[AcfunApiProxy] userId is missing');
              return {
                success: false,
                error: 'userId is required',
                code: 400
              };
            }

            // 确保认证token是最新的
            await this.updateAuthentication();
            console.log('[AcfunApiProxy] Authentication updated, isAuthenticated:', this.acfunApi.isAuthenticated?.());
            
            console.log('[AcfunApiProxy] Calling acfunApi.user.getUserInfo with userId:', userId);
            const result = await this.acfunApi.user.getUserInfo(userId);
            console.log('[AcfunApiProxy] getUserInfo result:', result);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'wallet':
          if (method === 'GET') {
            const result = await this.acfunApi.user.getWalletInfo();
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;
      }

      return {
        success: false,
        error: `Unsupported user endpoint: ${method} /${pathSegments.join('/')}`,
        code: 404
      };
    } catch (error: any) {
      console.error('[AcfunApiProxy] User endpoint error:', error);
      return {
        success: false,
        error: error.message || 'User endpoint error',
        code: 500
      };
    }
  }

  /**
   * 处理直播相关端点
   */
  private async handleLiveEndpoints(method: string, pathSegments: string[], req: express.Request): Promise<ApiResponse> {
    try {
      switch (pathSegments[0]) {
        case 'permission':
          if (method === 'GET') {
            const tokenInfo = this.acfunApi.getHttpClient().getValidatedTokenInfo();
            if (!tokenInfo.tokenInfo) {
              return { success: false, error: '未登录或token无效', code: 401 };
            }
            const result = await this.acfunApi.live.checkLivePermission();
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'stream-url':
          if (method === 'GET') {
            const liveId = req.query.liveId as string;
            if (!liveId) {
              return {
                success: false,
                error: 'liveId is required',
                code: 400
              };
            }

            const result = await this.acfunApi.live.getStreamUrl(liveId);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'stream-settings':
          if (method === 'GET') {
            const result = await this.acfunApi.live.getStreamSettings();
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'stream-status':
          if (method === 'GET') {
            try {
              console.debug('[AcfunApiProxy][stream-status] incoming GET');
              // 检查是否有有效的token信息
              const tokenInfo = this.acfunApi.getHttpClient().getValidatedTokenInfo();
              if (!tokenInfo.tokenInfo) {
                console.warn('[AcfunApiProxy][stream-status] token invalid');
                return {
                  success: false,
                  error: '未登录或token无效',
                  code: 401
                };
              }
              const now = Date.now();
              const qRoomId = String((req.query as any)?.roomId || '').trim();
              const userIdKey = tokenInfo?.tokenInfo?.userID ? String(tokenInfo.tokenInfo.userID) : '';
              const params = new URLSearchParams();
              try {
                const keys = Object.keys((req.query as any) || {}).sort();
                for (const k of keys) { const v = (req.query as any)[k]; params.set(k, String(v)); }
              } catch {}
              const cacheKey = `stream-status:${qRoomId || userIdKey}:${params.toString()}`;
              const cachedEntry = this.streamStatusCache.get(cacheKey);
              if (cachedEntry && (now - cachedEntry.ts) < AcfunApiProxy.STREAM_STATUS_TTL_MS) {
                return { ...cachedEntry.resp };
              }
              const inflight = this.streamStatusInFlight.get(cacheKey);
              if (inflight) {
                const cached = await inflight;
                return { ...cached };
              }
              try {
                const cookiesCount = Array.isArray(tokenInfo.tokenInfo.cookies) ? tokenInfo.tokenInfo.cookies.length : 0;
                console.debug('[AcfunApiProxy][stream-status] token ok', {
                  userID: tokenInfo.tokenInfo.userID,
                  deviceID: tokenInfo.tokenInfo.deviceID,
                  cookiesCount
                });
              } catch {}
              
            const p = (async () => {
                const upstream = await this.acfunApi.live.getLiveStreamStatus();
                const err = upstream.error || '';
                if (!upstream.success) {
                  const maybeJson = (() => {
                    try { const m = err.match(/\{[^]*\}/); if (m && m[0]) return JSON.parse(m[0]); } catch {} return null; })();
                  const notLive = err.includes('未开播') || (maybeJson && (Number(maybeJson.result) === 380023 || String(maybeJson.error_msg || '').includes('未开播')));
                  if (notLive) {
                    return {
                      success: true,
                      data: {
                        liveID: '',
                        streamName: '',
                        title: '',
                        liveCover: '',
                        liveStartTime: 0,
                        panoramic: false,
                        bizUnit: '',
                        bizCustomData: '',
                        isLive: false
                      },
                      error: undefined,
                      code: 200
                    } as ApiResponse;
                  }
                }
                return {
                  success: upstream.success,
                  data: upstream.data,
                  error: upstream.error,
                  code: 200
                } as ApiResponse;
              })();
              this.streamStatusInFlight.set(cacheKey, p);
              const result = await p;
              try {
                console.debug('[AcfunApiProxy][stream-status] upstream resp', {
                  success: result.success,
                  error: result.error,
                  data: result.data ? {
                    liveID: (result.data as any).liveID,
                    streamName: (result.data as any).streamName,
                    title: (result.data as any).title
                  } : null
                });
              } catch {}
              if (!result.success && cachedEntry) {
                this.streamStatusInFlight.delete(cacheKey);
                const stale = { ...cachedEntry.resp } as any;
                stale.meta = { ...(stale.meta || {}), stale: true };
                return { ...stale };
              }

              try {
                if (result && result.success && this.databaseManager) {
                  const tokenInfo = this.acfunApi.getHttpClient().getValidatedTokenInfo();
                  const roomId = tokenInfo?.tokenInfo?.userID ? String(tokenInfo.tokenInfo.userID) : undefined;
                  if (roomId) {
                    const db = this.databaseManager.getDb();
                const stmt = db.prepare(`
                    INSERT INTO rooms_meta (
                      live_id,
                      room_id, streamer_name, streamer_user_id,
                      title, cover_url, status, is_live,
                      viewer_count, online_count, like_count, live_cover,
                      category_id, category_name, sub_category_id, sub_category_name,
                      created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(live_id) DO UPDATE SET
                      room_id=excluded.room_id,
                      streamer_name=excluded.streamer_name,
                      streamer_user_id=excluded.streamer_user_id,
                      title=excluded.title,
                      cover_url=excluded.cover_url,
                      status=excluded.status,
                      is_live=excluded.is_live,
                      viewer_count=excluded.viewer_count,
                      online_count=excluded.online_count,
                      like_count=excluded.like_count,
                      live_cover=excluded.live_cover,
                      category_id=excluded.category_id,
                      category_name=excluded.category_name,
                      sub_category_id=excluded.sub_category_id,
                      sub_category_name=excluded.sub_category_name
                  `);
                    const data: any = result.data || {};
                    const liveIdVal: string | undefined = typeof data.liveID === 'string' && data.liveID ? String(data.liveID) : undefined;
                    const status = liveIdVal ? 'open' : 'closed';
                    const isLive = liveIdVal ? 1 : 0;
                    if (liveIdVal) {
                      stmt.run(
                        liveIdVal,
                        roomId,
                        '',
                        roomId,
                        typeof data.title === 'string' ? data.title : '',
                        null,
                        status,
                        isLive,
                        0,
                        0,
                        0,
                        '',
                        '',
                        '',
                        '',
                        (err: any) => {
                          try { stmt.finalize(); } catch {}
                          if (err) { try { console.warn('[rooms_meta] upsert error via /api/acfun/live/stream-status', err); } catch {} }
                          else { try { console.info('[rooms_meta] upsert route=/api/acfun/live/stream-status room=' + String(roomId) + ' status=' + String(status) + ' isLive=' + String(isLive)); } catch {} }
                        }
                      );
                    }
                  }
                }
              } catch {}
              if (result && result.success) {
                this.streamStatusCache.set(cacheKey, { ts: Date.now(), resp: { ...result } });
              }
              this.streamStatusInFlight.delete(cacheKey);
              return { ...result };
            } catch (error: any) {
              console.error('[AcfunApiProxy] Stream status error:', error);
              const cachedEntry = this.streamStatusCache.get(
                (() => {
                  try {
                    const tokenInfo = this.acfunApi.getHttpClient().getValidatedTokenInfo();
                    const now = Date.now();
                    const qRoomId = String((req.query as any)?.roomId || '').trim();
                    const userIdKey = tokenInfo?.tokenInfo?.userID ? String(tokenInfo.tokenInfo.userID) : '';
                    const params = new URLSearchParams();
                    const keys = Object.keys((req.query as any) || {}).sort();
                    for (const k of keys) { const v = (req.query as any)[k]; params.set(k, String(v)); }
                    const cacheKey = `stream-status:${qRoomId || userIdKey}:${params.toString()}`;
                    return cacheKey;
                  } catch { return ''; }
                })()
              );
              if (cachedEntry) {
                const stale = { ...cachedEntry.resp } as any;
                stale.meta = { ...(stale.meta || {}), stale: true };
                return { ...stale };
              }
              return {
                success: false,
                error: error.message || 'Failed to get stream status',
                code: 200
              };
            }
          }
          break;

        case 'transcode-info':
          if (method === 'GET') {
            try {
              const tokenInfo = this.acfunApi.getHttpClient().getValidatedTokenInfo();
              if (!tokenInfo.tokenInfo) {
                return {
                  success: false,
                  error: '未登录或token无效',
                  code: 401
                };
              }
              const streamName = String(req.query.streamName || '').trim();
              if (!streamName) {
                return {
                  success: false,
                  error: 'streamName is required',
                  code: 400
                };
              }
              const result = await this.acfunApi.live.getTranscodeInfo(streamName);
              const err = result.error || '';
              return {
                success: result.success,
                data: result.data,
                error: result.error,
                code: result.success ? 200 : (err.includes('cookies') || err.includes('token')) ? 401 : 400
              };
            } catch (error: any) {
              console.error('[AcfunApiProxy] Transcode info error:', error);
              return {
                success: false,
                error: error.message || 'Failed to get transcode info',
                code: 400
              };
            }
          }
          break;

        case 'start':
          if (method === 'POST') {
            const { title, coverFile, streamName, portrait, panoramic, categoryID, subCategoryID } = req.body;
            if (!title || !streamName || categoryID === undefined || subCategoryID === undefined) {
              return {
                success: false,
                error: 'title, streamName, categoryID, and subCategoryID are required',
                code: 400
              };
            }

            try {
              const preview = typeof coverFile === 'string' ? coverFile.slice(0, 32) : '';
              console.log('[AcfunApiProxy][START] params:', {
                title,
                streamName,
                portrait: !!portrait,
                panoramic: !!panoramic,
                categoryID,
                subCategoryID,
              });
              console.log('[AcfunApiProxy][START] coverFile meta:', {
                type: typeof coverFile,
                length: typeof coverFile === 'string' ? coverFile.length : 0,
                head: preview,
                isDataUri: typeof coverFile === 'string' && /^data:image\//i.test(coverFile),
                isHttp: typeof coverFile === 'string' && /^https?:\/\//i.test(coverFile),
              });
              if (typeof coverFile === 'string' && /^data:image\//i.test(coverFile) && !/^data:image\/jpeg/i.test(coverFile)) {
                return { success: false, error: '仅支持JPG封面', code: 400 };
              }
              if (typeof coverFile === 'string' && /^https?:\/\//i.test(coverFile)) {
                const lower = coverFile.toLowerCase();
                const isJpg = /\.jpe?g(\?.*)?$/.test(lower);
                if (!isJpg) return { success: false, error: '仅支持JPG封面', code: 400 };
              }
            } catch {}

            const result = await this.acfunApi.live.startLiveStream(
              title,
              coverFile || '',
              streamName,
              portrait || false,
              panoramic || false,
              categoryID,
              subCategoryID
            );
            if (result && result.success) {
              const liveId = (result.data as any)?.liveID || '';
              this.broadcast('room', 'live-start', { title, streamName, ts: Date.now(), liveId });
              // Also publish renderer event for live start
              this.broadcast('renderer', 'live-start', { liveId, roomId: '' }); // roomId is not available here
            }
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'stop':
          if (method === 'POST') {
            const { liveId } = req.body;
            if (!liveId) {
              return {
                success: false,
                error: 'liveId is required',
                code: 400
              };
            }

            const result = await this.acfunApi.live.stopLiveStream(liveId);
            if (result && result.success) {
              this.broadcast('room', 'live-stop', { liveId, ts: Date.now() });
              // Also publish renderer event for live stop
              this.broadcast('renderer', 'live-stop', { liveId, roomId: '' }); // roomId is not available here
            }
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'update':
          if (method === 'PUT') {
            const { title, coverFile, liveId } = req.body;
            if (!title || !liveId) {
              return {
                success: false,
                error: 'title and liveId are required',
                code: 400
              };
            }
            if (typeof coverFile === 'string' && /^data:image\//i.test(coverFile) && !/^data:image\/jpeg/i.test(coverFile)) {
              return { success: false, error: '仅支持JPG封面', code: 400 };
            }
            if (typeof coverFile === 'string' && /^https?:\/\//i.test(coverFile)) {
              const lower = coverFile.toLowerCase();
              const isJpg = /\.jpe?g(\?.*)?$/.test(lower);
              if (!isJpg) return { success: false, error: '仅支持JPG封面', code: 400 };
            }
            const result = await this.acfunApi.live.updateLiveRoom(title, coverFile || '', liveId);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'statistics':
          if (method === 'GET') {
            const userIdRaw = req.query.userId as string;
            const userID = parseInt(String(userIdRaw || '')); 
            if (!userID || Number.isNaN(userID)) {
              return {
                success: false,
                error: 'userId is required',
                code: 400
              };
            }

            const userInfo = await this.acfunApi.live.getUserLiveInfo(userID);
            if (userInfo && userInfo.success && userInfo.data) {
              const d = userInfo.data;
              const mapped = {
                totalViewers: typeof d.onlineCount === 'number' ? d.onlineCount : 0,
                peakViewers: 0,
                totalComments: 0,
                totalGifts: 0,
                totalLikes: typeof d.likeCount === 'number' ? d.likeCount : 0,
                revenue: 0
              };
              return { success: true, data: mapped, code: 200 };
            }
            return { success: false, error: userInfo?.error || 'fetch_failed', code: 400 };
          }
          break;

        case 'summary':
          if (method === 'GET') {
            const liveId = req.query.liveId as string;
            if (!liveId) {
              return {
                success: false,
                error: 'liveId is required',
                code: 400
              };
            }

            const result = await this.acfunApi.live.getSummary(liveId);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'watching-list':
          if (method === 'GET') {
            let liveId = String(req.query.liveId || '').trim();
            const userIdRaw = req.query.userId as string;
            const userID = parseInt(String(userIdRaw || ''));
            if (!liveId && userID && !Number.isNaN(userID)) {
              const ui = await this.acfunApi.live.getUserLiveInfo(userID);
              if (ui && ui.success && ui.data && ui.data.liveID) {
                liveId = String(ui.data.liveID);
              }
            }
            if (!liveId) {
              return { success: false, error: 'liveId or userId is required', code: 400 };
            }
            const result = await this.acfunApi.live.getWatchingList(liveId);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'hot-lives':
          if (method === 'GET') {
            const category = req.query.category as string;
            const page = parseInt(req.query.page as string) || 1;
            const size = parseInt(req.query.size as string) || 20;

            const result = await this.acfunApi.live.getHotLives(category, page, size);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'categories':
          if (method === 'GET') {
            const result = await this.acfunApi.live.getLiveCategories();
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'user-info':
          if (method === 'GET') {
            const userID = parseInt(req.query.userID as string);
            if (!userID) {
              return {
                success: false,
                error: 'userID is required',
                code: 400
              };
            }

            const result = await this.acfunApi.live.getUserLiveInfo(userID);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'list':
          if (method === 'GET') {
            const page = parseInt(req.query.page as string) || 1;
            const pageSize = parseInt(req.query.pageSize as string) || 20;
            const result = await this.acfunApi.live.getLiveList(page, pageSize);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'channel-list':
          if (method === 'GET') {
            try {
              // 解析查询参数
              const filtersParam = req.query.filters as string;
              let filters: Array<{ filterType: number; filterId: number }> | undefined;
              
              if (filtersParam) {
                try {
                  filters = JSON.parse(filtersParam);
                  if (!Array.isArray(filters)) {
                    filters = undefined;
                  }
                } catch {
                  // 如果解析失败，忽略 filters 参数
                  filters = undefined;
                }
              }

              const count = req.query.count ? parseInt(req.query.count as string) : undefined;
              const pcursor = req.query.pcursor as string | undefined;

              const options: {
                filters?: Array<{ filterType: number; filterId: number }>;
                count?: number;
                pcursor?: string;
              } = {};

              if (filters) {
                options.filters = filters;
              }
              if (count && !Number.isNaN(count)) {
                options.count = count;
              }
              if (pcursor) {
                options.pcursor = pcursor;
              }

              const result = await this.acfunApi.live.getChannelList(options);
              return {
                success: result.success,
                data: result.data,
                error: result.error,
                code: result.success ? 200 : 400
              };
            } catch (error: any) {
              console.error('[AcfunApiProxy] Channel list error:', error);
              return {
                success: false,
                error: error.message || 'Failed to get channel list',
                code: 400
              };
            }
          }
          break;

        case 'statistics-by-days':
          if (method === 'GET') {
            const days = parseInt(req.query.days as string) || 7;
            const result = await this.acfunApi.live.getLiveStatisticsByDays(days);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'clip-permission':
          if (method === 'GET') {
            const result = await this.acfunApi.live.checkLiveClipPermission();
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          } else if (method === 'PUT') {
            const { canCut } = req.body;
            if (canCut === undefined) {
              return {
                success: false,
                error: 'canCut is required',
                code: 400
              };
            }

            const result = await this.acfunApi.live.setLiveClipPermission(canCut);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;
      }

      return {
        success: false,
        error: `Unsupported live endpoint: ${method} /${pathSegments.join('/')}`,
        code: 404
      };
    } catch (error: any) {
      console.error('[AcfunApiProxy] Live endpoint error:', error);
      return {
        success: false,
        error: error.message || 'Live endpoint error',
        code: 500
      };
    }
  }

  /**
   * 处理礼物相关端点
   */
  private async handleGiftEndpoints(method: string, pathSegments: string[], req: express.Request): Promise<ApiResponse> {
    try {
      switch (pathSegments[0]) {
        case 'all':
          if (method === 'GET') {
            const result = await this.acfunApi.gift.getAllGiftList();
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'live':
          if (method === 'GET') {
            const liveID = req.query.liveID as string;
            if (!liveID) {
              return {
                success: false,
                error: 'liveID is required',
                code: 400
              };
            }

            const result = await this.acfunApi.gift.getLiveGiftList(liveID);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;
      }

      return {
        success: false,
        error: `Unsupported gift endpoint: ${method} /${pathSegments.join('/')}`,
        code: 404
      };
    } catch (error: any) {
      console.error('[AcfunApiProxy] Gift endpoint error:', error);
      return {
        success: false,
        error: error.message || 'Gift endpoint error',
        code: 500
      };
    }
  }

  /**
   * 处理房管相关端点
   */
  private async handleManagerEndpoints(method: string, pathSegments: string[], req: express.Request): Promise<ApiResponse> {
    try {
      switch (pathSegments[0]) {
        case 'list':
          if (method === 'GET') {
            const result = await this.acfunApi.manager.getManagerList();
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'add':
          if (method === 'POST') {
            const { managerUID } = req.body;
            if (!managerUID) {
              return {
                success: false,
                error: 'managerUID is required',
                code: 400
              };
            }

            const result = await this.acfunApi.manager.addManager(managerUID);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'remove':
          if (method === 'DELETE') {
            const { managerUID } = req.body;
            if (!managerUID) {
              return {
                success: false,
                error: 'managerUID is required',
                code: 400
              };
            }

            const result = await this.acfunApi.manager.deleteManager(managerUID);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'kick-records':
          if (method === 'GET') {
            const liveId = req.query.liveId as string;
            const count = parseInt(req.query.count as string) || 20;
            const page = parseInt(req.query.page as string) || 1;

            if (!liveId) {
              return {
                success: false,
                error: 'liveId is required',
                code: 400
              };
            }

            const result = await this.acfunApi.manager.getAuthorKickRecords(liveId, count, page);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'kick':
          if (method === 'POST') {
            const { liveID, kickedUID, kickType } = req.body;
            if (!liveID || !kickedUID) {
              return {
                success: false,
                error: 'liveID and kickedUID are required',
                code: 400
              };
            }

            let result;
            if (kickType === 'manager') {
              result = await this.acfunApi.manager.managerKick(liveID, kickedUID);
            } else {
              result = await this.acfunApi.manager.authorKick(liveID, kickedUID);
            }

            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;
      }

      return {
        success: false,
        error: `Unsupported manager endpoint: ${method} /${pathSegments.join('/')}`,
        code: 404
      };
    } catch (error: any) {
      console.error('[AcfunApiProxy] Manager endpoint error:', error);
      return {
        success: false,
        error: error.message || 'Manager endpoint error',
        code: 500
      };
    }
  }

  /**
   * 处理直播回放相关端点
   */
  private async handleReplayEndpoints(method: string, pathSegments: string[], req: express.Request): Promise<ApiResponse> {
    try {
      switch (pathSegments[0]) {
        case 'info':
          if (method === 'GET') {
            const liveId = req.query.liveId as string;
            if (!liveId) {
              return {
                success: false,
                error: 'liveId is required',
                code: 400
              };
            }

            const result = await this.acfunApi.replay.getLiveReplay(liveId);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;
      }

      return {
        success: false,
        error: `Unsupported replay endpoint: ${method} /${pathSegments.join('/')}`,
        code: 404
      };
    } catch (error: any) {
      console.error('[AcfunApiProxy] Replay endpoint error:', error);
      return {
        success: false,
        error: error.message || 'Replay endpoint error',
        code: 500
      };
    }
  }

  /**
   * 处理直播预告相关端点
   */
  private async handlePreviewEndpoints(method: string, pathSegments: string[], req: express.Request): Promise<ApiResponse> {
    try {
      switch (pathSegments[0]) {
        case 'list':
          if (method === 'GET') {
            const result = await this.acfunApi.livePreview.getLivePreviewList();
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;
      }

      return {
        success: false,
        error: `Unsupported preview endpoint: ${method} /${pathSegments.join('/')}`,
        code: 404
      };
    } catch (error: any) {
      console.error('[AcfunApiProxy] Preview endpoint error:', error);
      return {
        success: false,
        error: error.message || 'Preview endpoint error',
        code: 500
      };
    }
  }

  /**
   * 处理徽章相关端点
   */
  private async handleBadgeEndpoints(method: string, pathSegments: string[], req: express.Request): Promise<ApiResponse> {
    try {
      switch (pathSegments[0]) {
        case 'detail':
          if (method === 'GET') {
            const uperID = parseInt(req.query.uperID as string);
            if (!uperID) {
              return {
                success: false,
                error: 'uperID is required',
                code: 400
              };
            }

            const result = await this.acfunApi.badge.getBadgeDetail(uperID);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'list':
          if (method === 'GET') {
            const result = await this.acfunApi.badge.getBadgeList();
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'rank':
          if (method === 'GET') {
            const uperID = parseInt(req.query.uperID as string);
            if (!uperID) {
              return {
                success: false,
                error: 'uperID is required',
                code: 400
              };
            }

            const result = await this.acfunApi.badge.getBadgeRank(uperID);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'worn':
          if (method === 'GET') {
            const userID = parseInt(req.query.userID as string);
            if (!userID) {
              return {
                success: false,
                error: 'userID is required',
                code: 400
              };
            }

            const result = await this.acfunApi.badge.getWornBadge(userID);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'wear':
          if (method === 'POST') {
            const { uperID } = req.body;
            if (!uperID) {
              return {
                success: false,
                error: 'uperID is required',
                code: 400
              };
            }

            const result = await this.acfunApi.badge.wearBadge(uperID);
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;

        case 'unwear':
          if (method === 'POST') {
            const result = await this.acfunApi.badge.unwearBadge();
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: result.success ? 200 : 400
            };
          }
          break;
      }

      return {
        success: false,
        error: `Unsupported badge endpoint: ${method} /${pathSegments.join('/')}`,
        code: 404
      };
    } catch (error: any) {
      console.error('[AcfunApiProxy] Badge endpoint error:', error);
      return {
        success: false,
        error: error.message || 'Badge endpoint error',
        code: 500
      };
    }
  }

  /**
   * 检查来源是否被允许
   */
  private isOriginAllowed(origin?: string): boolean {
    if (!origin) return true; // 允许无来源的请求（如Postman等工具）
    
    return this.config.allowedOrigins?.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    }) || false;
  }

  /**
   * 获取客户端ID（用于速率限制）
   */
  private getClientId(req: express.Request): string {
    const pluginId = req.get('X-Plugin-ID');
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return pluginId ? `plugin:${pluginId}` : `ip:${ip}`;
  }

  /**
   * 更新认证信息
   */
  public async updateAuthentication(): Promise<void> {
    await this.initializeAuthentication();
  }

  /**
   * 获取API状态
   */
  public getStatus(): { authenticated: boolean; apiReady: boolean } {
    return {
      authenticated: this.tokenManager.isAuthenticated(),
      apiReady: true
    };
  }

  /**
   * 获取TokenManager实例
   */
  public getTokenManager(): TokenManager {
    return this.tokenManager;
  }

  /**
   * 处理图片相关端点
   */
  

  /**
   * 处理EventSource相关端点
   */
  
}
