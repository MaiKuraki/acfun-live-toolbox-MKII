import type { RequestFn } from "./types";

export function createAcfunApi(request: RequestFn) {
  return {
    user: {
      getUserInfo: (userId?: string) => {
        const url = userId ? `/api/acfun/user/info?userId=${encodeURIComponent(userId)}` : '/api/acfun/user/info';
        return request(url);
      },
    },
    danmu: {
      getLiveRoomInfo: (liverUID: string) =>
        request(`/api/acfun/danmu/room-info?liverUID=${encodeURIComponent(liverUID)}`),
      sendComment: (liveId: string, content: string) => request("/api/acfun/danmu/send", "POST", { liveId, content }),
    },
    live: {
      getUserLiveInfo: (userID: string) =>
        request(`/api/acfun/live/user-info?userID=${encodeURIComponent(userID)}`),
      startLiveStream: (params: any) => request("/api/acfun/live/start", "POST", params),
      stopLiveStream: (liveId: string) => request("/api/acfun/live/stop", "POST", { liveId }),
      updateLiveRoom: (params: any) => request("/api/acfun/live/update", "PUT", params),
      checkLivePermission: () => request("/api/acfun/live/permission"),
      getLiveList: (page: number = 1, pageSize: number = 20) =>
        request(`/api/acfun/live/list?page=${page}&pageSize=${pageSize}`),
      getLiveStatisticsByDays: (days: number) => request(`/api/acfun/live/statistics-by-days?days=${days}`),
    },
    gift: {
      getAllGiftList: () => request("/api/acfun/gift/all"),
      getLiveGiftList: (liveId: string) => request(`/api/acfun/gift/live?liveID=${encodeURIComponent(liveId)}`),
    },
    manager: {
      addManager: (managerUID: string) => request("/api/acfun/manager/add", "POST", { managerUID }),
      deleteManager: (managerUID: string) => request("/api/acfun/manager/remove", "DELETE", { managerUID }),
      authorKick: (liveId: string, kickedUID: string) =>
        request("/api/acfun/manager/kick", "POST", { liveID: liveId, kickedUID, kickType: "author" }),
      managerKick: (liveId: string, kickedUID: string) =>
        request("/api/acfun/manager/kick", "POST", { liveID: liveId, kickedUID, kickType: "manager" }),
    },
    badge: {},
    room: {
      getAllConnectedRooms: () => request("/api/acfun/room/list"),
      getConnectedRoomStatus: (roomId: string) =>
        request(`/api/acfun/room/status?roomId=${encodeURIComponent(roomId)}`),
      addRoom: (roomId: string) => request("/api/acfun/room/add", "POST", { roomId }),
      removeRoom: (roomId: string) => request("/api/acfun/room/remove", "POST", { roomId }),
    },
  };
}


















