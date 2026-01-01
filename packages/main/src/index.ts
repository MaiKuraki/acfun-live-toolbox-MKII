import { DatabaseManager } from './persistence';
import { RoomManager } from './rooms';
import { ApiServer } from './server/ApiServer';
import { initializeIpcHandlers } from './ipc/ipcHandlers';
import { TokenManager } from './server/TokenManager';
import { app, BrowserWindow } from 'electron';
import { runDependencyGuards } from './bootstrap/dependencyGuards';
import { WindowManager } from './bootstrap/WindowManager';
import { ensureSingleInstance } from './bootstrap/SingleInstanceApp';
import { setupHardwareAcceleration } from './bootstrap/HardwareAccelerationModule';
import { ensureWorkspacePackagesPresent } from './dependencyCheck';
import { ConfigManager } from './config/ConfigManager';
import { PluginManager } from './plugins/PluginManager';
import { OverlayManager } from './plugins/OverlayManager';
import { PluginWindowManager } from './plugins/PluginWindowManager';
import { pluginConnectionPoolManager } from './plugins/ConnectionPoolManager';
import { PluginSseConnectionManager } from './server/services/PluginSseConnectionManager';
import { overlaySubscriptionRegistry } from './server/services/OverlaySubscriptionRegistry';
import { DiagnosticsService } from './logging/DiagnosticsService';
import { getLogManager, LogManager } from './logging/LogManager';
import { ConsoleManager } from './console/ConsoleManager';
import { acfunDanmuModule } from './adapter/AcfunDanmuModule';
import { installVueDevtools } from './bootstrap/ChromeDevToolsExtension';
import path from 'path';
import { DataManager } from './persistence/DataManager';
import * as fs from 'fs';

// Make windowManager available at module scope so app-level handlers can access it
let windowManager: WindowManager | null = null;

try {
  app.commandLine.appendSwitch('disable-logging');
  app.commandLine.appendSwitch('log-level', 'disable');
  app.commandLine.appendSwitch('v', '0');
} catch { }

const applyUserDataRedirect = () => {
  try {
    const defaultUserData = app.getPath('userData');
    const confPath = path.join(defaultUserData, 'config.json');
    if (fs.existsSync(confPath)) {
      const raw = fs.readFileSync(confPath, 'utf8');
      const parsed = JSON.parse(raw || '{}');
      const dir = parsed['config.dir'];
      if (typeof dir === 'string' && dir.trim().length > 0 && dir !== defaultUserData) {
        try { app.setPath('userData', dir); } catch { }
      }
    }
  } catch { }
};

async function main() {
  try {
    if (process.platform === 'win32') {
      const appId = 'acfun.live.toolbox';
      try { app.setAppUserModelId(appId); } catch { }
      try { console.log('[Main] AppUserModelId set to', appId); } catch { }
    }
  } catch { }
  applyUserDataRedirect();
  try {
    const lm = getLogManager();
    const orig = { log: console.log, warn: console.warn, error: console.error, debug: console.debug, info: console.info };

    // Only intercept console methods after initial setup to avoid loops
    setTimeout(() => {
      console.log = (...args: any[]) => {
        try {
          const message = args.map(a => String(a)).join(' ');
          const suppress = (() => {
            if (message.startsWith('[StateSignal]') || message.startsWith('[WebSocket]') || message.startsWith('[Command]')) return true;
            if (message.startsWith('[AcfunApiProxy]')) return true;
            if (message.includes('devtools://devtools') && (message.includes('Autofill.enable') || message.includes('Autofill.setAddresses'))) return true;
            return false;
          })();
          if (suppress) { return; }
          // Avoid logging database connection messages to prevent loops
          if (!message.includes('Database connected at:')) {
            lm.addLog('main', message, 'info');
          }
        } catch { }
        try { orig.log.apply(console, args); } catch { }
      };

      console.info = (...args: any[]) => {
        try {
          const message = args.map(a => String(a)).join(' ');
          const suppress = (() => {
            if (message.startsWith('[StateSignal]') || message.startsWith('[WebSocket]') || message.startsWith('[Command]')) return true;
            if (message.startsWith('[AcfunApiProxy]')) return true;
            if (message.includes('devtools://devtools') && (message.includes('Autofill.enable') || message.includes('Autofill.setAddresses'))) return true;
            return false;
          })();
          if (suppress) { return; }
          if (!message.includes('Database connected at:')) {
            lm.addLog('main', message, 'info');
          }
        } catch { }
        try { orig.info.apply(console, args); } catch { }
      };

      console.warn = (...args: any[]) => {
        try {
          const message = args.map(a => String(a)).join(' ');
          const suppress = (() => {
            if (message.startsWith('[StateSignal]') || message.startsWith('[WebSocket]') || message.startsWith('[Command]')) return true;
            if (message.startsWith('[AcfunApiProxy]')) return true;
            if (message.includes('devtools://devtools') && (message.includes('Autofill.enable') || message.includes('Autofill.setAddresses'))) return true;
            return false;
          })();
          if (suppress) { return; }
          if (!message.includes('Database connected at:')) {
            lm.addLog('main', message, 'warn');
          }
        } catch { }
        try { orig.warn.apply(console, args); } catch { }
      };

      console.error = (...args: any[]) => {
        try {
          const message = args.map(a => String(a)).join(' ');
          const suppress = (() => {
            if (message.startsWith('[StateSignal]') || message.startsWith('[WebSocket]') || message.startsWith('[Command]')) return true;
            if (message.startsWith('[AcfunApiProxy]')) return true;
            if (message.includes('devtools://devtools') && (message.includes('Autofill.enable') || message.includes('Autofill.setAddresses'))) return true;
            return false;
          })();
          if (suppress) { return; }
          if (!message.includes('Database connected at:')) {
            lm.addLog('main', message, 'error');
          }
        } catch { }
        try { orig.error.apply(console, args); } catch { }
      };

      console.debug = (...args: any[]) => {
        try {
          const message = args.map(a => String(a)).join(' ');
          const suppress = (() => {
            if (message.startsWith('[StateSignal]') || message.startsWith('[WebSocket]') || message.startsWith('[Command]')) return true;
            if (message.startsWith('[AcfunApiProxy]')) return true;
            if (message.includes('devtools://devtools') && (message.includes('Autofill.enable') || message.includes('Autofill.setAddresses'))) return true;
            return false;
          })();
          if (suppress) { return; }
          if (!message.includes('Database connected at:')) {
            lm.addLog('main', message, 'debug');
          }
        } catch { }
        try { orig.debug.apply(console, args); } catch { }
      };
    }, 1000); // Delay interception to avoid early initialization loops
  } catch { }
  // --- 0. Assert local workspace package integrity ---
  try {
    // 仅在开发模式校验本地工作区包；打包环境中跳过该检查
    if (!app.isPackaged) {
      // From compiled dist at packages/main/dist, go up to project root
      ensureWorkspacePackagesPresent(path.resolve(__dirname, '../../..'));
    }
  } catch (error: any) {
    console.error('[Main] Workspace package check failed:', error);
    app.quit();
    return;
  }

  // --- 1. Pre-flight Checks & Setup ---
  ensureSingleInstance();
  setupHardwareAcceleration();

  try {
    await runDependencyGuards();
  } catch (error: any) {
    // The guard will log the specific error. We just need to exit.
    app.quit();
    return; // Stop execution
  }

  // --- 2. Initialize Managers & Services (Stubs for now) ---
  console.log('[Main] Initializing services...');
  const databaseManager = new DatabaseManager();
  await databaseManager.initialize();
  const logManager = getLogManager();

  const roomManager = new RoomManager(null as any, databaseManager);

  // 初始化配置与插件系统
  const configManager = new ConfigManager();

  // 初始化日志和诊断服务
  const diagnosticsService = new DiagnosticsService(databaseManager, configManager);

  // 初始化Overlay管理器
  const overlayManager = new OverlayManager();

  const apiPort = configManager.get<number>('server.port', parseInt(process.env.ACFRAME_API_PORT || '18299'));

  const tokenManager = TokenManager.getInstance();
  await tokenManager.initialize();

  const pluginManager = new PluginManager({
    apiServer: null as any, // 临时设置，稍后更新
    roomManager,
    databaseManager,
    configManager,
    tokenManager,
    processManagerConfig: {
      processRecoveryEnabled: false
    }
  });

  // 初始化控制台管理器
  const consoleManager = new ConsoleManager({
    roomManager,
    pluginManager,
    databaseManager,
    configManager
  });

  // 初始化API服务器，传入所有必要的管理器
  const apiServer = new ApiServer({ port: apiPort }, databaseManager, diagnosticsService, overlayManager, consoleManager);
  apiServer.setRoomManager(roomManager);

  // 更新管理器中的apiServer引用
  (pluginManager as any).apiServer = apiServer;
  // 向 ApiServer 注入 PluginManager 以支持统一静态托管
  apiServer.setPluginManager(pluginManager);

  // 预先实例化窗口管理器以供 IPC 处理程序使用（窗口创建仍在 app ready 后）
  windowManager = new WindowManager(); // Module-scoped so handlers outside main() can reference it
  const pluginWindowManager = new PluginWindowManager(configManager);

  // 注入 PluginManager 到 PluginWindowManager 以支持窗口配置
  pluginWindowManager.setPluginManager(pluginManager);

  // 注入窗口管理器以支持HTTP窗口控制与弹窗
  apiServer.setWindowManagers(windowManager, pluginWindowManager);

  try {
    await apiServer.start();
  } catch (error: any) {
    try { console.error('[Main] API server start failed:', error?.message || String(error)); } catch { }
    // Continue startup without blocking renderer/main process
  }

  try {
    const ud = app.getPath('userData');
    const cfgPath = path.join(ud, 'config.json');
    console.info('[Main] userData path=', ud);
    try {
      if (fs.existsSync(cfgPath)) {
        const raw = fs.readFileSync(cfgPath, 'utf-8');
        const json = JSON.parse(raw || '{}');
        console.info('[Main] config.json keys=', Object.keys(json));
      } else {
        console.info('[Main] config.json not found at userData path');
      }
    } catch { }
  } catch { }

  console.info('[Main] Server ready → loading plugins');
  try {
    const pluginsCfg = configManager.get<any>('plugins', {});
    console.info('[Main] Persisted plugins config snapshot=', pluginsCfg);
  } catch { }
  try {
    pluginManager.loadInstalledPlugins();
  } catch (e) {
    console.warn('[Main] Failed to load plugins after server ready:', e instanceof Error ? e.message : String(e));
  }

  try {
    const readyPlugins = pluginManager.getInstalledPlugins().filter(p => p.enabled);
    for (const p of readyPlugins) {
      try { await pluginManager.enablePlugin(p.id); } catch (e) { console.error('[Main] Failed to enable plugin on server ready:', p.id, e); }
    }
  } catch (e) {
    console.warn('[Main] Plugin enable on server ready encountered an issue:', e instanceof Error ? e.message : String(e));
  }

  initializeIpcHandlers(
    roomManager,
    tokenManager,
    pluginManager,
    overlayManager,
    consoleManager,
    windowManager,
    pluginWindowManager,
    configManager,
    logManager,
    diagnosticsService,
    databaseManager
  );

  // --- 4. Start API Server ---
  // Wire RoomManager -> WsHub broadcasting
  const wsHub = apiServer.getWsHub();
  roomManager.on('event', (event) => {
    try {
      wsHub.broadcastEvent(event);
    } catch (err) {
      console.error('[Main] Failed to broadcast event via WsHub:', err);
    }
    try {
      const win = windowManager.getMainWindow();
      win?.webContents.send('room.event', { event_type: event.event_type, room_id: event.room_id, ts: event.ts, raw: event.raw });
    } catch { }
    try {
      const dm = DataManager.getInstance();
      const plugins = pluginManager.getInstalledPlugins().filter(p => p.enabled);
      for (const p of plugins) {
        const channel = `plugin:${p.id}:overlay`;
        dm.publish(channel, { event: 'normalized-event', payload: event }, { ttlMs: 2 * 60 * 1000, persist: true, meta: { kind: 'danmaku' } });
      }
    } catch { }
  });

  roomManager.on('roomStatusChange', (roomId: string, status: string) => {
    try {
      wsHub.broadcastRoomStatus(roomId, status);
    } catch (err) {
      console.error('[Main] Failed to broadcast room status via WsHub:', err);
    }
    try {
      const win = windowManager.getMainWindow();
      const info = roomManager.getRoomInfo(String(roomId));
      const liveIdRaw = info?.liveId ?? info?.adapter?.getCurrentLiveId() ?? null;
      const liveId = liveIdRaw ? String(liveIdRaw) : '';
      const streamInfo = info?.streamInfo ?? info?.adapter?.getCurrentStreamInfo() ?? null;
      const payloadWin = { roomId, status, liveId, streamInfo, isManager: info?.isManager } as any;
      win?.webContents.send('room.status', payloadWin);
    } catch { }
    try {
      const dm = DataManager.getInstance();
      const plugins = pluginManager.getInstalledPlugins().filter(p => p.enabled);
      const info = roomManager.getRoomInfo(String(roomId));
      const liveIdRaw = info?.liveId ?? info?.adapter?.getCurrentLiveId() ?? null;
      const liveId = liveIdRaw ? String(liveIdRaw) : '';
      const streamInfo = info?.streamInfo ?? info?.adapter?.getCurrentStreamInfo() ?? null;
      const payload = { roomId, status, liveId, streamInfo } as any;
      for (const p of plugins) {
        const channel = `plugin:${p.id}:overlay`;
        dm.publish(channel, { event: 'room-status-change', payload }, { ttlMs: 2 * 60 * 1000, persist: true, meta: { kind: 'room' } });
      }
    } catch { }
  });

  roomManager.on('roomAdded', (roomId: string) => {
    try {
      wsHub.broadcastRoomStatus(roomId, 'connecting');
    } catch (err) {
      console.error('[Main] Failed to broadcast room added via WsHub:', err);
    }
    try {
      const dm = DataManager.getInstance();
      const plugins = pluginManager.getInstalledPlugins().filter(p => p.enabled);
      const payload = { roomId, ts: Date.now() };
      for (const p of plugins) {
        const channel = `plugin:${p.id}:overlay`;
        dm.publish(channel, { event: 'room-added', payload }, { ttlMs: 2 * 60 * 1000, persist: true, meta: { kind: 'room' } });
      }
    } catch { }
  });

  roomManager.on('roomRemoved', (roomId: string) => {
    try {
      wsHub.broadcastRoomStatus(roomId, 'closed');
    } catch (err) {
      console.error('[Main] Failed to broadcast room removed via WsHub:', err);
    }
    try {
      const dm = DataManager.getInstance();
      const plugins = pluginManager.getInstalledPlugins().filter(p => p.enabled);
      const payload = { roomId, ts: Date.now() };
      for (const p of plugins) {
        const channel = `plugin:${p.id}:overlay`;
        dm.publish(channel, { event: 'room-removed', payload }, { ttlMs: 2 * 60 * 1000, persist: true, meta: { kind: 'room' } });
      }
    } catch { }
  });

  // --- 3. Application Ready ---
  await app.whenReady();

  console.log('[Main] App is ready.');

  // Ensure AcfunDanmuModule is initialized so IPC room.details can fetch data
  try {
    await acfunDanmuModule.initialize();
    console.log('[Main] AcfunDanmuModule initialized.');
  } catch (err) {
    console.error('[Main] Failed to initialize AcfunDanmuModule:', err);
  }

  try {
    // Default behavior preserved for dev; can be disabled for memory profiling.
    const flag = String(process.env.ACFRAME_INSTALL_VUE_DEVTOOLS || '').trim().toLowerCase();
    const enabled =
      flag === '1' || flag === 'true' || flag === 'on'
        ? true
        : flag === '0' || flag === 'false' || flag === 'off'
          ? false
          : !app.isPackaged; // default: enable in dev only
    if (enabled) {
      await installVueDevtools();
    }
  } catch { }
  windowManager.createWindow();

  try {
    const minimizeToTray = !!configManager.get<boolean>('ui.minimizeToTray', false);
    windowManager.setMinimizeToTray(minimizeToTray);
  } catch { }

  // 弹窗能力已移除：不再转发插件弹窗事件到渲染层。

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createWindow();
    }
  });

  // --- 5. Setup Renderer Event Listeners for Plugins ---
  // Listen to various events and publish them to plugin SSE channels as renderer events
  const dm = DataManager.getInstance();
  const readonlyStoreChannel = 'renderer:readonly-store';

  // Helper function to publish renderer events to all enabled plugins
  // For plugin state change events, publish to all installed plugins (not just enabled ones)
  const publishRendererEvent = (event: string, payload: any, includeDisabled = false) => {
    try {
      const plugins = includeDisabled
        ? pluginManager.getInstalledPlugins()
        : pluginManager.getInstalledPlugins().filter(p => p.enabled);
      for (const p of plugins) {
        const channel = `plugin:${p.id}:overlay`;
        dm.publish(channel, { event, payload }, { ttlMs: 2 * 60 * 1000, persist: true, meta: { kind: 'renderer' } });
      }
    } catch (err) {
      console.error('[Main] Failed to publish renderer event:', err);
    }
  };

  // 1. User Login/Logout events
  tokenManager.on('loginSuccess', (data: { tokenInfo: any }) => {
    try {
      const userInfo = data.tokenInfo;
      publishRendererEvent('user-login', {
        userId: userInfo?.userID || '',
        //  userInfo 
      });
    } catch (err) {
      console.error('[Main] Failed to handle loginSuccess event:', err);
    }
  });

  tokenManager.on('logout', () => {
    try {
      publishRendererEvent('user-logout', {});
    } catch (err) {
      console.error('[Main] Failed to handle logout event:', err);
    }
  });

  // Also listen to IPC handlers for login/logout
  // Note: These are handled in ipcHandlers.ts, but we can also listen here for redundancy
  // The TokenManager events should be sufficient

  // 2. Route change events (from readonly-store channel)
  try {
    dm.subscribe(readonlyStoreChannel, (record: any) => {
      try {
        // The record structure: { payload: { event: 'readonly-store-update', payload: { ui: {...} } } }
        const recordPayload = record?.payload;
        const innerPayload = recordPayload?.payload || recordPayload;
        if (innerPayload && innerPayload.ui) {
          const ui = innerPayload.ui;
          if (ui.routePath !== undefined || ui.pageName !== undefined) {
            publishRendererEvent('route-change', {
              routePath: ui.routePath || '',
              pageName: ui.pageName || '',
              pageTitle: ui.pageTitle || ''
            });
          }
        }
      } catch (err) {
        // Silently ignore errors in route change handling
      }
    });
  } catch (err) {
    console.warn('[Main] Failed to subscribe to readonly-store for route changes:', err);
  }

  // 3. Danmaku collection start/stop events (from RoomManager roomStatusChange)
  // Note: Danmaku collection is independent from live streaming
  roomManager.on('roomStatusChange', (roomId: string, status: string) => {
    try {
      // When status becomes 'open', danmaku collection starts
      if (status === 'open') {
        publishRendererEvent('danmaku-collection-start', { roomId });
      } else if (status === 'closed' || status === 'error' || status === 'disconnected') {
        // When status becomes 'closed' or 'error', danmaku collection stops
        publishRendererEvent('danmaku-collection-stop', { roomId });
      }
    } catch (err) {
      console.error('[Main] Failed to handle roomStatusChange for renderer events:', err);
    }
  });

  // 4. Room removed events (always triggers danmaku collection stop)
  roomManager.on('roomRemoved', (roomId: string) => {
    try {
      // When room is removed, danmaku collection definitely stops
      publishRendererEvent('danmaku-collection-stop', { roomId });
    } catch (err) {
      console.error('[Main] Failed to handle roomRemoved for renderer events:', err);
    }
  });

  // 5. System config changes
  // Wrap ConfigManager to emit events when config changes
  // Note: We monitor config changes through the readonly-store channel and IPC handlers
  // The system.updateConfig IPC handler already handles config updates, so we can
  // also listen there, but for now we'll wrap the methods directly
  const originalSet = configManager.set.bind(configManager);
  const originalSetAll = configManager.setAll.bind(configManager);

  (configManager as any).set = function <T>(key: string, value: T) {
    originalSet(key, value);
    try {
      publishRendererEvent('config-updated', { key, value });
    } catch (err) {
      console.error('[Main] Failed to publish config-updated event:', err);
    }
  };

  (configManager as any).setAll = function (updates: Record<string, any>) {
    // 只发布实际发生变更的配置项
    const changed: Array<{ key: string; value: any }> = [];
    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = configManager.get(key);
      // 使用深度比较或 JSON 序列化比较来判断值是否真的变化了
      const oldJson = JSON.stringify(oldValue);
      const newJson = JSON.stringify(newValue);
      if (oldJson !== newJson) {
        changed.push({ key, value: newValue });
      }
    }
    originalSetAll(updates);
    try {
      for (const { key, value } of changed) {
        publishRendererEvent('config-updated', { key, value });
      }
    } catch (err) {
      console.error('[Main] Failed to publish config-updated events:', err);
    }
  };

  // 6. Plugin state changes
  // Note: For plugin state change events, we publish to all installed plugins (not just enabled ones)
  // so that plugins can receive their own disable/uninstall events
  pluginManager.on('plugin.enabled', ({ id }: { id: string }) => {
    try {
      publishRendererEvent('plugin-enabled', { pluginId: id }, true);
    } catch (err) {
      console.error('[Main] Failed to handle plugin.enabled for renderer events:', err);
    }
  });

  pluginManager.on('plugin.disabled', ({ id }: { id: string }) => {
    try {
      // Publish to all plugins so the disabled plugin can receive its own event
      publishRendererEvent('plugin-disabled', { pluginId: id }, true);
    } catch (err) {
      console.error('[Main] Failed to handle plugin.disabled for renderer events:', err);
    }
    // 主进程主动清理：关闭插件窗口、关闭连接池中的连接、关闭 SSE 连接并清理订阅
    try {
      // 1) 关闭插件独立窗口（若存在）
      try { pluginWindowManager.close(id).catch(() => { }); } catch { }
    } catch { }
    try {
      // 2) 关闭插件在连接池中的所有连接
      try { pluginConnectionPoolManager.closePluginConnections(id); } catch { }
    } catch { }
    try {
      // 3) 关闭插件的 SSE 连接（立即结束 response 并注销）
      try { PluginSseConnectionManager.getInstance().closePluginConnections(id); } catch { }
    } catch { }
    try {
      // 4) 清理 overlay 订阅注册表，确保后续不会收到消息
      try { overlaySubscriptionRegistry.clearPluginSubscriptions(id); } catch { }
    } catch { }
  });

  pluginManager.on('plugin.uninstalled', ({ id }: { id: string }) => {
    try {
      // Publish to all plugins so the uninstalled plugin can receive its own event
      publishRendererEvent('plugin-uninstalled', { pluginId: id }, true);
    } catch (err) {
      console.error('[Main] Failed to handle plugin.uninstalled for renderer events:', err);
    }
  });

  // 7. App closing event
  app.on('before-quit', () => {
    try {
      publishRendererEvent('app-closing', {});
    } catch (err) {
      console.error('[Main] Failed to handle before-quit for renderer events:', err);
    }
    // Cleanup plugin windows
    try {
      pluginWindowManager.destroy();
    } catch (err) {
      console.error('[Main] Failed to destroy plugin windows:', err);
    }
  });
}

app.on('window-all-closed', () => {
  // 如果启用了托盘功能且不是macOS，不退出应用以保持托盘运行
  if (process.platform !== 'darwin' && !windowManager.isMinimizeToTrayEnabled()) {
    app.quit();
  }
});

main().catch((error: any) => {
  console.error('[Main] Unhandled error in main process:', error);
  app.quit();
});
