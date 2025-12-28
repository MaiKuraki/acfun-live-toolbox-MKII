import { app, BrowserWindow, Menu, Tray } from 'electron';
import path from 'path';

export class TrayManager {
  private tray: Tray | null = null;
  private enabled = false;
  private windowProvider: () => BrowserWindow | null;

  constructor(windowProvider: () => BrowserWindow | null) {
    this.windowProvider = windowProvider;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = !!enabled;
    if (this.enabled && !this.tray) {
      this.createTray();
    }
    if (!this.enabled && this.tray) {
      try { this.tray.destroy(); } catch {}
      this.tray = null;
    }
  }

  private createTray() {
    if (this.tray) return;
    const icon = this.getIconPath();
    this.tray = new Tray(icon);
    this.tray.setToolTip('ACFUN直播框架');
    const menu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        click: () => {
          const win = this.windowProvider();
          if (win) {
            try { win.show(); win.focus(); } catch {}
          }
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          try { app.quit(); } catch {}
        }
      }
    ]);
    this.tray.setContextMenu(menu);
    this.tray.on('click', () => {
      const win = this.windowProvider();
      if (win) {
        try { win.isVisible() ? win.focus() : win.show(); } catch {}
      }
    });
  }

  public bindWindowBehavior(win: BrowserWindow) {
    try {
      (win as any).on('minimize', () => {
        if (!this.enabled) return;
        try { win.hide(); } catch {}
      });
      (win as any).on('close', (e: any) => {
        if (!this.enabled) return;
        try { e?.preventDefault?.(); win.hide(); } catch {}
      });
    } catch {}
  }

  private getIconPath(): string {
    const fallback = path.join(process.cwd(), 'buildResources', 'icon.png');
    try {
      // 生产环境下从buildResources加载
      if (!process.env.VITE_DEV_SERVER_URL) {
        const prodIcon = path.join(process.cwd(), 'buildResources', 'icon.png');
        return prodIcon;
      }
      // 开发环境下也尝试从buildResources加载，如果不存在则使用默认路径
      const devIcon = path.join(process.cwd(), 'buildResources', 'icon.png');
      return devIcon;
    } catch {
      return fallback;
    }
  }
}