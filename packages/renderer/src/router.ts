import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    component: () => import('./pages/HomePage.vue'),
    meta: { title: '首页' }
  },

  // 直播功能路由
  {
    path: '/live',
    redirect: '/live/room'
  },
  {
    path: '/live/room',
    name: 'LiveRoom',
    component: () => import('./pages/LiveRoomPage.vue'),
    meta: { title: '房间管理' }
  },
  {
    path: '/live/manage/:roomId',
    name: 'LiveManage',
    component: () => import('./pages/LiveManagePage.vue'),
    meta: { title: '直播管理' }
  },
  {
    path: '/live/manage',
    component: () => import('./pages/LiveManagePage.vue'),
    meta: { title: '直播管理' }
  },
  {
    path: '/live/danmu/:roomId?',
    name: 'LiveDanmu',
    component: () => import('./pages/LiveDanmuPage.vue'),
    meta: { title: '弹幕管理' }
  },
  {
    path: '/live/create',
    component: () => import('./pages/LiveCreatePage.vue'),
    meta: { title: '创建直播' }
  },
  // 插件管理路由
  {
    path: '/plugins',
    redirect: '/plugins/management'
  },
  {
    path: '/plugins/management',
    component: () => import('./pages/PluginManagementPage.vue'),
    meta: { title: '插件管理', keepAlive: false }
  },
  {
    path: '/plugins/:plugname',
    component: () => import('./pages/PluginFramePage.vue'),
    meta: { title: '插件', keepAlive: false }
  },
  // 系统功能路由
  {
    path: '/system',
    redirect: '/system/settings'
  },
  {
    path: '/system/settings',
    component: () => import('./pages/Settings.vue'),
    meta: { title: '系统设置' }
  },
  {
    path: '/system/console',
    component: () => import('./pages/Console.vue'),
    meta: { title: '控制台' }
  },
  {
    path: '/system/develop',
    component: () => import('./pages/ApiDocs.vue'),
    meta: { title: '开发文档' }
  },
  // 其他页面
  {
    path: '/events',
    component: () => import('./pages/EventsHistory.vue'),
    meta: { title: '事件历史' }
  },
  {
    path: '/stats',
    component: () => import('./pages/Stats.vue'),
    meta: { title: '统计' }
  },
  {
    path: '/plugins/:plugname/window',
    component: () => import('./pages/WindowFramePluginPage.vue'),
    meta: { title: '插件窗口', keepAlive: false, layout: 'window' }
  },
  {
    path: '/plugins/:pluginId/overlay',
    name: 'PluginOverlay',
    component: () => import('./pages/OverlayFramePluginPage.vue'),
    meta: { title: '插件 Overlay', keepAlive: false, layout: 'window' }
  },
  {
    path: '/error',
    component: () => import('./pages/ErrorPage.vue'),
    meta: { title: '错误' }
  },
  {
    path: '/404',
    component: () => import('./pages/NotFoundPage.vue'),
    meta: { title: '未找到' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;

// 动态插件路由管理（供插件商店与侧边栏使用）
import type { RouteRecordRaw } from 'vue-router'
const dynamicPluginRoutes = new Map<string, RouteRecordRaw>()

export function registerPluginRoute(pluginId: string, route: RouteRecordRaw) {
  dynamicPluginRoutes.set(pluginId, route)
  router.addRoute('Plugins', route)
}

export function unregisterPluginRoute(pluginId: string) {
  const route = dynamicPluginRoutes.get(pluginId)
  if (route && route.name) {
    router.removeRoute(route.name as string)
    dynamicPluginRoutes.delete(pluginId)
  }
}

export function getRegisteredPluginRoutes() {
  return Array.from(dynamicPluginRoutes.values())
}
