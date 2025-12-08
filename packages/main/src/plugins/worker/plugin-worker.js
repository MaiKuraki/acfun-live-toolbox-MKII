const { parentPort, workerData } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const { Window } = require('happy-dom');
const vm = require('vm');

let dom = null;
let windowRef = null;
let documentRef = null;
let memoryInterval = null;
let pluginLoaded = false;

// Forward plugin console to main process
(() => {
  try {
    const orig = { log: console.log, warn: console.warn, error: console.error, debug: console.debug, info: console.info };
    const send = (level, args) => {
      try {
        const msg = args.map(a => { try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); } }).join(' ');
        parentPort.postMessage({ type: 'plugin_log', level: String(level || 'info'), message: msg, pluginId: workerData && workerData.pluginId });
      } catch {}
    };
    console.log = (...args) => { try { orig.log.apply(console, args); } catch {} send('info', args); };
    console.info = (...args) => { try { orig.info.apply(console, args); } catch {} send('info', args); };
    console.warn = (...args) => { try { orig.warn.apply(console, args); } catch {} send('warn', args); };
    console.error = (...args) => { try { orig.error.apply(console, args); } catch {} send('error', args); };
    console.debug = (...args) => { try { orig.debug.apply(console, args); } catch {} send('debug', args); };
  } catch (_) {}
})();

function runModuleInWindow({ code, filename, windowRef, requireFn }) {
  const module = { exports: {} };
  const exports = module.exports;
  const factory = new Function(
    'window',
    'document',
    'globalThis',
    'global',
    'self',
    'module',
    'exports',
    'require',
    `${code}\n//# sourceURL=${filename}`
  );
  factory.call(
    windowRef,
    windowRef,
    windowRef.document,
    windowRef,
    windowRef,
    windowRef, // self
    module,
    exports,
    requireFn
  );
  return module.exports;
}

function extractLibExports({ code, filename, windowRef }) {
  const before = Object.keys(windowRef);
  const sandbox = {
    window: windowRef,
    self: windowRef,
    global: windowRef,
    globalThis: windowRef,
    document: windowRef.document,
    console,
    setTimeout: typeof windowRef.setTimeout === 'function' ? windowRef.setTimeout.bind(windowRef) : (typeof setTimeout !== 'undefined' ? setTimeout.bind(global) : undefined),
    clearTimeout: typeof windowRef.clearTimeout === 'function' ? windowRef.clearTimeout.bind(windowRef) : (typeof clearTimeout !== 'undefined' ? clearTimeout.bind(global) : undefined),
    setInterval: typeof windowRef.setInterval === 'function' ? windowRef.setInterval.bind(windowRef) : (typeof setInterval !== 'undefined' ? setInterval.bind(global) : undefined),
    clearInterval: typeof windowRef.clearInterval === 'function' ? windowRef.clearInterval.bind(windowRef) : (typeof clearInterval !== 'undefined' ? clearInterval.bind(global) : undefined),
    fetch: typeof windowRef.fetch === 'function' ? windowRef.fetch.bind(windowRef) : (typeof fetch !== 'undefined' ? fetch.bind(global) : undefined),
    WebSocket: typeof windowRef.WebSocket !== 'undefined' ? windowRef.WebSocket : (typeof global.WebSocket !== 'undefined' ? global.WebSocket : undefined),
    path: path,
    module: undefined,
    exports: undefined
  };
  const beforeS = Object.keys(sandbox);
  try { vm.runInNewContext(code + "\n//# sourceURL=" + filename, sandbox, { filename, displayErrors: true }); } catch (_) {}
  const after = Object.keys(windowRef);
  const added = after.filter(k => !before.includes(k));
  const prefer = added.includes('_') ? ['_'] : [];
  const order = prefer.concat(added.filter(k => !prefer.includes(k)));
  for (const k of order) {
    const v = windowRef[k];
    if (typeof v === 'function') return v;
    if (v && typeof v === 'object' && Object.keys(v).length > 0) return v;
  }
  const afterS = Object.keys(sandbox);
  const addedS = afterS.filter(k => !beforeS.includes(k));
  const preferS = addedS.includes('timeago') ? ['timeago'] : [];
  const orderS = preferS.concat(addedS.filter(k => !preferS.includes(k)));
  for (const k of orderS) {
    const v = sandbox[k];
    if (typeof v === 'function') return v;
    if (v && typeof v === 'object' && Object.keys(v).length > 0) return v;
  }
  return undefined;
}

async function loadPlugin(pluginPath) {
  try {
    const pluginDir = path.dirname(workerData && workerData.pluginPath ? workerData.pluginPath : '');

    dom = new Window({ url: 'http://localhost:8080', width: 1920, height: 1080 });
    windowRef = dom.window;
    documentRef = windowRef.document;
    global.window = windowRef;
    global.document = documentRef;
    global.navigator = windowRef.navigator;
    try { windowRef.console = console; } catch {}
    try { windowRef.path = require('path'); } catch {}
    try { windowRef.http = require('http'); } catch {}
    try { windowRef.https = require('https'); } catch {}
    try { windowRef.child_process = require('child_process'); } catch {}
    try { windowRef.childProcess = windowRef.child_process; } catch {}
    try { windowRef.exec = windowRef.child_process && windowRef.child_process.exec ? windowRef.child_process.exec : undefined; } catch {}
    try { windowRef.spawn = windowRef.child_process && windowRef.child_process.spawn ? windowRef.child_process.spawn : undefined; } catch {}
    try { windowRef.setTimeout = typeof setTimeout !== 'undefined' ? setTimeout.bind(global) : windowRef.setTimeout; } catch {}
    try { windowRef.setInterval = typeof setInterval !== 'undefined' ? setInterval.bind(global) : windowRef.setInterval; } catch {}
    try { windowRef.clearTimeout = typeof clearTimeout !== 'undefined' ? clearTimeout.bind(global) : windowRef.clearTimeout; } catch {}
    try { windowRef.clearInterval = typeof clearInterval !== 'undefined' ? clearInterval.bind(global) : windowRef.clearInterval; } catch {}
    try { const WS = require('ws'); if (WS) { windowRef.WebSocket = WS; } } catch (_) { try { if (typeof global.WebSocket !== 'undefined') { windowRef.WebSocket = global.WebSocket; } } catch (_) {} }
    windowRef.pluginApi = { emit(eventType, payload) { try { parentPort.postMessage({ type: 'plugin_event', eventType, payload, pluginId: workerData && workerData.pluginId }); } catch (_) {} } };
    try {
      const apiPortOpt = (workerData && workerData.sandboxConfig && workerData.sandboxConfig.sandbox && workerData.sandboxConfig.sandbox.apiPort) || undefined;
      const p = (() => {
        try { const n = Number(apiPortOpt); if (Number.isFinite(n) && n > 0 && n <= 65535) return n; } catch {}
        try { const envP = Number(process.env && process.env.ACFRAME_API_PORT || ''); if (Number.isFinite(envP) && envP > 0 && envP <= 65535) return envP; } catch {}
        return undefined;
      })();
      if (p) {
        windowRef.getApiPort = async () => p;
        try { windowRef.location.href = `http://127.0.0.1:${p}`; } catch {}
      } else {
        windowRef.getApiPort = async () => { throw new Error('API_PORT_NOT_CONFIGURED'); };
      }
    } catch {}
    try { windowRef.beforeloaded && windowRef.beforeloaded(); } catch {}

    const manifestPath = path.join(pluginDir, 'manifest.json');
    let testMode = false;
    let mainRel = '';
    let libs = [];
    try {
      const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
      const manifestJson = JSON.parse(manifestRaw);
      testMode = !!manifestJson.test;
      mainRel = String(manifestJson.main || '').trim();
      libs = Array.isArray(manifestJson.libs) ? manifestJson.libs : [];
    } catch (_e) {}

    try {
      const resolveFile = (rel) => {
        const p1 = path.join(pluginDir, rel);
        return p1;
      };

      const allLibs = Array.isArray(libs) ? libs : [];
      const libRegistry = Object.create(null);
      for (const libRel of allLibs) {
        try {
          const libPath = resolveFile(String(libRel));
          if (!fs.existsSync(libPath)) { throw new Error(`lib not found: ${libRel}`); }
          const content = fs.readFileSync(libPath, 'utf-8');
          const normalized = String(libRel);
          const basename = path.basename(normalized, path.extname(normalized));
          const exportsObj = extractLibExports({ code: content, filename: String(libRel), windowRef });
          if (exportsObj && (typeof exportsObj === 'function' || (typeof exportsObj === 'object' && Object.keys(exportsObj).length > 0))) {
            libRegistry[normalized] = exportsObj;
            libRegistry['./' + normalized] = exportsObj;
            libRegistry[basename] = exportsObj;
          } else {
            throw new Error(`lib export invalid: ${libRel}`);
          }
        } catch (e) {
          const msg = e && e.message ? e.message : String(e);
          try { console.error(msg); } catch {}
          throw e;
        }
      }

      const pluginRequire = (id) => {
        if (libRegistry[id]) return libRegistry[id];
        if (id.startsWith('./')) { const k = id.replace(/^\.\//, ''); if (libRegistry[k]) return libRegistry[k]; }
        const base = path.basename(id, path.extname(id));
        if (libRegistry[base]) return libRegistry[base];
        throw new Error(`模块 "${id}" 未被允许（不在 manifest.libs 中）`);
      };
      windowRef.require = pluginRequire;

      const mainPath = path.resolve(pluginPath);
      const indexContent = fs.readFileSync(mainPath, 'utf-8');
      const exportsObj = runModuleInWindow({ code: indexContent, filename: mainRel || path.basename(mainPath), windowRef, requireFn: pluginRequire });
      try {
        windowRef.module = { exports: exportsObj };
        windowRef.exports = exportsObj.exports;
        // 尝试将导出对象的方法注入到 windowRef
        const exportsSource = exportsObj && exportsObj.exports ? exportsObj.exports : exportsObj;
        try {
          console.info('[Worker] Inspecting exports', { 
            keys: exportsSource ? Object.keys(exportsSource) : [], 
            hasDefault: !!(exportsSource && exportsSource.default),
            defaultKeys: (exportsSource && exportsSource.default) ? Object.keys(exportsSource.default) : []
          });
        } catch {}

        if (exportsSource && typeof exportsSource === 'object') {
           // 优先注入命名导出
           for (const key of Object.keys(exportsSource)) {
             const val = exportsSource[key];
             if (typeof val === 'function' && typeof windowRef[key] !== 'function') {
               windowRef[key] = val;
               try { console.info(`[Worker] Injected named export: ${key}`); } catch {}
             }
           }
           // 如果是默认对象导出，也注入其属性
           if (exportsSource.default && typeof exportsSource.default === 'object') {
             for (const key of Object.keys(exportsSource.default)) {
               const val = exportsSource.default[key];
               if (typeof val === 'function' && typeof windowRef[key] !== 'function') {
                 windowRef[key] = val;
                 try { console.info(`[Worker] Injected default export: ${key}`); } catch {}
               }
             }
           }
        }
      } catch {}

      if (typeof windowRef.afterLoaded === 'function') {
        try { await windowRef.afterLoaded(); } catch (e) {}
      } else if (typeof windowRef.afterloaded === 'function') {
        try { await windowRef.afterloaded(); } catch (e) {}
      }
    } catch (e) {}

    pluginLoaded = true;
    try { console.info('[Worker] plugin loaded', { pluginPath, mode: 'happydom-modules' }); } catch {}
  } catch (error) {
    const msg = error && error.message ? error.message : String(error);
    parentPort.postMessage({ type: 'result', error: msg });
  }
}

function startMemoryMonitor() {
  stopMemoryMonitor();
  memoryInterval = setInterval(() => {
    try {
      const usage = process.memoryUsage().heapUsed;
      parentPort.postMessage({ type: 'memory_usage', usage });
    } catch (_) {
      // noop
    }
  }, 10000);
}

function stopMemoryMonitor() {
  if (memoryInterval) {
    clearInterval(memoryInterval);
    memoryInterval = null;
  }
}

parentPort.on('message', async (message) => {
  try {
    if (message && typeof message === 'object' && 'id' in message && 'type' in message && 'timestamp' in message && message.type !== 'execute') {
      let result;
      try {
        if (!pluginLoaded) { await loadPlugin(workerData.pluginPath); startMemoryMonitor(); }
        if (windowRef && typeof windowRef.handleMessage === 'function') { result = await windowRef.handleMessage(message.type, message.payload); } else { result = { ok: true }; }
      } catch (err) {
        result = { ok: false, error: err && err.message ? err.message : String(err) };
      }
      parentPort.postMessage({ id: message.id, type: message.type, payload: result, timestamp: Date.now(), signature: message.signature, encrypted: false });
      return;
    }

    if (message && message.type === 'execute') {
      const method = message.method;
      const args = Array.isArray(message.args) ? message.args : [];
      const optional = !!message.optional;
      try { console.info('[Worker] execute', { method, argsLen: Array.isArray(args) ? args.length : 0 }); } catch {}
      if (!pluginLoaded) { await loadPlugin(workerData.pluginPath); startMemoryMonitor(); }

      let targetFn = null;
      if (windowRef && typeof windowRef[method] === 'function') { targetFn = windowRef[method]; }
      else if (windowRef && windowRef.module && windowRef.module.exports && typeof windowRef.module.exports[method] === 'function') { targetFn = windowRef.module.exports[method]; }
      else if (windowRef && windowRef.module && windowRef.module.exports && windowRef.module.exports && windowRef.module.exports.default && typeof windowRef.module.exports.default[method] === 'function') { targetFn = windowRef.module.exports.default[method]; }
      if (!targetFn) {
        if (!optional) { try { console.warn('[Worker] method not found', { method }); } catch {} parentPort.postMessage({ type: 'result', error: `Method ${method} not found on window` }); }
        else { parentPort.postMessage({ type: 'result', result: undefined }); }
        parentPort.postMessage({ type: 'execution_complete' });
        return;
      }

      try {
        const res = await targetFn(...args);
        let safeRes = res;
        try { safeRes = JSON.parse(JSON.stringify(res)); } catch { try { safeRes = String(res); } catch { safeRes = null; } }
        parentPort.postMessage({ type: 'result', result: safeRes });
      } catch (err) {
        parentPort.postMessage({ type: 'result', error: err && err.message ? err.message : String(err) });
      } finally {
        parentPort.postMessage({ type: 'execution_complete' });
        try { console.info('[Worker] complete', { method }); } catch {}
      }
      return;
    }
  } catch (err) {
    parentPort.postMessage({ type: 'result', error: err && err.message ? err.message : String(err) });
    parentPort.postMessage({ type: 'execution_complete' });
  }
});

process.on('exit', async () => {
  try {
    stopMemoryMonitor();
    if (windowRef && typeof windowRef.cleanup === 'function') { await windowRef.cleanup(); }
  } catch (_) {
    // noop
  }
});
