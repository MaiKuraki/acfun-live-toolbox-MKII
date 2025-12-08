<!-- eslint-disable vue/no-v-model-argument -->
<template>
  <div class="live-danmu-page">
  <div class="page-header">
      <h2>弹幕管理</h2>
      <div class="header-actions">
        <span class="current-room-label">当前房间：</span>
        <t-select 
          v-model="selectedRoomId" 
          placeholder="选择房间"
          style="width: 200px;"
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
        <t-button theme="primary" @click="onSubmit" :loading="loadingDanmu">
          查询
        </t-button>
        <t-button theme="danger" variant="outline" @click="onClean" :loading="cleaning">
          清理
        </t-button>
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

    <t-loading :loading="loadingDanmu" :preventScrollThrough="true">
    <t-card
      class="danmu-list-card"
      title="弹幕列表"
      hover-shadow
    >
      <template #header>
        <div class="danmu-card-header">
          <div class="danmu-card-title">弹幕列表</div>
          <t-form
            ref="formRef"
            :data="formData"
            label-width="calc(2em + 48px)"
            label-align="right"
            layout="inline"
            scroll-to-first-error="smooth"
            @reset="onReset"
            @submit="onSubmit"
          >
            <div class="filters-grid">
              <!-- 第一行：直播日期、类型（统一宽度 240px） -->
              <t-form-item label="直播日期" name="date">
                <t-date-picker
                  v-model="formData.date"
                  placeholder="选择直播日期"
                  :disable-date="disableDate"
                  style="width: 260px;"
                />
              </t-form-item>

              <t-form-item label="弹幕类型" name="types">
                <t-select
                  v-model="formData.types"
                  multiple
                  placeholder="事件类型"
                  style="width: 260px;"
                  :min-collapsed-num="1"
                >
                  <t-option value="danmaku" label="弹幕" />
                  <t-option value="gift" label="礼物" />
                  <t-option value="like" label="点赞" />
                  <t-option value="enter" label="进入直播间" />
                  <t-option value="follow" label="关注" />
                </t-select>
            </t-form-item>

              <!-- 第二行：关键词1（左）、用户（右） -->
              <t-form-item label="关键词" name="keyword">
                <t-input v-model="formData.keyword" placeholder="请输入关键词" style="width: 260px;" />
              </t-form-item>

            <t-form-item label="用户" name="users">
              <t-select
                v-model="usersValue"
                multiple
                remote
                filterable
                :loading="usersLoading"
                @search="remoteSearchUsers"
                @change="onUsersChange"
                style="width: 100%;"
              >
                <t-option v-for="opt in usersOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
              </t-select>
            </t-form-item>
            </div>
          </t-form>
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
        v-else-if="filteredDanmu.length === 0"
        class="empty-state"
      >
        <t-icon
          name="chat"
          size="48px"
        />
        <p>暂无弹幕数据</p>
      </div>

      <div class="table-fixed-container" v-else>
        <t-base-table
          row-key="id"
          :columns="tableColumns"
          :data="filteredDanmu"
          size="small"
          bordered
          hover
          height="410px"
          :ellipsis="true"
          cellEllipsisType="title"
        />
      </div>
      
      <!-- 分页组件放在底部 -->
      <div class="pagination-footer" v-if="selectedRoomId && !loadingDanmu && totalCount > 0">
         <t-pagination
            v-model="currentPage"
            :total="totalCount"
            :page-size="pageSize"
            @change="handlePageChange"
            size="small"
          />
      </div>
    </t-card>
    </t-loading>

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
import { ref, computed, watch, onMounted, h } from 'vue';
import { useRoute } from 'vue-router';
import { useRoomStore } from '../stores/room';
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next';
import { getApiBase } from '../utils/hosting';

// 弹幕组件
 

const route = useRoute();
const roomStore = useRoomStore();

// 响应式状态
const selectedRoomId = ref<string>('');
const danmuList = ref<any[]>([]);
 
const showDetailsDialog = ref(false);
const selectedDanmu = ref<any>(null);
const loadingDanmu = ref(false);
const exportingDanmu = ref(false);
const cleaning = ref(false);

// 过滤器状态
const selectedEventTypes = ref<string[]>(['danmaku', 'gift', 'like', 'enter', 'follow']);
const formRef = ref();
const formData = ref<{ types: string[]; keyword: string; users: string[]; date: string | null }>({
  types: selectedEventTypes.value,
  keyword: '',
  users: [],
  date: null
});
const usersOptions = ref<Array<{ label: string; value: string }>>([]);
const usersLoading = ref(false);
const usersValue = ref<string[]>([]);
const disableDate = ref<any>(null);

// 分页状态
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);

// 历史房间列表
const historicalRooms = ref<Array<{roomId: string, streamerName: string}>>([]);

 

// 计算属性：直接使用后端分页结果
const filteredDanmu = computed(() => danmuList.value);

// 已移除未使用的统计计算，避免冗余代码

// 方法
const loadHistoricalRooms = async () => {
  try {
    const base = getApiBase();
    const res = await fetch(new URL('/api/events/rooms', base).toString(), { method: 'GET' });
    const data = await res.json();
    historicalRooms.value = (data && data.rooms) ? data.rooms : [];
  } catch (error) {
    console.error('加载历史房间失败:', error);
    const stored = localStorage.getItem('historicalRooms');
    if (stored) {
      historicalRooms.value = JSON.parse(stored);
    }
  }
};

const switchRoom = async (roomId: string) => {
  selectedRoomId.value = roomId;
  danmuList.value = [];
  await loadAvailableDates(roomId);
  await loadHistoricalDanmu(roomId);
};

const loadHistoricalDanmu = async (roomId: string, page: number = 1) => {
  if (!roomId) return;
  loadingDanmu.value = true;
  try {
    const allTypes = ['danmaku','gift','like','enter','follow'];
    const hasAllTypes = formData.value.types.length === allTypes.length && allTypes.every(t => formData.value.types.includes(t));
    const params: Record<string, any> = {
      room_id: roomId,
      pageSize: pageSize.value,
      page
    };
    if (!hasAllTypes && formData.value.types.length > 0) {
      params.type = formData.value.types.join(',');
    }
    if (formData.value.keyword && String(formData.value.keyword).trim().length > 0) {
      params.q = String(formData.value.keyword).trim();
    }
  if (formData.value.users && formData.value.users.length > 0) {
      params.user_ids = formData.value.users.join(',');
  }
    if (formData.value.date) {
      const d = new Date(formData.value.date);
      const ymd = formatYMD(d);
      params.from_date = ymd;
      params.to_date = ymd;
    }
    const base = getApiBase();
    const url = new URL('/api/events', base);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.append(key, String(value));
    }
    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json();
    danmuList.value = (data.items || []).map((item: any) => ({
      id: item.id || `${item.ts}_${Math.random()}`,
      type: item.event_type === 'danmaku' ? 'comment' : item.event_type,
      timestamp: Number(item.ts) || Date.now(),
      userId: item.user_id,
      userName: item.user_name,
      content: item.content,
      ...item
    }));
    totalCount.value = data.total || data.items?.length || 0;
    currentPage.value = page;
  } catch (error) {
    console.error('加载历史弹幕失败:', error);
  } finally {
    loadingDanmu.value = false;
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
    const allTypes = ['danmaku','gift','like','enter','follow'];
    const hasAll = formData.value.types.length === allTypes.length && allTypes.every(t => formData.value.types.includes(t));
    if (!hasAll && formData.value.types.length > 0) params.set('type', formData.value.types.join(','));
    if (formData.value.date) {
      const d = new Date(formData.value.date);
      const ymd = formatYMD(d);
      params.set('from_date', ymd);
      params.set('to_date', ymd);
    }
    if (formData.value.users && formData.value.users.length > 0) {
      params.set('user_ids', formData.value.users.join(','));
    }
    if (formData.value.keyword && String(formData.value.keyword).trim().length > 0) {
      params.set('q', String(formData.value.keyword).trim());
    }

    const base = getApiBase();
    const response = await fetch(`${new URL('/api/export', base).toString()}?${params}`);
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
    MessagePlugin.error('导出失败');
  } finally {
    exportingDanmu.value = false;
  }
};

const onClean = async () => {
  if (!selectedRoomId.value) {
    MessagePlugin.warning('请先选择一个房间');
    return;
  }

  const confirmDialog = DialogPlugin.confirm({
    header: '确认清理',
    body: '确定要根据当前筛选条件清理弹幕数据吗？此操作不可恢复。',
    theme: 'warning',
    onConfirm: async () => {
      confirmDialog.hide();
      cleaning.value = true;
      try {
        const params: Record<string, any> = {
          room_id: selectedRoomId.value
        };
        const allTypes = ['danmaku','gift','like','enter','follow'];
        const hasAllTypes = formData.value.types.length === allTypes.length && allTypes.every(t => formData.value.types.includes(t));
        
        if (!hasAllTypes && formData.value.types.length > 0) {
          params.type = formData.value.types.join(',');
        }
        if (formData.value.keyword && String(formData.value.keyword).trim().length > 0) {
          params.q = String(formData.value.keyword).trim();
        }
        if (formData.value.users && formData.value.users.length > 0) {
          params.user_ids = formData.value.users.join(',');
        }
        if (formData.value.date) {
          const d = new Date(formData.value.date);
          const ymd = formatYMD(d);
          params.from_date = ymd;
          params.to_date = ymd;
        }

        const base = getApiBase();
        const url = new URL('/api/events', base);
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) url.searchParams.append(key, String(value));
        }
        
        const res = await fetch(url.toString(), { method: 'DELETE' });
        const data = await res.json();
        
        if (data.success) {
          MessagePlugin.success(`清理成功，共删除 ${data.deleted} 条记录`);
          currentPage.value = 1;
          await loadHistoricalDanmu(selectedRoomId.value, 1);
        } else {
          MessagePlugin.error(`清理失败: ${data.error || '未知错误'}`);
        }
      } catch (e: any) {
        MessagePlugin.error(`清理失败: ${e.message}`);
      } finally {
        cleaning.value = false;
      }
    }
  });
};

const formatYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};

const loadAvailableDates = async (roomId?: string) => {
  try {
    const params: any = {};
    if (roomId) params.room_id = roomId;
    const base = getApiBase();
    const url = new URL('/api/events/dates', base);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.append(key, String(value));
    }
    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json();
    const set = new Set<string>(((data && data.dates) || []).map((s: any) => String(s)));
    disableDate.value = (date: Date) => !set.has(formatYMD(date));
  } catch {
    disableDate.value = null;
  }
};

 

const showDanmuDetails = (danmu: any) => {
  selectedDanmu.value = danmu;
  showDetailsDialog.value = true;
};

 

const handlePageChange = (pageInfo: { current: number; pageSize: number }) => {
  currentPage.value = pageInfo.current;
  pageSize.value = pageInfo.pageSize;
  if (selectedRoomId.value) {
    loadHistoricalDanmu(selectedRoomId.value, pageInfo.current);
  }
};

const remoteSearchUsers = async (search: string) => {
  const q = (search || '').trim();
  usersLoading.value = true;
  try {
    const base = getApiBase();
    const url = new URL('/api/users/search', base);
    url.searchParams.set('keyword', q);
    url.searchParams.set('page', '1');
    url.searchParams.set('pageSize', '20');
    if (selectedRoomId.value) url.searchParams.set('room_id', selectedRoomId.value);
    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json();
    usersOptions.value = (data.items || []).map((u: any) => ({ label: u.name || String(u.id), value: String(u.id) }));
  } catch {
    usersOptions.value = [];
  } finally {
    usersLoading.value = false;
  }
};

const onUsersChange = (val: string[]) => {
  usersValue.value = val || [];
  formData.value.users = usersValue.value.slice();
};

const onSubmit = async () => {
  if (!selectedRoomId.value) return;
  currentPage.value = 1;
  await loadHistoricalDanmu(selectedRoomId.value, 1);
};

const onReset = () => {
  formData.value.types = ['danmaku', 'gift', 'like', 'enter', 'follow'];
  formData.value.keyword = '';
  formData.value.users = [];
  formData.value.date = null;
};

 

 

const getDanmuTypeText = (type: string) => {
  switch (type) {
    case 'comment':
    case 'danmaku': return '弹幕';
    case 'gift': return '礼物';
    case 'like': return '点赞';
    case 'enter': return '进入直播间';
    case 'follow': return '关注';
    case 'system': return '系统消息';
    default: return '未知';
  }
};

const formatTime = (timestamp: number) => {
  const d = new Date(Number(timestamp) || Date.now());
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const formatDetailTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

const contentText = (d: any) => {
  const t = d.type === 'comment' ? 'danmaku' : d.type;
  if (t === 'like') return '点了一个❤️';
  if (t === 'enter') return '进入了直播间';
  if (t === 'follow') return '关注了主播';
  if (t === 'gift') {
    return `${d.content}`;
  }
  if (t === 'system') return String(d.content || d.message || '系统通知');
  return String(d.content || '');
};

const tableColumns = [
  { colKey: 'timestamp', title: '时间', width: 140, cell: (_h: any, { row }: any) => formatTime(row.timestamp) },
  { colKey: 'type', title: '类型', width: 100, cell: (_h: any, { row }: any) => getDanmuTypeText(row.type) },
  { colKey: 'userName', title: '用户', width: 160, cell: (_h: any, { row }: any) => String(row.userName || row.userId || '') },
  { colKey: 'content', title: '内容', width: 220, ellipsis: true, cell: (_h: any, { row }: any) => contentText(row) },
  { colKey: 'ops', title: '操作', width: 80, cell: (_h: any, { row }: any) => h('span', { class: 'ops-icon', title: '查看详情', onClick: () => showDanmuDetails(row) }, '🔍') }
];

// 监听过滤器变化，重新加载数据
watch([() => formData.value.types, () => formData.value.keyword, () => formData.value.users, () => formData.value.date], async () => {
  if (selectedRoomId.value) {
    currentPage.value = 1;
    await loadHistoricalDanmu(selectedRoomId.value, 1);
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

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 16px;
  grid-row-gap: 12px;
  width: 100%;
}

.keyword-tags {
  /* 已不再使用关键词标签展示，删除冗余样式 */
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
.current-room-label { color: var(--td-text-color-secondary); }

.half-col { flex: 1 1 50%; }
.form-row-break {
  flex-basis: 100%;
  height: 0;
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

/* 删除重复的 .keyword-tags 样式定义 */

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

.content-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.content-ellipsis {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.view-detail {
  color: var(--td-brand-color);
  cursor: pointer;
  user-select: none;
}
.ops-icon { cursor: pointer; color: var(--td-brand-color); }

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
