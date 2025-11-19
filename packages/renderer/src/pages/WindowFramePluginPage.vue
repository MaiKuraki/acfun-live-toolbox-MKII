<template>
  <div class="window-frame-plugin-page">
    <div class="topbar">
      <div class="title">{{ titleText }}</div>
      <div class="window-controls">
        <button class="btn" title="最小化" @click="minimize">—</button>
        <button class="btn" title="最大化/还原" @click="toggleMax">▢</button>
        <button class="btn close" title="关闭" @click="close">×</button>
      </div>
    </div>
    <div class="content">
      <WujieVue
        v-if="isWujieWindow"
        :key="uiKey"
        :name="wujieName"
        :url="wujieUrl"
        :props="wujieProps"
        :sync="true"
        :alive="false"
        :width="'100%'"
        :height="'100%'"
        @loadError="onLoadError"
      />
      <div v-else class="empty">
        未配置窗口页面（manifest.window 缺失）。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import WujieVue from 'wujie-vue3';
import { buildPluginPageUrl, getApiBase } from '../utils/hosting';
// Popups are bridged to main window via preload popup API

interface PluginUiConfig { html?: string; spa?: boolean; route?: string }
interface PluginManifestLite { window?: PluginUiConfig; name?: string }
interface PluginInfoLite { id: string; version: string; name?: string; manifest: PluginManifestLite }

const route = useRoute();
const pluginInfo = ref<PluginInfoLite | null>(null);
const isWujieWindow = ref(false);
const wujieUrl = ref('');
const wujieName = ref('');
const uiKey = ref('');
const wujieProps = ref<Record<string, any>>({});

const pluginId = computed(() => String((route.params as any).plugname || '').trim());
const titleText = computed(() => pluginInfo.value?.name ? `${pluginInfo.value.name}` : `插件窗口 - ${pluginId.value}`);
const bus: any = (WujieVue as any)?.bus;
const busHandlers: Record<string, any> = {};
let storeSource: EventSource | null = null;
let onConfigUpdated: any = null;

watch(pluginId, async (id) => {
  await resolveWujieWindowConfig(id);
}, { immediate: true });

async function resolveWujieWindowConfig(id: string) {
  try {
    if (!id) { isWujieWindow.value = false; return; }
    const res = await (window as any).electronApi?.plugin?.get?.(id);
    if (res && 'success' in res && res.success) {
      const info = res.data as PluginInfoLite;
      pluginInfo.value = info;
      const conf = (info?.manifest?.window || {}) as PluginUiConfig;
      const hasConf = !!(conf.html || conf.spa);
      if (hasConf) {
        const url = buildPluginPageUrl(id, 'window', {
          spa: !!conf.spa,
          route: conf.route || '/',
          html: conf.html || 'window.html'
        });
        isWujieWindow.value = true;
        wujieUrl.value = url;
        wujieName.value = `window-${id}`;
        uiKey.value = `${id}-${Date.now()}`;
        wujieProps.value = {
          pluginId: id,
          version: info.version,
          initialRoute: conf.spa ? (conf.route || '/') : undefined
        };
      } else {
        isWujieWindow.value = false;
      }
    } else {
      isWujieWindow.value = false;
    }
  } catch (err) {
    console.error('[WindowFramePluginPage] resolveWujieWindowConfig failed:', err);
    isWujieWindow.value = false;
  }
}

function minimize() {
  try { window.electronApi.window.minimizeWindow(); } catch {}
}
function toggleMax() {
  try { window.electronApi.window.maximizeWindow(); } catch {}
}
function close() {
  try { window.electronApi.window.closeWindow(); } catch {}
}

function onLoadError(e: any) { try { console.warn('[WindowFramePluginPage] Wujie load error:', e); } catch {} }

function registerBusHandlers() {
  const onBridgeRequest = (data: any) => {
    const { requestId, command } = data as any;
    const respond = (success: boolean, respData?: any, error?: any) => {
      const payload: Record<string, any> = { type: 'bridge-response', requestId, command, success };
      if (success) payload.data = respData;
      if (!success) payload.error = error;
      try { bus?.$emit?.('bridge-response', payload); } catch {}
    };
    (async () => {
      try {
        try { console.log('[WindowFramePluginPage] bridge-request', { command, requestId, from: 'window-child' }); } catch {}
        if (command === 'get-api-base') {
          try {
            const base = getApiBase();
            respond(true, { base });
          } catch (e) {
            respond(false, null, (e as Error).message);
          }
          return;
        }
        if (command === 'get-config') {
          const res = await window.electronApi.plugin.getConfig(pluginId.value);
          if (res && 'success' in res && res.success) {
            const cfg = (res.data ? { ...res.data } : {});
            if (cfg && typeof cfg === 'object' && 'token' in cfg) { try { delete (cfg as any).token; } catch {} }
            respond(true, cfg);
          } else {
            respond(false, null, (res as any)?.error || 'Failed to get config');
          }
          return;
        }
        if (command === 'set-config') {
          const nextCfg = (data as any)?.payload?.config || {};
          try {
            const r = await window.electronApi.plugin.updateConfig(pluginId.value, nextCfg);
            if (r && 'success' in r && r.success) {
              respond(true, { success: true });
              sendLifecycleEvent('config-updated');
            } else {
              respond(false, null, (r as any)?.error || 'Failed to set config');
            }
          } catch (e) {
            respond(false, null, (e as Error).message);
          }
          return;
        }
        if (command === 'plugin-process') {
          const act = (data as any)?.payload?.action as string;
          try {
            if (act === 'execute') {
              const method = String((data as any)?.payload?.method || '');
              const args = ((data as any)?.payload?.args || []) as any[];
              const r = await window.electronApi.plugin?.process?.execute?.(pluginId.value, method, args);
              if (r && 'success' in r && r.success) respond(true, r.data);
              else respond(false, null, (r as any)?.error || 'execute_failed');
            } else if (act === 'message') {
              const type = String((data as any)?.payload?.type || '');
              const payload = (data as any)?.payload?.payload;
              const r = await window.electronApi.plugin?.process?.message?.(pluginId.value, type, payload);
              if (r && 'success' in r && r.success) respond(true, r.data);
              else respond(false, null, (r as any)?.error || 'message_failed');
            } else {
              respond(false, null, 'Unknown plugin-process action');
            }
          } catch (e) {
            respond(false, null, (e as Error).message);
          }
          return;
        }
        if (command === 'client-hook') {
          const hook = String((data as any)?.payload?.hook || '');
          const payload = (data as any)?.payload?.payload;
          try {
            if (hook === 'ready') {
              emitToChild({ type: 'plugin-event', eventType: 'lifecycle', event: 'ready', payload });
              respond(true, { ok: true });
            } else if (hook === 'window-opened') {
              emitToChild({ type: 'plugin-event', eventType: 'lifecycle', event: 'window-opened', payload });
              respond(true, { ok: true });
            } else if (hook === 'window-closed') {
              emitToChild({ type: 'plugin-event', eventType: 'lifecycle', event: 'window-closed', payload });
              respond(true, { ok: true });
            } else if (hook === 'config-updated') {
              sendLifecycleEvent('config-updated');
              respond(true, { ok: true });
            } else if (hook === 'sse-connected') {
              emitToChild({ type: 'plugin-event', eventType: 'lifecycle', event: 'sse-connected', payload });
              respond(true, { ok: true });
            } else if (hook === 'sse-disconnected') {
              emitToChild({ type: 'plugin-event', eventType: 'lifecycle', event: 'sse-disconnected', payload });
              respond(true, { ok: true });
            } else {
              respond(false, null, 'Unknown client hook');
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
              try { console.log('[WindowFramePluginPage] forward popup.toast', { message, opts }); } catch {}
              await window.electronApi.popup.toast(message, opts);
              respond(true, { shown: true });
            } else if (act === 'alert') {
              try { console.log('[WindowFramePluginPage] forward popup.alert', { title, message, opts }); } catch {}
              await window.electronApi.popup.alert(title, message, opts);
              respond(true, { opened: true });
            } else if (act === 'confirm') {
              try { console.log('[WindowFramePluginPage] forward popup.confirm', { title, message, opts }); } catch {}
              const res = await window.electronApi.popup.confirm(title || '确认', message, opts);
              try { console.log('[WindowFramePluginPage] popup.confirm response', res); } catch {}
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
        try { console.warn('[WindowFramePluginPage] bridge-request error', e); } catch {}
        respond(false, null, (e as Error).message);
      }
    })();
  };
  bus?.$on?.('bridge-request', onBridgeRequest);
  busHandlers.onBridgeRequest = onBridgeRequest;
}

function emitToChild(payload: any) {
  try {
    const pid = String(pluginId.value || '');
    bus?.$emit?.('plugin-event', payload);
    if (pid && payload?.eventType) {
      const type = String(payload.eventType);
      if (type === 'readonly-store') bus?.$emit?.(`plugin:${pid}:store-update`, payload);
      if (type === 'lifecycle') bus?.$emit?.(`plugin:${pid}:lifecycle`, payload);
    }
  } catch (e) {
    try { console.warn('[WindowFramePluginPage] bus emit failed:', e); } catch {}
  }
}

function subscribeReadonlyStore() {
  try {
    const base = getApiBase();
    const url = new URL('/sse/renderer/readonly-store', base).toString();
    storeSource = new EventSource(url);
    storeSource.addEventListener('readonly-store-init', (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data || '{}');
        emitToChild({ type: 'plugin-event', eventType: 'readonly-store', event: 'readonly-store-init', payload: data });
      } catch (e) {}
    });
    storeSource.addEventListener('readonly-store-update', (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data || '{}');
        emitToChild({ type: 'plugin-event', eventType: 'readonly-store', event: 'readonly-store-update', payload: data });
      } catch (e) {}
    });
    storeSource.onerror = () => {
      try { storeSource?.close(); } catch {}
      setTimeout(() => subscribeReadonlyStore(), 3000);
    };
  } catch (err) {
    console.warn('[WindowFramePluginPage] subscribe readonly-store failed:', err);
  }
}

async function emitInitMessage() {
  try {
    let savedConfig: Record<string, any> = {};
    try {
      const res = await window.electronApi.plugin.getConfig(pluginId.value);
      if (res && 'success' in res && res.success) savedConfig = (res.data as Record<string, any>) || {};
    } catch {}
    let manifest: any = undefined;
    try {
      const res = await window.electronApi.plugin.get(pluginId.value);
      if (res && 'success' in res && res.success) manifest = (res as any).data?.manifest;
    } catch {}
    const payload = { type: 'plugin-init', pluginId: pluginId.value, manifest, config: savedConfig } as Record<string, any>;
    bus?.$emit?.('plugin-init', payload);
  } catch (err) {
    console.warn('[WindowFramePluginPage] emitInitMessage failed:', err);
  }
}

onMounted(() => {
  registerBusHandlers();
  subscribeReadonlyStore();
  emitInitMessage();
  try {
    onConfigUpdated = (msg: any) => {
      try {
        if (msg && String(msg.pluginId || '') === String(pluginId.value || '')) {
          sendLifecycleEvent('config-updated');
        }
      } catch {}
    };
    window.electronApi.on('plugin-config-updated', onConfigUpdated);
  } catch {}
});
onUnmounted(() => {
  if (storeSource) { try { storeSource.close(); } catch {} }
  try { if (busHandlers.onBridgeRequest) bus?.$off?.('bridge-request', busHandlers.onBridgeRequest); } catch {}
  try { if (onConfigUpdated) window.electronApi.off('plugin-config-updated', onConfigUpdated); } catch {}
});

function sendLifecycleEvent(event: string) {
  const payload = { type: 'plugin-event', eventType: 'lifecycle', event };
  emitToChild(payload);
}

</script>

<style scoped>
.window-frame-plugin-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.topbar {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 6px;
  background: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-border-level-1-color);
  -webkit-app-region: drag;
}
.title {
  font-size: 11px;
  color: var(--td-text-color-primary);
}
.window-controls { 
  display: flex; 
  gap: 4px; 
  -webkit-app-region: no-drag;
}
.btn {
  border: none;
  background: transparent;
  width: 20px;
  height: 16px;
  border-radius: 3px;
  color: var(--td-text-color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  font-size: 10px;
}
.btn:hover { background: var(--td-bg-color-component-hover); }
.btn.close:hover { background: #f44336; color: white; }

.content {
  flex: 1;
  width: 100%;
  overflow: hidden;
}

.empty {
  padding: 16px;
  color: var(--td-text-color-secondary);
}

:deep(.wujie-container) {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
