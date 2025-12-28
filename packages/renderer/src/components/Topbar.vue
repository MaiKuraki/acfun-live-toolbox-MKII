<template>
  <div class="topbar">
    <!-- 左侧：应用标题和拖拽区域 -->
    <div
      class="topbar-left"
      data-tauri-drag-region
    >
      <div class="app-title">
        <t-icon
          name="logo-github"
          class="app-icon"
        />
        <span class="title-text">ACLiveFrame</span>
      </div>
    </div>
     <!-- 房间状态指示器 -->
      <div
        class="room-status"
        @click="toggleRoomDrawer"
      >
        <t-badge 
          :count="liveRoomCount" 
          :max-count="99"
          :dot="liveRoomCount === 0"
          :color="liveRoomCount > 0 ? 'success' : 'default'"
        >
          <t-icon
            name="video"
            class="room-icon"
          />
        </t-badge>
        <span class="room-text">{{ roomStatusText }}</span>
      </div>
    <!-- 账户区域和房间状态 -->
    <div class="topbar-center">
      <!-- 账户弹出卡片 -->
        <t-popup
          v-model:visible="showAccountCard"
          placement="bottom-left"
          :attach="getAttachElement"
          trigger="click"
        >
          <!-- 触发元素 -->
          <div
            ref="accountArea"
            class="account-area"
          >
            <t-avatar
              :image="userInfo?.avatar"
              size="small"
            />
            <span class="username">{{ userInfo?.nickname || '游客' }}</span>
            <t-icon
              name="chevron-down"
              class="dropdown-icon"
            />
          </div>
          
          <!-- 弹出内容使用 #content 插槽 -->
          <template #content>
            <div class="account-card">
              <div class="account-info">
                <t-avatar
                  :image="userInfo?.avatar"
                  size="medium"
                />
                <div class="user-details">
                  <div class="user-name">
                    {{ userInfo?.nickname || '游客' }}
                  </div>
                  <div class="user-id">
                    ID: {{ userInfo?.userID || 'N/A' }}
                  </div>
                </div>
              </div>
               <div  v-if="userInfo?.userID" class="account-actions links-actions">
                <t-button
                  variant="outline"
                  size="small"
                  theme="primary"
                  @click="openCreatorCenter"
                >
                  创作者中心
                </t-button>
                <t-button
                  variant="outline"
                  size="small"
                  theme="success"
                  @click="openFeeds"
                >
                  关注动态
                </t-button>
              </div>
              <t-divider style="margin: 8px 0;" />
              <div class="account-actions">
                <t-button
                  v-if="!userInfo?.userID"
                  variant="outline"
                  size="small"
                  @click="login"
                >
                  扫码登录
                </t-button>
                <t-button
                  v-else
                  variant="outline"
                  size="small"
                  @click="logout"
                >
                  退出登录
                </t-button>
              </div>
             
            </div>
          </template>
        </t-popup>
      
     
    </div>
    
    <!-- 右侧：窗口控制按钮 -->
    <div class="topbar-right">
      <t-button 
        variant="text" 
        size="small" 
        class="window-btn minimize-btn"
        @click="minimizeWindow"
      >
        <t-icon name="minus" />
      </t-button>
      <t-button 
        variant="text" 
        size="small" 
        class="window-btn close-btn"
        @click="closeWindow"
      >
        <t-icon name="close" />
      </t-button>
    </div>
    
    <!-- 房间状态抽屉 -->
    <t-drawer
      v-model:visible="showRoomDrawer"
      :footer="false"
      :closeOnOverlayClick="true"
      title="房间状态"
      placement="right"
      size="300px"
    >
      <div class="room-list">
        <div
          v-if="rooms.length === 0"
          class="empty-rooms"
        >
          <t-icon
            name="video-off"
            size="48px"
          />
          <p>暂无监控房间</p>
        </div>
        <div v-else>
          <div 
            v-for="room in rooms" 
            :key="room.id"
            class="room-item"
            :class="{ 'live': room.isLive }"
          >
            <div class="room-info">
              <div class="room-name">
                {{ (room.title && room.title.trim()) || (room.streamer?.userName ? `${room.streamer.userName}的直播间` : (room.id ? `直播间 ${room.id}` : '直播间')) }}
              </div>
              <div class="room-anchor">
                {{ room.streamer?.userName || room.uperName || '未知主播' }}
              </div>
              <div class="room-stats">
                <t-tag 
                  :theme="room.isLive ? 'success' : 'default'"
                  size="small"
                >
                  {{ room.isLive ? '直播中' : '未开播' }}
                </t-tag>
                <span
                  v-if="room.isLive"
                  class="viewer-count"
                >
                  {{ formatViewerCount(room.viewerCount) }}人观看
                </span>
              </div>
            </div>
            <t-button
                v-if="room.isLive"
              size="small"
              variant="text"
              shape="square"
              @click="enterLiveRoom(room)"
            >
              <t-icon name="jump" />
            </t-button>
            <t-button
              v-if="room.isLive"
              size="small"
              variant="text"
              shape="square"
              @click="openLivePage(room)"
            >
              <t-icon name="link" />
            </t-button>
          </div>
        </div>
      </div>
    </t-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAccountStore } from '../stores/account';
import { useRoomStore } from '../stores/room';
import type { Room } from '../stores/room';
import { GlobalPopup } from '../services/globalPopup';

const accountStore = useAccountStore();
const roomStore = useRoomStore();
const router = useRouter();

const showAccountCard = ref(false);
const showRoomDrawer = ref(false);
// 明确初始为 null，保证 `getAttachElement` 返回类型稳定
const accountArea = ref<HTMLElement | null>(null);

const userInfo = computed(() => accountStore.userInfo);
const rooms = computed<Room[]>(() => roomStore.rooms);
const liveRoomCount = computed(() => rooms.value.filter(room => room.isLive).length);
const roomStatusText = computed(() => {
  if (rooms.value.length === 0) return '无房间';
  if (liveRoomCount.value === 0) return '全部离线';
  return `${liveRoomCount.value}个用户正在直播`;
});


function toggleRoomDrawer() {
  if (rooms.value.length === 0) {
    showRoomDrawer.value = false;
    GlobalPopup.toast('请开启直播或到“房间管理”添加房间');
    return;
  }
  showRoomDrawer.value = !showRoomDrawer.value;
}

function minimizeWindow() {
  if (window.electronApi) {
    window.electronApi?.window.minimizeWindow();
  }
}

function closeWindow() {
  if (window.electronApi) {
    window.electronApi?.window.closeWindow();
  }
}

function login() {
  showAccountCard.value = false;
  try {
    router.push({ path: '/home', query: { qrLogin: '1' } });
  } catch (err) {
    try {
      window.location.hash = '#/home?qrLogin=1';
    } catch {}
    console.error('[Topbar] 导航到首页并触发扫码登录失败:', err);
  }
}

function logout() {
  accountStore.logout();
  showAccountCard.value = false;
}

function formatViewerCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`;
  }
  return count.toString();
}

async function enterLiveRoom(room: Room) {
  try {
    const st = await window.electronApi?.room?.status?.(room.id);
    let s = '';
    if (st && 'status' in st && typeof (st as any).status === 'string') s = String((st as any).status).toLowerCase();
    if (s === 'connected' || s === 'open') {
      router.push({ name: 'LiveManage', params: { roomId: room.id } });
      showRoomDrawer.value = false;
      return;
    }
    if (room.isLive) {
      try {
        const resp: any = await window.electronApi?.popup?.confirm?.(
          '提示',
          '开启弹幕采集才能进入直播间查看弹幕及统计数据，需要现在开启吗？',
          { confirmBtn: { content: '开启', theme: 'primary' }, cancelBtn: { content: '取消' }, contextId: 'topbar-enter-connect' }
        );
        const ok = resp?.result === true || resp === true;
        if (ok) {
          await window.electronApi?.room?.connect?.(room.id);
          let connected = false;
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 500));
            const st2 = await window.electronApi?.room?.status?.(room.id);
            let s2 = '';
            if (st2 && 'status' in st2 && typeof (st2 as any).status === 'string') s2 = String((st2 as any).status).toLowerCase();
            if (s2 === 'connected' || s2 === 'open') { connected = true; break; }
          }
          showRoomDrawer.value = false;
          if (connected) {
            router.push({ name: 'LiveManage', params: { roomId: room.id } });
          } else {
            try { GlobalPopup.toast('连接失败，请稍后重试'); } catch {}
          }
          return;
        }
      } catch {}
    }
    router.push({ name: 'LiveManage', params: { roomId: room.id } });
    showRoomDrawer.value = false;
  } catch (err) {
    try {
      router.push({ name: 'LiveManage', params: { roomId: room.id } });
      showRoomDrawer.value = false;
    } catch {}
  }
}

function openLivePage(room: Room) {
  const url = `https://live.acfun.cn/live/${room.id}`;
  try {
    if (window.electronApi?.system?.openExternal) {
      window.electronApi?.system.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  } catch {
    window.open(url, '_blank');
  }
}

function getAttachElement(): HTMLElement | null {
  return accountArea.value || null;
}

 

onMounted(() => {
  // 初始化用户信息和房间状态
  roomStore.loadRooms();
});

async function openCreatorCenter() {
  const url = 'https://member.acfun.cn/live-data-center';
  try {
    if (window.electronApi?.system?.openExternal) {
      const res = await window.electronApi?.system.openExternal(url);
      if (!res?.success) {
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  } catch {
    window.open(url, '_blank');
  }
}

async function openFeeds() {
  const url = 'https://www.acfun.cn/member/feeds';
  try {
    if (window.electronApi?.system?.openExternal) {
      const res = await window.electronApi?.system.openExternal(url);
      if (!res?.success) {
        window.open(url, '_blank');
      }
    } else {
      window.open(url, '_blank');
    }
  } catch {
    window.open(url, '_blank');
  }
}
</script>

<style scoped>
.topbar {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  background-color: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-border-level-1-color);
  padding: 0 12px;
  user-select: none;
  -webkit-app-region: drag; /* 启用拖拽 */
}

.topbar-left {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-icon {
  font-size: 16px;
  color: var(--td-brand-color);
  line-height: 1;
  vertical-align: middle;
}

.title-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.topbar-center {
  display: flex;
  align-items: center;
  gap: 16px;
}

.account-area {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: var(--td-radius-default);
  cursor: pointer;
  transition: background-color 0.2s;
  -webkit-app-region: no-drag; /* 禁用拖拽，允许点击 */
}

.account-area:hover {
  background-color: var(--td-bg-color-component-hover);
}

.username {
  font-size: 12px;
  color: var(--td-text-color-primary);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  line-height: 1;
  vertical-align: middle;
}

.room-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: var(--td-radius-default);
  cursor: pointer;
  transition: background-color 0.2s;
  -webkit-app-region: no-drag; /* 禁用拖拽，允许点击 */
}

.room-icon {
  line-height: 1;
  vertical-align: middle;
}

.room-status:hover {
  background-color: var(--td-bg-color-component-hover);
}

.room-text {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.window-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: var(--td-radius-default);
  -webkit-app-region: no-drag; /* 禁用拖拽，允许点击 */
}

.close-btn:hover {
  background-color: var(--td-error-color);
  color: white;
}

/* 账户卡片样式 */
.account-card {
  width: 200px;
  padding: 16px;
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-large);
  box-shadow: var(--td-shadow-3);
}

.account-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-id {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  margin-top: 2px;
}

.account-actions {
  display: flex;
  justify-content: center;
}

.links-actions {
  gap: 8px;
  margin-top: 8px;
}

/* 房间列表样式 */
.room-list {
  height: 100%;
}

.empty-rooms {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--td-text-color-placeholder);
}

.room-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--td-border-level-1-color);
  transition: background-color 0.2s;
}

.room-item:hover {
  background-color: var(--td-bg-color-component-hover);
}

.room-item.live {
  border-left: 3px solid var(--td-success-color);
}

.room-info {
  flex: 1;
  min-width: 0;
}

.room-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-anchor {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.viewer-count {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}
</style>
