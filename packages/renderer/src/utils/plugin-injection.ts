import { getApiBase } from "./hosting";

export interface PluginApiContext {
  pluginId: string;
  version?: string;
  mode: "ui" | "window";
}

/**
 * 创建统一的插件 API 对象
 * 对应 req.md 中的规划结构
 */
export function createPluginApi(context: PluginApiContext) {
  const { pluginId } = context;
  const apiBase = getApiBase();

  // 通用请求辅助函数
  const request = async (path: string, method: string = "GET", body?: any, customOptions: RequestInit = {}) => {
    const url = new URL(path, apiBase).toString();
    const defaultHeaders = {
      "Content-Type": "application/json",
      "X-Plugin-ID": pluginId, // Critical for authorization
    };
    const headers = { ...defaultHeaders, ...(customOptions.headers || {}) };

    const options: RequestInit = {
      ...customOptions,
      method,
      headers,
    };
    if (body !== undefined && body !== null) {
      const contentType = (headers["Content-Type"] as string) || "";
      if (contentType.includes("application/json") && typeof body !== 'string') {
        options.body = JSON.stringify(body);
      } else {
        options.body = body;
      }
    }
    const res = await fetch(url, options);
    const json = await res.json().catch(() => ({ success: res.ok }));
    if (!json.success && !res.ok) {
      throw new Error(json.error || res.statusText);
    }
    return json.data || json;
  };

  // 共享消息流管理器 (SSE Manager - Dynamic Aggregation)
  // 解决全量推送导致的带宽浪费，同时通过聚合订阅避免浏览器连接数限制
  const sseManager = {
    _sse: null as EventSource | null,
    _refCounts: new Map<string, number>(),
    _listeners: new Set<(e: MessageEvent) => void>(),
    _updateTimer: null as any,
    _currentKindsStr: "",

    dispatch: (e: MessageEvent) => {
      sseManager._listeners.forEach((fn) => fn(e));
    },

    updateConnection: () => {
      if (sseManager._updateTimer) clearTimeout(sseManager._updateTimer);
      sseManager._updateTimer = setTimeout(() => {
        const neededKinds = Array.from(sseManager._refCounts.keys()).filter(
          (k) => (sseManager._refCounts.get(k) || 0) > 0
        );

        if (neededKinds.length === 0) {
          if (sseManager._sse) {
            sseManager._sse.close();
            sseManager._sse = null;
            sseManager._currentKindsStr = "";
          }
          return;
        }

        const sortedKinds = neededKinds.sort().join(",");

        // 如果订阅集合没变且连接正常，则跳过重连
        if (
          sseManager._sse &&
          sseManager._sse.readyState !== EventSource.CLOSED &&
          sseManager._currentKindsStr === sortedKinds
        ) {
          return;
        }

        if (sseManager._sse) sseManager._sse.close();

        const targetUrl = new URL(
          `/sse/plugins/${encodeURIComponent(pluginId)}/overlay`,
          apiBase
        );
        neededKinds.forEach((k) => targetUrl.searchParams.append("kinds", k));

        // 建立真正的 SSE 连接 (Pre-flight 检查已移至 subscribe 阶段)
        const es = new EventSource(targetUrl.toString());
        sseManager._sse = es;
        sseManager._currentKindsStr = sortedKinds;

        const dispatcher = (e: MessageEvent) => sseManager.dispatch(e);

        if (neededKinds.includes("message")) {
          es.onmessage = dispatcher;
        }

        // 提取基础事件类型（去重），例如 "danmaku:123" -> "danmaku"
        const baseKinds = new Set<string>();
        neededKinds.forEach((k) => {
          const base = k.split(":")[0];
          if (base && base !== "message") baseKinds.add(base);
        });

        baseKinds.forEach((k) => {
          es.addEventListener(k, dispatcher);
        });
      }, 50); // 50ms debounce
    },

    subscribe: (
      kinds: string[],
      filter: (type: string, data: any) => boolean,
      callback: (data: any) => void
    ) => {
      // 1. 构造候选订阅列表 (当前已提交 + 新增)
      const currentActive = Array.from(sseManager._refCounts.keys()).filter(
        (k) => (sseManager._refCounts.get(k) || 0) > 0
      );
      // 使用 Set 去重
      const candidateSet = new Set([...currentActive, ...kinds]);
      const candidateKinds = Array.from(candidateSet);

      let isSubscribed = false; // 标记是否已成功提交到 refCounts
      let isClosed = false; // 标记是否已被用户关闭

      const handler = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const type = e.type === "message" ? data.event || "message" : e.type;
          if (filter(type, data)) callback(data);
        } catch {}
      };

      // 2. 执行 Pre-flight Check
      const targetUrl = new URL(
        `/sse/plugins/${encodeURIComponent(pluginId)}/overlay`,
        apiBase
      );
      candidateKinds.forEach((k) => targetUrl.searchParams.append("kinds", k));

      fetch(targetUrl.toString(), {
        method: "GET",
        headers: { Accept: "text/event-stream" },
      })
        .then(async (res) => {
          if (isClosed) return; // 用户已取消，不再处理

          if (!res.ok) {
            // 校验失败：不提交 refCounts，直接报错
            try {
              const errJson = await res.json();
              // 仅通知当前 callback
              callback({ event: "error", payload: errJson });
            } catch (e) {
              callback({
                event: "error",
                payload: {
                  success: false,
                  error: res.statusText || `HTTP Error ${res.status}`,
                },
              });
            }
            return;
          }

          // 校验通过：提交 refCounts 并更新连接
          kinds.forEach((k) =>
            sseManager._refCounts.set(
              k,
              (sseManager._refCounts.get(k) || 0) + 1
            )
          );
          isSubscribed = true;

          sseManager._listeners.add(handler);
          sseManager.updateConnection();
        })
        .catch((err) => {
          if (isClosed) return;
          callback({
            event: "error",
            payload: { success: false, error: err.message || "Network Error" },
          });
        });

      return {
        close: () => {
          isClosed = true;
          if (isSubscribed) {
            sseManager._listeners.delete(handler);
            kinds.forEach((k) => {
              const c = sseManager._refCounts.get(k) || 0;
              if (c > 0) sseManager._refCounts.set(k, c - 1);
            });
            sseManager.updateConnection();
          }
        },
      };
    },
  };

  const subscribeSse = (
    kinds: string[],
    filter: (type: string, data: any) => boolean,
    callback: (data: any) => void
  ) => {
    return sseManager.subscribe(kinds, filter, callback);
  };

  // 1. AcFun 接口
  const acfun = {
    user: {
      getUserInfo: (userId: string) =>
        request(`/api/acfun/user/info?userId=${encodeURIComponent(userId)}`),
    },
    danmu: {
      getLiveRoomInfo: (liverUID: string) =>
        request(
          `/api/acfun/danmu/room-info?liverUID=${encodeURIComponent(liverUID)}`
        ),
      sendComment: (liveId: string, content: string) =>
        request("/api/acfun/danmu/send", "POST", { liveId, content }),
    },
    live: {
      getUserLiveInfo: (userID: string) =>
        request(
          `/api/acfun/live/user-info?userID=${encodeURIComponent(userID)}`
        ),
      startLiveStream: (params: any) =>
        request("/api/acfun/live/start", "POST", params),
      stopLiveStream: (liveId: string) =>
        request("/api/acfun/live/stop", "POST", { liveId }),
      updateLiveRoom: (params: any) =>
        request("/api/acfun/live/update", "PUT", params),
      checkLivePermission: () => request("/api/acfun/live/permission"),
      getLiveList: (page: number = 1, pageSize: number = 20) =>
        request(`/api/acfun/live/list?page=${page}&pageSize=${pageSize}`),
      getLiveStatisticsByDays: (days: number) =>
        request(`/api/acfun/live/statistics-by-days?days=${days}`),
    },
    gift: {
      getAllGiftList: () => request("/api/acfun/gift/all"),
      getLiveGiftList: (liveId: string) =>
        request(`/api/acfun/gift/live?liveID=${encodeURIComponent(liveId)}`),
    },
    manager: {
      addManager: (managerUID: string) =>
        request("/api/acfun/manager/add", "POST", { managerUID }),
      deleteManager: (managerUID: string) =>
        request("/api/acfun/manager/remove", "DELETE", { managerUID }),
      authorKick: (liveId: string, kickedUID: string) =>
        request("/api/acfun/manager/kick", "POST", {
          liveID: liveId,
          kickedUID,
          kickType: "author",
        }),
      managerKick: (liveId: string, kickedUID: string) =>
        request("/api/acfun/manager/kick", "POST", {
          liveID: liveId,
          kickedUID,
          kickType: "manager",
        }),
    },
    badge: {
      // 暂无明确接口定义，预留
    },
    room: {
      getAllConnectedRooms: () => request("/api/acfun/room/list"),
      getConnectedRoomStatus: (roomId: string) =>
        request(`/api/acfun/room/status?roomId=${encodeURIComponent(roomId)}`),
      addRoom: (roomId: string) =>
        request("/api/acfun/room/add", "POST", { roomId }),
      removeRoom: (roomId: string) =>
        request("/api/acfun/room/remove", "POST", { roomId }),
    },
  };

  // 2. 存储与查询
  const pluginStorage = {
    write: (row: any) =>
      request(`/api/plugins/${pluginId}/storage`, "POST", row),
    read: (queryText?: string, size?: number) => {
      const params = new URLSearchParams();
      if (queryText) params.append("q", queryText);
      if (size !== undefined) params.append("size", String(size));
      return request(`/api/plugins/${pluginId}/storage?${params.toString()}`);
    },
    size: () => request(`/api/plugins/${pluginId}/storage/size`),
    remove: (ids: number[]) =>
      request(`/api/plugins/${pluginId}/storage/remove`, "POST", { ids }),
  };

  // 3. Window 控制
  const windowControl = {
    minimize: () => request("/api/windows/minimize", "POST"),
    maximize: () => request("/api/windows/maximize", "POST"),
    restore: () => request("/api/windows/restore", "POST"),
    close: () => request("/api/windows/close", "POST"),
    show: () => request("/api/windows/show", "POST"),
    hide: () => request("/api/windows/hide", "POST"),
    focus: () => request("/api/windows/focus", "POST"),
    blur: () => request("/api/windows/blur", "POST"),

    setSize: (width: number, height: number) =>
      request("/api/windows/size", "POST", { width, height }),
    getSize: () => request("/api/windows/size"),
    setPosition: (x: number, y: number) =>
      request("/api/windows/position", "POST", { x, y }),
    getPosition: () => request("/api/windows/position"),
    setOpacity: (opacity: number) =>
      request("/api/windows/opacity", "POST", { opacity }),
    setAlwaysOnTop: (flag: boolean) =>
      request("/api/windows/top", "POST", { flag }),
    setResizable: (flag: boolean) =>
      request("/api/windows/resizable", "POST", { flag }),
    setIgnoreMouseEvents: (ignore: boolean, options?: any) =>
      request("/api/windows/ignore-mouse", "POST", { ignore, options }),
  };

  const windowEvents = {
    on: (event: string, callback: (e: Event) => void) => {
      // 仅监听当前窗口(iframe/window)的事件
      window.addEventListener(event, callback);
      return () => window.removeEventListener(event, callback);
    },
  };

  // 4. 生命周期
  const lifecycle = {
    on: (hookName: string, callback: (data: any) => void) => {
      // 通过 SSE 监听生命周期事件
      // 后端需广播 { event: 'lifecycle', payload: { hook: 'beforeUnloaded' } }
      return subscribeSse(
        ["lifecycle"],
        (type, data) =>
          type === "lifecycle" && data?.payload?.hook === hookName,
        (data) => callback(data.payload)
      );
    },
  };

  // 5. 系统操作
  const system = {
    openExternal: (url: string) =>
      request("/api/system/open-external", "POST", { url }),
    openPath: (path: string) =>
      request("/api/system/open-path", "POST", { path }),
  };

  const clipboard = {
    writeText: (text: string) => navigator.clipboard.writeText(text),
    readText: () => navigator.clipboard.readText(),
  };

  const interaction = {
    notify: (options: { title: string; body: string; icon?: string }) => {
      // Force use of backend popup API to ensure consistent in-app UI
      const msg = options.title
        ? `${options.title}: ${options.body}`
        : options.body;
      request("/api/popup", "POST", {
        action: "toast",
        message: msg,
      });
    },
  };

  const fs = {
    pluginStorage,
    readFile: (path: string) => request("/api/fs/read", "POST", { path }),
    writeFile: (path: string, content: string) =>
      request("/api/fs/write", "POST", { path, content }),
  };

  // 6. 全局快捷键
  const shortcut = {
    register: (accelerator: string, callback: Function) => {
      // 注册快捷键
      const promise = request("/api/shortcut/register", "POST", {
        accelerator,
      });
      // 监听触发事件 (需要后端广播 'shortcut-triggered')
      // 假设后端通过 overlay/message 通道发送 { event: 'shortcut-triggered', payload: { accelerator } }
      const sub = subscribeSse(
        ["shortcut"], // Explicitly subscribe to 'shortcut' kind
        (type, data) => {
           // type might be 'message' or the event name depending on how sseManager handles it.
           // data structure: { event: 'shortcut-triggered', payload: { accelerator: '...' } }
           // We need to be robust.
           const evtName = data?.event || type;
           return evtName === "shortcut-triggered" && data.payload?.accelerator === accelerator;
        },
        () => callback()
      );
      // 将取消订阅挂载到 promise 上或者需要另外的机制管理，这里简化处理
      return promise;
    },
    unregister: (accelerator: string | string[]) =>
      request("/api/shortcut/unregister", "POST", { accelerator }),
    unregisterAll: () => request("/api/shortcut/unregister-all", "POST"),
    isRegistered: (accelerator: string) =>
      request("/api/shortcut/is-registered", "POST", { accelerator }).then(
        (res) => res.registered
      ),
    list: () => request("/api/shortcut/list", "POST").then((res) => res.shortcuts || []),
  };

  // 7. Store (Readonly Snapshot)
  const store = {
    get: (keys: string[]) =>
      request("/api/renderer/readonly-store/snapshot", "POST", { keys }),
    onChange: (keys: string[], callback: (data: any) => void) => {
      // 使用独立的 SSE 连接订阅 Store 变更，以支持 keys 过滤
      const params = new URLSearchParams();
      keys.forEach((k) => params.append("keys", k));
      const url = new URL(
        `/sse/renderer/readonly-store/subscribe?${params.toString()}`,
        apiBase
      ).toString();
      const es = new EventSource(url);
      const handler = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          callback(data);
        } catch {}
      };
      es.addEventListener("readonly-store-update", handler);
      return {
        close: () => {
          es.removeEventListener("readonly-store-update", handler);
          es.close();
        },
      };
    },
  };

  // 8. 通信
  const http = {
    post: (path: string, data?: any, options?: RequestInit) => {
        if (/^https?:\/\//.test(path)) {
            return request('/api/proxy/request', 'POST', {
                method: 'POST',
                url: path,
                headers: options?.headers,
                body: data
            });
        }
        return request(path, "POST", data, options);
    },
    get: (path: string, options?: RequestInit) => {
        if (/^https?:\/\//.test(path)) {
            return request('/api/proxy/request', 'POST', {
                method: 'GET',
                url: path,
                headers: options?.headers
            });
        }
        return request(path, "GET", undefined, options);
    },
  };

  const overlay = {
    send: (overlayId: string | undefined, event: string, payload?: any) => {
      const url = `/api/plugins/${encodeURIComponent(
        pluginId
      )}/overlay/messages`;
      const body: any = { event, payload };
      if (overlayId) body.overlayId = overlayId;
      return request(url, "POST", body);
    },
  };

  // 日志
  const logger = {
    info: (message: string) => {
      console.log(`[Plugin:${pluginId}]`, message);
      request("/api/logger", "POST", { level: "info", message }).catch(
        () => {}
      );
    },
    warn: (message: string) => {
      console.warn(`[Plugin:${pluginId}]`, message);
      request("/api/logger", "POST", { level: "warn", message }).catch(
        () => {}
      );
    },
    error: (message: string) => {
      console.error(`[Plugin:${pluginId}]`, message);
      request("/api/logger", "POST", { level: "error", message }).catch(
        () => {}
      );
    },
  };

  // 配置
  const settings = {
    get: () => request(`/api/plugins/${pluginId}/config`),
    set: (key: string, value: any) =>
      request(`/api/plugins/${pluginId}/config`, "POST", { [key]: value }),
    delete: (key: string) =>
      request(`/api/plugins/${pluginId}/config`, "DELETE", { key }),
    onChange: (callback: (newValue: any) => void) => {
      // 监听 config-changed 事件
      // 后端格式: { event: 'config-changed', payload: { newConfig... } }
      return subscribeSse(
        ["config", "message"],
        (type, data) =>
          type === "config" ||
          type === "config-changed" ||
          (data && data.event === "config-changed"),
        (data) => {
          const cfg = data.payload || data;
          callback(cfg);
        }
      );
    },
  };

  // 核心订阅
  const subscribeEvents = (kinds: string[], callback: (event: any) => void) => {
    // 强制 kinds 为数组，若为空则默认订阅核心消息
    const targetKinds =
      kinds && kinds.length > 0 ? kinds : ["message", "action", "ui"];

    return subscribeSse(targetKinds, (type, data) => true, callback);
  };

  return {
    acfun,
    window:
      context.mode === "window"
        ? { ...windowControl, ...windowEvents }
        : { ...windowEvents },
    system,
    clipboard,
    interaction,
    fs,
    shortcut,
    store,
    lifecycle,
    logger,
    settings,
    http,
    overlay,
    subscribeEvents, // 暴露核心订阅
    pluginId,
    version: context.version,
  };
}

/**
 * 获取 Wujie 插件配置，用于注入 API
 */
export function getWujiePlugins(context: PluginApiContext) {
  return [
    {
      htmlLoader: (code: string) => code,
      jsBeforeLoaders: [
        {
          callback: (appWindow: Window) => {
            // 注入 toolboxApi 到子应用 window
            Object.defineProperty(appWindow, "toolboxApi", {
              get: () => (appWindow as any).$wujie?.props?.toolboxApi,
              configurable: true,
              enumerable: true,
            });
          },
        },
      ],
    },
  ];
}
