## 目标
- 在不改变业务逻辑、不做端口探测的前提下，让你在主进程终端看到：
  - UI → 主进程的插件方法调用（process.execute）入参与返回
  - 主进程 → Worker 的指令下发
  - Worker 收到指令并执行插件方法的日志
  - 插件方法自身输出（已通过拦截 console.* 转发）

## 修改项（仅增加日志埋点）
- 主进程：`packages/main/src/ipc/ipcHandlers.ts`
  - 在 `plugin.process.execute` 处理器中：
    - 调用前 `console.log('[IPC] plugin.process.execute start', { pluginId, method, argsLen })`
    - 调用成功后 `console.log('[IPC] plugin.process.execute done', { pluginId, method, stale: !!res?.stale })`
    - 调用失败时 `console.error('[IPC] plugin.process.execute fail', { pluginId, method, error })`

- 工作线程：`packages/main/src/plugins/worker/plugin-worker.js`
  - 收到 `message.type === 'execute'` 时：
    - `console.info('[Worker] execute', { method, argsLen })`
    - 执行完成后（无论成功或失败）`console.info('[Worker] complete', { method })`
  - 这些会通过现有的 console 拦截转发到主进程并写入插件日志

- 插件：保持现有 obs-assistant 的 info/error 日志（loop start/tick、isObsRunning、connectObs），不改业务逻辑

## 验证步骤
1. 重启应用并打开 obs-assistant UI
2. 主进程终端应看到：
   - `[IPC] plugin.process.execute start ...`
   - `[Worker] execute { method:'getStatus' }`
   - `[obs-assistant] isObsRunning result { ... }` 等详细日志
3. 若仍没有 Worker/插件日志，则根据 IPC 起止日志判断是否是“UI未发起调用”或“Worker未收到执行消息”

## 影响范围
- 仅增加日志输出，不影响任何业务逻辑或安全策略；不修改 PluginFramePage 与 UI 行为。