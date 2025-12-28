import express from "express";
import { app as electronApp } from "electron";
import { ConfigManager } from "../../config/ConfigManager";
import type { DataManagerType } from "../types"; // optional, best-effort

export function createConfigRouter(deps: { dataManager: any }) {
  const router = express.Router();
  const dataManager = deps.dataManager;

  router.get("/:pluginId/config", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      if (!pluginId) return res.status(400).json({ success: false, error: "INVALID_PLUGIN_ID" });
      let conf: Record<string, any> | null = null;
      let fromStore: Record<string, any> | null = null;
      try {
        const userData = electronApp.getPath("userData");
        const filePath = require("path").join(userData, "config.json");
        const raw = require("fs").readFileSync(filePath, "utf-8");
        const json = JSON.parse(raw || "{}");
        const plugins = (json && typeof json === "object" ? (json as any).plugins : null) || null;
        const obs = plugins && typeof plugins === "object" ? (plugins as any)[pluginId] : null;
        const data = obs && typeof obs === "object" ? (obs as any).config : null;
        if (data && typeof data === "object") conf = data as Record<string, any>;
      } catch {}
      try {
        const cfg = new ConfigManager();
        fromStore = (cfg.get(`plugins.${pluginId}.config`, {}) || {}) as Record<string, any>;
      } catch {}
      if (!conf || (conf && Object.keys(conf).length === 0)) conf = fromStore || {};
      else if (fromStore && Object.keys(fromStore).length > 0) conf = { ...fromStore, ...conf };
      res.json({ success: true, data: conf || {} });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.post("/:pluginId/config", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      if (!pluginId) return res.status(400).json({ success: false, error: "INVALID_PLUGIN_ID" });
      const updates = req.body;
      const cfg = new ConfigManager();
      const current = (cfg.get(`plugins.${pluginId}.config`, {}) || {}) as Record<string, any>;
      const next = { ...current, ...updates };
      cfg.set(`plugins.${pluginId}.config`, next);
      const channel = `plugin:${pluginId}:overlay`;
      try { dataManager.publish(channel, { event: "config-changed", payload: next }, { ttlMs: 10000, persist: false, meta: { kind: "config" } }); } catch {}
      res.json({ success: true, data: next });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.delete("/:pluginId/config/:key", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const key = String(req.params.key || "").trim();
      if (!pluginId || !key) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });
      const cfg = new ConfigManager();
      const current = (cfg.get(`plugins.${pluginId}.config`, {}) || {}) as Record<string, any>;
      if (Object.prototype.hasOwnProperty.call(current, key)) delete (current as any)[key];
      cfg.set(`plugins.${pluginId}.config`, current);
      const channel = `plugin:${pluginId}:overlay`;
      try { dataManager.publish(channel, { event: "config-changed", payload: current }, { ttlMs: 10000, persist: false, meta: { kind: "config" } }); } catch {}
      res.json({ success: true, data: current });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.delete("/:pluginId/config", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const key = String((req.body || {}).key || "").trim();
      if (!pluginId || !key) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });
      const cfg = new ConfigManager();
      const current = (cfg.get(`plugins.${pluginId}.config`, {}) || {}) as Record<string, any>;
      if (Object.prototype.hasOwnProperty.call(current, key)) delete (current as any)[key];
      cfg.set(`plugins.${pluginId}.config`, current);
      const channel = `plugin:${pluginId}:overlay`;
      try { dataManager.publish(channel, { event: "config-changed", payload: current }, { ttlMs: 10000, persist: false, meta: { kind: "config" } }); } catch {}
      res.json({ success: true, data: current });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}





