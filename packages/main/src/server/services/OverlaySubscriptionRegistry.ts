type DanmakuRule = {
  roomId: string;
  /**
   * 事件类型数组，结构与前端 /subscribe/danmaku 传入保持一致：
   * - ['*'] 订阅该房间的所有类型
   * - []   不推送该房间任何 danmaku
   * - 其他：对 payload.type / payload.event_type 做白名单过滤
   */
  types: string[];
};

type OverlaySubscription = {
  kinds: Set<string>;
  storeKeys: Set<string>;
  // 不同 roomId 的 danmaku 规则列表
  danmakuRules: DanmakuRule[];
  createdAt: number;
  updatedAt: number;
};

type UpdatePayload = {
  kinds?: string[]; // replace if provided
  storeKeys?: string[]; // replace if provided
};

/**
 * Manages per-plugin/per-client overlay subscriptions (kinds, store keys, room filters).
 * This enables SSE connections to stay stable while filters are adjusted via HTTP APIs.
 */
export class OverlaySubscriptionRegistry {
  private static instance: OverlaySubscriptionRegistry;
  private subs: Map<string, Map<string, OverlaySubscription>> = new Map();

  public static getInstance(): OverlaySubscriptionRegistry {
    if (!OverlaySubscriptionRegistry.instance) {
      OverlaySubscriptionRegistry.instance = new OverlaySubscriptionRegistry();
    }
    return OverlaySubscriptionRegistry.instance;
  }

  private ensure(pluginId: string, clientId: string): OverlaySubscription {
    const now = Date.now();
    let byPlugin = this.subs.get(pluginId);
    if (!byPlugin) {
      byPlugin = new Map();
      this.subs.set(pluginId, byPlugin);
    }
    let sub = byPlugin.get(clientId);
    if (!sub) {
      sub = {
        kinds: new Set(),
        storeKeys: new Set(),
        danmakuRules: [],
        createdAt: now,
        updatedAt: now,
      };
      byPlugin.set(clientId, sub);
    }
    return sub;
  }

  public register(
    pluginId: string,
    clientId: string,
    defaults?: Partial<UpdatePayload>
  ): OverlaySubscription {
    const sub = this.ensure(pluginId, clientId);
    this.applyUpdate(pluginId, clientId, defaults || {}, true);
    return sub;
  }

  public unregister(pluginId: string, clientId: string): void {
    const byPlugin = this.subs.get(pluginId);
    if (!byPlugin) return;
    byPlugin.delete(clientId);
    if (byPlugin.size === 0) this.subs.delete(pluginId);
  }

  public get(pluginId: string, clientId: string): OverlaySubscription | undefined {
    const byPlugin = this.subs.get(pluginId);
    if (!byPlugin) return undefined;
    return byPlugin.get(clientId);
  }

  /**
   * Replace provided fields (kinds/storeKeys) with new sets.
   * If `skipEmptyReplace` is true, undefined fields are left untouched.
   */
  public applyUpdate(
    pluginId: string,
    clientId: string,
    payload: UpdatePayload,
    skipEmptyReplace = false
  ): OverlaySubscription {
    const sub = this.ensure(pluginId, clientId);
    const now = Date.now();

    if (payload.kinds || !skipEmptyReplace) {
      sub.kinds = new Set(
        (payload.kinds || []).map((k) => String(k || "").trim().toLowerCase()).filter(Boolean)
      );
    }

    if (payload.storeKeys || !skipEmptyReplace) {
      sub.storeKeys = new Set(
        (payload.storeKeys || []).map((k) => String(k || "").trim()).filter(Boolean)
      );
    }

    sub.updatedAt = now;
    return sub;
  }

  /**
   * 覆盖指定插件+客户端的 danmaku 规则。
   * - rules 中每个 roomId 会被写入一条记录
   * - types 为空数组：表示该房间不接收任何 danmaku
   * - types 包含 "*"：表示该房间接收所有类型
   */
  public setDanmakuRules(
    pluginId: string,
    clientId: string,
    rules: { roomId: string; types: string[] }[]
  ): OverlaySubscription {
    const sub = this.ensure(pluginId, clientId);
    const now = Date.now();

    const byRoom = new Map<string, string[]>();
    for (const r of rules || []) {
      const roomId = String(r?.roomId || "").trim();
      if (!roomId) continue;
      const rawTypes: any[] = Array.isArray(r?.types) ? r.types : [];
      const types = rawTypes.map((t) => String(t || "").trim()).filter((t) => t.length > 0 || rawTypes.length === 0);
      // 同一 roomId 多次出现时，以最后一条为准
      byRoom.set(roomId, types);
    }

    sub.danmakuRules = Array.from(byRoom.entries()).map(([roomId, types]) => ({ roomId, types }));
    sub.updatedAt = now;
    return sub;
  }

  /**
   * 从指定客户端的 danmaku 规则中移除若干房间。
   */
  public removeDanmakuRooms(
    pluginId: string,
    clientId: string,
    roomIds: string[]
  ): OverlaySubscription {
    const sub = this.ensure(pluginId, clientId);
    const now = Date.now();

    const targets =
      roomIds && roomIds.length > 0
        ? new Set(roomIds.map((k) => String(k || "").trim()).filter(Boolean))
        : null;

    if (!targets) {
      sub.danmakuRules = [];
    } else {
      sub.danmakuRules = sub.danmakuRules.filter((r) => !targets.has(r.roomId));
    }

    sub.updatedAt = now;
    return sub;
  }

  /**
   * Remove selected entries; if fields are omitted, clear them.
   */
  public removeEntries(
    pluginId: string,
    clientId: string,
    payload: UpdatePayload
  ): OverlaySubscription {
    const sub = this.ensure(pluginId, clientId);
    const now = Date.now();

    if (payload.kinds) {
      if (payload.kinds.length === 0) sub.kinds.clear();
      payload.kinds.forEach((k) => sub.kinds.delete(String(k || "").trim().toLowerCase()));
    }
    if (payload.storeKeys) {
      if (payload.storeKeys.length === 0) sub.storeKeys.clear();
      payload.storeKeys.forEach((k) => sub.storeKeys.delete(String(k || "").trim()));
    }
    sub.updatedAt = now;
    return sub;
  }

  /**
   * Check whether an envelope with given kind should be delivered, considering room filters.
   */
  public shouldDeliver(
    pluginId: string,
    clientId: string,
    env: { kind?: string; roomId?: string; payload?: any }
  ): boolean {
    const sub = this.get(pluginId, clientId);
    if (!sub) return false;
    const kind = String(env.kind || "").trim().toLowerCase();
    if (!kind) return false;

    // Store delivery is governed by storeKeys; allow if any key subscribed.
    if (kind === "store") {
      return sub.storeKeys.size > 0;
    }

    // Shortcut 事件：只要客户端连着就全部转发（不做按 kind 的显式订阅过滤）
    if (kind === "shortcut") {
      return true;
    }

    if (sub.kinds.size === 0) return false;

    // danmaku 过滤：先按 roomId，再按事件类型（如果配置了 types）
    if (kind === "danmaku") {
      const roomId = String(env.roomId || "").trim();
      if (!roomId) return false;

      const ruleForRoom = sub.danmakuRules.find((r) => r.roomId === roomId);
      // 未配置规则：视为未订阅该房间
      if (!ruleForRoom) return false;
      // 显式 "*"：所有类型都通过
      if (ruleForRoom.types.includes("*")) return true;
      // 空数组：该房间不推任何 danmaku
      if (ruleForRoom.types.length === 0) return false;

      const payload = env.payload || {};
      const t = String((payload && (payload.type || payload.event_type)) || "").toLowerCase();
      if (!t) return false;
      const lowers = ruleForRoom.types.map((x) => String(x || "").toLowerCase());
      return lowers.includes(t);
    }

    // direct kind match or prefix match for danmaku:<roomId>
    if (sub.kinds.has(kind)) return true;
    // Allow precise matching for danmaku:<roomId> subscriptions
    if (kind === "danmaku") {
      for (const k of sub.kinds) {
        if (k.startsWith("danmaku:")) {
          const roomId = k.split(":")[1];
          if (roomId && env.roomId === roomId) return true;
        }
      }
    }
    return false;
  }

  /**
   * For store payload filtering.
   */
  public filterStorePayload(
    pluginId: string,
    clientId: string,
    dataObj: Record<string, any>
  ): Record<string, any> | null {
    const sub = this.get(pluginId, clientId);
    if (!sub || sub.storeKeys.size === 0) return null;
    const allowAll = sub.storeKeys.has("*");
    const filtered: Record<string, any> = {};
    for (const k of Object.keys(dataObj || {})) {
      if (!allowAll && !sub.storeKeys.has(k)) continue;
      if (k === "token" || k === "plugin") continue;
      filtered[k] = (dataObj as any)[k];
    }
    if (Object.keys(filtered).length === 0) return null;
    return filtered;
  }

  /**
   * 检查指定插件是否有任何客户端订阅了指定的 kind
   */
  public hasSubscription(pluginId: string, kind: string): boolean {
    const byPlugin = this.subs.get(pluginId);
    if (!byPlugin) return false;
    
    const normalizedKind = String(kind || "").trim().toLowerCase();
    for (const sub of byPlugin.values()) {
      if (sub.kinds.has(normalizedKind)) return true;
    }
    return false;
  }
 
  /**
   * 清理指定插件的所有订阅（用于插件禁用/卸载时的主动清理）
   */
  public clearPluginSubscriptions(pluginId: string): void {
    try {
      if (!this.subs.has(pluginId)) return;
      this.subs.delete(pluginId);
    } catch (error) {
      // 忽略错误，调用方不应因清理失败阻塞流程
      try { console.warn('[OverlaySubscriptionRegistry] clearPluginSubscriptions failed', pluginId, error); } catch {}
    }
  }
}

export const overlaySubscriptionRegistry = OverlaySubscriptionRegistry.getInstance();

