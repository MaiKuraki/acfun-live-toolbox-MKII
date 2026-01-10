
import type { NormalizedEvent } from './danmu';

/**
 * API 响应基础结构
 */
export interface ApiResponse<T = Record<string, any>> {
  /** 是否成功 */
  success: boolean;
  /** 成功时的数据 */
  data?: T;
  /** 失败时的错误信息 */
  error?: string;
  /** 错误码 */
  code?: number;
}

/**
 * 分页查询结果
 */
export interface PaginatedResult<T> {
  /** 当前页的数据项列表 */
  items: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 (1-based) */
  page: number;
  /** 每页大小 */
  pageSize: number;
}

/**
 * AcFun 用户信息
 */
export interface UserInfo {
  /** 用户 ID */
  userId: number;
  /** 昵称 */
  name: string;
  /** 头像 URL */
  avatar: string;
  /** 性别 */
  gender?: string;
  /** 个性签名 */
  signature?: string;
  /** 扩展字段 */
  [key: string]: any;
}

/**
 * 直播间信息
 */
/**
 * 连接的房间信息
 */
export interface ConnectedRoomInfo {
  /** 房间ID */
  roomId: string;
  /** 连接状态 */
  status: string;
  /** 连接时间 */
  connectedAt: number;
  /** 事件计数 */
  eventCount: number;
  /** 优先级 */
  priority: number;
  /** 标签 */
  label: string;
  /** 直播ID */
  liveId: string;
  /** 流信息 */
  streamInfo: any;
  /** 是否为房管 */
  isManager: boolean;
  /** 最后错误信息 */
  lastError?: string;
}

/**
 * 直播列表项
 */
export interface LiveListItem {
  /** 直播ID */
  liveId: string;
  /** 主播用户ID */
  liverUid: string;
  /** 直播标题 */
  title: string;
  /** 直播封面 */
  coverUrl: string;
  /** 在线人数 */
  onlineCount: number;
  /** 直播状态 */
  status: 'live' | 'offline' | 'preparing';
  /** 点赞数 */
  likeCount?: number;
  /** 开始时间 */
  startTime?: number;
  /** 主播信息 */
  streamer?: {
    userId: string;
    userName: string;
    avatar: string;
    level: number;
  };
  /** 分类 */
  category?: string;
  /** 子分类 */
  subCategory?: string;
}

/**
 * 直播统计数据
 */
export interface LiveStatistics {
  /** 时间范围（天数） */
  days: number;
  /** 总直播时长（秒） */
  totalLiveTime: number;
  /** 总观看人数 */
  totalViewers: number;
  /** 平均观看人数 */
  avgViewers: number;
  /** 最高观看人数 */
  peakViewers: number;
  /** 总礼物价值 */
  totalGiftValue: number;
  /** 总弹幕数 */
  totalDanmaku: number;
  /** 直播场次数 */
  liveCount: number;
  [key: string]: any; // 扩展字段
}

/**
 * 礼物详情信息
 */
export interface GiftDetail {
  /** 礼物ID */
  giftId: number;
  /** 礼物名称 */
  giftName: string;
  /** AR直播名称 */
  arLiveName: string;
  /** 支付钱包类型 */
  payWalletType: number;
  /** 价格 */
  price: number;
  /** WebP图片 */
  webpPic: string;
  /** PNG图片 */
  pngPic: string;
  /** 小PNG图片 */
  smallPngPic: string;
  /** 允许批量发送大小列表 */
  allowBatchSendSizeList: number[];
  /** 是否可组合 */
  canCombo: boolean;
  /** 是否可绘制 */
  canDraw: boolean;
  /** 魔法表情ID */
  magicFaceId: number;
  /** VUP AR ID */
  vupArId: number;
  /** 描述 */
  description: string;
  /** 红包价格 */
  redpackPrice: number;
  /** 角落标记文字 */
  cornerMarkerText: string;
}

/**
 * 徽章信息
 */
export interface BadgeInfo {
  /** UP主ID */
  uperId: number;
  /** 用户ID */
  userId: number;
  /** 俱乐部名称 */
  clubName: string;
  /** 等级 */
  level: number;
}

/**
 * 徽章详情信息
 */
export interface BadgeDetail extends BadgeInfo {
  /** 经验值 */
  experience: number;
  /** 下一级经验值 */
  nextLevelExperience: number;
  /** 加入时间 */
  joinTime: number;
}

/**
 * 徽章排行信息
 */
export interface BadgeRank {
  /** 用户ID */
  userId: number;
  /** 昵称 */
  nickname: string;
  /** 头像 */
  avatar: string;
  /** 等级 */
  level: number;
  /** 经验值 */
  experience: number;
  /** 排名 */
  rank: number;
}

/**
 * 插件存储数据项
 */
export interface PluginStorageItem {
  /** 记录ID */
  id: number;
  /** 插件ID */
  plugin_id: string;
  /** 创建时间 */
  createTime: number;
  /** 数据内容 */
  data: Record<string, any>;
}

/**
 * 插件存储写入结果
 */
export interface PluginStorageWriteResult {
  /** 影响的行数 */
  changes: number;
  /** 最后插入的ID */
  lastID?: number;
}

/**
 * 用户档案信息
 */
export interface UserProfile {
  /** 用户 ID */
  userID: number;
  /** 昵称 */
  nickname: string;
  /** 头像 URL */
  avatar: string;
  /** 头像框 URL */
  avatarFrame: string;
  /** 关注数 */
  followingCount: number;
  /** 粉丝数 */
  fansCount: number;
  /** 投稿数 */
  contributeCount: number;
  /** 个性签名 */
  signature: string;
  /** 认证文字 */
  verifiedText: string;
  /** 是否加入UP学院 */
  isJoinUpCollege: boolean;
  /** 是否已关注 */
  isFollowing: boolean;
  /** 是否被关注 */
  isFollowed: boolean;
}

/**
 * 直播分类信息
 */
export interface LiveType {
  /** 分类 ID */
  categoryID: number;
  /** 分类名称 */
  categoryName: string;
  /** 子分类 ID */
  subCategoryID: number;
  /** 子分类名称 */
  subCategoryName: string;
}

/**
 * 直播间信息
 */
export interface LiveRoomInfo {
  /** 用户档案 */
  profile: UserProfile;
  /** 直播类型 */
  liveType: LiveType;
  /** 直播 ID */
  liveID: string;
  /** 流名称 */
  streamName: string;
  /** 直播标题 */
  title: string;
  /** 直播开始时间 */
  liveStartTime: number;
  /** 是否竖屏直播 */
  portrait: boolean;
  /** 是否全景直播 */
  panoramic: boolean;
  /** 直播封面 */
  liveCover: string;
  /** 在线人数 */
  onlineCount: number;
  /** 点赞数 */
  likeCount: number;
  /** 是否有粉丝团 */
  hasFansClub: boolean;
  /** 是否禁用弹幕显示 */
  disableDanmakuShow: boolean;
  /** 付费观看用户购买状态 */
  paidShowUserBuyStatus: boolean;
}

/**
 * 开播参数
 */
export interface LiveStartParams {
  /** 直播标题 */
  title: string;
  /** 流名称 (obs stream key) */
  streamName: string;
  /** 分类 ID */
  categoryID: number;
  /** 子分类 ID */
  subCategoryID: number;
  /** 封面文件 (Base64 字符串) */
  coverFile?: string;
  /** 是否竖屏直播 */
  portrait?: boolean;
  /** 是否全景直播 */
  panoramic?: boolean;
}

/**
 * 更新直播间参数
 */
export interface LiveUpdateParams {
  /** 直播 ID */
  liveId: string;
  /** 新标题 */
  title?: string;
  /** 新封面文件 */
  coverFile?: string;
}

/**
 * AcFun 平台相关接口
 */
export interface AcFunApi {
  /** 用户相关 */
  user: {
    /**
     * 获取用户信息
     * @param userId 用户 UID
     */
    getUserInfo(userId: string): Promise<UserInfo>;
  };
  /** 弹幕与房间信息 */
  danmu: {
    /**
     * 获取直播间信息
     * @param liverUID 主播用户ID
     */
    getLiveRoomInfo(liverUID: string): Promise<LiveRoomInfo>;
    /**
     * 发送弹幕 (需要登录态)
     * @param liveId 直播场次 ID (LiveId)
     * @param content 弹幕内容
     */
    sendComment(liveId: string, content: string): Promise<{ sent: boolean }>;
  };
  /** 直播控制 */
  live: {
    /**
     * 获取用户直播信息 (包含直播间状态)
     * @param userID 用户 UID
     */
    getUserLiveInfo(userID?: string|undefined): Promise<LiveRoomInfo>;
    /**
     * 开始直播
     * @param params 开播配置
     * @returns 推流地址等信息
     */
    startLiveStream(params: LiveStartParams): Promise<{ liveId: string; streamName: string; rtmpUrl: string }>;
    /**
     * 停止直播
     * @param liveId 直播 ID
     */
    stopLiveStream(liveId: string): Promise<void>;
    /**
     * 更新直播间信息 (标题/封面)
     */
    updateLiveRoom(params: LiveUpdateParams): Promise<void>;
    /**
     * 检查开播权限
     */
    checkLivePermission(): Promise<{ allowed: boolean; reason?: string }>;
    /**
     * 获取直播列表 (分页)
     */
    getLiveList(page?: number, pageSize?: number): Promise<PaginatedResult<LiveListItem>>;
    /**
     * 获取近期直播数据统计
     * @param days 天数
     */
    getLiveStatisticsByDays(days: number): Promise<LiveStatistics>;
  };
  /** 礼物相关 */
  gift: {
    /** 获取所有礼物列表 */
    getAllGiftList(): Promise<GiftDetail[]>;
    /** 获取指定直播间的礼物配置 */
    getLiveGiftList(liveId: string): Promise<GiftDetail[]>;
  };
  /** 房管操作 */
  manager: {
    /** 添加房管 */
    addManager(managerUID: string): Promise<void>;
    /** 移除房管 */
    deleteManager(managerUID: string): Promise<void>;
    /** 主播踢人 */
    authorKick(liveId: string, kickedUID: string): Promise<void>;
    /** 房管踢人 */
    managerKick(liveId: string, kickedUID: string): Promise<void>;
  };
  /** 徽章相关 */
  badge: {
    /** 获取徽章列表 */
    list(): Promise<BadgeDetail[]>;
    /** 获取用户佩戴的徽章 */
    worn(userId: string): Promise<BadgeDetail | null>;
  };
  /** 本地房间管理 (多开) */
  room: {
    /** 获取所有已连接的房间 */
    getAllConnectedRooms(): Promise<ConnectedRoomInfo[]>;
    /** 获取指定已连接房间的状态 */
    getConnectedRoomStatus(roomId: string): Promise<ConnectedRoomInfo>;
    /** 添加房间 */
    addRoom(roomId: string): Promise<boolean>;
    /** 移除房间 */
    removeRoom(roomId: string): Promise<boolean>;
  };
}

/**
 * 插件专属存储 (基于 SQLite)
 */
export interface PluginStorageApi {
  /**
   * 写入数据
   * @param row 数据对象
   */
  write(row: Record<string, any>): Promise<PluginStorageWriteResult>;
  /**
   * 读取数据
   * @param queryText 全文搜索关键词
   * @param size 返回记录数量限制
   */
  read(queryText?: string, size?: number): Promise<PluginStorageItem[]>;
  /**
   * 获取存储大小
   */
  size(): Promise<number>;
  /**
   * 删除指定ID的数据
   * @param ids 要删除的记录ID数组
   */
  remove(ids: number[]): Promise<number>;
  /**
   * 查询历史事件/数据
   * @param query 查询条件
   */
  queryEvents(query: {
    /** 事件类型 */
    type?: string | string[];
    room_id?: string;
    live_id?: string;
    from_ts?: number;
    to_ts?: number;
    user_id?: string;
    /** 全文搜索关键词 */
    q?: string;
    page?: number;
    pageSize?: number;
    [key: string]: any;
  }): Promise<PaginatedResult<Record<string, any>>>;
}

/**
 * 窗口控制接口 (仅在 Window 模式插件可用)
 */
export interface WindowControlApi {
  /** 最小化 */
  minimize(): Promise<void>;
  /** 最大化 */
  maximize(): Promise<void>;
  /** 还原窗口 */
  restore(): Promise<void>;
  /** 关闭窗口 */
  close(): Promise<void>;
  /** 显示窗口 */
  show(): Promise<void>;
  /** 隐藏窗口 */
  hide(): Promise<void>;
  /** 聚焦窗口 */
  focus(): Promise<void>;
  /** 失去焦点 */
  blur(): Promise<void>;
  /** 设置窗口尺寸 */
  setSize(width: number, height: number): Promise<{ width: number; height: number }>;
  /** 获取窗口尺寸 */
  getSize(): Promise<{ width: number; height: number }>;
  /** 设置窗口位置 */
  setPosition(x: number, y: number): Promise<{ x: number; y: number }>;
  /** 获取窗口位置 */
  getPosition(): Promise<{ x: number; y: number }>;
  /** 设置透明度 (0.0 - 1.0) */
  setOpacity(opacity: number): Promise<void>;
  /** 设置是否置顶 */
  setAlwaysOnTop(flag: boolean): Promise<void>;
  /** 设置是否可调整大小 */
  setResizable(flag: boolean): Promise<void>;
  /**
   * 设置是否忽略鼠标事件 (点击穿透)
   * @param ignore true 为忽略(穿透), false 为不忽略
   * @param options 额外选项
   */
  setIgnoreMouseEvents(ignore: boolean, options?: { forward?: boolean }): Promise<void>;
  /**
   * 切换顶栏显示状态 (仅window模式)
   * @param visible 是否显示顶栏，不传则切换当前状态
   */
  toggleTopbar(visible?: boolean): void;
}

/**
 * 窗口事件监听
 */
export interface WindowEventsApi {
  /**
   * 监听窗口事件
   * @param event 事件名 ('resize', 'move', 'focus', 'blur', 'close')
   * @param callback 回调函数
   * @returns 取消监听函数
   */
  on(event: 'resize' | 'move' | 'focus' | 'blur' | 'close' | string, callback: (e: Event) => void): () => void;
}

/**
 * 插件生命周期接口
 */
export interface LifecycleApi {
  /**
   * 监听生命周期钩子
   * @param hookName 钩子名称 ('ready', 'beforeUnload')
   * @param callback 回调
   * @returns 操作结果
   */
  on(hookName: 'ready' | 'beforeUnload' | string, callback: (data?: Record<string, any>) => void): { success: true };
}

/**
 * 系统级操作
 */
export interface SystemApi {
  /** 在默认浏览器打开 URL */
  openExternal(url: string): Promise<void>;
  /** 在文件管理器中显示文件 */
  showItemInFolder(path: string): Promise<void>;
  /** 打开文件或目录 */
  openPath(path: string): Promise<void>;
}

/**
 * 剪贴板操作
 */
export interface ClipboardApi {
  /** 写入文本 */
  writeText(text: string): Promise<void>;
  /** 读取文本 */
  readText(): Promise<string>;
}

/**
 * 交互与弹窗
 */
export interface InteractionApi {
  /**
   * 发送系统通知
   */
  notify(options: { title: string; body: string; icon?: string }): void;

}

/**
 * 文件系统操作 (受限于插件沙箱或特定目录)
 */
export interface FsApi {
  /** 插件专属结构化存储 */
  pluginStorage: PluginStorageApi;
  /**
   * 读取文件 (UTF-8)
   * @param path 相对路径
   */
  readFile(path: string): Promise<string>;
  /**
   * 写入文件
   * @param path 相对路径
   * @param content 内容
   */
  writeFile(path: string, content: string): Promise<void>;
}

/**
 * 全局快捷键
 */
export interface ShortcutApi {
  /**
   * 注册快捷键
   * @param accelerator 快捷键组合 (如 'CommandOrControl+X')
   * @param callback 触发回调
   */
  register(accelerator: string, callback: () => void): Promise<boolean>;
  /** 注销快捷键 */
  unregister(accelerator: string | string[]): Promise<boolean>;
  /** 注销该插件所有快捷键 */
  unregisterAll(): Promise<boolean>;
  /** 检查快捷键是否已注册 */
  isRegistered(accelerator: string): Promise<boolean>;
  /** 获取已注册的快捷键列表 */
  list(): Promise<string[]>;
}

/**
 * 日志记录器 (输出到主进程日志)
 */
export interface LoggerApi {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/**
 * 插件配置管理
 */
export interface SettingsApi {
  /**
   * 获取配置 (返回完整配置对象)
   */
  get<T = Record<string, any>>(): Promise<T>;
  /**
   * 设置配置
   * @param key 键名
   * @param value 值
   */
  set(key: string, value: any): Promise<void>;
  /**
   * 监听配置变更
   * @param callback 变更回调
   */
  onChange(callback: (newValue: Record<string, any>) => void): Promise<AsyncResult>;
}

/**
 * 通用 HTTP 请求 (通过主进程代理，解决 CORS)
 */
export interface HttpApi {
  post<T = Record<string, any>>(path: string, ...args: any[]): Promise<T>;
  get<T = Record<string, any>>(path: string, ...args: any[]): Promise<T>;
}

/**
 * SSE 事件类型
 */
export type SseKind = string;

/**
 * 渲染器事件类型
 */
export type RendererEvent =
  | { type: "user-login"; userId: string; userInfo: Record<string, any> }
  | { type: "user-logout" }
  | { type: "route-change"; routePath: string; pageName: string; pageTitle: string }
  | { type: "live-start"; liveId: string; roomId: string }
  | { type: "live-stop"; liveId: string; roomId: string }
  | { type: "danmaku-collection-start"; roomId: string }
  | { type: "danmaku-collection-stop"; roomId: string }
  | { type: "config-updated"; key: string; value: any }
  | { type: "plugin-enabled"; pluginId: string }
  | { type: "plugin-disabled"; pluginId: string }
  | { type: "plugin-uninstalled"; pluginId: string }
  | { type: "app-closing" };

/**
 * 异步操作结果
 */
export interface AsyncResult {
  success: boolean;
  error?: string;
}

/**
 * Overlay 通信接口
 */
export interface OverlayApi {
  /**
   * 发送消息给 Overlay
   * @param overlayId Overlay ID (不传则广播)
   * @param event 事件名
   * @param payload 数据载荷
   */
  send(overlayId: string | undefined, event: string, payload?: any): Promise<void>;
}

/**
 * 共享状态 (Readonly Store) — 通过统一的插件 Overlay SSE 通道订阅，底层自动使用
 * `/api/plugins/:pluginId/subscribe` 携带 `storeKeys` 与 `store` kind，无需手动拼 SSE URL。
 */
/**
 * Store 订阅句柄 (main 进程使用)
 */
export interface StoreSubscriptionHandle {
  close(): void;
}

// Store 类型定义
export interface AccountStoreData {
  userInfo: {
    userID: number;
    nickname: string;
    avatar: string;
  } | null;
  fullUserInfo: {
    userID: number;
    username: string;
    avatar: string;
    signature?: string;
    fansCount?: number;
    followCount?: number;
    contributeCount?: number;
    likeCount?: number;
  } | null;
  loginState: {
    isLoggedIn: boolean;
    isLogging: boolean;
    qrCode?: string;
    loginError?: string;
    qrLoginToken?: string;
    qrLoginSignature?: string;
    expiresAt?: number;
  };
}

export interface SidebarStoreData {
  collapsed: boolean;
  width: number;
  collapsedWidth: number;
}

export interface UiStoreData {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  windowSize: {
    width: number;
    height: number;
  };
  isFullscreen: boolean;
}

export interface LiveStoreData {
  liveId: string | null;
  isLive: boolean;
  liveInfo: {
    title: string;
    cover: string;
    startTime: number;
  };
  stats: {
    onlineCount: number;
    likeCount: number;
    giftCount: number;
    bananaCount: number;
  };
  giftMap: Record<string, {
    userID: number;
    nickname: string;
    avatar: string;
    value: number;
    count: number;
  }>;
  audienceByRoom: Record<string, Array<{
    userID: number;
    nickname: string;
    avatar: string;
    isManager: boolean;
    badge?: { clubName: string; level: number };
    giftCount: number;
    likeCount: number;
    bananaCount: number;
  }>>;
  messagesByRoom: Record<string, any[]>;
  statsByRoom: Record<string, {
    onlineCount: number;
    likeCount: number;
    giftCount: number;
    bananaCount: number;
  }>;
}

export interface RoomStoreData {
  rooms: Array<{
    id: string;
    liveId: string;
    liverUID: string;
    title: string;
    coverUrl: string;
    onlineCount: number;
    status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'closed';
    likeCount: number;
    startTime: number;
    connectedAt?: number | null;
    lastEventAt?: number | null;
    streamer: {
      userId: string;
      userName: string;
      avatar: string;
      level: number;
    };
    category: string;
    subCategory: string;
    name: string;
    uperName: string;
    avatar?: string;
    isLive: boolean;
    viewerCount: number;
    lastUpdate: Date;
    url: string;
    priority?: number;
    label?: string;
    autoConnect?: boolean;
    notifyOnLiveStart?: boolean;
    streamInfo?: any;
    myManagerState?: number;
  }>;
  isLoading: boolean;
  error: string | null;
  autoRefresh: boolean;
  refreshInterval: number;
  isRefreshing: boolean;
}

export interface PluginStoreData {
  plugins: Array<{
    id: string;
    name: string;
    version: string;
    description?: string;
    author?: string;
    icon?: string;
    homepage?: string;
    repository?: string;
    keywords?: string[];
    status: 'active' | 'inactive' | 'error' | 'loading';
    enabled: boolean;
    autoStart: boolean;
    installTime: Date;
    lastUpdate: Date;
    entryUrl?: string;
    config?: Record<string, any>;
    sidebarDisplay?: {
      show: boolean;
      order?: number;
      group?: string;
      icon?: string;
      title?: string;
    };
    liveRoomDisplay?: {
      show: boolean;
      order?: number;
      group?: string;
      icon?: string;
      title?: string;
    };
    routes?: Array<{
      path: string;
      name: string;
      component?: string;
      meta?: Record<string, any>;
    }>;
    wujie?: {
      url: string;
      name: string;
      width?: string;
      height?: string;
      props?: Record<string, any>;
      attrs?: Record<string, any>;
      sync?: boolean;
      alive?: boolean;
    };
    hasOverlay?: boolean;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
  installingPlugins: Set<string>;
}

export interface NetworkStoreData {
  apiPort?: number;
  running: boolean;
  error?: string;
}

export interface ConsoleStoreData {
  isConnected: boolean;
  currentSession: {
    id: string;
    userId?: string;
    startTime: number;
    lastActivity: number;
    source: 'local' | 'remote';
    commands: Array<{
      command: string;
      args: string[];
      timestamp: number;
      result: {
        success: boolean;
        message: string;
        data?: any;
        error?: string;
      };
      executionTime: number;
    }>;
  } | null;
  availableCommands: Array<{
    name: string;
    description: string;
    usage: string;
    category: 'system' | 'room' | 'plugin' | 'debug';
  }>;
  commandHistory: Array<{
    command: string;
    args: string[];
    timestamp: number;
    result: {
      success: boolean;
      message: string;
      data?: any;
      error?: string;
    };
    executionTime: number;
  }>;
  isExecuting: boolean;
}

export interface HomeStoreData {
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  userInfo: any;
  docs: Array<{
    title: string;
    desc: string;
    link: string;
  }>;
  anchorStats: {
    lastSessionAt?: string;
    followers?: number;
    giftIncome?: number;
  } | null;
}

export interface RoleStoreData {
  current: 'anchor';
  statsScope: '7d' | '30d';
}

export interface StreamStoreData {
  rtmpUrl: string;
  streamKey: string;
  expiresAt: number | null;
  lastFetched: number | null;
}

// Store 名称到数据类型的映射
export interface StoreDataMap {
  account: AccountStoreData;
  sidebar: SidebarStoreData;
  ui: UiStoreData;
  live: LiveStoreData;
  room: RoomStoreData;
  plugin: PluginStoreData;
  network: NetworkStoreData;
  console: ConsoleStoreData;
  home: HomeStoreData;
  role: RoleStoreData;
  stream: StreamStoreData;
}

/**
 * 共享状态 (Readonly Store) API
 */
export interface StoreApi {
  /**
   * 获取指定 store 的最新快照
   * @param keys 需要获取的 store 名称列表 (如 ['account', 'sidebar'])
   */
  get<T extends keyof StoreDataMap>(keys: T[]): Promise<{ [K in T]: StoreDataMap[K] }>;
  /**
   * 监听指定 store 的变更
   * @param keys 需要监听的 store 名称列表
   * @param callback 变更回调（env.payload 已过滤为所需 keys）
   */
  onChange<T extends keyof StoreDataMap>(keys: T[], callback: (data: { [K in T]: StoreDataMap[K] }) => void): Promise<AsyncResult> | StoreSubscriptionHandle;
  /**
   * 取消监听指定 store 的变更 (仅 renderer 进程支持)
   */
  offChange?(): Promise<AsyncResult>;
}

/**
 * 工具箱 API 基础接口 (所有模式通用)
 */
export interface ToolboxBaseApi {
  acfun: AcFunApi;
  system: SystemApi;
  clipboard: ClipboardApi;
  interaction: InteractionApi;
  fs: FsApi;
  shortcut: ShortcutApi;
  store: StoreApi;
  lifecycle: LifecycleApi;
  logger: LoggerApi;
  settings: SettingsApi;
  http: HttpApi;
  overlay: OverlayApi;
  /**
   * 发送消息到 main / window（renderer 侧用名 sendMain）
   */
  sendMain?(payload?: Record<string, any>): Promise<Record<string, any>>;
  /**
   * 由 renderer 发起发送 overlay 消息（若 mode 支持）
   */
  sendOverlay?(payload?: Record<string, any>): Promise<Record<string, any>>;
  /**
   * 订阅弹幕（通用签名，具体实现可能不同）
   *
   * @param rules 订阅规则数组，每个规则包含房间ID和可选的事件类型过滤
   * @param callback 事件回调函数，接收标准化的事件对象
   * @returns 订阅控制器对象（包含close方法）或Promise
   *
   * 回调函数接收的 event 参数结构：
   * {
   *   ts: number,           // 事件发生时间戳（毫秒）
   *   received_at: number,  // 事件接收时间戳（毫秒）
   *   room_id: string,      // 房间ID
   *   live_id?: string,     // 直播ID（可选）
   *   source: string,       // 数据源标识（如 'acfun'）
   *   event_type: string,   // 事件类型：'danmaku'|'gift'|'follow'|'like'|'enter'|'shareLive'|'joinClub'|'richText'|...
   *   user_id?: string,     // 用户ID（可选）
   *   user_name?: string,   // 用户名（可选）
   *   content?: string,     // 事件内容（可选）
   *   raw: DanmuMessageRaw  // 弹幕消息原始数据，所有事件类型都使用相同结构
   * }
   *
   * raw 字段的具体结构请参考 types/danmu.d.ts 中的 DanmuMessageRaw 接口定义
   */
  subscribeDanmaku?: (rules: { roomId: string; eventTypes?: string[] }[], callback?: (event: NormalizedEvent) => void) => { close: () => void } | Promise<Record<string, any>>;
  /**
   * 取消按房间号的订阅（可选）
   */
  unsubscribeDanmakuByRoom?: (roomId: string) => Promise<AsyncResult>;
  /**
   * 订阅 renderer 侧事件流
   */
  subscribeRendererEvents?: (callback: (event: RendererEvent) => void) => { close: () => void };
  unsubscribeRendererEvents?: () => Promise<AsyncResult>;
  /**
   * main/renderer 消息通道的快捷订阅接口
   */
  onMainMessage?: (callback: (payload: Record<string, any>) => void) => { close: () => void };
  offMainMessage?: () => Promise<AsyncResult>;
   /** 当前插件 ID */
  pluginId: string;
  /** 当前插件版本 */
  version?: string;
}

/**
 * UI 模式下的 API (无窗口控制权)
 */
export interface ToolboxUiApi extends ToolboxBaseApi {
  window: WindowEventsApi;
}

/**
 * 窗口模式下的 API (拥有窗口控制权)
 */
export interface ToolboxWindowApi extends ToolboxBaseApi {
  window: WindowControlApi & WindowEventsApi;
  /**
   * 订阅来自 ui/window 的消息（通过 SSE 通道）
   */
  onUiMessage?(callback: (payload: Record<string, any>) => void): { close: () => void };
  offUiMessage?: () => Promise<AsyncResult>;
}
