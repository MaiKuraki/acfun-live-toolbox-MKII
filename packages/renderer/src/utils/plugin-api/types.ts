export type RendererMode = "ui" | "window" | "overlay" | "main";

export type RequestFn = (
  path: string,
  method?: string,
  body?: any,
  customOptions?: RequestInit
) => Promise<any>;

export type RendererEvent =
  | { type: "user-login"; userId: string; userInfo: any }
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

export type PluginOverlaySseEnvelope = {
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






















