import express from "express";
import { PluginSseConnectionManager } from "../services/PluginSseConnectionManager";

export function createMessageRouter() {
  const router = express.Router();

  router.post("/:pluginId/messages", async (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const payload = req.body?.payload;
      const senderClientId = String(req.headers["x-client-id"] || "").trim();
      const senderType = String(req.headers["x-plugin-type"] || "").trim().toLowerCase();
      if (!pluginId) {
        return res.status(400).json({ success: false, error: "MISSING_PLUGIN_ID" });
      }
      const connectionManager = PluginSseConnectionManager.getInstance();
      const messageKind = senderType === "main" ? "mainMessage" : "uiMessage";
      const message = { ts: Date.now(), pluginId, kind: messageKind, payload };
      let sent = 0;
      if (senderType === "main") {
        const hasUi = connectionManager.hasConnections(pluginId, "ui");
        const hasWindow = connectionManager.hasConnections(pluginId, "window");
        if (!hasUi && !hasWindow) {
          return res.status(404).json({ success: false, error: "NO_WINDOW_UI_CONNECTION" });
        }
        if (hasUi) sent += connectionManager.sendMessage(pluginId, "ui", message, senderClientId);
        if (hasWindow) sent += connectionManager.sendMessage(pluginId, "window", message, senderClientId);
      } else {
        const hasMain = connectionManager.hasConnections(pluginId, "main");
        if (hasMain) {
          sent = connectionManager.sendMessage(pluginId, "main", message, senderClientId);
        } else {
          return res.status(404).json({ success: false, error: "NO_MAIN_CONNECTION" });
        }
      }
      if (sent === 0) {
        return res.status(404).json({ success: false, error: "NO_RECIPIENTS" });
      }
      return res.json({ success: true, sent });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "INTERNAL_ERROR" });
    }
  });

  return router;
}





