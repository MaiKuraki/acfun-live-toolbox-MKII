import { EventEmitter } from 'events';
import { AcFunLiveApi, ApiConfig, DanmuMessage as StandardDanmuMessage, UserInfo, ManagerType } from 'acfunlive-http-api';
// AuthManager removed; use TokenManager directly
import { TokenManager } from '../server/TokenManager';
import { NormalizedEvent, NormalizedEventType, RoomStatus } from '../types';
import { ensureNormalized } from '../events/normalize';
import { AcfunApiConnectionPool } from './ConnectionPoolManager';
import { ConnectionErrorHandler } from './ConnectionErrorHandler';

/**
 * 弹幕消息接口（扩展标准接口）
 * 基于 acfunlive-http-api 的标准 DanmuMessage 接口
 */
export interface DanmuMessage extends StandardDanmuMessage {
  /** 消息类型 */
  type: 'comment' | 'gift' | 'like' | 'enter' | 'follow' | 'throwBanana' | 'joinClub' | 'shareLive';
  /** 房间ID */
  roomId: string;
}

/**
 * 连接状态枚举
 * 定义适配器的各种连接状态
 */
export enum ConnectionState {
  /** 已断开连接 */
  DISCONNECTED = 'DISCONNECTED',
  /** 连接中 */
  CONNECTING = 'CONNECTING',
  /** 已连接 */
  CONNECTED = 'CONNECTED',
  /** 重连中 */
  RECONNECTING = 'RECONNECTING',
  /** 连接失败 */
  FAILED = 'FAILED'
}

/**
 * 适配器配置接口
 * 定义 AcfunAdapter 的配置选项
 */
export interface AdapterConfig {
  /** 房间ID */
  roomId: string;
  /** 是否自动重连 */
  autoReconnect: boolean;
  /** 重连间隔（毫秒） */
  reconnectInterval: number;
  /** 最大重连次数 */
  maxReconnectAttempts: number;
  /** 连接超时时间（毫秒） */
  connectionTimeout: number;
  /** 心跳间隔（毫秒） */
  heartbeatInterval: number;
  /** 是否启用调试模式 */
  debug: boolean;
  /** API配置 */
  apiConfig?: Partial<ApiConfig>;
}

/**
 * 适配器事件接口
 * 定义适配器可以触发的所有事件类型
 */
export interface AdapterEvents {
  /** 连接状态变化事件 */
  'connection-state-changed': (state: ConnectionState, previousState: ConnectionState) => void;
  /** 弹幕消息事件 */
  'danmu': (message: DanmuMessage) => void;
  /** 礼物消息事件 */
  'gift': (message: DanmuMessage) => void;
  /** 点赞消息事件 */
  'like': (message: DanmuMessage) => void;
  /** 用户进入房间事件 */
  'enter': (message: DanmuMessage) => void;
  /** 用户关注事件 */
  'follow': (message: DanmuMessage) => void;
  /** 连接错误事件 */
  'error': (error: Error) => void;
  /** 重连事件 */
  'reconnect': (attempt: number) => void;
  /** 认证成功事件 */
  'authenticated': () => void;
  /** 认证失败事件 */
  'auth-failed': (error: Error) => void;
}

/**
 * AcFun 直播适配器类
 * 
 * 这是一个高级适配器，封装了与 AcFun 直播平台的交互逻辑，提供以下功能：
 * - 自动认证管理
 * - 连接池管理
 * - 弹幕消息处理
 * - 自动重连机制
 * - 错误处理和恢复
 * - 性能监控
 * 
 * 主要特性：
 * - 使用连接池提高性能和资源利用率
 * - 集成认证管理器处理登录状态
 * - 支持多种消息类型（弹幕、礼物、点赞等）
 * - 提供详细的事件系统用于状态监控
 * - 自动处理网络异常和重连逻辑
 * 
 * @extends EventEmitter
 * @emits connection-state-changed - 连接状态变化时触发
 * @emits danmu - 收到弹幕消息时触发
 * @emits gift - 收到礼物消息时触发
 * @emits like - 收到点赞消息时触发
 * @emits enter - 用户进入房间时触发
 * @emits follow - 用户关注时触发
 * @emits error - 发生错误时触发
 * @emits reconnect - 重连时触发
 * @emits authenticated - 认证成功时触发
 * @emits auth-failed - 认证失败时触发
 */
export class AcfunAdapter extends EventEmitter {
  /** 适配器配置 */
  private config: AdapterConfig;
  /** 当前连接状态 */
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  /** AcFun Live API 实例 */
  private api: AcFunLiveApi | null = null;
  /** Token管理器 */
  private tokenManager: TokenManager;
  /** 连接池管理器 */
  private connectionPool: AcfunApiConnectionPool;
  /** 连接错误处理器 */
  private connectionErrorHandler: ConnectionErrorHandler;
  /** 重连定时器 */
  private reconnectTimer: NodeJS.Timeout | null = null;
  /** 心跳定时器 */
  private heartbeatTimer: NodeJS.Timeout | null = null;
  /** 重连尝试次数 */
  private reconnectAttempts: number = 0;
  /** 是否正在连接中 */
  private isConnecting: boolean = false;
  /** 是否已销毁 */
  private isdestroyed: boolean = false;
  /** 弹幕会话ID */
  private danmuSessionId: string | null = null;
  /** 当前直播场次ID */
  private currentLiveId: string | null = null;
  private currentStreamInfo: any | null = null;
  /** 消息处理器映射 */
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  /**
   * 构造函数
   * @param config 适配器配置
   * @param connectionPool 连接池管理器（可选）
   */
  constructor(
    config: Partial<AdapterConfig> = {},
    connectionPool?: AcfunApiConnectionPool
  ) {
    super();

    // 合并默认配置和用户配置
    this.config = {
      roomId: '',
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      connectionTimeout: 30000,
      heartbeatInterval: 30000,
      debug: false,
      apiConfig: {
        timeout: 30000,
        retryCount: 3,
        baseUrl: 'https://api-new.acfunchina.com',
        headers: {
          'User-Agent': 'AcFun-Live-Toolbox/2.0'
        }
      },
      ...config
    };

    // 初始化依赖组件
    this.tokenManager = TokenManager.getInstance();
    this.connectionPool = connectionPool || new AcfunApiConnectionPool();
    this.connectionErrorHandler = new ConnectionErrorHandler();

    // 使用TokenManager提供的统一API实例
    this.api = this.tokenManager.getApiInstance();

    // 设置事件监听器
    this.setupEventListeners();
    
    // 初始化消息处理器
    this.initializeMessageHandlers();

    if (this.config.debug) {
      console.log('[AcfunAdapter] Initialized with config:', this.config);
    }
  }

  /**
   * 设置事件监听器
   * 配置各个组件之间的事件通信
   * @private
   */
  private setupEventListeners(): void {
    // TokenManager 事件
    this.tokenManager.on('loginSuccess', () => {
      this.emit('authenticated');
      if (this.config.debug) {
        console.log('[AcfunAdapter] Authentication successful');
      }
    });

    this.tokenManager.on('loginFailed', (error: Error) => {
      this.emit('auth-failed', error);
      this.handleConnectionError(error);
    });

    this.tokenManager.on('tokenExpiring', () => {
      if (this.config.debug) {
        console.log('[AcfunAdapter] Token expiring, refreshing...');
      }
    });

    // 已移除 ApiRetryManager 事件；重试由 acfunlive-http-api 处理

    // 连接错误处理器事件
    this.connectionErrorHandler.on('connectionLost', () => {
      this.setConnectionState(ConnectionState.DISCONNECTED);
      if (this.config.autoReconnect && !this.isdestroyed) {
        this.scheduleReconnect();
      }
    });

    this.connectionErrorHandler.on('connectionRecovered', () => {
      this.reconnectAttempts = 0;
      this.setConnectionState(ConnectionState.CONNECTED);
    });
  }

  /**
   * 初始化消息处理器
   * 设置不同类型消息的处理函数
   * @private
   */
  private initializeMessageHandlers(): void {
    // 弹幕消息处理器
    this.messageHandlers.set('danmu', (data: any) => {
      const message: DanmuMessage = {
        sendTime: data.timestamp || Date.now(),
        userInfo: {
          userID: Number(data.userId) || 0,
          nickname: data.nickname || '',
          avatar: data.avatar || '',
          medal: { uperID: 0, userID: Number(data.userId) || 0, clubName: '', level: 0 },
          managerType: ManagerType.NotManager
        },
        type: 'comment',
        roomId: this.config.roomId
      };
      this.emit('danmu', message);
    });

    // 礼物消息处理器
    this.messageHandlers.set('gift', (data: any) => {
      const message: DanmuMessage = {
        sendTime: data.timestamp || Date.now(),
        userInfo: {
          userID: Number(data.userId) || 0,
          nickname: data.nickname || '',
          avatar: data.avatar || '',
          medal: { uperID: 0, userID: Number(data.userId) || 0, clubName: '', level: 0 },
          managerType: ManagerType.NotManager
        },
        type: 'gift',
        roomId: this.config.roomId
      };
      this.emit('gift', message);
    });

    // 点赞消息处理器
    this.messageHandlers.set('like', (data: any) => {
      const message: DanmuMessage = {
        sendTime: data.timestamp || Date.now(),
        userInfo: {
          userID: Number(data.userId) || 0,
          nickname: data.nickname || '',
          avatar: data.avatar || '',
          medal: { uperID: 0, userID: Number(data.userId) || 0, clubName: '', level: 0 },
          managerType: ManagerType.NotManager
        },
        type: 'like',
        roomId: this.config.roomId
      };
      this.emit('like', message);
    });

    // 用户进入房间处理器
    this.messageHandlers.set('enter', (data: any) => {
      const message: DanmuMessage = {
        sendTime: data.timestamp || Date.now(),
        userInfo: {
          userID: Number(data.userId) || 0,
          nickname: data.nickname || '',
          avatar: data.avatar || '',
          medal: { uperID: 0, userID: Number(data.userId) || 0, clubName: '', level: 0 },
          managerType: ManagerType.NotManager
        },
        type: 'enter',
        roomId: this.config.roomId
      };
      this.emit('enter', message);
    });

    // 用户关注处理器
    this.messageHandlers.set('follow', (data: any) => {
      const message: DanmuMessage = {
        sendTime: data.timestamp || Date.now(),
        userInfo: {
          userID: Number(data.userId) || 0,
          nickname: data.nickname || '',
          avatar: data.avatar || '',
          medal: { uperID: 0, userID: Number(data.userId) || 0, clubName: '', level: 0 },
          managerType: ManagerType.NotManager
        },
        type: 'follow',
        roomId: this.config.roomId
      };
      this.emit('follow', message);
    });
  }

  /**
   * 连接到直播间
   * 
   * 此方法执行完整的连接流程：
   * 1. 验证配置和状态
   * 2. 确保用户已认证
   * 3. 从连接池获取 API 实例
   * 4. 启动弹幕服务
   * 5. 设置心跳机制
   * 
   * @returns Promise<void> 连接完成的 Promise
   * @throws {Error} 当连接失败时抛出错误
   */
  async connect(): Promise<void> {
    if (this.isdestroyed) {
      throw new Error('Adapter has been destroyed');
    }

    if (this.isConnecting) {
      if (this.config.debug) {
        console.log('[AcfunAdapter] Already connecting, skipping...');
      }
      return;
    }

    if (this.connectionState === ConnectionState.CONNECTED) {
      if (this.config.debug) {
        console.log('[AcfunAdapter] Already connected, skipping...');
      }
      return;
    }

    if (!this.config.roomId) {
      throw new Error('Room ID is required');
    }

    this.isConnecting = true;
    this.setConnectionState(ConnectionState.CONNECTING);

    try {
      // 确保用户已认证
      await this.ensureAuthentication();

      // 从连接池获取 API 实例
      const connection = await this.connectionPool.acquire('danmu', {
        roomId: this.config.roomId
      });
      
      this.api = connection.api;

      // 启动弹幕服务
      await this.startDanmuService();

      // 设置心跳
      this.startHeartbeat();

      // 连接成功
      this.reconnectAttempts = 0;
      this.setConnectionState(ConnectionState.CONNECTED);

      if (this.config.debug) {
        console.log(`[AcfunAdapter] Successfully connected to room ${this.config.roomId}`);
      }
      if (process.env.ACFRAME_DEBUG_LOGS === '1') {
        try { console.log('[Adapter] connect ok roomId=' + String(this.config.roomId) + ' state=CONNECTED'); } catch {}
      }

    } catch (error) {
      this.handleConnectionError(error as Error);
      if (process.env.ACFRAME_DEBUG_LOGS === '1') {
        try { console.log('[Adapter] connect fail roomId=' + String(this.config.roomId) + ' err=' + String((error as any)?.message || error)); } catch {}
      }
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * 断开连接
   * 
   * 清理所有资源并断开与直播间的连接
   * 
   * @returns Promise<void> 断开完成的 Promise
   */
  async disconnect(): Promise<void> {
    if (this.connectionState === ConnectionState.DISCONNECTED) {
      return;
    }

    this.setConnectionState(ConnectionState.DISCONNECTED);

    // 清理定时器
    this.clearTimers();

    // 停止弹幕服务
    if (this.api) {
      try {
        await this.stopDanmuService();
      } catch (error) {
        console.warn('[AcfunAdapter] Error stopping danmu service:', error);
      }
      try {
        if (this.api?.danmu && typeof this.api.danmu.getSessionsByLiver === 'function' && typeof this.api.danmu.stopSessions === 'function') {
          const existing = this.api.danmu.getSessionsByLiver(String(this.config.roomId));
          const ids = existing && existing.success && Array.isArray(existing.data) ? existing.data.map((s: any) => s.sessionId).filter((x: any) => !!x) : [];
          if (ids.length) { await this.api.danmu.stopSessions(ids); }
        }
        if (this.api?.danmu && typeof (this.api.danmu as any).cleanupFailedSessions === 'function') {
          try { (this.api.danmu as any).cleanupFailedSessions(); } catch {}
        }
      } catch {}
    }

    // 释放 API 实例
    this.api = null;
    
    // 清理弹幕会话ID
    this.danmuSessionId = null;

    if (this.config.debug) {
      console.log('[AcfunAdapter] Disconnected successfully');
    }
  }

  /**
   * 重新连接
   * 
   * 断开当前连接并重新建立连接
   * 
   * @returns Promise<void> 重连完成的 Promise
   */
  async reconnect(): Promise<void> {
    if (this.isdestroyed) {
      return;
    }

    this.setConnectionState(ConnectionState.RECONNECTING);
    this.reconnectAttempts++;

    this.emit('reconnect', this.reconnectAttempts);

    if (this.config.debug) {
      console.log(`[AcfunAdapter] Reconnecting... (attempt ${this.reconnectAttempts})`);
    }

    try {
      await this.disconnect();
      await this.connect();
    } catch (error) {
      console.error('[AcfunAdapter] Reconnection failed:', error);
      
      if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else {
        console.error('[AcfunAdapter] Max reconnection attempts reached');
        this.setConnectionState(ConnectionState.FAILED);
        this.emit('error', new Error('Max reconnection attempts reached'));
      }
    }
  }

  /**
   * 销毁适配器
   * 
   * 清理所有资源并销毁适配器实例
   * 
   * @returns Promise<void> 销毁完成的 Promise
   */
  async destroy(): Promise<void> {
    this.isdestroyed = true;

    // 断开连接
    await this.disconnect();

    // 清理定时器
    this.clearTimers();

    // 销毁组件
    this.connectionErrorHandler.destroy();

    // 移除所有事件监听器
    this.removeAllListeners();

    if (this.config.debug) {
      console.log('[AcfunAdapter] Adapter destroyed');
    }
  }

  // 私有辅助方法

  /**
   * 设置连接状态
   * @param newState 新的连接状态
   * @private
   */
  private setConnectionState(newState: ConnectionState): void {
    const previousState = this.connectionState;
    if (previousState !== newState) {
      this.connectionState = newState;
      this.emit('connection-state-changed', newState, previousState);
      // 同步发射 RoomManager 期望的状态事件
      const status = this.mapConnectionStateToRoomStatus(newState);
      this.safeEmit('statusChange', status);
    }
  }

  /**
   * 将内部连接状态映射为 RoomStatus（供 RoomManager 使用）
   */
  private mapConnectionStateToRoomStatus(state: ConnectionState): RoomStatus {
    switch (state) {
      case ConnectionState.CONNECTING:
        return 'connecting';
      case ConnectionState.CONNECTED:
        return 'open';
      case ConnectionState.RECONNECTING:
        return 'reconnecting';
      case ConnectionState.FAILED:
        return 'error';
      case ConnectionState.DISCONNECTED:
      default:
        return 'closed';
    }
  }

  /**
   * 确保认证状态有效
   * @private
   */
  private async ensureAuthentication(): Promise<void> {
    try {
      // 优先检查当前认证状态
      const isAuthenticated = this.tokenManager.isAuthenticated();

      if (isAuthenticated) {
        // 令牌即将过期时提示（但不在此处自动刷新）
        const isExpiringSoon = await this.tokenManager.isTokenExpiringSoon();
        if (isExpiringSoon && this.config.debug) {
          console.log('[AcfunAdapter] Token expiring soon; please re-login if needed.');
        }

        // 统一由 TokenManager 管理认证头，避免重复设置导致覆盖
        await this.tokenManager.getTokenInfo();
        return;
      }

      // 未认证：尝试加载并校验持久化令牌（TokenManager 会在加载时同步到统一 API 实例）
      if (this.config.debug) {
        console.log('[AcfunAdapter] No authentication found, attempting to restore via TokenManager...');
      }

      const tokenInfo = await this.tokenManager.getTokenInfo();
      const validation = await this.tokenManager.validateToken(tokenInfo ?? undefined);

      if (validation.isValid && tokenInfo?.serviceToken) {
        if (this.config.debug) {
          console.log('[AcfunAdapter] Authentication restored via persisted token');
        }
        return;
      }

      // 无有效令牌：记录并继续匿名，由后续API调用决定是否允许
      if (tokenInfo) {
        await this.tokenManager.logout();
      }
      if (this.config.debug) {
        console.log('[AcfunAdapter] No valid authentication token available, proceeding anonymously');
      }
    } catch (error) {
      if (this.config.debug) {
        console.warn('[AcfunAdapter] Authentication check failed:', error);
      }
      // 不抛出错误，允许匿名访问
    }
  }

  /**
   * 启动弹幕服务
   * @private
   */
  private async startDanmuService(): Promise<void> {
    if (!this.api) {
      throw new Error('API instance not available');
    }

    await this.tokenManager.getTokenInfo();

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (this.api.danmu && typeof this.api.danmu.getSessionsByLiver === 'function' && typeof this.api.danmu.stopSessions === 'function') {
          const existing = this.api.danmu.getSessionsByLiver(String(this.config.roomId));
          const ids = existing && existing.success && Array.isArray(existing.data) ? existing.data.map((s: any) => s.sessionId).filter((x: any) => !!x) : [];
          if (ids.length) {
            await this.api.danmu.stopSessions(ids);
          }
        }

        if (this.api.danmu && typeof this.api.danmu.startDanmu === 'function') {
          const result = await this.api.danmu.startDanmu(this.config.roomId, (event: any) => {
            try {
              const t = String((event && (event.type || event.action || event.messageType)) || '');
              const tsIn = Number(event?.timestamp || event?.sendTime || Date.now());
              const userIdIn = event?.userId ?? event?.userInfo?.userID ?? event?.user?.id ?? null;
              const userNameIn = event?.username ?? event?.userInfo?.nickname ?? event?.user?.name ?? null;
              const contentIn = event?.content ?? event?.comment?.content ?? event?.message ?? event?.text ?? null;
              // console.info('[Adapter] callback event type=' + t + ' keys=' + Object.keys(event || {}).join(',') + ' user=' + String(userNameIn || '') + '(' + String(userIdIn || '') + ')' + ' content="' + String(contentIn || '') + '" ts=' + String(tsIn));
            } catch {}
            this.handleDanmuEvent(event);
          });

          if (result.success && result.data) {
            this.danmuSessionId = result.data.sessionId;
            const si = (result as any)?.data?.StreamInfo ?? (result as any)?.data?.streamInfo ?? null;
            if (si) {
              const lid = (si as any)?.liveID ?? (si as any)?.liveId ?? '';
              this.currentLiveId = lid ? String(lid) : this.currentLiveId;
              this.currentStreamInfo = si;
              try { this.emit('streamInfoReady'); } catch {}
            }

            if (this.config.debug) {
              console.log('[AcfunAdapter] Danmu service started with session ID:', this.danmuSessionId);
            }
            if (process.env.ACFRAME_DEBUG_LOGS === '1') {
              try { console.log('[Adapter] danmu start roomId=' + String(this.config.roomId) + ' sessionId=' + String(this.danmuSessionId)); } catch {}
            }
            return;
          }
          throw new Error(result.error || 'Failed to start danmu service');
        }
        throw new Error('DanmuService.startDanmu method not available');
      } catch (error: any) {
        const msg = String((error && (error.message || error)) || '');
        let sid: string | null = null;
        try {
          const m = msg.match(/活动会话[:：]\s*([\w-]+)/);
          if (m && m[1]) sid = m[1];
        } catch {}
        if (sid && this.api?.danmu && typeof this.api.danmu.stopDanmu === 'function') {
          try { await this.api.danmu.stopDanmu(sid); } catch {}
          if (attempt === 0) { continue; }
        }
        if (msg.includes('获取直播 token 失败') && this.api?.danmu) {
          try { if (typeof (this.api.danmu as any).cleanupFailedSessions === 'function') { (this.api.danmu as any).cleanupFailedSessions(); } } catch {}
          try {
            if (typeof this.api.danmu.getSessionsByLiver === 'function' && typeof this.api.danmu.stopSessions === 'function') {
              const ex2 = this.api.danmu.getSessionsByLiver(String(this.config.roomId));
              const ids2 = ex2 && ex2.success && Array.isArray(ex2.data) ? ex2.data.map((s: any) => s.sessionId).filter((x: any) => !!x) : [];
              if (ids2.length) { await this.api.danmu.stopSessions(ids2); }
            }
          } catch {}
          if (attempt === 0) { continue; }
        }
        console.error('[AcfunAdapter] Failed to start danmu service:', error);
        throw error;
      }
    }
  }

  /**
   * 停止弹幕服务
   * @private
   */
  private async stopDanmuService(): Promise<void> {
    if (!this.api) {
      return;
    }

    try {
      // 停止弹幕服务 - 使用标准的 stopDanmu 方法
      if (this.api.danmu && typeof this.api.danmu.stopDanmu === 'function' && this.danmuSessionId) {
        const result = await this.api.danmu.stopDanmu(this.danmuSessionId);
        
        if (result.success) {
          if (this.config.debug) {
            console.log('[AcfunAdapter] Danmu service stopped for session:', this.danmuSessionId);
          }
        } else {
          console.warn('[AcfunAdapter] Failed to stop danmu service:', result.error);
        }
        
        // 清除会话信息
        this.danmuSessionId = null;
        this.currentLiveId = null;
      }
    } catch (error) {
      console.error('[AcfunAdapter] Failed to stop danmu service:', error);
    }
  }

  /**
   * 处理弹幕事件回调
   * @private
   */
  private handleDanmuEvent(event: any): void {
    if (!event || typeof event !== 'object') {
      return;
    }

    try {
      // try {
      //   const t = String((event && (event.type || event.action || event.messageType)) || '');
      //   // console.info('[Adapter] inbound type=' + t + ' keys=' + Object.keys(event || {}).join(','));
      // } catch {}

      if (event && event.danmuInfo) {
        this.processDanmuInfo(event.danmuInfo, event);
        return;
      }
      // 根据事件类型分发处理
      switch (event.type) {
        case 'comment':
        case 'danmu':
          this.handleDanmuMessage(event);
          break;
        case 'gift':
          this.handleGiftMessage(event);
          break;
        case 'like':
          this.handleLikeMessage(event);
          break;
        case 'enter':
          this.handleEnterMessage(event);
          break;
        case 'follow':
          this.handleFollowMessage(event);
          break;
        case 'bananaCount': {
          const summary = String(event?.data ?? event?.count ?? '');
          this.emitUnifiedEvent('bananaCount', { timestamp: Number(event?.timestamp || Date.now()), content: summary, roomId: this.config.roomId, raw: event });
          break;
        }
        case 'displayInfo': {
          const d = event?.data || {};
          const summary = 'watchingCount=' + String(d.watchingCount ?? '') + ', likeCount=' + String(d.likeCount ?? '') + ', likeDelta=' + String(d.likeDelta ?? '');
          this.emitUnifiedEvent('displayInfo', { timestamp: Number(event?.timestamp || Date.now()), content: summary, roomId: this.config.roomId, raw: event });
          break;
        }
        case 'topUsers': {
          const arr = Array.isArray(event?.data) ? event.data : [];
          const summary = 'count=' + String(arr.length);
          this.emitUnifiedEvent('topUsers', { timestamp: Number(event?.timestamp || Date.now()), content: summary, roomId: this.config.roomId, raw: event });
          break;
        }
        case 'redpackList': {
          const arr = Array.isArray(event?.data) ? event.data : [];
          const summary = 'count=' + String(arr.length);
          this.emitUnifiedEvent('redpackList', { timestamp: Number(event?.timestamp || Date.now()), content: summary, roomId: this.config.roomId, raw: event });
          break;
        }
        case 'chatCall': {
          this.emitUnifiedEvent('chatCall', { timestamp: Number(event?.timestamp || Date.now()), content: 'chatCall', roomId: this.config.roomId, raw: event });
          break;
        }
        case 'chatAccept': {
          this.emitUnifiedEvent('chatAccept', { timestamp: Number(event?.timestamp || Date.now()), content: 'chatAccept', roomId: this.config.roomId, raw: event });
          break;
        }
        case 'chatReady': {
          this.emitUnifiedEvent('chatReady', { timestamp: Number(event?.timestamp || Date.now()), content: 'chatReady', roomId: this.config.roomId, raw: event });
          break;
        }
        case 'chatEnd': {
          this.emitUnifiedEvent('chatEnd', { timestamp: Number(event?.timestamp || Date.now()), content: 'chatEnd', roomId: this.config.roomId, raw: event });
          break;
        }
        case 'kickedOut': {
          const summary = String(event?.data ?? event?.reason ?? '');
          this.emitUnifiedEvent('kickedOut', { timestamp: Number(event?.timestamp || Date.now()), content: summary, roomId: this.config.roomId, raw: event });
          break;
        }
        case 'violationAlert': {
          const summary = String(event?.data ?? event?.message ?? '');
          this.emitUnifiedEvent('violationAlert', { timestamp: Number(event?.timestamp || Date.now()), content: summary, roomId: this.config.roomId, raw: event });
          break;
        }
        case 'manager_state': {
          const summary = String(event?.state);
          event.type = 'managerState';
          this.emitUnifiedEvent('managerState', { timestamp: Number(event?.timestamp || Date.now()), content: summary, roomId: this.config.roomId, raw: event });
          break;
        }
        case 'end': {
          this.emitUnifiedEvent('end', { timestamp: Number(event?.timestamp || Date.now()), content: 'live_ended', roomId: this.config.roomId, raw: event });
          break;
        }
        case 'ZtLiveScActionSignal':
          this.handleActionSignal(event);
          break;
        case 'error':
          this.handleConnectionError(new Error(event.message || 'Danmu service error'));
          break;
        default:
          if (this.config.debug) {
            console.log('[AcfunAdapter] Unknown danmu event type:', event.type, event);
          }
          // 宽泛回退：按常见结构尝试解析
          try {
            if (event && (event.signalType || (Array.isArray(event?.payload) && event.payload[0]?.signalType))) {
              if (Array.isArray(event?.payload)) {
                for (const it of event.payload) {
                  this.handleActionSignal({ ...event, ...it, signalType: it?.signalType });
                }
              } else {
                this.handleActionSignal(event);
              }
              break;
            }
            const hasText = (event?.content ?? event?.comment?.content ?? event?.message ?? event?.text) != null;
            const hasUser = (event?.userId ?? event?.userInfo?.userID ?? event?.user?.id) != null;
            if (hasText && hasUser) {
              const ts = Number(event?.timestamp || event?.sendTime || Date.now());
              const userId = event?.userId ?? event?.userInfo?.userID ?? event?.user?.id;
              const userName = event?.username ?? event?.userInfo?.nickname ?? event?.user?.name;
              const content = event?.content ?? event?.comment?.content ?? event?.message ?? event?.text;
              this.handleDanmuMessage({ timestamp: ts, userId, userInfo: { userID: Number(userId) || 0, nickname: String(userName || '') }, content });
              break;
            }
          } catch (e) {
            console.warn('[Adapter] Fallback parse failed:', e);
          }
          break;
      }
    } catch (error) {
      console.error('[AcfunAdapter] Error handling danmu event:', error);
    }
  }

  private processDanmuInfo(di: any, parent?: any): void {
    try {
      const tHint = String(parent?.type || parent?.action || parent?.messageType || parent?.signalType || '');
      const st = String(di?.type || di?.signalType || tHint || '');
      const ts = Number(di?.timestamp || parent?.timestamp || Date.now());
      const merge = (objA: any, objB: any) => ({ ...(objA || {}), ...(objB || {}) });
      if (Array.isArray(di?.payload) && di.payload.length > 0) {
        for (const it of di.payload) {
          const merged = merge(it, parent);
          this.handleActionSignal({ ...merged, signalType: String(merged?.signalType || st || tHint), parentType: tHint, timestamp: Number(merged?.timestamp || ts), raw: parent || di });
        }
        return;
      }
      const merged = merge(di, parent);
      const userId = merged?.userId ?? merged?.user?.id ?? merged?.userInfo?.userID ?? null;
      const userName = merged?.username ?? merged?.user?.name ?? merged?.userInfo?.nickname ?? null;
      // 内容优先礼物名与数量
      const giftName = merged?.giftDetail?.name ?? merged?.giftName ?? merged?.gift?.name ?? null;
      const giftCount = merged?.count ?? merged?.giftDetail?.count ?? null;
      const likeVal = merged?.likeCount ?? merged?.likeDelta ?? merged?.totalLike ?? null;
      const baseText = merged?.content ?? merged?.comment?.content ?? merged?.message ?? merged?.text ?? null;
      const content = giftName ? String(giftName) + (giftCount ? ' x' + String(giftCount) : '') + (merged?.value ? ' (value ' + String(merged.value) + ')' : '')
        : (likeVal != null ? 'like ' + String(likeVal) : baseText);
      this.handleActionSignal({ ...merged, signalType: st || tHint, parentType: tHint, timestamp: ts, userId, userInfo: { userID: Number(userId) || 0, nickname: String(userName || '') }, content, raw: parent || di });
    } catch (e) {
      console.error('[AcfunAdapter] Error processing danmuInfo:', e);
    }
  }

  private handleActionSignal(event: any): void {
    try {
      let st = String(event?.signalType || event?.data?.signalType || event?.payload?.signalType || '');
      const ts = Number(event?.timestamp || event?.sendTime || Date.now());
      const userId = event?.userId ?? event?.user?.id ?? event?.userInfo?.userID ?? event?.payload?.[0]?.userId ?? null;
      const userName = event?.username ?? event?.user?.name ?? event?.userInfo?.nickname ?? event?.payload?.[0]?.userName ?? null;
      const content = event?.content ?? event?.comment?.content ?? event?.payload?.[0]?.comment?.content ?? event?.message ?? event?.text ?? null;
      console.info('[Adapter] ActionSignal type=' + st + ' room=' + String(this.config.roomId) + ' user=' + String(userName || '') + '(' + String(userId || '') + ')' + ' content="' + String(content || '') + '" ts=' + String(ts));
      const at = String(event?.actionType || '').toLowerCase();
      const tLower = String(event?.type || '').toLowerCase();
      const sLower = String(st || '').toLowerCase();
      if (!sLower) {
        if (at === 'enterroom' || tLower.includes('enter')) { st = 'enter'; }
        else if (at === 'followauthor' || tLower.includes('follow')) { st = 'follow'; }
      }
      if (!st) {
        try {
          if (event?.comment || event?.content || event?.text) st = 'comment';
          else if (event?.giftDetail || event?.giftId || event?.giftName || event?.gift) st = 'gift';
          else if (typeof event?.likeCount === 'number' || typeof event?.likeDelta === 'number' || typeof event?.totalLike === 'number') st = 'like';
          else if ((event?.userId || event?.userInfo) && !event?.comment && !event?.gift && !event?.content) {
            const pt = String(event?.parentType || '').toLowerCase();
            if (pt.includes('enter')) st = 'enter';
            else if (pt.includes('follow')) st = 'follow';
            else st = 'like';
          }
        } catch {}
      }
      if (String(st).toLowerCase().includes('comment')) {
        this.handleDanmuMessage({ timestamp: ts, userId, userInfo: { userID: Number(userId) || 0, nickname: String(userName || '') }, content, raw: event });
        return;
      }
      if (String(st).toLowerCase().includes('gift')) {
        this.handleGiftMessage({ timestamp: ts, userId, userInfo: { userID: Number(userId) || 0, nickname: String(userName || '') }, content, raw: event });
        return;
      }
      if (String(st).toLowerCase().includes('like')) {
        this.handleLikeMessage({ timestamp: ts, userId, userInfo: { userID: Number(userId) || 0, nickname: String(userName || '') }, content, raw: event });
        return;
      }
      if (String(st).toLowerCase().includes('enter')) {
        this.handleEnterMessage({ timestamp: ts, userId, userInfo: { userID: Number(userId) || 0, nickname: String(userName || '') }, content, raw: event });
        return;
      }
      if (String(st).toLowerCase().includes('follow')) {
        this.handleFollowMessage({ timestamp: ts, userId, userInfo: { userID: Number(userId) || 0, nickname: String(userName || '') }, content, raw: event });
        return;
      }
      if (this.config.debug) {
        console.info('[Adapter] ActionSignal unmapped type=' + st);
      }
    } catch (e) {
      console.error('[AcfunAdapter] Error handling action signal:', e);
    }
  }



  /**
   * 安全地发射事件，捕获监听器中的错误
   * @private
   */
  private safeEmit(eventName: string, ...args: any[]): void {
    try {
      // 检查是否已销毁
      if (this.isdestroyed) {
        if (this.config.debug) {
          console.warn(`[AcfunAdapter] Attempted to emit ${eventName} on destroyed adapter`);
        }
        return;
      }

      // 检查是否有监听器
      if (this.listenerCount(eventName) === 0) {
        return;
      }

      // 获取所有监听器
      const listeners = this.listeners(eventName);
      
      // 逐个调用监听器，捕获每个监听器的错误
      for (const listener of listeners) {
        try {
          if (typeof listener === 'function') {
            listener.apply(this, args);
          }
        } catch (error) {
          console.error(`[AcfunAdapter] Error in event listener for ${eventName}:`, error);
          
          // 发射错误事件，但避免无限递归
          if (eventName !== 'error') {
            this.emit('error', error instanceof Error ? error : new Error(String(error)));
          }
        }
      }
    } catch (error) {
      console.error(`[AcfunAdapter] Critical error in safeEmit for ${eventName}:`, error);
    }
  }

  /**
   * 处理弹幕消息
   * @private
   */
  private handleDanmuMessage(data: any): void {
    try {
      // 直接使用标准的 DanmuMessage 结构
      const message: DanmuMessage = {
        ...data,
        type: 'comment',
        roomId: this.config.roomId
      };
      
      this.safeEmit('danmu', message);
      // 发射统一事件
      this.emitUnifiedEvent('danmaku', message);
    } catch (error) {
      console.error('[AcfunAdapter] Error handling danmu message:', error);
      this.safeEmit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 处理礼物消息
   * @private
   */
  private handleGiftMessage(data: any): void {
    try {
      // 直接使用标准的 DanmuMessage 结构
      const message: DanmuMessage = {
        ...data,
        type: 'gift',
        roomId: this.config.roomId
      };
      
      this.safeEmit('gift', message);
      // 发射统一事件
      this.emitUnifiedEvent('gift', message);
    } catch (error) {
      console.error('[AcfunAdapter] Error handling gift message:', error);
      this.safeEmit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 处理点赞消息
   * @private
   */
  private handleLikeMessage(data: any): void {
    try {
      // 直接使用标准的 DanmuMessage 结构
      const message: DanmuMessage = {
        ...data,
        type: 'like',
        roomId: this.config.roomId
      };
      
      this.safeEmit('like', message);
      // 发射统一事件
      this.emitUnifiedEvent('like', message);
    } catch (error) {
      console.error('[AcfunAdapter] Error handling like message:', error);
      this.safeEmit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 处理进入房间消息
   * @private
   */
  private handleEnterMessage(data: any): void {
    try {
      // 直接使用标准的 DanmuMessage 结构
      const message: DanmuMessage = {
        ...data,
        type: 'enter',
        roomId: this.config.roomId
      };
      
      this.safeEmit('enter', message);
      // 发射统一事件
      this.emitUnifiedEvent('enter', message);
    } catch (error) {
      console.error('[AcfunAdapter] Error handling enter message:', error);
      this.safeEmit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 处理关注消息
   * @private
   */
  private handleFollowMessage(data: any): void {
    try {
      // 直接使用标准的 DanmuMessage 结构
      const message: DanmuMessage = {
        ...data,
        type: 'follow',
        roomId: this.config.roomId
      };
      
      this.safeEmit('follow', message);
      // 发射统一事件
      this.emitUnifiedEvent('follow', message);
    } catch (error) {
      console.error('[AcfunAdapter] Error handling follow message:', error);
      this.safeEmit('error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 统一事件发射：将上游消息标准化为 NormalizedEvent 并通过 'event' 推送
   */
  private emitUnifiedEvent(type: NormalizedEventType, message: any): void {
    try {
      const raw = message?.raw ?? message;
      const ts = Number(message?.timestamp ?? message?.sendTime ?? Date.now());
      const userIdRaw = message?.userId ?? message?.userInfo?.userID;
      const userNameRaw = message?.username ?? message?.userInfo?.nickname;
      const contentRaw = message?.data?.content ?? message?.content ?? message?.text ?? null;
      const roomIdRaw = message?.roomId ?? this.config.roomId;

      const normalized: NormalizedEvent = ensureNormalized({
        ts,
        received_at: Date.now(),
        room_id: String(roomIdRaw || this.config.roomId),
        source: 'acfun',
        event_type: type,
        user_id: userIdRaw != null ? String(userIdRaw) : null,
        user_name: userNameRaw != null ? String(userNameRaw) : null,
        content: contentRaw != null ? String(contentRaw) : null,
        raw
      });

      this.safeEmit('event', normalized);
      if (process.env.ACFRAME_DEBUG_LOGS === '1') {
        // try {
        //   console.log('[Adapter] unified type=' + String(type) + ' roomId=' + String(normalized.room_id) + ' ts=' + String(normalized.ts) + ' userId=' + String(normalized.user_id ?? '') + ' userName=' + String(normalized.user_name ?? ''));
        // } catch {}
      }
    } catch (error) {
      if (this.config.debug) {
        console.warn('[AcfunAdapter] Failed to normalize/emit unified event:', error);
      }
    }
  }

  /**
   * 启动心跳机制
   * @private
   */
  private startHeartbeat(): void {
    this.clearHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * 发送心跳
   * @private
   */
  private sendHeartbeat(): void {
    if (this.api && this.connectionState === ConnectionState.CONNECTED) {
      // DanmuService 内部已维护心跳；此处进行轻量健康检查以保持连接状态监控
      try {
        if (this.api.danmu && this.danmuSessionId) {
          const health = this.api.danmu.getSessionHealth(this.danmuSessionId);
          // 可根据需要使用 health 数据做日志或状态更新（省略）
        }
      } catch (error) {
        if (this.config.debug) {
          console.warn('[AcfunAdapter] Heartbeat/health check failed:', error);
        }
        this.handleConnectionError(error as Error);
      }
    }
  }

  /**
   * 清理心跳定时器
   * @private
   */
  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 处理连接错误
   * @param error 错误对象
   * @private
   */
  private handleConnectionError(error: Error): void {
    console.error('[AcfunAdapter] Connection error:', error);
    
    this.emit('error', error);
    
    if (this.config.autoReconnect && !this.isDestroyed()) {
      let delay = this.config.reconnectInterval;
      if (error && error.message && error.message.includes('Circuit breaker is open')) {
        console.log('[AcfunAdapter] Circuit breaker detected, increasing reconnection delay to 65s');
        delay = 65000;
      }
      this.scheduleReconnect(delay);
    }
  }

  /**
   * 安排重连
   * @param delay 延迟时间（毫秒），如果不指定则使用配置的间隔
   * @private
   */
  private scheduleReconnect(delay?: number): void {
    if (this.isdestroyed || this.reconnectTimer) {
      return;
    }

    const interval = delay || this.config.reconnectInterval;

    if (this.config.debug) {
      console.log(`[AcfunAdapter] Scheduling reconnection in ${interval}ms`);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnect().catch(error => {
        console.error('[AcfunAdapter] Scheduled reconnection failed:', error);
      });
    }, interval);
  }

  /**
   * 清理所有定时器
   * @private
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.clearHeartbeat();
  }

  // 公共访问器方法

  /**
   * 获取当前连接状态
   * @returns 当前连接状态
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * 获取适配器配置
   * @returns 适配器配置
   */
  getConfig(): AdapterConfig {
    return { ...this.config };
  }

  /**
   * 获取Token管理器实例
   * @returns Token管理器实例
   */
  getTokenManager(): TokenManager {
    return this.tokenManager;
  }

  /**
   * 获取连接池管理器实例
   * @returns 连接池管理器实例
   */
  getConnectionPool(): AcfunApiConnectionPool {
    return this.connectionPool;
  }

  /**
   * 检查适配器是否已销毁
   * @returns 是否已销毁
   */
  isDestroyed(): boolean {
    return this.isdestroyed;
  }

  /** 获取当前直播场次ID */
  getCurrentLiveId(): string | null {
    return this.currentLiveId;
  }
  public getCurrentStreamInfo(): any | null {
    return this.currentStreamInfo;
  }
}
