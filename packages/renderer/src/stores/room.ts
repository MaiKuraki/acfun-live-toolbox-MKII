import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
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
        console.warn('[room] electronApi.room 未初始化，使用本地存储恢复房间列表');
        rooms.value = readRoomsFromStorage();
        isLoading.value = false;
        return;
      }
      
      // 使用真实的preload API获取房间列表
      const result = await window.electronApi.room.list();
      
      if ('error' in result) {
        throw new Error(result.error);
      }
      
      if ('rooms' in result) {
        // 转换API返回的数据格式为我们的Room格式（仅连接中的房间）
        const connectedRooms: Room[] = result.rooms.map((apiRoom: any) => ({
          id: apiRoom.roomId,
          liveId: apiRoom.roomId,
          liverUID: `uid_${apiRoom.roomId}`,
          title: `直播间 ${apiRoom.roomId}`,
          coverUrl: '',
          onlineCount: 0,
          status: mapToRoomStatus(apiRoom.status),
          likeCount: 0,
          startTime: apiRoom.connectedAt || Date.now(),
          connectedAt: apiRoom.connectedAt || null,
          lastEventAt: apiRoom.lastEventAt || null,
          streamer: {
            userId: `uid_${apiRoom.roomId}`,
            userName: `主播${apiRoom.roomId}`,
            avatar: '',
            level: 1
          },
          category: '游戏',
          subCategory: '其他游戏',
          name: `直播间 ${apiRoom.roomId}`,
          uperName: `主播${apiRoom.roomId}`,
          avatar: '',
          isLive: mapToRoomStatus(apiRoom.status) === 'connected',
          viewerCount: 0,
          lastUpdate: new Date(apiRoom.lastEventAt || Date.now()),
          url: `https://live.acfun.cn/live/${apiRoom.roomId}`,
          priority: 5,
          label: '',
          autoConnect: false
        }));
        // 合并本地存储的房间（未连接的房间也保留在列表）
        const savedRooms = readRoomsFromStorage();
        const mergedMap = new Map<string, Room>();
        for (const r of savedRooms) mergedMap.set(r.id, r);
        for (const r of connectedRooms) mergedMap.set(r.id, r);
        rooms.value = Array.from(mergedMap.values());
        // 先结束加载，随后异步刷新详情和状态，不阻塞首屏
        isLoading.value = false;
        (async () => {
          try {
            const detailPromises = rooms.value.map(async (room) => {
              try {
                const detailRes = await window.electronApi.room.details(room.id);
                if (detailRes && detailRes.success && detailRes.data) {
                  const d = detailRes.data;
                  const mappedStatus = mapToRoomStatus(d.status || room.status);
                  updateRoomSettings(room.id, {
                    title: typeof d.title === 'string' ? d.title : room.title,
                    coverUrl: typeof d.coverUrl === 'string' ? d.coverUrl : room.coverUrl,
                    status: mappedStatus,
                    isLive: mappedStatus === 'connected',
                    viewerCount: typeof d.viewerCount === 'number' ? d.viewerCount : room.viewerCount,
                    onlineCount: typeof d.viewerCount === 'number' ? d.viewerCount : room.onlineCount,
                    likeCount: typeof d.likeCount === 'number' ? d.likeCount : room.likeCount,
                    startTime: typeof d.startTime === 'number' ? d.startTime : room.startTime,
                    streamer: {
                      userId: d.streamer?.userId || room.streamer.userId,
                      userName: d.streamer?.userName || room.streamer.userName,
                      avatar: d.streamer?.avatar || room.streamer.avatar,
                      level: typeof d.streamer?.level === 'number' ? d.streamer.level : room.streamer.level
                    }
                  });
                }
              } catch (e) {
                console.warn(`Failed to fetch details for room ${room.id}:`, e);
              }
            });
            await Promise.allSettled(detailPromises);
            await refreshRoomStatus();
          } catch (e) {
            console.warn('Async details/status refresh failed:', e);
          }
        })();
      }
      
      // 自动连接：对存储中的房间启用 autoConnect 时尝试连接（后台进行）
      try {
        const autoConnectRooms = rooms.value.filter(r => r.autoConnect);
        (async () => {
          try {
            await Promise.allSettled(autoConnectRooms.map(async (r) => {
              try { await window.electronApi.room.connect(r.id); } catch {}
            }));
            await refreshRoomStatus();
          } catch {}
        })();
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
      console.warn('[room] electronApi.room 未初始化，跳过状态刷新（开发预览环境）');
      return;
    }
    
    try {
      // 并行刷新房间的连接状态和详情信息
      const refreshPromises = rooms.value.map(async (room) => {
        try {
          const [statusRes, detailRes] = await Promise.all([
            window.electronApi.room.status(room.id),
            window.electronApi.room.details(room.id)
          ]);

          let updated: Room = { ...room };

          // 更新状态信息
          if (!('error' in statusRes)) {
            const mapped = mapToRoomStatus(statusRes.status);
            updated.status = mapped;
            updated.isLive = mapped === 'connected';
            updated.lastUpdate = new Date(statusRes.lastEventAt || Date.now());
            // 同步连接时间与最后活动时间，确保页面实时更新
            if (typeof statusRes.connectedAt === 'number') {
              updated.connectedAt = statusRes.connectedAt;
              // 使用连接时间作为开始时间，保持一致
              updated.startTime = statusRes.connectedAt;
            }
            if (typeof statusRes.lastEventAt === 'number') {
              updated.lastEventAt = statusRes.lastEventAt;
            }
            // 保留viewerCount用于观众数显示，不用事件计数覆盖
          } else {
            // 若后端返回错误（如房间未连接/已移除），将状态标记为离线
            updated.status = 'disconnected';
            updated.isLive = false;
            updated.connectedAt = null;
            // 保持最后活动时间不回退，但刷新最后更新时间
            updated.lastUpdate = new Date();
          }

          // 更新详情信息：标题、封面、观众数、点赞数、主播信息
          if (detailRes && detailRes.success && detailRes.data) {
            const d = detailRes.data;
            const mappedStatus = mapToRoomStatus(d.status || updated.status);
            updated = {
              ...updated,
              title: typeof d.title === 'string' ? d.title : updated.title,
              coverUrl: typeof d.coverUrl === 'string' ? d.coverUrl : updated.coverUrl,
              status: mappedStatus,
              isLive: mappedStatus === 'connected',
              viewerCount: typeof d.viewerCount === 'number' ? d.viewerCount : updated.viewerCount,
              onlineCount: typeof d.viewerCount === 'number' ? d.viewerCount : updated.onlineCount,
              likeCount: typeof d.likeCount === 'number' ? d.likeCount : updated.likeCount,
              startTime: typeof d.startTime === 'number' ? d.startTime : updated.startTime,
              streamer: {
                userId: d.streamer?.userId || updated.streamer.userId,
                userName: d.streamer?.userName || updated.streamer.userName,
                avatar: d.streamer?.avatar || updated.streamer.avatar,
                level: typeof d.streamer?.level === 'number' ? d.streamer.level : updated.streamer.level
              }
            } as Room;
          }

          return updated;
        } catch (err) {
          console.warn(`Error refreshing room ${room.id}:`, err);
          return room; // 返回原始房间信息
        }
      });

      rooms.value = await Promise.all(refreshPromises);
      
      // 保存到本地存储
      saveRoomsToStorage();
    } catch (err) {
      console.error('Failed to refresh room status:', err);
      error.value = err instanceof Error ? err.message : '刷新房间状态失败';
    }
  }

  async function addRoom(roomUrl: string) {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 从URL中提取房间ID
      const roomId = roomUrl.split('/').pop() || roomUrl;
      
      // 使用真实的preload API连接房间
      const result = await window.electronApi.room.connect(roomId);
      
      if (!result.success) {
        const code = (result as any).code || '';
        const msg = String((result as any).error || '连接房间失败');
        // 已连接视为非致命，继续后续流程；其他失败也以离线状态继续入列
        if (code !== 'already_connected') {
          console.warn(`connect room failed(${code}): ${msg}`);
        }
      }
      
      // 获取房间状态信息
      const statusResult = await window.electronApi.room.status(roomId);
      
      // 检查状态结果是否包含错误
       let roomStatus: RoomStatus = 'connecting';
       let connectedAt = Date.now();
       let eventCount = 0;
       let lastEventAt = Date.now();
       let isLive = false;
      
      if ('error' in statusResult) {
        console.warn(`Failed to get status for room ${roomId}:`, (statusResult as any).error);
        // 使用默认值（保持离线/连接中状态）
      } else {
         roomStatus = mapToRoomStatus(statusResult.status || 'connecting');
         connectedAt = statusResult.connectedAt || Date.now();
         eventCount = statusResult.eventCount || 0;
         lastEventAt = statusResult.lastEventAt || Date.now();
         isLive = mapToRoomStatus(statusResult.status || '') === 'connected';
       }
      
      const newRoom: Room = {
        id: roomId,
        liveId: roomId,
        liverUID: `uid_${roomId}`,
        title: `直播间 ${roomId}`,
        coverUrl: '',
        onlineCount: 0,
        status: roomStatus,
        likeCount: 0,
        startTime: connectedAt,
        connectedAt: connectedAt,
        lastEventAt: lastEventAt,
        streamer: {
          userId: `uid_${roomId}`,
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

      // 拉取房间详情并更新新房间信息
      try {
        const detailRes = await window.electronApi.room.details(roomId);
        if (detailRes && detailRes.success && detailRes.data) {
          const d = detailRes.data;
          const mappedStatus = mapToRoomStatus(d.status || newRoom.status);
          updateRoomSettings(roomId, {
            title: typeof d.title === 'string' ? d.title : newRoom.title,
            coverUrl: typeof d.coverUrl === 'string' ? d.coverUrl : newRoom.coverUrl,
            status: mappedStatus,
            isLive: mappedStatus === 'connected',
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
      const result = await window.electronApi.room.disconnect(roomId);
      
      if (!result.success) {
        console.warn(`Failed to disconnect room ${roomId}:`, result.error);
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
      return list.map((r: any) => ({
        id: String(r.id || r.liveId || ''),
        liveId: String(r.liveId || r.id || ''),
        liverUID: String(r.liverUID || `uid_${r.id || r.liveId || ''}`),
        title: typeof r.title === 'string' ? r.title : `直播间 ${r.id || r.liveId || ''}`,
        coverUrl: typeof r.coverUrl === 'string' ? r.coverUrl : '',
        onlineCount: Number(r.onlineCount || 0),
        status: mapToRoomStatus(String(r.status || 'disconnected')),
        likeCount: Number(r.likeCount || 0),
        startTime: Number(r.startTime || Date.now()),
        connectedAt: typeof r.connectedAt === 'number' ? r.connectedAt : null,
        lastEventAt: typeof r.lastEventAt === 'number' ? r.lastEventAt : null,
        streamer: {
          userId: String(r?.streamer?.userId || `uid_${r.id || r.liveId || ''}`),
          userName: typeof r?.streamer?.userName === 'string' ? r.streamer.userName : `主播${r.id || r.liveId || ''}`,
          avatar: typeof r?.streamer?.avatar === 'string' ? r.streamer.avatar : '',
          level: Number(r?.streamer?.level || 1)
        },
        category: typeof r.category === 'string' ? r.category : '游戏',
        subCategory: typeof r.subCategory === 'string' ? r.subCategory : '其他游戏',
        name: typeof r.name === 'string' ? r.name : `直播间 ${r.id || r.liveId || ''}`,
        uperName: typeof r.uperName === 'string' ? r.uperName : `主播${r.id || r.liveId || ''}`,
        avatar: typeof r.avatar === 'string' ? r.avatar : '',
        isLive: Boolean(r.isLive),
        viewerCount: Number(r.viewerCount || 0),
        lastUpdate: new Date(typeof r.lastUpdate === 'string' ? r.lastUpdate : (r.lastEventAt || Date.now())),
        url: typeof r.url === 'string' ? r.url : `https://live.acfun.cn/live/${r.id || r.liveId || ''}`,
        priority: Number(r.priority || 5),
        label: typeof r.label === 'string' ? r.label : '',
        autoConnect: Boolean(r.autoConnect)
      })) as Room[];
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
      // 使用真实的preload API设置房间优先级
      const result = await window.electronApi.room.setPriority(roomId, priority);
      
      if (!result.success) {
        throw new Error(result.error || '设置优先级失败');
      }
      
      const room = rooms.value.find(r => r.id === roomId);
      if (room) {
        room.priority = priority;
        saveRoomsToStorage();
      }
    } catch (err) {
      console.error('Failed to set room priority:', err);
      throw err;
    }
  }

  async function setLabel(roomId: string, label: string) {
    try {
      // 使用真实的preload API设置房间标签
      const result = await window.electronApi.room.setLabel(roomId, label);
      
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
    const index = rooms.value.findIndex(room => room.id === roomId);
    if (index >= 0) {
      rooms.value[index] = { ...rooms.value[index], ...settings };
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
    const room = rooms.value.find(r => r.liveId === roomId);
    if (room) {
      room.status = mapToRoomStatus(status);
      saveRoomsToStorage();
    }
  }

  // 在收到新弹幕/事件时，更新房间的最后活动时间
  function touchRoomActivity(roomId: string, ts?: number) {
    const index = rooms.value.findIndex(r => r.id === roomId || r.liveId === roomId);
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
    updateRoomStatus,
    touchRoomActivity,
    setPriority,
    setLabel,
    setAutoRefresh,
    startAutoRefresh,
    stopAutoRefresh,
  };
});
