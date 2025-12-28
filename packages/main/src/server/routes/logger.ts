import type { ApiContext } from "./context";
import type express from "express";
import * as fs from "fs";
import * as path from "path";
import { app as electronApp } from "electron";
import { getLogManager } from "../../logging/LogManager";
import { pluginLogger } from "../../plugins/PluginLogger";

export function registerLogger({ app, diagnosticsService }: ApiContext): void {
  app.post("/api/logger", (req: express.Request, res: express.Response) => {
    try {
      const { level, message } = req.body;
      const headerPluginId = String(req.get("X-Plugin-ID") || "").trim();
      const src = headerPluginId ? `Plugin:${headerPluginId}` : "Plugin:Unknown";
      const msg = String(message || "");
      const logManager = getLogManager();
      
      // 写入系统日志 (LogManager)
      if (level === "error") logManager.addLog(src, msg, "error");
      else if (level === "warn") logManager.addLog(src, msg, "warn");
      else logManager.addLog(src, msg, "info");
      
      // 同时写入插件日志 (PluginLogger)，用于插件详情页显示
      const pluginId = headerPluginId || undefined;
      if (level === "error") {
        pluginLogger.error(msg, pluginId);
      } else if (level === "warn") {
        pluginLogger.warn(msg, pluginId);
      } else {
        pluginLogger.info(msg, pluginId);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.get(
    "/api/logs",
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const level = (req.query.level as string | undefined)?.toLowerCase() as any;
        const source = req.query.source as string | undefined;
        const fromTs = req.query.from_ts ? parseInt(String(req.query.from_ts)) : undefined;
        const toTs = req.query.to_ts ? parseInt(String(req.query.to_ts)) : undefined;
        const limit = req.query.limit ? Math.min(1000, Math.max(1, parseInt(String(req.query.limit)))) : 200;
        let logs = diagnosticsService.getRecentLogs(limit) as any[];
        if (level) logs = logs.filter((l) => String(l.level).toLowerCase() === level);
        if (source) logs = logs.filter((l) => String(l.source || "").includes(source));
        if (fromTs) logs = logs.filter((l) => new Date(String(l.timestamp)).getTime() >= fromTs);
        if (toTs) logs = logs.filter((l) => new Date(String(l.timestamp)).getTime() <= toTs);
        res.json({ success: true, data: logs });
      } catch (error) {
        next(error);
      }
    }
  );

  app.post(
    "/api/logs/export",
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const fromTs = req.body?.from_ts ? parseInt(String(req.body.from_ts)) : undefined;
        const toTs = req.body?.to_ts ? parseInt(String(req.body.to_ts)) : undefined;
        const level = String(req.body?.level || "error").toLowerCase();
        const source = req.body?.source ? String(req.body.source) : undefined;
        const limit = req.body?.limit ? Math.min(5000, Math.max(1, parseInt(String(req.body.limit)))) : 1000;
        let logs = diagnosticsService.getRecentLogs(limit) as any[];
        logs = logs.filter((l) => String(l.level).toLowerCase() === level);
        if (source) logs = logs.filter((l) => String(l.source || "").includes(source));
        if (fromTs) logs = logs.filter((l) => new Date(String(l.timestamp)).getTime() >= fromTs);
        if (toTs) logs = logs.filter((l) => new Date(String(l.timestamp)).getTime() <= toTs);
        const outDir = path.join(electronApp.getPath("userData"), "logs-exports");
        try { if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true }); } catch {}
        const filename = `error-logs-${Date.now()}.json`;
        const filepath = path.join(outDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(logs, null, 2), "utf-8");
        res.json({ success: true, filepath, count: logs.length });
      } catch (error) {
        next(error);
      }
    }
  );
}

