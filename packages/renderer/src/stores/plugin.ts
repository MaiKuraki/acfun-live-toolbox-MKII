import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { reportReadonlyUpdate } from '../utils/readonlyReporter';
import { registerPluginRoute, unregisterPluginRoute } from '../router';
import { getPluginHostingConfig, buildPluginPageUrl, getApiBase, resolvePrimaryHostingType, buildOverlayFrameUrl } from '../utils/hosting';
import { useNetworkStore } from './network';

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  icon?: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];
  status: 'active' | 'inactive' | 'error' | 'loading';
  enabled: boolean;
  autoStart: boolean;
  installTime: Date;
  lastUpdate: Date;
  // 统一托管入口（UI页面）——按需填充，不自动使用
  entryUrl?: string;

  // 插件配置
  config?: Record<string, any>;

  // 侧边栏显示配置
  sidebarDisplay?: {
    show: boolean;
    order?: number;
    group?: string;
    icon?: string;
    title?: string;
  };
  liveRoomDisplay?: {
    show: boolean;
    order?: number;
    group?: string;
    icon?: string;
    title?: string;
  };

  // 路由配置
  routes?: PluginRoute[];

  // Wujie配置
  wujie?: {
    url: string;
    name: string;
    width?: string;
    height?: string;
    props?: Record<string, any>;
    attrs?: Record<string, any>;
    sync?: boolean;
    alive?: boolean;
  };

  // 是否包含 overlay
  hasOverlay?: boolean;

  // 错误信息
  error?: string;
}

export interface PluginRoute {
  path: string;
  name: string;
  component?: string;
  meta?: Record<string, any>;
}

export interface PluginStats {
  total: number;
  active: number;
  inactive: number;
  error: number;
  loading: number;
}

export const usePluginStore = defineStore('plugin', () => {
  // 状态
  const plugins = ref<PluginInfo[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const installingPlugins = ref<Set<string>>(new Set());

  // 计算属性
  const activePlugins = computed(() => plugins.value.filter(p => p.status === 'active'));
  const inactivePlugins = computed(() => plugins.value.filter(p => p.status === 'inactive'));
  const errorPlugins = computed(() => plugins.value.filter(p => p.status === 'error'));
  const loadingPlugins = computed(() => plugins.value.filter(p => p.status === 'loading'));

  const sidebarPlugins = computed(() =>
    plugins.value
      .filter(p => p.sidebarDisplay?.show && p.status === 'active')
      .sort((a, b) => (a.sidebarDisplay?.order || 999) - (b.sidebarDisplay?.order || 999))
  );

  const stats = computed<PluginStats>(() => ({
    total: plugins.value.length,
    active: activePlugins.value.length,
    inactive: inactivePlugins.value.length,
    error: errorPlugins.value.length,
    loading: loadingPlugins.value.length,
  }));

  // 变更订阅：插件列表/加载状态变化时，调用统一只读上报
  watch(
    () => [plugins.value, isLoading.value],
    () => {
      try {
        reportReadonlyUpdate({
          plugin: {
            list: plugins.value,
            stats: stats.value,
            loading: isLoading.value,
          }
        });
      } catch { }
    },
    { deep: true }
  );

  // 动作
  async function loadPlugins() {
    isLoading.value = true;
    error.value = null;
    const savedSidebarMap = new Map<string, PluginInfo['sidebarDisplay'] | undefined>();
    const savedLiveRoomMap = new Map<string, PluginInfo['liveRoomDisplay'] | undefined>();
    try {
      const saved = localStorage.getItem('installedPlugins');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id) {
              savedSidebarMap.set(item.id, item.sidebarDisplay || undefined);
              savedLiveRoomMap.set(item.id, item.liveRoomDisplay || undefined);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[plugin] 读取本地已保存的侧边栏状态失败:', e);
    }
    const base = getApiBase();
    const url = new URL('/api/plugins', base).toString();
    const resp = await fetch(url);
    const data = await resp.json();
    if (data && data.success && Array.isArray(data.plugins)) {
      const mapStatus = (s: string): 'active' | 'inactive' | 'error' | 'loading' => {
        switch ((s || '').toLowerCase()) {
          case 'enabled':
          case 'active':
            return 'active';
          case 'disabled':
          case 'installed':
          case 'inactive':
            return 'inactive';
          case 'error':
            return 'error';
          default:
            return 'loading';
        }
      };

      plugins.value = data.plugins.map((p: any) => {
        const base = getApiBase();
        // 为图标使用受支持的静态托管作用域：/plugins/:id/ui/*
        // 服务器路由将子路径映射到插件根目录，避免直接访问根路径造成 404
        const iconUrl = p?.manifest?.icon
          ? new URL(`/plugins/${p.id}/${p.manifest.icon}`, base).toString()
          : (p.icon || undefined);
        return {
          id: p.id,
          name: p.name,
          version: p.version,
          description: p.description,
          author: p.author,
          icon: iconUrl,
          status: mapStatus(p.status),
          enabled: !!p.enabled,
          autoStart: false,
          installTime: new Date(p.installedAt || Date.now()),
          lastUpdate: new Date(),
          entryUrl: undefined,
          config: p.manifest?.config || undefined,
          hasOverlay: !!p.manifest?.overlay,
          // 合并持久化的侧边栏显示状态
          sidebarDisplay: savedSidebarMap.get(p.id) || undefined,
          liveRoomDisplay: savedLiveRoomMap.get(p.id) || undefined,
        };
      });

      // 保存本地以便后续展示
      savePluginDisplays();
    } else {
      throw new Error(data?.error || '获取插件列表失败');
    }
    isLoading.value = false;
  }

  // 保存插件显示配置到localStorage
  const savePluginDisplays = () => {
    const displays = plugins.value.map(plugin => ({
      id: plugin.id,
      sidebarDisplay: plugin.sidebarDisplay,
      liveRoomDisplay: plugin.liveRoomDisplay,
    }));
    localStorage.setItem('installedPlugins', JSON.stringify(displays));
  }

  async function refreshPluginStatus() {
    await loadPlugins();
    
  }

  async function installPlugin(pluginUrl: string) {
    try {
      installingPlugins.value.add(pluginUrl);

      // 使用真实的preload API安装插件
      const result = await window.electronApi?.plugin.install({ url: pluginUrl });

      if (!result.success) {
        throw new Error(result.error || '安装插件失败');
      }

      if (result.pluginId) {
        // 安装成功后，重新加载插件列表以获取完整的插件信息
        await loadPlugins();

        // 找到新安装的插件
        const newPlugin = plugins.value.find(p => p.id === result.pluginId);
        if (newPlugin) {
          console.log('Plugin installed successfully:', newPlugin.name);

          // 如果插件启用，注册路由
          if (newPlugin.enabled && newPlugin.routes) {
            registerPluginRoutes(newPlugin);
          }

          return newPlugin;
        } else {
          throw new Error('安装插件失败：未找到已安装的插件');
        }
      } else {
        throw new Error('安装插件失败：未返回插件ID');
      }
    } catch (err) {
      console.error('Failed to install plugin:', err);
      throw err;
    } finally {
      installingPlugins.value.delete(pluginUrl);
    }
  }



  // 通过本地文件路径安装插件
  async function installPluginFromFilePath(filePath: string) {
    try {
      installingPlugins.value.add(filePath);
      const result = await window.electronApi?.plugin.install({ filePath });
      if (!result.success) {
        throw new Error(result.error || '安装插件失败');
      }
      if (result.pluginId) {
        await loadPlugins();
        const newPlugin = plugins.value.find(p => p.id === result.pluginId);
        if (newPlugin) {
          if (newPlugin.enabled && newPlugin.routes) {
            registerPluginRoutes(newPlugin);
          }
          return newPlugin;
        }
        throw new Error('安装插件失败：未找到已安装的插件');
      }
      throw new Error('安装插件失败：未返回插件ID');
    } catch (err) {
      console.error('Failed to install plugin from file path:', err);
      throw err;
    } finally {
      installingPlugins.value.delete(filePath);
    }
  }

  // 从商店安装插件的方法
  async function installPluginFromShop(pluginId: string) {
    try {
      installingPlugins.value.add(pluginId);

      const response = await fetch(`/api/plugins/store/${pluginId}/install`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.plugin) {
        const newPlugin: PluginInfo = {
          ...data.plugin,
          installTime: new Date(),
          lastUpdate: new Date(),
        };

        // 检查是否已存在
        const existingIndex = plugins.value.findIndex(p => p.id === newPlugin.id);
        if (existingIndex >= 0) {
          plugins.value[existingIndex] = newPlugin;
        } else {
          plugins.value.push(newPlugin);
        }

        

        // 如果插件启用，注册路由
        if (newPlugin.enabled && newPlugin.routes) {
          registerPluginRoutes(newPlugin);
        }

        return newPlugin;
      } else {
        throw new Error(data.message || '从商店安装插件失败');
      }
    } catch (err) {
      console.error('Failed to install plugin from store:', err);
      throw err;
    } finally {
      installingPlugins.value.delete(pluginId);
    }
  }

  // 刷新插件状态的别名方法
  async function refreshPlugins() {
    return refreshPluginStatus();
  }

  // 重新加载插件的方法
  async function reloadPlugin(pluginId: string) {
    try {
      const plugin = getPluginById(pluginId);
      if (!plugin) {
        throw new Error('插件不存在');
      }

      // 使用新的 reload API，它会在后端重新加载清单并重启（存在性检查）
      if (!(window as any).electronApi?.plugin?.reload) {
        throw new Error('plugin.reload 不可用');
      }
      const result = await (window as any).electronApi?.plugin.reload(pluginId);
      if (!result.success) {
        throw new Error(result.error || '重新加载插件失败');
      }

      // 重新加载插件列表以获取最新状态（包括新的配置项）
      await refreshPluginStatus();
    } catch (err) {
      console.error('Failed to reload plugin:', err);
      throw err;
    }
  }

  async function uninstallPlugin(pluginId: string) {
    try {
      const plugin = getPluginById(pluginId);
      if (!plugin) return;

      // 先停用插件
      if (plugin.enabled) {
        await togglePlugin(pluginId, false);
      }

      // 使用真实的preload API卸载插件
      const result = await window.electronApi?.plugin.uninstall(pluginId);

      if (!result.success) {
        throw new Error(result.error || '卸载插件失败');
      }

      // 从列表中移除
      const index = plugins.value.findIndex(p => p.id === pluginId);
      if (index >= 0) {
        plugins.value.splice(index, 1);
      }

    } catch (err) {
      console.error('Failed to uninstall plugin:', err);
      throw err;
    }
  }

  async function togglePlugin(pluginId: string, enabled: boolean) {
    try {
      const plugin = getPluginById(pluginId);
      if (!plugin) return;

      // 使用真实的preload API启用/停用插件
      console.log(`[DEBUG] Calling ${enabled ? 'enable' : 'disable'} for plugin ${pluginId}`);
      const result = enabled
        ? await window.electronApi?.plugin.enable(pluginId)
        : await window.electronApi?.plugin.disable(pluginId);

      console.log(`[DEBUG] Result for ${enabled ? 'enable' : 'disable'} ${pluginId}:`, result);
      console.log(`[DEBUG] Plugin state before update:`, { enabled: plugin.enabled, status: plugin.status });

      if (!result.success) {
        throw new Error(result.error || `${enabled ? '启用' : '停用'}插件失败`);
      }

      // 更新插件状态
      plugin.enabled = enabled;
      plugin.status = enabled ? 'active' : 'inactive';
      plugin.lastUpdate = new Date();
      console.log(`[DEBUG] Plugin state after update:`, { enabled: plugin.enabled, status: plugin.status });

      // 处理路由注册/注销
      if (enabled && plugin.routes) {
        registerPluginRoutes(plugin);
      } else if (!enabled && plugin.routes) {
        unregisterPluginRoutes(plugin);
      }

      
    } catch (err) {
      console.error(`Failed to ${enabled ? 'enable' : 'disable'} plugin:`, err);
      throw err;
    }
  }

  async function updatePluginConfig(pluginId: string, config: Record<string, any>) {
    const plugin = getPluginById(pluginId);
    if (!plugin) return;

    // 先持久化到主进程配置
    try {
      const plain = JSON.parse(JSON.stringify(config));
      const res = await window.electronApi?.plugin.updateConfig(pluginId, plain);
      if (!('success' in res) || !res.success) {
        throw new Error('error' in res ? String(res.error) : '更新配置失败');
      }
    } catch (err) {
      console.error('Persist plugin config failed:', err);
      throw err;
    }

    // 成功后更新本地 schema 值
    const next: Record<string, any> = { ...plugin.config };
    for (const key in config) {
      const incoming = config[key];
      const existing = next[key];
      if (existing && typeof existing === 'object') {
        next[key] = { ...existing, value: incoming };
      } else {
        next[key] = incoming;
      }
    }
    plugin.config = next;
    plugin.lastUpdate = new Date();
  }

  function updatePluginSidebarDisplay(pluginId: string, sidebarDisplay: PluginInfo['sidebarDisplay']) {
    const plugin = getPluginById(pluginId);
    if (plugin) {
      plugin.sidebarDisplay = sidebarDisplay;
      plugin.lastUpdate = new Date();
      savePluginDisplays();
    }
  }

  function updatePluginLiveRoomDisplay(pluginId: string, liveRoomDisplay: PluginInfo['liveRoomDisplay']) {
    const plugin = getPluginById(pluginId);
    if (plugin) {
      plugin.liveRoomDisplay = liveRoomDisplay;
      plugin.lastUpdate = new Date();
      savePluginDisplays();
    }
  }

  function getPluginById(pluginId: string): PluginInfo | undefined {
    return plugins.value.find(p => p.id === pluginId);
  }

  // 托管相关：按需获取插件页面URL（不变更UI渲染逻辑）
  async function getPluginUIUrl(pluginId: string): Promise<string | null> {
    try {
      const primary = await resolvePrimaryHostingType(pluginId);
      if (primary.type !== 'ui') return null;
      return buildPluginPageUrl(pluginId, 'ui', { ui: primary.item || null });
    } catch (err) {
      console.warn('[plugin] 获取UI托管URL失败:', err);
      return null;
    }
  }

  async function getPluginWindowUrl(pluginId: string): Promise<string | null> {
    try {
      const primary = await resolvePrimaryHostingType(pluginId);
      if (primary.type !== 'window') return null;
      return buildPluginPageUrl(pluginId, 'window', { window: primary.item || null });
    } catch (err) {
      console.warn('[plugin] 获取Window托管URL失败:', err);
      return null;
    }
  }

  async function getPluginOverlayUrl(pluginId: string): Promise<string | null> {
    try {
      return buildOverlayFrameUrl(pluginId);
    } catch (err) {
      console.warn('[plugin] 获取Overlay托管URL失败:', err);
      return null;
    }
  }

  // 路由管理
  function registerPluginRoutes(plugin: PluginInfo) {
    if (!plugin.routes) return;

    plugin.routes.forEach(route => {
      const routeRecord: any = {
        path: route.path,
        name: route.name,
        meta: route.meta,
      };

      if (route.component) {
        routeRecord.component = () => import(/* @vite-ignore */ route.component!);
      }

      registerPluginRoute(plugin.id, routeRecord);
    });
  }

  function unregisterPluginRoutes(plugin: PluginInfo) {
    if (!plugin.routes) return;

    plugin.routes.forEach(_route => {
      unregisterPluginRoute(plugin.id);
    });
  }




  // 监听插件状态变更事件（热重载、远程控制等触发）
  if (window.electronApi?.on) {
    window.electronApi?.on('plugin-status-changed', (payload: any) => {
      console.log(`[DEBUG] Received plugin-status-changed event:`, payload);
      // Add a small delay to ensure main process state is fully consistent
      setTimeout(() => {
        console.log(`[DEBUG] Calling refreshPluginStatus after plugin-status-changed`);
        refreshPluginStatus();
      }, 100);
    });
  }

  return {
    // 状态
    plugins,
    isLoading,
    error,
    installingPlugins,

    // 计算属性
    activePlugins,
    inactivePlugins,
    errorPlugins,
    loadingPlugins,
    sidebarPlugins,
    stats,

    // 动作
    loadPlugins,
    refreshPluginStatus,
    refreshPlugins,
    installPlugin,
    installPluginFromFilePath,
    installPluginFromShop,
    uninstallPlugin,
    reloadPlugin,
    togglePlugin,
    updatePluginConfig,
    updatePluginSidebarDisplay,
    updatePluginLiveRoomDisplay,
    savePluginDisplays,
    getPluginById,
    // 托管相关工具方法（仅提供给页面按需调用）
    getPluginUIUrl,
    getPluginWindowUrl,
    getPluginOverlayUrl,
  };
});
