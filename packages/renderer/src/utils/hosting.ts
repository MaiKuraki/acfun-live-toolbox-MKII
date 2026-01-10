export type HostingPageType = 'ui' | 'window' | 'overlay';
import { useNetworkStore } from '../stores/network'
interface HostingConfigItem {
  route: string;
  html: string;
}

interface HostingConfig {
  spa: boolean;
  ui: HostingConfigItem | null;
  window: HostingConfigItem | null;
  overlay: HostingConfigItem | null;
}

export function getApiPort(): number {
  const s = useNetworkStore()
  return Number(s.apiPort)
}

export function getApiBase(): string {
  const s = useNetworkStore()
  return s.apiBase
}

export async function getPluginHostingConfig(pluginId: string): Promise<HostingConfig> {
  const res = await window.electronApi?.hosting.getConfig(pluginId);
  if (res && 'success' in res && res.success) {
    return res.data as HostingConfig;
  }
  throw new Error((res as any)?.error || 'Failed to get hosting config');
}

/**
 * Choose a primary hosting type between UI and Window.
 * Policy: prefer `ui` when both are present; fallback to `window`.
 * Overlay is independent and may coexist.
 */
export function resolvePrimaryHostingFromConfig(conf: HostingConfig): {
  type: 'ui' | 'window' | null;
  item?: HostingConfigItem;
} {
  // Prefer UI if declared; else use Window; else none
  if (conf.ui) return { type: 'ui', item: conf.ui };
  if (conf.window) return { type: 'window', item: conf.window };
  return { type: null };
}

export async function resolvePrimaryHostingType(pluginId: string): Promise<{
  type: 'ui' | 'window' | null;
  item?: HostingConfigItem;
}> {
  const conf = await getPluginHostingConfig(pluginId);
  return resolvePrimaryHostingFromConfig(conf);
}

export function buildPluginPageUrl(
  pluginId: string,
  type: HostingPageType,
  conf: Partial<HostingConfig>
): string {
  const base = getApiBase();
  const scope = `/plugins/${pluginId}`;
  const url = new URL(scope, base);
  // SPA: serve entry at scope; optionally pass route as query for initial navigation
  if (conf.spa) {
    const route = conf[type]?.route || '/';
    if (route && route !== '/') {
      url.pathname = url.pathname + (route.startsWith('/') ? route : '/' + route);
    }
    return url.toString();
  }

  // Non-SPA: serve specific html entry (defaults to <type>.html)
  const html = conf[type]?.html || `${type}.html`;
  url.pathname = url.pathname + (html.startsWith('/') ? html : '/' + html);
  return url.toString();
}




/**
 * Build external wrapper URL with overlayId.
 */

export function buildOverlayFrameUrl(pluginId: string): string {
  if (import.meta.env.DEV) {
    return `${window.location.host}/#/plugins/${pluginId}/overlay?apiPort=${getApiPort()}`;
  }
  return `${getApiBase()}/app/#/plugins/${pluginId}/overlay?apiPort=${getApiPort()}&pluginId=${pluginId}`;
}

