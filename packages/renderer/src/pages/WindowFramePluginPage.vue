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
import { ref, computed, watch } from 'vue';
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
