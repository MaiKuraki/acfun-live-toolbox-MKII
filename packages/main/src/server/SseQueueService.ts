import { DataManager } from '../persistence/DataManager';

type PublishOptions = { ttlMs?: number; persist?: boolean; meta?: any };

export class SseQueueService {
  private static instance: SseQueueService;
  private ready = new Set<string>();
  private pending = new Map<string, Array<{ payload: any; options?: PublishOptions }>>();
  private mc = DataManager.getInstance();

  public static getInstance(): SseQueueService {
    if (!SseQueueService.instance) SseQueueService.instance = new SseQueueService();
    return SseQueueService.instance;
  }

  public markReady(channel: string): void {
    const ch = String(channel || '').trim();
    if (!ch) return;
    this.ready.add(ch);
    const q = this.pending.get(ch) || [];
    if (q.length > 0) {
      for (const item of q) {
        try { this.mc.publish(ch, item.payload, item.options || { meta: { kind: 'message' }, persist: true }); } catch {}
      }
      this.pending.delete(ch);
    }
  }

  public markClosed(channel: string): void {
    const ch = String(channel || '').trim();
    if (!ch) return;
    // 默认保持就绪，必要时可切换为：this.ready.delete(ch)
  }

  public queueOrPublish(channel: string, payload: any, options?: PublishOptions): any {
    const ch = String(channel || '').trim();
    if (!ch) return null;
    if (this.ready.has(ch)) {
      return this.mc.publish(ch, payload, options as any);
    }
    const arr = this.pending.get(ch) || [];
    arr.push({ payload, options });
    this.pending.set(ch, arr);
    return { queued: true };
  }
}