import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next';

export interface PopupOptions {
  durationMs?: number;
  contextId?: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'question' | 'loading';
  icon?: string;
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
    const type = String(options?.type || 'info');
    const content = sanitizeText(message);
    if (type === 'success') { MessagePlugin.success({ content, duration: dur }); return; }
    if (type === 'warning') { MessagePlugin.warning({ content, duration: dur }); return; }
    if (type === 'error') { MessagePlugin.error({ content, duration: dur }); return; }
    if (type === 'question') { MessagePlugin.question({ content, duration: dur }); return; }
    if (type === 'loading') { MessagePlugin.loading({ content, duration: 0 }); return; }
    MessagePlugin.info({ content, duration: dur });
  },

  alert(title: string, message?: string, options?: PopupOptions) {
    const ctx = getContextId(options);
    if (alertLocks.get(ctx)) {
      return; // 并发受限：每上下文一次
    }
    alertLocks.set(ctx, true);

    // 如果只传了一个参数，将其作为消息，标题为空
    const actualTitle = message ? sanitizeText(title) : '';
    const actualMessage = message ? sanitizeText(message) : sanitizeText(title);

    const inst = DialogPlugin.alert({
      header: actualTitle,
      body: actualMessage,
      onConfirm: () => {
        try { inst?.hide?.(); } catch {}
        alertLocks.delete(ctx);
      },
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
        confirmBtn: (options as any)?.confirmBtn,
        cancelBtn: (options as any)?.cancelBtn,
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
  ,
  close(id?: string) {
    try {
      if (id && typeof id === 'string' && id.trim().length > 0) {
        (MessagePlugin as any).close(id);
        return;
      }
      if ((MessagePlugin as any).closeAll) {
        (MessagePlugin as any).closeAll();
      } else {
        (MessagePlugin as any).close();
      }
    } catch {}
  }
};

export default GlobalPopup;
