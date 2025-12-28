import type { Ref } from "vue";
import type { MessageThemeList, PluginApiContext } from "../plugin-injection";
import { getApiBase } from "../hosting";
import { createRequest } from "./request";
import { createRendererSseManager } from "./sseManager";
import { createAcfunApi } from "./acfun";
import { createStoreApi } from "./store";
import { createSettingsApi } from "./settings";
import { createLoggerApi } from "./logger";
import { createHttpApi } from "./http";
import { createOverlayApi } from "./overlay";
import { createLifecycleApi } from "./lifecycle";
import { createSubscribeApi } from "./subscribe";
import { createSystemApi } from "./system";
import { createFsApi } from "./fs";
import { createShortcutApi } from "./shortcut";

export function createRendererPluginApi(context: PluginApiContext, windowTopbarVisibleRef?: Ref<boolean>) {
  const { pluginId, mode } = context;
  const apiBase = getApiBase();

  const request = createRequest(pluginId, apiBase);
  const sseManager = createRendererSseManager(pluginId, apiBase, mode, request);

  const acfun = createAcfunApi(request);
  const store = createStoreApi(pluginId, request, sseManager);
  const settings = createSettingsApi(pluginId, request, sseManager);
  const logger = createLoggerApi(pluginId, request);
  const http = createHttpApi(request);
  const overlay = createOverlayApi(pluginId, request);
  const lifecycle = createLifecycleApi(sseManager);
  const subscribeApi = createSubscribeApi(pluginId, mode, request, sseManager);
  const system = createSystemApi(request);
  const fs = createFsApi(pluginId, request);
  const shortcut = createShortcutApi(request, sseManager);

  const windowControl = {
    minimize: () => request("/api/windows/minimize", "POST"),
    maximize: () => request("/api/windows/maximize", "POST"),
    restore: () => request("/api/windows/restore", "POST"),
    close: () => request("/api/windows/close", "POST"),
    show: () => request("/api/windows/show", "POST"),
    hide: () => request("/api/windows/hide", "POST"),
    focus: () => request("/api/windows/focus", "POST"),
    blur: () => request("/api/windows/blur", "POST"),
    setSize: (width: number, height: number) => request("/api/windows/size", "POST", { width, height }),
    getSize: () => request("/api/windows/size"),
    setPosition: (x: number, y: number) => request("/api/windows/position", "POST", { x, y }),
    getPosition: () => request("/api/windows/position"),
    setOpacity: (opacity: number) => request("/api/windows/opacity", "POST", { opacity }),
    setAlwaysOnTop: (flag: boolean) => request("/api/windows/top", "POST", { flag }),
    setResizable: (flag: boolean) => request("/api/windows/resizable", "POST", { flag }),
    setIgnoreMouseEvents: (ignore: boolean, options?: any) =>
      request("/api/windows/ignore-mouse", "POST", { ignore, options }),
    toggleTopbar: (visible?: boolean) => {
      if (mode !== "window") {
        throw new Error("toggleTopbar 仅在 window 模式下可用");
      }
      if (!windowTopbarVisibleRef) return;
      try {
        if (typeof visible === "boolean") {
          windowTopbarVisibleRef.value = visible;
        } else {
          windowTopbarVisibleRef.value = !windowTopbarVisibleRef.value;
        }
      } catch (err) {
        console.warn("[plugin-injection] toggleTopbar failed:", err);
      }
    },
  };

  const windowEvents = {
    on: (event: string, callback: (e: Event) => void) => {
      window.addEventListener(event, callback);
      return () => window.removeEventListener(event, callback);
    },
  };

  const clipboard = {
    writeText: (text: string) => navigator.clipboard.writeText(text),
    readText: () => navigator.clipboard.readText(),
  };

  const interaction = {
    notify: (options: { title?: string; body: string; icon?: string; type?: MessageThemeList; durationMs?: number }) => {
      const msg = options.title ? `${options.title}: ${options.body}` : options.body;
      request("/api/popup", "POST", {
        action: "toast",
        message: msg,
        options: { type: options.type, icon: options.icon, durationMs: options.durationMs },
      });
    },
    closeMessage: (id?: string) => {
      request("/api/popup", "POST", { action: "close", options: { id } });
    },
  };

  const {
    subscribeDanmaku,
    unsubscribeDanmakuByRoom,
    subscribeRendererEvents,
    unsubscribeRendererEvents,
    onMainMessage,
    offMainMessage,
    onUiMessage,
    offUiMessage,
  } = subscribeApi;

  const commonApi: any = {
    acfun,
    store,
    lifecycle,
    logger,
    settings,
    http,
    overlay,
    sendMain: async (payload?: any) => {
      const clientId = await sseManager.ensureConnection();
      return request(`/api/plugins/${encodeURIComponent(pluginId)}/messages`, "POST", { payload }, {
        headers: {
          "X-Client-ID": clientId,
          "X-Plugin-Type": mode,
        },
      });
    },
    sendOverlay: async (payload?: any) => {
      if (mode === "overlay") {
        throw new Error("overlay cannot send messages, only receive");
      }
      const clientId = await sseManager.ensureConnection();
      return overlay.send(undefined, payload, clientId, mode);
    },
    subscribeDanmaku,
    unsubscribeDanmakuByRoom,
    subscribeRendererEvents,
    unsubscribeRendererEvents,
    onMainMessage,
    offMainMessage,
    pluginId,
    version: context.version,
  };

  if (mode === "overlay") {
    const overlayFs = {
      pluginStorage: {
        read: fs.pluginStorage.read,
        size: fs.pluginStorage.size,
      },
    } as any;
    return { ...commonApi, onUiMessage, offUiMessage, fs: overlayFs };
  }

  return {
    ...commonApi,
    window: mode === "window" ? { ...windowControl, ...windowEvents } : { ...windowEvents },
    system,
    clipboard,
    interaction,
    fs,
    shortcut,
  };
}

