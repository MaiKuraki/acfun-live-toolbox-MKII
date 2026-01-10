import { ApiServer } from '../server/ApiServer';
import { RoomManager } from '../rooms/RoomManager';
import { DatabaseManager } from '../persistence/DatabaseManager';
import { ConfigManager } from '../config/ConfigManager';
import type { NormalizedEvent, NormalizedEventType } from '../types';
import { TokenManager } from '../server/TokenManager';
import { DataManager, type IDataManager } from '../persistence/DataManager';
import { pluginLifecycleManager } from './PluginLifecycle';
import { EventFilter, DEFAULT_FILTERS, applyFilters, getEventQualityScore } from '../events/normalize';
import { SseQueueService } from '../server/SseQueueService';
// Removed ApiRetryManager in favor of direct TokenManager usage

export interface PluginAPI {
  subscribeEvents(
    cb: (event: NormalizedEvent) => void,
    filter?: { room_id?: string; type?: NormalizedEventType }
  ): () => void;

  callAcfun(req: { method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string; body?: any }): Promise<any>;

  pluginStorage: {
    write(row: any): Promise<void>;
  };

  registerHttpRoute(
    def: { method: 'GET' | 'POST'; path: string },
    handler: Parameters<ApiServer['registerPluginRoute']>[2]
  ): void;

  // 认证API
  auth: {
    isAuthenticated(): boolean;
    getTokenInfo(): any;
    refreshToken(): Promise<any>;
  };


  // 生命周期钩子 API（插件可注册/取消注册）
  lifecycle: {
    on(
      hookName: string,
      handler: (data: any) => Promise<void> | void,
      options?: { priority?: number }
    ): string;
    off(hookId: string): boolean;
  };

  readonly pluginId: string;

  acfun: {
    user: {
      getUserInfo(userId: string): Promise<any>;
      getWalletInfo(): Promise<any>;
    };
    danmu: {
      startDanmu(liverUID: string, callback?: (event: any) => void): Promise<any>;
      stopDanmu(sessionId: string): Promise<any>;
      getLiveRoomInfo(liverUID: string): Promise<any>;
    };
    live: {
      checkLivePermission(): Promise<any>;
      getStreamUrl(liveId: string): Promise<any>;
      getStreamSettings(): Promise<any>;
      getLiveStreamStatus(): Promise<any>;
      startLiveStream(
        title: string,
        coverFile: string,
        streamName: string,
        portrait?: boolean,
        panoramic?: boolean,
        categoryID?: number,
        subCategoryID?: number
      ): Promise<any>;
      stopLiveStream(liveId: string): Promise<any>;
      updateLiveRoom(title: string, coverFile: string, liveId: string): Promise<any>;
      getLiveStatistics(liveId: string): Promise<any>;
      getSummary(liveId: string): Promise<any>;
      getHotLives(category?: string, page?: number, size?: number): Promise<any>;
      getLiveCategories(): Promise<any>;
      getUserLiveInfo(userID: number): Promise<any>;
      checkLiveClipPermission(): Promise<any>;
      setLiveClipPermission(canCut: boolean): Promise<any>;
    };
    gift: {
      getAllGiftList(): Promise<any>;
      getLiveGiftList(liveID: string): Promise<any>;
    };
    manager: {
      getManagerList(): Promise<any>;
      addManager(managerUID: string): Promise<any>;
      deleteManager(managerUID: string): Promise<any>;
      getAuthorKickRecords(liveId: string, count?: number, page?: number): Promise<any>;
      authorKick(liveID: string, kickedUID: string): Promise<any>;
      managerKick(liveID: string, kickedUID: string): Promise<any>;
    };
    replay: {
      getLiveReplay(liveId: string): Promise<any>;
    };
    livePreview: {
      getLivePreviewList(): Promise<any>;
    };
    badge: {
      getBadgeDetail(uperID: number): Promise<any>;
      getBadgeList(): Promise<any>;
      getBadgeRank(uperID: number): Promise<any>;
      getWornBadge(userID: number): Promise<any>;
      wearBadge(uperID: number): Promise<any>;
      unwearBadge(): Promise<any>;
    };
  };
}

/**
 * ApiBridge：面向插件的受控 API 实现。禁止泄露敏感信息（如 Token）。
 */
export class ApiBridge implements PluginAPI {
  public readonly pluginId: string;
  private apiServer: ApiServer;
  private roomManager: RoomManager;
  private databaseManager: DatabaseManager;
  private configManager: ConfigManager;
  private onPluginFault: (reason: string) => void;
  private acfunApi: any;
  private tokenManager: TokenManager;
  private dataManager: IDataManager;

  constructor(opts: {
    pluginId: string;
    apiServer: ApiServer;
    roomManager: RoomManager;
    databaseManager: DatabaseManager;
    configManager: ConfigManager;
    onPluginFault: (reason: string) => void;
    tokenManager?: TokenManager;
  }) {
    this.pluginId = opts.pluginId;
    this.apiServer = opts.apiServer;
    this.roomManager = opts.roomManager;
    this.databaseManager = opts.databaseManager;
    this.configManager = opts.configManager;
    this.onPluginFault = opts.onPluginFault;
    this.tokenManager = opts.tokenManager || TokenManager.getInstance();
    this.dataManager = DataManager.getInstance();
    
    // 使用TokenManager提供的统一API实例
    this.acfunApi = this.tokenManager.getApiInstance();
    
    // 初始化认证（如果需要）
    this.initializeAuthentication();
  }

  /**
   * 初始化认证
   */
  private async initializeAuthentication(): Promise<void> {
    try {
      // TokenManager已经处理了API实例的认证状态
      // 这里只需要检查是否已认证
      if (this.tokenManager.isAuthenticated()) {
        console.log(`[ApiBridge] Plugin ${this.pluginId} initialized with authenticated API instance`);
      } else {
        console.warn(`[ApiBridge] Plugin ${this.pluginId} initialized without authentication`);
      }
    } catch (error) {
      console.warn('[ApiBridge] Failed to initialize authentication:', error);
    }
  }

  /**
   * 规范化钩子名称，支持别名映射
   */
  private normalizeHookName(hookName: string): import('./PluginLifecycle').LifecycleHook {
    const map: Record<string, import('./PluginLifecycle').LifecycleHook> = {
      // 别名 → 实际钩子（与现有生命周期类型保持一致）
      'plugin.beforeStart': 'afterLoaded',
      'plugin.afterStart': 'afterLoaded',
      'plugin.beforeClose': 'beforeUnloaded',
      'plugin.afterClose': 'beforeUnloaded',
      // 页面钩子直接透传（这些已在 LifecycleHook 中定义）
      'beforeUiOpen': 'beforeUiOpen',
      'afterUiOpen': 'afterUiOpen',
      'uiClosed': 'uiClosed',
      'beforeWindowOpen': 'beforeWindowOpen',
      'afterWindowOpen': 'afterWindowOpen',
      'windowClosed': 'windowClosed',
      'beforeOverlayOpen': 'beforeOverlayOpen',
      'afterOverlayOpen': 'afterOverlayOpen',
      'overlayClosed': 'overlayClosed'
    } as const;
    return (map[hookName] || hookName) as import('./PluginLifecycle').LifecycleHook;
  }

  /**
   * 订阅标准化事件，可选过滤；返回取消订阅函数。
   */
  subscribeEvents(
    cb: (event: NormalizedEvent) => void,
    filter?: { 
      room_id?: string; 
      type?: NormalizedEventType;
      user_id?: string;
      min_quality_score?: number;
      custom_filters?: string[];
      rate_limit?: {
        max_events_per_second?: number;
        max_events_per_minute?: number;
      };
    }
  ): () => void {
    // 事件速率限制状态
    let eventCount = 0;
    let lastResetTime = Date.now();
    let eventHistory: number[] = [];
    
    const listener = (event: NormalizedEvent) => {
      try {
        // 事件速率限制检查
        if (filter?.rate_limit) {
          const now = Date.now();
          
          // 每秒限制检查
          if (filter.rate_limit.max_events_per_second) {
            if (now - lastResetTime >= 1000) {
              eventCount = 0;
              lastResetTime = now;
            }
            
            if (eventCount >= filter.rate_limit.max_events_per_second) {
              console.warn(`[ApiBridge] Event rate limit exceeded for plugin ${this.pluginId}: ${eventCount} events/second`);
              this.onPluginFault('event-rate-limit-exceeded');
              return;
            }
            eventCount++;
          }
          
          // 每分钟限制检查
          if (filter.rate_limit.max_events_per_minute) {
            // 清理超过1分钟的历史记录
            eventHistory = eventHistory.filter(time => now - time < 60000);
            
            if (eventHistory.length >= filter.rate_limit.max_events_per_minute) {
              console.warn(`[ApiBridge] Event rate limit exceeded for plugin ${this.pluginId}: ${eventHistory.length} events/minute`);
              this.onPluginFault('event-rate-limit-exceeded');
              return;
            }
            eventHistory.push(now);
          }
        }
        
        // 事件数据验证
        if (!this.validateEvent(event)) {
          console.warn(`[ApiBridge] Invalid event data received for plugin ${this.pluginId}:`, event);
          this.onPluginFault('invalid-event-data');
          return;
        }
        
        // 基本过滤
        if (filter?.room_id && event.room_id !== filter.room_id) return;
        if (filter?.type && event.event_type !== filter.type) return;
        if (filter?.user_id && event.user_id !== filter.user_id) return;
        
        // 质量分数过滤
        if (filter?.min_quality_score) {
          const qualityScore = getEventQualityScore(event);
          if (qualityScore < filter.min_quality_score) return;
        }
        
        // 自定义过滤器
        if (filter?.custom_filters && filter.custom_filters.length > 0) {
          const availableFilters = DEFAULT_FILTERS.filter((f: EventFilter) => 
            filter.custom_filters!.includes(f.name)
          );
          const filterResult = applyFilters(event, availableFilters);
          if (!filterResult.passed) return;
        }
        
        // 安全地调用插件回调
        this.safePluginCallback(() => cb(event));
      } catch (err: any) {
        // 插件抛错不影响主进程，进行熔断计数（简化为直接通知）
        console.error(`[ApiBridge] Error in event handler for plugin ${this.pluginId}:`, err);
        this.onPluginFault('event-handler-error');
      }
    };
    
    this.roomManager.on('event', listener as any);
    return () => this.roomManager.off('event', listener as any);
  }

  /**
   * 生命周期钩子 API 暴露给插件
   */
  public lifecycle = {
    on: (
      hookName: string,
      handler: (data: any) => Promise<void> | void,
      options?: { priority?: number }
    ): string => {
      const normalized = this.normalizeHookName(hookName);
      return pluginLifecycleManager.registerHook(normalized, async (payload) => {
        // 限定只触发对应插件的钩子（若注册自插件）
        if (payload.pluginId && payload.pluginId !== this.pluginId) return;
        await handler(payload);
      }, { priority: options?.priority, pluginId: this.pluginId });
    },
    off: (hookId: string): boolean => {
      return pluginLifecycleManager.unregisterHook(hookId);
    }
  };

  /**
   * 验证事件数据的完整性和有效性
   */
  private validateEvent(event: NormalizedEvent): boolean {
    // 基本字段验证
    if (!event || typeof event !== 'object') return false;
    if (!event.event_type || typeof event.event_type !== 'string') return false;
    if (!event.ts || typeof event.ts !== 'number') return false;
    if (!event.room_id || typeof event.room_id !== 'string') return false;
    
    // 时间戳合理性检查（不能是未来时间，不能太久以前）
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    if (event.ts > now + 60000 || event.ts < now - maxAge) {
      return false;
    }
    
    // 根据事件类型进行特定验证
    switch (event.event_type) {
      case 'danmaku':
        return this.validateCommentEvent(event);
      case 'gift':
        return this.validateGiftEvent(event);
      case 'enter':
      case 'follow':
      case 'like':
        return this.validateUserEvent(event);
      default:
        return true; // 未知事件类型，允许通过
    }
  }

  /**
   * 验证评论事件
   */
  private validateCommentEvent(event: NormalizedEvent): boolean {
    if (!event.content || typeof event.content !== 'string') return false;
    if (!event.user_id || typeof event.user_id !== 'string') return false;
    if (!event.user_name || typeof event.user_name !== 'string') return false;
    
    // 内容长度检查
    if (event.content.length > 1000) return false;
    
    return true;
  }

  /**
   * 验证礼物事件
   */
  private validateGiftEvent(event: NormalizedEvent): boolean {
    if (!event.user_id || typeof event.user_id !== 'string') return false;
    if (!event.user_name || typeof event.user_name !== 'string') return false;
    // 礼物事件的具体礼物信息来自 raw，不在标准化事件合同中；此处仅做基本校验
    // 若需要更严格校验，应由上游解析器在 raw 中提供结构化数据
    if (event.content && typeof event.content !== 'string') return false;
    return true;
  }

  /**
   * 验证用户事件
   */
  private validateUserEvent(event: NormalizedEvent): boolean {
    if (!event.user_id || typeof event.user_id !== 'string') return false;
    if (!event.user_name || typeof event.user_name !== 'string') return false;
    
    return true;
  }

  /**
   * 安全地调用插件回调函数
   */
  private safePluginCallback(callback: () => void): void {
    try {
      // 使用 setTimeout 确保异步执行，避免阻塞主线程
      setTimeout(callback, 0);
    } catch (error) {
      console.error(`[ApiBridge] Plugin callback error for ${this.pluginId}:`, error);
      this.onPluginFault('callback-execution-error');
    }
  }

  public sendRender(event: string, payload?: any): void {
    try {
      const channel = `plugin:${this.pluginId}:overlay`;
      SseQueueService.getInstance().queueOrPublish(channel, { event: String(event), payload }, { ttlMs: 2 * 60 * 1000, persist: false, meta: { kind: 'mainMessage' } });
    } catch {}
  }

  // onMessage 已废除，请使用 onUiMessage 或 onMainMessage

  /**
   * 代表插件调用 AcFun API。使用 acfunlive-http-api 进行统一的 API 调用。
   */
  async callAcfun(req: { method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string; body?: any }): Promise<any> {
    // 确保认证状态有效
    await this.ensureValidAuthentication();

    try {
      
      const httpClient = this.acfunApi.getHttpClient();
      let response;

      switch (req.method) {
        case 'GET':
          response = await httpClient.get(req.path);
          break;
        case 'POST':
          response = await httpClient.post(req.path, req.body);
          break;
        case 'PUT':
          response = await httpClient.put(req.path, req.body);
          break;
        case 'DELETE':
          response = await httpClient.delete(req.path);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${req.method}`);
      }

      if (!response.success) {
        // 检查是否是认证错误
        if (response.error && (response.error.includes('401') || response.error.includes('unauthorized'))) {
          // 由于无法自动刷新令牌，清除过期令牌并抛出错误
          console.warn('[ApiBridge] Authentication failed, clearing expired token');
          await this.tokenManager.logout();
          const err = new Error('ACFUN_TOKEN_EXPIRED');
          this.onPluginFault('token-expired');
          throw err;
        }
        
        const err = new Error(`ACFUN_API_ERROR: ${response.error || 'Unknown error'}`);
        this.onPluginFault('acfun-api-error');
        throw err;
      }

      return response.data;
    } catch (error: any) {
      const err = new Error(`ACFUN_API_ERROR: ${error.message || 'Unknown error'}`);
      this.onPluginFault('acfun-api-error');
      throw err;
    }
  }

  /**
   * 确保认证状态有效
   */
  private async ensureValidAuthentication(): Promise<void> {
    try {
      if (!this.tokenManager.isAuthenticated()) {
        const err = new Error('ACFUN_NOT_LOGGED_IN');
        this.onPluginFault('missing-token');
        throw err;
      }

      const tokenInfo = await this.tokenManager.getTokenInfo();
      if (!tokenInfo || !tokenInfo.isValid) {
        // 令牌无效或过期，尝试刷新
        console.warn('[ApiBridge] Token invalid or expired, attempting refresh');
        const refreshResult = await this.tokenManager.refreshToken();
        if (!refreshResult.success) {
          const err = new Error('ACFUN_TOKEN_REFRESH_FAILED');
          this.onPluginFault('token-refresh-failed');
          throw err;
        }
      }

      // TokenManager已经确保API实例使用最新的认证状态
      console.log(`[ApiBridge] Authentication validated for plugin ${this.pluginId}`);
    } catch (error) {
      console.error('[ApiBridge] Authentication validation failed:', error);
      throw error;
    }
  }

  private async invokeAcfun<T>(call: () => Promise<any>): Promise<T> {
    await this.ensureValidAuthentication();

    const result = await call();
    if (!result?.success) {
      if (result?.error && (result.error.includes('401') || result.error.includes('unauthorized'))) {
        await this.tokenManager.logout();
        const err = new Error('ACFUN_TOKEN_EXPIRED');
        this.onPluginFault('token-expired');
        throw err;
      }

      const err = new Error(`ACFUN_API_ERROR: ${result?.error || 'Unknown error'}`);
      this.onPluginFault('acfun-api-error');
      throw err;
    }
    return result?.data as T;
  }

  /**
   * 插件存储：写入统一的 plugin_storage 表。
   */
  async pluginStorageWrite(row: any): Promise<void> {
    await this.pluginStorage.write(row);
  }

  public pluginStorage = {
    write: async (row: any): Promise<void> => {
      const db = this.databaseManager.getDb();
      const tableName = `plugin_storage`;

      // 建表（若不存在），包含 id/plugin_id/createTime/data
      await new Promise<void>((resolve, reject) => {
        db.run(
          `CREATE TABLE IF NOT EXISTS ${tableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plugin_id TEXT NOT NULL,
            createTime INTEGER NOT NULL,
            data TEXT NOT NULL
          )`,
          (err) => (err ? reject(err) : resolve())
        );
      });

      // 插入 JSON 数据
      await new Promise<void>((resolve, reject) => {
        db.run(
          `INSERT INTO ${tableName} (plugin_id, createTime, data) VALUES (?, ?, ?)`,
          [this.pluginId, Date.now(), JSON.stringify(row ?? {})],
          (err) => (err ? reject(err) : resolve())
        );
      });
    },
    read: async (queryText?: string, size?: number): Promise<{ id: number; plugin_id: string; createTime: number; data: any }[]> => {
      const db = this.databaseManager.getDb();
      const tableName = `plugin_storage`;
      const limit = Math.max(0, Number(size ?? 100));
      const q = (queryText || '').trim();
      const where: string[] = ['plugin_id = ?'];
      const params: any[] = [this.pluginId];
      if (q) { where.push('data LIKE ?'); params.push(`%${q.replace(/%/g, '')}%`); }
      const sql = `SELECT id, plugin_id, createTime, data FROM ${tableName} WHERE ${where.join(' AND ')} ORDER BY id DESC ${limit > 0 ? 'LIMIT ' + limit : ''}`;
      const rows: any[] = await new Promise((resolve, reject) => { db.all(sql, params, (err, rs) => (err ? reject(err) : resolve(rs || []))); });
      return rows.map((r) => ({ id: Number(r.id), plugin_id: String(r.plugin_id), createTime: Number(r.createTime), data: safeJsonParse(r.data) }));
      function safeJsonParse(text: string): any { try { return JSON.parse(String(text || '{}')); } catch { return {}; } }
    },
    size: async (): Promise<number> => {
      const db = this.databaseManager.getDb();
      const tableName = `plugin_storage`;
      const sql = `SELECT COUNT(*) AS c FROM ${tableName} WHERE plugin_id = ?`;
      const row: any = await new Promise((resolve, reject) => { db.get(sql, [this.pluginId], (err, r) => (err ? reject(err) : resolve(r))); });
      return Number((row && (row.c || (row['COUNT(*)'] as any))) || 0);
    },
    remove: async (ids: number[]): Promise<number> => {
      const db = this.databaseManager.getDb();
      const tableName = `plugin_storage`;
      const list = Array.isArray(ids) ? ids.filter((x) => Number.isFinite(x)).map((x) => Number(x)) : [];
      if (list.length === 0) return 0;
      const placeholders = list.map(() => '?').join(',');
      const sql = `DELETE FROM ${tableName} WHERE plugin_id = ? AND id IN (${placeholders})`;
      const params = [this.pluginId, ...list];
      const changes: number = await new Promise((resolve, reject) => {
        db.run(sql, params, function (this: any, err: any) { if (err) reject(err); else resolve(Number(this?.changes ?? 0)); });
      });
      return changes;
    }
  };

  /**
   * 路由注册：强制前缀 `/plugins/:id/*`，由主进程统一挂载。
   */
  registerHttpRoute(
    def: { method: 'GET' | 'POST'; path: string },
    handler: Parameters<ApiServer['registerPluginRoute']>[2]
  ): void {
    this.apiServer.registerPluginRoute(this.pluginId, def, handler);
  }

  /**
   * 认证API实现
   */
  public auth = {
    isAuthenticated: (): boolean => {
      return this.tokenManager.isAuthenticated();
    },

    getTokenInfo: (): any => {
      return this.tokenManager.getTokenInfo();
    },

    refreshToken: async (): Promise<any> => {
      return this.tokenManager.refreshToken();
    }
  };

  

  public acfun = {
    user: {
      getUserInfo: async (userId: string) => {
        return this.invokeAcfun(() => this.acfunApi.user.getUserInfo(userId));
      },
      getWalletInfo: async () => {
        return this.invokeAcfun(() => this.acfunApi.user.getWalletInfo());
      }
    },
    danmu: {
      startDanmu: async (liverUID: string, callback?: (event: any) => void) => {
        const db = this.databaseManager.getDb();
        const writer = new (require('../persistence/DanmuSQLiteWriter').DanmuSQLiteWriter)(db);
        let currentSessionId: string | null = null;
        let currentLiveId: string | null = null;
        const cb = (e: any) => {
          try {
            if (!currentLiveId && currentSessionId && this.acfunApi?.danmu) {
              const detail = this.acfunApi.danmu.getSessionDetail(currentSessionId);
              if (detail && detail.success && (detail as any).data) {
                currentLiveId = String((detail as any).data.liveID || '');
              }
            }
            if (currentLiveId) {
              writer.handleEvent(String(currentLiveId), e);
            }
          } catch {}
          try { if (typeof callback === 'function') callback(e); } catch {}
        };
        const res = await this.invokeAcfun(() => this.acfunApi.danmu.startDanmu(liverUID, cb));
        try {
          if (res && (res as any).success && (res as any).data) {
            currentSessionId = String((res as any).data.sessionId || '');
            if (currentSessionId && this.acfunApi?.danmu) {
              const detail = this.acfunApi.danmu.getSessionDetail(currentSessionId);
              if (detail && detail.success && (detail as any).data) {
                currentLiveId = String((detail as any).data.liveID || '');
              }
            }
          }
        } catch {}
        return res;
      },
      stopDanmu: async (sessionId: string) => {
        return this.invokeAcfun(() => this.acfunApi.danmu.stopDanmu(sessionId));
      },
      getLiveRoomInfo: async (liverUID: string) => {
        return this.invokeAcfun(() => this.acfunApi.danmu.getLiveRoomInfo(liverUID));
      }
    },
    live: {
      checkLivePermission: async () => {
        return this.invokeAcfun(() => this.acfunApi.live.checkLivePermission());
      },
      getStreamUrl: async (liveId: string) => {
        return this.invokeAcfun(() => this.acfunApi.live.getStreamUrl(liveId));
      },
      getStreamSettings: async () => {
        return this.invokeAcfun(() => this.acfunApi.live.getStreamSettings());
      },
      getLiveStreamStatus: async () => {
        return this.invokeAcfun(() => this.acfunApi.live.getLiveStreamStatus());
      },
      startLiveStream: async (
        title: string,
        coverFile: string,
        streamName: string,
        portrait?: boolean,
        panoramic?: boolean,
        categoryID?: number,
        subCategoryID?: number
      ) => {
        return this.invokeAcfun(() =>
          this.acfunApi.live.startLiveStream(
            title,
            coverFile || '',
            streamName,
            !!portrait,
            !!panoramic,
            categoryID as number,
            subCategoryID as number
          )
        );
      },
      stopLiveStream: async (liveId: string) => {
        return this.invokeAcfun(() => this.acfunApi.live.stopLiveStream(liveId));
      },
      updateLiveRoom: async (title: string, coverFile: string, liveId: string) => {
        return this.invokeAcfun(() => this.acfunApi.live.updateLiveRoom(title, coverFile || '', liveId));
      },
      getLiveStatistics: async (liveId: string) => {
        return this.invokeAcfun(() => this.acfunApi.live.getLiveStatistics(liveId));
      },
      getSummary: async (liveId: string) => {
        return this.invokeAcfun(() => this.acfunApi.live.getSummary(liveId));
      },
      getHotLives: async (category?: string, page?: number, size?: number) => {
        return this.invokeAcfun(() => this.acfunApi.live.getHotLives(category, page || 1, size || 20));
      },
      getLiveCategories: async () => {
        return this.invokeAcfun(() => this.acfunApi.live.getLiveCategories());
      },
      getUserLiveInfo: async (userID: number) => {
        return this.invokeAcfun(() => this.acfunApi.live.getUserLiveInfo(userID));
      },
      checkLiveClipPermission: async () => {
        return this.invokeAcfun(() => this.acfunApi.live.checkLiveClipPermission());
      },
      setLiveClipPermission: async (canCut: boolean) => {
        return this.invokeAcfun(() => this.acfunApi.live.setLiveClipPermission(!!canCut));
      }
    },
    gift: {
      getAllGiftList: async () => {
        return this.invokeAcfun(() => this.acfunApi.gift.getAllGiftList());
      },
      getLiveGiftList: async (liveID: string) => {
        return this.invokeAcfun(() => this.acfunApi.gift.getLiveGiftList(liveID));
      }
    },
    manager: {
      getManagerList: async () => {
        return this.invokeAcfun(() => this.acfunApi.manager.getManagerList());
      },
      addManager: async (managerUID: string) => {
        return this.invokeAcfun(() => this.acfunApi.manager.addManager(managerUID));
      },
      deleteManager: async (managerUID: string) => {
        return this.invokeAcfun(() => this.acfunApi.manager.deleteManager(managerUID));
      },
      getAuthorKickRecords: async (liveId: string, count?: number, page?: number) => {
        return this.invokeAcfun(() => this.acfunApi.manager.getAuthorKickRecords(liveId, count || 20, page || 1));
      },
      authorKick: async (liveID: string, kickedUID: string) => {
        return this.invokeAcfun(() => this.acfunApi.manager.authorKick(liveID, kickedUID));
      },
      managerKick: async (liveID: string, kickedUID: string) => {
        return this.invokeAcfun(() => this.acfunApi.manager.managerKick(liveID, kickedUID));
      }
    },
    replay: {
      getLiveReplay: async (liveId: string) => {
        return this.invokeAcfun(() => this.acfunApi.replay.getLiveReplay(liveId));
      }
    },
    livePreview: {
      getLivePreviewList: async () => {
        return this.invokeAcfun(() => this.acfunApi.livePreview.getLivePreviewList());
      }
    },
    badge: {
      getBadgeDetail: async (uperID: number) => {
        return this.invokeAcfun(() => this.acfunApi.badge.getBadgeDetail(uperID));
      },
      getBadgeList: async () => {
        return this.invokeAcfun(() => this.acfunApi.badge.getBadgeList());
      },
      getBadgeRank: async (uperID: number) => {
        return this.invokeAcfun(() => this.acfunApi.badge.getBadgeRank(uperID));
      },
      getWornBadge: async (userID: number) => {
        return this.invokeAcfun(() => this.acfunApi.badge.getWornBadge(userID));
      },
      wearBadge: async (uperID: number) => {
        return this.invokeAcfun(() => this.acfunApi.badge.wearBadge(uperID));
      },
      unwearBadge: async () => {
        return this.invokeAcfun(() => this.acfunApi.badge.unwearBadge());
      }
    }
  };
}
