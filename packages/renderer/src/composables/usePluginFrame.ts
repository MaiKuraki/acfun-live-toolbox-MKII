import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { buildPluginPageUrl } from '../utils/hosting';
import { getPluginInfo, buildPluginPageUrlWithDev, createPluginApi, getWujiePlugins, type PluginApiContext, type PluginInfoLite, type PluginManifestLite } from '../utils/plugin-injection';

export interface UsePluginFrameOptions {
  mode: 'ui' | 'overlay' | 'window';
  routeParamName?: string;
  buildUrl?: (pluginId: string, type: 'ui' | 'overlay' | 'window', conf: { spa?: boolean; conf: { html?: string; route?: string } }) => Promise<string>;
  onPluginInfo?: (info: PluginInfoLite | null) => void;
}

export interface UsePluginFrameReturn {
  pluginInfo: ReturnType<typeof ref<PluginInfoLite | null>>;
  isWujie: ReturnType<typeof ref<boolean>>;
  wujieUrl: ReturnType<typeof ref<string>>;
  wujieName: ReturnType<typeof ref<string>>;
  uiKey: ReturnType<typeof ref<string>>;
  wujieProps: ReturnType<typeof ref<Record<string, any>>>;
  wujiePlugins: ReturnType<typeof ref<any[]>>;
  resolve: (id: string) => Promise<void>;
  onLoadError: (e: any) => void;
}

/**
 * 统一的插件页面框架 composable
 * 处理插件信息获取、URL 构建、Wujie 参数构造等共性逻辑
 */
export function usePluginFrame(options: UsePluginFrameOptions): UsePluginFrameReturn {
  const { mode, routeParamName = 'plugname', buildUrl, onPluginInfo } = options;

  const route = useRoute();

  // 响应式状态
  const pluginInfo = ref<PluginInfoLite | null>(null);
  const isWujie = ref(false);
  const wujieUrl = ref('');
  const wujieName = ref('');
  const uiKey = ref('');
  const wujieProps = ref<Record<string, any>>({});
  const wujiePlugins = ref<any[]>([]);

  // 计算插件 ID
  const pluginId = computed(() => String((route.params as any)[routeParamName] || '').trim());

  /**
   * 解析插件配置并设置 Wujie 参数
   */
  async function resolveWujieConfig(id: string) {
    try {
      console.log(`[usePluginFrame] Resolving Wujie config for ${mode}, pluginId:`, id);

      if (!id) {
        console.log(`[usePluginFrame] No pluginId provided for ${mode}`);
        isWujie.value = false;
        return;
      }

      // 获取插件信息
      console.log(`[usePluginFrame] Getting plugin info for ${id}`);
      const info = await getPluginInfo(id);
      console.log(`[usePluginFrame] Plugin info retrieved:`, info);

      if (info) {
        pluginInfo.value = info;
        // 调用回调（如有，用于页面特有逻辑）
        onPluginInfo?.(info);

        // 获取 manifest 配置
        const conf = (info?.manifest?.[mode] || {}) as { html?: string; route?: string };
        const spa = info?.manifest?.spa;
        const hasConf = `${conf}` !== '{}';

        console.log(`[usePluginFrame] Manifest config for ${mode}:`, { conf, spa, hasConf });

        if (hasConf) {
          let url = '';

          // 使用自定义 buildUrl 函数或默认逻辑
          if (buildUrl) {
            url = await buildUrl(id, mode as 'ui' | 'overlay' | 'window', { spa, conf });
          } else {
            // 默认使用 buildPluginPageUrlWithDev（包含 dev config 支持）
            url = await buildPluginPageUrlWithDev(id, mode, { spa, conf });
          }

          console.log(`[usePluginFrame] ${mode} url built:`, url);

          isWujie.value = true;
          wujieUrl.value = url;
          wujieName.value = `${mode}-${id}`;
          uiKey.value = `${id}-${Date.now()}`;

          console.log(`[usePluginFrame] Wujie config set:`, {
            isWujie: true,
            wujieUrl: url,
            wujieName: `${mode}-${id}`,
            uiKey: `${id}-${Date.now()}`
          });

          // 构建 API 上下文
          const apiContext: PluginApiContext = {
            pluginId: id,
            version: info.version,
            mode
          };

          // 生成 API 和插件配置
          const toolboxApi = createPluginApi(apiContext);
          wujiePlugins.value = getWujiePlugins(apiContext);

          // 设置 props
          wujieProps.value = {
            pluginId: id,
            version: info.version,
            toolboxApi,
            initialRoute: spa ? (conf.route || '/') : undefined
          };

          console.log(`[usePluginFrame] Wujie props set:`, wujieProps.value);
        } else {
          console.log(`[usePluginFrame] No config found for ${mode}, disabling Wujie`);
          isWujie.value = false;
        }
      } else {
        console.log(`[usePluginFrame] No plugin info found for ${id}, disabling Wujie`);
        isWujie.value = false;
      }
    } catch (err) {
      console.error(`[usePluginFrame] resolveWujieConfig failed for ${mode}:`, err);
      isWujie.value = false;
    }
  }

  // 监听插件 ID 变化
  watch(pluginId, async (id) => {
    await resolveWujieConfig(id);
  }, { immediate: true });

  // 加载错误处理
  function onLoadError(e: any) {
    try {
      console.warn(`[usePluginFrame] Wujie load error for ${mode}:`, e);
    } catch {}
  }

  return {
    pluginInfo,
    isWujie,
    wujieUrl,
    wujieName,
    uiKey,
    wujieProps,
    wujiePlugins,
    resolve: resolveWujieConfig,
    onLoadError
  };
}
