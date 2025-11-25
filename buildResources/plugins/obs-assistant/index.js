const path = window.path || undefined;  
const http = window.http || undefined;
const childProcess =  window.child_process || undefined;
const spawn = childProcess && childProcess.spawn ? childProcess.spawn : undefined;
const exec = childProcess && childProcess.exec ? childProcess.exec : undefined;
const OBSWebSocket = (typeof window !== 'undefined' && window && typeof window.require === 'function') ? window.require('obs-websocket-js') : undefined;
try { console.info("[obs-assistant] module loaded"); 
} catch(e){
  console.log(e)
}

let state = {
  config: {
    obsPath: "",
    autoStartObs: true,
    syncStreaming: true,
    wsPort: 4455,
    wsPassword: "",
  },
  obs: null,
  connected: false,
  connecting: false,
  lastError: "",
  lastAttempt: "",
  
  overlaySseConn: null,
  overlaySseBuffer: "",
  overlaySseReconnectTimer: null,
  obsReconnectTimer: null,
  obsRetryCount: 0,
  obsRetryBaseDelay: 3000,
  currentRoutePath: "",
  configLoaded: false,
  lastErrorToastAt: 0,
  overlayLastId: "",
};

async function isObsRunning() {
  return await new Promise((resolve) => {
    try {
      exec('tasklist /FI "IMAGENAME eq obs64.exe"', (err, stdout) => {
        if (err) return resolve(false);
        const hasObs64 = typeof stdout === "string" && stdout.toLowerCase().includes("obs64.exe");
        if (hasObs64) return resolve(true);
        exec('tasklist /FI "IMAGENAME eq obs.exe"', (e2, out2) => {
          if (e2) return resolve(false);
          const hasObs = typeof out2 === "string" && out2.toLowerCase().includes("obs.exe");
          if (hasObs) return resolve(true);
          resolve(false);
        });
      });
    } catch (e) {
      try { console.warn('[obs-assistant] isObsRunning error', e && e.message ? e.message : String(e)); } catch {}
      resolve(false);
    }
  });
}

async function ensureObsRunning() {
  const running = await isObsRunning();
  if (running) return { ok: true, running: true };
  const p = String(state.config.obsPath || "").trim();
  if (!p) return { ok: false, error: "OBS_PATH_NOT_CONFIGURED" };
  try {
    const cwd = (() => { try { return path.dirname(p); } catch { return undefined; } })();
    const child = spawn(p, [], { cwd, detached: true, stdio: "ignore" });
    try {
      child.unref();
    } catch {}
    return { ok: true, launched: true };
  } catch (e) {
    try { console.error('[obs-assistant] ensureObsRunning error', e && e.stack ? e.stack : (e && e.message ? e.message : String(e))); } catch {}
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

async function connectObs() {
  if (state.connected) return { ok: true };
  if (state.connecting) return { ok: false, error: "CONNECT_IN_PROGRESS" };
  const ObsWS = OBSWebSocket;
  
  if (typeof ObsWS !== "function") {
    state.lastError = "OBS_WEBSOCKET_LIB_INVALID";
    return { ok: false, error: "OBS_WEBSOCKET_LIB_INVALID" };
  }
  const port = Number(state.config.wsPort || 4455);
  const password = String(state.config.wsPassword || "");
  const host = `ws://127.0.0.1:${port}`;
  try {
    console.info("[obs-assistant] connectObs start", { host, port });
    state.lastAttempt = `${host}`;
    state.connecting = true;
    const obs = new ObsWS();
    try {
      await obs.connect(host, password ? password : undefined);
    } catch (e) {
      if (password) {
        try { await obs.connect(host, { password }); } catch (_) { throw e; }
      } else {
        throw e;
      }
    }
    state.obs = obs;
    state.connected = true;
    state.connecting = false;
    state.lastError = "";
    try {
      if (state.obsReconnectTimer) {
        clearTimeout(state.obsReconnectTimer);
        state.obsReconnectTimer = null;
      }
      state.obsRetryCount = 0;
    } catch {}
    console.info("[obs-assistant] connectObs success");
    try {
      if (state.obs && typeof state.obs.on === "function") {
        state.obs.on("ConnectionClosed", () => {
          try {
            state.connected = false;
          } catch {}
          console.warn("[obs-assistant] OBS connection closed");
        });
      }
    } catch {}
    return { ok: true };
  } catch (e) {
    state.connecting = false;
    state.connected = false;
    state.obs = null;
    try {
      state.lastError = e && e.message ? String(e.message) : String(e);
    } catch {
      state.lastError = "unknown_error";
    }
    try { console.error('[obs-assistant] connectObs failed', { host, port, hasPassword: !!password, error: state.lastError }); } catch {}
    try { if (e && e.stack) { console.error('[obs-assistant] connectObs stack', e.stack); } } catch {}
    try { tryShowErrorToast(state.lastError); } catch {}
    try { scheduleObsReconnect('connect_failed'); } catch {}
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

// 返回当前连接状态（用于 UI 展示）
async function getStatus() {
  try {
    const running = await isObsRunning();
    console.info("[obs-assistant] isObsRunning result", { running });
    return {
      ok: true,
      connected: !!state.connected,
      connecting: !!state.connecting,
      running,
      lastError: state.lastError || "",
      lastAttempt: state.lastAttempt || "",
    };
  } catch (e) {
    try { console.error('[obs-assistant] getStatus error', e && e.stack ? e.stack : (e && e.message ? e.message : String(e))); } catch {}
    return { ok: false, error: e && e.message ? e.message : String(e), connected: !!state.connected, connecting: !!state.connecting, lastError: state.lastError || '' };
  }
}

// removed: parseResolution (unused)

async function applyObsSettings(stream, transcodes) {
  const server = String((stream && stream.rtmpUrl) || "").trim();
  const key = String((stream && stream.streamKey) || "").trim();
  if (!server || !key) return { ok: false, error: "MISSING_STREAM_INFO" };
  const runRes = await ensureObsRunning();
  if (!runRes.ok) return runRes;
  const conn = await connectObs();
  if (!conn.ok) return conn;
  try {
    if (state.obs && typeof state.obs.call === "function") {
      await state.obs.call("SetStreamServiceSettings", {
        streamServiceType: "rtmp_custom",
        streamServiceSettings: { server, key },
      });
      return { ok: true, configured: true };
    }
    return { ok: false, error: "OBS_INSTANCE_INVALID" };
  } catch (e) {
    try { console.error('[obs-assistant] applyObsSettings error', e && e.stack ? e.stack : (e && e.message ? e.message : String(e))); } catch {}
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

async function startStreaming() {
  const conn = await connectObs();
  if (!conn.ok) return conn;
  try {
    if (state.obs && typeof state.obs.call === "function") {
      await state.obs.call("StartStream");
      return { ok: true, started: true };
    }
    return { ok: false, error: "OBS_INSTANCE_INVALID" };
  } catch (e) {
    try { console.error('[obs-assistant] startStreaming error', e && e.stack ? e.stack : (e && e.message ? e.message : String(e))); } catch {}
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

async function applyObsAndStart(stream, transcodes) {
  const cfg = await applyObsSettings(stream, transcodes);
  if (!cfg || !cfg.ok) return cfg;
  const st = await startStreaming();
  if (!st || !st.ok) return st;
  return { ok: true, configured: true, started: true };
}

async function afterloaded() {
  try {
    try { console.log('afterloaded init'); } catch {}
    const __t0 = Date.now();
    console.info("[obs-assistant] init start");
    try { await loadInitialConfig(); } catch(e) {
      console.log(e)
    }
    try { console.info('[obs-assistant] init autoStartObs=', !!(state.config && state.config.autoStartObs), 'obsPath=', String(state.config && state.config.obsPath || '')); } catch {}
    try {
      if (state.config && state.config.autoStartObs) {
        try { console.info('[obs-assistant] ensureObsRunning attempt'); } catch {}
        await ensureObsRunning();
      }
    } catch {}
    try { openPluginOverlaySse(); } catch {}
    try { console.info('[obs-assistant] afterloaded elapsed(ms)=', Date.now() - __t0); } catch {}
    
    return { ok: true };
  } catch (e) {
    try { console.error('[obs-assistant] afterloaded error', e && e.stack ? e.stack : (e && e.message ? e.message : String(e))); } catch {}
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

async function onConfigUpdated(merged) {
  try {
    const next = Object.assign({}, state.config, merged || {});
    state.config = next;
    return { ok: true };
  } catch (e) {
    try { console.error('[obs-assistant] onConfigUpdated error', e && e.stack ? e.stack : (e && e.message ? e.message : String(e))); } catch {}
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

async function cleanup() {
  try {
    if (state.obs && typeof state.obs.disconnect === "function") {
      try {
        await state.obs.disconnect();
      } catch {}
    }
  } catch {}
  state.obs = null;
  state.connected = false;
  state.connecting = false;
  return { ok: true };
}

async function beforeUnloaded() {
  try {
    try {
      if (state.obs && typeof state.obs.disconnect === 'function') {
        await state.obs.disconnect();
      }
    } catch {}
    state.obs = null;
    state.connected = false;
    state.connecting = false;
    
    return { ok: true };
  } catch (e) {
    try { console.error('[obs-assistant] beforeUnloaded error', e && e.stack ? e.stack : (e && e.message ? e.message : String(e))); } catch {}
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

async function onError(err, context) {
  try {
    const msg = err && err.message ? err.message : String(err || '');
    
    return { ok: true };
  } catch (e) {
    try { console.error('[obs-assistant] onError handler error', e && e.stack ? e.stack : (e && e.message ? e.message : String(e))); } catch {}
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}



function getApiPort() {
  try {
    const p = Number((process && process.env && process.env.ACFRAME_API_PORT) || 18299);
    if (!isNaN(p) && p > 0) return p;
    return 18299;
  } catch {
    return 18299;
  }
}

function httpGetJson(pathname) {
  return new Promise((resolve, reject) => {
    try {
      const port = getApiPort();
      const options = { hostname: "127.0.0.1", port, path: String(pathname || "/"), method: "GET", headers: { Accept: "application/json" } };
      const req = http.request(options, (res) => {
        let buf = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { buf += String(chunk || ""); });
        res.on("end", () => {
          try { resolve(JSON.parse(buf || "{}")); } catch (e) { reject(e); }
        });
      });
      req.on("error", (e) => { try { console.warn('[obs-assistant] httpGetJson request error', { path: pathname, error: e && e.message ? e.message : String(e) }); } catch {} reject(e); });
      req.end();
    } catch (e) {
      try { console.warn('[obs-assistant] httpGetJson error', { path: pathname, error: e && e.message ? e.message : String(e) }); } catch {}
      reject(e);
    }
  });
}
async function loadInitialConfig() {
  try {
    const j = await httpGetJson('/api/plugins/obs-assistant/config');
    if (j && j.success && j.data) {
      const next = Object.assign({}, state.config, j.data || {});
      state.config = next;
    }
  } catch (e) {
    try { console.warn('[obs-assistant] initial config load failed', e && e.message ? e.message : String(e)); } catch {}
  }
}

function httpPostJson(pathname, body) {
  return new Promise((resolve, reject) => {
    try {
      const port = getApiPort();
      const payload = JSON.stringify(body || {});
      const options = { hostname: "127.0.0.1", port, path: String(pathname || "/"), method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } };
      const req = http.request(options, (res) => {
        let buf = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { buf += String(chunk || ""); });
        res.on("end", () => {
          try { resolve(JSON.parse(buf || "{}")); } catch (e) { reject(e); }
        });
      });
      req.on("error", (e) => { try { console.warn('[obs-assistant] httpPostJson request error', { path: pathname, error: e && e.message ? e.message : String(e) }); } catch {} reject(e); });
      req.write(payload);
      req.end();
    } catch (e) {
      try { console.warn('[obs-assistant] httpPostJson error', { path: pathname, error: e && e.message ? e.message : String(e) }); } catch {}
      reject(e);
    }
  });
}

// removed: readonly-store SSE functions and state (now using active fetch before start)

function openPluginOverlaySse() {
  try {
    try {
      if (state.overlaySseConn) {
        return;
      }
    } catch {}
    const port = getApiPort();
    const lastId = String(state.overlayLastId || "").trim();
    const headers = { Accept: "text/event-stream" };
    try { if (lastId) { headers["Last-Event-ID"] = lastId; } } catch {}
    const options = { hostname: "127.0.0.1", port, path: "/sse/plugins/obs-assistant/overlay", method: "GET", headers };
  const req = http.request(options, (res) => {
    try {
      if (typeof res.statusCode === 'number' && res.statusCode !== 200) {
        try { console.warn('[obs-assistant] overlay SSE non-200', { statusCode: res.statusCode }); } catch {}
      }
    } catch {}
    try { state.overlaySseConn = res; } catch {}
    try { state.overlaySseBuffer = ""; } catch {}
    
    res.setEncoding("utf8");
      res.on("data", (chunk) => { try { handleOverlaySseChunk(String(chunk || "")); } catch {} });
      res.on("close", () => { try { scheduleOverlaySseReconnect(); } catch {} });
      res.on("error", () => { try { scheduleOverlaySseReconnect(); } catch {} });
    });
    req.on("error", (e) => { try { console.warn('[obs-assistant] overlay SSE request error', e && e.message ? e.message : String(e)); } catch {} try { scheduleOverlaySseReconnect(); } catch {} });
    req.end();
  } catch (e) {
    try { console.warn('[obs-assistant] openPluginOverlaySse error', e && e.message ? e.message : String(e)); } catch {}
  }
}

function handleOverlaySseChunk(chunk) {
  try {
    state.overlaySseBuffer = (state.overlaySseBuffer || "") + String(chunk || "");
    let idx = state.overlaySseBuffer.indexOf("\n\n");
    while (idx >= 0) {
      const msg = state.overlaySseBuffer.slice(0, idx);
      state.overlaySseBuffer = state.overlaySseBuffer.slice(idx + 2);
      try { parseOverlaySseMessage(msg); } catch {}
      idx = state.overlaySseBuffer.indexOf("\n\n");
    }
  } catch (e) {
    try { console.warn('[obs-assistant] handleOverlaySseChunk error', e && e.message ? e.message : String(e)); } catch {}
  }
}

function parseOverlaySseMessage(msg) {
  try {
    let ev = "";
    let data = "";
    const lines = String(msg || "").split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith("event:")) ev = line.slice(6).trim();
      else if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (!ev || !data) return;
    try { onPluginOverlayEvent(ev, JSON.parse(data)); } catch {}
  } catch (e) {
    try { console.warn('[obs-assistant] parseOverlaySseMessage error', e && e.message ? e.message : String(e)); } catch {}
  }
}

function scheduleOverlaySseReconnect() {
  try {
    if (state.overlaySseConn) {
      try { state.overlaySseConn.removeAllListeners(); } catch {}
      try { state.overlaySseConn.destroy(); } catch {}
      state.overlaySseConn = null;
    }
  } catch (e) {
    try { console.warn('[obs-assistant] scheduleOverlaySseReconnect close error', e && e.message ? e.message : String(e)); } catch {}
  }
  try {
    if (state.overlaySseReconnectTimer) {
      clearTimeout(state.overlaySseReconnectTimer);
      state.overlaySseReconnectTimer = null;
    }
  } catch (e) {
    try { console.warn('[obs-assistant] scheduleOverlaySseReconnect timer clear error', e && e.message ? e.message : String(e)); } catch {}
  }
  try { state.overlaySseReconnectTimer = setTimeout(() => { try { openPluginOverlaySse(); } catch (e2) { try { console.warn('[obs-assistant] scheduleOverlaySseReconnect reopen error', e2 && e2.message ? e2.message : String(e2)); } catch {} } }, 3000); } catch (e) { try { console.warn('[obs-assistant] scheduleOverlaySseReconnect setTimeout error', e && e.message ? e.message : String(e)); } catch {} }
}

function scheduleObsReconnect(reason) {
  try {
    if (state.obsReconnectTimer) {
      clearTimeout(state.obsReconnectTimer);
      state.obsReconnectTimer = null;
    }
  } catch (e) {
    try { console.warn('[obs-assistant] scheduleObsReconnect timer clear error', e && e.message ? e.message : String(e)); } catch {}
  }
  try {
    const base = Number(state.obsRetryBaseDelay || 3000);
    const c = Number(state.obsRetryCount || 0);
    const delay = Math.min(base * Math.pow(2, c), 60000);
    if (state.currentRoutePath !== "/live/create") return;
    if (state.connected || state.connecting) return;
    try { console.info('[obs-assistant] scheduleObsReconnect', { reason: String(reason || ''), count: c, nextDelayMs: delay }); } catch {}
    state.obsReconnectTimer = setTimeout(async () => {
      try {
        if (state.currentRoutePath !== "/live/create") return;
        if (state.connected || state.connecting) return;
        await connectObs();
      } catch {}
    }, delay);
    state.obsRetryCount = c + 1;
  } catch (e) {
    try { console.warn('[obs-assistant] scheduleObsReconnect setTimeout error', e && e.message ? e.message : String(e)); } catch {}
  }
}

function postOverlayEvent(event, payload) {
  try {
    const body = { event: String(event || ''), payload: payload || {} };
    return httpPostJson('/api/plugins/obs-assistant/overlay/messages', body);
  } catch (e) {
    try { console.warn('[obs-assistant] postOverlayEvent error', e && e.message ? e.message : String(e)); } catch {}
    return Promise.resolve({ ok: false, error: e && e.message ? e.message : String(e) });
  }
}

// removed: emitOverlayEvent; plugin-side now always posts via ApiServer
let obsTimer = null;
async function onPluginOverlayEvent(ev, rec) {
  clearTimeout(obsTimer);
  try {
    try {
      const rid = rec && rec.id ? String(rec.id) : '';
      if (rid && state.overlayLastId === rid) return;
      state.overlayLastId = rid;
    } catch {}
    if (ev === "ui") {
      const inner = rec && rec.payload ? rec.payload : null;
      const p = inner && inner.payload ? inner.payload : null;
      const route = p && p.routePath ? String(p.routePath) : "";
      state.currentRoutePath = route;
      if (inner && inner.event === "route-changed" && route === "/live/create") {
        try {
          if (state.obsReconnectTimer) {
            clearTimeout(state.obsReconnectTimer);
            state.obsReconnectTimer = null;
          }
          state.obsRetryCount = 0;
        } catch {}
        obsTimer = setTimeout(()=>{
          tryAutoObsFlow();
        },3000)
      }
      if (inner && inner.event === "route-changed" && route !== "/live/create") {
        try {
          if (state.obsReconnectTimer) {
            clearTimeout(state.obsReconnectTimer);
            state.obsReconnectTimer = null;
          }
          state.obsRetryCount = 0;
        } catch {}
      }
    } else if (ev === "lifecycle") {
      const inner = rec && rec.payload ? rec.payload : null;
      if (inner && inner.event === "config-updated") {
        const conf = inner && inner.payload && inner.payload.config ? inner.payload.config : null;
        if (conf && typeof conf === "object") {
          try { state.config = Object.assign({}, state.config, conf); } catch {}
        }
      }
    }
  } catch (e) {
    try { console.warn('[obs-assistant] onPluginOverlayEvent error', e && e.message ? e.message : String(e)); } catch {}
  }
}

async function tryAutoObsFlow() {
  try {
    try { await loadInitialConfig(); } catch {}
    try {
      const auto = !!(state.config && state.config.autoStartObs);
      const p = String(state.config && state.config.obsPath || "").trim();
      if (auto && p) {
        await ensureObsRunning();
      }
    } catch {}
    try {
      const sync = !!(state.config && state.config.syncStreaming);
      if (sync) {
        const res = await connectObs();
        if (res && res.ok) {
          try { await showToast("已成功连接，开始尝试推流"); } catch {}
          try {
            await obsEnsureStopped(5000);
          } catch {}
          try {
            const stream = await fetchLatestStreamInfo();
            if (stream && stream.rtmpUrl && stream.streamKey) {
              const cfg = await applyObsSettings({ rtmpUrl: stream.rtmpUrl, streamKey: stream.streamKey }, null);
              if (!cfg || !cfg.ok) {
                try { await showToast(`推流参数设置失败：${String((cfg && cfg.error) || "未知错误")}`); } catch {}
                return;
              }
              const st = await startStreaming();
              if (!st || !st.ok) {
                try { await showToast(`启动OBS推流失败：${String((st && st.error) || "未知错误")}`); } catch {}
                return;
              }
            } else {
              try { await showToast("未获取到推流地址与密钥"); } catch {}
            }
          } catch (e2) {
            try { await showToast(`推流流程执行出错：${String((e2 && e2.message) || e2 || "未知错误")}`); } catch {}
          }
        } else {
          const msg = (res && res.error) ? res.error : "";
          try { await showToast(`obs连接失败：${String(msg || "未知错误")}`); } catch {}
        }
      }
    } catch {}
  } catch (e) {
    try { console.warn('[obs-assistant] tryAutoObsFlow error', e && e.message ? e.message : String(e)); } catch {}
  }
}

async function obsEnsureStopped(timeoutMs) {
  try {
    const t = 1500;
    if (state.obs && typeof state.obs.call === "function") {
      try {
        const st = await state.obs.call("GetStreamStatus", {});
        if (st && st.outputActive) {
          try { await state.obs.call("StopStream", {}); } catch {}
          const start = Date.now();
          while (Date.now() - start < t) {
            try {
              const cur = await state.obs.call("GetStreamStatus", {});
              if (cur && cur.outputActive === false) return true;
            } catch {}
            await new Promise(r => setTimeout(r, 300));
          }
        }
      } catch {}
    }
  } catch {}
  return false;
}

async function fetchLatestStreamInfo() {
  try {
    const j = await httpPostJson("/api/renderer/readonly-store/snapshot", { keys: ["stream"] });
    const d = j && j.data ? j.data : {};
    const v = d && d.stream ? d.stream : null;
    if (v && v.rtmpUrl && v.streamKey) {
      return { rtmpUrl: String(v.rtmpUrl || ""), streamKey: String(v.streamKey || "") };
    }
  } catch {}
  return null;
}

 

async function showToast(message) {
  try {
    const r = await httpPostJson("/api/popup", { action: "toast", message: String(message || ""), options: { durationMs: 2500 } });
    return { ok: !!(r && r.success) };
  } catch (e) {
    try { console.warn('[obs-assistant] showToast error', e && e.message ? e.message : String(e)); } catch {}
  }
  return { ok: false, error: "popup_unavailable" };
}

function tryShowErrorToast(errorMsg) {
  try {
    const now = Date.now();
    if (state.currentRoutePath !== "/live/create") return;
    if (now - (state.lastErrorToastAt || 0) < 3000) return;
    state.lastErrorToastAt = now;
    const msg = `obs连接错误信息：${String(errorMsg || '未知错误')}，持续重试中`;
    showToast(msg).catch(() => {});
  } catch (e) {
    try { console.warn('[obs-assistant] tryShowErrorToast error', e && e.message ? e.message : String(e)); } catch {}
  }
}

module.exports = {
  afterloaded,
  beforeUnloaded,
  onError,
  onConfigUpdated,
  ensureObsRunning,
  applyObsSettings,
  applyObsAndStart,
  cleanup,
  connectObs,
  getStatus,
  startStreaming,
};
