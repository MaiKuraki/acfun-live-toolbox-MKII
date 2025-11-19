import { DatabaseManager, EventWriter } from './persistence';
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
import { DiagnosticsService } from './logging/DiagnosticsService';
import { getLogManager, LogManager } from './logging/LogManager';
import { ConsoleManager } from './console/ConsoleManager';
import { acfunDanmuModule } from './adapter/AcfunDanmuModule';
import path from 'path';
import * as fs from 'fs';

const applyUserDataRedirect = () => {
  try {
    const defaultUserData = app.getPath('userData');
    const confPath = path.join(defaultUserData, 'config.json');
    if (fs.existsSync(confPath)) {
      const raw = fs.readFileSync(confPath, 'utf8');
      const parsed = JSON.parse(raw || '{}');
      const dir = parsed['config.dir'];
      if (typeof dir === 'string' && dir.trim().length > 0 && dir !== defaultUserData) {
        try { app.setPath('userData', dir); } catch {}
      }
    }
  } catch {}
};

async function main() {
  applyUserDataRedirect();
  try {
    const lm = getLogManager();
    const orig = { log: console.log, warn: console.warn, error: console.error, debug: console.debug, info: console.info };
    
    // Only intercept console methods after initial setup to avoid loops
    setTimeout(() => {
      console.log = (...args: any[]) => { 
        try { 
          const message = args.map(a => String(a)).join(' ');
          // Avoid logging database connection messages to prevent loops
          if (!message.includes('Database connected at:')) {
            lm.addLog('main', message, 'info'); 
          }
        } catch {}
        try { orig.log.apply(console, args); } catch {} 
      };
      
      console.info = (...args: any[]) => { 
        try { 
          const message = args.map(a => String(a)).join(' ');
          if (!message.includes('Database connected at:')) {
            lm.addLog('main', message, 'info'); 
          }
        } catch {}
        try { orig.info.apply(console, args); } catch {} 
      };
      
      console.warn = (...args: any[]) => { 
        try { 
          const message = args.map(a => String(a)).join(' ');
          if (!message.includes('Database connected at:')) {
            lm.addLog('main', message, 'warn'); 
          }
        } catch {}
        try { orig.warn.apply(console, args); } catch {} 
      };
      
      console.error = (...args: any[]) => { 
        try { 
          const message = args.map(a => String(a)).join(' ');
          if (!message.includes('Database connected at:')) {
            lm.addLog('main', message, 'error'); 
          }
        } catch {}
        try { orig.error.apply(console, args); } catch {} 
      };
      
      console.debug = (...args: any[]) => { 
        try { 
          const message = args.map(a => String(a)).join(' ');
          if (!message.includes('Database connected at:')) {
            lm.addLog('main', message, 'debug'); 
          }
        } catch {}
        try { orig.debug.apply(console, args); } catch {} 
      };
    }, 1000); // Delay interception to avoid early initialization loops
  } catch {}
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

  const eventWriter = new EventWriter(databaseManager);
  const roomManager = new RoomManager(eventWriter);
  
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
    tokenManager
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
  
  // 更新管理器中的apiServer引用
  (pluginManager as any).apiServer = apiServer;
  // 向 ApiServer 注入 PluginManager 以支持统一静态托管
  apiServer.setPluginManager(pluginManager);
  
  await apiServer.start();

  // 预先实例化窗口管理器以供 IPC 处理程序使用（窗口创建仍在 app ready 后）
  const windowManager = new WindowManager(); // This will need refactoring
  const pluginWindowManager = new PluginWindowManager();

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
    diagnosticsService
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
  });

  roomManager.on('roomStatusChange', (roomId: string, status: string) => {
    try {
      wsHub.broadcastRoomStatus(roomId, status);
    } catch (err) {
      console.error('[Main] Failed to broadcast room status via WsHub:', err);
    }
  });

  roomManager.on('roomAdded', (roomId: string) => {
    try {
      wsHub.broadcastRoomStatus(roomId, 'connecting');
    } catch (err) {
      console.error('[Main] Failed to broadcast room added via WsHub:', err);
    }
  });

  roomManager.on('roomRemoved', (roomId: string) => {
    try {
      wsHub.broadcastRoomStatus(roomId, 'closed');
    } catch (err) {
      console.error('[Main] Failed to broadcast room removed via WsHub:', err);
    }
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

  windowManager.createWindow(); // Placeholder for creating the main UI

  try {
    const minimizeToTray = !!configManager.get<boolean>('ui.minimizeToTray', false);
    windowManager.setMinimizeToTray(minimizeToTray);
  } catch {}

  // 弹窗能力已移除：不再转发插件弹窗事件到渲染层。

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createWindow();
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

main().catch((error: any) => {
  console.error('[Main] Unhandled error in main process:', error);
  app.quit();
});
