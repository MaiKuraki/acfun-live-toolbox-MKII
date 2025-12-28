<template>
  <div class="overlay-frame-plugin-page">
    <div class="content">
      <WujieVue
        v-if="isWujie"
        :key="uiKey"
        :name="wujieName"
        :url="wujieUrl"
        :props="wujieProps"
        :plugins="wujiePlugins"
        :sync="false"
        :alive="false"
        :width="'100%'"
        :height="'100%'"
        @loadError="onLoadError"
      />
      <div v-else class="empty">未配置 Overlay 页面（manifest.overlay 缺失）。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import WujieVue from 'wujie-vue3'
import { buildPluginPageUrlWithDev } from '../utils/plugin-injection'
import { setReadonlyIsMain } from '../utils/readonlyReporter'
import { usePluginFrame } from '../composables/usePluginFrame'

setReadonlyIsMain(false)

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
  mode: 'overlay',
  routeParamName: 'pluginId',
  buildUrl: buildPluginPageUrlWithDev
})
</script>

<style scoped>
.overlay-frame-plugin-page { width: 100%; height: 100%; display: flex; flex-direction: column }
.content { flex: 1; width: 100%; overflow: hidden }
.empty { padding: 16px; color: var(--td-text-color-secondary) }
:deep(.wujie-container) { width: 100%; height: 100%; overflow: auto }
</style>
