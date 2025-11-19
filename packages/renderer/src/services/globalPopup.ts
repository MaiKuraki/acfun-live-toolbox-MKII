import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next';

export interface PopupOptions {
  durationMs?: number;
  contextId?: string; // pluginId 或窗口上下文标识，用于节流
}

type ThrottleBucket = { count: number; windowEnd: number };

const toastBuckets = new Map<string, ThrottleBucket>();
const alertLocks = new Map<string, boolean>();
const confirmLocks = new Map<string, boolean>();

function getContextId(opts?: PopupOptions) {
  return String(opts?.contextId || 'global');
}

function sanitizeText(input: any): string {
  try { return String(input ?? '').replace(/<[^>]*>/g, ''); } catch { return String(input ?? ''); }
}

export const GlobalPopup = {
  toast(message: string, options?: PopupOptions) {
    const ctx = getContextId(options);
    const now = Date.now();
    const bucket = toastBuckets.get(ctx) || { count: 0, windowEnd: now + 1000 };
    if (now > bucket.windowEnd) {
      bucket.count = 0;
      bucket.windowEnd = now + 1000;
    }
    if (bucket.count >= 3) {
      // 超过节流限制，忽略本次 toast
      return;
    }
    bucket.count += 1;
    toastBuckets.set(ctx, bucket);
    const dur = Math.max(1000, Math.min(10000, Number(options?.durationMs ?? 2500)));
    MessagePlugin.info({ content: sanitizeText(message), duration: dur });
  },

  alert(title: string, message: string, options?: PopupOptions) {
    const ctx = getContextId(options);
    if (alertLocks.get(ctx)) {
      return; // 并发受限：每上下文一次
    }
    alertLocks.set(ctx, true);
    const inst = DialogPlugin.alert({
      header: sanitizeText(title),
      body: sanitizeText(message),
      onClosed: () => { alertLocks.delete(ctx); }
    });
    // 兜底：如未触发 onClosed（异常），在 30s 后释放锁
    setTimeout(() => { if (alertLocks.get(ctx)) alertLocks.delete(ctx); }, 30000);
    return inst;
  },

  async confirm(title: string, message: string, options?: PopupOptions): Promise<boolean> {
    const ctx = getContextId(options);
    if (confirmLocks.get(ctx)) {
      return false; // 并发受限：每上下文一次
    }
    confirmLocks.set(ctx, true);
    return new Promise<boolean>((resolve) => {
      const inst = DialogPlugin.confirm({
        header: sanitizeText(title),
        body: sanitizeText(message),
        onConfirm: () => { try { inst?.hide?.(); } catch {} resolve(true); },
        onCancel: () => { try { inst?.hide?.(); } catch {} resolve(false); },
        onClosed: () => { confirmLocks.delete(ctx); }
      });
      // 兜底：如未触发 onClosed（异常），在 30s 后释放锁并默认取消
      setTimeout(() => {
        if (confirmLocks.get(ctx)) {
          try { inst?.hide?.(); } catch {}
          confirmLocks.delete(ctx);
          resolve(false);
        }
      }, 30000);
    });
  }
};

export default GlobalPopup;
