import type { RequestFn } from "./types";
import type { RendererSseManager } from "./sseManager";

export function createSettingsApi(pluginId: string, request: RequestFn, sseManager: RendererSseManager) {
  return {
    get: () => request(`/api/plugins/${pluginId}/config`),
    set: (key: string, value: any) => request(`/api/plugins/${pluginId}/config`, "POST", { [key]: value }),
    delete: (key: string) => request(`/api/plugins/${pluginId}/config`, "DELETE", { key }),
    onChange: async (callback: (newValue: any) => void) => {
      sseManager.callbacksRegistry.config = (payload: any) => {
        callback(payload);
      };
      sseManager._serverState.config.subscribed = true;

      try {
        const clientId = await sseManager.ensureConnection();
        // 通过 HTTP API 订阅 config kind，确保 shouldDeliver 会放行 config 事件
        const resp = await request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/config`, "POST", {
          clientId,
        });
        if ((resp as any)?.success === false) {
          console.warn("[plugin-injection] settings.onChange subscribe failed:", (resp as any)?.error);
          return { success: false , error: (resp as any)?.error ?? "subscribe config failed" };
        }
        return { success: true  };
      } catch (e: any) {
        console.warn("[plugin-injection] settings.onChange subscribe error:", e);
        return { success: false , error: String(e?.message || e) };
      }
    },
  };
}



