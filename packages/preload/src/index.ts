/**
 * @module preload
 */

import { contextBridge, ipcRenderer } from 'electron';

// Maintain mapping between user listeners and wrapped listeners
const _listenerMap = new WeakMap<(...args: any[]) => void, (event: Electron.IpcRendererEvent, ...args: any[]) => void>();

/**
 * An empty object for now.
 * This will be populated with the actual API as we rebuild the features.
 */
  const api = {
  dialog: {
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog.showOpenDialog', options),
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog.showSaveDialog', options)
  },
  fs: {
    exists: (path: string) => ipcRenderer.invoke('fs.exists', path),
    readFile: (path: string) => ipcRenderer.invoke('fs.readFile', path),
    writeFile: (path: string, data: string) => ipcRenderer.invoke('fs.writeFile', path, data)
  },
  login: {
    qrStart: () => ipcRenderer.invoke('login.qrStart'),
    qrCheck: () => ipcRenderer.invoke('login.qrCheck'),
    qrFinalize: () => ipcRenderer.invoke('login.qrFinalize'),
    qrCancel: () => ipcRenderer.invoke('login.qrCancel'),
    logout: () => ipcRenderer.invoke('login.logout'),
    onStateChanged: (callback: any) => ipcRenderer.on('login.onStateChanged', callback)
  },
  // Window controls bridging
  window: {
    minimizeWindow: () => ipcRenderer.invoke('window.minimize'),
    closeWindow: () => ipcRenderer.invoke('window.close'),
    maximizeWindow: () => ipcRenderer.invoke('window.maximize'),
    restoreWindow: () => ipcRenderer.invoke('window.restore')
  },
  system: {
    getConfig: () => ipcRenderer.invoke('system.getConfig'),
    updateConfig: (newConfig: any) => ipcRenderer.invoke('system.updateConfig', newConfig),
    serverStatus: () => ipcRenderer.invoke('system.serverStatus'),
    restartServer: (opts?: { port?: number }) => ipcRenderer.invoke('system.restartServer', opts),
    getSystemLog: (count?: number) => ipcRenderer.invoke('system.getSystemLog', count),
    genDiagnosticZip: () => ipcRenderer.invoke('system.genDiagnosticZip'),
    showItemInFolder: (targetPath: string) => ipcRenderer.invoke('system.showItemInFolder', targetPath),
    openExternal: (url: string) => ipcRenderer.invoke('system.openExternal', url),
    getUserDataDir: () => ipcRenderer.invoke('system.getUserDataDir'),
    getReadmeSummary: () => ipcRenderer.invoke('system.getReadmeSummary'),
    getBuildInfo: () => ipcRenderer.invoke('system.getBuildInfo'),
    statPath: (p: string) => ipcRenderer.invoke('system.statPath', p),
    getStorageStats: () => ipcRenderer.invoke('system.getStorageStats')
  },
  systemExt: {
    setAutoStart: (enabled: boolean) => ipcRenderer.invoke('system.setAutoStart', enabled),
    setMinimizeToTray: (enabled: boolean) => ipcRenderer.invoke('system.setMinimizeToTray', enabled)
  },
  config: {
    exportZip: (targetPath?: string) => ipcRenderer.invoke('config.exportZip', targetPath),
    importZip: (zipPath: string) => ipcRenderer.invoke('config.importZip', zipPath),
    setDir: (dir: string) => ipcRenderer.invoke('config.setDir', dir)
  },
  db: {
    setPath: (p: string) => ipcRenderer.invoke('db.setPath', p),
    getPath: () => ipcRenderer.invoke('db.getPath')
  },
  // Overlay API bridging
  overlay: {
    send: (overlayId: string, event: string, payload?: any) => ipcRenderer.invoke('overlay.send', overlayId, event, payload),
    action: (overlayId: string, action: string, data?: any) => ipcRenderer.invoke('overlay.action', overlayId, action, data)
  },
  // Plugin API bridging
  plugin: {
    list: () => ipcRenderer.invoke('plugin.list'),
    install: (options: { filePath?: string; url?: string; force?: boolean }) => ipcRenderer.invoke('plugin.install', options),
    uninstall: (pluginId: string) => ipcRenderer.invoke('plugin.uninstall', pluginId),
    enable: (pluginId: string) => ipcRenderer.invoke('plugin.enable', pluginId),
    disable: (pluginId: string) => ipcRenderer.invoke('plugin.disable', pluginId),
    reload: (pluginId: string) => ipcRenderer.invoke('plugin.reload', pluginId),
    get: (pluginId: string) => ipcRenderer.invoke('plugin.get', pluginId),
    getConfig: (pluginId: string) => ipcRenderer.invoke('plugin.getConfig', pluginId),
    updateConfig: (pluginId: string, newConfig: Record<string, any>) => ipcRenderer.invoke('plugin.updateConfig', pluginId, newConfig),
    stats: () => ipcRenderer.invoke('plugin.stats'),
    logs: (pluginId?: string, limit?: number) => ipcRenderer.invoke('plugin.logs', pluginId, limit),
    errorHistory: (pluginId: string) => ipcRenderer.invoke('plugin.errorHistory', pluginId),
    errorStats: () => ipcRenderer.invoke('plugin.errorStats'),
    recovery: (pluginId: string, action: string, context?: Record<string, any>) => ipcRenderer.invoke('plugin.recovery', pluginId, action, context),
    resetErrorCount: (pluginId: string, errorType?: string) => ipcRenderer.invoke('plugin.resetErrorCount', pluginId, errorType),
    saveDevConfig: (config: any) => ipcRenderer.invoke('plugin.devtools.saveConfig', config),
    loadDevConfig: (pluginId?: string) => ipcRenderer.invoke('plugin.devtools.getConfig', pluginId),
    getDebugStatus: (pluginId: string) => ipcRenderer.invoke('plugin.devtools.getDebugStatus', pluginId),
    startDebugSession: (config: any) => ipcRenderer.invoke('plugin.devtools.startDebug', config),
    stopDebugSession: (pluginId: string) => ipcRenderer.invoke('plugin.devtools.stopDebug', pluginId),
    enableHotReload: (pluginId: string) => ipcRenderer.invoke('plugin.devtools.enableHotReload', pluginId),
    disableHotReload: (pluginId: string) => ipcRenderer.invoke('plugin.devtools.disableHotReload', pluginId),
    testConnection: (config: any) => ipcRenderer.invoke('plugin.devtools.testConnection', config),
    openPluginsDir: () => ipcRenderer.invoke('plugin.openPluginsDir'),
    // 插件窗口能力
    window: {
      open: (pluginId: string) => ipcRenderer.invoke('plugin.window.open', pluginId),
      focus: (pluginId: string) => ipcRenderer.invoke('plugin.window.focus', pluginId),
      close: (pluginId: string) => ipcRenderer.invoke('plugin.window.close', pluginId),
      isOpen: (pluginId: string) => ipcRenderer.invoke('plugin.window.isOpen', pluginId),
      list: () => ipcRenderer.invoke('plugin.window.list')
    }
    ,
    process: {
      execute: (pluginId: string, method: string, args?: any[]) => ipcRenderer.invoke('plugin.process.execute', pluginId, method, args),
      message: (pluginId: string, type: string, payload?: any) => ipcRenderer.invoke('plugin.process.message', pluginId, type, payload)
    }
  },
  // Wujie helper bridging
  wujie: {
    getUIConfig: async (pluginId: string) => {
      const res = await ipcRenderer.invoke('plugin.get', pluginId);
      if (res && 'success' in res && res.success) {
        const ui = res.data?.manifest?.ui?.wujie || null;
        return { success: true, data: ui };
      }
      return { success: false, error: res?.error || 'Failed to fetch plugin' };
    },
    getOverlayConfig: async (pluginId: string) => {
      const res = await ipcRenderer.invoke('plugin.get', pluginId);
      if (res && 'success' in res && res.success) {
        const ov = res.data?.manifest?.overlay?.wujie || null;
        return { success: true, data: ov };
      }
      return { success: false, error: res?.error || 'Failed to fetch plugin' };
    }
  },
  // Global popup bridging to main window
  popup: {
    toast: (message: string, options?: any) => ipcRenderer.invoke('popup.toast', { message, options }),
    alert: (title: string, message: string, options?: any) => ipcRenderer.invoke('popup.alert', { title, message, options }),
    confirm: (title: string, message: string, options?: any) => ipcRenderer.invoke('popup.confirm', { title, message, options }),
    respondConfirm: (requestId: string, result: boolean) => ipcRenderer.invoke('popup.confirm.respond', requestId, result)
  },
  // Unified hosting manifest bridging
  hosting: {
    getConfig: async (pluginId: string) => {
      const res = await ipcRenderer.invoke('plugin.get', pluginId);
      if (res && 'success' in res && res.success) {
        const m = res.data?.manifest || {};
        return {
          success: true,
          data: {
            ui: m.ui ? { spa: !!m.ui.spa, route: m.ui.route || '/', html: m.ui.html || 'ui.html' } : null,
            window: (m as any).window ? { spa: !!(m as any).window.spa, route: (m as any).window.route || '/', html: (m as any).window.html || 'window.html' } : null,
            overlay: m.overlay ? { spa: !!m.overlay.spa, route: m.overlay.route || '/', html: m.overlay.html || 'overlay.html' } : null
          }
        };
      }
      return { success: false, error: res?.error || 'Failed to fetch plugin' };
    }
  },
  // Room API bridging
  room: {
    connect: (roomId: string) => ipcRenderer.invoke('room.connect', roomId),
    disconnect: (roomId: string) => ipcRenderer.invoke('room.disconnect', roomId),
    list: () => ipcRenderer.invoke('room.list'),
    status: (roomId: string) => ipcRenderer.invoke('room.status', roomId),
    details: (roomId: string) => ipcRenderer.invoke('room.details', roomId),
    setPriority: (roomId: string, priority: number) => ipcRenderer.invoke('room.setPriority', roomId, priority),
    setLabel: (roomId: string, label: string) => ipcRenderer.invoke('room.setLabel', roomId, label)
  },
  // Account API bridging
  account: {
    getUserInfo: () => ipcRenderer.invoke('account.getUserInfo')
  },
  http: {
    get: async (path: string, params?: Record<string, any>) => {
      const cfg = await ipcRenderer.invoke('system.getConfig');
      const p = Number(cfg && cfg['server.port']);
      if (!Number.isFinite(p) || p <= 0 || p > 65535) {
        throw new Error('API_PORT_NOT_CONFIGURED');
      }
      const url = new URL(path, `http://127.0.0.1:${p}`);
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        }
      }
      const res = await fetch(url.toString(), { method: 'GET' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return res.json();
      }
      return res.text();
    }
  },
  // Monitoring API bridging (read-only)
  monitoring: {
    queryPageStatus: (pluginId?: string) => ipcRenderer.invoke('monitoring.pageStatus.query', pluginId),
    subscribePageStatus: async (pluginId: string, listener: (update: any) => void) => {
      const channel = 'monitoring.pageStatus.updated';
      const wrapped = (event: Electron.IpcRendererEvent, msg: any) => {
        try {
          if (msg && msg.pluginId === pluginId) {
            listener(msg);
          }
        } catch {}
      };
      ipcRenderer.on(channel, wrapped);
      await ipcRenderer.invoke('monitoring.pageStatus.listen', pluginId);
      return {
        unsubscribe: async () => {
          try { ipcRenderer.removeListener(channel, wrapped); } catch {}
          try { await ipcRenderer.invoke('monitoring.pageStatus.unlisten', pluginId); } catch {}
        }
      };
    }
  },
  // Console API bridging (note: uses colon channels)
  console: {
    createSession: (options: any) => ipcRenderer.invoke('console:createSession', options),
    endSession: (options: any) => ipcRenderer.invoke('console:endSession', options),
    executeCommand: (options: any) => ipcRenderer.invoke('console:executeCommand', options),
    getCommands: () => ipcRenderer.invoke('console:getCommands'),
    getSession: (options: any) => ipcRenderer.invoke('console:getSession', options),
    getActiveSessions: () => ipcRenderer.invoke('console:getActiveSessions')
  },
  // Generic event subscription utilities used by renderer
  on: (channel: string, listener: (...args: any[]) => void) => {
    let wrapped = _listenerMap.get(listener);
    if (!wrapped) {
      wrapped = (event, ...args) => listener(...args);
      _listenerMap.set(listener, wrapped);
    }
    ipcRenderer.on(channel, wrapped);
  },
  off: (channel: string, listener: (...args: any[]) => void) => {
    const wrapped = _listenerMap.get(listener);
    if (wrapped) {
      ipcRenderer.removeListener(channel, wrapped);
      _listenerMap.delete(listener);
    } else {
      // Fallback in case it was added without wrapping
      ipcRenderer.removeListener(channel, listener as unknown as any);
    }
  }
};

/**
 * The `api` object is exposed to the renderer process under `window.electronApi`.
 * See `packages/renderer/src/global.d.ts` for type declarations.
 */
try {
  contextBridge.exposeInMainWorld('electronApi', api);
} catch (error) {
  console.error('Failed to expose preload API:', error);
}
try {
  const getApiPort = async (): Promise<number> => {
    const readFromLocation = (): number | undefined => {
      try {
        const qs = new URLSearchParams(String(window.location.search || ''));
        const qp = Number(qs.get('apiPort'));
        if (Number.isFinite(qp) && qp > 0 && qp <= 65535) return qp;
      } catch {}
      try {
        const u = new URL(String(window.location.href || ''));
        const po = Number(u.port);
        if (Number.isFinite(po) && po > 0 && po <= 65535) return po;
      } catch {}
      return undefined;
    };
    for (let i = 0; i < 10; i++) {
      const fromLoc = readFromLocation();
      if (fromLoc) return fromLoc;
      try {
        const cfg = await ipcRenderer.invoke('system.getConfig');
        const p = Number(cfg && cfg['server.port']);
        if (Number.isFinite(p) && p > 0 && p <= 65535) return p;
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error('API_PORT_NOT_CONFIGURED');
  };
  contextBridge.exposeInMainWorld('getApiPort', getApiPort);
} catch {}
try {
  const __orig = { log: console.log, warn: console.warn, error: console.error, debug: console.debug } as const;
  const __send = (level: 'info' | 'error' | 'warn' | 'debug', args: any[]) => {
    try {
      const msg = args.map(a => {
        try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); }
      }).join(' ');
      ipcRenderer.invoke('system.publishLog', { source: 'renderer', level, message: msg });
    } catch {}
  };
  console.log = (...args: any[]) => { try { __orig.log.apply(console, args); } catch {} __send('info', args); };
  console.warn = (...args: any[]) => { try { __orig.warn.apply(console, args); } catch {} __send('warn', args); };
  console.error = (...args: any[]) => { try { __orig.error.apply(console, args); } catch {} __send('error', args); };
  console.debug = (...args: any[]) => { try { __orig.debug.apply(console, args); } catch {} __send('debug', args); };
} catch {}
