import express from "express";

export function createStorageRouter(deps: { getPluginManager?: () => any }) {
  const router = express.Router();
  const getPluginManager = deps.getPluginManager;

  router.post("/:pluginId/storage", async (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      if (!pluginId) return res.status(400).json({ success: false, error: "INVALID_PLUGIN_ID" });
      const pm = getPluginManager?.();
      if (!pm) return res.status(503).json({ success: false, error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const api = pm.getApi?.(pluginId);
      if (!api) return res.status(503).json({ success: false, error: "PLUGIN_API_NOT_AVAILABLE" });
      await api.pluginStorage.write(req.body);
      return res.json({ success: true });
    } catch (err: any) { return res.status(500).json({ success: false, error: err?.message || "STORAGE_WRITE_FAILED" }); }
  });

  router.get("/:pluginId/storage", async (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      if (!pluginId) return res.status(400).json({ success: false, error: "INVALID_PLUGIN_ID" });
      const pm = getPluginManager?.();
      if (!pm) return res.status(503).json({ success: false, error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const api = pm.getApi?.(pluginId);
      if (!api) return res.status(503).json({ success: false, error: "PLUGIN_API_NOT_AVAILABLE" });
      const q = typeof req.query.q === "string" ? String(req.query.q) : undefined;
      const size = req.query.size !== undefined ? Number(req.query.size as any) : undefined;
      const rows = await api.pluginStorage.read(q, size);
      return res.json({ success: true, data: rows });
    } catch (err: any) { return res.status(500).json({ success: false, error: err?.message || "STORAGE_READ_FAILED" }); }
  });

  router.get("/:pluginId/storage/size", async (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      if (!pluginId) return res.status(400).json({ success: false, error: "INVALID_PLUGIN_ID" });
      const pm = getPluginManager?.();
      if (!pm) return res.status(503).json({ success: false, error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const api = pm.getApi?.(pluginId);
      if (!api) return res.status(503).json({ success: false, error: "PLUGIN_API_NOT_AVAILABLE" });
      const count = await api.pluginStorage.size();
      return res.json({ success: true, count });
    } catch (err: any) { return res.status(500).json({ success: false, error: err?.message || "STORAGE_SIZE_FAILED" }); }
  });

  router.post("/:pluginId/storage/remove", async (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const ids: number[] = Array.isArray((req.body || {}).ids) ? (req.body.ids as any[]).map((x) => Number(x)).filter((x) => Number.isFinite(x)) : [];
      if (!pluginId) return res.status(400).json({ success: false, error: "INVALID_PLUGIN_ID" });
      if (ids.length === 0) return res.status(400).json({ success: false, error: "INVALID_IDS" });
      const pm = getPluginManager?.();
      if (!pm) return res.status(503).json({ success: false, error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const api = pm.getApi?.(pluginId);
      if (!api) return res.status(503).json({ success: false, error: "PLUGIN_API_NOT_AVAILABLE" });
      const removed = await api.pluginStorage.remove(ids);
      return res.json({ success: true, removed });
    } catch (err: any) { return res.status(500).json({ success: false, error: err?.message || "STORAGE_REMOVE_FAILED" }); }
  });

  return router;
}




