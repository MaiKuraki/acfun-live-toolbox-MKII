## 目标
- 将 `onError` 的 SSE 发布回收到主进程统一队列，插件侧不再发布错误事件。
- 继续按方案：主进程在生命周期到达时调用插件同名函数，并由主进程统一发布 `plugin-after-loaded` 与 `plugin-before-unloaded`。
- 插件侧仅执行自身逻辑，所有生命周期与错误事件的 SSE 发布都由主进程负责。

## 代码改动
### 主进程发布
- `packages/main/src/plugins/PluginManager.ts`
  - 在 `process.started` 触发后：调用 `executeInPlugin(pluginId,'afterloaded',[])`，随后通过 `SseQueueService.queueOrPublish('plugin:${id}:overlay', { event:'plugin-after-loaded', payload:{ ts: Date.now() } }, { ttlMs:120000, persist:true, meta:{ kind:'lifecycle' } })` 发布。
  - 在 `setupLifecycleEvents('onError')`：保留 `executeInPlugin('onError', [error, context])`；增加 `SseQueueService.queueOrPublish(channel, { event:'plugin-error', payload:{ message, context } }, { ttlMs:120000, persist:true, meta:{ kind:'lifecycle' } })`。
- `packages/main/src/plugins/ProcessManager.ts`
  - 在 `stopPluginProcess()`：先 `executeInPlugin(pluginId,'beforeUnloaded',[])`，随后主进程通过 `SseQueueService.queueOrPublish('plugin:${id}:overlay', { event:'plugin-before-unloaded', payload:{ ts: Date.now() } }, { ttlMs:120000, persist:true, meta:{ kind:'lifecycle' } })` 发布。

### ApiServer 队列集成（已完成）
- 保持 `/sse/...` 建立连接时调用 `markReady(channel)`；所有 Overlay 发布改为 `queueOrPublish`（已接入）。

### 插件侧清理
- `buildResources/plugins/obs-assistant/index.js`
  - 删除在 `afterloaded()` 内调用 `postOverlayEvent('plugin-after-loaded', ...)`。
  - 删除在 `beforeUnloaded()` 内调用 `postOverlayEvent('plugin-before-unloaded', ...)`。
  - 在 `onError(err, context)` 中删除 `postOverlayEvent('plugin-error', ...)`；仅保留内部日志或必要处理。
  - 保留 `postOverlayEvent(event, payload)` 方法供业务事件使用；不用于生命周期与错误事件。

## 验证
- 启动后：仅主进程发布 `plugin-after-loaded`；插件不再直接发。
- 停止前：仅主进程发布 `plugin-before-unloaded`。
- 发生错误：主进程发布 `plugin-error`（插件 `onError()` 仍执行内部逻辑）。
- SSE 队列：未连接时事件入队，连接后回放；连接后事件即时广播。

如确认，我将按上述步骤修改主进程与插件侧代码并完成验证。