<!-- eslint-disable vue/no-v-model-argument -->
<template>
  <div class="live-manage-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>直播间管理</h1>
        <t-tag v-if="liveStatus" :theme="getStatusTheme(liveStatus)" size="large">
          {{ getStatusText(liveStatus) }}
        </t-tag>
      </div>
    </div>



    <!-- 主要内容区域：左右分栏 -->
    <div v-if="pageLoading" class="loading-container">
      <t-loading size="large" />
      <p>正在加载直播数据...</p>
    </div>
    <div v-else class="content-area">
      <!-- 左栏：房间信息和管理 -->
      <div class="left-panel">
        <!-- 房间信息卡片 -->
        <t-card title="房间信息" class="room-info-card">
          <div class="room-info-content">
            <div class="cover-section">
              <div class="cover-container">
                <img 
                  v-if="liveInfo.cover"
                  :src="liveInfo.cover" 
                  :alt="liveInfo.title"
                  class="room-cover"
                />
                <div v-else class="room-cover room-cover-placeholder"></div>
                <div class="cover-overlay">
                  <t-upload
                    v-model:files="editCoverFiles"
                    accept="image/jpeg,image/jpg,image/png"
                    :max="1"
                    :action="uploadAction"
                    :before-upload="beforeCoverUpload"
                    :on-success="handleCoverSuccess"
                    :show-thumbnail="true"
                    theme="image"
                    class="cover-upload"
                  >
                    <template #trigger>
                      <t-button variant="text" size="small" class="cover-edit-btn">
                        <t-icon name="edit" />
                        更换封面
                      </t-button>
                    </template>
                  </t-upload>
                </div>
              </div>
            </div>
            
            <div class="info-form">
              <t-form layout="vertical" :data="liveInfo">
                <t-form-item label="直播标题">
                  <t-textarea
                    v-model="liveInfo.title"
                    placeholder="请输入直播标题"
                    :maxlength="50"
                    :autosize="{ minRows: 2, maxRows: 3 }"
                    show-limit-number
                    class="title-textarea"
                  />
                </t-form-item>
                
                <t-form-item>
                  <t-space>
                    <t-button 
                      theme="primary" 
                      @click="updateRoomInfo"
                      :loading="updatingRoom"
                      class="update-btn"
                    >
                      更新信息
                    </t-button>
                    <t-button 
                      v-if="liveStatus === 'live'" 
                      theme="danger" 
                      @click="toggleLive"
                      class="end-live-btn"
                    >
                      <t-icon name="poweroff" />
                      结束直播
                    </t-button>
                  </t-space>
                </t-form-item>
              </t-form>
            </div>
          </div>
        </t-card>

        <!-- 直播统计 - 上层显示数字 -->
        <div class="stats-summary">
          <div class="stat-summary-item">
            <div class="stat-number">{{ formatNumber(stats.onlineCount) }}</div>
            <div class="stat-label">在线观看</div>
          </div>
          <div class="stat-summary-item">
            <div class="stat-number">{{ formatNumber(stats.likeCount) }}</div>
            <div class="stat-label">点赞数</div>
          </div>
          <div class="stat-summary-item">
            <div class="stat-number">{{ formatNumber(stats.giftCount) }}</div>
            <div class="stat-label">礼物数</div>
          </div>
          <div class="stat-summary-item">
            <div class="stat-number">{{ formatNumber(stats.bananaCount) }}</div>
            <div class="stat-label">香蕉数</div>
          </div>
        </div>

        <!-- 直播统计趋势图 -->
        <t-card title="直播数据趋势" class="stats-trend-card">
          <div class="chart-container" ref="chartContainer">
            <div v-if="chartData.length === 0" class="chart-empty">
              <t-icon name="chart" size="32px" />
              <p>暂无趋势数据</p>
            </div>
            <div v-else class="chart-content" ref="chartRef"></div>
          </div>
        </t-card>
      </div>

      <!-- 右栏：观众列表 -->
      <div class="right-panel">
        <t-card title="观众列表" class="audience-card">
          <template #actions>
            <div class="audience-actions">
              <t-input 
                v-model="searchKeyword" 
                placeholder="搜索观众..." 
                size="small"
                clearable
                style="width: 180px;"
              >
                <template #prefix-icon>
                  <t-icon name="search" />
                </template>
              </t-input>
              
              <t-select 
                v-model="sortBy" 
                placeholder="排序" 
                size="small"
                style="width: 100px;"
              >
                <t-option value="giftCount" label="礼物数" />
                <t-option value="likeCount" label="点赞数" />
                <t-option value="bananaCount" label="香蕉数" />
                <t-option value="nickname" label="昵称" />
              </t-select>
              
              <t-button 
                variant="text" 
                size="small" 
                @click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'"
                :aria-label="sortOrder === 'desc' ? '降序' : '升序'"
              >
                <t-icon :name="sortOrder === 'desc' ? 'sort-descending' : 'sort-ascending'" />
              </t-button>
              
              <t-checkbox 
                v-model="filterManagers" 
                size="small"
              >
                仅显示房管
              </t-checkbox>
              
              <div style="flex: 1;"></div>
            </div>
          </template>

          <div v-if="audienceLoading" class="loading-state">
            <t-loading />
            <span>加载观众列表中...</span>
          </div>

          <div v-else-if="filteredAudience.length === 0" class="empty-state">
            <t-icon name="user" size="48px" />
            <p>{{ searchKeyword ? '未找到匹配的观众' : '暂无观众' }}</p>
          </div>

          <div v-else class="audience-list">
            <div 
              v-for="user in filteredAudience" 
              :key="user.userID"
              class="audience-item"
              :class="{ 'is-manager': user.isManager }"
            >

              
              <div class="user-avatar">
                <img :src="user.avatar || '/default-avatar.png'" :alt="user.nickname" />
                <div v-if="user.badge" class="badge-indicator" :title="`粉丝牌: ${user.badge.clubName} Lv.${user.badge.level}`">
                  <t-icon name="medal" />
                  <span>{{ user.badge.level }}</span>
                </div>
              </div>
              
              <div class="user-info">
                <div class="user-name">
                  {{ user.nickname }}
                  <t-tag v-if="user.isManager" theme="primary" size="extra-small" class="manager-tag">房管</t-tag>
                </div>
                <div class="user-stats">
                  <div class="stat-item" title="礼物">
                    <div class="stat-value">{{ formatNumber(user.giftCount || 0) }}</div>
                    <div class="stat-label">礼物</div>
                  </div>
                  <div class="stat-item" title="点赞">
                    <div class="stat-value">{{ formatNumber(user.likeCount || 0) }}</div>
                    <div class="stat-label">点赞</div>
                  </div>
                  <div class="stat-item" title="香蕉">
                    <div class="stat-value">{{ formatNumber(user.bananaCount || 0) }}</div>
                    <div class="stat-label">香蕉</div>
                  </div>
                </div>
              </div>
              
              <div class="user-actions">
                <t-dropdown :options="getUserMenuOptions(user)" trigger="click">
                  <t-button variant="text" size="small" :aria-label="`操作菜单 - ${user.nickname}`">
                    <t-icon name="more" />
                  </t-button>
                </t-dropdown>
              </div>
            </div>
          </div>
        </t-card>
      </div>
    </div>



    <!-- 用户操作确认对话框 -->
    <t-dialog
      v-model:visible="showUserActionDialog"
      :title="userActionTitle"
      :theme="userActionTheme"
      @confirm="confirmUserAction"
      @cancel="cancelUserAction"
    >
      <p>{{ userActionMessage }}</p>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import * as echarts from 'echarts';

// 接口类型定义
interface User {
  userID: number;
  nickname: string;
  avatar: string;
  isManager: boolean;
  badge?: {
    clubName: string;
    level: number;
  };
  giftCount: number;
  likeCount: number;
  bananaCount: number;
}

interface Message {
  id: string;
  type: 'comment' | 'gift' | 'like' | 'banana' | 'enter';
  nickname: string;
  avatar: string;
  content?: string;
  giftName?: string;
  count?: number;
  time: number;
}

interface LiveStats {
  onlineCount: number;
  likeCount: number;
  giftCount: number;
  bananaCount: number;
}

// 路由和状态
const route = useRoute();
const liveId = computed(() => route.params.id as string);

// 直播状态
const liveStatus = ref<'live' | 'offline' | 'preparing'>('offline');
const liveInfo = ref({
  title: '',
  cover: '',
  startTime: 0
});
const updatingRoom = ref(false);
const pageLoading = ref(true);

// 统计数据
const stats = reactive<LiveStats>({
  onlineCount: 0,
  likeCount: 0,
  giftCount: 0,
  bananaCount: 0
});

// 图表数据
const chartData = ref<any[]>([]);
const chartRef = ref<HTMLElement>();
const chartContainer = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;
const chartTimer = ref<NodeJS.Timeout | null>(null);

// 观众列表
const audienceLoading = ref(false);
const audienceList = ref<User[]>([]);
const searchKeyword = ref('');
const sortBy = ref<'nickname' | 'giftCount' | 'likeCount' | 'bananaCount'>('giftCount');
const sortOrder = ref<'asc' | 'desc'>('desc');
const filterManagers = ref(false);



// 封面编辑
const editCoverFiles = ref([]);

// 用户操作对话框
const showUserActionDialog = ref(false);
const userActionTitle = ref('');
const userActionTheme = ref<'info' | 'danger' | 'warning'>('info');
const userActionMessage = ref('');
const pendingUserAction = ref<{ type: string; user: User } | null>(null);

// 定时器
const refreshTimer = ref<NodeJS.Timeout | null>(null);
const trendTimer = ref<NodeJS.Timeout | null>(null);

// 上传配置
const uploadAction = '/api/upload/cover';

// 计算属性
const filteredAudience = computed(() => {
  let filtered = audienceList.value;
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(user => 
      user.nickname.toLowerCase().includes(keyword)
    );
  }
  
  // 房管过滤
  if (filterManagers.value) {
    filtered = filtered.filter(user => user.isManager);
  }
  
  // 排序
  filtered.sort((a, b) => {
    const aVal = Number(a[sortBy.value] as any) || 0;
    const bVal = Number(b[sortBy.value] as any) || 0;
    const multiplier = sortOrder.value === 'desc' ? -1 : 1;
    return (aVal - bVal) * multiplier;
  });
  
  return filtered;
});

// 生命周期
onMounted(async () => {
  try {
    await loadLiveInfo();
    startDataRefresh();
    initChart();
    startTrendDataCollection();
  } catch (error) {
    console.error('页面初始化失败:', error);
    await MessagePlugin.error('页面初始化失败，请刷新页面重试');
  }
});

onUnmounted(() => {
  stopDataRefresh();
  stopTrendDataCollection();
  disposeChart();
});


// 加载直播信息
async function loadLiveInfo() {
  try {
    // 获取直播流状态（HTTP代理）
    const streamResult = await window.electronApi.http.get('/api/acfun/live/stream-status');
    if (streamResult && streamResult.success && streamResult.data) {
      liveStatus.value = 'live';
      liveInfo.value = {
        title: streamResult.data.title,
        cover: streamResult.data.liveCover,
        startTime: streamResult.data.liveStartTime
      };
      
      // 获取用户直播信息
      const accountInfo = await window.electronApi.account.getUserInfo();
      const userID = ('data' in (accountInfo as any)) ? (accountInfo as any).data?.userId : (accountInfo as any)?.userId;
      if (userID) {
        const userResult = await window.electronApi.http.get('/api/acfun/live/user-info', { userID: Number(userID) });
        if (userResult && userResult.success && userResult.data) {
          liveInfo.value.title = userResult.data.title;
          liveInfo.value.cover = userResult.data.liveCover;
          liveInfo.value.startTime = userResult.data.liveStartTime;
        }
      }
    } else {
      // 如果没有直播流，检查用户是否有直播
      const accountInfo = await window.electronApi.account.getUserInfo();
      const userID = ('data' in (accountInfo as any)) ? (accountInfo as any).data?.userId : (accountInfo as any)?.userId;
      if (userID) {
        const userResult = await window.electronApi.http.get('/api/acfun/live/user-info', { userID: Number(userID) });
        if (userResult && userResult.success && userResult.data && userResult.data.liveID) {
          liveStatus.value = 'live';
          liveInfo.value = {
            title: userResult.data.title,
            cover: userResult.data.liveCover,
            startTime: userResult.data.liveStartTime
          };
        }
      }
    }
    
    await loadAudience();
    await loadStats();
  } catch (error) {
    console.error('加载直播信息失败:', error);
    await MessagePlugin.error('加载直播信息失败，请检查网络连接或稍后重试');
  } finally {
    pageLoading.value = false;
  }
}

// 加载观众列表
async function loadAudience() {
  try {
    audienceLoading.value = true;
    const currentLiveId = await getCurrentLiveId();
    if (currentLiveId) {
      const res = await window.electronApi.http.get('/api/acfun/live/watching-list', { liveId: currentLiveId });
      if (res && res.success && Array.isArray(res.data)) {
        audienceList.value = res.data.map((w: any) => ({
          userID: Number(w.userInfo?.userID || 0),
          nickname: String(w.userInfo?.nickname || ''),
          avatar: String(w.userInfo?.avatar || ''),
          isManager: Number(w.userInfo?.managerType || 0) === 1,
          badge: w.userInfo?.medal ? { clubName: String(w.userInfo.medal.clubName || ''), level: Number(w.userInfo.medal.level || 0) } : undefined,
          giftCount: 0,
          likeCount: 0,
          bananaCount: 0
        }));
      } else {
        audienceList.value = [];
      }
    } else {
      audienceList.value = [];
    }
  } catch (error) {
    console.error('加载观众列表失败:', error);
    await MessagePlugin.error('加载观众列表失败，请检查网络连接或稍后重试');
  } finally {
    audienceLoading.value = false;
  }
}

// 加载统计数据
async function loadStats() {
  try {
    const accountInfo = await window.electronApi.account.getUserInfo();
    const uid = ('data' in (accountInfo as any)) ? (accountInfo as any).data?.userId : (accountInfo as any)?.userId;
    if (uid) {
      try {
        const result = await window.electronApi.http.get('/api/acfun/live/statistics', { userId: Number(uid) });
        if (result && result.success && result.data) {
          stats.onlineCount = result.data.totalViewers;
          stats.likeCount = result.data.totalLikes;
          stats.giftCount = result.data.totalGifts;
          stats.bananaCount = result.data.totalComments;
        }
        const liveIdForSummary = await getCurrentLiveId();
        const summaryResult = liveIdForSummary
          ? await window.electronApi.http.get('/api/acfun/live/summary', { liveId: liveIdForSummary })
          : null;
        if (summaryResult && summaryResult.success && summaryResult.data) {
          stats.bananaCount = summaryResult.data.bananaCount;
          stats.likeCount = summaryResult.data.likeCount;
          stats.giftCount = summaryResult.data.giftCount;
        }
      } catch (e: any) {
        const msg = (e && e.message) ? String(e.message) : '';
        // 回退：通过 room.details 获取基础统计（不依赖 liveId 映射）
        try {
          const accountInfo = await window.electronApi.account.getUserInfo();
          const uid = ('data' in (accountInfo as any)) ? (accountInfo as any).data?.userId : (accountInfo as any)?.userId;
          if (uid) {
            const d = await window.electronApi.room.details(String(uid));
            const data = ('data' in (d as any)) ? (d as any).data : {};
            if (d && d.success) {
              stats.onlineCount = typeof data.viewerCount === 'number' ? data.viewerCount : stats.onlineCount;
              stats.likeCount = typeof data.likeCount === 'number' ? data.likeCount : stats.likeCount;
            }
          }
        } catch {}
        throw e; // 保持上层统一错误提示
      }
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
    await MessagePlugin.error('加载统计数据失败，请检查网络连接或稍后重试');
  }
}

async function getCurrentLiveId(): Promise<string | null> {
  try {
    const accountInfo = await window.electronApi.account.getUserInfo();
    const uid = ('data' in (accountInfo as any)) ? (accountInfo as any).data?.userId : (accountInfo as any)?.userId;
    if (uid) {
      const u = await window.electronApi.http.get('/api/acfun/live/user-info', { userID: Number(uid) });
      if (u && u.success && u.data && u.data.liveID) {
        return String(u.data.liveID);
      }
    }
  } catch {}
  try {
    const s = await window.electronApi.http.get('/api/acfun/live/stream-status');
    if (s && s.success && s.data && s.data.liveID) {
      return String(s.data.liveID);
    }
  } catch {}
  try {
    const accountInfo = await window.electronApi.account.getUserInfo();
    const uid = ('data' in (accountInfo as any)) ? (accountInfo as any).data?.userId : (accountInfo as any)?.userId;
    if (uid) {
      const d = await window.electronApi.room.details(String(uid));
      if (d && d.success && d.data && d.data.liveId) {
        return String(d.data.liveId);
      }
    }
  } catch {}
  return null;
}

// 开始数据刷新
function startDataRefresh() {
  refreshTimer.value = setInterval(async () => {
    await loadAudience();
    await loadStats();
  }, 10000); // 10秒刷新一次
}

// 停止数据刷新
function stopDataRefresh() {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
}











// 获取用户菜单选项
function getUserMenuOptions(user: User) {
  const options = [];
  
  if (user.isManager) {
    options.push({
      content: '取消房管',
      value: 'removeManager',
      theme: 'warning',
      onClick: () => handleRemoveManager(user)
    });
  } else {
    options.push({
      content: '设为房管',
      value: 'addManager',
      theme: 'primary',
      onClick: () => handleAddManager(user)
    });
  }
  
  options.push({
    content: '踢出直播间',
    value: 'kick',
    theme: 'danger',
    onClick: () => handleKickUser(user)
  });
  
  return options;
}

// 处理添加房管
function handleAddManager(user: User) {
  pendingUserAction.value = { type: 'addManager', user };
  userActionTitle.value = '设为房管';
  userActionTheme.value = 'info';
  userActionMessage.value = `确定要将 "${user.nickname}" 设为房管吗？`;
  showUserActionDialog.value = true;
}

// 处理取消房管
function handleRemoveManager(user: User) {
  pendingUserAction.value = { type: 'removeManager', user };
  userActionTitle.value = '取消房管';
  userActionTheme.value = 'warning';
  userActionMessage.value = `确定要取消 "${user.nickname}" 的房管权限吗？`;
  showUserActionDialog.value = true;
}

// 处理踢出用户
function handleKickUser(user: User) {
  pendingUserAction.value = { type: 'kick', user };
  userActionTitle.value = '踢出直播间';
  userActionTheme.value = 'danger';
  userActionMessage.value = `确定要将 "${user.nickname}" 踢出直播间吗？`;
  showUserActionDialog.value = true;
}



// 确认用户操作
async function confirmUserAction() {
  if (!pendingUserAction.value) return;
  
  const { type, user } = pendingUserAction.value;
  
  try {
    if (type === 'addManager') {
      // TODO: 调用添加房管接口
      // await window.electronApi.manager.addManager(user.userID);
      user.isManager = true;
      MessagePlugin.success('已设为房管');
    } else if (type === 'removeManager') {
      // TODO: 调用删除房管接口
      // await window.electronApi.manager.deleteManager(user.userID);
      user.isManager = false;
      MessagePlugin.success('已取消房管');
    } else if (type === 'kick') {
      // TODO: 调用踢人接口
      // await window.electronApi.manager.authorKick(liveId.value, user.userID);
      audienceList.value = audienceList.value.filter(u => u.userID !== user.userID);
      MessagePlugin.success('已踢出直播间');
    }
  } catch (error) {
    console.error('用户操作失败:', error);
    MessagePlugin.error('操作失败，请检查网络连接或稍后重试');
  }
  
  cancelUserAction();
}

// 取消用户操作
function cancelUserAction() {
  showUserActionDialog.value = false;
  pendingUserAction.value = null;
}



// 切换直播状态
async function toggleLive() {
  try {
    if (liveStatus.value === 'live') {
      // TODO: 调用停止直播接口
      // const result = await window.electronApi.live.stopLiveStream(liveId.value);
      // if (result.success) {
      //   liveStatus.value = 'offline';
      //   MessagePlugin.success('直播已结束');
      // }
      
      // 模拟成功
      liveStatus.value = 'offline';
      MessagePlugin.success('直播已结束');
    } else {
      // 跳转到创建直播页面
      // router.push('/live/create');
      MessagePlugin.info('请重新创建直播');
    }
  } catch (error) {
    console.error('切换直播状态失败:', error);
    MessagePlugin.error('切换直播状态失败，请检查网络连接或稍后重试');
  }
}

// 封面上传处理
const beforeCoverUpload = (file: File) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png';
  const isLt5M = file.size / 1024 / 1024 < 5;
  
  if (!isImage) {
    MessagePlugin.error('只能上传 JPG/PNG 格式的图片!');
    return false;
  }
  if (!isLt5M) {
    MessagePlugin.error('图片大小不能超过 5MB!');
    return false;
  }
  return true;
};

function handleCoverSuccess(response: any) {
  liveInfo.value.cover = response.url || '';
  MessagePlugin.success('封面更新成功');
}

// 更新房间信息
async function updateRoomInfo() {
  if (!liveInfo.value.title.trim()) {
    MessagePlugin.error('请输入直播标题');
    return;
  }
  
  updatingRoom.value = true;
  try {
    // TODO: 调用更新房间信息接口
    // const result = await window.electronApi.live.updateLiveRoom(
    //   liveInfo.value.title,
    //   liveInfo.value.cover,
    //   liveId.value
    // );
    
    // if (result.success) {
    //   MessagePlugin.success('房间信息更新成功');
    // } else {
    //   throw new Error(result.error || '更新失败');
    // }
    
    // 模拟成功
    MessagePlugin.success('房间信息更新成功');
  } catch (error) {
    console.error('更新房间信息失败:', error);
    MessagePlugin.error(error instanceof Error ? error.message : '更新房间信息失败，请检查网络连接或稍后重试');
  } finally {
    updatingRoom.value = false;
  }
}

// 辅助函数
function getStatusTheme(status: string) {
  switch (status) {
    case 'live': return 'success';
    case 'preparing': return 'warning';
    case 'offline': return 'default';
    default: return 'default';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'live': return '直播中';
    case 'preparing': return '准备中';
    case 'offline': return '已结束';
    default: return '未知';
  }
}

// 图表相关函数
function initChart() {
  if (!chartRef.value) return;
  
  chartInstance = echarts.init(chartRef.value);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['在线观看', '点赞数', '礼物数', '礼物价值', '香蕉数'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.value.map(item => item.time)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '在线观看',
        type: 'line',
        smooth: true,
        data: chartData.value.map(item => item.onlineCount),
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '点赞数',
        type: 'line',
        smooth: true,
        data: chartData.value.map(item => item.likeCount),
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '礼物数',
        type: 'line',
        smooth: true,
        data: chartData.value.map(item => item.giftCount),
        itemStyle: { color: '#faad14' }
      },
      {
        name: '礼物价值',
        type: 'line',
        smooth: true,
        data: chartData.value.map(item => item.giftValue),
        itemStyle: { color: '#f5222d' }
      },
      {
        name: '香蕉数',
        type: 'line',
        smooth: true,
        data: chartData.value.map(item => item.bananaCount),
        itemStyle: { color: '#722ed1' }
      }
    ]
  };
  
  chartInstance.setOption(option);
}

function updateChart() {
  if (!chartInstance) return;
  
  const option = {
    xAxis: {
      data: chartData.value.map(item => item.time)
    },
    series: [
      { data: chartData.value.map(item => item.onlineCount) },
      { data: chartData.value.map(item => item.likeCount) },
      { data: chartData.value.map(item => item.giftCount) },
      { data: chartData.value.map(item => item.giftValue) },
      { data: chartData.value.map(item => item.bananaCount) }
    ]
  };
  
  chartInstance.setOption(option);
}

function disposeChart() {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
}

function startTrendDataCollection() {
  // 添加初始数据（使用当前统计数据）
  const now = new Date();
  for (let i = 9; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    chartData.value.push({
      time: time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      onlineCount: stats.onlineCount || 0,
      likeCount: stats.likeCount || 0,
      giftCount: stats.giftCount || 0,
      giftValue: Math.floor((stats.giftCount || 0) * 2.5), // 估算礼物价值
      bananaCount: stats.bananaCount || 0
    });
  }
  
  // 初始化图表
  nextTick(() => {
    initChart();
  });
  
  // 开始数据收集
  trendTimer.value = setInterval(async () => {
    try {
      // 重新加载统计数据
      await loadStats();
      
      const now = new Date();
      const newData = {
        time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        onlineCount: stats.onlineCount,
        likeCount: stats.likeCount,
        giftCount: stats.giftCount,
        giftValue: Math.floor(stats.giftCount * 2.5), // 估算礼物价值
        bananaCount: stats.bananaCount
      };
      
      chartData.value.push(newData);
      
      // 保持最多20个数据点
      if (chartData.value.length > 20) {
        chartData.value.shift();
      }
      
      updateChart();
    } catch (error) {
      console.error('趋势数据收集失败:', error);
    }
  }, 30000); // 30秒更新一次
}

function stopTrendDataCollection() {
  if (trendTimer.value) {
    clearInterval(trendTimer.value);
    trendTimer.value = null;
  }
}



function formatNumber(num: number) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}


</script>

<style scoped>
.live-manage-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--td-bg-color-container);
  overflow: hidden;
}

.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--td-text-color-secondary);
}

.loading-container p {
  margin: 0;
  font-size: 14px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--td-border-level-1-color);
  background-color: var(--td-bg-color-container);
}
.page-header .header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.page-header .header-left h1 {
  margin: 0;
  color: var(--td-text-color-primary);
  font-size: 20px;
  font-weight: 600;
}
/* 统计摘要样式 */
.stats-summary {
  display: flex;
  background-color: var(--td-bg-color-container);
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 8px;
  padding: 16px 0;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border-right: 1px solid var(--td-border-level-1-color);
}

.stat-summary-item:last-child {
  border-right: none;
}

.stat-summary-item .stat-number {
  font-size: 20px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin-bottom: 2px;
  line-height: 1;
}

.stat-summary-item .stat-label {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  text-align: center;
}

/* 趋势图样式 */
.stats-trend-card {
  background-color: var(--td-bg-color-container);
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.chart-container {
  height: 300px;
  position: relative;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--td-text-color-secondary);
  gap: 8px;
}

.chart-empty p {
  margin: 0;
  font-size: 14px;
}

.chart-content {
  width: 100%;
  height: 100%;
}

.room-info-card :deep(.t-card__header),
.stats-card :deep(.t-card__header),
.audience-card :deep(.t-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid var(--td-border-level-1-color);
}

.room-info-card :deep(.t-card__title),
.stats-card :deep(.t-card__title),
.audience-card :deep(.t-card__title) {
  font-size: 16px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.room-info-card :deep(.t-card__body),
.stats-card :deep(.t-card__body),
.audience-card :deep(.t-card__body) {
  padding: 20px;
}

.room-info-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cover-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.cover-container {
  position: relative;
  display: inline-block;
}

.room-cover {
  width: 200px;
  height: 112px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--td-border-level-1-color);
  background-color: var(--td-bg-color-secondarycontainer);
}

.room-cover-placeholder {
  background-color: var(--td-bg-color-secondarycontainer);
}

.cover-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  padding: 4px 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.cover-container:hover .cover-overlay {
  opacity: 1;
}

.cover-edit-btn {
  color: white;
  font-size: 12px;
}

.cover-edit-btn:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.info-form {
  flex: 1;
}

.title-textarea :deep(.t-textarea__inner) {
  font-size: 14px;
  line-height: 1.5;
}

.update-btn {
  min-width: 80px;
}

.end-live-btn {
  min-width: 80px;
}

.stats-card {
  flex-shrink: 0;
}

.stats-card :deep(.t-card__body) {
  padding: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background-color: var(--td-bg-color-container-hover);
  border-radius: 8px;
  transition: all 0.2s;
}

.stat-item:hover {
  background-color: var(--td-bg-color-container-active);
}

.stat-item .stat-number {
  font-size: 24px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin-bottom: 4px;
  line-height: 1;
}

.stat-item .stat-label {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  text-align: center;
}



.content-area {
  flex: 1;
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 16px;
  padding: 16px 24px;
  overflow: hidden;
  background-color: var(--td-bg-color-secondarycontainer);
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.right-panel {
  overflow: hidden;
}

.audience-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.audience-card :deep(.t-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
}
.audience-card :deep(.t-card__title) {
  font-size: 16px;
  font-weight: 500;
}

.audience-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: var(--td-text-color-secondary);
}
.loading-state p,
.empty-state p {
  margin: 0;
  font-size: 14px;
}

.audience-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  background-color: var(--td-border-level-1-color);
}

.audience-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background-color: var(--td-bg-color-container);
  transition: all 0.2s;
  min-height: 72px;
  border-bottom: 1px solid var(--td-border-level-1-color);
}
.audience-item:hover {
  background-color: var(--td-bg-color-container-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.audience-item.is-manager {
  background-color: var(--td-brand-color-1);
}

.user-selection {
  flex-shrink: 0;
}

.user-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
.user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background-color: var(--td-bg-color-secondarycontainer);
}

.badge-indicator {
  position: absolute;
  bottom: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--td-warning-color-5), var(--td-warning-color-6));
  border-radius: 50%;
  font-size: 12px;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  border: 2px solid var(--td-bg-color-container);
}
.badge-indicator span {
  font-weight: bold;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--td-text-color-primary);
  margin-bottom: 4px;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: var(--td-text-color-primary);
  margin-bottom: 4px;
  font-size: 14px;
}

.manager-tag {
  font-size: 11px;
  padding: 1px 4px;
  height: 18px;
  line-height: 16px;
}

.user-stats {
  display: flex;
  gap: 24px;
  color: var(--td-text-color-secondary);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 40px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--td-text-color-secondary);
}

.user-actions {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}
.audience-item:hover .user-actions {
  opacity: 1;
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 68px;
  border: 2px dashed var(--td-border-level-2-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.upload-trigger:hover {
  border-color: var(--td-brand-color);
  background-color: var(--td-bg-color-container-hover);
}
.upload-trigger p {
  margin: 4px 0;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}
</style>