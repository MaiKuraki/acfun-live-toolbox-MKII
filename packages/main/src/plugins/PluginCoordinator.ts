import { MemoryPoolManager } from './MemoryPoolManager';
import { PluginConnectionPoolManager } from './ConnectionPoolManager';
import { pluginCacheManager } from './PluginCacheManager';
import { pluginLazyLoader } from './PluginLazyLoader';
import { pluginPerformanceMonitor } from './PluginPerformanceMonitor';
import { PluginUpdater } from './PluginUpdater';

export class PluginCoordinator {
  readonly memoryPool: MemoryPoolManager;
  readonly connectionPool: PluginConnectionPoolManager;
  readonly cache = pluginCacheManager;
  readonly lazyLoader = pluginLazyLoader;
  readonly perf = pluginPerformanceMonitor;
  readonly updater: PluginUpdater;

  constructor(opts: { memoryPool: MemoryPoolManager; connectionPool: PluginConnectionPoolManager; updater: PluginUpdater }) {
    this.memoryPool = opts.memoryPool;
    this.connectionPool = opts.connectionPool;
    this.updater = opts.updater;
  }
}