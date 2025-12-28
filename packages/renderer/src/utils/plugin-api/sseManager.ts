import type { PluginOverlaySseEnvelope, RendererEvent, RendererMode, RequestFn } from "./types";

type LifecycleCallback = ((payload: any) => void) | null;
type StoreCallback = ((data: any) => void) | null;
type MessageCallback = ((payload: any) => void) | null;
type RendererCallback = ((event: RendererEvent) => void) | null;

export interface RendererCallbacksRegistry {
  lifecycle: LifecycleCallback;
  config: ((payload: any) => void) | null;
  store: StoreCallback;
  renderer: RendererCallback;
  mainMessage: MessageCallback;
  uiMessage: MessageCallback;
  shortcut: Map<string, () => void>;
  danmaku: Map<string, (payload: any) => void>;
}

export interface RendererServerState {
  lifecycle: { subscribed: boolean };
  config: { subscribed: boolean };
  shortcut: Record<string, { subscribed: boolean }>;
  store: { keys: string[]; snapshot: Record<string, any> | null };
  renderer: { subscribed: boolean };
  messages: { mainMessage: boolean; uiMessage: boolean };
  danmaku: { rules: { roomId: string; types: string[] }[] };
}

export interface RendererSseManager {
  _sse: EventSource | null;
  _clientId: string;
  _readyPromise: Promise<string> | null;
  _isOpen: boolean;
  callbacksRegistry: RendererCallbacksRegistry;
  _serverState: RendererServerState;
  _dispatch(e: MessageEvent): void;
  ensureConnection(): Promise<string>;
  restoreSubscriptions(): Promise<void>;
}

function createStableClientId() {
  try {
    const c: any = (globalThis as any).crypto;
    if (c && typeof c.randomUUID === "function") return String(c.randomUUID());
    if (c && typeof c.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      c.getRandomValues(bytes);
      const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      return `cid_${hex}`;
    }
  } catch {
    // ignore
  }
  return `cid_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function createRendererSseManager(
  pluginId: string,
  apiBase: string,
  mode: RendererMode,
  request: RequestFn
): RendererSseManager {
  const sseManager: RendererSseManager = {
    _sse: null,
    _clientId: createStableClientId(),
    _readyPromise: null,
    _isOpen: false,
    callbacksRegistry: {
      lifecycle: null,
      config: null,
      store: null,
      renderer: null,
      mainMessage: null,
      uiMessage: null,
      shortcut: new Map(),
      danmaku: new Map(),
    },
    _serverState: {
      lifecycle: { subscribed: false },
      config: { subscribed: false },
      shortcut: {},
      store: { keys: [], snapshot: null },
      renderer: { subscribed: false },
      messages: { mainMessage: false, uiMessage: false },
      danmaku: { rules: [] },
    },
    _dispatch(e: MessageEvent) {
      try {
        const env = JSON.parse((e as any).data || "{}") as PluginOverlaySseEnvelope;
        if (!env || typeof env !== "object") return;
        const kind = String((env as any).kind || (e as any).type || "unknown").toLowerCase();
        env.kind = kind;
        env.pluginId = String((env as any).pluginId || pluginId);
        env.ts = typeof (env as any).ts === "number" ? (env as any).ts : Date.now();
        try {
          switch (kind) {
            case "lifecycle": {
              const cb = sseManager.callbacksRegistry.lifecycle;
              if (cb) cb(env.payload ?? env);
              break;
            }
            case "config": {
              const cb = sseManager.callbacksRegistry.config;
              if (cb) cb(env.payload ?? env);
              break;
            }
            case "shortcut": {
              const accel = (env.payload as any)?.accelerator;
              if (accel) {
                const fn = sseManager.callbacksRegistry.shortcut.get(String(accel));
                if (fn) fn();
              }
              break;
            }
            case "store": {
              const cb = sseManager.callbacksRegistry.store;
              if (cb && env.payload && typeof env.payload === "object") {
                cb(env.payload);
              }
              break;
            }
            case "renderer": {
              const cb = sseManager.callbacksRegistry.renderer;
              if (!cb) break;
              const event = env.event;
              const payload = env.payload || {};
              let rendererEvent: RendererEvent | undefined;
              switch (event) {
                case "user-login":
                  rendererEvent = { type: "user-login", userId: payload.userId || "", userInfo: payload.userInfo };
                  break;
                case "user-logout":
                  rendererEvent = { type: "user-logout" };
                  break;
                case "route-change":
                  rendererEvent = {
                    type: "route-change",
                    routePath: payload.routePath || "",
                    pageName: payload.pageName || "",
                    pageTitle: payload.pageTitle || "",
                  };
                  break;
                case "live-start":
                  rendererEvent = {
                    type: "live-start",
                    liveId: payload.liveId || "",
                    roomId: payload.roomId || "",
                  };
                  break;
                case "live-stop":
                  rendererEvent = {
                    type: "live-stop",
                    liveId: payload.liveId || "",
                    roomId: payload.roomId || "",
                  };
                  break;
                case "danmaku-collection-start":
                  rendererEvent = { type: "danmaku-collection-start", roomId: payload.roomId || "" };
                  break;
                case "danmaku-collection-stop":
                  rendererEvent = { type: "danmaku-collection-stop", roomId: payload.roomId || "" };
                  break;
                case "config-updated":
                  rendererEvent = { type: "config-updated", key: payload.key || "", value: payload.value };
                  break;
                case "plugin-enabled":
                  rendererEvent = { type: "plugin-enabled", pluginId: payload.pluginId || "" };
                  break;
                case "plugin-disabled":
                  rendererEvent = { type: "plugin-disabled", pluginId: payload.pluginId || "" };
                  break;
                case "plugin-uninstalled":
                  rendererEvent = { type: "plugin-uninstalled", pluginId: payload.pluginId || "" };
                  break;
                case "app-closing":
                  rendererEvent = { type: "app-closing" };
                  break;
                default:
                  break;
              }
              if (rendererEvent) cb(rendererEvent);
              break;
            }
            case "mainmessage": {
              const cb = sseManager.callbacksRegistry.mainMessage;
              if (cb) cb(env.payload ?? env);
              break;
            }
            case "uimessage": {
              const cb = sseManager.callbacksRegistry.uiMessage;
              if (cb) cb(env.payload ?? env);
              break;
            }
            case "danmaku": {
              const payload: any = env.payload || {};
              const rid =
                String(payload.roomId || payload.room_id || env.roomId || (env as any).overlayId || "").trim();
              if (!rid) break;
              const cb = sseManager.callbacksRegistry.danmaku.get(rid);
              if (cb) cb(payload);
              break;
            }
            default:
              break;
          }
        } catch (err) {
          console.warn("[plugin-injection] SSE dispatch error:", err);
        }
      } catch {
        // ignore parse errors
      }
    },
    ensureConnection(): Promise<string> {
      if (sseManager._readyPromise) return sseManager._readyPromise;
      const sseType = mode === "overlay" ? "overlay" : mode === "window" ? "window" : mode === "main" ? "main" : "ui";
      const targetUrl = new URL(`/sse/plugins/${encodeURIComponent(pluginId)}/${sseType}`, apiBase);
      try {
        targetUrl.searchParams.set("clientId", String(sseManager._clientId));
      } catch {
        // ignore
      }
      const es = new EventSource(targetUrl.toString());
      sseManager._sse = es;
      const ready = new Promise<string>((resolve, reject) => {
        let settled = false;
        const timeout = setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(new Error("SSE connection timeout"));
        }, 15000);

        const onOpen = () => {
          sseManager._isOpen = true;
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            resolve(String(sseManager._clientId));
          }
          void sseManager.restoreSubscriptions().catch((err) => {
            console.warn("[plugin-injection] restore subscriptions failed:", err);
          });
        };

        const onClient = (ev: MessageEvent) => {
          try {
            const data = JSON.parse((ev as any).data || "{}") as any;
            const cid = String(data?.payload?.clientId || data?.clientId || "");
            if (cid && String(sseManager._clientId) !== cid) {
              sseManager._clientId = cid;
            }
          } catch {
            // ignore
          }
        };
        const dispatch = (ev: MessageEvent) => sseManager._dispatch(ev);
        const events = [
          "init",
          "heartbeat",
          "update",
          "closed",
          "action",
          "lifecycle",
          "config",
          "shortcut",
          "room",
          "danmaku",
          "store",
          "client",
          "error",
          "mainmessage",
          "uimessage",
          "renderer",
        ];
        es.onopen = onOpen;
        es.onmessage = dispatch;
        events.forEach((ev) => es.addEventListener(ev, dispatch));
        es.addEventListener("client", onClient);
        es.onerror = () => {
          sseManager._isOpen = false;
        };
      });
      sseManager._readyPromise = ready;
      return ready;
    },
    async restoreSubscriptions(): Promise<void> {
      const clientId = await sseManager.ensureConnection();
      const tasks: Promise<any>[] = [];

      try {
        if (sseManager._serverState.store.keys.length > 0) {
          tasks.push(
            request(`/api/plugins/${pluginId}/subscribe/store`, "POST", {
              clientId,
              keys: sseManager._serverState.store.keys,
              includeSnapshot: false,
            }).catch((e) => {
              console.warn("[plugin-injection] restore store subscribe failed:", e);
            })
          );
        }

        if (sseManager._serverState.danmaku.rules.length > 0) {
          tasks.push(
            request(`/api/plugins/${pluginId}/subscribe/danmaku`, "POST", {
              clientId,
              rules: sseManager._serverState.danmaku.rules,
            }).catch((e) => {
              console.warn("[plugin-injection] restore danmaku subscribe failed:", e);
            })
          );
        }

        if (sseManager._serverState.renderer.subscribed) {
          tasks.push(
            request(`/api/plugins/${pluginId}/subscribe/renderer`, "POST", {
              clientId,
              events: ["*"],
            }).catch((e) => {
              console.warn("[plugin-injection] restore renderer subscribe failed:", e);
            })
          );
        }

        const kinds: string[] = [];
        if (sseManager._serverState.messages.mainMessage) kinds.push("mainMessage");
        if (sseManager._serverState.messages.uiMessage) kinds.push("uiMessage");
        if (kinds.length > 0) {
          tasks.push(
            request(`/api/plugins/${pluginId}/subscribe/messages`, "POST", {
              clientId,
              kinds,
            }).catch((e) => {
              console.warn("[plugin-injection] restore messages subscribe failed:", e);
            })
          );
        }
      } finally {
        if (tasks.length > 0) {
          await Promise.all(tasks);
        }
      }
    },
  };

  return sseManager;
}



