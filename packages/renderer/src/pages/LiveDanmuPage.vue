<template>
  <div class="live-danmu-page">
    <div class="page-header">
      <h2>弹幕管理</h2>
      <div class="header-actions">
        <t-select 
          v-model="selectedRoomId" 
          placeholder="选择房间"
          style="width: 240px;"
          @change="switchRoom"
          filterable
        >
          <t-option 
            v-for="room in historicalRooms" 
            :key="room.roomId"
            :value="room.roomId"
            :label="`${room.streamerName} (${room.roomId})`"
          />
        </t-select>
      </div>
    </div>

    <!-- 弹幕列表 -->
    <t-card
      class="danmu-list-card"
      title="弹幕列表"
      hover-shadow
    >
      <template #header>
        <div class="danmu-card-header">
          <div class="danmu-card-title">弹幕列表</div>
          <div class="danmu-filters">
            <div class="filter-group">
              <t-select
                v-model="selectedEventTypes"
                multiple
                placeholder="事件类型"
                style="width: 180px;"
                :min-collapsed-num="1"
              >
                <t-option value="danmaku" label="弹幕" />
                <t-option value="gift" label="礼物" />
                <t-option value="like" label="点赞" />
                <t-option value="enter" label="进入" />
                <t-option value="follow" label="关注" />
                <t-option value="system" label="系统" />
              </t-select>
            </div>
            
            <div class="filter-group">
              <t-select
                v-model="keywordFilters"
                multiple
                placeholder="关键词过滤"
                style="width: 180px;"
                :min-collapsed-num="1"
                allow-create
                @create="addKeywordFilter"
              />
            </div>
            
            <div class="filter-group">
              <t-input 
                v-model="userFilter" 
                placeholder="用户过滤（用户名/UID）" 
                clearable
                style="width: 140px;"
              />
            </div>
            <div class="header-actions">
              <t-button
                variant="outline"
                @click="exportDanmu"
                :loading="exportingDanmu"
              >
                <div style="display: flex; align-items: center; gap: 4px;">
                  <t-icon name="download" />
                  导出
                </div>
              </t-button>
            </div>
          </div>
        </div>
        <div class="keyword-tags" v-if="keywordFilters.length > 0">
          <t-tag
            v-for="keyword in keywordFilters"
            :key="keyword"
            closable
            @close="removeKeywordFilter(keyword)"
            size="small"
          >
            {{ keyword }}
          </t-tag>
        </div>
      </template>
      <div
        v-if="!selectedRoomId"
        class="empty-state"
      >
        <t-icon
          name="chat"
          size="48px"
        />
        <p>请先选择一个房间</p>
      </div>

      <div
        v-else-if="loadingDanmu"
        class="loading-state"
      >
        <t-loading />
        <span>正在加载弹幕数据...</span>
      </div>

      <div
        v-else-if="filteredDanmu.length === 0"
        class="empty-state"
      >
        <t-icon
          name="chat"
          size="48px"
        />
        <p>暂无弹幕数据</p>
      </div>

      <div
        v-else
        ref="danmuListRef"
        class="danmu-list"
      >
        <div 
          v-for="danmu in filteredDanmu" 
          :key="danmu.id"
          class="danmu-item"
          :class="`danmu-${danmu.type}`"
          @click="showDanmuDetails(danmu)"
        >
          <div class="danmu-time">
            {{ formatTime(danmu.timestamp) }}
          </div>
          <div class="danmu-content">
            <component 
              :is="getDanmuComponent(danmu.type)" 
              :event="danmu"
            />
          </div>
          <div class="danmu-actions">
            <t-button
              size="small"
              variant="text"
              @click.stop="copyDanmu(danmu)"
            >
              <t-icon name="copy" />
            </t-button>
            <t-button
              size="small"
              variant="text"
              theme="danger"
              @click.stop="deleteDanmu(danmu)"
            >
              <t-icon name="delete" />
            </t-button>
          </div>
        </div>
      </div>
      
      <!-- 分页组件放在底部 -->
      <div class="pagination-footer" v-if="selectedRoomId && !loadingDanmu && allFilteredDanmu.length > 0">
        <div class="pagination-controls">
          <span class="danmu-count">{{ allFilteredDanmu.length }} 条弹幕</span>
          <t-pagination
            v-model="currentPage"
            :total="allFilteredDanmu.length"
            :page-size="pageSize"
            @change="handlePageChange"
            size="small"
          />
        </div>
      </div>
    </t-card>

    <!-- 弹幕详情对话框 -->
    <t-dialog 
      v-model:visible="showDetailsDialog" 
      title="弹幕详情"
      width="500px"
    >
      <div
        v-if="selectedDanmu"
        class="danmu-details"
      >
        <div class="detail-item">
          <span class="label">时间:</span>
          <span class="value">{{ formatDetailTime(selectedDanmu.timestamp) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">类型:</span>
          <span class="value">{{ getDanmuTypeText(selectedDanmu.type) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">用户:</span>
          <span class="value">{{ selectedDanmu.userName || '未知用户' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">用户ID:</span>
          <span class="value">{{ selectedDanmu.userId || '未知' }}</span>
        </div>
        <div
          v-if="selectedDanmu.content"
          class="detail-item"
        >
          <span class="label">内容:</span>
          <span class="value">{{ selectedDanmu.content }}</span>
        </div>
        <div class="detail-item">
          <span class="label">原始数据:</span>
          <pre class="raw-data">{{ JSON.stringify(selectedDanmu, null, 2) }}</pre>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useRoomStore } from '../stores/room';
import { MessagePlugin } from 'tdesign-vue-next';

// 弹幕组件
import CommentEvent from '../components/events/CommentEvent.vue';
import GiftEvent from '../components/events/GiftEvent.vue';
import LikeEvent from '../components/events/LikeEvent.vue';
import SystemEvent from '../components/events/SystemEvent.vue';

const route = useRoute();
const roomStore = useRoomStore();

// 响应式状态
const selectedRoomId = ref<string>('');
const danmuList = ref<any[]>([]);
const danmuListRef = ref<HTMLElement>();
const showDetailsDialog = ref(false);
const selectedDanmu = ref<any>(null);
const loadingDanmu = ref(false);
const exportingDanmu = ref(false);

// 过滤器状态
const selectedEventTypes = ref<string[]>(['danmaku', 'gift', 'like', 'enter', 'follow', 'system']);
const keywordFilters = ref<string[]>([]);
const userFilter = ref('');

// 分页状态
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);

// 历史房间列表
const historicalRooms = ref<Array<{roomId: string, streamerName: string}>>([]);

// 自动刷新定时器
let autoRefreshTimer: NodeJS.Timeout | null = null;

// WebSocket 连接
let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

// 计算属性
const allFilteredDanmu = computed(() => {
  let filtered = danmuList.value;

  // 类型过滤
  if (selectedEventTypes.value.length > 0) {
    filtered = filtered.filter(danmu => {
      const danmuType = danmu.type === 'comment' ? 'danmaku' : danmu.type;
      return selectedEventTypes.value.includes(danmuType);
    });
  }

  // 关键词过滤（多关键词，满足任意一个即可）
  if (keywordFilters.value.length > 0) {
    filtered = filtered.filter(danmu => {
      const content = (danmu.content || '').toLowerCase();
      const userName = (danmu.userName || '').toLowerCase();
      return keywordFilters.value.some(keyword => 
        content.includes(keyword.toLowerCase()) ||
        userName.includes(keyword.toLowerCase())
      );
    });
  }

  // 用户过滤（支持用户名和UID）
  if (userFilter.value) {
    const filter = userFilter.value.toLowerCase();
    filtered = filtered.filter(danmu => {
      const userName = (danmu.userName || '').toLowerCase();
      const userId = (danmu.userId || '').toLowerCase();
      return userName.includes(filter) || userId.includes(filter);
    });
  }

  return filtered.slice().reverse(); // 只反转，不切片
});

const filteredDanmu = computed(() => {
  const filtered = allFilteredDanmu.value;
  
  // 分页处理
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  
  return filtered.slice(startIndex, endIndex); // 分页切片
});

const commentCount = computed(() => 
  danmuList.value.filter(d => d.type === 'comment' || d.type === 'danmaku').length
);

const giftCount = computed(() => 
  danmuList.value.filter(d => d.type === 'gift').length
);

const likeCount = computed(() => 
  danmuList.value.filter(d => d.type === 'like').length
);

// 方法
const loadHistoricalRooms = async () => {
  try {
    // 获取历史房间列表（从SQLite数据库）
    const response = await fetch('/api/events/rooms');
    
    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    if (response.ok && contentType && contentType.includes('application/json')) {
      const data = await response.json();
      historicalRooms.value = data.rooms || [];
    } else {
      // 如果响应不是JSON，使用本地存储
      const stored = localStorage.getItem('historicalRooms');
      if (stored) {
        historicalRooms.value = JSON.parse(stored);
      }
    }
  } catch (error) {
    console.error('加载历史房间失败:', error);
    // 回退到本地存储
    const stored = localStorage.getItem('historicalRooms');
    if (stored) {
      historicalRooms.value = JSON.parse(stored);
    }
  }
};

const switchRoom = async (roomId: string) => {
  selectedRoomId.value = roomId;
  danmuList.value = [];
  try {
    const status = await window.electronApi.room.status(roomId);
    if ('error' in status || String(status?.status || '') !== 'connected') {
      try { await window.electronApi.room.connect(roomId); } catch (e) { console.warn('connect room failed:', e); }
    }
  } catch {}
  await loadHistoricalDanmu(roomId);
  connectWebSocket();
};

const loadHistoricalDanmu = async (roomId: string, page: number = 1) => {
  if (!roomId) return;
  
  loadingDanmu.value = true;
  try {
    const params = new URLSearchParams({
      room_id: roomId,
      pageSize: pageSize.value.toString(),
      page: page.toString()
    });

    // 添加类型过滤
    if (selectedEventTypes.value.length > 0) {
      params.append('type', selectedEventTypes.value.join(','));
    }

    const response = await fetch(`/api/events?${params}`);
    if (response.ok) {
      const data = await response.json();
      danmuList.value = (data.items || []).map((item: any) => ({
        id: item.id || `${item.ts}_${Math.random()}`,
        type: item.event_type === 'danmaku' ? 'comment' : item.event_type,
        timestamp: item.ts,
        userId: item.user_id,
        userName: item.user_name,
        content: item.content,
        ...item
      }));
      totalCount.value = data.total || data.items?.length || 0;
      currentPage.value = page;
    } else {
      console.error('加载历史弹幕失败:', response.statusText);
    }
  } catch (error) {
    console.error('加载历史弹幕失败:', error);
  } finally {
    loadingDanmu.value = false;
  }
};

const connectWebSocket = () => {
  if (ws) {
    ws.close();
  }

  if (!selectedRoomId.value) return;

  const ports = [8080, 8081, 8082];
  let currentPortIndex = 0;

  const tryConnect = () => {
    const port = ports[currentPortIndex];
    ws = new WebSocket(`ws://localhost:${port}/ws`);

    ws.onopen = () => {
      console.log(`WebSocket connected on port ${port}`);
      // 订阅特定房间的弹幕
      ws?.send(JSON.stringify({
        type: 'subscribe',
        roomId: selectedRoomId.value
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'danmu' && data.roomId === selectedRoomId.value) {
          handleDanmu(data.data);
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      scheduleReconnect();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      currentPortIndex = (currentPortIndex + 1) % ports.length;
      scheduleReconnect();
    };
  };

  tryConnect();
};

const scheduleReconnect = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWebSocket();
  }, 2000);
};

const handleDanmu = (danmuData: any) => {
  const danmu = {
    id: danmuData.id || `${Date.now()}_${Math.random()}`,
    type: danmuData.event_type || danmuData.type || 'system',
    timestamp: danmuData.timestamp || Date.now(),
    userId: danmuData.user_id || danmuData.userId || '',
    userName: danmuData.user_name || danmuData.userName || '',
    content: danmuData.content || danmuData.message || '',
    ...danmuData
  };

  danmuList.value.push(danmu);
  // 更新房间活动时间
  if (selectedRoomId.value) {
    roomStore.touchRoomActivity(selectedRoomId.value, danmu.timestamp);
  }
  
  // 限制弹幕数量
  if (danmuList.value.length > 1000) {
    danmuList.value.splice(0, 100);
  }
};

const exportDanmu = async () => {
  if (!selectedRoomId.value) return;
  
  exportingDanmu.value = true;
  try {
    const params = new URLSearchParams({
      room_id: selectedRoomId.value,
      filename: `danmu_${selectedRoomId.value}_${new Date().toISOString().slice(0, 10)}.csv`
    });

    const response = await fetch(`/api/export?${params}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = params.get('filename') || 'danmu_export.csv';
      a.click();
      URL.revokeObjectURL(url);
      MessagePlugin.success('导出成功');
    } else {
      MessagePlugin.error('导出失败');
    }
  } catch (error) {
    console.error('导出失败:', error);
    // 回退到前端导出
    const data = JSON.stringify(danmuList.value, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danmu_${selectedRoomId.value}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    exportingDanmu.value = false;
  }
};

const copyDanmu = (danmu: any) => {
  const text = danmu.content || JSON.stringify(danmu);
  navigator.clipboard.writeText(text);
  MessagePlugin.success('已复制到剪贴板');
};

const deleteDanmu = (danmu: any) => {
  const index = danmuList.value.findIndex(d => d.id === danmu.id);
  if (index > -1) {
    danmuList.value.splice(index, 1);
  }
};

const showDanmuDetails = (danmu: any) => {
  selectedDanmu.value = danmu;
  showDetailsDialog.value = true;
};

const addKeywordFilter = (keyword: string) => {
  if (keyword && !keywordFilters.value.includes(keyword)) {
    keywordFilters.value.push(keyword);
  }
};

const removeKeywordFilter = (keyword: string) => {
  const index = keywordFilters.value.indexOf(keyword);
  if (index > -1) {
    keywordFilters.value.splice(index, 1);
  }
};

const handlePageChange = (pageInfo: { current: number; pageSize: number }) => {
  currentPage.value = pageInfo.current;
  pageSize.value = pageInfo.pageSize;
  if (selectedRoomId.value) {
    loadHistoricalDanmu(selectedRoomId.value, pageInfo.current);
  }
};

const getDanmuComponent = (type: string) => {
  switch (type) {
    case 'comment':
    case 'danmaku':
      return CommentEvent;
    case 'gift':
      return GiftEvent;
    case 'like':
      return LikeEvent;
    default:
      return SystemEvent;
  }
};

const getDanmuTypeText = (type: string) => {
  switch (type) {
    case 'comment':
    case 'danmaku': return '弹幕';
    case 'gift': return '礼物';
    case 'like': return '点赞';
    case 'enter': return '进入房间';
    case 'follow': return '关注';
    case 'system': return '系统消息';
    default: return '未知';
  }
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

const formatDetailTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

// 监听过滤器变化，重新加载数据
watch([selectedEventTypes, keywordFilters, userFilter], () => {
  if (selectedRoomId.value) {
    currentPage.value = 1; // 重置到第一页
    // 不需要重新加载数据，因为计算属性会自动更新
  }
});

// 监听路由参数
watch(() => route.params.roomId, (roomId) => {
  if (roomId && typeof roomId === 'string') {
    selectedRoomId.value = roomId;
    switchRoom(roomId);
  }
}, { immediate: true });

// 生命周期
onMounted(async () => {
  await loadHistoricalRooms();
  
  // 如果没有从路由获取房间ID，选择第一个历史房间
  if (!selectedRoomId.value && historicalRooms.value.length > 0) {
    selectedRoomId.value = historicalRooms.value[0].roomId;
    await switchRoom(selectedRoomId.value);
  }
});

onUnmounted(() => {
  if (ws) {
    ws.close();
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
});
</script>

<style scoped>
.live-danmu-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.danmu-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: nowrap;
}

.danmu-card-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--td-text-color-primary);
  white-space: nowrap;
}

.danmu-filters {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: nowrap;
  overflow-x: auto;
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px;
  border-top: 1px solid var(--td-border-level-1-color);
  background-color: var(--td-bg-color-container);
  margin: 0 -16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.page-header h2 {
  margin: 0;
  color: var(--td-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-card {
  flex-shrink: 0;
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-row {
  display: flex;
  flex-wrap: nowrap !important;
  gap: 16px;
  align-items: center;
  min-width: 0;
  overflow-x: auto;
  white-space: nowrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-shrink: 0;
  white-space: nowrap;
}

/* 删除label，使用placeholder 承担提示文案 */

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: 80px;
}

.danmu-list-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.danmu-count {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pagination-footer {
  padding: 16px;
  border-top: 1px solid var(--td-border-level-1-color);
  background-color: var(--td-bg-color-container);
  display: flex;
  justify-content: flex-end;
}

.empty-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--td-text-color-secondary);
  gap: 12px;
}

.empty-state p,
.loading-state p {
  margin: 0;
}

.danmu-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.danmu-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;
  background-color: var(--td-bg-color-container);
  transition: background-color 0.2s;
  cursor: pointer;
}

.danmu-item:hover {
  background-color: var(--td-bg-color-container-hover);
}

.danmu-time {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  white-space: nowrap;
  min-width: 80px;
  margin-top: 2px;
}

.danmu-content {
  flex: 1;
  min-width: 0;
}

.danmu-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.danmu-item:hover .danmu-actions {
  opacity: 1;
}

.danmu-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.detail-item .label {
  font-weight: 500;
  color: var(--td-text-color-secondary);
  min-width: 80px;
}

.detail-item .value {
  color: var(--td-text-color-primary);
  word-break: break-all;
}

.raw-data {
  background-color: var(--td-bg-color-container);
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 弹幕类型样式 */
.danmu-comment,
.danmu-danmaku {
  border-left: 3px solid var(--td-brand-color);
}

.danmu-gift {
  border-left: 3px solid var(--td-warning-color);
}

.danmu-like {
  border-left: 3px solid var(--td-error-color);
}

.danmu-enter {
  border-left: 3px solid var(--td-success-color);
}

.danmu-follow {
  border-left: 3px solid var(--td-brand-color-5);
}

.danmu-system {
  border-left: 3px solid var(--td-gray-color-6);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .danmu-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .danmu-filters {
    width: 100%;
    overflow-x: auto;
  }
  
  .keyword-tags {
    margin: 0 -16px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .danmu-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .danmu-filters {
    width: 100%;
    overflow-x: auto;
  }
  
  .filter-group {
    flex-shrink: 0;
    width: auto;
  }
  
  .danmu-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .danmu-actions {
    opacity: 1;
    align-self: flex-end;
  }
  
  .pagination-footer {
    padding: 12px;
  }
  
  .pagination-controls {
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }
}
</style>
