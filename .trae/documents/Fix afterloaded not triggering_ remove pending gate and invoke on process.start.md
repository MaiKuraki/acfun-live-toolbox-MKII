## 原因
- 现在不再在加载阶段调用 `executeHook('afterLoaded')`；但 `process.started` 中调用插件 `afterloaded()` 是通过 `pendingInitAfterLoaded.has(pluginId)` 作为前置条件触发。
- `pendingInitAfterLoaded` 仅在 `setupLifecycleEvents()` 注册的 `afterLoaded` 钩子被执行时加入；由于加载阶段的 `afterLoaded` 钩子已被移除，集合始终为空。
- 结果：进程启动事件发生时不会调用 `afterloaded()`，也不会发布 `plugin-after-loaded`，因此你看不到触发日志。

## 修改方案
1) 在进程启动事件中无条件调用插件的 `afterloaded()` 并发布 SSE：
- 文件：`packages/main/src/plugins/PluginManager.ts`
- 修改 `setupProcessManagerEvents()`：将
  - `if (this.pendingInitAfterLoaded.has(pluginId)) { executeInPlugin('afterloaded'); publish 'plugin-after-loaded'; delete from set }`
  改为
  - 无条件：`executeInPlugin('afterloaded'); publish 'plugin-after-loaded'`（不再依赖 `pendingInitAfterLoaded`）

2) 移除不再使用的 `afterLoaded` 钩子注册与 `pendingInitAfterLoaded` 逻辑：
- 文件：`packages/main/src/plugins/PluginManager.ts`
- 删除 `setupLifecycleEvents()` 中 `registerHook('afterLoaded', ...)` 的注册块
- 删除 `pendingInitAfterLoaded` 成员的所有使用点（若仅作为集合存在，可保留或同时清理成员定义）

3) 保持 `beforeUnloaded` 与错误处理逻辑：
- `stopPluginProcess()` 前调用插件 `beforeUnloaded()` 并由主进程发布 `plugin-before-unloaded`
- `onError`：主进程调用插件 `onError()`，并统一发布 `plugin-error` 到 SSE

## 验证
- 启用插件后进程启动，ログ显示：
  - “Plugin process started successfully”
  - 随后立即看到主进程发布的 `plugin-after-loaded` 与插件 `afterloaded()` 的执行日志
- 禁用或退出前看到主进程发布的 `plugin-before-unloaded` 与插件清理日志
- SSE 队列：未连接时入队，连接后回放，无消息丢失

## 备注
- 该调整与“生命周期仅保留 afterLoaded/beforeUnloaded 且由主进程统一发布”的方案一致；插件侧不再参与生命周期事件发布。