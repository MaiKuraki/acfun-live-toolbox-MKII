/*
  统一只读仓库增量上报模块（渲染进程）
  - 各个 Pinia store 在检测到变更时调用 reportReadonlyUpdate
  - 模块内部进行轻量聚合与节流，统一 POST 到 /api/renderer/readonly-store
  - 做最小敏感字段清理（token/accessToken/refreshToken）
*/
import { getApiBase } from './hosting';

export type ReadonlySlice = Record<string, any>;

type Reporter = {
  update: (slice: ReadonlySlice) => void;
  init: (snapshot: ReadonlySlice) => void;
};

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  try {
    const cloned = JSON.parse(JSON.stringify(obj));
    try { if (cloned && typeof cloned === 'object' && 'plugin' in cloned) delete (cloned as any).plugin; } catch {}
    const walk = (o: any) => {
      if (!o || typeof o !== 'object') return;
      for (const k of Object.keys(o)) {
        const lower = k.toLowerCase();
        if (lower === 'token' || lower === 'accesstoken' || lower === 'refreshtoken') {
          try { delete o[k]; } catch {}
          continue;
        }
        const v = o[k];
        if (v && typeof v === 'object') walk(v);
      }
    };
    walk(cloned);
    return cloned;
  } catch {
    return obj;
  }
}

function isElectronRenderer(): boolean {
  try {
    const hasNode = typeof process !== 'undefined' && typeof (process as any).versions === 'object';
    const isElectronVersion = hasNode && !!(process as any).versions?.electron;
    const protocol = typeof window !== 'undefined' && window.location ? window.location.protocol : '';
    const isFile = protocol === 'file:';
    const ua = (typeof navigator !== 'undefined' && (navigator as any).userAgent) ? String((navigator as any).userAgent) : '';
    const isElectronUA = /electron/i.test(ua);
    const hasPreloadApi = typeof (window as any).electronApi !== 'undefined';
    // 结合 URL 与是否有 Node/Electron 或 preload 暴露来判断渲染进程
    return (isElectronVersion || hasPreloadApi) && (isFile || isElectronUA);
  } catch {
    return false;
  }
}

function createReporter(): Reporter {
  let pending: ReadonlySlice = {};
  let timer: number | null = null;

  const mergeSlice = (base: any, patch: any) => {
    for (const k of Object.keys(patch)) {
      base[k] = { ...(base[k] || {}), ...(patch[k] || {}) };
    }
  };

  const flush = () => {
    const payload = sanitize(pending);
    pending = {};
    timer = null;
    if (!isElectronRenderer()) return;
    try {
      const base = getApiBase();
      const url = new URL('/api/renderer/readonly-store', base).toString();
      void fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'readonly-store-update', payload })
      });
    } catch {}
  };

  return {
    update(slice: ReadonlySlice) {
      if (!isElectronRenderer()) return;
      mergeSlice(pending, slice);
      if (timer == null) {
        // 将增量上报节流调整为500ms（0.5秒一次）
        timer = window.setTimeout(flush, 500);
      }
    },
    init(snapshot: ReadonlySlice) {
      if (!isElectronRenderer()) return;
      const payload = sanitize(snapshot);
      try {
        const base = getApiBase();
        const url = new URL('/api/renderer/readonly-store', base).toString();
        void fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'readonly-store-init', payload })
        });
      } catch {}
    }
  };
}

const globalKey = '__readonlyReporter__';
function ensureSingleton(): Reporter {
  const w = window as any;
  if (!w[globalKey]) {
    w[globalKey] = createReporter();
  }
  return w[globalKey] as Reporter;
}

export function reportReadonlyUpdate(slice: ReadonlySlice): void {
  ensureSingleton().update(slice);
}

export function reportReadonlyInit(snapshot: ReadonlySlice): void {
  ensureSingleton().init(snapshot);
}
