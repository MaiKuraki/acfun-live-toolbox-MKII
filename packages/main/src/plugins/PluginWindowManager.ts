import { BrowserWindow, session, Session } from 'electron';
import path from 'path';
import { getLogManager } from '../logging/LogManager';
import { ConfigManager } from '../config/ConfigManager';
import type { PluginManager } from './PluginManager';

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

/**
 * Manages single-instance plugin windows. Each pluginId maps to one BrowserWindow.
 * Windows load the renderer with hash `#/plugins/:pluginId/window`.
 * 
 * Memory optimization: Uses shared session partition to reduce memory footprint.
 */
export class PluginWindowManager {
  private windows: Map<string, BrowserWindow> = new Map();
  private windowActivity: Map<string, number> = new Map(); // Track last activity time (for statistics only)
  private configManager?: ConfigManager;
  private pluginManager?: PluginManager;
  private sharedSession: Session;

  constructor(configManager?: ConfigManager) {
    this.configManager = configManager;
    // Create a shared session partition for all plugin windows to reduce memory usage
    // This allows multiple windows to share the same renderer process when possible
    this.sharedSession = session.fromPartition('persist:plugin-windows-shared', { cache: true });
    // Register CSP header remover once on the shared session to avoid registering
    // the same handler for each window (which could accumulate and cause overhead).
    try {
      this.sharedSession.webRequest.onHeadersReceived((details, callback) => {
        try {
          const headers = { ...details.responseHeaders } as Record<string, string | string[]>;
          for (const key of Object.keys(headers)) {
            const lower = key.toLowerCase();
            if (lower === 'content-security-policy' || lower === 'x-content-security-policy' || lower === 'x-webkit-csp') {
              delete headers[key];
            }
          }
          callback({ responseHeaders: headers });
        } catch {
          try { callback({ responseHeaders: details.responseHeaders }); } catch {}
        }
      });
    } catch {}
  }

  public setPluginManager(pluginManager: PluginManager): void {
    this.pluginManager = pluginManager;
  }

  public getWindow(pluginId: string): BrowserWindow | undefined {
    const win = this.windows.get(pluginId);
    if (win && !win.isDestroyed()) return win;
    return undefined;
  }

  public async open(pluginId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = this.windows.get(pluginId);
      if (existing && !existing.isDestroyed()) {
        existing.show();
        existing.focus();
        return { success: true };
      }

      // Get window config from manifest
      let width = 800;
      let height = 600;
      let minWidth = 480;
      let minHeight = 360;
      let resizable = true;
      let frame = false;
      let transparent = true;
      let alwaysOnTop = false;

      if (this.pluginManager) {
        const plugin = this.pluginManager.getPlugin(pluginId);
        if (plugin?.manifest?.window) {
          const conf = plugin.manifest.window;
          if (typeof conf.width === 'number') width = conf.width;
          if (typeof conf.height === 'number') height = conf.height;
          if (typeof conf.minWidth === 'number') minWidth = conf.minWidth;
          if (typeof conf.minHeight === 'number') minHeight = conf.minHeight;
          if (typeof conf.resizable === 'boolean') resizable = conf.resizable;
          if (typeof conf.frame === 'boolean') frame = conf.frame;
          if (typeof conf.transparent === 'boolean') transparent = conf.transparent;
          if (typeof conf.alwaysOnTop === 'boolean') alwaysOnTop = conf.alwaysOnTop;
        }
      }

      // Memory optimization: Use shared session partition and optimized webPreferences
      const win = new BrowserWindow({
        show: false,
        width,
        height,
        minWidth,
        minHeight,
        frame,
        resizable,
        transparent,
        alwaysOnTop,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
          preload: path.join(__dirname, '../../preload/dist/exposed.mjs'),
          // Memory optimization options
          partition: 'persist:plugin-windows-shared', // Share session across plugin windows
          backgroundThrottling: true, // Throttle background tabs/windows
          enableWebSQL: false, // Disable deprecated WebSQL
          v8CacheOptions: 'code', // Optimize V8 code caching
          // Disable unnecessary features to reduce memory
          spellcheck: false,
          enableBlinkFeatures: undefined,
          disableBlinkFeatures: 'Auxclick', // Disable auxclick to reduce event overhead
        }
      });

      // CSP header handling moved to shared session registration in constructor.

      // Track window activity
      const updateActivity = () => {
        this.windowActivity.set(pluginId, Date.now());
      };

      win.once('ready-to-show', () => {
        try { win.show(); } catch {}
        updateActivity();
        try {
          for (const a of process.argv) {
            if (String(a).trim() === '--debug') {
              try { win.webContents.openDevTools({ mode: 'detach' }); } catch {}
              return;
            }
          }
        } catch {}
        if (VITE_DEV_SERVER_URL) {
          try { win.webContents.openDevTools({ mode: 'detach' }); } catch {}
        }
      });

      // Track various user interactions to update activity
      win.on('focus', updateActivity);
      win.on('show', updateActivity);
      win.webContents.on('did-navigate', updateActivity);
      win.webContents.on('did-navigate-in-page', updateActivity);

      // Load renderer with route
      const hashRoute = `#/plugins/${encodeURIComponent(pluginId)}/window`;
      const port = (() => {
        try {
          if (this.configManager) {
            const p = Number(this.configManager.get<number>('server.port'));
            if (Number.isFinite(p) && p > 0 && p <= 65535) return p;
          }
        } catch {}
        return undefined;
      })();
      const search = port ? `?apiPort=${port}` : '';
      if (VITE_DEV_SERVER_URL) {
        await win.loadURL(`${VITE_DEV_SERVER_URL}${search}${hashRoute}`);
      } else {
        await win.loadFile(path.join(__dirname, '../../renderer/dist/index.html'), { hash: hashRoute.replace(/^#/, ''), search });
      }

      win.on('closed', () => {
        this.windows.delete(pluginId);
        this.windowActivity.delete(pluginId);
      });

      try {
        const lm = getLogManager();
        win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
          try {
            const msg = String(message);
            const src = String(sourceId);
            const suppress = (() => {
              if (msg.includes('[obs-assistant]')) return true;
              if (src.includes('devtools://devtools') && (msg.includes('Autofill.enable') || msg.includes('Autofill.setAddresses'))) return true;
              return false;
            })();
            if (suppress) return;
            const lvl = level === 2 ? 'error' : level === 1 ? 'warn' : 'info';
            lm.addLog('renderer', `[${src}:${line}] ${msg}`, lvl as any);
          } catch {}
        });
      } catch {}

      this.windows.set(pluginId, win);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: String(err?.message || err) };
    }
  }

  public async focus(pluginId: string): Promise<{ success: boolean; error?: string }> {
    const win = this.windows.get(pluginId);
    if (!win || win.isDestroyed()) {
      return { success: false, error: 'Window not found' };
    }
    try { win.show(); win.focus(); return { success: true }; } catch (err: any) { return { success: false, error: String(err?.message || err) }; }
  }

  public async close(pluginId: string): Promise<{ success: boolean; error?: string }> {
    const win = this.windows.get(pluginId);
    if (!win || win.isDestroyed()) {
      return { success: false, error: 'Window not found' };
    }
    try { win.close(); return { success: true }; } catch (err: any) { return { success: false, error: String(err?.message || err) }; }
  }

  public async isOpen(pluginId: string): Promise<{ success: boolean; open: boolean; error?: string }> {
    const win = this.windows.get(pluginId);
    const open = !!win && !win.isDestroyed();
    return { success: true, open };
  }

  public async list(): Promise<{ success: boolean; windows: Array<{ pluginId: string; visible: boolean; focused: boolean }> } | { success: false; error: string }> {
    try {
      const windows = Array.from(this.windows.entries()).map(([pid, win]) => ({
        pluginId: pid,
        visible: !!win && !win.isDestroyed() && win.isVisible(),
        focused: !!win && !win.isDestroyed() && win.isFocused()
      }));
      return { success: true, windows };
    } catch (err: any) {
      return { success: false, error: String(err?.message || err) };
    }
  }

  public send(pluginId: string, channel: string, payload?: any): boolean {
    const win = this.windows.get(pluginId);
    if (!win || win.isDestroyed()) return false;
    try { 
      win.webContents.send(channel, payload);
      this.windowActivity.set(pluginId, Date.now()); // Update activity on send
      return true; 
    } catch { return false; }
  }

  /**
   * Get memory usage statistics for all plugin windows
   */
  public async getMemoryStats(): Promise<{ 
    windowCount: number; 
    totalMemoryMB: number; 
    windows: Array<{ pluginId: string; memoryMB: number }> 
  }> {
    const windows: Array<{ pluginId: string; memoryMB: number }> = [];
    let totalMemory = 0;

    for (const [pluginId, win] of this.windows.entries()) {
      if (win && !win.isDestroyed()) {
        try {
          // getProcessMemoryInfo is async in newer Electron versions
          const getMemoryInfo = (win.webContents as any).getProcessMemoryInfo;
          if (typeof getMemoryInfo === 'function') {
            const memoryInfo = await getMemoryInfo();
            if (memoryInfo) {
              // Memory info structure varies by Electron version
              const privateBytes = memoryInfo.privateBytes || memoryInfo.private || 0;
              const memoryMB = privateBytes / 1024 / 1024;
              windows.push({ pluginId, memoryMB });
              totalMemory += memoryMB;
            }
          }
        } catch {
          // Ignore errors - memory info may not be available
        }
      }
    }

    return {
      windowCount: windows.length,
      totalMemoryMB: totalMemory,
      windows
    };
  }

  /**
   * Cleanup: Close all windows and clear resources
   */
  public destroy(): void {
    for (const [pluginId, win] of this.windows.entries()) {
      try {
        if (win && !win.isDestroyed()) {
          win.close();
        }
      } catch {
        // Ignore errors
      }
    }

    this.windows.clear();
    this.windowActivity.clear();
  }
}
