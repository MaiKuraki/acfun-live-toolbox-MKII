/**
 * SSE 连接管理器：按插件 ID 和类型（ui/window/overlay/main）分组管理连接
 */
import type express from "express";
import { SseErrorReporter } from "./SseErrorReporter";

export type PluginSseType = "ui" | "window" | "overlay" | "main";

interface PluginSseConnection {
  pluginId: string;
  type: PluginSseType;
  clientId: string;
  response: express.Response;
  connectedAt: number;
  lastActivityAt: number;
  lastHeartbeatAt: number;
  droppedSinceLastOk: number;
}

export class PluginSseConnectionManager {
  private static instance: PluginSseConnectionManager;
  // Map<pluginId, Map<type, Map<clientId, connection>>>
  private connections: Map<string, Map<PluginSseType, Map<string, PluginSseConnection>>> = new Map();
  private sweeperStarted = false;
  private readonly reporter = SseErrorReporter.getInstance();

  public static getInstance(): PluginSseConnectionManager {
    if (!PluginSseConnectionManager.instance) {
      PluginSseConnectionManager.instance = new PluginSseConnectionManager();
    }
    return PluginSseConnectionManager.instance;
  }

  /**
   * 注册 SSE 连接
   * @param pluginId 插件 ID（必填）
   * @param type 插件类型（必填）
   * @param clientId 客户端 ID
   * @param response Express Response 对象
   * @returns 是否注册成功
   */
  public register(
    pluginId: string,
    type: PluginSseType,
    clientId: string,
    response: express.Response
  ): boolean {
    if (!pluginId || !type || !clientId) {
      return false;
    }

    // 检查同一插件ID的window和ui不可共存
    if (!this.connections.has(pluginId)) {
      this.connections.set(pluginId, new Map());
    }
    const pluginConnections = this.connections.get(pluginId)!;

    if (type === "window" && pluginConnections.has("ui")) {
      // window 和 ui 不能共存
      return false;
    }
    if (type === "ui" && pluginConnections.has("window")) {
      // window 和 ui 不能共存
      return false;
    }

    const now = Date.now();
    const conn: PluginSseConnection = {
      pluginId,
      type,
      clientId,
      response,
      connectedAt: now,
      lastActivityAt: now,
      lastHeartbeatAt: now,
      droppedSinceLastOk: 0,
    };

    if (!pluginConnections.has(type)) {
      pluginConnections.set(type, new Map());
    }
    const typeConnections = pluginConnections.get(type)!;

    typeConnections.set(clientId, conn);

    // 监听连接关闭
    response.on("close", () => {
      this.unregister(pluginId, type, clientId);
    });

    return true;
  }

  /**
   * 注销 SSE 连接
   */
  public unregister(pluginId: string, type: PluginSseType, clientId: string): void {
    const pluginConnections = this.connections.get(pluginId);
    if (!pluginConnections) return;

    const typeConnections = pluginConnections.get(type);
    if (!typeConnections) return;

    typeConnections.delete(clientId);

    // 清理空 Map
    if (typeConnections.size === 0) {
      pluginConnections.delete(type);
    }
    if (pluginConnections.size === 0) {
      this.connections.delete(pluginId);
    }
  }

  /**
   * 获取指定插件和类型的所有连接
   */
  public getConnections(pluginId: string, type: PluginSseType): PluginSseConnection[] {
    const pluginConnections = this.connections.get(pluginId);
    if (!pluginConnections) return [];

    const typeConnections = pluginConnections.get(type);
    if (!typeConnections) return [];

    return Array.from(typeConnections.values());
  }

  /**
   * 检查指定插件和类型是否有活跃连接
   */
  public hasConnections(pluginId: string, type: PluginSseType): boolean {
    return this.getConnections(pluginId, type).length > 0;
  }

  public getConnection(pluginId: string, type: PluginSseType, clientId: string): PluginSseConnection | undefined {
    const pluginConnections = this.connections.get(pluginId);
    const typeConnections = pluginConnections?.get(type);
    return typeConnections?.get(clientId);
  }

  /**
   * 向指定插件和类型的所有连接发送消息（排除发送者）
   */
  public markActivity(pluginId: string, type: PluginSseType, clientId: string): void {
    const conn = this.getConnection(pluginId, type, clientId);
    if (!conn) return;
    const now = Date.now();
    conn.lastActivityAt = now;
  }

  public markHeartbeat(pluginId: string, type: PluginSseType, clientId: string): void {
    const conn = this.getConnection(pluginId, type, clientId);
    if (!conn) return;
    const now = Date.now();
    conn.lastHeartbeatAt = now;
    conn.lastActivityAt = now;
  }

  public recordDrop(pluginId: string, type: PluginSseType, clientId: string): number {
    const conn = this.getConnection(pluginId, type, clientId);
    if (!conn) return 0;
    conn.droppedSinceLastOk += 1;
    return conn.droppedSinceLastOk;
  }

  public resetDrop(pluginId: string, type: PluginSseType, clientId: string): void {
    const conn = this.getConnection(pluginId, type, clientId);
    if (conn) conn.droppedSinceLastOk = 0;
  }

  public sendMessage(
    pluginId: string,
    type: PluginSseType,
    message: any,
    excludeClientId?: string,
    onError?: (conn: PluginSseConnection, error: unknown) => void
  ): number {
    const connections = this.getConnections(pluginId, type);
    let sent = 0;

    for (const conn of connections) {
      // 排除发送者自己
      if (excludeClientId && conn.clientId === excludeClientId) {
        continue;
      }

      try {
        // 使用消息中的 kind 作为 event 类型，如果没有则使用 "message"
        const kind = String(message?.kind || "message").toLowerCase();
        const data = JSON.stringify(message);
        if (conn.response.writableEnded || conn.response.writableFinished || (conn.response as any).destroyed) {
          throw new Error("response_closed");
        }
        conn.response.write(`event: ${kind}\n`);
        conn.response.write(`data: ${data}\n\n`);
        conn.lastActivityAt = Date.now();
        conn.droppedSinceLastOk = 0;
        sent++;
      } catch (e) {
        if (onError) onError(conn, e);
        this.reporter.warn("send_failed", {
          pluginId,
          type,
          clientId: conn.clientId,
          error: e,
        });
        this.unregister(pluginId, type, conn.clientId);
      }
    }

    return sent;
  }

  /**
   * 获取所有连接的统计信息
   */
  public getStats(): { pluginId: string; type: PluginSseType; count: number }[] {
    const stats: { pluginId: string; type: PluginSseType; count: number }[] = [];

    for (const [pluginId, pluginConnections] of this.connections.entries()) {
      for (const [type, typeConnections] of pluginConnections.entries()) {
        stats.push({
          pluginId,
          type,
          count: typeConnections.size,
        });
      }
    }

    return stats;
  }

  public sweepIdleConnections(idleMs: number): { closed: number } {
    const now = Date.now();
    let closed = 0;
    for (const [pluginId, pluginConnections] of this.connections.entries()) {
      for (const [type, typeConnections] of pluginConnections.entries()) {
        for (const [clientId, conn] of typeConnections.entries()) {
          const isClosed =
            conn.response.writableEnded ||
            conn.response.writableFinished ||
            (conn.response as any).destroyed ||
            (conn.response as any).closed;
          const isTimedOut = now - conn.lastHeartbeatAt > idleMs;
          if (isClosed || isTimedOut) {
            this.reporter.warn("connection_cleanup", {
              pluginId,
              type,
              clientId,
              reason: isClosed ? "socket_closed" : "heartbeat_timeout",
            });
            try {
              conn.response.end();
            } catch {}
            this.unregister(pluginId, type, clientId);
            closed += 1;
          }
        }
      }
    }
    return { closed };
  }

  public ensureSweeper(idleMs: number): void {
    if (this.sweeperStarted) return;
    this.sweeperStarted = true;
    setInterval(() => {
      try {
        const { closed } = this.sweepIdleConnections(idleMs);
        if (closed > 0) {
          this.reporter.warn("sse_sweep_closed", { reason: "idle_timeout", meta: { closed, idleMs } });
        }
      } catch (error) {
        this.reporter.error("sse_sweep_failed", { error });
      }
    }, Math.max(1000, Math.floor(idleMs / 2)));
  }

  /**
   * 关闭并注销指定插件的所有 SSE 连接（主动清理）
   * @returns 关闭的连接数量
   */
  public closePluginConnections(pluginId: string): number {
    const pluginConnections = this.connections.get(pluginId);
    if (!pluginConnections) return 0;

    let closed = 0;
    try {
      for (const [type, typeConnections] of pluginConnections.entries()) {
        for (const [clientId, conn] of Array.from(typeConnections.entries())) {
          try {
            // 尝试优雅结束响应
            try { conn.response.end(); } catch {}
          } catch {}
          try {
            this.unregister(pluginId, type, clientId);
          } catch {}
          closed += 1;
        }
      }
      this.reporter.info("plugin_connections_closed", { pluginId, count: closed });
    } catch (error) {
      this.reporter.warn("plugin_connections_close_failed", { pluginId, error });
    }

    return closed;
  }
}

