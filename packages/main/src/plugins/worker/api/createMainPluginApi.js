const { createRequest } = require('./request');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { URLSearchParams } = require('url');
const { createSseManager } = require('./sseManager');
const { createAcfunApi } = require('./acfun');
const { createStoreApi } = require('./store');
const { createSettingsApi } = require('./settings');
const { createLoggerApi } = require('./logger');
const { createHttpApi } = require('./http');
const { createOverlayApi } = require('./overlay');
const { createLifecycleApi } = require('./lifecycle');
  const { createSubscribeApi } = require('./subscribe');

/**
 * 创建 main 进程插件 API
 */
function createMainPluginApi(pluginId, version, apiBaseUrl) {
  // 创建请求函数
  try { console.info('[Worker-API] createMainPluginApi called', { pluginId, version, apiBaseUrl }); } catch {}
  const request = createRequest(pluginId, apiBaseUrl);

  // 创建 SSE 管理器
  const sseManager = createSseManager(pluginId, apiBaseUrl, request);
  const subscribeSse = (kinds, filter, callback, opts) => {
    // #region agent log (node-compatible)
    try {
      const _ingest = (body) => {
        try {
          const ingestUrl = 'http://127.0.0.1:7242/ingest/52fa37f8-b908-44d5-87d2-c8f2861a8c45';
          const u = new URL(ingestUrl);
          const data = JSON.stringify(body || {});
          const opts = {
            hostname: u.hostname,
            port: u.port || (u.protocol === 'https:' ? 443 : 80),
            path: u.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data),
            },
          };
          const mod = u.protocol === 'https:' ? https : http;
          const req = mod.request(opts, (res) => {
            // consume response silently
            res.on('data', () => {});
            res.on('end', () => {});
          });
          req.on('error', () => {});
          req.write(data);
          req.end();
        } catch (e) {}
      };
      _ingest({
        sessionId: 'debug-session',
        runId: 'settings-subscribe',
        hypothesisId: 'A',
        location: 'packages/main/src/plugins/worker/api/createMainPluginApi.js:20',
        message: 'subscribeSse called',
        data: { kinds, opts },
        timestamp: Date.now(),
      });
    } catch {}
    // #endregion
    return sseManager.subscribe(kinds, filter, callback, opts);
  };

  // 创建各个 API 模块
  const acfun = createAcfunApi(request);
  const store = createStoreApi(pluginId, request, subscribeSse);
  const settings = createSettingsApi(pluginId, request, subscribeSse);
  const logger = createLoggerApi(pluginId, request);
  const http = createHttpApi(request);
  const overlay = createOverlayApi(pluginId, request, sseManager);
  const lifecycle = createLifecycleApi(subscribeSse);
  // createSubscribeApi now follows renderer signature: (pluginId, mode, request, sseManager)
  const {
    subscribeRendererEvents,
    unsubscribeRendererEvents,
    subscribeDanmaku,
    unsubscribeDanmakuByRoom,
    onUiMessage,
    offUiMessage,
  } = createSubscribeApi(pluginId, 'main', request, sseManager);

  // 系统级操作（与 renderer 侧保持一致能力：exec 等）
  const system = {
    openExternal: (url) => request('/api/system/open-external', 'POST', { url }),
    openPath: (path) => request('/api/system/open-path', 'POST', { path }),
    notifyNative: (options) => request('/api/system/notify-native', 'POST', options),
    playSound: (src, options) => request('/api/system/play-sound', 'POST', { src, options }),
    exec: (command, args, opts) => request('/api/system/exec', 'POST', { command, args, opts }),
  };

  // 插件存储
  const pluginStorage = {
    write: (row) => request(`/api/plugins/${pluginId}/storage`, 'POST', row),
    read: (queryText, size) => {
      const params = new URLSearchParams();
      if (queryText) params.append('q', queryText);
      if (size !== undefined) params.append('size', String(size));
      return request(`/api/plugins/${pluginId}/storage?${params.toString()}`);
    },
    size: () => request(`/api/plugins/${pluginId}/storage/size`),
    remove: (ids) => request(`/api/plugins/${pluginId}/storage/remove`, 'POST', { ids }),
  };

  // sendUI (main -> UI/Window)
  const sendUI = async (payload) => {
    const clientId = await sseManager.ensureConnection();
    return request(`/api/plugins/${encodeURIComponent(pluginId)}/messages`, 'POST', { payload }, {
      headers: {
        'X-Client-ID': clientId,
        'X-Plugin-Type': 'main',
      },
    });
  };

  // SendOverlay
  const sendOverlay = async (payload) => {
    
    const clientId = await sseManager.ensureConnection();
    return overlay.send(undefined, payload, clientId, 'main');
  };
  try { console.info('[Worker-API] createMainPluginApi created apis', { pluginId }); } catch {}

  return {
    acfun,
    store,
    lifecycle,
    logger,
    settings,
    http,
    system,
    overlay,
    sendUI,
    sendOverlay,
    subscribeRendererEvents,
    unsubscribeRendererEvents,
    subscribeDanmaku,
    unsubscribeDanmakuByRoom,
    onUiMessage,
    offUiMessage,
    pluginId,
    version,
    fs: {
      pluginStorage,
      readFile: (path) => request('/api/fs/read', 'POST', { path }),
      writeFile: (path, content) => request('/api/fs/write', 'POST', { path, content }),
    },
  };
}

module.exports = { createMainPluginApi };

