import type { RendererSseManager } from "./sseManager";

export function createLifecycleApi(sseManager: RendererSseManager) {
  return {
    on: (hookName: string, callback: (data: any) => void) => {
      sseManager.callbacksRegistry.lifecycle = (payload: any) => {
        if (!payload) return;
        const hook = (payload as any).hook || (payload as any).event || "";
        if (hook === hookName) {
          callback(payload);
        }
      };
      sseManager._serverState.lifecycle.subscribed = true;
      return { success: true as const };
    },
  };
}






















