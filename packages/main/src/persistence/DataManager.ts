// Unified Message Center with pub/sub + queue + TTL + persistence (lightweight)

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface MessageRecord<T = any> {
  id: string; // monotonically increasing (string for simplicity)
  channel: string; // e.g. `plugin:<pluginId>:overlay`
  payload: T;
  createdAt: number;
  ttlMs?: number;
  expireAt?: number;
  meta?: Record<string, any>;
}

export interface PublishOptions {
  ttlMs?: number; // message time-to-live
  persist?: boolean; // whether to persist to disk
  meta?: Record<string, any>;
}

export type Subscriber<T = any> = (msg: MessageRecord<T>) => void;

/**
 * The MessageCenter provides:
 * - publish/subscribe for channels
 * - bounded in-memory queues per channel
 * - TTL-based expiry for messages
 * - lightweight persistence to newline-delimited JSON file per channel
 */
class MessageCenter {
  private static instance: MessageCenter | null = null;
  private subscribers: Map<string, Set<Subscriber>> = new Map();
  private queues: Map<string, MessageRecord[]> = new Map();
  private lastId = 0;
  private maxQueueSizePerChannel = 1000; // configurable if needed
  private persistDir: string;
  private cleanupTimer?: NodeJS.Timeout;
  private maxFileSizeBytes = 5 * 1024 * 1024;
  private maxRotatedFilesPerChannel = 5;

  static getInstance(): MessageCenter {
    if (!MessageCenter.instance) {
      MessageCenter.instance = new MessageCenter();
    }
    return MessageCenter.instance;
  }

  private constructor() {
    try {
      const base = app.getPath('userData');
      this.persistDir = path.join(base, 'message-center');
    } catch {
      this.persistDir = path.join(process.cwd(), '.message-center');
    }
    if (!fs.existsSync(this.persistDir)) {
      try { fs.mkdirSync(this.persistDir, { recursive: true }); } catch {}
    }
    // periodic cleanup for TTL expiry
    this.cleanupTimer = setInterval(() => this.cleanupExpired(), 10_000);
  }

  /** Publish a message to a channel */
  publish<T = any>(channel: string, payload: T, options: PublishOptions = {}): MessageRecord<T> {
    const now = Date.now();
    const id = String(++this.lastId);
    const ttlMs = options.ttlMs;
    const record: MessageRecord<T> = {
      id,
      channel,
      payload,
      createdAt: now,
      ttlMs,
      expireAt: typeof ttlMs === 'number' ? now + ttlMs : undefined,
      meta: options.meta || undefined
    };

    // enqueue (bounded)
    const q = this.queues.get(channel) || [];
    q.push(record);
    // trim to max size
    if (q.length > this.maxQueueSizePerChannel) {
      q.splice(0, q.length - this.maxQueueSizePerChannel);
    }
    this.queues.set(channel, q);

    // notify subscribers
    const subs = this.subscribers.get(channel);
    if (subs && subs.size > 0) {
      for (const cb of subs) {
        try { cb(record); } catch {}
      }
    }

    // persistence (append-only JSONL per channel)
    if (options.persist) {
      const file = this.getChannelFile(channel);
      try {
        this.ensureRotate(channel, file);
        fs.promises.appendFile(file, JSON.stringify(record) + '\n').catch(() => {});
      } catch {}
    }
    return record;
  }

  /** Subscribe to a channel; caller can optionally replay sinceId */
  subscribe<T = any>(channel: string, subscriber: Subscriber<T>, sinceId?: string): () => void {
    let set = this.subscribers.get(channel);
    if (!set) { set = new Set(); this.subscribers.set(channel, set); }
    set.add(subscriber as Subscriber);

    // replay from in-memory queue
    if (sinceId) {
      const q = this.queues.get(channel) || [];
      const startIdx = q.findIndex(m => m.id === sinceId);
      const slice = startIdx >= 0 ? q.slice(startIdx + 1) : q;
      for (const m of slice) {
        try { (subscriber as Subscriber)(m as any); } catch {}
      }
    }

    return () => {
      const s = this.subscribers.get(channel);
      if (!s) return;
      s.delete(subscriber as Subscriber);
      if (s.size === 0) this.subscribers.delete(channel);
    };
  }

  /** Get recent messages for a channel, optionally after an id */
  getRecent<T = any>(channel: string, sinceId?: string): MessageRecord<T>[] {
    const q = this.queues.get(channel) || [];
    if (!sinceId) return q.slice();
    const idx = q.findIndex(m => m.id === sinceId);
    return idx >= 0 ? q.slice(idx + 1) : q.slice();
  }

  /** Append a heartbeat message (not persisted) */
  heartbeat(channel: string): MessageRecord<{ type: 'heartbeat' }> {
    return this.publish(channel, { type: 'heartbeat' }, { ttlMs: 30_000, persist: false, meta: { kind: 'heartbeat' } });
  }

  /** Periodic cleanup of expired messages per TTL */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [channel, q] of this.queues.entries()) {
      const filtered = q.filter(m => !m.expireAt || m.expireAt > now);
      if (filtered.length !== q.length) {
        this.queues.set(channel, filtered);
      }
    }
  }

  /** Resolve per-channel persistence file */
  private getChannelFile(channel: string): string {
    const safe = channel.replace(/[^a-zA-Z0-9._-]/g, '_');
    return path.join(this.persistDir, `${safe}.jsonl`);
  }

  
  private ensureRotate(channel: string, currentFile: string): void {
    try {
      const stat = fs.existsSync(currentFile) ? fs.statSync(currentFile) : null;
      if (stat && stat.size >= this.maxFileSizeBytes) {
        const base = path.basename(currentFile, '.jsonl');
        const dir = path.dirname(currentFile);
        const ts = Date.now();
        const rotated = path.join(dir, `${base}.${ts}.jsonl`);
        try { fs.renameSync(currentFile, rotated); } catch {}
        try { fs.writeFileSync(currentFile, ''); } catch {}
        // prune old rotated files
        const prefix = `${base}.`;
        const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.jsonl'))
          .map(f => ({ f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
          .sort((a, b) => b.mtime - a.mtime);
        const excess = files.slice(this.maxRotatedFilesPerChannel);
        for (const ex of excess) {
          try { fs.unlinkSync(path.join(dir, ex.f)); } catch {}
        }
      }
    } catch {}
  }
}

export const DataManager = {
  getInstance: (): MessageCenter => MessageCenter.getInstance()
};

export type IDataManager = MessageCenter;
