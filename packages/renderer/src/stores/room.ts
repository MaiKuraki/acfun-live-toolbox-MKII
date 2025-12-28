import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { RoomStatusEventPayload } from '../types/events';
import { GlobalPopup } from '../services/globalPopup';
import { reportReadonlyUpdate } from '../utils/readonlyReporter';

// 定义我们自己的房间状态类型
export type RoomStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'closed';

// 定义房间接口，不直接扩展LiveRoomInfo以避免类型冲突
export interface Room {
  id: string;
  liveId: string;
  liverUID: string;
  title: string;
  coverUrl: string;
  onlineCount: number;
  status: RoomStatus; // 使用我们自己的状态类型
  likeCount: number;
  startTime: number;
  connectedAt?: number | null;
  lastEventAt?: number | null;
  streamer: {
    userId: string;
    userName: string;
    avatar: string;
    level: number;
  };
  category: string;
  subCategory: string;
  name: string;
  uperName: string;
  avatar?: string;
  isLive: boolean;
  viewerCount: number;
  lastUpdate: Date;
  url: string;
  // 扩展字段
  priority?: number;
  label?: string;
  autoConnect?: boolean;
  notifyOnLiveStart?: boolean;
  streamInfo?: any;
  myManagerState?: number;
}

export interface RoomStats {
  totalRooms: number;
  liveRooms: number;
  totalViewers: number;
  lastUpdateTime: Date;
}

export const useRoomStore = defineStore('room', () => {
  // 状态
  const rooms = ref<Room[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const autoRefresh = ref(true);
  const refreshInterval = ref(30000); // 30秒
  const isRefreshing = ref(false);
  let hasStartupNotified = false;

  // 计算属性
  const liveRooms = computed(() => rooms.value.filter(room => room.isLive));
  const offlineRooms = computed(() => rooms.value.filter(room => !room.isLive));
  const totalViewers = computed(() => 
    liveRooms.value.reduce((sum, room) => sum + room.viewerCount, 0)
  );
  
  const stats = computed<RoomStats>(() => ({
    totalRooms: rooms.value.length,
    liveRooms: liveRooms.value.length,
    totalViewers: totalViewers.value,
    lastUpdateTime: new Date(),
  }));

  // 变更订阅：房间列表发生变化时，调用统一只读上报
  watch(rooms, () => {
    try {
      reportReadonlyUpdate({
        rooms: {
          list: rooms.value,
          liveRoomsCount: liveRooms.value.length,
          totalViewers: totalViewers.value,
        }
      });
    } catch {}
  }, { deep: true });

  // 动作
  async function loadRooms() {
    try {
      isLoading.value = true;
      error.value = null;
      // 开发环境保护：在纯 Vite 预览中，window.electronApi 可能不存在
      if (!window.electronApi?.room) {
        return
       
      }
       // 使用真实的preload API获取房间列表
      const result = await window.electronApi?.room.list();
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      if ('rooms' in result) {
        const savedRooms = readRoomsFromStorage();
        rooms.value = savedRooms;
        const ids = result.rooms.map((r: any) => String(r.roomId));
        const missingIds = ids.filter(id => !rooms.value.find(x => x.id === id));
        isLoading.value = false;
        try {
          const tasks = missingIds.map(async (id) => {
            try {
              const detailRes = await window.electronApi?.room.details(id);
              if (detailRes && detailRes.success && detailRes.data) {
                const d = detailRes.data;
                const mappedStatus = mapToRoomStatus(d.status || 'disconnected');
                const newRoom: Room = {
                  id: String(d.roomId || id),
                  liveId: typeof d.liveId === 'string' && d.liveId ? String(d.liveId) : '',
                  liverUID: String(d.streamer?.userId || String(id)),
                  title: typeof d.title === 'string' ? d.title : `直播间 ${id}`,
                  coverUrl: typeof d.coverUrl === 'string' ? d.coverUrl : '',
                  onlineCount: typeof d.viewerCount === 'number' ? d.viewerCount : 0,
                  status: mappedStatus,
                  likeCount: typeof d.likeCount === 'number' ? d.likeCount : 0,
                  startTime: typeof d.startTime === 'number' ? d.startTime : Date.now(),
                  connectedAt: undefined,
                  lastEventAt: undefined,
                  streamer: {
                    userId: String(d.streamer?.userId || String(id)),
                    userName: String(d.streamer?.userName || `主播${id}`),
                    avatar: String(d.streamer?.avatar || ''),
                    level: typeof d.streamer?.level === 'number' ? d.streamer.level : 0
                  },
                  category: '游戏',
                  subCategory: '其他游戏',
                  name: `直播间 ${id}`,
                  uperName: String(d.streamer?.userName || `主播${id}`),
                  avatar: String(d.streamer?.avatar || ''),
                  isLive: mappedStatus === 'connected',
                  viewerCount: typeof d.viewerCount === 'number' ? d.viewerCount : 0,
                  lastUpdate: new Date(),
                  url: (typeof d.liveId === 'string' && d.liveId ? `https://live.acfun.cn/live/${String(d.liveId)}` : ''),
                  priority: 5,
                  label: '',
                  autoConnect: false,
                  notifyOnLiveStart: false
                };
                rooms.value.push(newRoom);
                saveRoomsToStorage();
              }
            } catch (e) {
              console.warn(`details failed for room ${id}:`, e);
            }
          });
          await Promise.allSettled(tasks);
        } catch {}
      }
      
      // 启动首次刷新：更新 isLive，并基于最新状态执行自动连接与开播通知
      const prevLiveMap = new Map<string, boolean>(rooms.value.map(r => [r.id, !!r.isLive]));
      try {
        await refreshRoomStatus();
      } catch {}
      
      // 自动连接：仅在房间直播中且启用自动连接时连接采集
      try {
        const toConnect = rooms.value.filter(r => r.autoConnect && r.isLive);
        await Promise.allSettled(toConnect.map(async (r) => {
          try { await window.electronApi?.room.connect(r.id); } catch {}
        }));
      } catch {}
      
      try {
        const accountRaw = localStorage.getItem('userInfo');
        const myUid = accountRaw ? Number(JSON.parse(accountRaw).userID || 0) : 0;
        rooms.value.forEach(r => {
          const before = prevLiveMap.get(r.id) === true;
          const after = !!r.isLive === true;
          const enabled = !!(r as any).notifyOnLiveStart;
          const liverUidNum = Number(String(r.liverUID || r.streamer?.userId || '0')) || 0;
          if (!before && after && enabled && (myUid === 0 || myUid !== liverUidNum)) {
            emitLiveStartNotification(r, myUid);
          }
        });
      } catch {}

      try {
        if (!hasStartupNotified) {
          const accountRaw = localStorage.getItem('userInfo');
          const myUid = accountRaw ? Number(JSON.parse(accountRaw).userID || 0) : 0;
          rooms.value.forEach(r => {
            const before = prevLiveMap.get(r.id) === true;
            const after = !!r.isLive === true;
            const enabled = !!(r as any).notifyOnLiveStart;
            const liverUidNum = Number(String(r.liverUID || r.streamer?.userId || '0')) || 0;
            if (before && after && enabled && (myUid === 0 || myUid !== liverUidNum)) {
              emitLiveStartNotification(r, myUid);
            }
          });
          hasStartupNotified = true;
        }
      } catch {}
    } catch (err) {
      console.error('Failed to load rooms:', err);
      error.value = err instanceof Error ? err.message : '加载房间列表失败';
    } finally {
      // isLoading 在上文合并后已置为 false；此处保持幂等
      isLoading.value = false;
    }
  }

  async function refreshRoomStatus() {
    if (rooms.value.length === 0) return;
    // 开发环境保护：在纯 Vite 预览中，window.electronApi 可能不存在
    if (!window.electronApi?.room) {
      console.warn('[room] electronApi?.room 未初始化，跳过状态刷新（开发预览环境）');
      return;
    }
    
    if (isRefreshing.value) return;
    isRefreshing.value = true;
    try {
      const prevLiveMap = new Map<string, boolean>(rooms.value.map(r => [r.id, !!r.isLive]));
      const detailPromises = rooms.value.map(r => window.electronApi?.room.details(r.id));
      const statusPromises = rooms.value.map(r => window.electronApi?.room.status(r.id));
      const [detailResults, statusResults] = await Promise.all([
        Promise.allSettled(detailPromises),
        Promise.allSettled(statusPromises)
      ]);

      for (let i = 0; i < rooms.value.length; i++) {
        const room = rooms.value[i];
        const next: Partial<Room> = {};

        const st = statusResults[i];
        if (st && st.status === 'fulfilled') {
          const sr: any = st.value;
          if (sr && typeof sr.status === 'string') {
            next.status = mapToRoomStatus(sr.status);
          } else {
            next.status = 'disconnected';
          }
        } else {
          next.status = 'disconnected';
        }

        const dt = detailResults[i];
        if (dt && dt.status === 'fulfilled') {
          const detailRes: any = dt.value;
          if (detailRes && detailRes.success && detailRes.data) {
            const d = detailRes.data;
            next.title = typeof d.title === 'string' ? d.title : room.title;
            next.coverUrl = typeof d.coverUrl === 'string' ? d.coverUrl : room.coverUrl;
            next.isLive = Boolean(d.isLive);
            next.viewerCount = typeof d.viewerCount === 'number' ? d.viewerCount : room.viewerCount;
            next.onlineCount = typeof d.viewerCount === 'number' ? d.viewerCount : room.onlineCount;
            next.likeCount = typeof d.likeCount === 'number' ? d.likeCount : room.likeCount;
            next.startTime = typeof d.startTime === 'number' ? d.startTime : (next.startTime ?? room.startTime);
            next.streamer = {
              userId: d.streamer?.userId || room.streamer.userId,
              userName: d.streamer?.userName || room.streamer.userName,
              avatar: d.streamer?.avatar || room.streamer.avatar,
              level: typeof d.streamer?.level === 'number' ? d.streamer.level : room.streamer.level
            } as Room['streamer'];
          }
        }

        if (Object.keys(next).length) {
          Object.assign(room, next);
        }
      }

      saveRoomsToStorage();

      try {
        const accountRaw = localStorage.getItem('userInfo');
        const myUid = accountRaw ? Number(JSON.parse(accountRaw).userID || 0) : 0;
        rooms.value.forEach(r => {
          const before = prevLiveMap.get(r.id) === true;
          const after = !!r.isLive === true;
          const enabled = !!(r as any).notifyOnLiveStart;
          const liverUidNum = Number(String(r.liverUID || r.streamer?.userId || '0')) || 0;
          if (!before && after && enabled && (myUid === 0 || myUid !== liverUidNum)) {
            emitLiveStartNotification(r, myUid);
          }
        });
      } catch {}
    } catch (err) {
      console.error('Failed to refresh room status:', err);
      error.value = err instanceof Error ? err.message : '刷新房间状态失败';
    } finally {
      isRefreshing.value = false;
    }
  }

  function emitLiveStartNotification(r: Room, myUid: number) {
    try {
      const content = `主播 ${r.streamer?.userName || r.uperName || r.title || r.id} 已开播`;
      GlobalPopup.toast(content, { contextId: 'live-start', durationMs: 3000 });
    } catch {}
  }

  async function addRoom(roomUrl: string) {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 从URL中提取房间ID
      const roomId = roomUrl.split('/').pop() || roomUrl;
      
      const roomStatus: RoomStatus = 'disconnected';
      const connectedAt = Date.now();
      const eventCount = 0;
      const lastEventAt = Date.now();
      const isLive = false;
      
      const newRoom: Room = {
        id: roomId,
        liveId: '',
        liverUID: String(roomId),
        title: `直播间 ${roomId}`,
        coverUrl: '',
        onlineCount: 0,
        status: roomStatus,
        likeCount: 0,
        startTime: connectedAt,
        connectedAt: connectedAt,
        lastEventAt: lastEventAt,
        streamer: {
          userId: String(roomId),
          userName: `主播${roomId}`,
          avatar: '',
          level: 1
        },
        category: '游戏',
        subCategory: '其他游戏',
        name: `直播间 ${roomId}`,
        uperName: `主播${roomId}`,
        avatar: '',
        isLive: isLive,
        viewerCount: eventCount,
        lastUpdate: new Date(lastEventAt),
        url: roomUrl,
        priority: 5,
        label: '',
        autoConnect: false
      };
      
      // 检查是否已存在
      const existingIndex = rooms.value.findIndex(room => room.id === newRoom.id);
      if (existingIndex >= 0) {
        rooms.value[existingIndex] = newRoom;
      } else {
        rooms.value.push(newRoom);
      }

      
      try {
        const detailRes = await window.electronApi?.room.details(roomId);
        if (detailRes && detailRes.success && detailRes.data) {
          const d = detailRes.data;
          const mappedStatus = mapToRoomStatus(d.status || newRoom.status);
          updateRoomSettings(roomId, {
            liveId: typeof d.liveId === 'string' && d.liveId ? String(d.liveId) : undefined,
            title: typeof d.title === 'string' ? d.title : newRoom.title,
            coverUrl: typeof d.coverUrl === 'string' ? d.coverUrl : newRoom.coverUrl,
            status: mappedStatus,
            isLive: Boolean(d.isLive),
            viewerCount: typeof d.viewerCount === 'number' ? d.viewerCount : newRoom.viewerCount,
            onlineCount: typeof d.viewerCount === 'number' ? d.viewerCount : newRoom.onlineCount,
            likeCount: typeof d.likeCount === 'number' ? d.likeCount : newRoom.likeCount,
            startTime: typeof d.startTime === 'number' ? d.startTime : newRoom.startTime,
            streamer: {
              userId: d.streamer?.userId || newRoom.streamer.userId,
              userName: d.streamer?.userName || newRoom.streamer.userName,
              avatar: d.streamer?.avatar || newRoom.streamer.avatar,
              level: typeof d.streamer?.level === 'number' ? d.streamer.level : newRoom.streamer.level
            }
          });

          if (Boolean(d.isLive)) {
            try {
              const result = await window.electronApi?.room.connect(roomId);
              if (!result.success && (result as any).code !== 'already_connected') {
                console.warn(`connect room failed(${(result as any).code || ''}): ${String((result as any).error || '连接房间失败')}`);
              }
            } catch (e) {
              console.warn(`connect room exception: ${String(e)}`);
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch details for new room ${roomId}:`, e);
      }

      saveRoomsToStorage();
      return newRoom;
    } catch (err) {
      console.error('Failed to add room:', err);
      error.value = err instanceof Error ? err.message : '添加房间失败';
      // 不中断流程：保留错误提示，但不抛出以避免阻止后续交互
      return undefined as any;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeRoom(roomId: string) {
    try {
      // 使用真实的preload API断开房间连接
      const result = await window.electronApi?.room.disconnect(roomId);
      
      if (!result.success) {
        // 忽略"房间未连接"错误，因为删除时房间可能本身就是断开的
        if (!result.error?.includes('房间未连接')) {
          console.warn(`Failed to disconnect room ${roomId}:`, result.error);
        }
        // 即使断开连接失败，也从本地列表中移除
      }
      
      const index = rooms.value.findIndex(room => room.id === roomId);
      if (index >= 0) {
        rooms.value.splice(index, 1);
        saveRoomsToStorage();
      }
    } catch (err) {
      console.error('Failed to remove room:', err);
      // 即使API调用失败，也从本地列表中移除
      const index = rooms.value.findIndex(room => room.id === roomId);
      if (index >= 0) {
        rooms.value.splice(index, 1);
        saveRoomsToStorage();
      }
    }
  }

  function clearAllRooms() {
    rooms.value = [];
    saveRoomsToStorage();
  }

  function saveRoomsToStorage() {
    try {
      localStorage.setItem('monitoredRooms', JSON.stringify(rooms.value));
    } catch (err) {
      console.error('Failed to save rooms to storage:', err);
    }
  }

  function readRoomsFromStorage(): Room[] {
    try {
      const raw = localStorage.getItem('monitoredRooms');
      if (!raw) return [];
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      const mapped: Room[] = list.map((r: any) => ({
        id: String(r.id || ''),
        liveId: String(r.liveId || ''),
        liverUID: String(r.liverUID || String(r.id || '')),
        title: typeof r.title === 'string' ? r.title : `直播间 ${r.id || ''}`,
        coverUrl: typeof r.coverUrl === 'string' ? r.coverUrl : '',
        onlineCount: Number(r.onlineCount || 0),
        status: mapToRoomStatus(String(r.status || 'disconnected')),
        likeCount: Number(r.likeCount || 0),
        startTime: Number(r.startTime || Date.now()),
        connectedAt: typeof r.connectedAt === 'number' ? r.connectedAt : null,
        lastEventAt: typeof r.lastEventAt === 'number' ? r.lastEventAt : null,
        streamer: {
          userId: String(r?.streamer?.userId || String(r.id || '')),
          userName: typeof r?.streamer?.userName === 'string' ? r.streamer.userName : `主播${r.id || ''}`,
          avatar: typeof r?.streamer?.avatar === 'string' ? r.streamer.avatar : '',
          level: Number(r?.streamer?.level || 1)
        },
        category: typeof r.category === 'string' ? r.category : '游戏',
        subCategory: typeof r.subCategory === 'string' ? r.subCategory : '其他游戏',
        name: typeof r.name === 'string' ? r.name : `直播间 ${r.id || ''}`,
        uperName: typeof r.uperName === 'string' ? r.uperName : `主播${r.id || ''}`,
        avatar: typeof r.avatar === 'string' ? r.avatar : '',
        isLive: Boolean(r.isLive),
        viewerCount: Number(r.viewerCount || 0),
        lastUpdate: new Date(typeof r.lastUpdate === 'string' ? r.lastUpdate : (r.lastEventAt || Date.now())),
        url: typeof r.url === 'string' ? r.url : (r.liveId ? `https://live.acfun.cn/live/${r.liveId}` : ''),
        priority: Number(r.priority || 5),
        label: typeof r.label === 'string' ? r.label : '',
        autoConnect: Boolean(r.autoConnect),
        notifyOnLiveStart: Boolean((r as any).notifyOnLiveStart),
        streamInfo: (r as any).streamInfo ?? undefined,
        myManagerState: typeof r.myManagerState === 'number' ? Number(r.myManagerState) : undefined
      })) as Room[];
      // 归一化：主播相关ID一致，清除错误的liveId
      const normalized = mapped.map(x => {
        const id = String(x.id || '');
        if (String(x.liverUID || '') !== id) x.liverUID = id;
        if (String(x.streamer.userId || '') !== id) x.streamer.userId = id;
        if (!x.liveId || String(x.liveId) === id) {
          x.liveId = '';
          x.url = '';
        }
        return x;
      });
      try { localStorage.setItem('monitoredRooms', JSON.stringify(normalized)); } catch {}
      return normalized;
    } catch (e) {
      console.warn('Failed to read rooms from storage:', e);
      return [];
    }
  }

  function getRoomById(roomId: string): Room | undefined {
    return rooms.value.find(room => room.id === roomId);
  }

  async function setPriority(roomId: string, priority: number) {
    try {
      const st = await window.electronApi?.room.status(roomId);
      let connected = false;
      if (st && 'status' in st && typeof (st as any).status === 'string') {
        connected = String((st as any).status).toLowerCase() === 'connected';
      }
      if (connected) {
        const result = await window.electronApi?.room.setPriority(roomId, priority);
        if (!result.success) {
          throw new Error(result.error || '设置优先级失败');
        }
      }
      const room = rooms.value.find(r => r.id === roomId);
      if (room) {
        room.priority = priority;
        saveRoomsToStorage();
      }
    } catch (err) {
      try { console.warn('Set room priority deferred:', err instanceof Error ? err.message : String(err)); } catch {}
    }
  }

  async function setLabel(roomId: string, label: string) {
    try {
      // 使用真实的preload API设置房间标签
      const result = await window.electronApi?.room.setLabel(roomId, label);
      
      if (!result.success) {
        throw new Error(result.error || '设置标签失败');
      }
      
      const room = rooms.value.find(r => r.id === roomId);
      if (room) {
        room.label = label;
        saveRoomsToStorage();
      }
    } catch (err) {
      console.error('Failed to set room label:', err);
      throw err;
    }
  }

  function updateRoomSettings(roomId: string, settings: Partial<Room>) {
    const liveKey = typeof settings.liveId === 'string' ? settings.liveId : undefined;
    const index = rooms.value.findIndex(room => room.id === roomId);
    if (index >= 0) {
      const next = { ...rooms.value[index], ...settings } as Room;
      if (liveKey) next.liveId = liveKey;
      rooms.value[index] = next;
      saveRoomsToStorage();
    }
  }

  function setMyManagerState(roomId: string, state: number) {
    const index = rooms.value.findIndex(room => room.id === roomId);
    if (index >= 0) {
      const next = { ...rooms.value[index], myManagerState: Number(state) } as Room;
      rooms.value[index] = next;
      saveRoomsToStorage();
    }
  }

  // 状态映射函数
  function mapToRoomStatus(status: string): RoomStatus {
    switch (status) {
      case 'connected':
      case 'open':
        return 'connected';
      case 'connecting':
      case 'connecting...':
        return 'connecting';
      case 'disconnected':
      case 'closed':
        return 'disconnected';
      case 'error':
        return 'error';
      default:
        return 'disconnected';
    }
  }

  // 更新房间状态
  function updateRoomStatus(roomId: string, status: string) {
    const room = rooms.value.find(r => r.id === roomId);
    if (room) {
      room.status = mapToRoomStatus(status);
      saveRoomsToStorage();
    }
  }

  // 在收到新弹幕/事件时，更新房间的最后活动时间
  function touchRoomActivity(roomId: string, ts?: number) {
    const index = rooms.value.findIndex(r => r.id === roomId);
    if (index < 0) return;
    const t = typeof ts === 'number' ? ts : Date.now();
    rooms.value[index] = {
      ...rooms.value[index],
      lastEventAt: t,
      lastUpdate: new Date(t)
    };
    saveRoomsToStorage();
  }

    // 自动刷新功能
  let refreshTimer: NodeJS.Timeout | null = null;

  function startAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    
    if (autoRefresh.value && refreshInterval.value > 0) {
      refreshTimer = setInterval(() => {
        refreshRoomStatus();
      }, refreshInterval.value);
    }
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function setAutoRefresh(enabled: boolean, interval?: number) {
    autoRefresh.value = enabled;
    if (interval !== undefined) {
      refreshInterval.value = interval;
    }
    
    if (enabled) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }

  // 初始化
  loadRooms().then(() => {
    if (autoRefresh.value) {
      startAutoRefresh();
    }
      try {
        (window as any).electronApi?.on('room.status', async (msg: RoomStatusEventPayload) => {
          try {
            const rid = String((msg && (msg.roomId || msg.room_id)) || '');
            const st = String((msg && msg.status) || '');
            const liveKey = String((msg && msg.liveId) || '');
            const si = (msg as any)?.streamInfo || null;
            const isManager = (msg as any)?.isManager;
            if (!rid || !st) return;
            if (liveKey) { try { updateRoomSettings(rid, { liveId: liveKey }); } catch {} }
            if (si) { try { updateRoomSettings(rid, { streamInfo: si }); } catch {} }
            if (typeof isManager === 'number' && Number.isFinite(Number(isManager))) {
              try { updateRoomSettings(rid, { myManagerState: Number(isManager) as any }); } catch {}
            }
            if (st === 'connected' && !liveKey) {
              try {
                const d = await (window as any).electronApi?.room?.details?.(rid);
                if (d && d.success && d.data && typeof d.data.liveId === 'string' && d.data.liveId) {
                  try { updateRoomSettings(rid, { liveId: String(d.data.liveId) }); } catch {}
                }
              } catch {}
            }
            updateRoomStatus(rid, st);
          if (st === 'connected') {
            const r = rooms.value.find(x => x.id === rid);
            if (r) {
              r.isLive = true;
              r.lastUpdate = new Date();
              saveRoomsToStorage();
            }
          } else if (st === 'disconnected' || st === 'closed') {
            const r = rooms.value.find(x => x.id === rid);
            if (r) {
              r.isLive = false;
              r.lastUpdate = new Date();
              saveRoomsToStorage();
            }
          }
        } catch {}
      });
    } catch {}
  });

  return {
    // 状态
    rooms,
    isLoading,
    error,
    autoRefresh,
    refreshInterval,
    
    // 计算属性
    liveRooms,
    offlineRooms,
    totalViewers,
    stats,
    
    // 动作
    loadRooms,
    refreshRoomStatus,
    refreshRooms: refreshRoomStatus, // 别名
    addRoom,
    removeRoom,
    clearAllRooms,
    getRoomById,
    updateRoomSettings,
    setMyManagerState,
    updateRoomStatus,
    touchRoomActivity,
    setPriority,
    setLabel,
    setAutoRefresh,
    startAutoRefresh,
    stopAutoRefresh,
  };
});
