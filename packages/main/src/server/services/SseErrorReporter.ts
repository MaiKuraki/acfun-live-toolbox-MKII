import type express from "express";
import { randomUUID } from "crypto";

type Level = "info" | "warn" | "error";

export interface SseErrorContext {
  pluginId?: string;
  type?: string;
  channel?: string;
  clientId?: string;
  event?: string;
  status?: number;
  reason?: string;
  traceId?: string;
  error?: unknown;
  meta?: Record<string, any>;
}

/**
 * 轻量级的 SSE 错误与观测上报器，统一结构化日志与可扩展指标钩子。
 * 目前默认输出到 console，后续可接入外部告警/metrics。
 */
export class SseErrorReporter {
  private static instance: SseErrorReporter;

  public static getInstance(): SseErrorReporter {
    if (!SseErrorReporter.instance) SseErrorReporter.instance = new SseErrorReporter();
    return SseErrorReporter.instance;
  }

  public info(event: string, ctx: SseErrorContext = {}): void {
    this.log("info", event, ctx);
  }

  public warn(event: string, ctx: SseErrorContext = {}): void {
    this.log("warn", event, ctx);
  }

  public error(event: string, ctx: SseErrorContext = {}): void {
    this.log("error", event, ctx);
  }

  public respondJson(
    res: express.Response,
    status: number,
    code: string,
    message: string,
    ctx: SseErrorContext = {}
  ): { traceId: string } {
    const traceId = ctx.traceId ?? randomUUID();
    const body = {
      success: false,
      error: code,
      message,
      traceId,
      meta: this.minifyMeta(ctx.meta),
    };
    res.status(status);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    try {
      res.json(body);
    } catch (err) {
      this.error("respond_json_failed", { ...ctx, status, error: err, traceId });
    }
    this.log(status >= 500 ? "error" : "warn", "respond_error", {
      ...ctx,
      status,
      reason: code,
      traceId,
    });
    return { traceId };
  }

  private log(level: Level, event: string, ctx: SseErrorContext): void {
    const traceId = ctx.traceId ?? randomUUID();
    const payload = {
      event,
      traceId,
      pluginId: ctx.pluginId,
      type: ctx.type,
      channel: ctx.channel,
      clientId: ctx.clientId,
      status: ctx.status,
      reason: ctx.reason,
      meta: this.minifyMeta(ctx.meta),
    };
    const err = ctx.error as any;
    const msg = err?.message || err?.toString?.() || undefined;
    const stack = err?.stack;
    const logArgs = [`[SSE] ${event}`, payload];
    if (msg) logArgs.push(msg);
    if (stack) logArgs.push(stack);
    // eslint-disable-next-line no-console
    (console as any)[level](...logArgs);
  }

  private minifyMeta(meta?: Record<string, any>): Record<string, any> | undefined {
    if (!meta || Object.keys(meta).length === 0) return undefined;
    // 避免日志过大
    const cloned: Record<string, any> = {};
    for (const [k, v] of Object.entries(meta)) {
      cloned[k] = typeof v === "string" && v.length > 500 ? `${v.slice(0, 497)}...` : v;
    }
    return cloned;
  }
}





























