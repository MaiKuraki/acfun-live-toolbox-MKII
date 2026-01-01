/**
 * 订阅相关 API 模块（main 侧）
 * 与 renderer 侧的 createSubscribeApi 保持一致的函数签名和返回语义：
 *   createSubscribeApi(pluginId, mode, request, sseManager)
 */
function createSubscribeApi(pluginId, mode, request, sseManager) {
  // subscribeRendererEvents
  const subscribeRendererEvents = async (callback) => {
    sseManager.callbacksRegistry.renderer = (event) => {
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
    } catch (e) {
      console.warn("[plugin-worker] subscribeRendererEvents error:", e);
      if (e && e.response) {
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
      const resp = await request(`/api/plugins/${encodeURIComponent(pluginId)}/unsubscribe/renderer`, "POST", { clientId });
      if ((resp && resp.success) === false) {
        console.warn("[plugin-worker] unsubscribeRendererEvents failed:", resp.error);
        return { success: false, error: resp.error ?? "unsubscribe renderer failed" };
      }
      return { success: true };
    } catch (e) {
      console.warn("[plugin-worker] unsubscribeRendererEvents error:", e);
      return { success: false, error: String(e?.message || e) };
    }
  };

  const subscribeDanmaku = async (rules, callback) => {
    if (rules.length === 0) {
      return { success: false, error: "rules 不能为空" };
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
        resp && resp.data && Array.isArray(resp.data.rules) ? resp.data.rules : normalizedRules;
      sseManager._serverState.danmaku.rules = dataRules;

      return resp;
    } catch (e) {
      console.warn("[plugin-worker] subscribeDanmaku error:", e);
      if (e && e.response) {
        return e.response;
      }
      throw e;
    }
  };

  const unsubscribeDanmakuByRoom = async (roomId) => {
    const rid = String(roomId || "").trim();
    if (!rid) return { success: false, error: "roomId 不能为空" };

    sseManager.callbacksRegistry.danmaku.delete(rid);
    sseManager._serverState.danmaku.rules = sseManager._serverState.danmaku.rules.filter((r) => r.roomId !== rid);

    try {
      const clientId = await sseManager.ensureConnection();
      const resp = await request(`/api/plugins/${encodeURIComponent(pluginId)}/unsubscribe/danmaku`, "POST", {
        clientId,
        roomIds: [rid],
      });
      if ((resp && resp.success) === false) {
        console.warn("[plugin-worker] unsubscribeDanmakuByRoom failed:", resp.error);
        return { success: false, error: resp.error ?? "unsubscribe danmaku failed" };
      }
      return { success: true };
    } catch (e) {
      console.warn("[plugin-worker] unsubscribeDanmakuByRoom error:", e);
      return { success: false, error: String(e?.message || e) };
    }
  };

  const onUiMessage = async (callback) => {
    if (typeof callback !== "function") {
      console.warn("[plugin-worker] onUiMessage: callback must be a function");
      return { success: false, error: "callback must be a function" };
    }


    sseManager.callbacksRegistry.uiMessage = (payload) => {
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
    } catch (e) {
      console.warn("[plugin-worker] onUiMessage subscribe error:", e);
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
      if ((resp && resp.success) === false) {
        console.warn("[plugin-worker] offUiMessage unsubscribe failed:", resp.error);
        return { success: false, error: resp.error ?? "unsubscribe uiMessage failed" };
      }
      return { success: true };
    } catch (e) {
      console.warn("[plugin-worker] offUiMessage unsubscribe error:", e);
      return { success: false, error: String(e?.message || e) };
    }
  };

  return {
    subscribeRendererEvents,
    unsubscribeRendererEvents,
    subscribeDanmaku,
    unsubscribeDanmakuByRoom,
    onUiMessage,
    offUiMessage,
  };
}

module.exports = { createSubscribeApi };

