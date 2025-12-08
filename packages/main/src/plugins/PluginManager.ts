import { TypedEventEmitter } from '../utils/TypedEventEmitter';
import { ApiServer } from '../server/ApiServer';
import { RoomManager } from '../rooms/RoomManager';
import { DatabaseManager } from '../persistence/DatabaseManager';
import { ConfigManager } from '../config/ConfigManager';
import { ApiBridge, PluginAPI } from './ApiBridge';
import { ProcessManager, ProcessManagerConfig } from './ProcessManager';
import { pluginLifecycleManager } from './PluginLifecycle';
import { PluginUpdater } from './PluginUpdater';
import { pluginLogger } from './PluginLogger';
import { pluginErrorHandler, ErrorType, RecoveryAction } from './PluginErrorHandler';
import { DataManager } from '../persistence/DataManager';
import { pluginHotReloadManager, HotReloadConfig } from './PluginHotReload';
import { pluginVersionManager } from './PluginVersionManager';
import { MemoryPoolManager } from './MemoryPoolManager';
import { PluginConnectionPoolManager } from './ConnectionPoolManager';
import { PluginCoordinator } from './PluginCoordinator';
import { pluginCacheManager } from './PluginCacheManager';
import { pluginPerformanceMonitor } from './PluginPerformanceMonitor';
import { pluginLazyLoader } from './PluginLazyLoader';
import { TokenManager } from '../server/TokenManager';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { app } from 'electron';
import { watch, FSWatcher } from 'chokidar';
import AdmZip from 'adm-zip';
import tar from 'tar';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  test?: boolean;
  icon?: string;
  main: string;
  libs?: string[];
  permissions?: string[];
  minAppVersion?: string;
  maxAppVersion?: string;
  // 配置清单（用于渲染层生成配置表单）
  config?: Record<string, any>;
  ui?: {
    name?: string;
    description?: string;
    // 统一静态托管字段（新）
    spa?: boolean;
    route?: string;
    html?: string;
    wujie?: {
      url: string;
      spa?: boolean;
      route?: string;
    };
  };
  overlay?: {
    // 统一静态托管字段（新）
    spa?: boolean;
    route?: string;
    html?: string;
    wujie?: {
      url: string;
      spa?: boolean;
      route?: string;
    };
  };
  // 新增窗口页（与 UI 区分）：统一静态托管字段
  window?: {
    spa?: boolean;
    route?: string;
    html?: string;
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    resizable?: boolean;
    frame?: boolean;
    transparent?: boolean;
    alwaysOnTop?: boolean;
  };
  runtime?: never;
}

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  enabled: boolean;
  status: 'installed' | 'enabled' | 'disabled' | 'error' | 'loading';
  installPath: string;
  manifest: PluginManifest;
  installedAt: number;
  lastError?: string;
  hotReloadEnabled?: boolean;
}

export interface PluginInstallOptions {
  filePath: string;
  overwrite?: boolean;
  enable?: boolean;
}

export interface PluginManagerEvents {
  'plugin.suspended': { id: string; reason: string };
  'plugin.installed': { plugin: PluginInfo };
  'plugin.uninstalled': { id: string };
  'plugin.enabled': { id: string };
  'plugin.disabled': { id: string };
  'plugin.error': { id: string; error: string };
  'plugin.install.progress': { id: string; progress: number; message: string };
}

/**
 * PluginManager 负责插件生命周期与受控 API 提供。
 * 目前阶段实现：为插件创建 ApiBridge、代理路由注册、后续扩展安装/启用/暂停。
 */
export class PluginManager extends TypedEventEmitter<PluginManagerEvents> {
  private apiServer: ApiServer;
  private roomManager: RoomManager;
  private databaseManager: DatabaseManager;
  private configManager: ConfigManager;
  private processManager: ProcessManager;
  private pluginUpdater: PluginUpdater;
  private memoryPoolManager: MemoryPoolManager;
  private connectionPoolManager: PluginConnectionPoolManager;
  private coordinator: PluginCoordinator;
  private tokenManager: TokenManager;
  private plugins: Map<string, PluginInfo> = new Map();
  public pluginsDir: string;
  private hotReloadWatchers: Map<string, FSWatcher> = new Map();
  private dataManager = DataManager.getInstance();
  private pendingInitAfterLoaded: Set<string> = new Set();

  constructor(opts: {
    apiServer: ApiServer;
    roomManager: RoomManager;
    databaseManager: DatabaseManager;
    configManager: ConfigManager;
    tokenManager: TokenManager;
    processManagerConfig?: Partial<ProcessManagerConfig>;
  }) {
    super();
    this.apiServer = opts.apiServer;
    this.roomManager = opts.roomManager;
    this.databaseManager = opts.databaseManager;
    this.configManager = opts.configManager;
    this.tokenManager = opts.tokenManager;
    this.processManager = new ProcessManager(opts.processManagerConfig);
    this.pluginsDir = path.join(app.getPath('userData'), 'plugins');
    this.pluginUpdater = new PluginUpdater(this.pluginsDir, {
      autoCheck: false,
      autoDownload: false,
      autoInstall: false,
      checkInterval: 24 * 60 * 60 * 1000, // 24小时
      backupBeforeUpdate: true,
      rollbackOnFailure: true
    });
    
    // 初始化性能优化组件
    this.memoryPoolManager = new MemoryPoolManager();
    this.connectionPoolManager = new PluginConnectionPoolManager();
    this.coordinator = new PluginCoordinator({
      memoryPool: this.memoryPoolManager,
      connectionPool: this.connectionPoolManager,
      updater: this.pluginUpdater,
    });
    
    this.ensurePluginsDirectory();
    this.setupErrorHandling();
    this.setupProcessManagerEvents();
    this.setupLifecycleEvents();
    this.setupHotReloadEvents();
    this.setupPerformanceOptimizations();
    // defer plugin loading until API server is ready
  }

  private setupProcessManagerEvents(): void {
    // 监听进程管理器事件
    this.processManager.on('process.started', ({ pluginId, processInfo }) => {
      const plugin = this.plugins.get(pluginId);
      if (plugin) {
        plugin.status = 'enabled';
        pluginLogger.info('Plugin process started successfully', pluginId);
      }
      try { this.processManager.executeInPlugin(pluginId, 'afterloaded', [], undefined, { optional: true }); } catch {}
      try {
        const { SseQueueService } = require('../server/SseQueueService');
        const channel = `plugin:${pluginId}:overlay`;
        SseQueueService.getInstance().queueOrPublish(channel, { event: 'plugin-after-loaded', payload: { ts: Date.now() } }, { ttlMs: 2 * 60 * 1000, persist: true, meta: { kind: 'lifecycle' } });
      } catch {}
    });

    this.processManager.on('process.stopped', ({ pluginId, reason }) => {
      const plugin = this.plugins.get(pluginId);
      if (plugin) {
        plugin.status = reason === 'manual' ? 'disabled' : 'error';
        pluginLogger.info('Plugin process stopped', pluginId);
      }
    });

    this.processManager.on('process.error', async ({ pluginId, error }) => {
      const plugin = this.plugins.get(pluginId);
      if (plugin) {
        plugin.status = 'error';
        plugin.lastError = error.message;
        this.emit('plugin.error', { id: pluginId, error: error.message });
        
        // 报告错误到错误处理器
        await pluginErrorHandler.handleError(
          pluginId,
          ErrorType.RUNTIME_ERROR,
          error.message,
          error,
          { context: 'process_manager' }
        );
      }
    });

    this.processManager.on('process.recovered', ({ pluginId, attempt }) => {
      const plugin = this.plugins.get(pluginId);
      if (plugin) {
        plugin.status = 'enabled';
        plugin.lastError = undefined;
        pluginLogger.info('Plugin process recovered successfully', pluginId);
      }
    });
  }

  private setupLifecycleEvents(): void {
    // 设置生命周期钩子（afterLoaded 通过进程启动事件触发，不再需要注册）


    pluginLifecycleManager.registerHook('onError', async (data) => {
      pluginLogger.error('Plugin error occurred', data.pluginId);
      // 使用handleError方法而不是reportError
      if (data.error) {
        await pluginErrorHandler.handleError(
          data.pluginId, 
          ErrorType.RUNTIME_ERROR, 
          data.error.message, 
          data.error, 
          data.context
        );
      }
      try { await this.processManager.executeInPlugin(data.pluginId, 'onError', [data.error, data.context]); } catch {}
      try {
        const { SseQueueService } = require('../server/SseQueueService');
        const channel = `plugin:${data.pluginId}:overlay`;
        SseQueueService.getInstance().queueOrPublish(channel, { event: 'plugin-error', payload: { message: data.error?.message, context: data.context } }, { ttlMs: 2 * 60 * 1000, persist: true, meta: { kind: 'lifecycle' } });
      } catch {}
    });

    // 监听更新器事件
    this.pluginUpdater.on('update.available', ({ pluginId }) => {
      pluginLogger.info('Plugin update available', pluginId);
    });

    this.pluginUpdater.on('update.progress', ({ pluginId, progress, message }) => {
      this.emit('plugin.install.progress', { id: pluginId, progress, message });
    });

    this.pluginUpdater.on('update.completed', ({ pluginId }) => {
      pluginLogger.info('Plugin update completed', pluginId);
      // 重新加载插件信息
      this.loadInstalledPlugins();
    });

    this.pluginUpdater.on('update.failed', async ({ pluginId, error }) => {
      pluginLogger.error('Plugin update failed', pluginId, error);
      await pluginErrorHandler.handleError(pluginId, ErrorType.RUNTIME_ERROR, error.message, error);
    });
  }

  private setupErrorHandling(): void {
    const dm = DataManager.getInstance();
    pluginErrorHandler.on('plugin-error', (err: any) => {
      try {
        const entry = { level: 'error', source: 'plugin', pluginId: String(err?.pluginId || ''), message: String(err?.message || ''), timestamp: Date.now() };
        dm.publish('system:logs', entry, { ttlMs: 10 * 60 * 1000, persist: true, meta: { kind: 'log' } });
      } catch {}
      try {
        const pid = String(err?.pluginId || '');
        const msg = String(err?.message || '');
        const e = err?.error;
        if (e && e.stack) {
          console.error('[PluginError]', pid, msg, '\n', e.stack);
        } else {
          console.error('[PluginError]', pid, msg);
        }
      } catch {}
    });
    // 监听错误处理器的恢复事件
    pluginErrorHandler.on('recovery-execute', async (event) => {
      const { pluginId, action } = event;
      
      try {
        switch (action) {
          case RecoveryAction.DISABLE:
            await this.disablePlugin(pluginId);
            break;
          case RecoveryAction.UNINSTALL:
            await this.uninstallPlugin(pluginId);
            break;
          case RecoveryAction.RETRY:
            // 重试逻辑将在具体的操作方法中处理
            break;
          case RecoveryAction.REINSTALL:
            // 重新安装需要原始安装文件，这里先记录日志
            pluginLogger.warn(`Reinstall requested for plugin but no source file available`, pluginId);
            break;
        }
      } catch (error: any) {
        pluginLogger.error(`Failed to execute recovery action: ${action}`, pluginId, error as Error);
      }
    });
  }

  private setupHotReloadEvents(): void {
    // 监听热重载事件
    pluginHotReloadManager.on('reload-requested', async ({ pluginId }) => {
      pluginLogger.info('Hot reload requested', pluginId);

      try {
        await this.reloadPlugin(pluginId);
      } catch (error: any) {
        pluginLogger.error('Hot reload failed', pluginId, error as Error);
        await pluginErrorHandler.handleError(pluginId, ErrorType.RUNTIME_ERROR, (error as Error).message, error as Error, {
          context: 'hot_reload'
        });
      }
    });

    pluginHotReloadManager.on('reload-completed', ({ pluginId }) => {
      pluginLogger.info('Hot reload completed successfully', pluginId);
    });

    pluginHotReloadManager.on('reload-failed', ({ pluginId, error }) => {
      pluginLogger.error('Hot reload failed', pluginId, new Error(error || 'Unknown error'));
    });

    pluginHotReloadManager.on('watch-error', ({ pluginId, error }) => {
      pluginLogger.error('File watch error', pluginId);
    });
  }

  private setupPerformanceOptimizations(): void {
    // 设置性能监控事件
    const _criticalCounts: Map<string, number> = new Map();
    pluginPerformanceMonitor.on('performance-alert', (alert) => {
      pluginLogger.warn(`Performance alert for plugin ${alert.pluginId}`, alert.pluginId, {
        alertType: alert.type,
        severity: alert.severity,
        message: alert.message,
        value: alert.value,
        threshold: alert.threshold
      });
      if (alert.severity === 'critical') {
        const c = (_criticalCounts.get(alert.pluginId) || 0) + 1;
        _criticalCounts.set(alert.pluginId, c);
        if (c >= 2) {
          this.suspendPlugin(alert.pluginId, `Performance issue: ${alert.message}`);
          _criticalCounts.set(alert.pluginId, 0);
        }
      } else {
        _criticalCounts.set(alert.pluginId, 0);
      }
    });

    // 设置缓存管理事件
    pluginCacheManager.on('cache-evicted', ({ key, reason, pluginId }) => {
      pluginLogger.debug('Cache item evicted', pluginId, { key, reason });
    });

    // 设置懒加载事件
    pluginLazyLoader.on('plugin-load-failed', ({ pluginId, error }) => {
      pluginLogger.error('Lazy load failed', pluginId, error);
      const plugin = this.plugins.get(pluginId);
      if (plugin) {
        plugin.status = 'error';
        plugin.lastError = error.message;
      }
    });

    pluginLazyLoader.on('memory-pressure', ({ currentUsage, threshold }) => {
      pluginLogger.warn('Memory pressure detected', undefined, {
        currentUsage: Math.round(currentUsage / 1024 / 1024) + 'MB',
        threshold: Math.round(threshold / 1024 / 1024) + 'MB'
      });
    });

    pluginLogger.info('Performance optimizations initialized');
  }

  private ensurePluginsDirectory(): void {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  public loadInstalledPlugins(): void {
    pluginLogger.info('Loading installed plugins');
    
    // 彻底清空当前插件列表，确保与文件系统状态一致
    this.plugins.clear();

    try {
      const pluginDirs = fs.readdirSync(this.pluginsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      pluginLogger.info(`Found ${pluginDirs.length} plugin directories`);

      for (const pluginId of pluginDirs) {
        try {
          const pluginPath = path.join(this.pluginsDir, pluginId);
          const manifestPath = path.join(pluginPath, 'manifest.json');
          
          if (fs.existsSync(manifestPath)) {
             let manifest: PluginManifest;
             try {
               manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as PluginManifest;
             } catch (parseErr) {
               throw parseErr instanceof Error ? parseErr : new Error(String(parseErr));
             }

             const configKey = `plugins.${pluginId}`;
             const pluginConfig = this.configManager.get(configKey, { enabled: false, installedAt: Date.now() });
             
             const pluginInfo: PluginInfo = {
               id: pluginId,
               name: manifest.name,
               version: manifest.version,
               description: manifest.description,
               author: manifest.author,
               enabled: pluginConfig.enabled,
               status: pluginConfig.enabled ? 'enabled' : 'disabled',
               installPath: pluginPath,
               manifest: manifest,
               installedAt: pluginConfig.installedAt || Date.now()
             };
            
            this.plugins.set(pluginId, pluginInfo);
            pluginLogger.info(`Loaded plugin: ${manifest.name} v${manifest.version}`, pluginId);
            // 加载阶段不再触发 afterLoaded 或执行同名函数；仅记录插件加载日志
          } else {
            pluginLogger.warn(`Plugin directory missing manifest.json`, pluginId, { pluginPath });
          }
        } catch (error: any) {
          const errorMessage = `Failed to load plugin: ${error instanceof Error ? error.message : 'Unknown error'}`;
          pluginLogger.error(errorMessage, pluginId);
          
          // 使用错误处理器处理加载失败
          pluginErrorHandler.handleError(
            pluginId,
            ErrorType.LOAD_FAILED,
            errorMessage,
            error as Error,
            { pluginPath: path.join(this.pluginsDir, pluginId) }
          );
          
          // 创建错误状态的插件信息
          const errorPluginInfo: PluginInfo = {
            id: pluginId,
            name: pluginId,
            version: '0.0.0',
            enabled: false,
            status: 'error',
            installPath: path.join(this.pluginsDir, pluginId),
            manifest: {
              id: pluginId,
              name: pluginId,
              version: '0.0.0',
              main: 'index.js'
            },
            installedAt: Date.now(),
            lastError: errorMessage
          };
          
          this.plugins.set(pluginId, errorPluginInfo);
        }
      }
      
      // 合并调试插件虚拟条目（从 .devtools/config.json 读取）
      try {
        const devConfigPath = path.join(this.pluginsDir, '.devtools', 'config.json');
        const devMap = fs.existsSync(devConfigPath) ? JSON.parse(fs.readFileSync(devConfigPath, 'utf-8')) : {};
        if (devMap && typeof devMap === 'object') {
          for (const [pid, cfg] of Object.entries(devMap as Record<string, any>)) {
            if (this.plugins.has(pid)) continue;
            try {
              const mPath = String((cfg as any)?.manifestPath || '').trim();
              const nPath = String((cfg as any)?.nodePath || '').trim();
              if (!mPath || !nPath) continue;
              const text = fs.readFileSync(mPath, 'utf-8');
              const manifest = JSON.parse(text) as PluginManifest;
              
              const configKey = `plugins.${manifest.id}`;
              const pluginConfig = this.configManager.get(configKey, { enabled: false });

              // 组装虚拟插件信息
              const pluginInfo: PluginInfo = {
                id: manifest.id,
                name: manifest.name,
                version: manifest.version,
                description: manifest.description,
                author: manifest.author,
                enabled: pluginConfig.enabled,
                status: pluginConfig.enabled ? 'enabled' : 'disabled',
                installPath: nPath,
                manifest,
                installedAt: Date.now()
              };
              this.plugins.set(pid, pluginInfo);
              pluginLogger.info(`Loaded dev plugin entry: ${manifest.name} v${manifest.version}`, pid);
            } catch (e) {
              pluginLogger.warn('Failed to load dev plugin entry', pid, e as Error);
            }
          }
        }
      } catch (e) {
        pluginLogger.warn('Failed to merge dev plugin entries', undefined, e as Error);
      }

      pluginLogger.info(`Successfully loaded ${this.plugins.size} plugins`);
    } catch (error: any) {
      const errorMessage = `Failed to load installed plugins: ${error instanceof Error ? error.message : 'Unknown error'}`;
      pluginLogger.error(errorMessage, undefined, error as Error);
      
      pluginErrorHandler.handleError(
        'system',
        ErrorType.LOAD_FAILED,
        errorMessage,
        error as Error,
        { pluginsDir: this.pluginsDir }
      );
    }
  }

  /**
   * 获取所有已安装的插件信息
   */
  public getInstalledPlugins(): PluginInfo[] {
    // 轻量同步：若安装目录缺失，将插件标记为禁用并错误状态，避免 UI 显示“启用中”假象
    for (const plugin of this.plugins.values()) {
      if (!plugin.installPath || !fs.existsSync(plugin.installPath)) {
        if (plugin.enabled) {
          plugin.enabled = false;
        }
        plugin.status = 'error';
        plugin.lastError = '插件安装目录不存在或已被删除';
      }
    }
    return Array.from(this.plugins.values());
  }

  /**
   * 获取指定插件信息
   */
  public getPlugin(pluginId: string): PluginInfo | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 验证插件文件
   */
  public async validatePluginFile(filePath: string): Promise<PluginManifest> {
    let tempDir: string | undefined;
    
    try {
      // 验证文件存在
      if (!fs.existsSync(filePath)) {
        throw new Error('插件文件不存在');
      }

      // 解压插件文件到临时目录
      tempDir = path.join(this.pluginsDir, '.temp', crypto.randomUUID());
      await this.extractPlugin(filePath, tempDir);

      // 验证插件清单
      const manifest = await this.validatePluginManifest(tempDir);
      
      return manifest;
    } finally {
      // 清理临时目录
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * 安装插件
   */
  public async installPlugin(options: PluginInstallOptions): Promise<PluginInfo> {
    const { filePath, overwrite = false, enable = false } = options;
    let tempDir: string | undefined;
    let pluginId = 'unknown';
    let manifest: PluginManifest | undefined;
    
    pluginLogger.info('Starting plugin installation', undefined, { filePath, overwrite, enable });
    this.emit('plugin.install.progress', { id: 'temp', progress: 0, message: '开始安装插件...' });
    
    try {
      // 验证文件存在
      if (!fs.existsSync(filePath)) {
        throw new Error('插件文件不存在');
      }

      // 解压插件文件到临时目录
      tempDir = path.join(this.pluginsDir, '.temp', crypto.randomUUID());
      await this.extractPlugin(filePath, tempDir);
      
      this.emit('plugin.install.progress', { id: 'temp', progress: 30, message: '解压插件文件...' });

      // 验证插件清单
      manifest = await this.validatePluginManifest(tempDir);
      pluginId = manifest.id;
      
      pluginLogger.info(`Installing plugin: ${manifest.name} v${manifest.version}`, pluginId);
      this.emit('plugin.install.progress', { id: manifest.id, progress: 50, message: '验证插件清单...' });


      // 检查插件是否已存在
      if (this.plugins.has(manifest.id) && !overwrite) {
        throw new Error(`插件 ${manifest.id} 已存在，请选择覆盖安装`);
      }

      this.emit('plugin.install.progress', { id: manifest.id, progress: 70, message: '准备安装插件...' });

      // 移动插件到最终目录
      const finalPath = path.join(this.pluginsDir, manifest.id);
      if (fs.existsSync(finalPath)) {
        fs.rmSync(finalPath, { recursive: true, force: true });
      }
      fs.renameSync(tempDir, finalPath);
      tempDir = undefined; // 标记已移动，避免清理
      
      this.emit('plugin.install.progress', { id: manifest.id, progress: 90, message: '安装插件文件...' });

      // 创建插件信息
      const pluginInfo: PluginInfo = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        enabled: enable,
        status: enable ? 'enabled' : 'disabled',
        installPath: finalPath,
        manifest,
        installedAt: Date.now()
      };

      // 保存插件配置
      const configKey = `plugins.${manifest.id}`;
      this.configManager.set(configKey, {
        enabled: enable,
        installedAt: pluginInfo.installedAt
      });

      this.plugins.set(manifest.id, pluginInfo);
      
      // 注册插件版本
      pluginVersionManager.registerPluginVersion(manifest.id, manifest);
      
      // 重置该插件的错误计数
      pluginErrorHandler.resetRetryCount(manifest.id);
      
      
      pluginLogger.info(`Successfully installed plugin: ${manifest.name} v${manifest.version}`, pluginId);
      this.emit('plugin.install.progress', { id: manifest.id, progress: 100, message: '安装完成' });
      this.emit('plugin.installed', { plugin: pluginInfo });

      return pluginInfo;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 执行 onError 生命周期钩子
      if (manifest) {
        await pluginLifecycleManager.executeHook('onError', {
          pluginId: manifest.id,
          error: error as Error,
          context: { phase: 'install', filePath, overwrite, enable }
        });
      }
      
      pluginLogger.error(`Failed to install plugin: ${errorMessage}`, pluginId, error as Error, { filePath });
      
      // 使用错误处理器处理安装失败
      const recoveryAction = await pluginErrorHandler.handleError(
        pluginId,
        ErrorType.INSTALL_FAILED,
        errorMessage,
        error as Error,
        { filePath, overwrite, enable }
      );
      
      // 清理临时文件
      if (tempDir && fs.existsSync(tempDir)) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          pluginLogger.warn(`Failed to cleanup temp directory: ${tempDir}`, pluginId, cleanupError as Error);
        }
      }
      
      this.emit('plugin.error', { id: pluginId, error: errorMessage });
      throw error;
    }
  }

  /**
   * 重新加载插件（更新清单并重启）
   */
  public async reloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }

    pluginLogger.info('Reloading plugin...', pluginId);

    try {
      // 1. 重新加载清单信息
      await this.reloadPluginInfo(pluginId);

      // 2. 如果插件已启用，重启它
      if (plugin.enabled) {
        await this.disablePlugin(pluginId);
        // 等待资源释放
        await new Promise(resolve => setTimeout(resolve, 100));
        await this.enablePlugin(pluginId);
      }
      
      pluginLogger.info('Plugin reloaded successfully', pluginId);
    } catch (error: any) {
      pluginLogger.error('Failed to reload plugin', pluginId, error);
      throw error;
    }
  }

  /**
   * 卸载插件
   */
  public async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    
    // 尝试移除测试/开发插件配置 (Test Plugin Logic)
    // 如果是测试插件，removeDevConfig 会移除 JSON 条目并返回 true
    const isTestPlugin = await this.removeDevConfig(pluginId);

    // 当插件未在内存中（例如用户手动删除了目录），执行幂等卸载清理
    if (!plugin) {
      if (isTestPlugin) {
        this.emit('plugin.uninstalled', { id: pluginId });
        return;
      }

      const installPath = path.join(this.pluginsDir, pluginId);
      try {
        if (fs.existsSync(installPath)) {
          fs.rmSync(installPath, { recursive: true, force: true });
        }
      } catch (fsErr) {
        pluginLogger.warn('卸载缺失插件时删除目录失败', pluginId, fsErr as Error);
        // 这里是否抛出？用户可能只是想清理残留。
        // 既然目录缺失或已经在清理，我们可以宽容一点，或者抛出让用户知道文件锁住了。
        // 但如果是“缺失插件”，意味着目录可能本就不完整。
        // 遵循严格模式：如果文件存在但删除失败，抛出。
        if (fs.existsSync(installPath)) {
             throw fsErr;
        }
      }

      // 删除插件配置
      const configKey = `plugins.${pluginId}`;
      this.configManager.delete(configKey);

      // 保守触发事件，供前端刷新状态
      this.emit('plugin.uninstalled', { id: pluginId });
      return; // 幂等卸载完成
    }

    try {
      // 如果插件已启用，先禁用
      if (plugin.enabled) {
        await this.disablePlugin(pluginId);
      }

      // 区分处理：
      // 1. 测试插件 (isTestPlugin=true): 仅修改 JSON (已在上面完成)，不删文件。
      // 2. 普通插件: 删除目录。
      
      const isManagedPlugin = plugin.installPath.toLowerCase().startsWith(this.pluginsDir.toLowerCase());
      
      if (!isTestPlugin && isManagedPlugin) {
        // 普通插件：严格删除文件
        if (fs.existsSync(plugin.installPath)) {
            try {
              fs.rmSync(plugin.installPath, { recursive: true, force: true });
            } catch (fsErr) {
              pluginLogger.warn('删除插件目录失败', pluginId, fsErr as Error);
              throw fsErr; // 抛出错误，阻止后续状态清除
            }
        }
      } else {
        pluginLogger.info('跳过删除插件文件（测试/外部插件）', pluginId, { path: plugin.installPath });
      }

      // 删除插件配置
      const configKey = `plugins.${pluginId}`;
      this.configManager.delete(configKey);

      // 从内存中移除
      this.plugins.delete(pluginId);

      this.emit('plugin.uninstalled', { id: pluginId });
    } catch (error: any) {
      // 执行 onError 生命周期钩子
      await pluginLifecycleManager.executeHook('onError', {
        pluginId,
        error: error as Error,
        context: { phase: 'uninstall', action: 'uninstall' }
      });

      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.emit('plugin.error', { id: pluginId, error: errorMessage });
      throw error;
    }
  }

  /**
   * 启用插件
   */
  public async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }

    // 不按“目标启用态”早退；仅以进程存在作为幂等条件

    // 幂等保护：如果进程已存在（启动中/运行中），直接视为启用完成
    const existingProcess = this.processManager.getProcessInfo(pluginId);
    if (existingProcess) {
      // 启动性能监控（幂等）
      pluginPerformanceMonitor.startMonitoringPlugin(pluginId);
      // 注册懒加载（幂等）
      pluginLazyLoader.registerPlugin(
        pluginId,
        plugin.manifest.permissions || [],
        0
      );

      // 更新状态
      plugin.enabled = true;
      plugin.status = 'enabled';
      plugin.lastError = undefined;

      const configKey = `plugins.${pluginId}`;
      const current = (this.configManager.get(configKey, {}) || {}) as Record<string, any>;
      this.configManager.set(configKey, { ...current, enabled: true, installedAt: plugin.installedAt });

      pluginLogger.info('启用跳过：检测到插件进程已存在，直接标记为启用', pluginId);
      return;
    }

    try {
      plugin.status = 'loading';
      
      // 开始性能监控
      pluginPerformanceMonitor.startMonitoringPlugin(pluginId);
      
      // 注册懒加载
      pluginLazyLoader.registerPlugin(
        pluginId, 
        plugin.manifest.permissions || [], 
        0 // normal priority
      );
      
      
      // 检查依赖
      // await this.checkDependencies(plugin.manifest);

      // 支持纯静态托管插件：当未声明 main 且声明了 ui/window/overlay 时，跳过进程启动
      const hasProcessMain = typeof plugin.manifest.main === 'string' && plugin.manifest.main.trim() !== '';
      const hasStaticHosting = !!(plugin.manifest.ui || (plugin.manifest as any).window || plugin.manifest.overlay);
      if (!hasProcessMain && hasStaticHosting) {
        // 直接标记为启用并持久化配置
        plugin.enabled = true;
        plugin.status = 'enabled';
        plugin.lastError = undefined;

        {
          const configKey = `plugins.${pluginId}`;
          const current = (this.configManager.get(configKey, {}) || {}) as Record<string, any>;
          this.configManager.set(configKey, { ...current, enabled: true, installedAt: plugin.installedAt });
        }

        // 自动启用热重载（开发模式下 或 测试插件）- 针对静态插件
        const isTestPlugin = (await this.getDevConfig(pluginId)) !== null;
        
        if (process.env.NODE_ENV === 'development' || isTestPlugin) {
          try {
            await this.enableHotReload(pluginId);
            pluginLogger.info('Hot reload enabled for static plugin', pluginId, { pluginId });
          } catch (hotReloadError) {
            pluginLogger.warn('Failed to enable hot reload for static plugin', pluginId, { 
              pluginId, 
              error: hotReloadError 
            });
          }
        }


        this.emit('plugin.enabled', { id: pluginId });
        pluginLogger.info('Enabled static-hosted plugin without process', pluginId, { pluginId });
        return;
      }
      
      // 启动插件进程
      let pluginMainPath = path.join(plugin.installPath, plugin.manifest.main);
      
      if (!fs.existsSync(pluginMainPath)) {
        throw new Error(`插件主入口文件不存在: ${pluginMainPath}`);
      }
      
      {
        const apiPort = this.configManager.get<number>('server.port', parseInt(process.env.ACFRAME_API_PORT || '18299'));
        await this.processManager.startPluginProcess(pluginId, pluginMainPath, { apiPort }, plugin.manifest as any);
      }

      // 更新状态
      plugin.enabled = true;
      plugin.status = 'enabled';
      plugin.lastError = undefined;

      // 保存配置
      {
        const configKey = `plugins.${pluginId}`;
        const current = (this.configManager.get(configKey, {}) || {}) as Record<string, any>;
        this.configManager.set(configKey, { ...current, enabled: true, installedAt: plugin.installedAt });
      }


      // 自动启用热重载（开发模式下 或 测试插件）
      const isTestPlugin = plugin.manifest.test === true || (await this.getDevConfig(pluginId)) !== null;
      
      if (process.env.NODE_ENV === 'development' || isTestPlugin) {
        try {
          await this.enableHotReload(pluginId);
          pluginLogger.info('Hot reload enabled for plugin', pluginId, { pluginId });
        } catch (hotReloadError) {
          pluginLogger.warn('Failed to enable hot reload for plugin', pluginId, { 
            pluginId, 
            error: hotReloadError 
          });
        }
      }

      this.emit('plugin.enabled', { id: pluginId });
      pluginLogger.info('Plugin enabled successfully', pluginId, { pluginId });
    } catch (error: any) {
      plugin.status = 'error';
      plugin.lastError = error instanceof Error ? error.message : '未知错误';
      
      // 停止性能监控
      pluginPerformanceMonitor.stopMonitoringPlugin(pluginId);
      
      // 执行 onError 生命周期钩子
      await pluginLifecycleManager.executeHook('onError', {
        pluginId,
        error: error as Error,
        context: { phase: 'enable', action: 'enable' }
      });
      
      this.emit('plugin.error', { id: pluginId, error: plugin.lastError });
      
      await pluginErrorHandler.handleError(
          pluginId,
          ErrorType.ENABLE_FAILED,
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : new Error(String(error)),
          { context: 'enable_plugin' }
        );
      
      throw error;
    }
  }

  /**
   * 禁用插件
   */
  public async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }

    if (!plugin.enabled) {
      // 若插件标记为未启用但仍有残留进程，确保停止并做清理
      const residual = this.processManager.getProcessInfo(pluginId);
      if (residual) {
        try {
          await this.processManager.stopPluginProcess(pluginId);
          pluginLogger.info(`残留插件进程已停止: ${pluginId}`);
        } catch (processError) {
          const processErrorMessage = processError instanceof Error ? processError.message : '未知进程错误';
          pluginLogger.warn(`停止残留插件进程时出错: ${pluginId} - ${processErrorMessage}`);
          await pluginErrorHandler.handleError(pluginId, ErrorType.RUNTIME_ERROR, processErrorMessage, new Error(processErrorMessage));
        }

        // 幂等清理：停止监控、卸载懒加载、清理缓存
        pluginPerformanceMonitor.stopMonitoringPlugin(pluginId);
        await pluginLazyLoader.unloadPlugin(pluginId);
        this.clearPluginCache(pluginId);
      }

      // 同步状态与配置
      plugin.status = 'disabled';
      plugin.lastError = undefined;
      {
        const configKey = `plugins.${pluginId}`;
        const current = (this.configManager.get(configKey, {}) || {}) as Record<string, any>;
        this.configManager.set(configKey, { ...current, enabled: false, installedAt: plugin.installedAt });
      }
      return; // 已经禁用（或残留已清理）
    }

    try {

      // 停止插件进程（若存在）
      const running = this.processManager.getProcessInfo(pluginId);
      if (running) {
        try {
          await this.processManager.stopPluginProcess(pluginId);
          pluginLogger.info(`插件进程已停止: ${pluginId}`);
        } catch (processError) {
          const processErrorMessage = processError instanceof Error ? processError.message : '未知进程错误';
          pluginLogger.warn(`停止插件进程时出错: ${pluginId} - ${processErrorMessage}`);
          await pluginErrorHandler.handleError(pluginId, ErrorType.RUNTIME_ERROR, processErrorMessage, new Error(processErrorMessage));
        }
      } else {
        pluginLogger.info(`插件进程不存在，跳过停止步骤: ${pluginId}`);
      }

      // 停止性能监控
      pluginPerformanceMonitor.stopMonitoringPlugin(pluginId);
      
      // 卸载懒加载
      await pluginLazyLoader.unloadPlugin(pluginId);
      
      // 清理缓存
      this.clearPluginCache(pluginId);

      // 更新状态
      plugin.enabled = false;
      plugin.status = 'disabled';
      plugin.lastError = undefined;

      const configKey = `plugins.${pluginId}`;
      const current = (this.configManager.get(configKey, {}) || {}) as Record<string, any>;
      this.configManager.set(configKey, { ...current, enabled: false, installedAt: plugin.installedAt });


      // 禁用热重载
      try {
        this.disableHotReload(pluginId);
        pluginLogger.info('Hot reload disabled for plugin', pluginId, { pluginId });
      } catch (hotReloadError) {
        pluginLogger.warn('Failed to disable hot reload for plugin', pluginId, { 
          pluginId, 
          error: hotReloadError 
        });
      }

      this.emit('plugin.disabled', { id: pluginId });
    } catch (error: any) {
      // 执行 onError 生命周期钩子
      await pluginLifecycleManager.executeHook('onError', {
        pluginId,
        error: error as Error,
        context: { phase: 'disable', action: 'disable' }
      });

      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.emit('plugin.error', { id: pluginId, error: errorMessage });
      throw error;
    }
  }

  private async extractPlugin(filePath: string, targetDir: string): Promise<void> {

    // 确保目标目录存在
    await fs.promises.mkdir(targetDir, { recursive: true });

    // 检查文件类型
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.zip') {
      // 使用 node.js 内置的 zlib 处理 zip 文件
      const zip = new AdmZip(filePath);
      zip.extractAllTo(targetDir, true);
    } else if (ext === '.tar' || ext === '.gz') {
      // 处理 tar 文件
      await tar.extract({
        file: filePath,
        cwd: targetDir
      });
    } else {
      throw new Error(`不支持的插件文件格式: ${ext}`);
    }
  }

  private async validatePluginManifest(pluginDir: string): Promise<PluginManifest> {
    const manifestPath = path.join(pluginDir, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error('插件清单文件 manifest.json 不存在');
    }

    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent) as PluginManifest;

      // 验证必需字段（支持纯静态托管插件）
      if (!manifest.id || !manifest.name || !manifest.version) {
        throw new Error('插件清单文件缺少必需字段 (id, name, version)');
      }

      const hasProcessMain = typeof manifest.main === 'string' && manifest.main.trim() !== '';
      const hasStaticHosting = !!(manifest.ui || (manifest as any).window || manifest.overlay);
      if (!hasProcessMain && !hasStaticHosting) {
        throw new Error('插件清单文件缺少入口: 需要 main 或至少一个 ui/window/overlay');
      }

      // 验证版本格式
      const versionRegex = /^\d+\.\d+\.\d+$/;
      if (!versionRegex.test(manifest.version)) {
        throw new Error('插件版本格式错误，应为 x.y.z 格式');
      }

      // 验证插件 ID 格式
      const idRegex = /^[a-z0-9-_]+$/;
      if (!idRegex.test(manifest.id)) {
        throw new Error('插件 ID 格式错误，只能包含小写字母、数字、连字符和下划线');
      }

      // 验证图标字段（若提供）
      if ((manifest as any).icon !== undefined) {
        const icon = String((manifest as any).icon || '').trim();
        if (!icon) {
          throw new Error('icon 字段不能为空字符串');
        }
        // 禁止子目录路径，要求图标位于插件根目录
        if (icon.includes('/') || icon.includes('\\')) {
          throw new Error('icon 必须位于插件根目录，禁止使用子目录路径');
        }
        const ext = path.extname(icon).toLowerCase();
        const allowed = ['.png', '.jpg', '.jpeg', '.ico', '.svg'];
        if (!allowed.includes(ext)) {
          throw new Error('icon 文件扩展名不被支持');
        }
        const iconPath = path.join(pluginDir, icon);
        if (!fs.existsSync(iconPath)) {
          throw new Error(`icon 文件不存在: ${icon}`);
        }
      }

      // 验证主文件存在（CommonJS 入口）
      if (hasProcessMain) {
        const mainFilePath = path.join(pluginDir, manifest.main);
        if (!fs.existsSync(mainFilePath)) {
          throw new Error(`插件主文件 ${manifest.main} 不存在`);
        }
      }

      // 验证依赖脚本列表（libs）
      if ((manifest as any).libs !== undefined) {
        if (!Array.isArray((manifest as any).libs)) {
          throw new Error('libs 必须为字符串数组');
        }
        for (const rel of (manifest as any).libs as string[]) {
          if (typeof rel !== 'string' || !rel.trim()) {
            throw new Error('libs 项必须为非空字符串');
          }
          const abs = path.join(pluginDir, rel);
          if (!fs.existsSync(abs)) {
            throw new Error(`libs 文件不存在: ${rel}`);
          }
        }
      }

      // 校验 Wujie 相关可选字段（UI / Overlay）
      // UI.wujie
      if (manifest.ui?.wujie) {
        const w = manifest.ui.wujie;
        if (typeof w.url !== 'string' || !w.url.trim()) {
          throw new Error('ui.wujie.url 必须为非空字符串');
        }
        if (w.spa !== undefined && typeof w.spa !== 'boolean') {
          throw new Error('ui.wujie.spa 必须为布尔值');
        }
        if (w.route !== undefined && typeof w.route !== 'string') {
          throw new Error('ui.wujie.route 必须为字符串');
        }
        // 默认路由：当声明为 SPA 但未提供 route 时，设置为 '/'
        if (w.spa && (w.route === undefined || w.route === '')) {
          w.route = '/';
        }
      }

      // overlay.wujie
      if (manifest.overlay?.wujie) {
        const w = manifest.overlay.wujie;
        if (typeof w.url !== 'string' || !w.url.trim()) {
          throw new Error('overlay.wujie.url 必须为非空字符串');
        }
        if (w.spa !== undefined && typeof w.spa !== 'boolean') {
          throw new Error('overlay.wujie.spa 必须为布尔值');
        }
        if (w.route !== undefined && typeof w.route !== 'string') {
          throw new Error('overlay.wujie.route 必须为字符串');
        }
        // 默认路由处理
        if (w.spa && (w.route === undefined || w.route === '')) {
          w.route = '/';
        }
      }

      // 统一静态托管字段（ui/window/overlay）
      const validateHosting = (label: string, cfg: any) => {
        if (!cfg) return;
        if (cfg.spa !== undefined && typeof cfg.spa !== 'boolean') {
          throw new Error(`${label}.spa 必须为布尔值`);
        }
        if (cfg.route !== undefined && typeof cfg.route !== 'string') {
          throw new Error(`${label}.route 必须为字符串`);
        }
        if (cfg.html !== undefined && typeof cfg.html !== 'string') {
          throw new Error(`${label}.html 必须为字符串`);
        }
        // 当声明为 SPA 而未提供 route 时，设置为默认 '/'
        if (cfg.spa && (cfg.route === undefined || cfg.route === '')) {
          cfg.route = '/';
        }
      };

      // 注意：ui/overlay 根级对象仅承载展示元数据（name/description），以及新的托管字段
      validateHosting('ui', manifest.ui);
      validateHosting('overlay', manifest.overlay);
      validateHosting('window', (manifest as any).window);

      return manifest;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('插件清单文件格式错误');
      }
      throw error;
    }
  }

  /**
   * 为指定插件返回受控 API（带上下文）。
   */
  public getApi(pluginId: string): PluginAPI {
    return new ApiBridge({
      pluginId,
      apiServer: this.apiServer,
      roomManager: this.roomManager,
      databaseManager: this.databaseManager,
      configManager: this.configManager,
      tokenManager: this.tokenManager,
      onPluginFault: (reason: string) => this.emit('plugin.suspended', { id: pluginId, reason })
    });
  }

  // 弹窗能力已移除：不再暴露 PopupManager 或相关事件。

  /**
   * 供内部或测试用的路由注册代理（统一走 ApiServer）。
   */
  public registerHttpRoute(
    pluginId: string,
    def: { method: 'GET' | 'POST'; path: string },
    handler: Parameters<ApiServer['registerPluginRoute']>[2]
  ): void {
    this.apiServer.registerPluginRoute(pluginId, def, handler);
  }

  /**
   * 暂停插件（当插件出现错误或违规时）
   */
  public suspendPlugin(pluginId: string, reason: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return;
    }

    plugin.enabled = false;
    plugin.status = 'error';
    plugin.lastError = reason;

    // 保存配置
    const configKey = `plugins.${pluginId}`;
    this.configManager.set(configKey, {
      enabled: false,
      installedAt: plugin.installedAt
    });

    this.emit('plugin.suspended', { id: pluginId, reason });
  }

  /**
   * 获取插件状态统计
   */
  public getPluginStats(): {
    total: number;
    enabled: number;
    disabled: number;
    error: number;
  } {
    const plugins = Array.from(this.plugins.values());
    return {
      total: plugins.length,
      enabled: plugins.filter(p => p.status === 'enabled').length,
      disabled: plugins.filter(p => p.status === 'disabled').length,
      error: plugins.filter(p => p.status === 'error').length
    };
  }

  /**
   * 获取插件日志
   */
  public getPluginLogs(pluginId?: string, limit: number = 100) {
    return pluginLogger.getRecentLogs(pluginId, limit);
  }

  /**
   * 获取插件错误历史
   */
  public getPluginErrorHistory(pluginId: string) {
    return pluginErrorHandler.getErrorHistory(pluginId);
  }

  /**
   * 获取所有插件的错误统计
   */
  public getPluginErrorStats() {
    return pluginErrorHandler.getErrorStats();
  }

  /**
   * 手动执行插件恢复操作
   */
  public async executePluginRecovery(pluginId: string, action: RecoveryAction, context?: Record<string, any>): Promise<boolean> {
    return pluginErrorHandler.executeRecoveryAction(pluginId, action, context);
  }

  /**
   * 重置插件错误计数
   */
  public resetPluginErrorCount(pluginId: string, errorType?: ErrorType): void {
    pluginErrorHandler.resetRetryCount(pluginId, errorType);
  }

  /**
   * 清理插件缓存和临时文件
   */
  public cleanup(): void {
    // 清理进程管理器
    this.processManager.cleanup();
    
    // 清理热重载观察者
    for (const [pluginId, watcher] of this.hotReloadWatchers) {
      try {
        watcher.close();
      } catch (error: any) {
        pluginLogger.error(`Failed to close watcher for plugin ${pluginId}:`, error.message);
      }
    }
    this.hotReloadWatchers.clear();
    
    // 清理热重载管理器
    pluginHotReloadManager.cleanup();
    
    // 清理性能优化组件
    try {
      if (typeof pluginPerformanceMonitor.destroy === 'function') {
        pluginPerformanceMonitor.destroy();
      }
      // pluginCacheManager 和 pluginLazyLoader 没有 cleanup 方法，跳过
      if (typeof this.memoryPoolManager.cleanup === 'function') {
        this.memoryPoolManager.cleanup();
      }
      if (typeof this.connectionPoolManager.destroy === 'function') {
        this.connectionPoolManager.destroy();
      }
    } catch (error: any) {
      pluginLogger.error('Failed to cleanup performance optimization components:', undefined, error);
    }
    
    const tempDir = path.join(this.pluginsDir, '.temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // 清理插件日志和错误处理器
    pluginLogger.cleanup?.();
    pluginErrorHandler.cleanup?.();
  }

  /**
   * 检查插件更新
   */
  public async checkPluginUpdate(pluginId: string): Promise<any> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }

    return await this.pluginUpdater.checkUpdate(plugin);
  }

  /**
   * 更新插件
   */
  public async updatePlugin(pluginId: string, updateUrl?: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }

    // 如果插件已启用，先禁用
    const wasEnabled = plugin.enabled;
    if (wasEnabled) {
      await this.disablePlugin(pluginId);
    }

    try {
      await this.pluginUpdater.updatePlugin(pluginId, updateUrl);
      
      // 重新加载插件信息
      await this.loadInstalledPlugins();
      
      // 如果之前是启用状态，重新启用
      if (wasEnabled) {
        await this.enablePlugin(pluginId);
      }
    } catch (error: any) {
      // 如果更新失败，尝试回滚
      try {
        await this.rollbackPluginUpdate(pluginId);
        if (wasEnabled) {
          await this.enablePlugin(pluginId);
        }
      } catch (rollbackError: any) {
        pluginLogger.error('插件更新回滚失败', pluginId, rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError)), { pluginId, error: rollbackError });
      }
      throw error;
    }
  }

  /**
   * 回滚插件更新
   */
  public async rollbackPluginUpdate(pluginId: string): Promise<boolean> {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
          throw new Error(`Plugin ${pluginId} not found`);
      }
  
      // 记录插件是否之前是启用状态
      const wasEnabled = plugin.enabled;
      
      try {
      
          // 检查是否有备份可回滚
          const backupPath = path.join(this.pluginsDir, `${pluginId}_backup`);
          if (!fs.existsSync(backupPath)) {
              throw new Error(`No backup found for plugin ${pluginId}`);
          }
      
          // 停用插件
          await this.disablePlugin(pluginId);
      
          // 删除当前版本
          const pluginPath = path.join(this.pluginsDir, pluginId);
          fs.rmSync(pluginPath, { recursive: true, force: true });
      
          // 恢复备份
          fs.cpSync(backupPath, pluginPath, { recursive: true });
      
          // 重新加载插件信息并按之前状态恢复
          try { this.loadInstalledPlugins(); } catch {}
          if (wasEnabled) {
              await this.enablePlugin(pluginId);
          }
      
          pluginLogger.info(`Plugin ${pluginId} rolled back successfully`);
          return true;
      } catch (error: any) {
          pluginLogger.error(`Failed to rollback plugin version: ${error.message}`);
          
          // 如果回滚失败且插件之前是启用的，尝试重新启用
          if (wasEnabled) {
            try {
              await this.enablePlugin(pluginId);
            } catch (enableError: any) {
              pluginLogger.error(`Failed to re-enable plugin after rollback failure: ${enableError.message}`);
            }
          }
      
          return false;
      }
  }



  /**
   * 启用插件热重载
   */
  public async enableHotReload(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }

    try {
      // 1. 尝试获取开发配置（针对测试插件）
      const devCfg = await this.getDevConfig(pluginId);
      
      // 判断是否为测试插件（有开发配置或者manifest标记为测试）
      const isTestPlugin = plugin.manifest.test === true || !!devCfg;

      if (isTestPlugin) {
        // --- 针对测试插件使用轮询模式 ---
        let manifestPath = '';
        let mainPath = '';
        
        // 优先使用开发配置中的路径
        if (devCfg) {
          if (devCfg.manifestPath && typeof devCfg.manifestPath === 'string') {
            manifestPath = devCfg.manifestPath;
          }
          if (devCfg.nodePath && typeof devCfg.nodePath === 'string') {
            // 如果提供了 nodePath (目录)，尝试拼接 main
            // 这里我们需要读取 manifest 来确定 main 文件名，或者假设 index.js
            // 为了简单起见，如果 devCfg 提供了 manifestPath，我们从那里读取 main
          }
        }
        
        // 如果开发配置没有提供完整路径，使用安装路径推导
        if (!manifestPath) {
          manifestPath = path.join(plugin.installPath, 'manifest.json');
        }

        // 读取 manifest 获取入口文件
        try {
          if (fs.existsSync(manifestPath)) {
            const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent);
            if (manifest.main) {
              const baseDir = path.dirname(manifestPath);
              mainPath = path.join(baseDir, manifest.main);
            }
          }
        } catch (e) {
          pluginLogger.warn(`Failed to read manifest for hot reload path resolution: ${pluginId}`, pluginId);
        }

        const filesToWatch = [];
        if (manifestPath && fs.existsSync(manifestPath)) filesToWatch.push(manifestPath);
        if (mainPath && fs.existsSync(mainPath)) filesToWatch.push(mainPath);

        if (filesToWatch.length > 0) {
          pluginLogger.info(`Enabling polling hot reload for test plugin ${pluginId}`, pluginId, { files: filesToWatch });
          const success = pluginHotReloadManager.startPolling(pluginId, filesToWatch);
          if (success) {
            plugin.hotReloadEnabled = true;
          }
          return success;
        } else {
          pluginLogger.warn(`No valid files found to poll for test plugin ${pluginId}`, pluginId);
          // Fallback to normal watching if files not found (though unlikely if plugin is loaded)
        }
      }

      // --- 普通插件或回退逻辑使用标准文件监听 ---
      let watchPath = plugin.installPath;

      // 3. 验证路径有效性
      if (!fs.existsSync(watchPath)) {
        pluginLogger.warn(`Hot reload path does not exist for plugin ${pluginId}`, pluginId, { path: watchPath });
        return false;
      }

      pluginLogger.info(`Enabling standard hot reload for plugin ${pluginId}`, pluginId, { watchPath });

      // 4. 启动监听
      const success = pluginHotReloadManager.startWatching(pluginId, watchPath);
      
      if (success) {
        plugin.hotReloadEnabled = true;
      }

      return success;
    } catch (error: any) {
      pluginLogger.error(`Failed to enable hot reload for plugin ${pluginId}`, pluginId, error);
      return false;
    }
  }

  /**
   * 禁用插件热重载
   */
  public disableHotReload(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    try {
      // 禁用热重载
      plugin.hotReloadEnabled = false;
      
      // 停止文件监听
      const watcher = this.hotReloadWatchers.get(pluginId);
      if (watcher) {
        watcher.close();
        this.hotReloadWatchers.delete(pluginId);
      }
      
      pluginLogger.info(`Hot reload disabled for plugin ${pluginId}`);
      return true;
    } catch (error: any) {
      pluginLogger.error(`Failed to disable hot reload for plugin ${pluginId}:`, error.message);
      return false;
    }
  }

  /**
   * 手动触发插件热重载
   */
  public async manualHotReload(pluginId: string): Promise<any> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }

    try {
      // 启用热重载
      plugin.hotReloadEnabled = true;
      
      // 监听插件文件变化
      const pluginPath = path.join(this.pluginsDir, pluginId);
      const watcher = watch(pluginPath, {
          ignored: /(^|[\/\\])\../, // 忽略隐藏文件
          persistent: true,
          ignoreInitial: true
      });
    
      watcher.on('change', async (filePath: string) => {
          if (plugin.hotReloadEnabled) {
              pluginLogger.info(`Plugin ${pluginId} file changed: ${filePath}`);
              try {
                  // Trigger hot reload through the hot reload manager instead of recursively calling manualHotReload
                  // 触发插件热重载（通过公开接口）
                  await pluginHotReloadManager.manualReload(pluginId);
              } catch (error: any) {
                  pluginLogger.error(`Hot reload failed for plugin ${pluginId}:`, error.message);
              }
          }
      });

      // 存储观察者引用
      this.hotReloadWatchers.set(pluginId, watcher);
      
      pluginLogger.info(`Hot reload enabled for plugin ${pluginId}`);
    } catch (error: any) {
      pluginLogger.error(`Failed to enable hot reload for plugin ${pluginId}:`, error.message);
      throw error;
    }
  }

  /**
   * 获取插件热重载状态
   */
  public getHotReloadStatus(pluginId: string): any {
    return pluginHotReloadManager.getWatchStatus(pluginId);
  }

  /**
   * 获取所有启用热重载的插件
   */
  public getHotReloadPlugins(): string[] {
    return pluginHotReloadManager.getWatchedPlugins();
  }

  /**
   * 更新热重载配置
   */
  public updateHotReloadConfig(config: Partial<HotReloadConfig>): void {
    pluginHotReloadManager.updateConfig(config);
  }

  /**
   * 获取插件版本历史
   */
  public getPluginVersionHistory(pluginId: string): any {
    return pluginVersionManager.getVersionHistory(pluginId);
  }

  /**
   * 检查插件更新
   */
  public async checkPluginUpdates(pluginId: string, registryUrl?: string): Promise<any> {
    return await pluginVersionManager.checkForUpdates(pluginId, registryUrl);
  }

  /**
   * 获取版本变更日志
   */
  public getPluginChangelog(pluginId: string, fromVersion?: string, toVersion?: string): string[] {
    return pluginVersionManager.getChangelog(pluginId, fromVersion, toVersion);
  }

  /**
   * 回滚插件到指定版本
   */
  public async rollbackPluginVersion(pluginId: string, targetVersion: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`插件 ${pluginId} 不存在`);
    }

    const wasEnabled = plugin.enabled;
    
    try {
      // 如果插件正在运行，先禁用
      if (wasEnabled) {
        await this.disablePlugin(pluginId);
      }

      // 执行版本回滚
      const success = await pluginVersionManager.rollbackToVersion(pluginId, targetVersion);
      
      if (success) {
        // 更新插件信息中的版本
        plugin.version = targetVersion;
        
        // 如果之前是启用状态，重新启用
        if (wasEnabled) {
          await this.enablePlugin(pluginId);
        }

        pluginLogger.info(`Plugin ${pluginId} rolled back to version ${targetVersion}`);
      }

      return success;
    } catch (error: any) {
      pluginLogger.error(`Failed to rollback plugin version: ${error.message}`);
      
      return false;
    }
  }

  /**
   * 比较版本号
   */
  public compareVersions(version1: string, version2: string): number {
    return pluginVersionManager.compareVersions(version1, version2);
  }

  /**
   * 检查版本约束
   */
  public satisfiesVersionConstraint(version: string, constraint: string): boolean {
    return pluginVersionManager.satisfiesConstraint(version, constraint);
  }

  /**
   * 清理旧版本数据
   */
  public cleanupOldVersions(pluginId: string, keepCount: number = 10): void {
    pluginVersionManager.cleanupOldVersions(pluginId, keepCount);
  }

  /**
   * 重新加载插件信息（不重启插件）
   */
  private async reloadPluginInfo(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return;
    }

    try {
      const manifestPath = path.join(plugin.installPath, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
        const manifest: PluginManifest = JSON.parse(manifestContent);
        
        // 更新插件信息
        plugin.name = manifest.name;
        plugin.version = manifest.version;
        plugin.description = manifest.description;
        plugin.author = manifest.author;
        plugin.manifest = manifest;

        pluginLogger.info('Plugin info reloaded', pluginId, { 
          name: manifest.name, 
          version: manifest.version 
        });
      }
    } catch (error: any) {
      pluginLogger.error('Failed to reload plugin info', pluginId, error as Error);
    }
  }

  // --- Development Tools ---

  /**
   * 保存开发工具配置
   */
  public async saveDevConfig(config: any): Promise<boolean> {
    try {
      const configPath = path.join(this.pluginsDir, '.devtools', 'config.json');
      const configDir = path.dirname(configPath);
      
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      let existingConfig = {};
      if (fs.existsSync(configPath)) {
        existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
      
      const updatedConfig = { ...existingConfig, [config.pluginId]: config };
      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
      
      pluginLogger.info(`Development config saved for plugin: ${config.pluginId}`, config.pluginId);

      // 保存配置后立即重新加载插件列表，确保 UI 能看到新添加的调试插件
      await this.loadInstalledPlugins();

      return true;
    } catch (error) {
      pluginLogger.error(`Failed to save dev config: ${error}`, config.pluginId);
      return false;
    }
  }

  /**
   * 获取开发工具配置
   */
  public async getDevConfig(pluginId?: string): Promise<any> {
    try {
      const configPath = path.join(this.pluginsDir, '.devtools', 'config.json');
      
      if (!fs.existsSync(configPath)) {
        return pluginId ? null : {};
      }
      
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return pluginId ? config[pluginId] || null : config;
    } catch (error) {
      pluginLogger.error(`Failed to get dev config: ${error}`, pluginId);
      return pluginId ? null : {};
    }
  }

  /**
   * 移除开发工具配置
   */
  public async removeDevConfig(pluginId: string): Promise<boolean> {
    try {
      const configPath = path.join(this.pluginsDir, '.devtools', 'config.json');
      
      if (!fs.existsSync(configPath)) {
        return false;
      }
      
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (pluginId in config) {
        delete config[pluginId];
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        pluginLogger.info(`Removed dev config for plugin: ${pluginId}`);
        return true;
      }
      return false;
    } catch (error) {
      pluginLogger.error(`Failed to remove dev config: ${error}`, pluginId);
      return false;
    }
  }

  /**
   * 启动外部项目调试
   */
  public async startExternalDebug(config: any): Promise<any> {
    try {
      const { pluginId, projectUrl, nodePath, autoConnect } = config;
      
      // 保存配置
      await this.saveDevConfig(config);
      
      // 测试连接
      const connectionResult = await this.testExternalConnection(config);
      if (!connectionResult.success) {
        throw new Error(`无法连接到外部项目: ${connectionResult.error}`);
      }
      
      // 启用热重载
      if (autoConnect) {
        this.enableHotReload(pluginId);
      }
      
      pluginLogger.info(`External debug started for plugin: ${pluginId}`, pluginId);
      return {
        success: true,
        status: 'connected',
        projectUrl,
        nodePath,
        hotReloadEnabled: autoConnect
      };
    } catch (error) {
      pluginLogger.error(`Failed to start external debug: ${error}`, config.pluginId);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 停止外部项目调试
   */
  public async stopExternalDebug(pluginId: string): Promise<any> {
    try {
      // 禁用热重载
      this.disableHotReload(pluginId);
      
      // 清理配置中的调试状态
      const config = await this.getDevConfig(pluginId);
      if (config) {
        config.debugActive = false;
        await this.saveDevConfig(config);
      }
      
      pluginLogger.info(`External debug stopped for plugin: ${pluginId}`, pluginId);
      return {
        success: true,
        status: 'disconnected'
      };
    } catch (error) {
      pluginLogger.error(`Failed to stop external debug: ${error}`, pluginId);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 测试外部项目连接
   */
  public async testExternalConnection(config: any): Promise<any> {
    try {
      const { projectUrl, nodePath, manifestPath } = config;
      
      // 测试项目URL连接
      if (projectUrl) {
        try {
          const response = await fetch(projectUrl, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          return {
            success: false,
            error: `无法连接到项目URL: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
      
      // 测试Node.js路径
      let isNodePathFile = false;
      if (nodePath) {
        if (!fs.existsSync(nodePath)) {
          return {
            success: false,
            error: `代码路径不存在: ${nodePath}`
          };
        }
        
        const stat = fs.statSync(nodePath);
        if (stat.isFile()) {
          isNodePathFile = true;
        } else {
          // 检查是否有package.json或主要文件
          const packageJsonPath = path.join(nodePath, 'package.json');
          const indexJsPath = path.join(nodePath, 'index.js');
          const indexTsPath = path.join(nodePath, 'index.ts');
          
          if (!fs.existsSync(packageJsonPath) && !fs.existsSync(indexJsPath) && !fs.existsSync(indexTsPath)) {
            return {
              success: false,
              error: `Node.js路径中未找到有效的项目文件 (package.json, index.js, index.ts)`
            };
          }
        }
      }

      if (manifestPath) {
        if (!fs.existsSync(manifestPath)) {
          return { success: false, error: `manifest文件不存在: ${manifestPath}` };
        }
        let text = '';
        try { text = fs.readFileSync(manifestPath, 'utf-8'); } catch (e: any) { return { success: false, error: `读取manifest失败: ${e?.message || String(e)}` }; }
        let json: any;
        try { json = JSON.parse(text); } catch (e: any) { return { success: false, error: `manifest格式非法: ${e?.message || String(e)}` }; }
        const idOk = typeof json?.id === 'string' && json.id.trim().length > 0;
        const nameOk = typeof json?.name === 'string' && json.name.trim().length > 0;
        const verOk = typeof json?.version === 'string' && json.version.trim().length > 0;
        const mainOk = typeof json?.main === 'string' && json.main.trim().length > 0;
        
        if (!idOk || !nameOk || !verOk) {
          return { success: false, error: 'manifest缺少必填字段(id/name/version)' };
        }
        
        // 仅当存在 main 字段时才进行后端进程测试
        if (mainOk) {
          // 使用插件进程沙箱进行加载验证，忽略外部 package.json 的模块类型
          try {
            const pluginId = String(json.id);
            let mainFile = '';
            if (nodePath && isNodePathFile) {
              mainFile = nodePath;
            } else {
              mainFile = path.join(String(nodePath || path.dirname(manifestPath)), String(json.main));
            }

            if (!fs.existsSync(mainFile)) {
              return { success: false, error: `主入口文件不存在: ${mainFile}` };
            }
            const apiPort = this.configManager.get<number>('server.port', parseInt(process.env.ACFRAME_API_PORT || '18299'));
            try {
              await this.processManager.startPluginProcess(pluginId, mainFile, { apiPort }, json);
              try {
                await this.processManager.executeInPlugin(pluginId, 'init', [], 3000, { optional: true });
              } catch (execErr: any) {
                // 即使方法不存在也已触发加载；保留错误信息用于提示
                const msg = execErr && execErr.message ? execErr.message : String(execErr);
                if (msg && msg.toLowerCase().includes('not running')) throw execErr;
              }
            } catch (loadErr: any) {
              return { success: false, error: `主入口加载失败: ${loadErr?.message || String(loadErr)}` };
            } finally {
              try { await this.processManager.stopPluginProcess(pluginId, 'manual'); } catch {}
            }
          } catch (e: any) {
            return { success: false, error: `主入口校验失败: ${e?.message || String(e)}` };
          }
        }
      }
      
      return {
        success: true,
        message: '测试加载成功',
        projectUrl: projectUrl || null,
        nodePath: nodePath || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 获取调试状态
   */
  public async getDebugStatus(pluginId: string): Promise<any> {
    try {
      const config = await this.getDevConfig(pluginId);
      const hotReloadStatus = this.getHotReloadStatus(pluginId);
      
      return {
        success: true,
        pluginId,
        config: config || null,
        hotReloadEnabled: hotReloadStatus?.enabled || false,
        debugActive: config?.debugActive || false,
        lastConnection: config?.lastConnection || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 获取插件性能指标
   */
  public getPluginPerformanceMetrics(pluginId: string): any {
    return pluginPerformanceMonitor.getMetrics(pluginId);
  }

  /**
   * 获取插件缓存统计
   */
  public getPluginCacheStats(pluginId?: string): any {
    return pluginCacheManager.getStats();
  }

  /**
   * 获取插件懒加载状态
   */
  public getPluginLazyLoadStatus(pluginId: string): any {
    return pluginLazyLoader.getPluginState(pluginId);
  }

  /**
   * 获取内存池统计
   */
  public getMemoryPoolStats(): any {
    return this.memoryPoolManager.getStats();
  }

  /**
   * 获取连接池统计
   */
  public getConnectionPoolStats(): any {
    return this.connectionPoolManager.getStats();
  }

  /**
   * 生成性能报告
   */
  public async generatePerformanceReport(pluginId?: string): Promise<any> {
    return pluginPerformanceMonitor.generateReport(pluginId || '');
  }

  /**
   * 清理插件缓存
   */
  public clearPluginCache(pluginId?: string): void {
    if (pluginId) {
      pluginCacheManager.clear(pluginId);
    } else {
      pluginCacheManager.clear();
    }
  }

  /**
   * 预加载插件
   */
  public async preloadPlugin(pluginId: string): Promise<void> {
    await pluginLazyLoader.loadPlugin(pluginId);
  }

  /**
   * 暂停插件懒加载
   */
  public suspendPluginLazyLoad(pluginId: string): void {
    pluginLazyLoader.suspendPlugin(pluginId, 'Manual suspension');
  }

  /**
   * 恢复插件懒加载
   */
  public resumePluginLazyLoad(pluginId: string): void {
    pluginLazyLoader.resumePlugin(pluginId);
  }
}
