## 目标
- 仅当插件 `index.js` 内定义了同名函数时才执行生命周期钩子（afterloaded、beforeUnloaded 等）。
- 当函数不存在时，不报错、不触发错误恢复，不打印“Plugin execution error”；同时仍由主进程统一发布生命周期 SSE 事件。

## 实施方案
1) 扩展执行接口（可选执行）
- 文件：`packages/main/src/plugins/ProcessManager.ts`
- 方法：`executeInPlugin(pluginId, method, args = [], timeout?, options?)`
- 新增参数：`options?: { optional?: boolean }`
- 错误处理调整：当 `options?.optional === true` 且错误消息包含 `Method ... not found`，直接返回（不记录错误、不调用 `pluginErrorHandler`、不触发恢复）。其它错误维持原行为。

2) 调整调用点为可选执行
- `process.started` 调用 `afterloaded()`：传入 `optional:true`
  - 文件：`packages/main/src/plugins/PluginManager.ts`（进程启动事件回调）
- `stopPluginProcess()` 调用 `beforeUnloaded()`：传入 `optional:true`
  - 文件：`packages/main/src/plugins/ProcessManager.ts`（停止进程前）

3) 保持主进程 SSE 发布
- 即使函数不存在仍发布 `plugin-after-loaded` 与 `plugin-before-unloaded`，满足“生命周期事件由主进程统一广播”的约定。

## 验证
- 对不实现 `afterloaded()` 的插件：不再出现“Method ... not found”错误日志与 Promise rejection；SSE 事件仍正常广播。
- 对实现了 `afterloaded()` 的插件：正常执行函数并广播事件。
- 其它错误（非方法不存在）：仍记录并走错误处理与恢复逻辑。

如确认，我将按上述方案修改 `ProcessManager.executeInPlugin` 和相应调用点。