import { ref } from "vue";
import { getApiBase, buildPluginPageUrl } from "./hosting";
import { createRendererPluginApi as sharedCreatePluginApi } from "./plugin-api/createRendererPluginApi.ts";

export interface PluginApiContext {
  pluginId: string;
  version?: string;
  mode: "ui" | "window" | "overlay" | "main";
}

// 全局顶部栏显示状态（每个窗口只对应一个插件，无需 Map）
export const windowTopbarVisible = ref<boolean>(true);

export type MessageThemeList = 'info' | 'success' | 'warning' | 'error' | 'question' | 'loading';

// 插件信息类型定义
export interface PluginManifestLite {
  ui?: { html?: string; spa?: boolean; route?: string; topbar?: boolean };
  window?: { html?: string; spa?: boolean; route?: string; topbar?: boolean };
  overlay?: { html?: string; spa?: boolean; route?: string };
  name?: string;
  [key: string]: any;
}

export interface PluginInfoLite {
  id: string;
  version: string;
  name?: string;
  manifest: PluginManifestLite;
  [key: string]: any;
}

/**
 * 通过 HTTP 接口获取插件信息（包括 manifest）
 * @param pluginId 插件 ID
 * @returns 插件信息，如果获取失败返回 null
 */
export async function getPluginInfo(pluginId: string): Promise<PluginInfoLite | null> {
  if (!pluginId) return null;

  try {
    // 方式1: 从 electronApi 获取（优先使用 electronApi）
    if ((window as any).electronApi?.plugin?.get) {
      const res = await (window as any).electronApi?.plugin.get(pluginId);
      return res.data as PluginInfoLite;
    }
    const apiBase = getApiBase();
    const url = new URL('/api/plugins', apiBase).toString();
    const response = await fetch(url);
    if (response.ok) {
      const json = await response.json();
      if (json && json.success && json.plugins) {
        const plugins = json.plugins as any[];
        const found = plugins.find((p: any) => String(p.id) === String(pluginId));
        if (found) {
          return found as PluginInfoLite;
        }
      }
    }

    return null;
  } catch (err) {
    console.warn(`[plugin-injection] Failed to get plugin info for ${pluginId}:`, err);
    return null;
  }
}

/**
 * 获取插件开发配置（用于测试插件时加载测试链接）
 * @param pluginId 插件 ID
 * @returns 开发配置，如果获取失败返回 null
 */
export async function getPluginDevConfig(pluginId: string): Promise<{ projectUrl?: string;[key: string]: any } | null> {
  if (!pluginId) return null;
  try {
    const apiBase = getApiBase();
    const url = new URL(`/api/plugins/${encodeURIComponent(pluginId)}/dev-config`, apiBase).toString();
    const response = await fetch(url);
    if (response.ok) {
      const json = await response.json();
      if (json && json.success && json.data) {
        return json.data;
      }
    }

  } catch (err) {
    console.warn(`[plugin-injection] Failed to get dev config for ${pluginId}:`, err);
    return null;
  }
  return null;
}

/**
 * 构建插件页面 URL（支持开发模式和正式模式）
 * @param pluginId 插件 ID
 * @param type 页面类型：'ui' | 'window' | 'overlay'
 * @param conf 页面配置
 * @returns 构建好的 URL
 */
export async function buildPluginPageUrlWithDev(
  pluginId: string,
  type: 'ui' | 'window' | 'overlay',
  conf: { spa?: boolean; conf: { html?: string; route?: string } }
): Promise<string> {
  let url = '';

  // 尝试加载开发配置，若存在 projectUrl 则优先使用（调试模式）
  const devCfg = await getPluginDevConfig(pluginId);
  if (devCfg && devCfg.projectUrl) {
    const devBase = String(devCfg.projectUrl).trim().replace(/\/$/, '');

    if (conf.spa) {
      // SPA模式：使用 projectUrl 作为根，直接拼接路由
      const r = conf.conf.route || '/';
      url = new URL(r, devBase).toString();
    } else {
      // MPA模式：追加 html 文件名（如果 projectUrl 不含文件名）
      const u = new URL(devBase);
      if (!u.pathname.endsWith('.html') && !u.pathname.endsWith('.htm')) {
        const htmlFile = conf.conf.html || `${type}.html`;
        url = `${devBase}/${htmlFile}`;
      } else {
        url = devBase;
      }
    }

    console.log(`[plugin-injection] Using dev project url for ${type}:`, url);
    return url
  }
  const hostConf = { spa: !!conf.spa, [type]: { route: conf.conf.route || '/', html: conf.conf.html } };
  // 如果没有开发配置，使用正式模式 URL
  url = buildPluginPageUrl(pluginId, type, hostConf);
  return url;
}

export function createPluginApi(context: PluginApiContext) {
  // delegate to shared factory and inject the windowTopbarVisible ref
  return sharedCreatePluginApi(context, windowTopbarVisible);
}

/**
 * 获取 Wujie 插件配置，用于注入 API
 */
export function getWujiePlugins(context: PluginApiContext) {
  return [
    {
      htmlLoader: (code: string) => code,
      jsBeforeLoaders: [
        {
          callback: (appWindow: Window) => {
            // 注入 toolboxApi 到子应用 window
            Object.defineProperty(appWindow, "toolboxApi", {
              get: () => (appWindow as any).$wujie?.props?.toolboxApi,
              configurable: true,
              enumerable: true,
            });
          },
        },
      ],
    },
  ];
}
