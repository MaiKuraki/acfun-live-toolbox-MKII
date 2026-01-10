const { parentPort, workerData } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const { Window } = require('happy-dom');
const vm = require('vm');
const { createMainPluginApi } = require('./api/createMainPluginApi');

let dom = null;
let windowRef = null;
let documentRef = null;
let memoryInterval = null;
let pluginLoaded = false;
let apiBase = null;
let pluginId = null;
let pluginVersion = null;

// Forward plugin console to main process
(() => {
  try {
    const send = (level, args) => {
      try {
        const msg = args.map(a => { try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); } }).join(' ');
        parentPort.postMessage({ type: 'plugin_log', level: String(level || 'info'), message: msg, pluginId: workerData && workerData.pluginId });
      } catch { }
    };
    // 只发送到主进程，不调用原始 console（避免重复打印）
    console.log = (...args) => { send('info', args); };
    console.info = (...args) => { send('info', args); };
    console.warn = (...args) => { send('warn', args); };
    console.error = (...args) => { send('error', args); };
    console.debug = (...args) => { send('debug', args); };
  } catch (_) { }
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
  try { vm.runInNewContext(code + "\n//# sourceURL=" + filename, sandbox, { filename, displayErrors: true }); } catch (_) { }
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
    // pluginPath 是主文件的完整路径，pluginDir 是插件根目录
    const pluginDir = path.dirname(workerData && workerData.pluginPath ? workerData.pluginPath : '');
    pluginId = workerData && workerData.pluginId ? String(workerData.pluginId) : null;

    dom = new Window({ url: 'http://localhost:8080', width: 1920, height: 1080 });
    windowRef = dom.window;
    documentRef = windowRef.document;
    global.window = windowRef;
    global.document = documentRef;
    global.navigator = windowRef.navigator;
    try { const WS = require('ws'); if (WS) { windowRef.WebSocket = WS; } } catch (_) { try { if (typeof global.WebSocket !== 'undefined') { windowRef.WebSocket = global.WebSocket; } } catch (_) { } }
    windowRef.pluginApi = { emit(eventType, payload) { try { parentPort.postMessage({ type: 'plugin_event', eventType, payload, pluginId: workerData && workerData.pluginId }); } catch (_) { } } };
    try {
      const apiPortOpt = (workerData && workerData.sandboxConfig && workerData.sandboxConfig.sandbox && workerData.sandboxConfig.sandbox.apiPort) || undefined;
      const p = (() => {
        try { const n = Number(apiPortOpt); if (Number.isFinite(n) && n > 0 && n <= 65535) return n; } catch (e) { console.log('[Worker] Failed to parse apiPortOpt:', e); }
        try { const envP = Number(process.env && process.env.ACFRAME_API_PORT || ''); if (Number.isFinite(envP) && envP > 0 && envP <= 65535) return envP; } catch (e) { console.log('[Worker] Failed to parse ACFRAME_API_PORT:', e); }
        return undefined;
      })();
      if (p) {
        apiBase = `http://127.0.0.1:${p}`;
        windowRef.getApiPort = async () => p;
        try { windowRef.location.href = apiBase; } catch (e) { console.log('[Worker] Failed to set location.href:', e); }
      } else {
        apiBase = null;
        windowRef.getApiPort = async () => { throw new Error('API_PORT_NOT_CONFIGURED'); };
      }
      try { console.info('[Worker] apiBase resolved', { pluginId, apiBase }); } catch { }
    } catch (e) { console.log('[Worker] Failed to resolve apiBase:', e); }

    // 注入 toolboxApi
    if (apiBase && pluginId) {
      try {
        try { console.info('[Worker] attempting to inject toolboxApi', { pluginId, apiBase, pluginDir }); } catch { }
        const toolboxApi = createMainPluginApi(pluginId, undefined, apiBase);
        windowRef.toolboxApi = toolboxApi;
        windowRef.api = toolboxApi; // 兼容别名
        try { console.info('[Worker] Injected toolboxApi for main process plugin', { pluginId, version }); } catch { }
      } catch (e) {
        try { console.warn('[Worker] Failed to inject toolboxApi:', e && e.message ? e.message : String(e)); } catch { }
      }
    }

    try {
      try { console.info('[Worker] invoking beforeloaded', { pluginId, hasBeforeloaded: typeof windowRef.beforeloaded === 'function' }); } catch { }
      windowRef.beforeloaded && windowRef.beforeloaded();
    } catch (e) { console.log('[Worker] Failed to invoke beforeloaded:', e); }

    const manifestPath = path.join(pluginDir, 'manifest.json');
    let libs = [];

    // 从 sandboxConfig 中获取 libs
    if (workerData && workerData.sandboxConfig && Array.isArray(workerData.sandboxConfig.libs)) {
      libs = workerData.sandboxConfig.libs;
    }

    try {
      const dir = workerData.sandboxConfig.main?.dir || '';
      const mainFile = workerData.pluginPath;
      // 解析主文件路径，避免重复拼接
      const resolveMainFile = (pluginDir, filePath) => {
        if (path.isAbsolute(mainFile)) {
          return mainFile;
        } else {
          return path.join(dir || pluginDir, mainFile);
        }
      };

      // 解析库文件路径，避免重复拼接
      const resolveLibFile = (pluginDir, mainDir, libPath) => {
        if (path.isAbsolute(libPath)) {
          return libPath;
        }

        // 如果 mainDir 就是 pluginDir（dir 为空），直接使用 pluginDir
        if (mainDir === pluginDir) {
          return path.join(pluginDir, libPath);
        }

        const normalizedMainDir = path.normalize(mainDir);
        const normalizedLibPath = path.normalize(libPath);
        if (normalizedLibPath.startsWith(normalizedMainDir + path.sep) || normalizedLibPath === normalizedMainDir) {
          return path.join(pluginDir, libPath);
        }

        return path.join(mainDir, libPath);
      };

      // 计算 mainDir，如果 dir 为空则使用 pluginDir
      const mainDir = (!dir || dir.trim() === '')
        ? pluginDir
        : path.join(pluginDir, dir);
      const allLibs = libs;
      const libRegistry = Object.create(null);
      for (const libRel of allLibs) {
        try {
          const libPath = resolveLibFile(pluginDir, mainDir, String(libRel));
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
          try { console.error(msg); } catch { }
          throw e;
        }
      }

      const innerLibs = {
        console: console,
        path: require('path'),
        http: require('http'),
        https: require("https"),
        WebSocket: require('ws')
      }
      const pluginRequire = (id) => {

        if (libRegistry[id]) return libRegistry[id];
        if (innerLibs[id]) return innerLibs[id];
        if (id.startsWith('./')) { const k = id.replace(/^\.\//, ''); if (libRegistry[k]) return libRegistry[k]; }
        const base = path.basename(id, path.extname(id));
        if (libRegistry[base]) return libRegistry[base];
        throw new Error(`模块 "${id}" 未被允许（不在 manifest.main.libs 中）`);
      };
      windowRef.require = pluginRequire;

      const mainPath = resolveMainFile(pluginDir, workerData.sandboxConfig.main?.file || 'index.js');
      const indexContent = fs.readFileSync(mainPath, 'utf-8');
      const exportsObj = runModuleInWindow({ code: indexContent, filename: workerData.sandboxConfig.main?.file || path.basename(mainPath), windowRef, requireFn: pluginRequire });
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
        } catch (e) { console.log('[Worker] Failed to inspect exports:', e); }

        if (exportsSource && typeof exportsSource === 'object') {
          // 优先注入命名导出
          for (const key of Object.keys(exportsSource)) {
            const val = exportsSource[key];
            if (typeof val === 'function' && typeof windowRef[key] !== 'function') {
              windowRef[key] = val;
              try { console.info(`[Worker] Injected named export: ${key}`); } catch (e) { console.log('[Worker] Failed to log named export injection:', e); }
            }
          }
          // 如果是默认对象导出，也注入其属性
          if (exportsSource.default && typeof exportsSource.default === 'object') {
            for (const key of Object.keys(exportsSource.default)) {
              const val = exportsSource.default[key];
              if (typeof val === 'function' && typeof windowRef[key] !== 'function') {
                windowRef[key] = val;
                try { console.info(`[Worker] Injected default export: ${key}`); } catch (e) { console.log('[Worker] Failed to log default export injection:', e); }
              }
            }
          }
        }
      } catch (e) { console.log('[Worker] Failed to inject exports:', e); }

      if (typeof windowRef.afterLoaded === 'function') {

        try {
          const api = windowRef.toolboxApi || windowRef.api;
          try { console.info('[Worker] calling afterLoaded', { pluginId, hasApi: !!api }); } catch (e) { console.log('[Worker] Failed to log afterLoaded call:', e); }
          if (api) {
            await windowRef.afterLoaded(api);
          } else {
            console.warn('[Worker] afterLoaded called but toolboxApi not available', { pluginId, pluginPath });
          }
        } catch (e) {
          console.error('[Worker] afterLoaded hook failed:', e);
        }
      } else if (typeof windowRef.afterloaded === 'function') {
        try {
          const api = windowRef.toolboxApi || windowRef.api;
          try { console.info('[Worker] calling afterloaded', { pluginId, hasApi: !!api }); } catch (e) { console.log('[Worker] Failed to log afterloaded call:', e); }
          if (api) {
            await windowRef.afterloaded(api);
          } else {
            console.warn('[Worker] afterloaded called but toolboxApi not available', { pluginId, pluginPath });
          }
        } catch (e) {
          console.error('[Worker] afterloaded hook failed:', e);
        }
      }
    } catch (e) { console.log('[Worker] Failed to load plugin modules:', e); }

    pluginLoaded = true;
    try { console.info('[Worker] plugin loaded', { pluginPath, mode: 'happydom-modules' }); } catch (e) { console.log('[Worker] Failed to log plugin loaded:', e); }
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
    if (message && message.type === 'execute') {
      const method = message.method;
      const args = Array.isArray(message.args) ? message.args : [];
      const optional = !!message.optional;
      try { console.info('[Worker] execute', { method, argsLen: Array.isArray(args) ? args.length : 0 }); } catch { }
      if (!pluginLoaded) { await loadPlugin(workerData.pluginPath); startMemoryMonitor(); }

      let targetFn = null;
      if (windowRef && typeof windowRef[method] === 'function') { targetFn = windowRef[method]; }
      else if (windowRef && windowRef.module && windowRef.module.exports && typeof windowRef.module.exports[method] === 'function') { targetFn = windowRef.module.exports[method]; }
      else if (windowRef && windowRef.module && windowRef.module.exports && windowRef.module.exports && windowRef.module.exports.default && typeof windowRef.module.exports.default[method] === 'function') { targetFn = windowRef.module.exports.default[method]; }
      if (!targetFn) {
        if (!optional) { try { console.warn('[Worker] method not found', { method }); } catch { } parentPort.postMessage({ type: 'result', error: `Method ${method} not found on window` }); }
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
        try { console.info('[Worker] complete', { method }); } catch { }
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
