<template>
  <div class="layout-shell" :class="{ 'window-layout': isWindowLayout }">
    <!-- Topbar 区域 (40px 高度) -->
    <Topbar v-if="!isWindowLayout" class="layout-topbar" />
    
    <!-- 主要内容区域 -->
    <div class="layout-main" :class="{ 'no-topbar': isWindowLayout }">
      <!-- Sidebar 导航区域 (208px 宽度) -->
      <Sidebar v-if="!isWindowLayout" class="layout-sidebar" />
      
      <!-- RouterView 内容区域 (816x728px 可用空间) -->
      <div class="layout-content" :class="{ 'full': isWindowLayout }">
    <RouterView :key="$route.fullPath" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import { computed } from 'vue';
import Topbar from '../components/Topbar.vue';
import Sidebar from '../components/Sidebar.vue';

const route = useRoute();
const isWindowLayout = computed(() => (route.meta as any)?.layout === 'window');
</script>

<style scoped>
.layout-shell {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--td-bg-color-page);
  
  /* 针对1024x768分辨率优化 */
  min-width: 1024px;
  min-height: 768px;
}

.layout-shell.window-layout {
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.layout-topbar {
  width: 100%;
  height: 40px;
  flex-shrink: 0;
  z-index: 1000;
}

.layout-main {
  flex: 1;
  display: flex;
  height: calc(100vh - 40px); /* 减去topbar高度 */
  overflow: hidden;
}

.layout-main.no-topbar {
  height: 100vh;
}

.layout-sidebar {
  width: 208px;
  height: 100%;
  flex-shrink: 0;
  border-right: 1px solid var(--td-border-level-1-color);
  background-color: var(--td-bg-color-container);
}

.layout-content {
  flex: 1;
  width: calc(100% - 208px); /* 减去sidebar宽度 */
  height: 100%;
  overflow: auto;
  background-color: var(--td-bg-color-page);
  
  /* 在1024x768下，内容区域为816x728px */
  max-width: 816px;
}

.layout-content.full {
  width: 100%;
  max-width: none;
}

/* 1024x768分辨率专用样式 */
@media (width: 1024px) and (height: 768px) {
  .layout-shell {
    width: 1024px;
    height: 768px;
  }
  
  .layout-content {
    width: 816px;
    height: 728px;
  }
}

/* 滚动条优化 */
.layout-content::-webkit-scrollbar {
  width: 6px;
}

.layout-content::-webkit-scrollbar-track {
  background: var(--td-bg-color-component);
}

.layout-content::-webkit-scrollbar-thumb {
  background: var(--td-bg-color-component-hover);
  border-radius: 3px;
}

.layout-content::-webkit-scrollbar-thumb:hover {
  background: var(--td-bg-color-component-active);
}
</style>
