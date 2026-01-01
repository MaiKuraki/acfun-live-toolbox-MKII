import type {
  AcFunApi,
  StoreApi,
  LifecycleApi,
  LoggerApi,
  SettingsApi,
  HttpApi,
  InteractionApi,
  RendererEvent,
  PluginStorageWriteResult,
  PluginStorageItem,
} from './toolbox-api';

/**
 * 弹幕订阅规则
 */
export interface DanmakuRule {
  /** 房间 ID */
  roomId: string;
  /** 事件类型列表 */
  eventTypes?: string[];
}

/**
 * 订阅操作结果
 */
export interface SubscribeResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * 取消订阅操作结果
 */
export interface UnsubscribeResult {
  success: boolean;
  error?: string;
}

/**
 * 系统命令执行结果
 */
export interface ExecResult {
  success: boolean;
  code: number;
  stdout: string;
  stderr: string;
  error?: string;
}

/**
 * Main 进程系统操作 API（扩展基础 SystemApi）
 */
export interface MainSystemApi {
  /** 在默认浏览器打开 URL */
  openExternal(url: string): Promise<void>;
  /** 打开文件或目录 */
  openPath(path: string): Promise<void>;
  /** 发送系统原生通知 */
  notifyNative(options: { title: string; body: string; icon?: string; urgency?: string }): Promise<void>;
  /** 播放音频 */
  playSound(src: string, options?: { volume?: number; loop?: boolean }): Promise<void>;
  /** 执行系统命令 */
  exec(command: string, args?: string[], opts?: { cwd?: string; timeoutMs?: number; env?: Record<string, string> }): Promise<ExecResult>;
}

/**
 * Main 进程 Overlay API（与基础 OverlayApi 不同）
 */
export interface MainOverlayApi {
  /**
   * 发送消息给 Overlay
   * @param overlayId Overlay ID (可选，不传则广播)
   * @param payload 数据载荷
   * @param clientId 客户端 ID
   * @param senderType 发送者类型
   */
  send(overlayId?: string, payload?: Record<string, any>, clientId?: string, senderType?: string): Promise<void>;
}

/**
 * main 进程插件 API 类型定义（与 packages/main/src/plugins/worker/api/createMainPluginApi.js 对齐）
 */
export interface ToolboxMainApi {
  acfun: AcFunApi;
  store: StoreApi;
  lifecycle: LifecycleApi;
  logger: LoggerApi;
  settings: SettingsApi;
  http: HttpApi;
  system: MainSystemApi;
  overlay: MainOverlayApi;
  interaction:InteractionApi;
  /**
   * 发送消息到 UI/window（main -> ui）
   */
  sendUI(payload?: Record<string, any>): Promise<Record<string, any>>;
  /**
   * 发送 Overlay 消息
   */
  sendOverlay(payload?: Record<string, any>): Promise<Record<string, any>>;
  /**
   * 订阅 renderer 事件
   */
  subscribeRendererEvents?: (callback: (event: RendererEvent) => void) => Promise<SubscribeResult>;
  /**
   * 取消订阅 renderer 事件
   */
  unsubscribeRendererEvents?: () => Promise<UnsubscribeResult>;
  /**
   * 订阅弹幕事件
   */
  subscribeDanmaku?: (rules: DanmakuRule[] | DanmakuRule, callback: (event: Record<string, any>) => void) => Promise<SubscribeResult>;
  /**
   * 按房间取消订阅弹幕事件
   */
  unsubscribeDanmakuByRoom?: (roomId: string) => Promise<UnsubscribeResult>;
  /**
   * main 插件接收来自 ui/window 的消息
   */
  onUiMessage?: (callback: (payload: Record<string, any>) => void) => Promise<SubscribeResult>;
  /**
   * 取消监听来自 ui/window 的消息
   */
  offUiMessage?: () => Promise<UnsubscribeResult>;
  pluginId: string;
  version?: string;
  fs: {
    pluginStorage: {
      write: (row: Record<string, any>) => Promise<{ success: boolean }>;
      read: (queryText?: string, size?: number) => Promise<PluginStorageItem[]>;
      size: () => Promise<number>;
      remove: (ids: number[]) => Promise<number>;
    };
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
  };
  // 可能还包含其他字段，保持索引签名以兼容未来扩展
  [key: string]: any;
}


