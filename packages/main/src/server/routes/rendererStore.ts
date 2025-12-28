import type { ApiContext } from "./context";
import type express from "express";
import { SSE_HEARTBEAT_MS } from "../../config/config";

export function registerRendererStore({ app, dataManager }: ApiContext): void {
  app.post("/api/renderer/readonly-store", async (req: express.Request, res: express.Response) => {
    try {
      const { type, payload } = (req.body || {}) as { type?: string; payload?: any };
      const evt = String(type || "").trim();
      if (!evt || (evt !== "readonly-store-init" && evt !== "readonly-store-update")) {
        return res.status(400).json({ success: false, error: "INVALID_EVENT" });
      }
      const channel = "renderer:readonly-store";
      const record = dataManager.publish(channel, { event: evt, payload }, { ttlMs: 10 * 60 * 1000, persist: true, meta: { kind: "readonly-store" } });
      return res.json({ success: true, id: record.id });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "ENQUEUE_FAILED" });
    }
  });

  app.get("/api/renderer/readonly-store/list", (req: express.Request, res: express.Response) => {
    try {
      const channel = "renderer:readonly-store";
      const recent = dataManager.getRecent(channel) || [];
      const set = new Set<string>();
      for (const rec of recent) {
        const outer = (rec && (rec.payload ?? rec)) as any;
        const data = outer && (outer.payload ?? outer);
        if (!data || typeof data !== "object" || Array.isArray(data)) continue;
        for (const key of Object.keys(data)) set.add(key);
      }
      return res.json({ success: true, keys: Array.from(set) });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "LIST_FAILED" });
    }
  });

  app.post("/api/renderer/readonly-store/snapshot", (req: express.Request, res: express.Response) => {
    try {
      const keys = ((req.body || {}) as any).keys as string[];
      if (!Array.isArray(keys) || keys.length === 0) return res.status(400).json({ success: false, error: "INVALID_KEYS" });
      const isWildcard = keys.includes("*");
      const allow = new Set<string>(keys.map((k) => String(k)));
      const channel = "renderer:readonly-store";
      const recent = dataManager.getRecent(channel) || [];
      const snapshot: Record<string, any> = {};
      for (const rec of recent) {
        const outer = (rec && (rec.payload ?? rec)) as any;
        const data = outer && (outer.payload ?? outer);
        if (!data || typeof data !== "object" || Array.isArray(data)) continue;
        for (const key of Object.keys(data)) {
          if (!isWildcard && !allow.has(key)) continue;
          if (isWildcard && (key === "token" || key === "plugin")) continue;
          const val = (data as any)[key];
          if (val === undefined) continue;
          snapshot[key] = val;
        }
      }
      try { if ("plugin" in snapshot) delete (snapshot as any).plugin; } catch {}
      return res.json({ success: true, data: snapshot });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "SNAPSHOT_FAILED" });
    }
  });

  app.get("/sse/renderer/readonly-store/subscribe", (req: express.Request, res: express.Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    try { (res as any).flushHeaders?.(); } catch {}
    try { res.write(":\n\n"); } catch {}
    const rawKeys = String((req.query.keys || "") as any).trim();
    if (!rawKeys) { try { res.write("event: error\n"); res.write('data: {"error":"INVALID_KEYS"}\n\n'); } catch {} try { res.end(); } catch {} return; }
    const keys = rawKeys.split(",").map((s) => s.trim()).filter(Boolean);
    const isWildcard = keys.includes("*");
    const allow = new Set<string>(keys);
    const channel = "renderer:readonly-store";
    const sendRecord = (rec: any) => {
      try {
        if (rec && typeof rec.id === "string") res.write(`id: ${rec.id}\n`);
        const kind = (rec?.meta && rec.meta.kind) || "readonly-store";
        const payload = (rec && rec.payload) || rec;
        const evt = String((payload && payload.event) || "readonly-store-update");
        const dataObj = payload && payload.payload ? { ...(payload.payload || {}) } : {};
        try { if (dataObj && typeof dataObj === "object" && "plugin" in dataObj) delete (dataObj as any).plugin; } catch {}
        const filtered: Record<string, any> = {};
        for (const k of Object.keys(dataObj)) {
          if (!isWildcard && !allow.has(k)) continue;
          if (isWildcard && (k === "token" || k === "plugin")) continue;
          filtered[k] = (dataObj as any)[k];
        }
        if (Object.keys(filtered).length === 0) return;
        res.write(`event: ${evt}\n`);
        res.write(`data: ${JSON.stringify(filtered)}\n\n`);
      } catch (e) { console.warn("[ApiServer] SSE(renderer store) send failed:", e); }
    };
    try {
      const recent = dataManager.getRecent(channel) || [];
      const snapshot: Record<string, any> = {};
      for (const rec of recent) {
        const outer = (rec && (rec.payload ?? rec)) as any;
        const data = outer && (outer.payload ?? outer);
        if (!data || typeof data !== "object" || Array.isArray(data)) continue;
        for (const key of Object.keys(data)) {
          const val = (data as any)[key];
          if (val === undefined) continue;
          if (!isWildcard && !allow.has(key)) continue;
          if (isWildcard && (key === "token" || key === "plugin")) continue;
          snapshot[key] = val;
        }
      }
      if ("plugin" in snapshot) delete (snapshot as any).plugin;
      if (Object.keys(snapshot).length > 0) { res.write("event: readonly-store-init\n"); res.write(`data: ${JSON.stringify(snapshot)}\n\n`); }
    } catch {}
    const unsubscribe = dataManager.subscribe(channel, sendRecord as any, undefined);
    const heartbeat = setInterval(() => { try { res.write("event: heartbeat\n"); res.write(`data: {"ts": ${Date.now()}}\n\n`); } catch {} }, SSE_HEARTBEAT_MS);
    const cleanup = () => { try { unsubscribe(); } catch {} try { clearInterval(heartbeat); } catch {} try { res.end(); } catch {} };
    req.on("close", cleanup);
  });
}

