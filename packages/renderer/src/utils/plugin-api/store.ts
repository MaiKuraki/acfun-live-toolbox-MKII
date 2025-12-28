import type { RequestFn } from "./types";
import type { RendererSseManager } from "./sseManager";

export function createStoreApi(pluginId: string, request: RequestFn, sseManager: RendererSseManager) {
  return {
    get: (keys: string[]) => request("/api/renderer/readonly-store/snapshot", "POST", { keys }),
    onChange: async (keys: string[], callback: (data: any) => void) => {
      const targetKeys = Array.isArray(keys) && keys.length > 0 ? keys : ["*"];

      sseManager.callbacksRegistry.store = (payload: any) => {
        if (!payload || typeof payload !== "object") return;
        const allowAll = targetKeys.includes("*");
        const filtered: Record<string, any> = {};
        Object.keys(payload || {}).forEach((k) => {
          if (!allowAll && !targetKeys.includes(k)) return;
          filtered[k] = (payload as any)[k];
        });
        if (Object.keys(filtered).length === 0) return;
        callback(filtered);
      };

      try {
        const clientId = await sseManager.ensureConnection();
        const resp = await request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/store`, "POST", {
          clientId,
          keys: targetKeys,
          includeSnapshot: true,
        });

        const data = (resp as any)?.data || resp;
        if ((resp as any)?.success === false) {
          console.warn("[plugin-injection] store.onChange subscribe failed:", (resp as any)?.error);
          return { success: false as const, error: (resp as any)?.error ?? "subscribe store failed" };
        }

        if (Array.isArray(data?.keys)) {
          sseManager._serverState.store.keys = data.keys;
        } else {
          sseManager._serverState.store.keys = targetKeys;
        }
        if (data?.storeSnapshot && typeof data.storeSnapshot === "object") {
          sseManager._serverState.store.snapshot = data.storeSnapshot;
          const allowAll = targetKeys.includes("*");
          const filtered: Record<string, any> = {};
          Object.keys(data.storeSnapshot || {}).forEach((k) => {
            if (!allowAll && !targetKeys.includes(k)) return;
            filtered[k] = (data.storeSnapshot as any)[k];
          });
          if (Object.keys(filtered).length > 0) {
            callback(filtered);
          }
        }

        return { success: true as const };
      } catch (e: any) {
        console.warn("[plugin-injection] store.onChange subscribe error:", e);
        return { success: false as const, error: String(e?.message || e) };
      }
    },
    offChange: async () => {
      sseManager.callbacksRegistry.store = null;
      sseManager._serverState.store.keys = [];
      sseManager._serverState.store.snapshot = null;

      try {
        const clientId = await sseManager.ensureConnection();
        const resp = await request(
          `/api/plugins/${encodeURIComponent(pluginId)}/unsubscribe/store`,
          "POST",
          { clientId }
        );
        if ((resp as any)?.success === false) {
          console.warn("[plugin-injection] store.offChange unsubscribe failed:", (resp as any)?.error);
          return { success: false as const, error: (resp as any)?.error ?? "unsubscribe store failed" };
        }
        return { success: true as const };
      } catch (e: any) {
        console.warn("[plugin-injection] store.offChange unsubscribe error:", e);
        return { success: false as const, error: String(e?.message || e) };
      }
    },
  };
}



