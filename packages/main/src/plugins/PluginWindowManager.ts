import { BrowserWindow } from 'electron';
import path from 'path';
import { getLogManager } from '../logging/LogManager';

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

/**
 * Manages single-instance plugin windows. Each pluginId maps to one BrowserWindow.
 * Windows load the renderer with hash `#/plugins/:pluginId/window`.
 */
export class PluginWindowManager {
  private windows: Map<string, BrowserWindow> = new Map();

  public async open(pluginId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = this.windows.get(pluginId);
      if (existing && !existing.isDestroyed()) {
        existing.show();
        existing.focus();
        return { success: true };
      }

      const win = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        minWidth: 480,
        minHeight: 360,
        frame: false,
        resizable: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
          preload: path.join(__dirname, '../../preload/dist/exposed.mjs')
        }
      });

      // Remove CSP headers similar to main window
      win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        const headers = { ...details.responseHeaders } as Record<string, string | string[]>;
        for (const key of Object.keys(headers)) {
          const lower = key.toLowerCase();
          if (lower === 'content-security-policy' || lower === 'x-content-security-policy' || lower === 'x-webkit-csp') {
            delete headers[key];
          }
        }
        callback({ responseHeaders: headers });
      });

      win.once('ready-to-show', () => {
        try { win.show(); } catch {}
        if (VITE_DEV_SERVER_URL) {
          try { win.webContents.openDevTools({ mode: 'detach' }); } catch {}
        }
      });

      // Load renderer with route
      const hashRoute = `#/plugins/${encodeURIComponent(pluginId)}/window`;
      if (VITE_DEV_SERVER_URL) {
        await win.loadURL(`${VITE_DEV_SERVER_URL}${hashRoute}`);
      } else {
        await win.loadFile(path.join(__dirname, '../../renderer/dist/index.html'), { hash: hashRoute.replace(/^#/, '') });
      }

      win.on('closed', () => {
        this.windows.delete(pluginId);
      });

      try {
        const lm = getLogManager();
        win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
          try {
            const lvl = level === 2 ? 'error' : level === 1 ? 'warn' : 'info';
            lm.addLog('renderer', `[${sourceId}:${line}] ${String(message)}`, lvl as any);
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
    try { win.webContents.send(channel, payload); return true; } catch { return false; }
  }
}

