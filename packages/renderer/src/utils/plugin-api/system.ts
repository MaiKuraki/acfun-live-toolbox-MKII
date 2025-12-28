import type { RequestFn } from "./types";

export function createSystemApi(request: RequestFn) {
  return {
    openExternal: (url: string) => request("/api/system/open-external", "POST", { url }),
    openPath: (path: string) => request("/api/system/open-path", "POST", { path }),
    notifyNative: (options: { title: string; body: string; icon?: string; urgency?: string }) =>
      request("/api/system/notify-native", "POST", options),
    playSound: (src: string, options?: { volume?: number; loop?: boolean }) =>
      request("/api/system/play-sound", "POST", { src, options }),
    exec: (command: string, args?: string[], opts?: { cwd?: string; timeoutMs?: number; env?: Record<string, string> }) =>
      request("/api/system/exec", "POST", { command, args, opts }),
  };
}
















