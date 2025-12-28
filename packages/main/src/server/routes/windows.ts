import type { ApiContext } from "./context";
import type express from "express";
import type { BrowserWindow } from "electron";

export function registerWindows({ app, getPluginWindowManager, getWindowManager }: ApiContext): void {
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

  app.post("/api/windows/minimize", (req, res) => {
    const win = getTargetBrowserWindow(req);
    if (win && !win.isDestroyed()) { win.minimize(); return res.json({ success: true }); }
    res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
  });

  app.post("/api/windows/maximize", (req, res) => {
    const win = getTargetBrowserWindow(req);
    if (win && !win.isDestroyed()) { if (win.isMaximized()) win.unmaximize(); else win.maximize(); return res.json({ success: true }); }
    res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
  });

  app.post("/api/windows/restore", (req, res) => {
    const win = getTargetBrowserWindow(req);
    if (win && !win.isDestroyed()) { win.restore(); return res.json({ success: true }); }
    res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
  });

  app.get("/api/windows/size", (req, res) => {
    const win = getTargetBrowserWindow(req);
    if (win && !win.isDestroyed()) { const [width, height] = win.getSize(); return res.json({ success: true, width, height }); }
    res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
  });

  app.post("/api/windows/size", (req, res) => {
    const win = getTargetBrowserWindow(req);
    if (win && !win.isDestroyed()) {
      const { width, height } = req.body;
      if (typeof width === "number" && typeof height === "number") { win.setSize(width, height); return res.json({ success: true }); }
      return res.status(400).json({ success: false, error: "INVALID_SIZE" });
    }
    res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
  });

  app.get("/api/windows/position", (req, res) => {
    const win = getTargetBrowserWindow(req);
    if (win && !win.isDestroyed()) { const [x, y] = win.getPosition(); return res.json({ success: true, x, y }); }
    res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
  });

  app.post("/api/windows/position", (req, res) => {
    const win = getTargetBrowserWindow(req);
    if (win && !win.isDestroyed()) {
      const { x, y } = req.body;
      if (typeof x === "number" && typeof y === "number") { win.setPosition(x, y); return res.json({ success: true }); }
      return res.status(400).json({ success: false, error: "INVALID_POSITION" });
    }
    res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
  });

  app.post("/api/windows/opacity", (req, res) => {
    const win = getTargetBrowserWindow(req);
    if (win && !win.isDestroyed()) {
      const { opacity } = req.body;
      if (typeof opacity === "number") { win.setOpacity(opacity); return res.json({ success: true }); }
      return res.status(400).json({ success: false, error: "INVALID_OPACITY" });
    }
    res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
  });

  app.post("/api/windows/top", (req, res) => {
    const win = getTargetBrowserWindow(req);
    if (win && !win.isDestroyed()) { const { flag } = req.body; win.setAlwaysOnTop(!!flag); return res.json({ success: true }); }
    res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
  });

  app.post("/api/windows/resizable", (req, res) => {
    const win = getTargetBrowserWindow(req);
    if (win && !win.isDestroyed()) { const { flag } = req.body; win.setResizable(!!flag); return res.json({ success: true }); }
    res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
  });

  app.post("/api/windows/ignore-mouse", (req, res) => {
    const win = getTargetBrowserWindow(req);
    if (win && !win.isDestroyed()) { const { ignore, options } = req.body; win.setIgnoreMouseEvents(!!ignore, options); return res.json({ success: true }); }
    res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
  });

  app.post("/api/windows/show", async (req, res) => {
    try {
      const target = resolveWindow(req);
      if (target.pluginId) {
        const r = await getPluginWindowManager?.()?.focus(target.pluginId);
        const ok = !!(r && (r as any).success);
        return ok ? res.json({ success: true }) : res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
      }
      const win = getWindowManager?.()?.getMainWindow();
      if (win && !win.isDestroyed()) { try { win.show(); win.focus(); } catch {} return res.json({ success: true }); }
      return res.status(404).json({ success: false, error: "MAIN_WINDOW_NOT_FOUND" });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "SHOW_FAILED" });
    }
  });

  app.post("/api/windows/focus", async (req, res) => {
    try {
      const target = resolveWindow(req);
      if (target.pluginId) {
        const r = await getPluginWindowManager?.()?.focus(target.pluginId);
        const ok = !!(r && (r as any).success);
        return ok ? res.json({ success: true }) : res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
      }
      const win = getWindowManager?.()?.getMainWindow();
      if (win && !win.isDestroyed()) { try { win.show(); win.focus(); } catch {} return res.json({ success: true }); }
      return res.status(404).json({ success: false, error: "MAIN_WINDOW_NOT_FOUND" });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "FOCUS_FAILED" });
    }
  });

  app.post("/api/windows/blur", async (req, res) => {
    try {
      const target = resolveWindow(req);
      if (target.pluginId) {
        const win = getPluginWindowManager?.()?.getWindow(target.pluginId);
        if (win && !win.isDestroyed()) { win.blur(); return res.json({ success: true }); }
        return res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
      }
      const win = getWindowManager?.()?.getMainWindow();
      if (win && !win.isDestroyed()) { try { win.blur(); } catch {} return res.json({ success: true }); }
      return res.status(404).json({ success: false, error: "MAIN_WINDOW_NOT_FOUND" });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "BLUR_FAILED" });
    }
  });

  app.post("/api/windows/hide", async (req, res) => {
    try {
      const target = resolveWindow(req);
      if (target.pluginId) {
        const win = getPluginWindowManager?.()?.getWindow(target.pluginId);
        if (win && !win.isDestroyed()) { win.hide(); return res.json({ success: true }); }
        return res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
      }
      const win = getWindowManager?.()?.getMainWindow();
      if (win && !win.isDestroyed()) { try { win.hide(); } catch {} return res.json({ success: true }); }
      return res.status(404).json({ success: false, error: "MAIN_WINDOW_NOT_FOUND" });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "HIDE_FAILED" });
    }
  });

  app.post("/api/windows/close", async (req, res) => {
    try {
      const { pluginId } = resolveWindow(req);
      if (pluginId) {
        const r = await getPluginWindowManager?.()?.close(pluginId);
        const ok = !!(r && (r as any).success);
        return ok ? res.json({ success: true }) : res.status(404).json({ success: false, error: "WINDOW_NOT_FOUND" });
      }
      const win = getWindowManager?.()?.getMainWindow();
      if (win && !win.isDestroyed()) { try { win.close(); } catch {} return res.json({ success: true }); }
      return res.status(404).json({ success: false, error: "MAIN_WINDOW_NOT_FOUND" });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "CLOSE_FAILED" });
    }
  });

  app.get("/api/windows/list", async (_req, res) => {
    try {
      const list = await getPluginWindowManager?.()?.list();
      const main = getWindowManager?.()?.getMainWindow();
      const mainState = main && !main.isDestroyed() ? { windowId: "main", visible: main.isVisible(), focused: main.isFocused() } : { windowId: "main", visible: false, focused: false };
      const windows = Array.isArray((list as any)?.windows) ? (list as any).windows.map((w: any) => ({ windowId: w.pluginId, visible: !!w.visible, focused: !!w.focused })) : [];
      return res.json({ success: true, windows: [mainState, ...windows] });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "LIST_FAILED" });
    }
  });

  app.get("/api/windows/self", async (req, res) => {
    try {
      const headerPluginId = String(req.get("X-Plugin-ID") || "").trim();
      const windowId = headerPluginId || "main";
      return res.json({ success: true, windowId });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "SELF_FAILED" });
    }
  });
}
