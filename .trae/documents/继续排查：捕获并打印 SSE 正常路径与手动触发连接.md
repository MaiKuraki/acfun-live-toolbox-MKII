## 目标
在主进程插件进程启动事件后，主动调用 obs-assistant 插件的 `connectObs` 方法，将调用结果和异常打印到主进程控制台与插件日志，便于直接验证 WebSocket 层是否正常。

## 插入位置
- 文件：`packages/main/src/plugins/PluginManager.ts`
- 方法：`setupProcessManagerEvents()` 内的 `process.started` 事件处理函数（已存在对 `afterloaded` 的调用）。

## 实施细节
- 仅针对 `pluginId === 'obs-assistant'` 注入一次异步调用：
  - `await this.processManager.executeInPlugin(pluginId, 'connectObs', [], 20000)`
  - 成功：`pluginLogger.info('Debug connectObs result', pluginId, res)` 并镜像到控制台
  - 失败：`pluginLogger.error('Debug connectObs error', pluginId, err)` 并打印堆栈
- 保持现有逻辑不变，不影响其他插件与生命周期。
- 不添加注释，仅增加必要的日志与调用，符合项目约定。

## 预期输出
- 主进程日志将出现 `connectObs start`（来自插件）与 `Debug connectObs result` 或 `Debug connectObs error`（来自主进程）。
- 若失败且为环境问题（如 `WebSocket is not defined`），将看到插件侧 `connectObs failed` 的详细错误文本与堆栈，主进程也会同步错误摘要。

## 回滚
- 调试完成后可以直接移除该注入代码，不会影响正常运行。