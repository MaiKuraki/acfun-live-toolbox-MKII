import type { ApiContext } from "./context";
import type express from "express";

export function registerProxy({ app, acfunApiProxy }: ApiContext): void {
  app.post("/api/proxy/request", async (req: express.Request, res: express.Response) => {
    try {
      const method = String(req.body?.method || "GET").toUpperCase();
      const url = String(req.body?.url || "").trim();
      const headers = (req.body?.headers || {}) as Record<string, string>;
      const body = req.body?.body;
      if (!/^https?:\/\//.test(url)) return res.status(400).json({ success: false, error: "invalid_url" });
      const init: any = { method, headers };
      if (body !== undefined && body !== null) {
        const ct = String(headers["Content-Type"] || headers["content-type"] || "");
        init.body = ct.includes("application/json") && typeof body !== "string" ? JSON.stringify(body) : body;
      }
      const r = await fetch(url, init);
      const contentType = String(r.headers.get("content-type") || "");
      let data: any = null;
      try { if (contentType.includes("application/json")) data = await r.json(); else data = await r.text(); }
      catch { data = await r.text().catch(() => null); }
      return res.status(200).json({ success: true, status: r.status, contentType, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "INTERNAL_ERROR" });
    }
  });

  app.use("/api/acfun", acfunApiProxy.createRoutes());
}

