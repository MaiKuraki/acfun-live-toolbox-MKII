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
  setIsMain: (flag: boolean) => void;
  getIsMain: () => boolean;
};

const sanitize = (obj: any): any => {
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
};

const isElectronRenderer = (): boolean => {
  try {
    const hasPreloadApi = typeof (window as any).electronApi !== 'undefined';
    return !!hasPreloadApi;
  } catch {
    return false;
  }
};

const createReporter = (): Reporter => {
  let pending: ReadonlySlice = {};
  let timer: number | null = null;
  let isMain = true;

  const parsePluginId = (): string | null => {
    try {
      const hash = String(window.location.hash || '');
      const m = hash.match(/^#\/plugins\/([^\/]+)\/window/);
      if (m && m[1]) return decodeURIComponent(m[1]);
      return null;
    } catch {
      return null;
    }
  };

  const mergeSlice = (base: any, patch: any) => {
    for (const k of Object.keys(patch)) {
      base[k] = { ...(base[k] || {}), ...(patch[k] || {}) };
    }
  };

  const flush = () => {
    const payload = sanitize(pending);
    pending = {};
    timer = null;
    if (!isMain) return;
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
        timer = window.setTimeout(flush, 500);
      }
    },
    init(snapshot: ReadonlySlice) {
      if (!isElectronRenderer()) return;
      if (!isMain) return;
      const payload = sanitize(snapshot);
      try {
        const base = getApiBase();
        const url = new URL('/api/renderer/readonly-store', base).toString();
        const hash = String(window.location.hash || '');
        const pid = parsePluginId();
        const isPluginLike = !!(pid || /^#\/plugins\/[^/]+\/window/.test(hash));
        if (isPluginLike) return;
        void fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'readonly-store-init', payload })
        });
      } catch {}
    },
    setIsMain(flag: boolean) {
      isMain = flag;
    },
    getIsMain() {
      return isMain;
    }
  };
};

const globalKey = '__readonlyReporter__';
const ensureSingleton = (): Reporter => {
  const w = window as any;
  if (!w[globalKey]) {
    w[globalKey] = createReporter();
  }
  return w[globalKey] as Reporter;
};

export const reportReadonlyUpdate = (slice: ReadonlySlice): void => {
  ensureSingleton().update(slice);
};

export const reportReadonlyInit = (snapshot: ReadonlySlice): void => {
  ensureSingleton().init(snapshot);
};

export const setReadonlyIsMain = (flag: boolean): void => {
  ensureSingleton().setIsMain(flag);
};

export const isReadonlyMain = (): boolean => {
  try {
    return ensureSingleton().getIsMain();
  } catch {
    return true;
  }
};
