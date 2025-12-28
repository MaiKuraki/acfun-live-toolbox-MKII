<template>
  <div class="plugin-frame-page">
    <!-- 插件 UI 通过 Wujie 微前端组件承载 -->
    <WujieVue v-if="isWujie" class="plugin-ui-full-container" :key="uiKey" :name="wujieName" :url="wujieUrl"
      :props="wujieProps" :plugins="wujiePlugins" :sync="true" :alive="false" :width="'100%'" :height="'100%'"
      @loadError="onLoadError" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import WujieVue from 'wujie-vue3';
import { usePluginFrame } from '../composables/usePluginFrame';

const bus: any = (WujieVue as any)?.bus;
const busHandlers: Record<string, any> = {};

// 使用统一的插件框架 composable
const {
  isWujie,
  wujieUrl,
  wujieName,
  uiKey,
  wujieProps,
  wujiePlugins,
  onLoadError
} = usePluginFrame({
  mode: 'ui',
  routeParamName: 'plugname'
});

onMounted(() => {
  try { console.log('[PluginFramePage] mounted'); } catch { }
});

onUnmounted(() => {
  if (busHandlers.onReady) {
    bus?.$off?.('plugin-ready', busHandlers.onReady);
    bus?.$off?.('ui-ready', busHandlers.onReady);
  }
});

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
  overflow: hidden;
  /* overflow: scroll; */
}


/* Wujie 容器占满区域 */
:deep(.wujie_iframe) {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
