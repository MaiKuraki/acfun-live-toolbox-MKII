## 原因分析

* 重复日志：主进程在处理 `plugin_log` 时，既调用了 `PluginLogger`（它会镜像到控制台），又用 `console.*` 再打印一次，导致每条插件日志出现两遍。

* “OBSWebSocket is not a constructor”：当前加载的是 `obs-ws.global.js`（全局版），`require('./obs-websocket-js.js')` 返回的是空对象 `{}`，我们把它当成构造函数使用；应当优先取 `globalThis.OBSWebSocket` 或 `lib.default`，否则校验类型后报“库不可用”。

## 修改方案（不改功能，只修正日志与加载）

1. 去重日志输出

* 在 `packages/main/src/plugins/WorkerPoolManager.ts` 的 `handleWorkerMessage` 里，`case 'plugin_log'` 只调用 `pluginLogger`，删除直接 `console.*` 输出；由 `PluginLogger` 统一镜像到控制台，避免重复。

1. 纠正 OBSWebSocket 解析

* 在 `buildResources/plugins/obs-assistant/index.js` 的加载逻辑：

  * 优先使用 `globalThis.OBSWebSocket`（全局构造函数）。

  * 其次检查 `lib.default`、`lib.OBSWebSocket` 或 `lib` 为函数。

  * 在 `connectObs()` 前增加严格校验：`typeof OBSWebSocket !== 'function'` 则返回 `{ ok:false, error:'OBS_WEBSOCKET_LIB_INVALID' }` 并记录 `lastError`，不再尝试 `new`。

## 验证

* 重启后，主进程每条插件日志只出现一次。

* 连接时不再报 “is not a constructor”；若库解析失败，会显示明确的 `OBS_WEBSOCKET_LIB_INVALID`，否则能正常发起连接并显示成功/失败原因。

## 影响范围

* 仅日志与库加载方式的修正；不会改变既有业务功能或安全策略。

