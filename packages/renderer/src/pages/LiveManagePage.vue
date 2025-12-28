<!-- eslint-disable vue/no-v-model-argument -->
<template>
  <div class="live-manage-page">
    <div class="page-header">
      <div class="title-with-status">
        <h2>{{ isMyRoom ? '我的直播间' : (hostName ? hostName + '的直播间' : '直播间') }}</h2>
        <t-tag :theme="liveStatus === 'live' ? 'success' : 'danger'" size="small">{{ getStatusText(liveStatus) }}</t-tag>
      </div>
    </div>
  <div class="content-layout">
      <!-- 左侧控制栏 -->
      <div class="left-sidebar">
       <div class="thumbnail-container">
          <div class="cover-readonly">
            <img :src="roomCover" alt="封面" />
          </div>
          <div class="live-status-badge"></div>
        </div>
        
        <div class="title-section">
           <t-typography-title  style="margin:6px 0px" level="h5">{{ roomTitle }}</t-typography-title>
        </div>
        <div class="video-container" v-if="!isMyRoom">
          <FlvPlayer  v-if="showVideo" :src="selectedUrl" :autoplay="true" :muted="true" :poster="roomCover" @error="playerError=true" />
          <div v-else-if="showPlaceholder" class="placeholder-wrapper">
            <div class="placeholder-text">直播视频获取中</div>
          </div>
        </div>
        <t-select v-if="showVideo" v-model="selectedUrl" size="small" placeholder="选择清晰度" style="margin-top:8px">
          <t-option v-for="opt in qualityOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
        </t-select>
      <!-- 中部：核心操作 -->
      <div class="control-section">
        <t-row :gutter="12" v-if="isMyRoom && liveStatus === 'live'">
          <t-col :span="6">
            <t-button 
              block 
              theme="primary" 
              size="tiny"
              @click="openEditDialog"
            >
              修改信息
            </t-button>
          </t-col>
          <t-col :span="6">
            <t-button 
              block 
              :theme="liveStatus === 'live' ? 'danger' : 'success'" 
              size="tiny" 
              :disabled="liveStatus !== 'live'"
              @click="toggleLive"
            >
              下播
            </t-button>
          </t-col>
        </t-row>

        <t-row :gutter="12">
          <t-col :span="3">
            <div class="custom-stat">
              <div class="stat-title">在线人数</div>
              <div class="stat-value">{{ formatNumber(stats.onlineCount) }}</div>
            </div>
          </t-col>
          <t-col :span="3">
            <div class="custom-stat">
              <div class="stat-title">点赞数</div>
              <div class="stat-value">{{ formatNumber(stats.likeCount) }}</div>
            </div>
          </t-col>
          <t-col :span="3">
            <div class="custom-stat">
              <div class="stat-title">香蕉数</div>
              <div class="stat-value">{{ formatNumber(stats.bananaCount) }}</div>
            </div>
          </t-col>
          <t-col :span="3">
            <div class="custom-stat">
              <div class="stat-title">直播时长</div>
              <div class="stat-value" style="font-size:14px">{{ liveDuration }}</div>
            </div>
          </t-col>
        </t-row>
      </div>
      <t-divider style="margin: 6px 0px;"></t-divider>
      <t-dialog 
        v-model:visible="editDialogVisible" 
        title="修改信息"
      >
        <t-form ref="editFormRef" :data="editForm" :rules="editFormRules" layout="vertical">
          <div class="section-subtitle">基本信息</div>
          <t-form-item label="直播标题" name="title">
            <t-input v-model="editForm.title" placeholder="请输入直播标题" />
          </t-form-item>
          <div class="section-subtitle">封面设置</div>
          <t-form-item label="封面裁剪" name="cover">
            <CoverCropper v-model="editForm.cover" />
          </t-form-item>
        </t-form>
        <template #footer>
          <t-space>
            <t-button variant="outline" @click="editDialogVisible = false">取消</t-button>
            <t-button theme="primary" @click="confirmEditInfo">确认</t-button>
          </t-space>
        </template>
      </t-dialog>

        <div class="plugin-grid" v-if="isMyRoom">
          <div 
            v-for="plugin in liveRoomPlugins" 
            :key="plugin.id" 
            class="plugin-card"
            :class="{ disabled: plugin.status !== 'active' || !plugin.enabled }"
            @click="openLiveRoomPlugin(plugin.id)"
          >
            <div class="plugin-icon" :style="{ backgroundColor: '#1890FF' }">
              <img v-if="plugin.icon" :src="plugin.icon" :alt="plugin.name" @error="onAvatarError" />
              <VideoIcon v-else />
            </div>
            <div class="plugin-name">{{ plugin.name }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧互动栏 -->
      <div class="right-main-area">
      <!-- 顶部：礼物贡献榜 -->
      <div class="gift-leaderboard" ref="giftLeaderboardEl" @mouseleave="onGiftMouseLeave" @mouseenter="onGiftMouseEnter">
        <div class="leaderboard-header">
          <div class="leaderboard-title">礼物贡献榜</div>
          <t-button size="small" variant="text" @click="leaderboardExpanded = !leaderboardExpanded">
            <template #icon>
              <ChevronUpIcon v-if="leaderboardExpanded" />
              <ChevronDownIcon v-else />
</template>
          </t-button>
        </div>

        <div class="leaderboard-content" :style="{ height: leaderboardExpanded ? '168px' : '28px', transition: 'height 0.3s ease' }" ref="leaderboardContent">
        <div v-if="!leaderboardExpanded" class="leaderboard-list">
          <div 
            v-for="(user, index) in giftLeaderboard" 
            :key="user.userID" 
            class="leaderboard-item"
            :class="'rank-' + (index + 1)"
            @click="leaderboardExpanded = true"
          >
            <div class="avatar-wrapper">
              <img :src="user.avatar" :alt="user.nickname" :title="user.nickname" :draggable="false" @dragstart.prevent @error="onAvatarError" />
              <div class="rank-badge" v-if="index < 3">{{ index + 1 }}</div>
            </div>
          </div>
          <div v-if="giftLoading" class="empty-leaderboard">加载中</div>
          <div v-else-if="giftLeaderboard.length === 0" class="empty-leaderboard">暂无数据</div>
        </div>

        <div v-else class="leaderboard-vertical" @click.stop>
          <div 
            v-for="(user, index) in giftLeaderboard"
            :key="user.userID"
            class="leaderboard-vertical-item"
          >
            <img 
              :src="user.avatar" 
              :alt="user.nickname" 
              :title="user.nickname" 
              :draggable="false" 
              @dragstart.prevent 
              @error="onAvatarError" 
              @click.stop="openUserMenu({ userId: user.userID, nickname: user.nickname }, $event)"
            />
            <div class="lv-text">
              <div class="lv-name">{{ user.nickname }}</div>
              <div class="lv-value">贡献值 {{ user.value }}</div>
            </div>
          </div>
          <div v-if="giftLoading" class="empty-leaderboard">加载中</div>
          <div v-else-if="giftLeaderboard.length === 0" class="empty-leaderboard">暂无数据</div>
        </div>
        </div>
      </div>

      <!-- 中部：聊天消息流 -->
      <div class="chat-stream" ref="chatContainer">
        <div v-if="messages.length === 0" class="chat-empty">当前还没有人发送弹幕</div>
        <template v-for="msg in messages">
          <t-divider v-if="['enter','like','follow'].includes(msg.type)" :key="msg.id" style="margin: 0px 0px;">{{ msg.nickname }} {{ msg.content }}</t-divider>
          <div v-else :key="msg.id" class="chat-message" :class="{ 'is-host': msg.isHost }">
            <div class="message-avatar" v-if="!msg.isHost" @click.stop="openUserMenu(msg, $event)">
              <img :src="msg.avatar" :alt="msg.nickname" :draggable="false" @dragstart.prevent @error="onAvatarError" />
            </div>
            <div class="message-bubble">
              <div class="message-sender" @click.stop="openUserMenu(msg, $event)">
                <span>{{ msg.nickname }}</span>
                <span v-if="msg.isManager" class="manager-shield">🛡️</span>
                <span v-if="msg.medal" class="sender-medal">{{ msg.medal.clubName }} Lv.{{ msg.medal.level }}</span>
              </div>
              <div class="message-content">{{ msg.content }}</div>
            </div>
            <div class="message-avatar" v-if="msg.isHost">
              <img :src="hostAvatar" alt="主播" :draggable="false" @dragstart.prevent @error="onAvatarError" />
            </div>
          </div>
        </template>
      </div>

      <div v-if="!isAtBottom && newMsgCount > 0" class="new-messages-bubble" @click="scrollToBottom">
        ⬇️ {{ newMsgCount }} 条新消息
      </div>

      <div v-if="userMenuVisible" class="user-context-popover" :style="{ left: userMenuX + 'px', top: userMenuY + 'px' }">
        <div class="popover-item" @click="openUserPage">个人页面</div>
        <div class="popover-item" v-if="showSetManager" @click="setAsManager">设为房管</div>
        <div class="popover-item danger" v-if="showKickUser" @click="promptKick">踢出用户</div>
      </div>

      <t-dialog v-model:visible="kickConfirmVisible" title="踢出观众确认">
        <div>确定要将 {{ kickTargetName }} 踢出直播间吗？该用户本场无法再进入。</div>
        <template #footer>
          <t-space>
            <t-button variant="outline" @click="kickConfirmVisible = false">取消</t-button>
            <t-button theme="danger" @click="confirmKick">确认踢出</t-button>
          </t-space>
        </template>
      </t-dialog>

      <!-- 底部：发言区 -->
      <div class="input-area">
        <t-input 
          v-model="inputMessage" 
          placeholder="和大家聊点什么..." 
          class="chat-input"
          :maxlength="50"
          show-limit-number
          @enter="sendMessage"
          @keydown="onInputKeydown"
        >
          <template #suffix>
            <t-button shape="circle" theme="primary" variant="text" @click="sendMessage">
              <template #icon><send-icon /></template>
            </t-button>
          </template>
        </t-input>
      </div>
      
      <!-- Summary Overlay -->
      <div v-if="summaryOverlayVisible" class="summary-overlay">
        <div class="summary-card">
          <div class="summary-title">本场总结</div>
          <div v-if="summaryLoading" class="summary-loading">正在生成总结...</div>
          <div v-else class="summary-content">
            <div class="summary-row">
              <div>在线人数</div>
              <div>{{ (summaryData?.watchingCount ?? summaryData?.viewerCount ?? 0) }}</div>
            </div>
            <div class="summary-row">
              <div>点赞数</div>
              <div>{{ (summaryData?.likeCount ?? 0) }}</div>
            </div>
            <div class="summary-row">
              <div>礼物数</div>
              <div>{{ (summaryData?.giftCount ?? 0) }}</div>
            </div>
            <div class="summary-row">
              <div>投蕉数</div>
              <div>{{ (summaryData?.bananaCount ?? 0) }}</div>
            </div>
            <div style="margin-top:12px; text-align:center;">
              <t-button theme="primary" @click="summaryOverlayVisible = false">关闭</t-button>
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  </template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import { 
    SendIcon,
    VideoIcon,
    ChevronDownIcon,
    ChevronUpIcon
  } from 'tdesign-icons-vue-next';
import { useLiveStore } from '../stores/live';
import { useAccountStore } from '../stores/account';
import { useRoomStore } from '../stores/room';
import { getApiBase, resolvePrimaryHostingType } from '../utils/hosting';
import { usePluginStore } from '../stores/plugin';
import CoverCropper from '../components/CoverCropper.vue'
import FlvPlayer from '../components/FlvPlayer.vue'

// Store
const liveStore = useLiveStore();
const route = useRoute();
const router = useRouter();
const accountStore = useAccountStore();
const roomStore = useRoomStore();
const pluginStore = usePluginStore();

// State
const inputMessage = ref('');
const chatContainer = ref<HTMLElement | null>(null);
const isAtBottom = ref(true);
const newMsgCount = ref(0);
const editDialogVisible = ref(false);
const editFormRef = ref();
const editForm = ref<{ title: string; cover: string }>({ title: '', cover: '' });
const editFormRules = {
  title: [ { required: true, message: '请输入直播标题', type: 'error' } ]
};

const CREATE_DRAFT_KEY = 'LIVE_CREATE_BASIC_FORM_V1';
function syncCreateDraft(title: string, cover?: string) {
  try {
    const raw = localStorage.getItem(CREATE_DRAFT_KEY);
    let payload: any = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch {}
    payload = payload && typeof payload === 'object' ? payload : {};
    payload.title = String(title || '');
    if (cover && String(cover).trim().length > 0) {
      payload.cover = String(cover);
    }
    localStorage.setItem(CREATE_DRAFT_KEY, JSON.stringify(payload));
  } catch {}
}

// Computed
const routeRoomId = computed(() => String(route.params.roomId || ''));
const isMyRoom = computed(() => {
  const uid = String(accountStore.userInfo?.userID || '');
  const rid = currentRoomId.value;
  if (!uid) return false;
  if (rid) {
    const r = roomStore.getRoomById(rid);
    const owner = String(r?.streamer?.userId || r?.liverUID || '');
    if (owner) return owner === uid;
  }
  const rrid = routeRoomId.value;
  if (String(rrid || '') === uid) return true;
  if (String(liveStore.liveId || '') === String(rrid || '')) return true;
  return false;
});
const liveInfo = computed(() => liveStore.liveInfo);
const currentRoomId = computed(() => {
  const rid = routeRoomId.value;
  if (rid) {
    const rooms = roomStore.rooms;
    const r = rooms.find(x => String(x.id) === rid || String(x.liverUID) === rid || String(x.streamer?.userId || '') === rid);
    return String(r?.id || rid || '');
  }
  const rooms = roomStore.rooms;
  const liveKey = String(liveStore.liveId || '');
  let r = liveKey ? rooms.find(x => String(x.liveId) === liveKey) : undefined;
  if (!r) {
    const uid = String(accountStore.userInfo?.userID || '');
    r = uid ? rooms.find(x => String(x.liverUID) === uid || String(x.streamer?.userId || '') === uid) : undefined;
  }
  return String(r?.id || '');
});
const liveStatus = computed(() => {
  const rid = currentRoomId.value;
  if (rid) {
    const r = roomStore.getRoomById(rid);
    if (r) return r.isLive ? 'live' : 'offline';
  }
  return liveStore.isLive ? 'live' : 'offline';
});
const stats = computed(() => liveStore.getRoomStats(currentRoomId.value || ''));
const giftLeaderboard = computed(() => liveStore.getRoomGiftLeaderboard(currentRoomId.value || ''));
const hostAvatar = computed(() => accountStore.userInfo?.avatar || 'https://cdn.ui-avatars.com/api/?name=Host');
const audienceList = computed(() => liveStore.getRoomAudience(currentRoomId.value || ''));
const messages = computed(() => liveStore.getRoomMessages(currentRoomId.value || '').map((msg: any) => ({
  ...msg,
  isHost: String(msg?.userId || '') === String(accountStore.userInfo?.userID || ''),
  isManager: audienceList.value.some(u => Number(u.userID) === Number(msg?.userId || 0) && u.isManager)
})));
const leaderboardExpanded = ref(false);

/* streams moved below displayRoom to avoid TDZ */

const displayRoom = computed(() => {
  const rid = routeRoomId.value;
  const rooms = roomStore.rooms;
  if (rid) {
    let r = rooms.find(x => String(x.id) === rid);
    if (!r) {
      r = rooms.find(x => String(x.liverUID) === rid || String(x.streamer?.userId || '') === rid);
    }
    return r;
  }
  const liveId = String(liveStore.liveId || '');
  const uid = String(accountStore.userInfo?.userID || '');
  let r = rooms.find(x => String(x.liveId) === liveId);
  if (!r && uid) {
    r = rooms.find(x => String(x.liverUID) === uid || String(x.streamer?.userId || '') === uid);
  }
  return r;
});
const hostName = computed(() => String(displayRoom.value?.streamer?.userName || '').trim() || String(accountStore.userInfo?.nickname || '').trim());
const roomTitle = computed(() => {
  const t = String(displayRoom.value?.title || '').trim();
  if (t) return t;
  const lt = String(liveInfo.value.title || '').trim();
  if (lt) return lt;
  const name = String(displayRoom.value?.streamer?.userName || accountStore.userInfo?.nickname || '').trim();
  const id = String(liveStore.liveId || accountStore.userInfo?.userID || '').trim();
  return t || lt || (name ? `${name}的直播间` : (id ? `直播间 ${id}` : '直播间'));
});
const roomCover = computed(() => {
  const c = String(displayRoom.value?.coverUrl || '').trim();
  if (c) return c;
  const lc = String(liveInfo.value.cover || '').trim();
  return lc || '';
});

const rawStreams = computed(() => {
  const si: any = displayRoom.value?.streamInfo || null
  if (!si) return []
  const cands: any[] = Array.isArray((si as any)?.streamList) ? (si as any).streamList
    : Array.isArray((si as any)?.flvList) ? (si as any).flvList
    : Array.isArray((si as any)?.playbackUrls) ? (si as any).playbackUrls
    : Array.isArray((si as any)?.streams?.flv) ? (si as any).streams.flv
    : Array.isArray((si as any)?.streams) ? (si as any).streams : []
  return cands.filter(Boolean)
})
const streams = computed(() => {
  return rawStreams.value.map((it: any) => {
    const url = String(it?.url || it?.playUrl || '')
    const bitrate = Number(it?.bitrate || it?.br || 0)
    const qualityType = String(it?.qualityType || it?.type || '')
    const qualityName = String(it?.qualityName || it?.name || '')
    return { url, bitrate, qualityType, qualityName }
  }).filter(x => x.url && /\.flv(\?|$)/i.test(x.url))
})
const qualityOptions = computed(() => streams.value.map(s => ({ value: s.url, label: s.qualityName || s.qualityType || ((s.bitrate > 0 ? Math.round(s.bitrate/1000) : 0) + 'M') })))
const selectedUrl = ref('')
const playerError = ref(false)
const showVideo = computed(() => !isMyRoom.value && liveStatus.value === 'live' && streams.value.length > 0 && !playerError.value)
const showPlaceholder = computed(() => !isMyRoom.value && liveStatus.value === 'live' && streams.value.length === 0)
watch(streams, (list) => {
  if (!list.length) { selectedUrl.value = '' ; return }
  const preferred = list.find(x => String(x.qualityType).toUpperCase() === 'BLUE_RAY')
  const highest = [...list].sort((a,b) => (b.bitrate||0)-(a.bitrate||0))[0]
  selectedUrl.value = (preferred?.url || highest?.url || list[0].url)
}, { immediate: true })

watch(selectedUrl, () => { playerError.value = false })

// Timer for duration
const startTime = ref(Date.now());
const now = ref(Date.now());
const durationTimer = ref<NodeJS.Timeout | null>(null);

const liveDuration = computed(() => {
  if (liveStatus.value !== 'live') return '00:00:00';
  const originStart = Number(displayRoom.value?.startTime || liveInfo.value.startTime || startTime.value || Date.now());
  const diff = Math.max(0, now.value - originStart);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const liveRoomPlugins = computed(() => pluginStore.plugins.filter(p => p.liveRoomDisplay?.show));

  const giftLoading = ref(true);

// Methods
async function openLiveRoomPlugin(pluginId: string) {
  const plugin = pluginStore.getPluginById(pluginId);
  if (!plugin) return;
  if (plugin.status !== 'active' || !plugin.enabled) return;
  try {
    const primary = await resolvePrimaryHostingType(pluginId);
    if (primary.type === 'ui') {
      await router.push(`/plugins/${pluginId}`);
      return;
    }
    if (primary.type === 'window') {
      await window.electronApi?.plugin.window.open(pluginId);
      return;
    }
  } catch {}
  try { await router.push(`/plugins/${pluginId}`); } catch {}
}
function getStatusText(status: string) {
  return status === 'live' ? '直播中' : '未开播';
}

function formatNumber(num: number) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}
async function toggleLive() {
  try {
    if (liveStatus.value === 'live') {
      const resp: any = await window.electronApi?.popup.confirm(
        '确定结束直播？',
        '结束直播后将生成本场数据报告。',
        { confirmBtn: { content: '确认结束', theme: 'danger' }, cancelBtn: { content: '取消' }, contextId: 'live-stop-confirm' }
      );
      const ok = resp?.result === true || resp === true;
      if (!ok) return;
      const currentLiveId = liveStore.liveId;
      if (!currentLiveId) return;

      const res = await fetch(new URL('/api/acfun/live/stop', getApiBase()).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveId: currentLiveId })
      });
      const result = await res.json();
      if (result && result.success) {
        liveStore.handleLiveStop();
        MessagePlugin.success('直播已结束');
        summaryOverlayVisible.value = true;
        summaryLoading.value = true;
        try {
          const sres = await fetch(new URL('/api/acfun/live/summary', getApiBase()).toString() + `?liveId=${encodeURIComponent(String(currentLiveId))}`);
          const sjson = await sres.json();
          if (sjson && sjson.success) {
            summaryData.value = sjson.data || {};
          }
        } catch {}
        summaryLoading.value = false;
      }
    } else {
       MessagePlugin.info('请前往首页或使用OBS推流开始直播');
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
}

async function updateRoomInfo(title: string, coverFile?: string) {
  if (!String(title || '').trim()) return;
  try {
    if (coverFile && !/^data:image\/jpeg/i.test(String(coverFile))) {
      MessagePlugin.error('封面仅支持 JPG 格式')
      return
    }
    const currentLiveId = liveStore.liveId;
    if (!currentLiveId) {
      syncCreateDraft(title, coverFile);
      MessagePlugin.info('未开播，已更新本地信息');
      return;
    }
    const res = await fetch(new URL('/api/acfun/live/update', getApiBase()).toString(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        coverFile: coverFile || '',
        liveId: currentLiveId
      })
    });
    const result = await res.json();
    if (result && result.success) {
      syncCreateDraft(title, coverFile);
      MessagePlugin.success('房间更新信息已推送，视审核情况等待生效');
    } else {
      MessagePlugin.error(String(result?.error || '更新失败'));
    }
  } catch (e: any) {
    MessagePlugin.error(String(e?.message || '网络错误'));
  }
}

 



function openEditDialog() {
  editForm.value = { title: roomTitle.value || '', cover: roomCover.value || '' };
  editDialogVisible.value = true;
}

async function confirmEditInfo() {
  const resp: any = await window.electronApi?.popup.confirm(
    '确认修改信息？',
    '将当前标题和封面应用到房间信息，是否确认？',
    { confirmBtn: { content: '确认', theme: 'primary' }, cancelBtn: { content: '取消' }, contextId: 'live-edit-confirm' }
  );
  const valid = await editFormRef.value?.validate();
  if (!valid) return;
  const ok = resp?.result === true || resp === true;
  if (!ok) return;
  await updateRoomInfo(editForm.value.title, editForm.value.cover);
  editDialogVisible.value = false;
}

async function sendMessage() {
  if (!inputMessage.value.trim()) return;
  const content = inputMessage.value.trim().slice(0, 50);
  const uid = accountStore.userInfo?.userID ? String(accountStore.userInfo.userID) : '';
  if (!uid) {
    MessagePlugin.error('请先登录');
    return;
  }
  try {
    let liveIdStr = String((displayRoom.value as any)?.liveId || liveStore.liveId || '');
    if (!liveIdStr && isMyRoom.value) {
      try { await liveStore.ensureLiveId(); } catch {}
      liveIdStr = String((displayRoom.value as any)?.liveId || liveStore.liveId || '');
    }
    if (!liveIdStr) {
      MessagePlugin.error('当前未直播或未获取到房间ID');
      return;
    }
    const res = await fetch(new URL('/api/acfun/danmu/send', getApiBase()).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liveId: liveIdStr, content })
    });
    const result = await res.json();
    if (result && result.success) {
      MessagePlugin.success('弹幕已发送');
      inputMessage.value = '';
    } else {
      MessagePlugin.error(String(result?.error || '发送失败'));
    }
  } catch (e: any) {
    MessagePlugin.error(String(e?.message || '网络错误'));
  }
}

function onInputKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Enter' && ev.shiftKey) {
    ev.preventDefault();
    ev.stopPropagation();
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      isAtBottom.value = true;
      newMsgCount.value = 0;
    }
  });
}

function scrollToBottomAnimated() {
  const el = chatContainer.value;
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  isAtBottom.value = true;
  newMsgCount.value = 0;
}

function updateScrollState() {
  const el = chatContainer.value;
  if (!el) return;
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 8;
  isAtBottom.value = nearBottom;
  if (nearBottom) {
    newMsgCount.value = 0;
  }
  if (userMenuVisible.value) { updateUserMenuPosition(); }
}

// User context menu
const userMenuVisible = ref(false);
const userMenuX = ref(0);
const userMenuY = ref(0);
const selectedUserId = ref<number | null>(null);
const selectedUserName = ref('');
const kickConfirmVisible = ref(false);
const kickTargetName = ref('');
const selectedAnchorEl = ref<HTMLElement | null>(null);
const autoScrollTimer = ref<NodeJS.Timeout | null>(null);
const myUidNum = computed(() => Number(accountStore.userInfo?.userID || 0));
const currentRoom = computed(() => roomStore.getRoomById(currentRoomId.value || ''));
const myManagerState = computed(() => Number(currentRoom.value?.myManagerState || 0));
const selectedIsSelf = computed(() => Number(selectedUserId.value || 0) === myUidNum.value);
const showSetManager = computed(() => isMyRoom.value && !selectedIsSelf.value);
const showKickUser = computed(() => ((isMyRoom.value || myManagerState.value === 3) && !selectedIsSelf.value));
let outsideHandler: any = null;
let outsideClickHandler: any = null;
let giftCollapseTimer: NodeJS.Timeout | null = null;
let userMenuOutsideHandler: any = null;

function openUserMenu(msg: any, ev: MouseEvent) {
  selectedUserId.value = Number(msg?.userId || 0) || null;
  selectedUserName.value = String(msg?.nickname || '');
  selectedAnchorEl.value = (ev.currentTarget as HTMLElement) || (ev.target as HTMLElement) || null;
  updateUserMenuPosition();
  userMenuVisible.value = true;
}

function hideUserMenu() { userMenuVisible.value = false; }

function updateUserMenuPosition() {
  const el = selectedAnchorEl.value;
  const container = document.querySelector('.right-main-area') as HTMLElement;
  if (!el || !container) return;
  const rect = el.getBoundingClientRect();
  const crect = container.getBoundingClientRect();
  const left = rect.left - crect.left;
  const top = rect.bottom - crect.top + 4;
  userMenuX.value = Math.round(left);
  userMenuY.value = Math.round(top);
  const visible = rect.bottom > crect.top && rect.top < crect.bottom;
  if (!visible) { userMenuVisible.value = false; }
}

async function setAsManager() {
  try {
    const uid = String(selectedUserId.value || '');
    if (!uid) return;
    const res = await fetch(new URL('/api/acfun/manager/add', getApiBase()).toString(), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ managerUID: uid })
    });
    const result = await res.json();
    if (result && result.success) {
      MessagePlugin.success(`已设为房管：${selectedUserName.value}`);
      try { await liveStore.fetchWatchingListForRoom(currentRoomId.value || ''); } catch {}
      hideUserMenu();
    } else {
      MessagePlugin.error(String(result?.error || '操作失败，请重试'));
    }
  } catch (e: any) {
    MessagePlugin.error(String(e?.message || '网络错误'));
  }
}

function promptKick() {
  kickTargetName.value = selectedUserName.value || '';
  kickConfirmVisible.value = true;
  hideUserMenu();
}

async function openUserPage() {
  try {
    const uid = String(selectedUserId.value || '');
    if (!uid) return;
    const url = `https://www.acfun.cn/u/${uid}`;
    if ((window as any).electronApi?.system?.openExternal) {
      await (window as any).electronApi?.system.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
    hideUserMenu();
  } catch {}
}

async function confirmKick() {
  try {
    const liveID = String(liveStore.liveId || '');
    const kickedUID = String(selectedUserId.value || '');
    if (!liveID || !kickedUID) {
      MessagePlugin.error('信息不完整');
      return;
    }
    const res = await fetch(new URL('/api/acfun/manager/kick', getApiBase()).toString(), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ liveID, kickedUID, kickType: 'author' })
    });
    const result = await res.json();
    if (result && result.success) {
      MessagePlugin.success(`已将 ${kickTargetName.value} 踢出直播间`);
      kickConfirmVisible.value = false;
    } else {
      MessagePlugin.error('操作失败，请重试');
    }
  } catch (e: any) {
    MessagePlugin.error('操作失败，请重试');
  }
}

function onGiftMouseLeave() {
  try {
    if (giftCollapseTimer) { clearTimeout(giftCollapseTimer); giftCollapseTimer = null; }
    if (leaderboardExpanded.value) {
      giftCollapseTimer = setTimeout(() => {
        leaderboardExpanded.value = false;
        giftCollapseTimer = null;
      }, 2000) as unknown as NodeJS.Timeout;
    }
  } catch {}
}

function onGiftMouseEnter() {
  try { if (giftCollapseTimer) { clearTimeout(giftCollapseTimer); giftCollapseTimer = null; } } catch {}
}

watch(() => messages.value.length, () => {
  if (isAtBottom.value) {
    scrollToBottom();
  } else {
    newMsgCount.value += 1;
  }
});

watch(currentRoomId, (rid) => {
  if (rid) {
    try { liveStore.loadRoomMessageHistory(rid) } catch {}
  }
}, { immediate: true })

onMounted(() => {
  liveStore.startPolling();
  durationTimer.value = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.addEventListener('scroll', updateScrollState);
      chatContainer.value.addEventListener('mouseenter', () => {
        if (autoScrollTimer.value) { clearTimeout(autoScrollTimer.value); autoScrollTimer.value = null; }
      });
      chatContainer.value.addEventListener('mouseleave', () => {
        if (autoScrollTimer.value) { clearTimeout(autoScrollTimer.value); }
        autoScrollTimer.value = setTimeout(() => { scrollToBottomAnimated(); }, 6000);
      });
      updateScrollState();
    }
  });
  nextTick(() => { scrollToBottom(); });
  // 初次拉取礼物榜数据，结束后 giftLoading=false
  const rid = currentRoomId.value || '';
  if (rid) {
    giftLoading.value = true;
    liveStore.fetchWatchingListForRoom(rid).finally(() => { giftLoading.value = false; });
  } else {
    giftLoading.value = false;
  }
  // 收起机制改为 mouseleave（见模板 gift-leaderboard 容器），不再注册 document 级外部点击监听
  userMenuOutsideHandler = (ev: PointerEvent) => {
    try {
      if (!userMenuVisible.value) return;
      const target = ev.target as Node;
      const pop = document.querySelector('.user-context-popover') as HTMLElement | null;
      const anchor = selectedAnchorEl.value;
      const path = (ev as any).composedPath ? (ev as any).composedPath() as Node[] : [];
      const inPopover = !!(pop && (pop.contains(target) || (path.length && path.includes(pop))));
      const inAnchor = !!(anchor && (anchor.contains(target) || (path.length && path.includes(anchor))));
      if (!inPopover && !inAnchor) {
        userMenuVisible.value = false;
      }
    } catch {}
  };
  document.addEventListener('pointerdown', userMenuOutsideHandler, { capture: true });
});

onUnmounted(() => {
  if (durationTimer.value) clearInterval(durationTimer.value);
  liveStore.stopPolling();
  try { chatContainer.value?.removeEventListener('scroll', updateScrollState); } catch {}
  try { chatContainer.value?.removeEventListener('mouseenter', () => {}); } catch {}
  try { chatContainer.value?.removeEventListener('mouseleave', () => {}); } catch {}
  if (autoScrollTimer.value) { try { clearTimeout(autoScrollTimer.value); } catch {} autoScrollTimer.value = null }
  // 无 document 监听需移除
  if (giftCollapseTimer) { try { clearTimeout(giftCollapseTimer); } catch {} giftCollapseTimer = null }
  try { document.removeEventListener('pointerdown', userMenuOutsideHandler as any); } catch {}
});

function onAvatarError(e: Event) {
  const t = e.target as HTMLImageElement
  if (t) t.src = '/default-avatar.png'
}

const summaryOverlayVisible = ref(false);
const summaryLoading = ref(false);
const summaryData = ref<any>({});
</script>

<style scoped>
.t-statistic-content{
  font-size: 9px!important;
}
.live-manage-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background-color: var(--td-bg-color-page);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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

.title-with-status {
  display: flex;
  align-items: center;
  gap: 8px;
}


.content-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* Left Sidebar */
.left-sidebar {
  width: 320px;
  background-color: #FFFFFF;
  border-right: 1px solid #E7E7E7;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 12px;
  flex-shrink: 0;
}

/* Metadata Section */
.metadata-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 */
  border-radius: 12px;
  overflow: hidden;
  background-color: #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 让封面裁剪组件填充缩略容器并可见 */
.thumbnail-container :deep(.cover-cropper) { position: absolute; inset: 0; }
.thumbnail-container :deep(.cover-cropper .uploader) { width: 100%; height: 100%; }

.cover-readonly { position: absolute; inset: 0; }
.cover-readonly img { width: 100%; height: 100%; object-fit: cover; }
.placeholder-wrapper { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; }
.placeholder-text { color:#595959; font-size:14px }


.live-status-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-block;
}


.section-subtitle { font-size: 13px; font-weight: 600; color: var(--td-text-color-primary); margin: 8px 0; }

/* Control Section */
.control-section { display: flex; flex-direction: column; gap: 20px; }
.end-stream-btn { border-radius: 8px; font-weight: 600; }

.custom-stat {
  display: flex;
  flex-direction: column;
  width: 60px;
}

.custom-stat .stat-title {
  font-size: 12px;
  text-align: center;
  color: var(--td-text-color-secondary);
}

.custom-stat .stat-value {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  color: var(--td-text-color-primary);
}

/* Plugin Section */
.plugin-section {
  margin-top: auto;
}


.plugin-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.plugin-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.plugin-card.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.plugin-card:hover {
  background-color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.plugin-card:hover .plugin-icon {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.plugin-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  transition: all 0.3s;
}
.plugin-icon img{
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.plugin-card.is-running .plugin-icon {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.plugin-name {
  font-size: 11px;
  color: #595959;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 64px;
}

/* Right Main Area */
.right-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
  width: 100px;
  position: relative;
}

/* Gift Leaderboard */
.gift-leaderboard {
  padding: 20px 32px;
  border-bottom: 1px solid #F0F0F0;
}

.leaderboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.leaderboard-title { font-size: 14px; font-weight: 600; color: var(--td-text-color-primary); }


.leaderboard-content { overflow: hidden; }
.leaderboard-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 8px;
  align-items: center;
  overflow-x: hidden;
  overflow-y: hidden;
}

.leaderboard-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 100%;
  overflow-y: auto;
}

.leaderboard-vertical-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding:6px
}

.leaderboard-vertical-item:hover {
  background: var(--td-bg-color-component-hover, #F5F7FA);
  border-radius: 4px;
}

.leaderboard-vertical-item img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid #E0E0E0;
}

.lv-name { font-size: 12px; color: var(--td-text-color-primary); }
.lv-value { font-size: 12px; color: var(--td-text-color-secondary); }

.leaderboard-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  cursor: pointer;
}

.avatar-wrapper {
  position: relative;
  width: 24px;
  height: 24px;
}

.leaderboard-item img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #E0E0E0;
  cursor: pointer;
}

/* Top 3 Styles */
.leaderboard-item.rank-1 img { border-color: #FFD700; }
.leaderboard-item.rank-2 img { border-color: #C0C0C0; }
.leaderboard-item.rank-3 img { border-color: #CD7F32; }

.rank-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background-color: #1D1D1D;
  color: white;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #FFFFFF;
}

.leaderboard-item.rank-1 .rank-badge { background-color: #FFD700; color: #8B4513; }
.leaderboard-item.rank-2 .rank-badge { background-color: #C0C0C0; color: #333; }
.leaderboard-item.rank-3 .rank-badge { background-color: #CD7F32; color: #fff; }

.user-tooltip {
  font-size: 12px;
  color: #595959;
  max-width: 64px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-leaderboard {
  color: #8C8C8C;
  font-size: 14px;
  padding: 10px 0;
}

/* Chat Stream */
.chat-stream {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #FFFFFF;
}

.chat-empty {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8C8C8C;
}

.chat-message {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.chat-message.is-host {
  align-self: flex-end;
}

.message-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.message-bubble {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-sender {
  font-size: 12px;
  color: #8C8C8C;
}
.manager-shield { margin-left: 6px; font-size: 12px; }
.sender-medal { margin-left: 6px; font-size: 12px; color: var(--td-text-color-secondary); }

.chat-message.is-host .message-sender {
  text-align: right;
}

.message-content {
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

/* Audience Message */
.chat-message:not(.is-host) .message-content {
  background-color: #F0F2F5;
  color: #000000;
  border-top-left-radius: 2px;
}

.message-content:hover {
  filter: brightness(0.98);
}

/* Host Message */
.chat-message.is-host .message-content {
  background-color: #1890FF;
  color: #FFFFFF;
  border-top-right-radius: 2px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.25);
}

.chat-message.is-host .message-content:hover {
  box-shadow: 0 3px 12px rgba(24, 144, 255, 0.35);
}

/* Input Area */
.input-area {
  padding: 20px 32px;
  background-color: #FFFFFF;
  border-top: 1px solid #F0F0F0;
}
.user-context-popover {
  position: absolute;
  z-index: 10;
  background: #FFFFFF;
  border: 1px solid #E7E7E7;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  min-width: 128px;
}
.popover-item { padding: 8px 12px; font-size: 12px; color: var(--td-text-color-primary); cursor: pointer; }
.popover-item:hover { background: #F5F7FA; }
.popover-item.danger { color: #D54941; }

.new-messages-bubble {
  position: absolute;
  left: 50%;
  bottom: 84px;
  transform: translateX(-50%);
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.12);
  padding: 8px 12px;
  font-size: 12px;
  color: var(--td-text-color-primary);
  cursor: pointer;
  user-select: none;
}

.summary-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.summary-card {
  width: 560px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.2);
  padding: 24px;
}
.summary-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: var(--td-text-color-primary); }
.summary-loading { font-size: 14px; color: var(--td-text-color-secondary); text-align: center; }
.summary-content { display: flex; flex-direction: column; gap: 8px; }
.summary-row { display: flex; align-items: center; justify-content: space-between; font-size: 14px; }

.chat-input :deep(.t-input) {
  background-color: #F5F7FA; /* Light grey background */
  border: none;
  border-radius: 24px;
  padding: 8px 16px;
}

.chat-input :deep(.t-input:focus-within) {
  background-color: #FFFFFF;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
</style>
.lv-text { display: flex; flex-direction: column; gap: 2px; }
.lv-name { font-size: 12px; color: var(--td-text-color-primary); }
.lv-value { font-size: 12px; color: var(--td-text-color-secondary); }
