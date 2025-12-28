import type { ApiContext } from "./context";
import { globalShortcut } from "electron";
import { SseQueueService } from "../SseQueueService";

const registry: Map<string, Set<string>> = new Map();
const addAccel = (pid: string, accel: string) => {
  const set = registry.get(pid) || new Set<string>();
  set.add(accel);
  registry.set(pid, set);
};
const removeAccel = (pid: string, accel: string) => {
  const set = registry.get(pid);
  if (set) {
    set.delete(accel);
    if (set.size === 0) registry.delete(pid);
  }
};
const listAccels = (pid: string): string[] => Array.from(registry.get(pid) || []);
const resolvePluginId = (req: any): string => {
  const headerPluginId = String(req.get("X-Plugin-ID") || "").trim();
  const body = (req.body || {}) as any;
  const qPluginId = String((req.query?.pluginId || req.query?.windowId || "") as string).trim();
  const targetPluginId = String(body.windowId || body.pluginId || qPluginId || headerPluginId || "").trim();
  return targetPluginId;
};

export function registerShortcuts({ app, getPluginWindowManager }: ApiContext): void {
  app.post("/api/shortcut/register", (req, res) => {
    const { accelerator } = req.body;
    const targetPluginId = resolvePluginId(req);
    if (!targetPluginId) return res.status(400).json({ error: "PLUGIN_CONTEXT_REQUIRED" });
    try {
      const ret = globalShortcut.register(accelerator, () => {
        getPluginWindowManager?.()?.send(targetPluginId, "shortcut-triggered", { accelerator });
        try {
          const channel = `plugin:${targetPluginId}:overlay`;
          SseQueueService.getInstance().queueOrPublish(
            channel,
            { event: "shortcut", payload: { accelerator } },
            { ttlMs: 120000, persist: true, meta: { kind: "shortcut" } }
          );
        } catch {}
      });
      if (!ret) return res.json({ success: false, error: "REGISTER_FAILED" });
      addAccel(targetPluginId, accelerator);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/shortcut/unregister", (req, res) => {
    const { accelerator } = req.body;
    try { const pid = resolvePluginId(req); if (pid) removeAccel(pid, accelerator); globalShortcut.unregister(accelerator); res.json({ success: true }); }
    catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  app.post("/api/shortcut/unregister-all", (req, res) => {
    try {
      const pid = resolvePluginId(req);
      if (!pid) return res.status(400).json({ success: false, error: "PLUGIN_CONTEXT_REQUIRED" });
      const list = listAccels(pid);
      for (const acc of list) {
        try { globalShortcut.unregister(acc); } catch {}
      }
      registry.delete(pid);
      return res.json({ success: true, count: list.length });
    } catch (e: any) { return res.status(500).json({ success: false, error: e.message }); }
  });

  app.post("/api/shortcut/is-registered", (req, res) => {
    const { accelerator } = req.body;
    try { const registered = globalShortcut.isRegistered(accelerator); res.json({ success: true, registered }); }
    catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  app.get("/api/shortcut/list", (req, res) => {
    try {
      const pid = resolvePluginId(req);
      if (!pid) return res.status(400).json({ success: false, error: "PLUGIN_CONTEXT_REQUIRED" });
      const list = listAccels(pid);
      return res.json({ success: true, accelerators: list });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/shortcut/list", (req, res) => {
    try {
      const pid = resolvePluginId(req);
      if (!pid) return res.status(400).json({ success: false, error: "PLUGIN_CONTEXT_REQUIRED" });
      const list = listAccels(pid);
      return res.json({ success: true, shortcuts: list });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
}
