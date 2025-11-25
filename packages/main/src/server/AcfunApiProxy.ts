import express from 'express';
import { DataManager } from '../persistence/DataManager';
import { IPluginManager } from '../types/contracts';
import { EventSourceService } from 'acfunlive-http-api/dist/services/EventSourceService';
import { ImageService } from 'acfunlive-http-api/dist/services/ImageService';
import { HttpClient } from 'acfunlive-http-api/dist/core/HttpClient';
import { TokenManager } from './TokenManager';
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
  private eventSourceService: EventSourceService;
  private imageService: ImageService;
  private httpClient: HttpClient;
  private databaseManager?: DatabaseManager;
  private pluginManager?: IPluginManager;
  private dataManager = DataManager.getInstance();

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
    this.httpClient = new HttpClient({
      timeout: 30000,
      retryCount: 3,
      baseUrl: 'https://api-plus.acfun.cn',
      headers: {
        'User-Agent': 'AcFun Live Toolbox'
      }
    });
    this.eventSourceService = new EventSourceService(this.httpClient);
    this.imageService = new ImageService(this.httpClient);
    this.databaseManager = databaseManager;

    this.initializeAuthentication();
  }

  public setPluginManager(pm: IPluginManager): void {
    this.pluginManager = pm;
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
    if (pathSegments[0] === 'eventsource') {
      return await this.handleEventSourceEndpoints(method, pathSegments.slice(1), req);
    }

    // 图片相关端点
    if (pathSegments[0] === 'image') {
      return await this.handleImageEndpoints(method, pathSegments.slice(1), req);
    }

    return null; // 未匹配到特定端点，使用通用代理
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
            const danmuCallback = (event: any) => {
              if (writer) {
                writer.handleEvent(String(liverUID), event).catch(err => { try { console.warn('[AcfunApiProxy] persist error:', err); } catch {} });
              }
              try { console.log('[AcfunApiProxy] Danmu event:', event); } catch {}
            };

            const result = await this.acfunApi.danmu.startDanmu(liverUID, danmuCallback);
            if (result && result.success) {
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
                    room_id, streamer_name, streamer_user_id,
                    title, cover_url, status, is_live,
                    viewer_count, online_count, like_count, live_cover,
                    category_id, category_name, sub_category_id, sub_category_name,
                    updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
            const tokenInfo = this.acfunApi.httpClient.getValidatedTokenInfo();
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
              const tokenInfo = this.acfunApi.httpClient.getValidatedTokenInfo();
              if (!tokenInfo.tokenInfo) {
                console.warn('[AcfunApiProxy][stream-status] token invalid');
                return {
                  success: false,
                  error: '未登录或token无效',
                  code: 401
                };
              }
              try {
                const cookiesCount = Array.isArray(tokenInfo.tokenInfo.cookies) ? tokenInfo.tokenInfo.cookies.length : 0;
                console.debug('[AcfunApiProxy][stream-status] token ok', {
                  userID: tokenInfo.tokenInfo.userID,
                  deviceID: tokenInfo.tokenInfo.deviceID,
                  cookiesCount
                });
              } catch {}
              
            const result = await this.acfunApi.live.getLiveStreamStatus();
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
            try {
              if (result && result.success && this.databaseManager) {
                const tokenInfo = this.acfunApi.httpClient.getValidatedTokenInfo();
                const roomId = tokenInfo?.tokenInfo?.userID ? String(tokenInfo.tokenInfo.userID) : undefined;
                if (roomId) {
                  const db = this.databaseManager.getDb();
                const stmt = db.prepare(`
                    INSERT INTO rooms_meta (
                      room_id, streamer_name, streamer_user_id,
                      title, cover_url, status, is_live,
                      viewer_count, online_count, like_count, live_cover,
                      category_id, category_name, sub_category_id, sub_category_name,
                      updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                  `);
                  const data: any = result.data || {};
                  const status = data.liveID ? 'open' : 'closed';
                  const isLive = data.liveID ? 1 : 0;
                  stmt.run(
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
            } catch {}
            const err = result.error || '';
            if (!result.success) {
              // 认证错误 → 401
              if (err.includes('cookies') || err.includes('token') || err.includes('unauthorized')) {
                return { success: false, error: result.error, data: null, code: 401 };
              }
              // 未开播错误 → 归一为 success:true + 默认对象
              const maybeJson = (() => {
                try {
                  const m = err.match(/\{[^]*\}/);
                  if (m && m[0]) return JSON.parse(m[0]);
                } catch {}
                return null;
              })();
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
                };
              }
            }
            return {
              success: result.success,
              data: result.data,
              error: result.error,
              code: 200
            };
            } catch (error: any) {
              console.error('[AcfunApiProxy] Stream status error:', error);
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
              const tokenInfo = this.acfunApi.httpClient.getValidatedTokenInfo();
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
              this.broadcast('room', 'live-start', { title, streamName, ts: Date.now(), liveId: (result.data as any)?.liveID });
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
  private async handleImageEndpoints(method: string, pathSegments: string[], req: express.Request): Promise<ApiResponse | null> {
    if (method === 'POST' && pathSegments[0] === 'upload') {
      const { imageFile } = req.body;
      if (!imageFile) {
        return {
          success: false,
          error: 'Missing imageFile parameter',
          data: null
        };
      }

      try {
        const result = await this.imageService.uploadImage(imageFile);
        return {
          success: result.success,
          data: result.data,
          error: result.success ? undefined : result.error
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: null
        };
      }
    }

    return null;
  }

  /**
   * 处理EventSource相关端点
   */
  private async handleEventSourceEndpoints(method: string, pathSegments: string[], req: express.Request): Promise<ApiResponse | null> {
    if (method === 'POST' && pathSegments[0] === 'connect') {
      const { liverUID, eventTypes } = req.body;
      if (!liverUID) {
        return {
          success: false,
          error: 'Missing liverUID parameter',
          data: null
        };
      }

      try {
        const eventSource = this.eventSourceService.connectToLiveEvents({
          liverUID,
          eventTypes,
          onMessage: (event: MessageEvent) => {
            // 这里可以添加消息处理逻辑
            console.log('EventSource message:', event);
          },
          onError: (event: Event) => {
            console.error('EventSource error:', event);
          },
          onOpen: (event: Event) => {
            console.log('EventSource opened:', event);
          }
        });

        return {
          success: true,
          data: { message: 'EventSource created successfully' },
          error: undefined
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: null
        };
      }
    }

    if (method === 'POST' && pathSegments[0] === 'disconnect') {
      try {
        this.eventSourceService.disconnect();
        return {
          success: true,
          data: { message: 'EventSource disconnected successfully' },
          error: undefined
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: null
        };
      }
    }

    return null;
  }
}