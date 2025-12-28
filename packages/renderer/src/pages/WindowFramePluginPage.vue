<template>
  <div class="window-frame-plugin-page">
    <div v-if="showTopbar" class="topbar">
      <div class="title">{{ titleText }}</div>
      <div class="window-controls">
        <button class="btn" title="最小化" @click="minimize">—</button>
        <button class="btn" title="最大化/还原" @click="toggleMax">▢</button>
        <button class="btn close" title="关闭" @click="close">×</button>
      </div>
    </div>
    <div class="content">
      <WujieVue v-if="isWujie" :key="uiKey" :name="wujieName" :url="wujieUrl" :props="wujieProps"
        :plugins="wujiePlugins" :sync="true" :alive="false" :width="'100%'" :height="'100%'" @loadError="onLoadError" />
      <div v-else class="empty">
        未配置窗口页面（manifest.window 缺失）。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import WujieVue from 'wujie-vue3';
import { windowTopbarVisible } from '../utils/plugin-injection';
import { setReadonlyIsMain } from '../utils/readonlyReporter';
import { usePluginFrame } from '../composables/usePluginFrame';

setReadonlyIsMain(false);

// 从 manifest 初始化 showTopbar 的函数
const initializeTopbarFromManifest = (info: any) => {
  if (info?.manifest?.window) {
    const conf = info.manifest.window;
    // 读取 manifest.window.topbar 字段
    // 如果 topbar 为 false，则隐藏；否则（true 或 undefined）显示
    windowTopbarVisible.value = conf.topbar !== false;
  } else {
    // 如果没有 window 配置，默认显示
    windowTopbarVisible.value = true;
  }
};

// 使用统一的插件框架 composable
const {
  pluginInfo,
  isWujie,
  wujieUrl,
  wujieName,
  uiKey,
  wujieProps,
  wujiePlugins,
  onLoadError
} = usePluginFrame({
  mode: 'window',
  routeParamName: 'plugname',
  onPluginInfo: initializeTopbarFromManifest
});

const titleText = computed(() => pluginInfo.value?.name ? `${pluginInfo.value.name}` : `插件窗口 - ${pluginInfo.value?.id || ''}`);

// 直接使用共享的响应式变量
const showTopbar = windowTopbarVisible;

// 清理：组件卸载时移除状态（可选，如果希望保留状态可以不移除）
onUnmounted(() => {
  // 注意：这里不移除状态，因为插件可能还在使用
  // 如果需要清理，可以调用 removePluginTopbarState(id);
});

function minimize() {
  try { window.electronApi?.window.minimizeWindow(); } catch { }
}
function toggleMax() {
  try { window.electronApi?.window.maximizeWindow(); } catch { }
}
function close() {
  try { window.electronApi?.window.closeWindow(); } catch { }
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

.btn:hover {
  background: var(--td-bg-color-component-hover);
}

.btn.close:hover {
  background: #f44336;
  color: white;
}

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
