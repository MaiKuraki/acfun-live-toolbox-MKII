import { BrowserWindow } from 'electron';
import { getLogManager } from '../logging/LogManager';
import path from 'path';
import { TrayManager } from './TrayManager';

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const shouldOpenDevTools = () => {
  // If the app started with --debug, always open devtools
  try {
    for (const a of process.argv) {
      if (String(a).trim() === '--debug') return true;
    }
  } catch {}

  // Default: keep existing behavior (open devtools when using Vite dev server).
  const flag = String(process.env.ACFRAME_OPEN_DEVTOOLS || '').trim().toLowerCase();
  if (flag === '0' || flag === 'false' || flag === 'off') return false;
  return !!VITE_DEV_SERVER_URL;
};

/**
 * A simplified window manager for creating and managing the application's main window.
 * This is a refactored version, stripped of the old module system dependencies.
 */
export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private trayManager: TrayManager;
  private minimizeToTrayEnabled = false;

  constructor() {
    this.trayManager = new TrayManager(() => this.mainWindow);
  }

  public createWindow(): void {
    this.mainWindow = new BrowserWindow({
      show: false, // Use 'ready-to-show' event to show the window
      width: 1024,
      height: 768,
      minWidth: 1024,
      minHeight: 768,
      maxWidth: 1024,
      maxHeight: 768,
      resizable: false,
      frame: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Sandbox is disabled for now, as per original config
        preload: path.join(__dirname, '../../preload/dist/exposed.mjs'), // Path to the preload script (ESM)
      },
    });

    // 强制关闭响应头中的 CSP（Content-Security-Policy）
    this.mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      const headers = { ...details.responseHeaders } as Record<string, string | string[]>;
      for (const key of Object.keys(headers)) {
        const lower = key.toLowerCase();
        if (lower === 'content-security-policy' || lower === 'x-content-security-policy' || lower === 'x-webkit-csp') {
          delete headers[key];
        }
      }
      callback({ responseHeaders: headers });
    });

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      if (shouldOpenDevTools()) {
        this.mainWindow?.webContents.openDevTools({ mode: 'detach' });
      }
    });

    // Load the renderer content
    if (VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(VITE_DEV_SERVER_URL);
    } else {
      // In production, load the index.html file
      this.mainWindow.loadFile(path.join(__dirname, '../../renderer/dist/index.html'));
    }

    this.mainWindow.on('closed', () => {
      // 关闭所有其他窗口
      const allWindows = BrowserWindow.getAllWindows();
      for (const win of allWindows) {
        if (win !== this.mainWindow && !win.isDestroyed()) {
          try {
            win.close();
          } catch (error) {
            console.error('[WindowManager] Error closing window:', error);
          }
        }
      }
      this.mainWindow = null;
    });

    try {
      const lm = getLogManager();
      this.mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        try {
          const lvl = level === 2 ? 'error' : level === 1 ? 'warn' : 'info';
          lm.addLog('renderer', `[${sourceId}:${line}] ${String(message)}`, lvl as any);
        } catch {}
      });
    } catch {}

    try { this.trayManager.bindWindowBehavior(this.mainWindow); } catch {}
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  public setMinimizeToTray(enabled: boolean) {
    this.minimizeToTrayEnabled = enabled;
    try { this.trayManager.setEnabled(enabled); } catch {}
  }

  public isMainWindow(win?: BrowserWindow | null): boolean {
    return !!win && win === this.mainWindow;
  }

  public isMinimizeToTrayEnabled(): boolean {
    return this.minimizeToTrayEnabled;
  }
}
