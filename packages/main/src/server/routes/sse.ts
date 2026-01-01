import type { ApiContext } from "./context";
import type express from "express";
import { SSE_HEARTBEAT_MS } from "../../config/config";
import { SseQueueService } from "../SseQueueService";
import PluginPageStatusManager from "../../persistence/PluginPageStatusManager";
import { overlaySubscriptionRegistry } from "../services/OverlaySubscriptionRegistry";
import { PluginSseConnectionManager, type PluginSseType } from "../services/PluginSseConnectionManager";
import { SseErrorReporter } from "../services/SseErrorReporter";

type PluginOverlaySseEnvelope = {
  /** Monotonic id used for SSE `id:` and Last-Event-ID replay */
  id?: string;
  /** Event timestamp (ms) */
  ts: number;
  pluginId: string;
  /** SSE event name; equals subscription kind */
  kind:
    | "init"
    | "heartbeat"
    | "message"
    | "mainMessage"
    | "uiMessage"
    | "update"
    | "closed"
    | "lifecycle"
    | "config"
    | "store"
    | "client"
    | "shortcut"
    | "room"
    | "danmaku"
    | (string & {});
  /** Business-level event name */
  event?: string;
  overlayId?: string;
  roomId?: string;
  payload?: any;
  meta?: any;
};

export function registerSse({ app, diagnosticsService, dataManager, overlayManager, getPluginManager }: ApiContext): void {
  const reporter = SseErrorReporter.getInstance();
  const connectionManager = PluginSseConnectionManager.getInstance();
  const HEARTBEAT_TIMEOUT_MS = SSE_HEARTBEAT_MS * 3;
  const BACKPRESSURE_DROP_LIMIT = 100;
  const rendererBridgeUnsub = new Map<string, () => void>();
  connectionManager.ensureSweeper(HEARTBEAT_TIMEOUT_MS);

  const ensureRendererBridge = (pluginId: string) => {
    if (rendererBridgeUnsub.has(pluginId)) return;
    const overlayChannel = `plugin:${pluginId}:overlay`;
    const controlChannel = `plugin:${pluginId}:control`;
    try {
      const unsub = dataManager.subscribe(overlayChannel, (rec: any) => {
        try {
          const kind = String(rec?.meta?.kind ?? "unknown").toLowerCase();
          if (kind !== "renderer") return;
          SseQueueService.getInstance().queueOrPublish(
            controlChannel,
            rec,
            { ttlMs: 5 * 60 * 1000, persist: true, meta: { ...(rec?.meta || {}), bridgedFrom: overlayChannel } }
          );
        } catch (error) {
          reporter.warn("renderer_bridge_failed", { pluginId, channel: overlayChannel, error });
        }
      }, undefined);
      rendererBridgeUnsub.set(pluginId, unsub);
    } catch (error) {
      reporter.warn("renderer_bridge_register_failed", { pluginId, error });
    }
  };

  const jsonError = (res: express.Response, status: number, code: string, message: string, meta?: Record<string, any>) => {
    return reporter.respondJson(res, status, code, message, { meta, status });
  };

  app.get("/sse/system/logs", (req: express.Request, res: express.Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    try { (res as any).flushHeaders?.(); } catch {}
    try { res.write(":\n\n"); } catch {}
    const channel = "system:logs";
    const send = (entry: any) => {
      try { res.write("event: log\n"); res.write(`data: ${JSON.stringify(entry)}\n\n`); } catch {}
    };
    try { const recent = diagnosticsService.getRecentLogs(200); res.write("event: init\n"); res.write(`data: ${JSON.stringify(recent)}\n\n`); } catch {}
    const unsubscribe = dataManager.subscribe(channel, send as any, undefined);
    const heartbeat = setInterval(() => { try { res.write("event: heartbeat\n"); res.write(`data: {"ts": ${Date.now()}}\n\n`); } catch {} }, SSE_HEARTBEAT_MS);
    const cleanup = () => { try { unsubscribe(); } catch {} try { clearInterval(heartbeat); } catch {} try { res.end(); } catch {} };
    req.on("close", cleanup);
  });

  // 统一的 SSE 端点：要求携带插件 ID 和类型
  app.get("/sse/plugins/:pluginId/:type", (req: express.Request, res: express.Response) => {
    const pluginId = String(req.params.pluginId || "").trim();
    const typeParam = String(req.params.type || "").trim().toLowerCase();

    // 验证插件 ID
    if (!pluginId) {
      return jsonError(res, 400, "MISSING_PLUGIN_ID", "pluginId is required");
    }

    // 验证插件类型
    if (typeParam !== "ui" && typeParam !== "window" && typeParam !== "overlay" && typeParam !== "main") {
      return jsonError(res, 400, "INVALID_PLUGIN_TYPE", `invalid type: ${typeParam} (must be ui, window, overlay, or main)`);
    }

    const type = typeParam as PluginSseType;

    // 验证插件是否启用
    try {
      const plugin = getPluginManager?.()?.getPlugin(pluginId);
      const isEnabled = plugin && plugin.status === "enabled" && plugin.enabled === true;
      if (!isEnabled) {
        return jsonError(res, 403, "PLUGIN_DISABLED", `plugin ${pluginId} is disabled`);
      }
    } catch (error) {
      reporter.warn("plugin_status_check_failed", { pluginId, type, error });
    }

    const lastEventId = (req.headers["last-event-id"] as string) || (req.query.lastEventId as string) || undefined;
    const clientId = String((req.query.clientId as string) || `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`);

    // 注册到连接管理器
    if (!connectionManager.register(pluginId, type, clientId, res)) {
      return jsonError(res, 409, "CONFLICT", "window and ui cannot coexist for the same plugin");
    }

    // 所有类型的 SSE 连接都需要注册到 overlaySubscriptionRegistry，以便 shortcut 等事件能正确过滤
    overlaySubscriptionRegistry.register(pluginId, clientId);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("x-overlay-client-id", clientId);
    try { (res as any).flushHeaders?.(); } catch (error) { reporter.warn("sse_flush_failed", { pluginId, type, clientId, error }); }
    try { res.write(`:\n\n`); } catch (error) { reporter.warn("sse_preamble_failed", { pluginId, type, clientId, error }); }

    // 统一使用 overlay channel，避免控制通道只转发 renderer 导致其他事件缺失
    const channel = `plugin:${pluginId}:overlay`;
    const readonlyStoreChannel = "renderer:readonly-store";
    if (channel) {
      try { SseQueueService.getInstance().markReady(channel); } catch (error) { reporter.warn("sse_mark_ready_failed", { pluginId, type, channel, error }); }
    }
    const statusManager = PluginPageStatusManager.getInstance();
    let heartbeat: NodeJS.Timeout;
    let unsubscribeOverlay: () => void;
    let unsubscribeStore: () => void;

    const extractRoomId = (kind: string, recordPayload: any): string | undefined => {
      if (!recordPayload) return undefined;
      const inner = recordPayload?.payload;
      const candidates = [inner?.room_id, inner?.roomId, recordPayload?.room_id, recordPayload?.roomId];
      const v = candidates.find((x) => x !== undefined && x !== null && String(x).trim().length > 0);
      if (v === undefined) return undefined;
      return String(v);
    };

    const cleanup = (reason: string) => {
      try { unsubscribeOverlay?.(); } catch {}
      try { unsubscribeStore?.(); } catch {}
      try { clearInterval(heartbeat); } catch {}
      try { res.end(); } catch {}
      try { statusManager.overlayClientDisconnected(pluginId, clientId); } catch {}
      try { overlaySubscriptionRegistry.unregister(pluginId, clientId); } catch {}
      try { connectionManager.unregister(pluginId, type, clientId); } catch {}
      reporter.warn("sse_cleanup", { pluginId, type, clientId, reason });
    };

    const safeWrite = (env: PluginOverlaySseEnvelope, bypassFilter = false): boolean => {
      const kind = String(env.kind || "unknown").toLowerCase();
      if (res.writableEnded || res.writableFinished || (res as any).destroyed) {
        cleanup("response_closed");
        return false;
      }
      if (!bypassFilter) {
        const allowed =
          type !== "overlay" && kind === "renderer"
            ? true
            :             overlaySubscriptionRegistry.shouldDeliver(pluginId, clientId, {
              kind,
              roomId: env.roomId,
              event: env.event,
              payload: env.payload,
            });
        if (!allowed) return false;
      }
      if ((res as any).writableNeedDrain) {
        const drops = connectionManager.recordDrop(pluginId, type, clientId);
        reporter.warn("sse_backpressure_drop", { pluginId, type, clientId, channel, event: kind, meta: { drops } });
        if (drops > BACKPRESSURE_DROP_LIMIT) {
          reporter.error("sse_backpressure_close", { pluginId, type, clientId, channel, event: kind, meta: { drops } });
          cleanup("backpressure");
        }
        return false;
      }
      try {
        if ((env as any)?.id) res.write(`id: ${(env as any).id}\n`);
        res.write(`event: ${kind}\n`);
        res.write(`data: ${JSON.stringify(env)}\n\n`);
        connectionManager.resetDrop(pluginId, type, clientId);
        connectionManager.markActivity(pluginId, type, clientId);
        return true;
      } catch (error) {
        reporter.error("sse_send_failed", { pluginId, type, clientId, channel, event: kind, error });
        cleanup("send_failed");
        return false;
      }
    };

    const writeEnvelope = (env: PluginOverlaySseEnvelope, bypassFilter = false) => safeWrite(env, bypassFilter);

    // Handshake: return clientId to caller
    writeEnvelope({ ts: Date.now(), pluginId, kind: "client", payload: { clientId } } as any, true);

    const sendRecord = (rec: any) => {
      try {
        const kind = String((rec?.meta && rec.meta.kind) || "unknown").toLowerCase();
        const recordPayload = rec?.payload;
        // 检查消息的发送者 clientId，如果是当前连接的 clientId，则不推送（避免回传给自己）
        // senderClientId 在 recordPayload 的顶层（与 payload 同级）
        const senderClientId = recordPayload?.senderClientId;
        if (senderClientId && String(senderClientId) === String(clientId)) {
          return; // 不推送发送者自己的消息
        }
        const event = typeof recordPayload?.event === "string" ? recordPayload.event : undefined;
        const overlayId = typeof recordPayload?.overlayId === "string" ? recordPayload.overlayId : undefined;
        const roomId = extractRoomId(kind, recordPayload);
        
        let finalPayload: any;
        if (kind === "renderer" && recordPayload && typeof recordPayload === "object") {
          // For renderer events, recordPayload is { event, payload }
          // We want env.payload to be the inner payload
          finalPayload = recordPayload.payload;
        } else {
          // For other types, use the existing logic
          finalPayload = recordPayload && Object.prototype.hasOwnProperty.call(recordPayload, "payload") 
            ? recordPayload.payload 
            : (recordPayload?.payload || recordPayload);
        }
        
        writeEnvelope({
          id: typeof rec?.id === "string" ? rec.id : undefined,
          ts: typeof rec?.createdAt === "number" ? rec.createdAt : Date.now(),
          pluginId,
          kind,
          event,
          overlayId,
          roomId,
          payload: finalPayload,
          meta: rec?.meta,
        });
      } catch (e) {
        reporter.error("[ApiServer] SSE(plugin overlay) send failed:", { pluginId, type, clientId, error: e });
      }
    };

    const sendStoreRecord = (rec: any) => {
      try {
        const payload = (rec && rec.payload) || rec;
        const dataObj = payload && payload.payload ? { ...(payload.payload || {}) } : {};
        const filtered = overlaySubscriptionRegistry.filterStorePayload(pluginId, clientId, dataObj);
        if (!filtered) return;
        writeEnvelope({
          id: typeof rec?.id === "string" ? rec.id : undefined,
          ts: typeof rec?.createdAt === "number" ? rec.createdAt : Date.now(),
          pluginId,
          kind: "store",
          payload: filtered,
          meta: { kind: "store" },
        });
      } catch (e) {
        reporter.error("store_bridge_send_failed", { pluginId, type, clientId, error: e });
      }
    };

    const sendStoreSnapshotIfNeeded = () => {
      try {
        const sub = overlaySubscriptionRegistry.get(pluginId, clientId);
        if (!sub || sub.storeKeys.size === 0) return;
        const recent = dataManager.getRecent(readonlyStoreChannel) || [];
        const snapshot: Record<string, any> = {};
        for (const rec of recent) {
          const outer = (rec && (rec.payload ?? rec)) as any;
          const data = outer && (outer.payload ?? outer);
          if (!data || typeof data !== "object" || Array.isArray(data)) continue;
          for (const key of Object.keys(data)) {
            const val = (data as any)[key];
            if (val === undefined) continue;
            snapshot[key] = val;
          }
        }
        if ("plugin" in snapshot) delete (snapshot as any).plugin;
        const filtered = overlaySubscriptionRegistry.filterStorePayload(pluginId, clientId, snapshot);
        if (!filtered) return;
        writeEnvelope({
          ts: Date.now(),
          pluginId,
          kind: "store",
          payload: filtered,
          meta: { kind: "store" },
        });
      } catch (error) {
        reporter.warn("store_snapshot_send_failed", { pluginId, type, clientId, error });
      }
    };

    try {
      const overlaysSource = overlayManager.getAllOverlays().filter((o) => o.pluginId === pluginId);
      let overlays = overlaysSource;
      try {
        const cfg = new (require("../../config/ConfigManager").ConfigManager)();
        const conf = (cfg.get(`plugins.${pluginId}.config`, {}) || {}) as Record<string, any>;
        const desiredBg = typeof conf.uiBgColor === "string" ? conf.uiBgColor : undefined;
        if (desiredBg) overlays = overlaysSource.map((o) => (o?.style?.backgroundColor ? o : { ...o, style: { ...(o.style || {}), backgroundColor: desiredBg } }));
      } catch {}
      writeEnvelope({
        ts: Date.now(),
        pluginId,
        kind: "init",
        payload: { overlays },
      }, true);
    } catch {}

    // overlay 类型订阅 overlay channel 和 store；ui/window/main 也会订阅 overlay + readonly-store（由 storeKeys 决定是否推送）
    if (type === "overlay") {
      try {
        let recent = dataManager.getRecent(channel!, lastEventId).filter((r: any) => {
          const kind = String(r?.meta?.kind ?? "unknown").toLowerCase();
          const recordPayload = r?.payload;
          const roomId = extractRoomId(kind, recordPayload);
          return overlaySubscriptionRegistry.shouldDeliver(pluginId, clientId, {
            kind,
            roomId,
            event: typeof recordPayload?.event === "string" ? recordPayload.event : undefined,
            payload: recordPayload && (recordPayload.payload ?? recordPayload),
          });
        });
        if (!lastEventId) {
          const picked: any[] = []; const seen = new Set<string>();
          for (let i = recent.length - 1; i >= 0; i--) { const k = String(recent[i]?.meta?.kind ?? "unknown").toLowerCase(); if (!seen.has(k)) { seen.add(k); picked.push(recent[i]); } }
          recent = picked.reverse();
        }
        for (const rec of recent) sendRecord(rec);
      } catch (error) {
        reporter.warn("replay_recent_failed", { pluginId, type, clientId, error });
      }

      // Store snapshot (if subscribed)
      sendStoreSnapshotIfNeeded();

      unsubscribeOverlay = dataManager.subscribe(channel!, sendRecord as any, undefined);
      unsubscribeStore = dataManager.subscribe(readonlyStoreChannel, sendStoreRecord as any, undefined);
    } else {
      // ui/window/main 使用 overlay channel 但按订阅过滤（含 danmaku/store/config/renderer 等）
      try {
        let recent = (dataManager.getRecent(channel, lastEventId) || []).filter((r: any) => {
          const kind = String(r?.meta?.kind ?? "unknown").toLowerCase();
          const recordPayload = r?.payload;
          const roomId = extractRoomId(kind, recordPayload);
          return overlaySubscriptionRegistry.shouldDeliver(pluginId, clientId, {
            kind,
            roomId,
            event: typeof recordPayload?.event === "string" ? recordPayload.event : undefined,
            payload: recordPayload && (recordPayload.payload ?? recordPayload),
          });
        });
        if (!lastEventId) {
          const picked: any[] = []; const seen = new Set<string>();
          for (let i = recent.length - 1; i >= 0; i--) {
            const rec = recent[i];
            const kind = String(rec?.meta?.kind ?? "unknown").toLowerCase();
            const event = rec?.payload?.event || rec?.payload?.payload?.event;
            const key = event ? `${kind}:${event}` : kind;
            if (!seen.has(key)) {
              seen.add(key);
              picked.push(rec);
            }
          }
          recent = picked.reverse();
        }
        for (const rec of recent) sendRecord(rec);
      } catch (error) {
        reporter.warn("replay_renderer_failed", { pluginId, type, clientId, error });
      }

      unsubscribeOverlay = dataManager.subscribe(channel, sendRecord as any, undefined);
      // 始终订阅 readonly-store 渠道，实际是否推送由 storeKeys + filterStorePayload 决定
      unsubscribeStore = dataManager.subscribe(readonlyStoreChannel, sendStoreRecord as any, undefined);
    }
    try { statusManager.overlayClientConnected(pluginId, clientId); } catch {}
    heartbeat = setInterval(() => {
      const now = Date.now();
      writeEnvelope({
        ts: now,
        pluginId,
        kind: "heartbeat",
        payload: { ts: now },
      }, true);
      connectionManager.markHeartbeat(pluginId, type, clientId);
      try { statusManager.overlayClientHeartbeat(pluginId, clientId); } catch {}
    }, SSE_HEARTBEAT_MS);
    req.on("close", () => cleanup("client_close"));
  });

  const publishOverlayMessage = (msg: any) => {
    try {
      const ov = msg?.overlayId ? overlayManager.getOverlay(msg.overlayId) : undefined;
      const pluginId = ov?.pluginId || "unknown";
      const channel = `plugin:${pluginId}:overlay`;
      try {
        if ((dataManager as any).hasSubscribers(channel)) {
          reporter.info("publish_overlay_message", { pluginId, channel, meta: { overlayId: msg?.overlayId, event: msg?.event } });
        }
      } catch (error) {
        reporter.warn("publish_overlay_message_detect_failed", { pluginId, channel, error });
      }
      try {
        // overlay-message 是从 UI/Window 发送的，使用 uiMessage
        SseQueueService.getInstance().queueOrPublish(channel, msg, { ttlMs: 5 * 60 * 1000, persist: true, meta: { kind: "uiMessage" } });
      } catch (error) {
        reporter.warn("publish_overlay_message_failed", { pluginId, channel, error });
      }
    } catch (e) {
      reporter.error("publish_overlay_message_failed", { error: e });
    }
  };

  const publishOverlayUpdated = (ov: any) => {
    try {
      if (!ov || !ov.id) return;
      const pluginId = ov?.pluginId || "unknown";
      const channel = `plugin:${pluginId}:overlay`;
      try {
        if ((dataManager as any).hasSubscribers(channel)) {
          reporter.info("publish_overlay_updated", { pluginId, channel, meta: { overlayId: ov?.id } });
        }
      } catch (error) {
        reporter.warn("publish_overlay_updated_detect_failed", { pluginId, channel, error });
      }
      try {
        SseQueueService.getInstance().queueOrPublish(channel, { overlayId: ov.id, event: "overlay-updated", payload: ov }, { ttlMs: 5 * 60 * 1000, persist: true, meta: { kind: "update" } });
      } catch (error) {
        reporter.warn("publish_overlay_updated_failed", { pluginId, channel, error });
      }
    } catch (e) {
      reporter.error("publish_overlay_updated_failed", { error: e });
    }
  };

  const publishOverlayClosed = (overlayId: string) => {
    try {
      const ov = overlayManager.getOverlay(overlayId);
      const pluginId = ov?.pluginId || "unknown";
      const channel = `plugin:${pluginId}:overlay`;
      try {
        if ((dataManager as any).hasSubscribers(channel)) {
          reporter.info("publish_overlay_closed", { pluginId, channel, meta: { overlayId } });
        }
      } catch (error) {
        reporter.warn("publish_overlay_closed_detect_failed", { pluginId, channel, error });
      }
      try {
        SseQueueService.getInstance().queueOrPublish(channel, { overlayId, event: "overlay-closed" }, { ttlMs: 60 * 1000, persist: true, meta: { kind: "closed" } });
      } catch (error) {
        reporter.warn("publish_overlay_closed_failed", { pluginId, channel, error });
      }
    } catch (e) {
      reporter.error("publish_overlay_closed_failed", { error: e });
    }
  };

  
  overlayManager.on("overlay-message", publishOverlayMessage as any);
  overlayManager.on("overlay-updated", publishOverlayUpdated as any);
  overlayManager.on("overlay-closed", publishOverlayClosed as any);
  // 发送消息到 overlay（使用新的连接管理器）
  app.post(
    "/api/plugins/:pluginId/overlay/messages",
    async (req: express.Request, res: express.Response) => {
      const pluginId = String(req.params.pluginId || "").trim();
      const { overlayId, payload } = (req.body || {}) as {
        overlayId?: string;
        payload?: any;
      };
      
      // 从请求头获取发送者的 clientId 和类型（用于排除自己和验证权限）
      const senderClientId = String(req.headers["x-client-id"] || "").trim();
      const senderType = String(req.headers["x-plugin-type"] || "").trim().toLowerCase();

      if (!pluginId) {
        return jsonError(res, 400, "MISSING_PLUGIN_ID", "pluginId is required");
      }

      // overlay 不能发送消息
      if (senderType === "overlay") {
        return jsonError(res, 403, "OVERLAY_CANNOT_SEND_MESSAGES", "overlay cannot send overlay messages");
      }

      // 只有 window/ui/main 可以向 overlay 发送消息
      if (senderType !== "window" && senderType !== "ui" && senderType !== "main") {
        return jsonError(res, 403, "INVALID_SENDER_TYPE", "sender type must be window/ui/main");
      }

      const connectionManager = PluginSseConnectionManager.getInstance();
      
      // 检查是否有活跃的 overlay 连接
      if (!connectionManager.hasConnections(pluginId, "overlay")) {
        return jsonError(res, 404, "NO_OVERLAY_CONNECTION", "overlay is not connected");
      }

      // 校验 senderClientId 是否存在于声明的类型
      if (senderClientId) {
        const senderConn = connectionManager.getConnection(pluginId, senderType as PluginSseType, senderClientId);
        if (!senderConn) {
          return jsonError(res, 403, "SENDER_NOT_CONNECTED", "sender clientId/type not connected", {
            pluginId,
            senderClientId,
            senderType,
          });
        }
      }

      try {
        // 根据发送者类型确定消息 kind
        const messageKind = senderType === "main" ? "mainMessage" : "uiMessage";
        
        // 检查是否有 overlay 订阅了该 kind
        const hasSubscription = overlaySubscriptionRegistry.hasSubscription(pluginId, messageKind);
        if (!hasSubscription) {
          // 如果没有订阅，直接返回成功（消息被丢弃）
          return res.json({ success: true, sent: 0, message: "NO_SUBSCRIPTIONS" });
        }
        
        // 构建消息
        const message: PluginOverlaySseEnvelope = {
          ts: Date.now(),
          pluginId,
          kind: messageKind,
          overlayId: overlayId ? String(overlayId).trim() : undefined,
          payload,
        };

        // 将上行消息送入队列，复用统一的 SSE 分发与订阅过滤
        const channel = `plugin:${pluginId}:overlay`;
        try {
          SseQueueService.getInstance().queueOrPublish(channel, { ...message, senderClientId }, {
            ttlMs: 5 * 60 * 1000,
            persist: true,
            meta: { kind: messageKind, senderClientId, overlayId: message.overlayId },
          });
        } catch (error) {
          reporter.error("overlay_queue_failed", { pluginId, channel, error });
          return jsonError(res, 500, "QUEUE_FAILED", "failed to enqueue overlay message");
        }

        return res.json({ success: true, sent: 1, channel });
      } catch (error: any) {
        reporter.error("overlay_message_failed", { pluginId, error });
        return jsonError(res, 500, "SEND_FAILED", error?.message || "send overlay message failed");
      }
    }
  );
}
