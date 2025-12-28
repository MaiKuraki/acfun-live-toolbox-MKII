import type { RequestFn } from "./types";
import type { RendererSseManager } from "./sseManager";

export function createShortcutApi(request: RequestFn, sseManager: RendererSseManager) {
  return {
    register: async (accelerator: string, callback: Function) => {
      // 确保已建立 SSE 连接，这样后续快捷键事件可以通过 EventSource 推送回来
      try {
        await sseManager.ensureConnection();
      } catch {
        // ignore SSE errors here; registration 请求仍然可以继续
      }
      sseManager.callbacksRegistry.shortcut.set(String(accelerator), () => {
        callback();
      });
      return request("/api/shortcut/register", "POST", {
        accelerator,
      });
    },
    unregister: (accelerator: string | string[]) => {
      if (typeof accelerator === "string") {
        sseManager.callbacksRegistry.shortcut.delete(String(accelerator));
      } else {
        accelerator.forEach((a) => sseManager.callbacksRegistry.shortcut.delete(String(a)));
      }
      return request("/api/shortcut/unregister", "POST", { accelerator });
    },
    unregisterAll: () => {
      sseManager.callbacksRegistry.shortcut.clear();
      return request("/api/shortcut/unregister-all", "POST");
    },
    isRegistered: (accelerator: string) =>
      request("/api/shortcut/is-registered", "POST", { accelerator }).then((res) => (res as any).registered),
    list: () => request("/api/shortcut/list", "POST").then((res) => (res as any).shortcuts || []),
  };
}



