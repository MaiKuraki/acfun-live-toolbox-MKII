const { spawn, exec } = require("child_process");
const path = require("path");
let OBSWebSocket = null;
try {
  const fs = require("fs");
  const vm = require("vm");
  const Module = require("module");
  function resolveWs() {
    const candidates = [
      path.join(process.cwd(), "packages", "main", "package.json"),
      path.join(process.cwd(), "package.json"),
      path.join((process.resourcesPath || process.cwd()), "package.json")
    ];
    for (const pkg of candidates) {
      try {
        const req = Module.createRequire(pkg);
        const WebSocket = req("ws");
        return { WebSocket, req };
      } catch (_) {}
    }
    const req = Module.createRequire(__filename);
    let WebSocket = null;
    try { WebSocket = req("ws"); } catch (_) {}
    return { WebSocket, req };
  }
  const { WebSocket, req } = resolveWs();
  const code = fs.readFileSync(path.join(__dirname, "obs-websocket-js.js"), "utf-8");
  const sandbox = {
    OBSWebSocket: null,
    WebSocket,
    require: req,
    global: {},
    console: {
      log: (...args) => { try { console.log(...args); } catch {} },
      info: (...args) => { try { console.info(...args); } catch {} },
      warn: (...args) => { try { console.warn(...args); } catch {} },
      error: (...args) => { try { console.error(...args); } catch {} },
      debug: (...args) => { try { console.debug(...args); } catch {} }
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "obs-websocket-js.js", displayErrors: true });
  if (typeof sandbox.OBSWebSocket === "function") {
    OBSWebSocket = sandbox.OBSWebSocket;
  }
} catch(e) {
  try { console.error(e && e.message ? e.message : String(e)); } catch {}
}

try {
  console.info("[obs-assistant] module loaded");
} catch {}

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
  loopTimer: null,
  retryMs: 1000,
  lastError: "",
  lastAttempt: "",
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
    } catch {
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
    const child = spawn(p, [], { detached: true, stdio: "ignore" });
    try {
      child.unref();
    } catch {}
    return { ok: true, launched: true };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

async function connectObs() {
  if (state.connected) return { ok: true };
  if (state.connecting) return { ok: false, error: "CONNECT_IN_PROGRESS" };
  if (typeof OBSWebSocket !== "function") {
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
    const obs = new OBSWebSocket();
    await obs.connect(host, password ? password : undefined);
    state.obs = obs;
    state.connected = true;
    state.connecting = false;
    state.lastError = "";
    console.info("[obs-assistant] connectObs success");
    try {
      if (state.obs && typeof state.obs.on === "function") {
        state.obs.on("ConnectionClosed", () => {
          try {
            state.connected = false;
          } catch {}
          console.warn("[obs-assistant] OBS connection closed");
          try {
            scheduleNext(1000);
          } catch {}
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
    console.error("[obs-assistant] connectObs failed", state.lastError);
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
    return {
      ok: false,
      error: e && e.message ? e.message : String(e),
      connected: !!state.connected,
      connecting: !!state.connecting,
      lastError: state.lastError || "",
    };
  }
}

function parseResolution(res) {
  try {
    const s = String(res || "");
    const m = s.match(/(\d+)x(\d+)/i);
    if (m) return { w: parseInt(m[1], 10), h: parseInt(m[2], 10) };
  } catch {}
  return null;
}

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
      const tc =
        Array.isArray(transcodes) && transcodes.length ? transcodes[0] : null;
      if (tc && tc.resolution) {
        const r = parseResolution(tc.resolution);
        if (r) {
          try {
            await state.obs.call("SetVideoSettings", {
              baseWidth: r.w,
              baseHeight: r.h,
              outputWidth: r.w,
              outputHeight: r.h,
            });
          } catch {}
        }
      }
      return { ok: true, configured: true };
    }
    return { ok: false, error: "OBS_INSTANCE_INVALID" };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

function clearLoop() {
  try {
    if (state.loopTimer) {
      clearTimeout(state.loopTimer);
      state.loopTimer = null;
    }
  } catch {}
}

function scheduleNext(ms) {
  clearLoop();
  const delay = Math.max(200, ms || state.retryMs || 1000);
  state.loopTimer = setTimeout(runLoop, delay);
}

async function runLoop() {
  try {
    console.info("[obs-assistant] loop tick");
    const running = await isObsRunning();
    console.info("[obs-assistant] loop detect", {
      running,
      autoStart: !!state.config.autoStartObs,
    });
    if (!running && state.config.autoStartObs) {
      const p = String(state.config.obsPath || "").trim();
      if (p) {
        try {
          await ensureObsRunning();
        } catch {}
      }
    }
    if (!state.connected) {
      const res = await connectObs();
      console.info("[obs-assistant] loop connect result", res);
      if (res && res.ok) {
        state.retryMs = 1000;
        scheduleNext(3000);
        return;
      }
      state.retryMs = Math.min((state.retryMs || 1000) * 2, 10000);
    } else {
      state.retryMs = 3000;
    }
  } catch {}
  scheduleNext(state.retryMs);
}

async function init() {
  try {
    console.info("[obs-assistant] loop start");
    scheduleNext(2000);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

async function onConfigUpdated(merged) {
  try {
    const next = Object.assign({}, state.config, merged || {});
    state.config = next;
    state.retryMs = 1000;
    scheduleNext(500);
    return { ok: true };
  } catch (e) {
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
  clearLoop();
  return { ok: true };
}

module.exports = {
  init,
  onConfigUpdated,
  ensureObsRunning,
  applyObsSettings,
  cleanup,
  connectObs,
  getStatus,
};
