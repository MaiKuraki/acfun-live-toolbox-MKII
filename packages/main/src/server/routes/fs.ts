import type { ApiContext } from "./context";
import type express from "express";
import * as fs from "fs";
import * as path from "path";
import { app as electronApp } from "electron";

export function registerFs({ app }: ApiContext): void {
  const resolveWindow = (req: express.Request): { main?: boolean; pluginId?: string } => {
    const headerPluginId = String(req.get("X-Plugin-ID") || "").trim();
    const body = (req.body || {}) as any;
    const qPluginId = String((req.query?.pluginId || req.query?.windowId || "") as string).trim();
    const target = String(body.windowId || body.pluginId || qPluginId || headerPluginId || "").trim();
    if (target) return { pluginId: target };
    return { main: true };
  };

  app.post("/api/fs/read", async (req, res) => {
    try {
      const { path: relPath } = req.body || {};
      if (!relPath || typeof relPath !== "string") return res.status(400).json({ success: false, error: "INVALID_PATH" });
      const { pluginId } = resolveWindow(req);
      if (!pluginId) return res.status(403).json({ error: "PLUGIN_CONTEXT_REQUIRED" });
      const storageRoot = path.join(electronApp.getPath("userData"), "plugin-data", pluginId);
      const safePath = path.resolve(storageRoot, relPath);
      if (!safePath.startsWith(storageRoot)) return res.status(403).json({ error: "PATH_TRAVERSAL" });
      if (!fs.existsSync(safePath)) return res.status(404).json({ error: "FILE_NOT_FOUND" });
      const content = fs.readFileSync(safePath, "utf-8");
      res.json({ success: true, data: content });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post("/api/fs/write", async (req, res) => {
    try {
      const { path: relPath, content } = req.body || {};
      if (!relPath || typeof relPath !== "string") return res.status(400).json({ success: false, error: "INVALID_PATH" });
      if (typeof content !== "string") return res.status(400).json({ success: false, error: "INVALID_CONTENT" });
      const { pluginId } = resolveWindow(req);
      if (!pluginId) return res.status(403).json({ error: "PLUGIN_CONTEXT_REQUIRED" });
      const storageRoot = path.join(electronApp.getPath("userData"), "plugin-data", pluginId);
      if (!fs.existsSync(storageRoot)) fs.mkdirSync(storageRoot, { recursive: true });
      const safePath = path.resolve(storageRoot, relPath);
      if (!safePath.startsWith(storageRoot)) return res.status(403).json({ error: "PATH_TRAVERSAL" });
      fs.writeFileSync(safePath, content, "utf-8");
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post("/api/fs/size", async (req, res) => {
    try {
      const { path: relPath } = req.body || {};
      if (!relPath || typeof relPath !== "string") return res.status(400).json({ success: false, error: "INVALID_PATH" });
      const { pluginId } = resolveWindow(req);
      if (!pluginId) return res.status(403).json({ error: "PLUGIN_CONTEXT_REQUIRED" });
      const storageRoot = path.join(electronApp.getPath("userData"), "plugin-data", pluginId);
      const safePath = path.resolve(storageRoot, relPath);
      if (!safePath.startsWith(storageRoot)) return res.status(403).json({ error: "PATH_TRAVERSAL" });
      if (!fs.existsSync(safePath)) return res.status(404).json({ error: "FILE_NOT_FOUND" });
      const getSize = (p: string): number => {
        const stat = fs.statSync(p);
        if (stat.isFile()) return stat.size;
        if (stat.isDirectory()) {
          let total = 0;
          for (const name of fs.readdirSync(p)) {
            const child = path.join(p, name);
            try { total += getSize(child); } catch {}
          }
          return total;
        }
        return 0;
      };
      const size = getSize(safePath);
      return res.json({ success: true, size });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "SIZE_FAILED" });
    }
  });

  app.post("/api/fs/remove", async (req, res) => {
    try {
      const { path: relPath } = req.body || {};
      if (!relPath || typeof relPath !== "string") return res.status(400).json({ success: false, error: "INVALID_PATH" });
      const { pluginId } = resolveWindow(req);
      if (!pluginId) return res.status(403).json({ error: "PLUGIN_CONTEXT_REQUIRED" });
      const storageRoot = path.join(electronApp.getPath("userData"), "plugin-data", pluginId);
      const safePath = path.resolve(storageRoot, relPath);
      if (!safePath.startsWith(storageRoot)) return res.status(403).json({ error: "PATH_TRAVERSAL" });
      if (!fs.existsSync(safePath)) return res.status(404).json({ error: "FILE_NOT_FOUND" });
      const rm = (p: string) => {
        const stat = fs.statSync(p);
        if (stat.isFile()) return fs.unlinkSync(p);
        if (stat.isDirectory()) {
          for (const name of fs.readdirSync(p)) {
            const child = path.join(p, name);
            try { rm(child); } catch {}
          }
          fs.rmdirSync(p);
        }
      };
      rm(safePath);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "REMOVE_FAILED" });
    }
  });
}
