import type { ApiContext } from "./context";
import type express from "express";
import { createConfigRouter } from "../plugins/configRoutes";
import { createSubscriptionRouter } from "../plugins/subscriptionRoutes";
import { createStorageRouter } from "../plugins/storageRoutes";
import { createMessageRouter } from "../plugins/messageRoutes";
// serveHtmlWithInjection removed: directly serve static files for plugins

export function registerPlugins({ app, getPluginManager, overlayManager, dataManager, config, pluginRoutes }: ApiContext): void {
  // Mount refactored routers for API surface under /api/plugins
  try {
    app.use("/api/plugins", createConfigRouter({ dataManager }));
    app.use("/api/plugins", createSubscriptionRouter());
    app.use("/api/plugins", createStorageRouter({ getPluginManager }));
    app.use("/api/plugins", createMessageRouter());
  } catch (e) {
    // If dynamic mount fails, fall back to in-file handlers (existing code remains below as fallback)
    console.error("[ApiServer] Failed to mount refactored plugin routers:", e);
  }
  app.get("/api/plugins", (req: express.Request, res: express.Response) => {
    try {
      const pm = getPluginManager?.();
      if (!pm) return res.status(503).json({ success: false, error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const plugins = pm.getInstalledPlugins();
      res.json({ success: true, plugins });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  
  app.get("/api/plugins/:pluginId/dev-config", async (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      if (!pluginId) return res.status(400).json({ success: false, error: "invalid_plugin" });
      const pm = getPluginManager?.();
      if (!pm || !pm.getDevConfig) return res.status(503).json({ success: false, error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const cfg = await pm.getDevConfig(pluginId);
      return res.json({ success: true, data: cfg || null });
    }
    catch (err: any) { return res.status(500).json({ success: false, error: err?.message || "INTERNAL_ERROR" }); }
  });

  // GET /api/overlay/:overlayId removed (unused at runtime). Use POST /api/overlay/:overlayId/action or SSE endpoints.

  app.all("/plugins/:id/*rest", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const pluginId = req.params.id;
    const splat = (req.params as any).rest;
    const reqPath = `/${Array.isArray(splat) ? splat.join("/") : splat || ""}`;
    const routes = (pluginRoutes.get(pluginId) || []);
    const method = req.method.toUpperCase() as "GET" | "POST";
    const candidate = routes.find((r: any) => r.method === method && reqPath.startsWith(r.path));
    // If plugin-defined route exists, dispatch to it
    if (candidate) {
      try { (candidate as any).handler(req, res, next); } catch (err) { console.error("[ApiServer] Plugin route handler error:", err); res.status(500).json({ error: "PLUGIN_HANDLER_ERROR" }); }
      return;
    }

    try {
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Origin", String(req.headers.origin || "*"));
      res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
      const pm = getPluginManager?.();
      if (!pm) return res.status(404).json({ error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const plugin = pm.getPlugin(pluginId);
      if (!plugin) return res.status(404).json({ error: "PLUGIN_NOT_FOUND", pluginId });

      const segments = reqPath.split("/").filter(Boolean);
      const manifestIcon = plugin.manifest && (plugin.manifest as any).icon ? String((plugin.manifest as any).icon) : "icon.svg";
      const isEnabled = plugin.status === "enabled" && plugin.enabled === true;

      // If plugin is disabled, only allow requests for the manifest icon
      const isIconRequest = segments.length === 1 && segments[0] === manifestIcon;
      if (!isEnabled && !isIconRequest) {
        return res.status(403).json({ error: "PLUGIN_DISABLED", pluginId, path: reqPath });
      }

      const fs = require("fs");
      const pathMod = require("path");
      const installRoot = pathMod.resolve(plugin.installPath);
      // If plugin declares SPA, serve its index.html
      if (plugin.manifest && plugin.manifest.spa === true) {
        const indexPath = pathMod.join(plugin.installPath, "index.html");
        const resolvedIndex = pathMod.resolve(indexPath);
        if (!resolvedIndex.startsWith(installRoot)) return res.status(403).json({ error: "FORBIDDEN_PATH" });

        // 尝试先根据请求路径定位静态资源；若存在则直接返回，若不存在则回退到 index.html（便于 SPA 前端路由）
        const relPath = (reqPath || "/").replace(/^\//, "") || "index.html";
        const candidatePath = pathMod.join(plugin.installPath, relPath);
        const resolvedCandidate = pathMod.resolve(candidatePath);
        if (resolvedCandidate.startsWith(installRoot) && fs.existsSync(resolvedCandidate)) {
          return res.sendFile(resolvedCandidate);
        }
        // debug: resolvedIndex

        // 回退到 index.html（若 index.html 本身不存在则返回 404）
        if (!fs.existsSync(resolvedIndex)) return res.status(404).json({ error: "FILE_NOT_FOUND", path: reqPath });
        // 直接发送 index.html（不再尝试注入宿主脚本）
        return res.sendFile(resolvedIndex);
      }
      // Non-SPA: map rest to file under plugin install dir
      const rel = segments.join("/");
      const abs = pathMod.join(plugin.installPath, rel);
      const resolved = pathMod.resolve(abs);
      if (!resolved.startsWith(installRoot)) return res.status(403).json({ error: "FORBIDDEN_PATH" });
      if (!fs.existsSync(resolved)) return res.status(404).json({ error: "FILE_NOT_FOUND", path: reqPath });
      return res.sendFile(resolved);
    } catch (err) {
      console.error("[ApiServer] Plugin static hosting error:", err);
      return res.status(500).json({ error: "PLUGIN_STATIC_HOSTING_ERROR" });
    }
  });

  app.get("/plugins/:pluginId/:type", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const type = String(req.params.type || "").trim();
      if (!pluginId || !type) return res.status(400).send("Bad Request");
      const plugin = getPluginManager?.()?.getPlugin(pluginId);
      if (!plugin) return res.status(404).send("Plugin Not Found");
      const manifest: any = plugin.manifest || {};
      const conf = manifest[type] || {};
      const html = manifest.spa ? 'index.html' : (conf?.html || `${type}.html`);
      const baseDir = plugin.installPath;
      const filePath = require("path").join(baseDir, html);
      if (require("fs").existsSync(filePath)) {
        // 不再使用注入，直接返回文件
        return res.sendFile(filePath);
      }
      return res.status(404).send("File Not Found");
    } catch (err) {
      return next(err);
    }
  });

  app.get("/plugins/:pluginId/:file.html", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const file = String(req.params.file || "").trim();
      if (!pluginId || !file) return res.status(400).send("Bad Request");
      const plugin = getPluginManager?.()?.getPlugin(pluginId);
      if (!plugin) return res.status(404).send("Plugin Not Found");
      const baseDir = plugin.installPath;
      const filePath = require("path").join(baseDir, `${file}.html`);
      if (require("fs").existsSync(filePath)) {
        // 直接返回文件，不注入
        return res.sendFile(filePath);
      }
      return res.status(404).send("File Not Found");
    } catch (err) {
      return next(err);
    }
  });
}


