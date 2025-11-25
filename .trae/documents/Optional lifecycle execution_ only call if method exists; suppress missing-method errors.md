## 变更目标
- 为插件生命周期执行增加“可选”模式：当插件未定义对应函数时，不报错、不恢复，仅跳过执行；SSE 生命周期事件仍由主进程统一发布。

## 实施内容
1) 扩展 `ProcessManager.executeInPlugin` 支持 `options?: { optional?: boolean }`
- 当 `optional=true` 且错误消息包含 `Method ... not found` 或 `not found on plugin or sandbox`，静默返回，不记录错误，不调用 `pluginErrorHandler`，不触发恢复。

2) 在生命周期调用点使用可选执行
- 进程启动事件中调用 `afterloaded()`：改为 `executeInPlugin(pluginId, 'afterloaded', [], undefined, { optional: true })`
- 停止前调用 `beforeUnloaded()`：改为 `executeInPlugin(pluginId, 'beforeUnloaded', [], 5000, { optional: true })`

3) SSE 发布保持不变
- 无论函数是否存在，仍发布 `plugin-after-loaded` 与 `plugin-before-unloaded` 到统一队列。

## 验证
- 未实现 `afterloaded()` 的插件不再产生“Method not found”错误与拒绝 Promise；日志干净，事件仍广播。
- 已实现的插件正常执行生命周期函数与事件发布。