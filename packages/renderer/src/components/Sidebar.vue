<template>
  <div class="sidebar">
    <!-- 主导航菜单 -->
    <div class="main-nav">
      <t-menu 
        v-model="activeMenu"
        :collapsed="false"
        :default-expanded="['live','plugins','system']"
        theme="light"
        width="100%"
        @change="handleMenuChange"
      >
        <!-- 首页 -->
        <t-menu-item
          value="home"
          @click="navigateTo('/home')"
        >
          <template #icon>
            <t-icon name="home" />
          </template>
          首页
        </t-menu-item>
        
        <!-- 直播功能 -->
        <t-submenu
          value="live"
          title="直播"
        >
          <template #icon>
            <t-icon name="video" />
          </template>
          <t-menu-item
            value="live-room"
            @click="navigateTo('/live/room')"
          >
            <template #icon>
              <t-icon name="desktop" />
            </template>
            房间管理
          </t-menu-item>
          <t-menu-item
            value="live-danmu"
            @click="navigateTo('/live/danmu')"
          >
            <template #icon>
              <t-icon name="chat" />
            </template>
            弹幕管理
          </t-menu-item>
          <t-menu-item
            v-if="!isMyLiveActive"
            value="live-create"
            @click="navigateToLiveCreate()"
          >
            <template #icon>
              <t-icon name="edit-1" />
            </template>
            创建直播
          </t-menu-item>
          <t-menu-item
            v-if="isMyLiveActive"
            value="live-manage"
            @click="navigateToMyLiveRoom()"
          >
            <template #icon>
              <t-icon name="video" />
            </template>
            我的直播间
          </t-menu-item>
        </t-submenu>
        
        <!-- 插件管理 -->
        <t-submenu
          value="plugins"
          title="插件"
        >
          <template #icon>
            <t-icon name="app" />
          </template>
          <t-menu-item
            value="plugin-management"
            @click="navigateTo('/plugins/management')"
          >
            <template #icon>
              <t-icon name="setting" />
            </template>
            插件管理
          </t-menu-item>

          <!-- 将动态插件纳入“插件管理/插件名”分类 -->
          <t-menu-item
            v-for="plugin in dynamicPlugins"
            :key="plugin.id"
            :value="`plugin-${plugin.id}`"
            @click="openPlugin(plugin)"
            :class="{ disabled: plugin.status !== 'active' || !plugin.enabled }"
            :disabled="plugin.status !== 'active' || !plugin.enabled"
          >
            <template #icon>
              <img
                v-if="plugin.icon"
                :src="plugin.icon"
                class="plugin-avatar"
                @error="handleIconError(plugin)"
              />
              <t-icon
                v-else
                name="app"
                class="plugin-default-icon"
              />
            </template>
            {{ plugin.name }}
          </t-menu-item>
        </t-submenu>
        
        <!-- 系统功能 -->
        <t-submenu
          value="system"
          title="系统"
        >
          <template #icon>
            <t-icon name="tools" />
          </template>
          <t-menu-item
            value="system-settings"
            @click="navigateTo('/system/settings')"
          >
            <template #icon>
              <t-icon name="setting-1" />
            </template>
            系统设置
          </t-menu-item>
          <t-menu-item
            value="system-console"
            @click="navigateTo('/system/console')"
          >
            <template #icon>
              <t-icon name="code" />
            </template>
            控制台
          </t-menu-item>
          <t-menu-item
            value="system-develop"
            @click="showDevelopmentPopup"
          >
            <template #icon>
              <t-icon name="bug" />
            </template>
            开发文档
          </t-menu-item>
        </t-submenu>
      </t-menu>
    </div>
    
    
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { resolvePrimaryHostingType } from '../utils/hosting';
import { usePluginStore } from '../stores/plugin';
import { useSidebarStore } from '../stores/sidebar';
import { reportReadonlyUpdate } from '../utils/readonlyReporter'
import { getApiBase } from '../utils/hosting'
import { useAccountStore } from '../stores/account'
import { useRoomStore } from '../stores/room'
import { GlobalPopup } from '../services/globalPopup';

interface DynamicPlugin {
  id: string;
  name: string;
  version: string;
  icon?: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  enabled?: boolean;
  route?: string;
  sidebarDisplay?: {
    show: boolean;
    order?: number;
    group?: string;
  };
}

const router = useRouter();
const route = useRoute();
const pluginStore = usePluginStore();
const sidebarStore = useSidebarStore();
const account = useAccountStore();
const roomStore = useRoomStore();

const activeMenu = ref('home');
const activePlugin = ref<string | null>(null);
const collapsed = computed(() => sidebarStore.collapsed);

// 获取需要在侧边栏显示的动态插件
const dynamicPlugins = computed<DynamicPlugin[]>(() => {
  return pluginStore.plugins
    .filter(plugin => plugin.sidebarDisplay?.show)
    .sort((a, b) => (a.sidebarDisplay?.order || 999) - (b.sidebarDisplay?.order || 999));
});

const isMyLiveActive = computed(() => {
  const uid = account.userInfo?.userID;
  if (!uid) return false;
  return roomStore.rooms.some(r => Boolean(r.isLive) && Number(r.streamer?.userId) === Number(uid));
});

const myLiveId = computed(() => {
  const uid = account.userInfo?.userID;
  const room = roomStore.rooms.find(r => Boolean(r.isLive) && Number(r.streamer?.userId) === Number(uid));
  return room?.liveId;
});

// 监听路由变化，更新活跃菜单项
watch(() => route.path, (newPath) => {
  updateActiveMenu(newPath);
}, { immediate: true });

function updateActiveMenu(path: string) {
  if (path.startsWith('/home')) {
    activeMenu.value = 'home';
    activePlugin.value = null;
  } else if (path.startsWith('/live/room')) {
    activeMenu.value = 'live-room';
    activePlugin.value = null;
  } else if (path.startsWith('/live/danmu')) {
    activeMenu.value = 'live-danmu';
    activePlugin.value = null;
  } else if (path.startsWith('/live/create')) {
    activeMenu.value = 'live-create';
    activePlugin.value = null;
  } else if (path.startsWith('/plugins/management')) {
    activeMenu.value = 'plugin-management';
    activePlugin.value = null;
  } else if (path.startsWith('/system/settings')) {
    activeMenu.value = 'system-settings';
    activePlugin.value = null;
  } else if (path.startsWith('/system/console')) {
    activeMenu.value = 'system-console';
    activePlugin.value = null;
  } else if (path.startsWith('/system/develop')) {
    activeMenu.value = 'system-develop';
    activePlugin.value = null;
  } else if (path.startsWith('/plugins/') && !path.startsWith('/plugins/management')) {
    // 动态插件路由（router.ts 使用 /plugins/:plugname）
    // 从路径中提取插件ID（第一个路径段）
    const pathParts = path.split('/').filter(p => p);
    const pluginsIndex = pathParts.indexOf('plugins');
    if (pluginsIndex !== -1 && pluginsIndex + 1 < pathParts.length) {
      const pluginId = pathParts[pluginsIndex + 1];
      activeMenu.value = `plugin-${pluginId}`;
      activePlugin.value = pluginId;
    } else {
      activeMenu.value = '';
      activePlugin.value = null;
    }
  } else {
    activeMenu.value = '';
    activePlugin.value = null;
  }
}

function handleMenuChange(value: string) {
  console.log('Menu changed:', value);
}

async function navigateTo(path: string) {
  try {
    await router.push(path);
  } catch {}
  try {
    const rt = router.currentRoute.value as any;
    const routePath = String(rt?.fullPath || path);
    const pageName = String(rt?.name || '');
    const pageTitle = String((rt?.meta as any)?.title || '');
    reportReadonlyUpdate({ ui: { routePath, pageName, pageTitle } });
  } catch {}
}

function showDevelopmentPopup() {
  GlobalPopup.alert('开发中，敬请期待');
}

async function navigateToLiveCreate() {
  try {
    const base = getApiBase();
    const r = await fetch(new URL('/api/acfun/auth/status', base).toString(), { method: 'GET' });
    const res = await r.json();
    const ok = !!(res && res.success);
    const authed = ok && !!(res.data && res.data.authenticated);
    if (!authed) {
      try {
        const resp: any = await window.electronApi?.popup.confirm('提示', '要直播请先登录', { confirmBtn: '去登录', cancelBtn: '关闭' });
        const go = resp?.result === true || resp === true;
        if (go) {
          try { await router.push({ path: '/home', query: { qrLogin: '1', t: Date.now() } }); } catch {}
        }
      } catch {}
      return;
    }
  } catch {}
  try { await router.push('/live/create'); } catch {}
  try {
    const rt = router.currentRoute.value as any;
    const routePath = String(rt?.fullPath || '/live/create');
    const pageName = String(rt?.name || '');
    const pageTitle = String((rt?.meta as any)?.title || '');
    reportReadonlyUpdate({ ui: { routePath, pageName, pageTitle } });
  } catch {}
}

async function navigateToMyLiveRoom() {
  const uid = String(account.userInfo?.userID || '');
  if (!uid) return;
  try { await router.push({ name: 'LiveManage', params: { roomId: uid } }); } catch {}
  try {
    const rt = router.currentRoute.value as any;
    const routePath = String(rt?.fullPath || (`/live/manage/${uid}`));
    const pageName = String(rt?.name || '');
    const pageTitle = String((rt?.meta as any)?.title || '');
    reportReadonlyUpdate({ ui: { routePath, pageName, pageTitle } });
  } catch {}
}

async function openPlugin(plugin: DynamicPlugin) {
  if (plugin.status !== 'active' || !plugin.enabled) return;

  console.log('[Sidebar] openPlugin called for:', plugin.id, plugin.name);

  // 若存在自定义路由，优先使用
  if (plugin.route) {
    console.log('[Sidebar] Using custom route:', plugin.route);
    try { await router.push(plugin.route); } catch {}
    try {
      const rt = router.currentRoute.value as any;
      const routePath = String(rt?.fullPath || plugin.route || '');
      const pageName = String(rt?.name || '');
      const pageTitle = String((rt?.meta as any)?.title || '');
      reportReadonlyUpdate({ ui: { routePath, pageName, pageTitle } });
    } catch {}
    return;
  }

  try {
    console.log('[Sidebar] Resolving primary hosting type for:', plugin.id);
    const primary = await resolvePrimaryHostingType(plugin.id);
    console.log('[Sidebar] Primary hosting type resolved:', primary);

    if (primary.type === 'ui') {
      console.log('[Sidebar] Navigating to UI plugin route:', `/plugins/${plugin.id}`);
      // 直接进入 UI 页框架路由（router.ts: /plugins/:plugname）
      try { await router.push(`/plugins/${plugin.id}`); } catch {}
      try {
        const rt = router.currentRoute.value as any;
        const routePath = String(rt?.fullPath || `/plugins/${plugin.id}`);
        const pageName = String(rt?.name || '');
        const pageTitle = String((rt?.meta as any)?.title || '');
        reportReadonlyUpdate({ ui: { routePath, pageName, pageTitle } });
      } catch {}
      return;
    }
    if (primary.type === 'window') {
      console.log('[Sidebar] Opening plugin window for:', plugin.id);
      // 打开插件独立窗口（单实例），无需切换主窗口路由
      await window.electronApi?.plugin.window.open(plugin.id);
      return;
    }
  } catch (err) {
    console.warn('[sidebar] 解析插件托管类型失败，回退至框架路由:', err);
  }

  // 默认回退：进入框架路由（router.ts: /plugins/:plugname）
  console.log('[Sidebar] Falling back to default route for:', plugin.id);
  try { await router.push(`/plugins/${plugin.id}`); } catch {}
  try {
    const rt = router.currentRoute.value as any;
    const routePath = String(rt?.fullPath || `/plugins/${plugin.id}`);
    const pageName = String(rt?.name || '');
    const pageTitle = String((rt?.meta as any)?.title || '');
    reportReadonlyUpdate({ ui: { routePath, pageName, pageTitle } });
  } catch {}
}

function handleIconError(plugin: DynamicPlugin) {
  try {
    plugin.icon = '';
  } catch (e) {
    console.warn('[Sidebar] 图标加载失败，使用默认图标:', e);
  }
}




// 键盘快捷键支持
function handleKeyboardShortcut(event: KeyboardEvent) {
  if (event.altKey) {
    switch (event.key) {
      case '1':
        event.preventDefault();
        navigateTo('/home');
        break;
      case '2':
        event.preventDefault();
        navigateTo('/live/room');
        break;
      case '3':
        event.preventDefault();
        navigateTo('/plugins/management');
        break;
      case '4':
        event.preventDefault();
        navigateTo('/system/settings');
        break;
      case '5':
        event.preventDefault();
        navigateTo('/system/console');
        break;
    }
  }
}

onMounted(() => {
  // 注册键盘快捷键
  document.addEventListener('keydown', handleKeyboardShortcut);
  
});
</script>

<style scoped>
.sidebar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--td-bg-color-container);
  border-right: 1px solid var(--td-border-level-1-color);
}

.main-nav {
  flex: 1;
  overflow-y: auto;
}

.plugin-nav {
  padding: 8px 0;
}

.plugin-nav-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: var(--td-text-color-placeholder);
  font-size: 12px;
  font-weight: 500;
}

.plugin-icon {
  font-size: 14px;
}

.plugin-title {
  flex: 1;
}

.plugin-list {
  padding: 0 8px;
}

.plugin-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin: 2px 0;
  border-radius: var(--td-radius-default);
  cursor: pointer;
  transition: all 0.2s;
}

.plugin-item:hover {
  background-color: var(--td-bg-color-component-hover);
}

.plugin-item.active {
  background-color: var(--td-brand-color-light);
  color: var(--td-brand-color);
}

.plugin-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.plugin-avatar {
  width: 20px;
  height: 20px;
  border-radius: var(--td-radius-small);
  object-fit: cover;
  margin-right: 8px;
}

.plugin-default-icon {
  font-size: 16px;
  color: var(--td-text-color-placeholder);
}

/* 统一 TDesign 菜单图标容器的间距与对齐，使图标与文本不黏连 */
:deep(.t-menu__item .t-menu__icon) {
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.plugin-details {
  flex: 1;
  min-width: 0;
}

.plugin-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--td-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-version {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
  margin-top: 1px;
}

.plugin-status {
  margin-left: 8px;
}



/* 折叠状态样式调整 */
:deep(.t-menu--collapsed) {
  .plugin-nav-header {
    justify-content: center;
    padding: 8px;
  }
  
  .plugin-title {
    display: none;
  }
  
  .plugin-details {
    display: none;
  }
  
  .plugin-item {
    justify-content: center;
    padding: 8px;
  }
  
  .plugin-status {
    display: none;
  }
}

/* 自定义滚动条 */
.main-nav::-webkit-scrollbar,
.plugin-list::-webkit-scrollbar {
  width: 4px;
}

.main-nav::-webkit-scrollbar-track,
.plugin-list::-webkit-scrollbar-track {
  background: transparent;
}

.main-nav::-webkit-scrollbar-thumb,
.plugin-list::-webkit-scrollbar-thumb {
  background-color: var(--td-scrollbar-color);
  border-radius: 2px;
}

.main-nav::-webkit-scrollbar-thumb:hover,
.plugin-list::-webkit-scrollbar-thumb:hover {
  background-color: var(--td-scrollbar-hover-color);
}

/* 禁用项样式（需放在 <style> 内） */
.plugin-item.disabled,
:deep(.t-menu-item.disabled) {
  opacity: 0.5;
  pointer-events: none;
}
</style>
