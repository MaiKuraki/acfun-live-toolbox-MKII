import { TypedEventEmitter } from '../utils/TypedEventEmitter';
import { WorkerPoolManager, WorkerPoolConfig } from './WorkerPoolManager';
import { SecureCommunicationChannel } from './SecureCommunicationChannel';
import { pluginLogger } from './PluginLogger';
import { pluginErrorHandler, ErrorType } from './PluginErrorHandler';
import * as path from 'path';

export interface ProcessManagerConfig {
  workerPool: Partial<WorkerPoolConfig>;
  enableSandboxing: boolean;
  enableIsolation: boolean;
  maxPluginInstances: number;
  processRecoveryEnabled: boolean;
}

export interface PluginProcessInfo {
  pluginId: string;
  workerId: string;
  channelId: string;
  pluginPath: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  startedAt: number;
  lastActivity: number;
  executionCount: number;
  errorCount: number;
}

export interface ProcessManagerEvents {
  'process.started': { pluginId: string; processInfo: PluginProcessInfo };
  'process.stopped': { pluginId: string; reason: string };
  'process.error': { pluginId: string; error: Error };
  'process.recovered': { pluginId: string; attempt: number };
  'isolation.violation': { pluginId: string; violation: string };
}

export class ProcessManager extends TypedEventEmitter<ProcessManagerEvents> {
  private config: ProcessManagerConfig;
  private workerPool: WorkerPoolManager;
  private communicationChannel: SecureCommunicationChannel;
  private processes: Map<string, PluginProcessInfo> = new Map();
  private recoveryAttempts: Map<string, number> = new Map();
  private maxRecoveryAttempts = 3;

  constructor(config: Partial<ProcessManagerConfig> = {}) {
    super();
    
    this.config = {
      workerPool: config.workerPool || {},
      enableSandboxing: config.enableSandboxing !== false,
      enableIsolation: config.enableIsolation !== false,
      maxPluginInstances: config.maxPluginInstances || 50,
      processRecoveryEnabled: config.processRecoveryEnabled !== false,
    };

    this.workerPool = new WorkerPoolManager(this.config.workerPool);
    this.communicationChannel = new SecureCommunicationChannel({
      enableEncryption: this.config.enableSandboxing,
      enableSigning: true,
    });

    this.setupEventHandlers();
    pluginLogger.info('ProcessManager initialized', undefined, { config: this.config });
  }

  private setupEventHandlers(): void {
    this.workerPool.on('worker.created', ({ workerId, pluginId }) => {
      this.updateProcessStatus(pluginId, 'running');
    });

    this.workerPool.on('worker.terminated', ({ workerId, pluginId, reason }) => {
      this.handleWorkerTermination(pluginId, reason);
    });

    this.workerPool.on('worker.error', ({ workerId, pluginId, error }) => {
      this.handleWorkerError(pluginId, error);
    });

    this.communicationChannel.on('channel.error', ({ channelId, error }) => {
      const process = this.findProcessByChannelId(channelId);
      if (process) {
        this.handleProcessError(process.pluginId, error);
      }
    });
  }

  public async startPluginProcess(
    pluginId: string, 
    pluginPath: string,
    options: { autoRestart?: boolean; apiPort?: number } = {},
    manifest?: any
  ): Promise<PluginProcessInfo> {
    if (this.processes.has(pluginId)) {
      throw new Error(`Plugin process ${pluginId} is already running`);
    }

    if (this.processes.size >= this.config.maxPluginInstances) {
      throw new Error(`Maximum plugin instances reached (${this.config.maxPluginInstances})`);
    }

    try {
      const sandboxConfig = this.buildSandboxConfig(pluginId, manifest, options?.apiPort);
      const workerId = await this.workerPool.createWorker(pluginId, pluginPath, sandboxConfig);
      const channelId = `${pluginId}-${workerId}`;

      const processInfo: PluginProcessInfo = {
        pluginId,
        workerId,
        channelId,
        pluginPath,
        status: 'starting',
        startedAt: Date.now(),
        lastActivity: Date.now(),
        executionCount: 0,
        errorCount: 0,
      };

      this.processes.set(pluginId, processInfo);

      // Create communication channel
      const workerInfo = this.workerPool['workers'].get(workerId);
      if (workerInfo) {
        this.communicationChannel.createChannel(channelId, pluginId, workerInfo.worker);
      }

      try { console.log('[ProcessManager] starting plugin', { pluginId, pluginPath }); } catch {}
      
      processInfo.status = 'running';
      this.emit('process.started', { pluginId, processInfo });
      
      pluginLogger.info('Plugin process started', pluginId, { workerId, channelId });
      return processInfo;

    } catch (error: any) {
      this.processes.delete(pluginId);
      pluginLogger.error('Failed to start plugin process', pluginId, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private buildSandboxConfig(pluginId: string, manifest?: any, apiPort?: number): any {
    const roots = [
      path.resolve(process.cwd(), 'packages', 'main'),
      path.resolve(process.cwd()),
      path.resolve((process as any).resourcesPath || process.cwd(), 'app.asar'),
      path.resolve((process as any).resourcesPath || process.cwd(), 'app'),
    ];
    const libs = Array.isArray((manifest as any)?.libs) ? (manifest as any).libs : [];
    return {
      console: 'redirect',
      require: {
        external: true,
        builtin: ['path','fs','child_process','crypto','os','events','http','https'],
        root: roots,
      },
      libs,
      sandbox: {
        pluginId,
        apiPort
      }
    };
  }

  public async stopPluginProcess(pluginId: string, reason: string = 'manual'): Promise<void> {
    const processInfo = this.processes.get(pluginId);
    if (!processInfo) {
      throw new Error(`Plugin process ${pluginId} not found`);
    }

    try {
      processInfo.status = 'stopping';

      try {
        await this.executeInPlugin(pluginId, 'beforeUnloaded', [], 5000, { optional: true });
      } catch (_e) {}

      try {
        const { SseQueueService } = require('../server/SseQueueService');
        const channel = `plugin:${pluginId}:overlay`;
        SseQueueService.getInstance().queueOrPublish(channel, { event: 'plugin-before-unloaded', payload: { ts: Date.now() } }, { ttlMs: 2 * 60 * 1000, persist: true, meta: { kind: 'lifecycle' } });
      } catch {}

      // Execute cleanup in plugin
      try {
        await this.executeInPlugin(pluginId, 'cleanup', [], 5000);
      } catch (error: any) {
        pluginLogger.warn('Plugin cleanup failed', pluginId, error instanceof Error ? error : new Error(String(error)));
      }

      // Remove communication channel
      this.communicationChannel.removeChannel(processInfo.channelId);

      // Terminate worker
      this.workerPool.terminateWorker(processInfo.workerId, reason);

      processInfo.status = 'stopped';
      this.processes.delete(pluginId);
      this.recoveryAttempts.delete(pluginId);

      this.emit('process.stopped', { pluginId, reason });
      pluginLogger.info('Plugin process stopped', pluginId, { reason });

    } catch (error: any) {
      pluginLogger.error('Error stopping plugin process', pluginId, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public async executeInPlugin(
    pluginId: string, 
    method: string, 
    args: any[] = [],
    timeout?: number,
    options?: { optional?: boolean }
  ): Promise<any> {
    const processInfo = this.processes.get(pluginId);
    if (!processInfo) {
      throw new Error(`Plugin process ${pluginId} not found`);
    }

    if (processInfo.status !== 'running') {
      const allowDuringStarting = processInfo.status === 'starting' && method === 'init';
      const allowDuringStopping = processInfo.status === 'stopping' && (method === 'beforeUnloaded' || method === 'cleanup');
      if (!allowDuringStarting && !allowDuringStopping) {
        throw new Error(`Plugin process ${pluginId} is not running (status: ${processInfo.status})`);
      }
    }

    let attempts = 0;
    const maxAttempts = 8;
    let lastErr: any = null;
    while (attempts < maxAttempts) {
      try {
        const result = await this.workerPool.executeInWorker(
          processInfo.workerId,
          method,
          args,
          timeout,
          options && options.optional
        );
        processInfo.executionCount++;
        processInfo.lastActivity = Date.now();
        return result;
      } catch (error: any) {
        const msg = String(error?.message || error);
        lastErr = error;
        if (options && options.optional) {
          if (msg.toLowerCase().includes('method') && msg.toLowerCase().includes('not') && msg.toLowerCase().includes('found')) {
            return undefined;
          }
          if (msg.toLowerCase().includes('not found on plugin or sandbox')) {
            return undefined;
          }
        }
        // 忙碌/短时不可用：退避重试
        if (msg.includes('status: busy') || msg.includes('not available')) {
          await new Promise(r => setTimeout(r, 200 + attempts * 200));
          attempts++;
          continue;
        }
        break;
      }
    }

    // 非忙碌错误或重试耗尽：记录错误并抛出
    const errObj = lastErr instanceof Error ? lastErr : new Error(String(lastErr));
    const msgStr = String(errObj.message || 'error');
    if (options && options.optional) {
      if (msgStr.toLowerCase().includes('method') && msgStr.toLowerCase().includes('not') && msgStr.toLowerCase().includes('found')) {
        return undefined;
      }
      if (msgStr.toLowerCase().includes('not found on plugin or sandbox')) {
        return undefined;
      }
    }
    processInfo.errorCount++;
    if (msgStr.includes('status: busy') || msgStr.includes('not available')) {
      // 忙碌耗尽：记录为警告，避免刷屏错误日志
      pluginLogger.warn('Plugin worker busy during execute', pluginId, { method, attempts: maxAttempts });
    } else {
      pluginLogger.error('Plugin execution error', pluginId, errObj, { method });
      await pluginErrorHandler.handleError(
        pluginId,
        ErrorType.RUNTIME_ERROR,
        errObj.message,
        errObj,
        { method, args }
      );
    }
    throw errObj;
  }

  public async sendMessageToPlugin(
    pluginId: string, 
    type: string, 
    data: any,
    expectResponse: boolean = false
  ): Promise<any> {
    const processInfo = this.processes.get(pluginId);
    if (!processInfo) {
      throw new Error(`Plugin process ${pluginId} not found`);
    }

    try {
      const result = await this.communicationChannel.sendMessage(
        processInfo.channelId,
        type,
        data,
        expectResponse
      );

      processInfo.lastActivity = Date.now();
      return result;
    } catch (error: any) {
      pluginLogger.error('Failed to send message to plugin', pluginId, error instanceof Error ? error : new Error(String(error)), { type });
      throw error;
    }
  }

  private handleWorkerTermination(pluginId: string, reason: string): void {
    const processInfo = this.processes.get(pluginId);
    if (!processInfo) return;

    if (reason !== 'manual' && this.config.processRecoveryEnabled) {
      this.attemptProcessRecovery(pluginId, reason);
    } else {
      this.processes.delete(pluginId);
      this.emit('process.stopped', { pluginId, reason });
    }
  }

  private handleWorkerError(pluginId: string, error: Error): void {
    const processInfo = this.processes.get(pluginId);
    if (processInfo) {
      processInfo.errorCount++;
      processInfo.status = 'error';
    }

    this.emit('process.error', { pluginId, error });

    if (this.config.processRecoveryEnabled) {
      this.attemptProcessRecovery(pluginId, 'worker_error');
    }
  }

  private handleProcessError(pluginId: string, error: Error): void {
    pluginLogger.error('Process error', pluginId, error);
    this.emit('process.error', { pluginId, error });
  }

  private async attemptProcessRecovery(pluginId: string, reason: string): Promise<void> {
    const attempts = this.recoveryAttempts.get(pluginId) || 0;
    
    if (attempts >= this.maxRecoveryAttempts) {
      pluginLogger.error('Max recovery attempts reached', pluginId, new Error(`Max attempts: ${attempts}`));
      this.processes.delete(pluginId);
      this.recoveryAttempts.delete(pluginId);
      return;
    }

    this.recoveryAttempts.set(pluginId, attempts + 1);

    try {
      pluginLogger.info('Attempting process recovery', pluginId, { attempt: attempts + 1, reason });

      let pluginPath: string | undefined;
      const existing = this.processes.get(pluginId);
      if (existing) {
        pluginPath = existing.pluginPath;
        await this.stopPluginProcess(pluginId, 'recovery');
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));

      if (pluginPath) {
        await this.startPluginProcess(pluginId, pluginPath);
        this.emit('process.recovered', { pluginId, attempt: attempts + 1 });
        pluginLogger.info('Process recovery successful', pluginId, { attempt: attempts + 1 });
      } else {
        throw new Error('Missing pluginPath for recovery');
      }

    } catch (error: any) {
      pluginLogger.error('Process recovery failed', pluginId, error instanceof Error ? error : new Error(String(error)), { attempt: attempts + 1 });
    }
  }

  private updateProcessStatus(pluginId: string, status: PluginProcessInfo['status']): void {
    const processInfo = this.processes.get(pluginId);
    if (processInfo) {
      processInfo.status = status;
      processInfo.lastActivity = Date.now();
    }
  }

  private findProcessByChannelId(channelId: string): PluginProcessInfo | undefined {
    const processes = Array.from(this.processes.values());
    for (const processInfo of processes) {
      if (processInfo.channelId === channelId) {
        return processInfo;
      }
    }
    return undefined;
  }

  public getProcessInfo(pluginId: string): PluginProcessInfo | undefined {
    return this.processes.get(pluginId);
  }

  public getAllProcesses(): PluginProcessInfo[] {
    return Array.from(this.processes.values());
  }

  public getProcessStats(): {
    total: number;
    running: number;
    stopped: number;
    error: number;
    workerStats: any;
    channelStats: any[];
  } {
    const stats = {
      total: this.processes.size,
      running: 0,
      stopped: 0,
      error: 0,
      workerStats: this.workerPool.getWorkerStats(),
      channelStats: this.communicationChannel.getAllChannelStats(),
    };

    const processes = Array.from(this.processes.values());
    for (const processInfo of processes) {
      switch (processInfo.status) {
        case 'running':
          stats.running++;
          break;
        case 'stopped':
          stats.stopped++;
          break;
        case 'error':
          stats.error++;
          break;
      }
    }

    return stats;
  }

  public async restartPlugin(pluginId: string): Promise<void> {
    const processInfo = this.processes.get(pluginId);
    if (!processInfo) {
      throw new Error(`Plugin process ${pluginId} not found`);
    }

    await this.stopPluginProcess(pluginId, 'restart');
    await this.startPluginProcess(pluginId, processInfo.pluginPath);
  }

  public cleanup(): void {
    // Stop all processes
    const pluginIds = Array.from(this.processes.keys());
    for (const pluginId of pluginIds) {
      try {
        this.stopPluginProcess(pluginId, 'cleanup').catch(() => {});
      } catch (error: any) {
        // Ignore errors during cleanup
      }
    }

    // Cleanup components
    this.workerPool.cleanup();
    this.communicationChannel.cleanup();

    pluginLogger.info('ProcessManager cleanup completed');
  }
}
