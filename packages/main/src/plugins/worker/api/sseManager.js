const { URL } = require('url');

/**
 * SSE 管理器
 */
function createSseManager(pluginId, apiBaseUrl, request) {
  const BACKOFF_BASE_MS = 1000;
  const BACKOFF_MAX_MS = 30000;
  const BACKOFF_JITTER = 0.2;
  const STATE = {
    INIT: "INIT",
    OPEN: "OPEN",
    BACKOFF: "BACKOFF",
    FAILED: "FAILED",
    CLOSED: "CLOSED",
  };

  const createStableClientId = () => {
    try {
      const crypto = require('crypto');
      return `cid_${crypto.randomBytes(16).toString('hex')}`;
    } catch {
      return `cid_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    }
  };

  const clientId = createStableClientId();
  let EventSourceImpl = null;
  
  try {
    EventSourceImpl = require('eventsource');
  } catch {
    EventSourceImpl = null;
  }
  try {
    EventSourceImpl = require('eventsource');
  } catch (e) {
    try { console.warn('[plugin-worker] require eventsource failed', e && e.message ? e.message : e); } catch {}
    EventSourceImpl = null;
  }

  const sseManager = {
    _sse: null,
    _clientId: clientId,
    _readyPromise: null,
    _isOpen: false,
    _state: STATE.INIT,
    _backoffAttempts: 0,
    _backoffTimer: null,
    _listeners: new Set(),
    _kindRefs: new Map(),
    _storeRefs: new Map(),
    _roomRefs: new Map(),
    _danmakuRules: new Map(),
    _rendererRefs: 0,
    _messageRefs: new Map(),
    _hasEverDanmaku: false,
    _hasEverRenderer: false,
    _hasEverMessage: false,
    _serverState: {
      danmakuRules: [],
      storeKeys: [],
      rendererEvents: [],
      messageKinds: [],
    },
    _lastStoreKeys: null,

    _computeBackoff() {
      const pow = Math.pow(2, this._backoffAttempts);
      const jitter = 1 + (Math.random() * 2 - 1) * BACKOFF_JITTER;
      return Math.min(BACKOFF_MAX_MS, Math.floor(BACKOFF_BASE_MS * pow * jitter));
    },

    _scheduleReconnect(reason, status) {
      if (this._shouldStop) return;
      const delay = this._computeBackoff();
      this._backoffAttempts += 1;
      clearTimeout(this._backoffTimer);
      console.warn(`[plugin-worker] SSE reconnect in ${delay}ms`, { reason, status });
      this._state = STATE.BACKOFF;
      this._backoffTimer = setTimeout(() => {
        this._readyPromise = null;
        this.ensureConnection(true).catch(() => {});
      }, delay);
    },

    _closeCurrent() {
      try { this._sse?.close?.(); } catch {}
      this._sse = null;
      this._isOpen = false;
    },

    ensureConnection(force = false) {
      if (this._readyPromise && !force) return this._readyPromise;
      
      if (!EventSourceImpl) {
        this._readyPromise = Promise.resolve(this._clientId);
        return this._readyPromise;
      }

      this._readyPromise = new Promise((resolve, reject) => {
        this._readyReject = reject;
        this._state = STATE.INIT;
        const targetUrl = new URL(`/sse/plugins/${encodeURIComponent(pluginId)}/main`, apiBaseUrl);
        targetUrl.searchParams.set('clientId', this._clientId);

        const es = new EventSourceImpl(targetUrl.toString());
        this._sse = es;

        let settled = false;
        const timeout = setTimeout(() => {
          if (settled) return;
          settled = true;
          this._state = STATE.FAILED;
          reject(new Error('SSE connection timeout'));
        }, 15000);

        const onOpen = () => {
          this._isOpen = true;
          this._state = STATE.OPEN;
          this._backoffAttempts = 0;
          // SSE connection opened
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            resolve(String(this._clientId));
          }
          // 重连后重放最新订阅
          try { void this.syncSubscriptions(true); } catch {}
        };

        const dispatch = (ev) => {
          try {
            const env = JSON.parse(ev.data || '{}');
            if (!env || typeof env !== 'object') return;
            const kind = String(env.kind || ev.type || 'unknown').toLowerCase();
            env.kind = kind;
            env.pluginId = String(env.pluginId || pluginId);
            env.ts = typeof env.ts === 'number' ? env.ts : Date.now();
            // #region agent log
            try {
              if (kind === 'config') {
                fetch('http://127.0.0.1:7242/ingest/52fa37f8-b908-44d5-87d2-c8f2861a8c45', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: 'debug-session',
                    runId: 'settings-subscribe',
                    hypothesisId: 'E',
                    location: 'packages/main/src/plugins/worker/api/sseManager.js:127',
                    message: 'dispatch received config',
                    data: { env },
                    timestamp: Date.now(),
                  }),
                }).catch(() => {});
              }
            } catch {}
            // #endregion
            // 优先触发 callbacksRegistry 中的直接回调（兼容 createSubscribeApi 的 onX 形式）
            try {
            if (this.callbacksRegistry) {
                // uiMessage 回调（onUiMessage）
                if (kind === 'uimessage' && typeof this.callbacksRegistry.uiMessage === 'function') {
                  try { 
                    // dispatch uiMessage to callbacksRegistry.uiMessage
                    try {
                      this.callbacksRegistry.uiMessage(env);
                    } catch (cbErr) {
                      try { console.error('[plugin-worker] callbacksRegistry.uiMessage threw', cbErr && cbErr.message ? cbErr.message : cbErr); } catch {}
                      throw cbErr;
                    }
                  } catch (dispatchErr) {
                    // ensure dispatch errors are visible in worker logs
                    try { console.error('[plugin-worker] failed to dispatch uiMessage', dispatchErr && dispatchErr.message ? dispatchErr.message : dispatchErr); } catch {}
                  }
                }
                // renderer 回调（subscribeRendererEvents 使用 callbacksRegistry.renderer）
                if (kind === 'renderer' && typeof this.callbacksRegistry.renderer === 'function') {
                  try { this.callbacksRegistry.renderer(env); } catch {}
                }
                // danmaku 回调集合（callbacksRegistry.danmaku: Map<roomId, callback>）
                if (kind === 'danmaku' && this.callbacksRegistry.danmaku && typeof this.callbacksRegistry.danmaku === 'object') {
                  try {
                    const roomId = String((env && env.payload && env.payload.roomId) || '').trim();
                    if (roomId && this.callbacksRegistry.danmaku.has(roomId)) {
                      try { this.callbacksRegistry.danmaku.get(roomId)(env); } catch {}
                    } else {
                      // 如果没有匹配 roomId，则尝试遍历所有回调（降级行为）
                      for (const cb of Array.from(this.callbacksRegistry.danmaku.values())) {
                        try { cb(env); } catch {}
                      }
                    }
                  } catch {}
                }
              }
            } catch {}

            // 继续调用通过 subscribe() 注册的监听器
            this._listeners.forEach((fn) => fn(env, ev, kind));
          } catch {}
        };

        es.onopen = onOpen;
        es.onmessage = dispatch;
        ['init', 'heartbeat', 'update', 'closed', 'lifecycle', 'config', 'shortcut', 'room', 'danmaku', 'store', 'client', 'renderer', 'error', 'mainmessage', 'uimessage'].forEach((ev) => {
          es.addEventListener(ev, dispatch);
        });
        es.onerror = (ev) => {
          this._isOpen = false;
          const status = typeof ev?.status === 'number' ? ev.status : undefined;
          const fatal = status && status >= 400 && status < 500;
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            if (fatal) {
              this._state = STATE.FAILED;
              console.error('[plugin-worker] SSE fatal error, will not retry', { status });
              reject(new Error(`SSE failed with status ${status}`));
              this._readyPromise = null;
              return;
            }
          }
          this._closeCurrent();
          if (fatal) {
            this._state = STATE.FAILED;
            this._readyPromise = null;
            return;
          }
          this._scheduleReconnect('error', status);
        };
      });

      return this._readyPromise;
    },

    _addDanmakuRule(roomId, types) {
      const rid = String(roomId || '').trim();
      if (!rid) return;
      const entry = this._danmakuRules.get(rid) || { wildcard: 0, typeCounts: new Map() };
      const isWildcard = Array.isArray(types) && types.length === 1 && types[0] === '*';
      if (isWildcard) entry.wildcard += 1;
      else {
        (types || []).forEach((t) => {
          const key = String(t || '').toLowerCase();
          if (!key) return;
          entry.typeCounts.set(key, (entry.typeCounts.get(key) || 0) + 1);
        });
      }
      this._danmakuRules.set(rid, entry);
      this._hasEverDanmaku = true;
    },
    _removeDanmakuRule(roomId, types) {
      const rid = String(roomId || '').trim();
      if (!rid) return;
      const entry = this._danmakuRules.get(rid);
      if (!entry) return;
      const isWildcard = Array.isArray(types) && types.length === 1 && types[0] === '*';
      if (isWildcard) entry.wildcard = Math.max(0, entry.wildcard - 1);
      else {
        (types || []).forEach((t) => {
          const key = String(t || '').toLowerCase();
          if (!key) return;
          const cur = entry.typeCounts.get(key) || 0;
          if (cur <= 1) entry.typeCounts.delete(key);
          else entry.typeCounts.set(key, cur - 1);
        });
      }
      if (entry.wildcard === 0 && entry.typeCounts.size === 0) this._danmakuRules.delete(rid);
      else this._danmakuRules.set(rid, entry);
    },

    subscribe(kinds, filter, callback, opts = {}) {
      const normalizedKinds = (kinds || []).map((k) => String(k || '').trim()).filter(Boolean);
      const storeKeys = (opts.storeKeys || []).map((k) => String(k || '').trim()).filter(Boolean);
      const roomIds = (opts.roomIds || []).map((k) => String(k || '').trim()).filter(Boolean);
      const danmakuTypes = Array.isArray(opts.danmakuTypes) ? opts.danmakuTypes : [];

      const handler = (env, _raw, kind) => {
        if (filter(kind, env)) callback(env);
      };

      const baseKindsSet = normalizedKinds.map((k) => k.split(':')[0]).filter(Boolean);
      baseKindsSet.forEach((k) => {
        const lower = k.toLowerCase();
        const canonicalMessageKind =
          lower === 'mainmessage' ? 'mainMessage' : lower === 'uimessage' ? 'uiMessage' : lower === 'message' ? 'message' : null;
        if (lower === 'renderer') {
          this._rendererRefs += 1;
          this._hasEverRenderer = true;
        } else if (canonicalMessageKind) {
          this._messageRefs.set(canonicalMessageKind, (this._messageRefs.get(canonicalMessageKind) || 0) + 1);
          this._hasEverMessage = true;
        } else {
          this._kindRefs.set(lower, (this._kindRefs.get(lower) || 0) + 1);
        }
      });
      storeKeys.forEach((k) => {
        this._storeRefs.set(k, (this._storeRefs.get(k) || 0) + 1);
      });
      roomIds.forEach((id) => {
        this._roomRefs.set(id, (this._roomRefs.get(id) || 0) + 1);
      });
      roomIds.forEach((id) => this._addDanmakuRule(id, danmakuTypes));

      this._listeners.add(handler);

      if (!this._sse) {
        void this.ensureConnection().catch(() => {});
      }

      void this.syncSubscriptions();

      let closed = false;
      return {
        close: () => {
          if (closed) return;
          closed = true;
          this._listeners.delete(handler);
          baseKindsSet.forEach((k) => {
            const lower = k.toLowerCase();
            const canonicalMessageKind =
              lower === 'mainmessage' ? 'mainMessage' : lower === 'uimessage' ? 'uiMessage' : lower === 'message' ? 'message' : null;
            if (lower === 'renderer') {
              this._rendererRefs = Math.max(0, this._rendererRefs - 1);
            } else if (canonicalMessageKind) {
              const cur = this._messageRefs.get(canonicalMessageKind) || 0;
              const next = cur - 1;
              if (next <= 0) this._messageRefs.delete(canonicalMessageKind);
              else this._messageRefs.set(canonicalMessageKind, next);
            } else {
              const cur = this._kindRefs.get(lower) || 0;
              const next = cur - 1;
              if (next <= 0) this._kindRefs.delete(lower);
              else this._kindRefs.set(lower, next);
            }
          });
          storeKeys.forEach((k) => {
            const cur = this._storeRefs.get(k) || 0;
            const next = cur - 1;
            if (next <= 0) this._storeRefs.delete(k);
            else this._storeRefs.set(k, next);
          });
          roomIds.forEach((id) => {
            const cur = this._roomRefs.get(id) || 0;
            const next = cur - 1;
            if (next <= 0) this._roomRefs.delete(id);
            else this._roomRefs.set(id, next);
          });
          roomIds.forEach((id) => this._removeDanmakuRule(id, danmakuTypes));
          void this.syncSubscriptions();
        },
      };
    },

    _buildDesiredState(useSaved = false) {
      if (useSaved && this._serverState) {
        return {
          danmakuRules: this._serverState.danmakuRules || [],
          storeKeys: this._serverState.storeKeys || [],
          rendererEvents: this._serverState.rendererEvents || [],
          messageKinds: this._serverState.messageKinds || [],
        };
      }
      const storeKeys = Array.from(this._storeRefs.keys());
      const danmakuRules = Array.from(this._danmakuRules.entries()).map(([roomId, rule]) => ({
        roomId,
        types: rule.wildcard > 0 ? ['*'] : Array.from(rule.typeCounts.keys()),
      }));
      const rendererEvents = this._rendererRefs > 0 ? ['*'] : [];
      const messageKinds = Array.from(this._messageRefs.keys());
      return { storeKeys, danmakuRules, rendererEvents, messageKinds };
    },

    async syncSubscriptions(useSaved = false) {
      try {
        const clientId = await this.ensureConnection();
        // #region agent log
        try {
          fetch('http://127.0.0.1:7242/ingest/52fa37f8-b908-44d5-87d2-c8f2861a8c45', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: 'debug-session',
              runId: 'settings-subscribe',
              hypothesisId: 'B',
              location: 'packages/main/src/plugins/worker/api/sseManager.js:308',
              message: 'syncSubscriptions state',
              data: { kindRefs: Array.from(this._kindRefs.keys()), hasConfig: this._kindRefs.has('config') },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
        } catch {}
        // #endregion
        const { storeKeys, danmakuRules, rendererEvents, messageKinds } = this._buildDesiredState(useSaved);

        const responses = [];

        if (this._hasEverDanmaku || danmakuRules.length > 0) {
          responses.push(
            request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/danmaku`, 'POST', {
              clientId,
              rules: danmakuRules,
            })
          );
        }
        // Ensure config kind subscription is explicitly requested (renderer uses /subscribe/config; main should too)
        if (this._kindRefs.has('config')) {
          try {
            // #region agent log
            try {
              fetch('http://127.0.0.1:7242/ingest/52fa37f8-b908-44d5-87d2-c8f2861a8c45', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: 'debug-session',
                  runId: 'settings-subscribe',
                  hypothesisId: 'SubscribeConfigAttempt',
                  location: 'packages/main/src/plugins/worker/api/sseManager.js:322',
                  message: 'requesting subscribe/config for main client',
                  data: { clientId, pluginId },
                  timestamp: Date.now(),
                }),
              }).catch(() => {});
            } catch {}
            // #endregion
            responses.push(
              request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/config`, 'POST', {
                clientId,
              })
            );
          } catch (e) {
            try { console.warn('[plugin-worker] subscribe/config request failed', e); } catch {}
          }
        }
        // 仅在 keys 变化时调用 store 接口
        const sameStoreKeys =
          Array.isArray(this._lastStoreKeys) &&
          this._lastStoreKeys.length === storeKeys.length &&
          this._lastStoreKeys.every((k, i) => k === storeKeys[i]);
        if (!sameStoreKeys) {
          responses.push(
            request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/store`, 'POST', {
              clientId,
              keys: storeKeys,
            })
          );
        }
        if (this._hasEverRenderer || rendererEvents.length > 0) {
          responses.push(
            request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/renderer`, 'POST', {
              clientId,
              events: rendererEvents,
            })
          );
        }
        if (this._hasEverMessage || messageKinds.length > 0) {
          responses.push(
            request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/messages`, 'POST', {
              clientId,
              kinds: messageKinds,
            })
          );
        }

        const results = await Promise.all(responses);
        try {
          const serverState = this._serverState || {};
          const danmakuResp = results.find((r) => r?.data?.rules);
          const storeResp = results.find((r) => r?.data?.keys);
          const rendererResp = results.find((r) => r?.data?.events);
          const messageResp = results.find((r) => r?.data?.kinds);
          if (danmakuResp?.data?.rules) serverState.danmakuRules = danmakuResp.data.rules;
          if (storeResp?.data?.keys !== undefined) {
            serverState.storeKeys = storeResp.data.keys;
            this._lastStoreKeys = Array.isArray(storeResp.data.keys) ? [...storeResp.data.keys] : [];
          }
          if (rendererResp?.data?.events) serverState.rendererEvents = rendererResp.data.events;
          if (messageResp?.data?.kinds) serverState.messageKinds = messageResp.data.kinds;
          this._serverState = serverState;
        } catch {}
      } catch (err) {
        console.warn('[plugin-worker] sync subscriptions failed:', err);
      }
    },
  };

  return sseManager;
}

module.exports = { createSseManager };

