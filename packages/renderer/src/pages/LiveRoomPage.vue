<template>
  <div class="live-room-page">
    <div class="page-header">
      <h2>直播房间管理</h2>
      <div class="header-actions">
        <t-button
          class="room-action-btn"
          theme="primary"
          @click="showAddDialog = true"
        >
          <template #icon>
            <t-icon name="add" />
          </template>
          添加房间
        </t-button>
        <t-button
          class="room-action-btn"
          variant="outline"
          @click="refreshRooms"
        >
          <template #icon>
            <t-icon name="refresh" />
          </template>
          刷新
        </t-button>
      </div>
    </div>

    <!-- 房间统计 -->
    <div class="room-stats">
      <t-card
        class="stat-card"
        hover-shadow
      >
        <div class="stat-content">
          <div class="stat-number">
            {{ roomStore.rooms.length }}
          </div>
          <div class="stat-label">
            总房间数
          </div>
        </div>
      </t-card>
      <t-card
        class="stat-card"
        hover-shadow
      >
        <div class="stat-content">
          <div class="stat-number">
            {{ roomStore.liveRooms.length }}
          </div>
          <div class="stat-label">
            在线房间
          </div>
        </div>
      </t-card>
      <t-card
        class="stat-card"
        hover-shadow
      >
        <div class="stat-content">
          <div class="stat-number">
            {{ roomStore.totalViewers.toLocaleString() }}
          </div>
          <div class="stat-label">
            总观众数
          </div>
        </div>
      </t-card>
      <t-card
        class="stat-card"
        hover-shadow
      >
        <div class="stat-content">
          <div class="stat-number">
            {{ roomStore.offlineRooms.length }}
          </div>
          <div class="stat-label">
            离线房间
          </div>
        </div>
      </t-card>
    </div>

    <!-- 房间列表 -->
    <t-card
      class="room-list-card"
      title="房间列表"
      hover-shadow
    >
      <template #actions>
        <t-input 
          v-model="searchKeyword" 
          placeholder="搜索房间..." 
          clearable
          style="width: 200px;"
        >
          <template #prefix-icon>
            <t-icon name="search" />
          </template>
        </t-input>
      </template>

      <div
        v-if="roomStore.isLoading"
        class="loading-state"
      >
        <t-loading />
        <span>加载房间列表中...</span>
      </div>

      <div
        v-else-if="filteredRooms.length === 0"
        class="empty-state"
      >
        <t-icon
          name="home"
          size="48px"
        />
        <p>{{ searchKeyword ? '未找到匹配的房间' : '暂无房间连接' }}</p>
        <t-button
          v-if="!searchKeyword"
          theme="primary"
          @click="showAddDialog = true"
        >
          添加第一个房间
        </t-button>
      </div>

      <div
        v-else
        class="room-list"
      >
        <div 
          v-for="room in filteredRooms" 
          :key="room.liveId"
          class="room-item"
          :class="{ 
            online: room.status === 'connected',
            offline: room.status === 'disconnected',
            preparing: room.status === 'connecting'
          }"
        >
          <div class="room-cover">
            <img
              :src="room.coverUrl || '/default-cover.png'"
              :alt="room.title || room.streamer?.userName"
              loading="lazy"
              @error="onCoverError"
            >
            <div
              class="status-indicator"
              :class="room.status"
            />
          </div>
          
          <div class="room-info">
            <div class="room-title">
              {{ room.title || '未知标题' }}
            </div>
            <div class="room-streamer">
              {{ room.streamer?.userName || '未知主播' }}（UID: {{ room.liveId }}）
            </div>
            <div class="room-stats">
              <span class="viewer-count">
                <t-icon name="user" />
                {{ room.onlineCount?.toLocaleString() || 0 }}
              </span>
              <span
                v-if="room.likeCount"
                class="like-count"
              >
                <t-icon name="thumb-up" />
                {{ room.likeCount.toLocaleString() }}
              </span>
              <span
                class="status-text"
                :class="room.status"
              >
                {{ getStatusText(room.status) }}
              </span>
              <span v-if="room.status === 'connected'" class="barrage-text">弹幕获取中</span>
            </div>
          </div>
          
          <div class="room-actions">
            <t-button 
              v-if="room.status !== 'disconnected'"
              size="small" 
              :theme="room.status === 'connected' ? 'danger' : 'primary'"
              @click="toggleConnection(room)"
            >
              {{ room.status === 'connected' ? '断开采集' : '连接采集' }}
            </t-button>
            <t-button
              size="small"
              variant="outline"
              @click="router.push(`/live/danmu/${room.liveId}`)"
            >
              查看弹幕
            </t-button>
            <t-button
              v-if="room.status !== 'disconnected'"
              size="small"
              variant="outline"
              @click="openLivePage(room)"
            >
              进入直播间
            </t-button>
            <t-dropdown :options="getRoomMenuOptions(room)">
              <t-button
                size="small"
                variant="text"
              >
                <t-icon name="more" />
              </t-button>
            </t-dropdown>
          </div>
        </div>
      </div>
    </t-card>

    <!-- 添加房间对话框 -->
    <t-dialog 
      v-model:visible="showAddDialog" 
      title="添加房间" 
      width="500px"
      @confirm="addRoom"
      @cancel="resetAddForm"
    >
      <t-form
        ref="addFormRef"
        :data="addForm"
        :rules="addFormRules"
        layout="vertical"
      >
        <t-form-item
          label="房间ID"
          name="roomId"
        >
          <t-select
            v-model="addForm.roomId"
            :options="hotOptions"
            filterable
            clearable
            :loading="hotLoading"
            placeholder="输入房间ID，或下拉选择热门直播"
            @popup-visible-change="onSelectPopupVisible"
            @focus="onSelectFocus"
          />
          <template #help>
            <span>可以输入完整的直播间链接或房间ID</span>
          </template>
        </t-form-item>
        
        <t-form-item
          label="自动连接"
          name="autoConnect"
        >
          <t-switch v-model="addForm.autoConnect" />
          <template #help>
            <span>启动时自动连接此房间</span>
          </template>
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 房间详情对话框 -->
    <t-dialog 
      v-model:visible="showDetailsDialog" 
      :title="`房间详情 - ${selectedRoom?.title || '未知'}`"
      width="600px"
    >
      <div
        v-if="selectedRoom"
        class="room-details"
      >
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">房间ID:</span>
              <span class="value">{{ selectedRoom.liveId }}</span>
            </div>
            <div class="detail-item">
              <span class="label">主播:</span>
              <span class="value">{{ selectedRoom.streamer?.userName }}</span>
            </div>
            <div class="detail-item">
              <span class="label">标题:</span>
              <span class="value">{{ selectedRoom.title }}</span>
            </div>
            <div class="detail-item">
              <span class="label">状态:</span>
              <span
                class="value"
                :class="selectedRoom.status"
              >
                {{ getStatusText(selectedRoom.status) }}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>统计信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">观众数:</span>
              <span class="value">{{ selectedRoom.onlineCount?.toLocaleString() || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="label">点赞数:</span>
              <span class="value">{{ selectedRoom.likeCount?.toLocaleString() || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="label">连接时间:</span>
              <span class="value">{{ formatConnectTime((selectedRoom as any)?.connectedAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">最后活动:</span>
              <span class="value">{{ formatLastActivity((selectedRoom as any)?.lastEventAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRoomStore, type Room } from '../stores/room';
import { useConsoleStore } from '../stores/console';

const router = useRouter();
const roomStore = useRoomStore();
const consoleStore = useConsoleStore();

// 响应式状态
const searchKeyword = ref('');
const showAddDialog = ref(false);
const showDetailsDialog = ref(false);
const selectedRoomId = ref<string | null>(null);
const selectedRoom = computed<Room | null>(() => {
  if (!selectedRoomId.value) return null;
  return roomStore.getRoomById(selectedRoomId.value) || null;
});

// 添加房间表单
const addForm = ref({
  roomId: '',
  autoConnect: false
});

const addFormRef = ref();

const addFormRules = {
  roomId: [
    { required: true, message: '请输入房间ID', type: 'error' }
  ]
};

// 计算属性
const filteredRooms = computed(() => {
  if (!searchKeyword.value) return roomStore.rooms;
  
  const keyword = searchKeyword.value.toLowerCase();
  return roomStore.rooms.filter(room => 
    room.liveId.includes(keyword) ||
    room.title?.toLowerCase().includes(keyword) ||
    room.streamer?.userName?.toLowerCase().includes(keyword)
  );
});

// 方法
const refreshRooms = async () => {
  await roomStore.refreshRooms();
};



const getStatusText = (status: string) => {
  switch (status) {
    case 'connected': return '直播中';
    case 'disconnected': return '离线';
    case 'connecting': return '连接中';
    case 'error': return '错误';
    default: return '未知';
  }
};

const validateRoomId = () => {
  const roomId = addForm.value.roomId.trim();
  if (roomId.includes('live.acfun.cn/live/')) {
    // 从链接中提取房间ID
    const match = roomId.match(/live\.acfun\.cn\/live\/(\d+)/);
    if (match) {
      addForm.value.roomId = match[1];
    }
  }
  // 仅保留数字
  addForm.value.roomId = addForm.value.roomId.replace(/\D+/g, '');
};

const hotLives = ref<any[]>([]);
const hotLoading = ref(false);
const hotError = ref<string | null>(null);
const hotOptions = computed(() => {
  const list = hotLives.value || [];
  return list.map((item: any) => {
    const uid = item?.streamer?.userId ?? item?.owner?.userID ?? item?.userId;
    const title = String(item?.title || '未知标题');
    const name = String((item?.streamer && item.streamer.userName) || (item?.owner && item.owner.username) || '未知主播');
    const viewers = typeof item?.onlineCount === 'number' ? item.onlineCount : (typeof item?.viewerCount === 'number' ? item.viewerCount : 0);
    return { label: `${title} ｜ ${name} ｜ 观众 ${viewers}`, value: String(uid || '') };
  });
});
const fetchHotLives = async () => {
  try {
    hotLoading.value = true;
    hotError.value = null;
    const res = await window.electronApi.http.get('/api/acfun/live/hot-lives', { page: 0, size: 20 });
    if (res && res.success) {
      const list = Array.isArray(res?.data?.lives) ? res.data.lives : [];
      hotLives.value = Array.isArray(list) ? list : [];
    } else {
      hotError.value = String((res && res.error) || 'fetch_failed');
      hotLives.value = [];
    }
  } catch (e: any) {
    hotError.value = String(e?.message || 'network_error');
    hotLives.value = [];
  } finally {
    hotLoading.value = false;
  }
};
const onSelectPopupVisible = (visible: boolean) => {
  if (visible) fetchHotLives();
};
const onSelectFocus = () => {
  if (!hotLives.value.length) fetchHotLives();
};

const addRoom = async () => {
  const valid = await addFormRef.value?.validate();
  if (!valid) return false;

  try {
    validateRoomId();
    const inputId = addForm.value.roomId;
    const existed = roomStore.getRoomById(inputId);
    if (existed) {
      try { window.electronApi.popup.toast('房间已存在，请不要重复添加'); } catch {}
      return false;
    }
    // 构建房间URL
    const roomUrl = `https://live.acfun.cn/live/${addForm.value.roomId}`;
    await roomStore.addRoom(roomUrl);
    
    showAddDialog.value = false;
    resetAddForm();
    await refreshRooms();
  } catch (error) {
    console.error('添加房间失败:', error);
  }
};

const resetAddForm = () => {
  addForm.value = {
    roomId: '',
    autoConnect: false
  };
  addFormRef.value?.clearValidate();
};

const toggleConnection = async (room: Room) => {
  try {
    if (room.status === 'connected') {
      const res = await window.electronApi.room.disconnect(room.liveId);
      if (!res?.success) console.warn('disconnect failed:', res?.error || res);
    } else {
      const res = await window.electronApi.room.connect(room.liveId);
      if (!res?.success) console.warn('connect failed:', res?.error || res);
    }
    await refreshRooms();
  } catch (error) {
    console.error('切换连接状态失败:', error);
  }
};

const viewRoomDetails = (room: Room) => {
  selectedRoomId.value = room.liveId;
  showDetailsDialog.value = true;
};

const openLivePage = (room: Room) => {
  const url = `https://live.acfun.cn/live/${room.liveId}`;
  window.electronApi.system.openExternal(url);
};

const onCoverError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  if (target) target.src = '/default-cover.png';
};

const getRoomMenuOptions = (room: Room) => [
  {
    content: '查看弹幕',
    value: 'danmu',
    onClick: () => router.push(`/live/danmu/${room.liveId}`)
  },
  {
    content: '复制链接',
    value: 'copy',
    onClick: () => copyRoomLink(room)
  },
  {
    content: '删除房间',
    value: 'delete',
    theme: 'error',
    onClick: () => deleteRoom(room)
  }
];

const copyRoomLink = (room: Room) => {
  const url = `https://live.acfun.cn/live/${room.liveId}`;
  navigator.clipboard.writeText(url);
  // TODO: 显示成功提示
};

const editRoom = (_room: Room) => {
  // TODO: 实现房间编辑功能
};

const deleteRoom = async (room: Room) => {
  try {
    await roomStore.removeRoom(room.liveId);
    await refreshRooms();
  } catch (error) {
    console.error('删除房间失败:', error);
  }
};

const formatConnectTime = (timestamp: number | null) => {
  if (!timestamp) return '未连接';
  return new Date(timestamp).toLocaleString();
};

const formatLastActivity = (timestamp: number | null) => {
  if (!timestamp) return '无活动';
  return new Date(timestamp).toLocaleString();
};

// 生命周期
onMounted(() => {
  roomStore.loadRooms();
});
</script>

<style scoped>
.live-room-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  color: var(--td-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.room-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  min-height: 80px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--td-brand-color);
}

.stat-label {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-top: 4px;
}

.room-list-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.room-list-card :deep(.t-card__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.room-list-card :deep(.t-card__header),
.room-list-card :deep(.t-card__actions) {
  flex-shrink: 0;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: var(--td-text-color-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--td-text-color-secondary);
}

.empty-state p {
  margin: 16px 0;
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.room-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 8px;
  transition: all 0.2s;
}

.room-item:hover {
  border-color: var(--td-brand-color);
  background-color: var(--td-bg-color-container-hover);
}

.room-item.online {
  border-color: var(--td-success-color);
}

.room-item.offline {
  border-color: var(--td-error-color);
}

.room-item.preparing {
  border-color: var(--td-warning-color);
}

.room-cover {
  position: relative;
  width: 96px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
}

.room-cover img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid white;
  background-color: var(--td-error-color);
}

.status-indicator.connected {
  background-color: var(--td-success-color);
}

.status-indicator.connecting {
  background-color: var(--td-warning-color);
}

.status-indicator.error {
  background-color: var(--td-error-color);
}

.room-info {
  flex: 1;
  min-width: 0;
}

.room-title {
  font-weight: 500;
  color: var(--td-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.room-streamer {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-bottom: 2px;
}

.room-id {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  margin-bottom: 4px;
}

.room-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.viewer-count,
.like-count {
  display: flex;
  align-items: center;
  gap: 2px;
}

.status-text {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.barrage-text {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background-color: var(--td-brand-color-1);
  color: var(--td-brand-color);
}

.status-text.connected {
  background-color: var(--td-success-color-1);
  color: var(--td-success-color);
}

.status-text.disconnected {
  background-color: var(--td-error-color-1);
  color: var(--td-error-color);
}

.status-text.connecting {
  background-color: var(--td-warning-color-1);
  color: var(--td-warning-color);
}

.status-text.error {
  background-color: var(--td-error-color-1);
  color: var(--td-error-color);
}

.room-actions {
  display: flex;
  gap: 8px;
}

.room-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.room-action-btn :deep(.t-button__content) {
  align-items: center;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  color: var(--td-text-color-primary);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--td-border-level-2-color);
}

.detail-item .label {
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.detail-item .value {
  color: var(--td-text-color-primary);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .room-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .room-stats {
    grid-template-columns: 1fr;
  }
  
  .room-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .room-actions {
    align-self: flex-end;
  }
}
</style>