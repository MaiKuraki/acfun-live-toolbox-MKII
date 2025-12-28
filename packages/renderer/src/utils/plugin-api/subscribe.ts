import type { RendererEvent, RequestFn, RendererMode } from "./types";
import type { RendererSseManager } from "./sseManager";

export function createSubscribeApi(
  pluginId: string,
  mode: RendererMode,
  request: RequestFn,
  sseManager: RendererSseManager
) {
  const subscribeRendererEvents = async (callback: (event: RendererEvent) => void) => {
    sseManager.callbacksRegistry.renderer = (event: RendererEvent) => {
      callback(event);
    };

    try {
      const clientId = await sseManager.ensureConnection();
      const resp = await request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/renderer`, "POST", {
        clientId,
        events: ["*"],
      });
      sseManager._serverState.renderer.subscribed = true;
      return resp;
    } catch (e: any) {
      console.warn("[plugin-injection] subscribeRendererEvents error:", e);
      if (e && e.response) {
        // 返回服务器返回的内容（例如 400 时的 JSON）
        return e.response;
      }
      throw e;
    }
  };

  const unsubscribeRendererEvents = async () => {
    sseManager.callbacksRegistry.renderer = null;
    sseManager._serverState.renderer.subscribed = false;

    try {
      const clientId = await sseManager.ensureConnection();
      const resp = await request(
        `/api/plugins/${encodeURIComponent(pluginId)}/unsubscribe/renderer`,
        "POST",
        { clientId }
      );
      if ((resp as any)?.success === false) {
        console.warn("[plugin-injection] unsubscribeRendererEvents failed:", (resp as any)?.error);
        return { success: false as const, error: (resp as any)?.error ?? "unsubscribe renderer failed" };
      }
      return { success: true as const };
    } catch (e: any) {
      console.warn("[plugin-injection] unsubscribeRendererEvents error:", e);
      return { success: false as const, error: String(e?.message || e) };
    }
  };

  const subscribeDanmaku = async (
    rules: { roomId: string; eventTypes?: string[] }[],
    callback?: (event: any) => void
  ) => {
    if (rules.length === 0) {
      return { success: false as const, error: "rules 不能为空" };
    }

    const normalizedRules = rules.map((r) => ({
      roomId: String(r.roomId),
      types: Array.isArray(r.eventTypes) && r.eventTypes.length > 0 ? r.eventTypes : ["*"],
    }));

    if (callback) {
      normalizedRules.forEach((r) => {
        sseManager.callbacksRegistry.danmaku.set(r.roomId, callback);
      });
    }

    try {
      const clientId = await sseManager.ensureConnection();
      const resp = await request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/danmaku`, "POST", {
        clientId,
        rules: normalizedRules,
      });

      const dataRules =
        (resp as any)?.data?.rules && Array.isArray((resp as any).data.rules)
          ? (resp as any).data.rules
          : normalizedRules;
      sseManager._serverState.danmaku.rules = dataRules;

      return resp;
    } catch (e: any) {
      console.warn("[plugin-injection] subscribeDanmaku error:", e);
      if (e && e.response) {
        return e.response;
      }
      throw e;
    }
  };

  const unsubscribeDanmakuByRoom = async (roomId: string) => {
    const rid = String(roomId || "").trim();
    if (!rid) return { success: false as const, error: "roomId 不能为空" };

    sseManager.callbacksRegistry.danmaku.delete(rid);
    sseManager._serverState.danmaku.rules = sseManager._serverState.danmaku.rules.filter((r) => r.roomId !== rid);

    try {
      const clientId = await sseManager.ensureConnection();
      const resp = await request(
        `/api/plugins/${encodeURIComponent(pluginId)}/unsubscribe/danmaku`,
        "POST",
        { clientId, roomIds: [rid] }
      );
      if ((resp as any)?.success === false) {
        console.warn("[plugin-injection] unsubscribeDanmakuByRoom failed:", (resp as any)?.error);
        return { success: false as const, error: (resp as any)?.error ?? "unsubscribe danmaku failed" };
      }
      return { success: true as const };
    } catch (e: any) {
      console.warn("[plugin-injection] unsubscribeDanmakuByRoom error:", e);
      return { success: false as const, error: String(e?.message || e) };
    }
  };

  const onMainMessage = async (callback: (payload: any) => void) => {
    if (typeof callback !== "function") {
      console.warn("[plugin-injection] onMainMessage: callback must be a function");
      return { success: false as const, error: "callback must be a function" };
    }

    sseManager.callbacksRegistry.mainMessage = (payload: any) => {
      callback(payload);
    };

    try {
      const clientId = await sseManager.ensureConnection();
      const resp = await request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/messages`, "POST", {
        clientId,
        kinds: ["mainMessage"],
      });
      sseManager._serverState.messages.mainMessage = true;
      return resp;
    } catch (e: any) {
      console.warn("[plugin-injection] onMainMessage subscribe error:", e);
      if (e && e.response) {
        return e.response;
      }
      throw e;
    }
  };

  const offMainMessage = async () => {
    sseManager.callbacksRegistry.mainMessage = null;
    sseManager._serverState.messages.mainMessage = false;

    try {
      const clientId = await sseManager.ensureConnection();
      const resp = await request(`/api/plugins/${encodeURIComponent(pluginId)}/unsubscribe/messages`, "POST", {
        clientId,
        kinds: ["mainMessage"],
      });
      if ((resp as any)?.success === false) {
        console.warn("[plugin-injection] offMainMessage unsubscribe failed:", (resp as any)?.error);
        return { success: false as const, error: (resp as any)?.error ?? "unsubscribe mainMessage failed" };
      }
      return { success: true as const };
    } catch (e: any) {
      console.warn("[plugin-injection] offMainMessage unsubscribe error:", e);
      return { success: false as const, error: String(e?.message || e) };
    }
  };

  const onUiMessage = async (callback: (payload: any) => void) => {
    if (typeof callback !== "function") {
      console.warn("[plugin-injection] onUiMessage: callback must be a function");
      return { success: false as const, error: "callback must be a function" };
    }

    if (mode !== "overlay") {
      console.warn("[plugin-injection] onUiMessage is only available for overlay plugins");
      return { success: false as const, error: "only available for overlay plugins" };
    }

    sseManager.callbacksRegistry.uiMessage = (payload: any) => {
      callback(payload);
    };

    try {
      const clientId = await sseManager.ensureConnection();
      const resp = await request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/messages`, "POST", {
        clientId,
        kinds: ["uiMessage"],
      });
      sseManager._serverState.messages.uiMessage = true;
      return resp;
    } catch (e: any) {
      console.warn("[plugin-injection] onUiMessage subscribe error:", e);
      if (e && e.response) {
        return e.response;
      }
      throw e;
    }
  };

  const offUiMessage = async () => {
    sseManager.callbacksRegistry.uiMessage = null;
    sseManager._serverState.messages.uiMessage = false;

    try {
      const clientId = await sseManager.ensureConnection();
      const resp = await request(`/api/plugins/${encodeURIComponent(pluginId)}/unsubscribe/messages`, "POST", {
        clientId,
        kinds: ["uiMessage"],
      });
      if ((resp as any)?.success === false) {
        console.warn("[plugin-injection] offUiMessage unsubscribe failed:", (resp as any)?.error);
        return { success: false as const, error: (resp as any)?.error ?? "unsubscribe uiMessage failed" };
      }
      return { success: true as const };
    } catch (e: any) {
      console.warn("[plugin-injection] offUiMessage unsubscribe error:", e);
      return { success: false as const, error: String(e?.message || e) };
    }
  };

  return {
    subscribeRendererEvents,
    unsubscribeRendererEvents,
    subscribeDanmaku,
    unsubscribeDanmakuByRoom,
    onMainMessage,
    offMainMessage,
    onUiMessage,
    offUiMessage,
  };
}

