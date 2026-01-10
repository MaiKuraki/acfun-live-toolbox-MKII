import type { RequestFn } from "./types";

export function createLoggerApi(pluginId: string, request: RequestFn) {
  return {
    info: (message: string) => {
      console.log(`[Plugin:${pluginId}]`, message);
      request("/api/logger", "POST", { level: "info", message }).catch(() => {});
    },
    warn: (message: string) => {
      console.warn(`[Plugin:${pluginId}]`, message);
      request("/api/logger", "POST", { level: "warn", message }).catch(() => {});
    },
    error: (message: string) => {
      console.error(`[Plugin:${pluginId}]`, message);
      request("/api/logger", "POST", { level: "error", message }).catch(() => {});
    },
  };
}



























