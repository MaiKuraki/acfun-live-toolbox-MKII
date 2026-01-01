import { DataManager } from '../persistence/DataManager';

type PublishOptions = { ttlMs?: number; persist?: boolean; meta?: any };

export class SseQueueService {
  private static instance: SseQueueService;
  private mc = DataManager.getInstance();

  public static getInstance(): SseQueueService {
    if (!SseQueueService.instance) SseQueueService.instance = new SseQueueService();
    return SseQueueService.instance;
  }

  public markReady(channel: string): void {
    // no-op by design: DataManager already provides bounded queues + TTL + Last-Event-ID replay.
    void channel;
  }

  public queueOrPublish(channel: string, payload: any, options?: PublishOptions): any {
    const ch = String(channel || '').trim();
    if (!ch) return null;
    return this.mc.publish(ch, payload, options as any);
  }
}