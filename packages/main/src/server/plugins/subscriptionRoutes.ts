import express from "express";
import { allowedDanmakuLower, rendererAllowedEvents, messageAllowedKinds } from "./constants";
import { overlaySubscriptionRegistry } from "../services/OverlaySubscriptionRegistry";

export function createSubscriptionRouter() {
  const router = express.Router();

  router.post("/:pluginId/subscribe/danmaku", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const clientId = String(req.body?.clientId || "").trim();
      if (!pluginId || !clientId) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });

      const rulesRaw = Array.isArray(req.body?.rules) ? req.body.rules : [];
      const normalized: { roomId: string; types: string[] }[] = [];

      for (const r of rulesRaw) {
        const roomId = String(r?.roomId || "").trim();
        if (!roomId) continue;
        const types: string[] = Array.isArray(r?.types) ? r.types : [];
        const wildcard = types.length === 1 && types[0] === "*";
        if (types.includes("*") && !wildcard) {
          return res.status(400).json({ success: false, error: "INVALID_TYPES", allowed: Array.from(allowedDanmakuLower) });
        }
        const normalizedTypes = types.map((t: any) => String(t || "").trim()).filter(Boolean);
        if (!wildcard && normalizedTypes.length > 0) {
          const invalid = normalizedTypes.filter((t) => !allowedDanmakuLower.has(t.toLowerCase()));
          if (invalid.length > 0) {
            return res.status(400).json({ success: false, error: "INVALID_TYPES", allowed: Array.from(allowedDanmakuLower) });
          }
        }
        normalized.push({ roomId, types: wildcard ? ["*"] : normalizedTypes });
      }

      const roomIds = Array.from(new Set(normalized.map((r) => r.roomId).filter(Boolean)));
      const current = overlaySubscriptionRegistry.get(pluginId, clientId);
      const kindsSet = new Set<string>(current?.kinds ?? []);
      if (roomIds.length > 0) {
        kindsSet.add("danmaku");
      } else {
        kindsSet.delete("danmaku");
      }
      overlaySubscriptionRegistry.applyUpdate(pluginId, clientId, { kinds: Array.from(kindsSet) }, true);
      overlaySubscriptionRegistry.setDanmakuRules(pluginId, clientId, normalized);
      res.json({ success: true, data: { clientId, rules: normalized } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.post("/:pluginId/unsubscribe/danmaku", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const clientId = String(req.body?.clientId || "").trim();
      if (!pluginId || !clientId) {
        return res.status(400).json({ success: false, error: "INVALID_PARAMS" });
      }

      const roomIdsRaw = Array.isArray(req.body?.roomIds) ? req.body.roomIds : [];
      const roomIds = roomIdsRaw.map((r: any) => String(r || "").trim()).filter(Boolean);

      const current = overlaySubscriptionRegistry.get(pluginId, clientId);
      if (!current) {
        return res.json({ success: true, data: { clientId, roomIds: [] } });
      }

      const updated = overlaySubscriptionRegistry.removeDanmakuRooms(pluginId, clientId, roomIds);
      const kindsSet = new Set<string>(Array.from(current.kinds || []));
      if (updated.danmakuRules.length === 0) {
        kindsSet.delete("danmaku");
      } else {
        kindsSet.add("danmaku");
      }
      overlaySubscriptionRegistry.applyUpdate(pluginId, clientId, { kinds: Array.from(kindsSet) }, true);
      res.json({ success: true, data: { clientId, roomIds: updated.danmakuRules.map((r) => r.roomId) } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.post("/:pluginId/subscribe/store", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const clientId = String(req.body?.clientId || "").trim();
      if (!pluginId || !clientId) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });
      const keysRaw = Array.isArray(req.body?.keys) ? req.body.keys : [];
      const keys = keysRaw.map((k: any) => String(k || "").trim()).filter(Boolean);
      const wildcard = keys.length === 1 && keys[0] === "*";
      if (keys.includes("*") && !wildcard) {
        return res.status(400).json({ success: false, error: "INVALID_KEYS", allowed: ["*"] });
      }

      overlaySubscriptionRegistry.applyUpdate(pluginId, clientId, { storeKeys: keys }, true);
      const snapshot = req.body?.includeSnapshot ? null : null;
      res.json({
        success: true,
        data: {
          clientId,
          keys: Array.from(overlaySubscriptionRegistry.get(pluginId, clientId)?.storeKeys || []),
          storeSnapshot: snapshot,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.post("/:pluginId/unsubscribe/store", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const clientId = String(req.body?.clientId || "").trim();
      if (!pluginId || !clientId) {
        return res.status(400).json({ success: false, error: "INVALID_PARAMS" });
      }
      overlaySubscriptionRegistry.applyUpdate(pluginId, clientId, { storeKeys: [] }, true);
      res.json({ success: true, data: { clientId, keys: [] } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.post("/:pluginId/subscribe/renderer", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const clientId = String(req.body?.clientId || "").trim();
      if (!pluginId || !clientId) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });
      const eventsRaw = Array.isArray(req.body?.events) ? req.body.events : [];
      const events = eventsRaw.map((e: any) => String(e || "").trim()).filter(Boolean);
      const wildcard = events.length === 1 && events[0] === "*";
      if (events.includes("*") && !wildcard) {
        return res.status(400).json({ success: false, error: "INVALID_EVENTS", allowed: rendererAllowedEvents });
      }
      if (!wildcard && events.length > 0) {
        const invalid = events.filter((e: string) => !rendererAllowedEvents.includes(e));
        if (invalid.length > 0) {
          return res.status(400).json({ success: false, error: "INVALID_EVENTS", allowed: rendererAllowedEvents });
        }
      }

      const current = overlaySubscriptionRegistry.get(pluginId, clientId);
      const kindsSet = new Set<string>(current?.kinds ?? []);
      const hasSubscription = wildcard || events.length > 0;
      if (hasSubscription) {
        kindsSet.add("renderer");
      } else {
        kindsSet.delete("renderer");
      }
      overlaySubscriptionRegistry.applyUpdate(pluginId, clientId, { kinds: Array.from(kindsSet) }, true);
      res.json({ success: true, data: { clientId, events } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.post("/:pluginId/unsubscribe/renderer", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const clientId = String(req.body?.clientId || "").trim();
      if (!pluginId || !clientId) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });
      const current = overlaySubscriptionRegistry.get(pluginId, clientId);
      const kindsSet = new Set<string>(Array.from(current?.kinds || []));
      kindsSet.delete("renderer");
      overlaySubscriptionRegistry.applyUpdate(pluginId, clientId, { kinds: Array.from(kindsSet) }, true);
      res.json({ success: true, data: { clientId } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.post("/:pluginId/subscribe/config", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const clientId = String(req.body?.clientId || "").trim();
      if (!pluginId || !clientId) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });
      const current = overlaySubscriptionRegistry.get(pluginId, clientId);
      const kindsSet = new Set<string>(current?.kinds ?? []);
      kindsSet.add("config");
      overlaySubscriptionRegistry.applyUpdate(pluginId, clientId, { kinds: Array.from(kindsSet) }, true);
      res.json({ success: true, data: { clientId } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.post("/:pluginId/unsubscribe/config", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const clientId = String(req.body?.clientId || "").trim();
      if (!pluginId || !clientId) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });
      const current = overlaySubscriptionRegistry.get(pluginId, clientId);
      const kindsSet = new Set<string>(Array.from(current?.kinds || []));
      kindsSet.delete("config");
      overlaySubscriptionRegistry.applyUpdate(pluginId, clientId, { kinds: Array.from(kindsSet) }, true);
      res.json({ success: true, data: { clientId } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.post("/:pluginId/subscribe/messages", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const clientId = String(req.body?.clientId || "").trim();
      if (!pluginId || !clientId) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });
      const kindsRaw = Array.isArray(req.body?.kinds) ? req.body.kinds : [];
      const kinds = kindsRaw.map((k: any) => String(k || "").trim()).filter(Boolean);
      const wildcard = kinds.length === 1 && kinds[0] === "*";
      if (kinds.includes("*") && !wildcard) {
        return res.status(400).json({ success: false, error: "INVALID_KINDS", allowed: messageAllowedKinds });
      }
      if (!wildcard && kinds.length > 0) {
        const invalid = kinds.filter((k: string) => !messageAllowedKinds.includes(k));
        if (invalid.length > 0) {
          return res.status(400).json({ success: false, error: "INVALID_KINDS", allowed: messageAllowedKinds });
        }
      }

      const current = overlaySubscriptionRegistry.get(pluginId, clientId);
      const kindsSet = new Set<string>(current?.kinds ?? []);
      const messageKindsSet = new Set(messageAllowedKinds.map((k) => k.toLowerCase()));
      for (const existing of Array.from(kindsSet)) {
        if (messageKindsSet.has(existing.toLowerCase())) {
          kindsSet.delete(existing);
        }
      }
      kinds.forEach((k: string) => kindsSet.add(k));
      overlaySubscriptionRegistry.applyUpdate(pluginId, clientId, { kinds: Array.from(kindsSet) }, true);
      res.json({ success: true, data: { clientId, kinds } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  router.post("/:pluginId/unsubscribe/messages", (req: express.Request, res: express.Response) => {
    try {
      const pluginId = String(req.params.pluginId || "").trim();
      const clientId = String(req.body?.clientId || "").trim();
      if (!pluginId || !clientId) return res.status(400).json({ success: false, error: "INVALID_PARAMS" });
      const kindsRaw = Array.isArray(req.body?.kinds) ? req.body.kinds : [];
      const kinds = kindsRaw.map((k: any) => String(k || "").trim()).filter(Boolean);
      const current = overlaySubscriptionRegistry.get(pluginId, clientId);
      const kindsSet = new Set<string>(Array.from(current?.kinds || []));
      const messageKindsSet = new Set(messageAllowedKinds.map((k) => k.toLowerCase()));
      if (kinds.length === 0) {
        for (const existing of Array.from(kindsSet)) {
          if (messageKindsSet.has(existing.toLowerCase())) {
            kindsSet.delete(existing);
          }
        }
      } else {
        kinds.forEach((k: string) => {
          const key = String(k || "").trim();
          if (messageKindsSet.has(key.toLowerCase())) {
            kindsSet.delete(key);
          }
        });
      }
      overlaySubscriptionRegistry.applyUpdate(pluginId, clientId, { kinds: Array.from(kindsSet) }, true);
      res.json({ success: true, data: { clientId, kinds: Array.from(kindsSet) } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}


