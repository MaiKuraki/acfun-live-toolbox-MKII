/**
 * AcFun API 模块
 */
function createAcfunApi(request) {
  return {
    user: {
      getUserInfo: (userId) => {
        const url = userId ? `/api/acfun/user/info?userId=${encodeURIComponent(userId)}` : '/api/acfun/user/info';
        return request(url);
      },
    },
    danmu: {
      getLiveRoomInfo: (liverUID) => request(`/api/acfun/danmu/room-info?liverUID=${encodeURIComponent(liverUID)}`),
      sendComment: (liveId, content) => request('/api/acfun/danmu/send', 'POST', { liveId, content }),
    },
    live: {
      getUserLiveInfo: (userID) => request(`/api/acfun/live/user-info?userID=${encodeURIComponent(userID)}`),
      startLiveStream: (params) => request('/api/acfun/live/start', 'POST', params),
      stopLiveStream: (liveId) => request('/api/acfun/live/stop', 'POST', { liveId }),
      updateLiveRoom: (params) => request('/api/acfun/live/update', 'PUT', params),
      checkLivePermission: () => request('/api/acfun/live/permission'),
      getLiveList: (page = 1, pageSize = 20) => request(`/api/acfun/live/list?page=${page}&pageSize=${pageSize}`),
      getLiveStatisticsByDays: (days) => request(`/api/acfun/live/statistics-by-days?days=${days}`),
    },
    gift: {
      getAllGiftList: () => request('/api/acfun/gift/all'),
      getLiveGiftList: (liveId) => request(`/api/acfun/gift/live?liveID=${encodeURIComponent(liveId)}`),
    },
    manager: {
      addManager: (managerUID) => request('/api/acfun/manager/add', 'POST', { managerUID }),
      deleteManager: (managerUID) => request('/api/acfun/manager/remove', 'DELETE', { managerUID }),
      authorKick: (liveId, kickedUID) => request('/api/acfun/manager/kick', 'POST', { liveID: liveId, kickedUID, kickType: 'author' }),
      managerKick: (liveId, kickedUID) => request('/api/acfun/manager/kick', 'POST', { liveID: liveId, kickedUID, kickType: 'manager' }),
    },
    badge: {},
    room: {
      getAllConnectedRooms: () => request('/api/acfun/room/list'),
      getConnectedRoomStatus: (roomId) => request(`/api/acfun/room/status?roomId=${encodeURIComponent(roomId)}`),
      addRoom: (roomId) => request('/api/acfun/room/add', 'POST', { roomId }),
      removeRoom: (roomId) => request('/api/acfun/room/remove', 'POST', { roomId }),
    },
  };
}

module.exports = { createAcfunApi };

