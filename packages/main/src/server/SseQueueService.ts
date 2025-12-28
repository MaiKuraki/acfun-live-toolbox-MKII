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
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/52fa37f8-b908-44d5-87d2-c8f2861a8c45', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'settings-subscribe',
          hypothesisId: 'C',
          location: 'packages/main/src/server/SseQueueService.ts:19',
          message: 'queueOrPublish called',
          data: { channel: ch, meta: options?.meta, payloadSummary: typeof payload === 'object' ? Object.keys(payload).slice(0,5) : String(payload) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch {}
    // #endregion
    return this.mc.publish(ch, payload, options as any);
  }
}