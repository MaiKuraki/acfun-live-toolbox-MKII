<template>
  <div class="plugin-frame-page">
    <!-- 插件 UI 通过 Wujie 微前端组件承载 -->
    <div class="plugin-ui-full-container">
      <WujieVue
        v-if="isWujieUi"
        :key="uiKey"
        :name="wujieName"
        :url="wujieUrl"
        :props="wujieProps"
        :sync="true"
        :alive="false"
        :width="'100%'"
        :height="'100%'"
        @beforeLoad="onBeforeLoad"
        @beforeMount="onBeforeMount"
        @afterMount="onAfterMount"
        @beforeUnmount="onBeforeUnmount"
        @afterUnmount="onAfterUnmount"
        @loadError="onLoadError"
      />
    </div>
     </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import WujieVue from 'wujie-vue3';
import { usePluginStore } from '../stores/plugin';
import { getApiBase, buildPluginPageUrl } from '../utils/hosting';

const pluginStore = usePluginStore();
const route = useRoute();
const bus: any = (WujieVue as any)?.bus;
const busHandlers: Record<string, any> = {};

// Wujie UI 相关状态（按 manifest.ui.html + spa/route 对齐）
interface PluginUiConfig { html?: string; spa?: boolean; route?: string }
interface PluginManifestLite { ui?: PluginUiConfig; window?: PluginUiConfig }
interface PluginInfoLite { id: string; version: string; manifest: PluginManifestLite }
const pluginInfo = ref<PluginInfoLite | null>(null);
const isWujieUi = ref(false);
const wujieUrl = ref('');
const wujieName = ref('');
const uiKey = ref('');
const wujieProps = ref<Record<string, any>>({});

const pluginId = computed(() => String((route.params as any).plugname || '').trim());
const isWindowMode = computed(() => {
  try { return String((route.query as any).type || '').toLowerCase() === 'window' || /\/plugins\/[^/]+\/window$/.test(String(route.path || '')); } catch { return false; }
});
watch(pluginId, () => { resolveWujieUIConfig(); }, { immediate: true });

// 共享只读仓库供子页访问（与 overlay-wrapper 对齐）
;(window as any).__WUJIE_SHARED = (window as any).__WUJIE_SHARED || {};
;(window as any).__WUJIE_SHARED.readonlyStore = (window as any).__WUJIE_SHARED.readonlyStore || {};

function isElectronRenderer(): boolean {
  try {
    const hasNode = typeof process !== 'undefined' && typeof (process as any).versions === 'object';
    const isElectronVersion = hasNode && !!(process as any).versions?.electron;
    const protocol = typeof window !== 'undefined' && window.location ? window.location.protocol : '';
    const isFile = protocol === 'file:';
    const ua = (typeof navigator !== 'undefined' && (navigator as any).userAgent) ? String((navigator as any).userAgent) : '';
    const isElectronUA = /electron/i.test(ua);
    const hasPreloadApi = typeof (window as any).electronApi !== 'undefined';
    return (isElectronVersion || hasPreloadApi) && (isFile || isElectronUA);
  } catch { return false; }
}

async function resolveWujieUIConfig() {
  try {
    const id = pluginId.value;
    if (!id) { isWujieUi.value = false; return; }
    const res = await (window as any).electronApi?.plugin?.get?.(id);
    if (res && 'success' in res && res.success) {
      const info = res.data as PluginInfoLite;
      pluginInfo.value = info;
      const mode: 'ui' | 'window' = isWindowMode.value ? 'window' : 'ui';
      const conf = (info?.manifest?.[mode] || {}) as PluginUiConfig;
      const hasConf = !!(conf.html || conf.spa);
      if (hasConf) {
        const url = buildPluginPageUrl(id, mode, {
          spa: !!conf.spa,
          route: conf.route || '/',
          html: conf.html || `${mode}.html`
        });
        isWujieUi.value = true;
        wujieUrl.value = url;
        wujieName.value = `${mode}-${id}`;
        uiKey.value = `${id}-${Date.now()}`;
        const shared = (window as any).__WUJIE_SHARED || {};
        wujieProps.value = {
          pluginId: id,
          version: info.version,
          shared: { readonlyStore: shared.readonlyStore },
          api: {
            overlay: {
              send: (overlayId: string | undefined, event: string, payload?: any) => {
                const base = getApiBase();
                const url = new URL(`/api/plugins/${encodeURIComponent(String(id))}/overlay/messages`, base).toString();
                const body: any = { event: String(event), payload };
                const ovId = String(overlayId || '').trim();
                if (ovId) body.overlayId = ovId;
                return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
              },
              action: (overlayId: string, action: string, data?: any) => {
                const base = getApiBase();
                const url = new URL(`/api/overlay/${encodeURIComponent(String(overlayId))}/action`, base).toString();
                return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: String(action), data }) });
              },
              updateStyle: (overlayId: string, updates: Record<string, any>) => {
                const base = getApiBase();
                const url = new URL(`/api/overlay/${encodeURIComponent(String(overlayId))}/action`, base).toString();
                return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', data: updates }) });
              }
            }
          },
          initialRoute: conf.spa ? (conf.route || '/') : undefined
        };
      } else {
        isWujieUi.value = false;
      }
    } else {
      isWujieUi.value = false;
    }
  } catch (err) {
    console.error('[PluginFramePage] resolveWujieUIConfig failed:', err);
    isWujieUi.value = false;
  }
}

function emitToChild(_payload: any) {}

function subscribeReadonlyStore() {}



async function emitInitMessage() {
  try {
    // 发送时覆盖 config 为主进程已保存配置，避免 UI 初始显示默认值
    let savedConfig: Record<string, any> = {};
    try {
      const res = await window.electronApi.plugin.getConfig(pluginId.value);
      if (res && 'success' in res && res.success) {
        savedConfig = (res.data as Record<string, any>) || {};
      }
    } catch {}
    // 不依赖本地插件列表，直接从主进程读取清单
    let manifest: any = undefined;
    try {
      const res = await window.electronApi.plugin.get(pluginId.value);
      if (res && 'success' in res && res.success) {
        manifest = (res as any).data?.manifest;
      }
    } catch {}
    const payload = {
      type: 'plugin-init',
      pluginId: pluginId.value,
      manifest,
      config: savedConfig,
      routeQuery: route.query,
    } as Record<string, any>;
    try { console.log('[PluginFramePage] emitInitMessage', { pluginId: pluginId.value, configKeys: Object.keys(savedConfig || {}) }); } catch {}
    bus?.$emit?.('plugin-init', safeClone(payload));
  } catch (err) {
    console.warn('[PluginFramePage] emitInitMessage failed:', err);
  }
}

function registerBusHandlers() {
  // 子页初始化：请求重新建立只读仓库 SSE，并下发初始化消息与生命周期事件
  const onReady = () => {
    try { console.log('[PluginFramePage] bus ready'); } catch {}
    emitInitMessage();
    sendLifecycleEvent('ready');
  };
  bus?.$on?.('plugin-ready', onReady);
  bus?.$on?.('ui-ready', onReady);
  busHandlers.onReady = onReady;
  // 最小桥接：将来自插件 UI 的 Overlay 相关事件转发到主进程 API
  const onOverlayAction = ({ overlayId, action, payload }: any) => {
    try {
      const base = getApiBase();
      const url = new URL(`/api/overlay/${encodeURIComponent(String(overlayId))}/action`, base).toString();
      try { console.log('[PluginFramePage] forward overlay-action', { overlayId: String(overlayId), action: String(action) }); } catch {}
      void fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: String(action), data: payload }) });
    } catch (e) { console.warn('[PluginFramePage] overlay-action failed:', e); }
  };
  const onOverlayClose = ({ overlayId }: any) => {
    try {
      const base = getApiBase();
      const url = new URL(`/api/overlay/${encodeURIComponent(String(overlayId))}/action`, base).toString();
      try { console.log('[PluginFramePage] forward overlay-close', { overlayId: String(overlayId) }); } catch {}
      void fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'close' }) });
    } catch (e) { console.warn('[PluginFramePage] overlay-close failed:', e); }
  };
  const onOverlayUpdate = ({ overlayId, updates }: any) => {
    try {
      const base = getApiBase();
      const url = new URL(`/api/overlay/${encodeURIComponent(String(overlayId))}/action`, base).toString();
      try { console.log('[PluginFramePage] forward overlay-update', { overlayId: String(overlayId), keys: Object.keys(updates || {}) }); } catch {}
      void fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', data: updates }) });
    } catch (e) { console.warn('[PluginFramePage] overlay-update failed:', e); }
  };
  const onOverlaySend = ({ overlayId, event: ev, payload }: any) => {
    try {
      const base = getApiBase();
      const url = new URL(`/api/plugins/${encodeURIComponent(pluginId.value)}/overlay/messages`, base).toString();
      const id = String(overlayId || '').trim();
      const body: any = { event: String(ev), payload };
      if (id) body.overlayId = id;
      try { console.log('[PluginFramePage] forward overlay-send', { overlayId: id || '(broadcast)', event: String(ev) }); } catch {}
      void fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch (e) { console.warn('[PluginFramePage] overlay-send failed:', e); }
  };
  bus?.$on?.('overlay-action', onOverlayAction);
  bus?.$on?.('overlay-close', onOverlayClose);
  bus?.$on?.('overlay-update', onOverlayUpdate);
  bus?.$on?.('overlay-send', onOverlaySend);
  busHandlers.onOverlayAction = onOverlayAction;
  busHandlers.onOverlayClose = onOverlayClose;
  busHandlers.onOverlayUpdate = onOverlayUpdate;
  busHandlers.onOverlaySend = onOverlaySend;

  // 桥接请求：配置与 Overlay 操作统一处理
  const onBridgeRequest = (data: any) => {
    const { requestId, command } = data as any;
    const respond = (success: boolean, respData?: any, error?: any) => {
      const payload: Record<string, any> = { type: 'bridge-response', requestId, command, success };
      if (success) payload.data = respData;
      if (!success) payload.error = error;
      try { bus?.$emit?.('bridge-response', payload); } catch (e) { /* noop */ }
    };
    (async () => {
      try {
        if (command === 'process.execute') {
          try {
            const payload = (data as any)?.payload || {};
            const method = String(payload.method || '');
            const args = Array.isArray(payload.args) ? payload.args : [];
            const res = await (window as any).electronApi?.plugin?.process?.execute?.(pluginId.value, method, args);
            const ok = !!(res && (res.ok === undefined || res.ok === true));
            respond(ok, res, (res as any)?.error);
          } catch (e) {
            respond(false, null, (e as Error).message);
          }
          return;
        }
        if (command === 'get-api-base') {
          try {
            const base = getApiBase();
            try { console.log('[PluginFramePage] bridge get-api-base', { base }); } catch {}
            respond(true, { base });
          } catch (e) {
            respond(false, null, (e as Error).message);
          }
          return;
        }
        if (command === 'get-config') {
          const res = await window.electronApi.plugin.getConfig(pluginId.value);
          if (res && 'success' in res && res.success) {
            // 从返回的配置中删除敏感字段（例如 token），不向插件 UI 传递
            const cfg = (res.data ? { ...res.data } : {});
            if (cfg && typeof cfg === 'object' && 'token' in cfg) {
              try { delete (cfg as any).token; } catch (_) {}
            }
            try { console.log('[PluginFramePage] bridge get-config success', { pluginId: pluginId.value, keys: Object.keys(cfg || {}) }); } catch {}
            respond(true, cfg);
          } else {
            try { console.warn('[PluginFramePage] bridge get-config failed', { pluginId: pluginId.value, error: (res as any)?.error }); } catch {}
            respond(false, null, (res as any)?.error || 'Failed to get config');
          }
          return;
        }
        if (command === 'set-config') {
          const nextCfg = (data as any)?.payload?.config || {};
          try {
            await pluginStore.updatePluginConfig(pluginId.value, nextCfg);
            try { console.log('[PluginFramePage] bridge set-config', { pluginId: pluginId.value, keys: Object.keys(nextCfg || {}) }); } catch {}
            respond(true, { success: true });
            sendLifecycleEvent('config-updated');
          } catch (e) {
            respond(false, null, (e as Error).message);
          }
          return;
        }
        if (command === 'overlay') {
          const act = (data as any)?.payload?.action;
          const args = (data as any)?.payload?.args || [];
          try {
            if (act === 'send') {
              const base = getApiBase();
              const url = new URL(`/api/plugins/${encodeURIComponent(pluginId.value)}/overlay/messages`, base).toString();
              const ovId = String((args[0] ?? '')).trim();
              const body: any = { event: String(args[1]), payload: args[2] };
              if (ovId) body.overlayId = ovId;
              try { console.log('[PluginFramePage] bridge overlay send', { overlayId: ovId || '(broadcast)', event: String(args[1]) }); } catch {}
              const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
              const json = await resp.json().catch(() => ({ success: resp.ok }));
              const ok = !!(json && 'success' in json ? json.success : resp.ok);
              respond(ok, json, json?.error);
            } else if (act === 'action') {
              const base = getApiBase();
              const url = new URL(`/api/overlay/${encodeURIComponent(String(args[0]))}/action`, base).toString();
              const body = { action: String(args[1] || ''), data: args[2] };
              try { console.log('[PluginFramePage] bridge overlay action', { overlayId: String(args[0]), action: String(args[1] || '') }); } catch {}
              const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
              const json = await resp.json().catch(() => ({ success: resp.ok }));
              const ok = !!(json && 'success' in json ? json.success : resp.ok);
              respond(ok, json, json?.error);
            } else {
              // 其余动作（create/close/show/hide/bringToFront/update/list）不再通过桥接提供
              respond(false, null, 'Overlay manual controls are removed. Use messages or actions only.');
            }
          } catch (e) {
            respond(false, null, (e as Error).message);
          }
          return;
        }
        if (command === 'renderer-popup') {
          const act = (data as any)?.payload?.action as string;
          const payload = (data as any)?.payload?.payload || {};
          const title = String(payload?.title || '');
          const message = String(payload?.message || '');
          const opts = { durationMs: Number(payload?.options?.durationMs || 2500), contextId: pluginId.value };
          try {
            if (act === 'toast') {
              await (window as any).electronApi?.popup?.toast?.(message, opts);
              respond(true, { shown: true });
            } else if (act === 'alert') {
              await (window as any).electronApi?.popup?.alert?.(title, message, opts);
              respond(true, { opened: true });
            } else if (act === 'confirm') {
              const res = await (window as any).electronApi?.popup?.confirm?.(title || '确认', message, opts);
              respond(true, { result: !!(res as any)?.result });
            } else {
              respond(false, null, 'Unknown popup action');
            }
          } catch (e) {
            respond(false, null, (e as Error).message);
          }
          return;
        }
      } catch (e) {
        respond(false, null, (e as Error).message);
      }
    })();
  };
  bus?.$on?.('bridge-request', onBridgeRequest);
  busHandlers.onBridgeRequest = onBridgeRequest;
}

onMounted(() => {
  try { console.log('[PluginFramePage] mounted', { pluginId: pluginId.value }); } catch {}
  registerBusHandlers();
  // 框架页不再负责只读仓库与生命周期/overlay事件的广播与订阅
});

onUnmounted(() => {
  // 解绑 bus 事件，避免内存泄漏
  try {
    if (busHandlers.onReady) {
      bus?.$off?.('plugin-ready', busHandlers.onReady);
      bus?.$off?.('ui-ready', busHandlers.onReady);
    }
    if (busHandlers.onOverlayAction) bus?.$off?.('overlay-action', busHandlers.onOverlayAction);
    if (busHandlers.onOverlayClose) bus?.$off?.('overlay-close', busHandlers.onOverlayClose);
    if (busHandlers.onOverlayUpdate) bus?.$off?.('overlay-update', busHandlers.onOverlayUpdate);
    if (busHandlers.onOverlaySend) bus?.$off?.('overlay-send', busHandlers.onOverlaySend);
    if (busHandlers.onBridgeRequest) bus?.$off?.('bridge-request', busHandlers.onBridgeRequest);
  } catch {}
});

// 管理视图相关脚本与定时刷新已移除

function safeClone(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  try { return JSON.parse(JSON.stringify(obj)); } catch { return obj; }
}

function sendLifecycleEvent(event: string) {
  const payload = { type: 'plugin-event', eventType: 'lifecycle', event };
  emitToChild(payload);
}

// 页级只读仓库上报逻辑已移除，改为各 Pinia store 级变更订阅并统一上报

// Wujie 生命周期钩子（占位）
const onBeforeLoad = () => {};
const onBeforeMount = () => {};
const onAfterMount = () => {};
const onBeforeUnmount = () => {};
const onAfterUnmount = () => {};
const onLoadError = (e: any) => {
  try { console.warn('[PluginFramePage] Wujie load error:', e); } catch {}
};

</script>

<style scoped>
.plugin-frame-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.plugin-ui-full-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: scroll;
}

/* Wujie 容器占满区域 */
:deep(.wujie-container) {
  width: 100%;
  height: 100%;
  overflow: scroll;
}
</style>
