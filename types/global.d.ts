// 扩展 globalThis 类型
declare global {
    var appName: string;
  var appVersion: string;
  var windowManager: WindowManager;
  var configManager: ConfigManager;
  var httpManager: HttpManager;
  var appManager: AppManager;
  var app: Electron.App;
}

// 扩展 Window 接口
interface Window {
  overlayApi?: {
    id: string;
    room: string;
    token: string;
    action: (actionId: string, data?: any) => void;
    close: () => void;
    update: (updates: any) => void;
  };
}

// 统一 Overlay 事件信封与子页动作消息类型
declare global {
  /** 从主进程包装页向子页发送的事件信封 */
  type OverlayEventEnvelope = {
    type: 'overlay-event';
    overlayId: string;
    eventType: 'overlay-message';
    event: string;
    payload?: any;
  };

  /**
   * 插件级 Overlay SSE 统一信封（`GET /sse/plugins/:pluginId/overlay`）
   * - SSE `event:` 等于 `kind`
   * - SSE `data:` 永远为该信封的 JSON
   */
  type PluginOverlaySseEnvelope = {
    id?: string;
    ts: number;
    pluginId: string;
    kind:
      | "init"
      | "heartbeat"
      | "message"
      | "mainMessage"
      | "uiMessage"
      | "update"
      | "closed"
      | "lifecycle"
      | "config"
      | "store"
      | "client"
      | "shortcut"
      | "room"
      | "danmaku"
      | (string & {});
    event?: string;
    overlayId?: string;
    roomId?: string;
    payload?: any;
    meta?: any;
  };

  /**
   * Danmaku / 房间事件类型（subscribeDanmaku 的 eventTypes 可用值）
   *
   * 注意：当前实现推送的是标准化后的 room event（payload.event_type），
   * 因此 eventTypes 实际是对 `payload.event_type` 的过滤。
   */
  type DanmakuEventType =
    | 'danmaku' | 'gift' | 'follow' | 'like' | 'enter' | 'system'
    | 'shareLive' | 'richText' | 'recentComment'
    | 'bananaCount' | 'displayInfo' | 'topUsers' | 'redpackList'
    | 'chatCall' | 'chatAccept' | 'chatReady' | 'chatEnd'
    | 'kickedOut' | 'violationAlert' | 'managerState' | 'end';

  type ToolboxSubscription = { close: () => void; error?: string };

  /**
   * Danmaku 订阅规则
   */
  interface DanmakuSubscribeRule {
    roomId: string;
    /**
     * 事件类型数组：
     * - 传 ["*"]：订阅所有类型（不过滤）
     * - 传 []：取消订阅该房间所有类型（立即生效，返回的订阅对象为 noop）
     * - 传其它数组：按 payload.event_type 过滤
     */
    eventTypes?: (DanmakuEventType[] | ['*']);
  }

  interface ToolboxApi {
    /**
     * Subscribe Danmaku
     *
     * 订阅一个或多个房间的“弹幕/房间事件”推送（底层走插件 Overlay SSE + /subscribe）。
     *
     * - rules: 规则数组，每项包含 roomId 与该房间的 eventTypes
     * - callback: 收到事件时回调（参数为 payload）
     *
     * 错误：
     * - 房间未开启获取弹幕：error = `房间${roomId}未开启获取弹幕`
     * - 类型无效：error = `类型无效，可用的类型为...`
     *
     * 示例：
     * subscribeDanmaku(
     *   [{ roomId: '123', eventTypes: ['danmaku'] }],
     *   (event) => { console.log(event); }
     * );
     */
    subscribeDanmaku: (rules: DanmakuSubscribeRule[], callback?: (event: any) => void) => ToolboxSubscription;
  }

  interface Window {
    toolboxApi?: ToolboxApi;
  }

  /** 子页向主进程包装页发送的动作：执行自定义行为 */
  type OverlayActionMessage = { type: 'overlay-action'; overlayId: string; action: string; data?: any };
  /** 子页向主进程包装页发送的动作：关闭 Overlay */
  type OverlayCloseMessage = { type: 'overlay-close'; overlayId: string };
  /** 子页向主进程包装页发送的动作：更新 Overlay 配置 */
  type OverlayUpdateMessage = { type: 'overlay-update'; overlayId: string; updates: any };
}

export {};

// 注意：为避免覆盖第三方库的真实类型，这里不再声明 acfunlive-http-api 的模块。
// 通过 renderer 的 tsconfig.paths 指向 `../main/node_modules/acfunlive-http-api/dist/*`，
// 让 TypeScript 使用库内的 `*.d.ts` 进行严格类型检查。
