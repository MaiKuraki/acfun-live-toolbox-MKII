import type { ApiContext } from "./context";
import type express from "express";
import { Notification, dialog, shell, app as electronApp, BrowserWindow } from "electron";
import * as path from "path";
import { ConfigManager } from "../../config/ConfigManager";
import * as v8 from "v8";

export function registerSystem({ app, getPluginWindowManager, getWindowManager, getPluginManager, dataManager }: ApiContext): void {
  const resolveWindow = (req: express.Request): { main?: boolean; pluginId?: string } => {
    const headerPluginId = String(req.get("X-Plugin-ID") || "").trim();
    const { windowId, pluginId } = (req.body || {}) as any;
    const target = String(windowId || pluginId || headerPluginId || "").trim();
    if (target) return { pluginId: target };
    return { main: true };
  };
  const getTargetBrowserWindow = (req: express.Request): BrowserWindow | null => {
    const target = resolveWindow(req);
    const pwm = getPluginWindowManager?.();
    const wm = getWindowManager?.();
    if (target.pluginId) return pwm?.getWindow(target.pluginId) || null;
    return wm?.getMainWindow() || null;
  };

  // --- Diagnostics (read-only) ---
  app.get("/api/system/memory", async (_req, res) => {
    try {
      const node = (() => {
        try {
          const mem = process.memoryUsage();
          return {
            rss: mem.rss,
            heapUsed: mem.heapUsed,
            heapTotal: mem.heapTotal,
            external: mem.external,
            arrayBuffers: (mem as any).arrayBuffers
          };
        } catch {
          return null;
        }
      })();

      const heap = (() => {
        try {
          return {
            heapStatistics: v8.getHeapStatistics(),
            heapSpaceStatistics: v8.getHeapSpaceStatistics?.() || undefined
          };
        } catch {
          return null;
        }
      })();

      const electron = (() => {
        try {
          return {
            appMetrics: electronApp.getAppMetrics(),
            appVersion: electronApp.getVersion(),
            isPackaged: electronApp.isPackaged
          };
        } catch {
          return null;
        }
      })();

      const windows = await (async () => {
        try {
          const wins = BrowserWindow.getAllWindows();
          const out: any[] = [];
          for (const w of wins) {
            try {
              const wc = w.webContents;
              const pid = typeof wc.getProcessId === "function" ? wc.getProcessId() : undefined;
              const osPid = (wc as any).getOSProcessId ? (wc as any).getOSProcessId() : undefined;
              let memInfo: any = undefined;
              try {
                if (typeof (wc as any).getProcessMemoryInfo === "function") {
                  memInfo = await (wc as any).getProcessMemoryInfo();
                }
              } catch { }
              out.push({
                browserWindowId: w.id,
                title: (() => { try { return w.getTitle(); } catch { return ""; } })(),
                visible: (() => { try { return w.isVisible(); } catch { return undefined; } })(),
                webContentsId: wc.id,
                pid,
                osPid,
                processMemoryInfo: memInfo
              });
            } catch { }
          }
          return out;
        } catch {
          return [];
        }
      })();

      const plugins = (() => {
        try {
          const pm = getPluginManager?.();
          const pma: any = pm as any;
          const stats: any = {
            installedCount: Array.isArray(pm?.getInstalledPlugins?.()) ? pm!.getInstalledPlugins().length : undefined,
            pluginStats: typeof pm?.getPluginStats === "function" ? pm.getPluginStats() : undefined
          };

          // Best-effort: use concrete PluginManager internals when present
          try {
            if (typeof pma?.getMemoryPoolStats === "function") stats.memoryPool = pma.getMemoryPoolStats();
          } catch { }
          try {
            if (typeof pma?.getPluginCacheStats === "function") stats.cache = pma.getPluginCacheStats();
          } catch { }
          try {
            if (typeof pma?.getConnectionPoolStats === "function") stats.connectionPool = pma.getConnectionPoolStats();
          } catch { }
          try {
            const proc = pma?.processManager;
            if (proc && typeof proc.getProcessStats === "function") stats.processes = proc.getProcessStats();
          } catch { }
          try {
            const pool = pma?.processManager?.workerPool;
            if (pool && typeof pool.getWorkerStats === "function") stats.workerPool = pool.getWorkerStats();
          } catch { }

          return stats;
        } catch {
          return null;
        }
      })();

      const messageCenter = (() => {
        try {
          const dm: any = dataManager as any;
          const stats = typeof dm?.getStats === "function" ? dm.getStats({ sampleMessagesPerChannel: 6 }) : undefined;
          const conf = typeof dm?.getConfigSnapshot === "function" ? dm.getConfigSnapshot() : undefined;
          return { stats, config: conf };
        } catch {
          return null;
        }
      })();

      return res.json({
        success: true,
        data: {
          node,
          heap,
          electron,
          windows,
          plugins,
          messageCenter
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "METRICS_FAILED" });
    }
  });

  app.post("/api/popup", async (req, res) => {
    try {
      // Note: notify / popup should always be delivered to the main window.
      // Ignore plugin-specific headers/windowId for this route and send to main window.
      const { action, title, message, options } = (req.body || {}) as any;
      const act = String(action || "").trim();
      if (!act) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });

      const payload: any =
        act === "toast"
          ? { action: "toast", payload: { message, options } }
          : act === "alert"
            ? { action: "alert", payload: { title: String(title || ""), message, options } }
            : act === "confirm"
              ? { action: "confirm", payload: { title: String(title || ""), message, options } }
              : act === "close"
                ? { action: "close", payload: { id: options?.id || undefined } }
                : null;
      if (!payload) return res.status(400).json({ success: false, error: "UNSUPPORTED_ACTION" });

      let ok = false;
      const wm = getWindowManager?.();
      const win = wm?.getMainWindow();
      if (win && !win.isDestroyed()) {
        try { win.webContents.send("renderer-global-popup", payload); ok = true; } catch { }
      }
      if (!ok) return res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "POPUP_FAILED" });
    }
  });

  app.post("/api/system/notify-native", async (req, res) => {
    try {
      const { title, body, icon, urgency } = (req.body || {}) as any;
      const t = String(title || "").trim();
      const b = String(body || "").trim();
      if (!t && !b) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });
      if (!Notification.isSupported()) return res.status(501).json({ success: false, error: "UNSUPPORTED_PLATFORM" });
      let iconOpt: any = undefined;
      if (icon && typeof icon === "string" && icon.trim().length > 0) {
        try { iconOpt = String(icon); } catch { }
      }
      const n = new Notification({ title: t || "Notification", body: b, icon: iconOpt, urgency: urgency as any });
      try { n.show(); } catch { }
      try {
        const win = getTargetBrowserWindow(req);
        const msg = t ? `${t}: ${b}` : b;
        if (win && !win.isDestroyed()) {
          win.webContents.send("renderer-global-popup", { action: "toast", payload: { message: msg, options: { durationMs: 3000 } } });
        }
      } catch { }
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "NOTIFY_FAILED" });
    }
  });

  app.post("/api/system/play-sound", async (req, res) => {
    try {
      const { src, options } = (req.body || {}) as any;
      const s = String(src || "").trim();
      if (!s) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });

      // 将音频播放请求发送给主窗口，由主窗口创建audio对象播放
      const win = getTargetBrowserWindow(req);
      if (!win) {
        return res.status(500).json({ success: false, error: "WINDOW_NOT_FOUND" });
      }

      win.webContents.send('renderer-global-play-sound', { src: s, options: options || {} });

      return res.json({ success: true });
    } catch (error: any) {
      console.error("Play sound error:", error);
      return res.status(500).json({ success: false, error: error?.message || "PLAY_SOUND_FAILED" });
    }
  });

  app.post("/api/system/open-external", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ success: false, error: "URL_REQUIRED" });
      await shell.openExternal(url);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || "OPEN_EXTERNAL_FAILED" });
    }
  });

  app.post("/api/system/show-item", async (req, res) => {
    try {
      const { path: itemPath } = req.body;
      if (!itemPath) return res.status(400).json({ success: false, error: "PATH_REQUIRED" });
      const fullPath = path.resolve(itemPath);
      shell.showItemInFolder(fullPath);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || "SHOW_ITEM_FAILED" });
    }
  });

  app.post("/api/system/open-path", async (req, res) => {
    try {
      const { path: itemPath } = req.body;
      if (!itemPath) return res.status(400).json({ success: false, error: "PATH_REQUIRED" });
      const fullPath = path.resolve(itemPath);
      const error = await shell.openPath(fullPath);
      if (error) throw new Error(error);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || "OPEN_PATH_FAILED" });
    }
  });

  app.post("/api/system/exec", async (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.get("X-Plugin-ID") || "").trim();
      if (!pluginId) return res.status(400).json({ success: false, error: "INVALID_PLUGIN" });
      try {
        let allowed = false;
        const cfg = new ConfigManager();
        allowed = allowed || !!cfg.get(`plugins.${pluginId}.permissions.exec`, false);
        if (process.env.NODE_ENV === "development") allowed = true;
        try {
          const pm = getPluginManager?.();
          const plugin = pm?.getPlugin(pluginId);
          const manifestAllowed = !!(plugin && (plugin.manifest as any)?.permissions && (plugin.manifest as any).permissions.exec === true);
          allowed = allowed || manifestAllowed;
        } catch { }
        if (!allowed) return res.status(403).json({ success: false, error: "EXEC_NOT_AUTHORIZED" });
      } catch { }
      const { command, args, opts } = (req.body || {}) as { command?: string; args?: string[]; opts?: any };
      const cmd = String(command || "").trim();
      if (!cmd) return res.status(400).json({ success: false, error: "INVALID_COMMAND" });
      const spawnArgs = Array.isArray(args) ? args.map((x) => String(x)) : [];
      const cp = require("child_process");
      const child = cp.spawn(cmd, spawnArgs, {
        cwd: opts && typeof opts.cwd === "string" ? opts.cwd : undefined,
        env: opts && typeof opts.env === "object" ? { ...process.env, ...opts.env } : process.env,
        shell: false,
        windowsHide: true,
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (d: any) => { try { stdout += d.toString(); } catch { } });
      child.stderr?.on("data", (d: any) => { try { stderr += d.toString(); } catch { } });
      const timeoutMs = Math.max(0, Number(opts?.timeoutMs || 30000));
      const timer = timeoutMs > 0 ? setTimeout(() => { try { child.kill("SIGKILL"); } catch { } }, timeoutMs) : null;
      child.on("close", (code: number) => {
        try { if (timer) clearTimeout(timer as any); } catch { }
        return res.json({ success: true, code, stdout, stderr });
      });
      child.on("error", (err: any) => {
        try { if (timer) clearTimeout(timer as any); } catch { }
        return res.status(500).json({ success: false, error: err?.message || "EXEC_ERROR" });
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "INTERNAL_ERROR" });
    }
  });
}
