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
    callbacksRegistry: {
      lifecycle: null,
      config: null,
      store: null,
      renderer: null,
      mainMessage: null,
      uiMessage: null,
      shortcut: new Map(),
      danmaku: new Map(),
    },
    _serverState: {
      lifecycle: { subscribed: false },
      config: { subscribed: false },
      shortcut: {},
      store: { keys: [], snapshot: null },
      renderer: { subscribed: false },
      messages: { mainMessage: false, uiMessage: false },
      danmaku: { rules: [] },
    },

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
          try { void this.restoreSubscriptions().catch(() => {}); } catch {}
        };

        const onClient = (ev) => {
          try {
            const data = JSON.parse(ev.data || '{}');
            const cid = String(data?.payload?.clientId || data?.clientId || '');
            if (cid && String(this._clientId) !== cid) {
              this._clientId = cid;
            }
          } catch {
            // ignore
          }
        };

        const dispatch = (ev) => {
          try {
            const env = JSON.parse(ev.data || '{}');
            if (!env || typeof env !== 'object') return;
            const kind = String(env.kind || ev.type || 'unknown').toLowerCase();
            env.kind = kind;
            env.pluginId = String(env.pluginId || pluginId);
            env.ts = typeof env.ts === 'number' ? env.ts : Date.now();
            try {
              switch (kind) {
                case 'lifecycle': {
                  const cb = this.callbacksRegistry.lifecycle;
                  if (cb) cb(env.payload ?? env);
                  break;
                }
                case 'config': {
                  const cb = this.callbacksRegistry.config;
                  if (cb) cb(env.payload ?? env);
                  break;
                }
                case 'shortcut': {
                  const accel = env.payload?.accelerator;
                  if (accel) {
                    const fn = this.callbacksRegistry.shortcut.get(String(accel));
                    if (fn) fn();
                  }
                  break;
                }
                case 'store': {
                  const cb = this.callbacksRegistry.store;
                  if (cb && env.payload && typeof env.payload === 'object') {
                    cb(env.payload);
                  }
                  break;
                }
                case 'renderer': {
                  const cb = this.callbacksRegistry.renderer;
                  if (!cb) break;
                  const event = env.event;
                  const payload = env.payload || {};
                  let rendererEvent;
                  switch (event) {
                    case 'user-login':
                      rendererEvent = { type: 'user-login', userId: payload.userId || '', userInfo: payload.userInfo };
                      break;
                    case 'user-logout':
                      rendererEvent = { type: 'user-logout' };
                      break;
                    case 'route-change':
                      rendererEvent = {
                        type: 'route-change',
                        routePath: payload.routePath || '',
                        pageName: payload.pageName || '',
                        pageTitle: payload.pageTitle || '',
                      };
                      break;
                    case 'live-start':
                      rendererEvent = {
                        type: 'live-start',
                        liveId: payload.liveId || '',
                        roomId: payload.roomId || '',
                      };
                      break;
                    case 'live-stop':
                      rendererEvent = {
                        type: 'live-stop',
                        liveId: payload.liveId || '',
                        roomId: payload.roomId || '',
                      };
                      break;
                    case 'danmaku-collection-start':
                      rendererEvent = { type: 'danmaku-collection-start', roomId: payload.roomId || '' };
                      break;
                    case 'danmaku-collection-stop':
                      rendererEvent = { type: 'danmaku-collection-stop', roomId: payload.roomId || '' };
                      break;
                    case 'config-updated':
                      rendererEvent = { type: 'config-updated', key: payload.key || '', value: payload.value };
                      break;
                    case 'plugin-enabled':
                      rendererEvent = { type: 'plugin-enabled', pluginId: payload.pluginId || '' };
                      break;
                    case 'plugin-disabled':
                      rendererEvent = { type: 'plugin-disabled', pluginId: payload.pluginId || '' };
                      break;
                    case 'plugin-uninstalled':
                      rendererEvent = { type: 'plugin-uninstalled', pluginId: payload.pluginId || '' };
                      break;
                    case 'app-closing':
                      rendererEvent = { type: 'app-closing' };
                      break;
                    default:
                      break;
                  }
                  if (rendererEvent) cb(rendererEvent);
                  break;
                }
                case 'mainmessage': {
                  const cb = this.callbacksRegistry.mainMessage;
                  if (cb) cb(env.payload ?? env);
                  break;
                }
                case 'uimessage': {
                  const cb = this.callbacksRegistry.uiMessage;
                  if (cb) cb(env.payload ?? env);
                  break;
                }
                case 'danmaku': {
                  const payload = env.payload || {};
                  const rid = String(payload.roomId || payload.room_id || env.roomId || env.overlayId || "").trim();
                  if (!rid) break;
                  const cb = this.callbacksRegistry.danmaku.get(rid);
                  if (cb) cb(payload);
                  break;
                }
                default:
                  break;
              }
            } catch (err) {
              console.warn('[plugin-worker] SSE dispatch error:', err);
            }
          } catch {}
        };

        es.onopen = onOpen;
        es.onmessage = dispatch;
        es.addEventListener('client', onClient);
        ['init', 'heartbeat', 'update', 'closed', 'action', 'lifecycle', 'config', 'shortcut', 'room', 'danmaku', 'store', 'error', 'mainmessage', 'uimessage', 'renderer'].forEach((ev) => {
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


    subscribe(kinds, filter, callback, opts = {}) {
      // Simplified subscribe method for backward compatibility
      // The actual subscription logic should be handled through createSubscribeApi
      if (!this._sse) {
        void this.ensureConnection().catch(() => {});
      }
      return {
        close: () => {
          // No-op for backward compatibility
        },
      };
    },


    async restoreSubscriptions() {
      const clientId = await this.ensureConnection();
      const tasks = [];

      try {
        if (this._serverState.store.keys.length > 0) {
          tasks.push(
            request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/store`, 'POST', {
              clientId,
              keys: this._serverState.store.keys,
              includeSnapshot: false,
            }).catch((e) => {
              console.warn('[plugin-worker] restore store subscribe failed:', e);
            })
          );
        }

        if (this._serverState.danmaku.rules.length > 0) {
          tasks.push(
            request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/danmaku`, 'POST', {
              clientId,
              rules: this._serverState.danmaku.rules,
            }).catch((e) => {
              console.warn('[plugin-worker] restore danmaku subscribe failed:', e);
            })
          );
        }

        if (this._serverState.renderer.subscribed) {
          tasks.push(
            request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/renderer`, 'POST', {
              clientId,
              events: ['*'],
            }).catch((e) => {
              console.warn('[plugin-worker] restore renderer subscribe failed:', e);
            })
          );
        }

        const kinds = [];
        if (this._serverState.messages.mainMessage) kinds.push('mainMessage');
        if (this._serverState.messages.uiMessage) kinds.push('uiMessage');
        if (kinds.length > 0) {
          tasks.push(
            request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/messages`, 'POST', {
              clientId,
              kinds,
            }).catch((e) => {
              console.warn('[plugin-worker] restore messages subscribe failed:', e);
            })
          );
        }
      } finally {
        if (tasks.length > 0) {
          await Promise.all(tasks);
        }
      }
    },
  };

  return sseManager;
}

module.exports = { createSseManager };

