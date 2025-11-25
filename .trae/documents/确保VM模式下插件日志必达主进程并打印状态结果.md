## 现状
- 日志显示：插件以 VM 模式加载，`getStatus` 方法被调用且完成，但没有任何 `[obs-assistant] ...` 插件内部日志。
- 说明 VM 沙箱内的 `console.*` 仍未稳定转发到主进程。

## 计划修改（仅日志与可观测性，保持业务逻辑不变）
1) Worker 沙箱内显式注入独立的 `console` 包装器
- 在 `plugin-worker.js` 的 VM 加载分支里，为 `sandbox.console` 提供自定义实现：
  - `log/info/warn/error/debug` 均直接 `parentPort.postMessage({ type:'plugin_log', level, message, pluginId })`
  - 不依赖外层的 `console`，确保 VM 内日志必达主进程。

2) 主进程 IPC 打印返回数据摘要
- 在 `plugin.process.execute` 成功路径，追加打印 `{ method, resultSummary }`（例如 `getStatus` 的 `connected/connecting/running/lastError/lastAttempt`），方便直接看到状态数值。

## 验证
- 重启并打开 UI 后，主进程应出现：
  - `[obs-assistant] module loaded / loop start / isObsRunning result / connectObs ...` 等插件日志
  - IPC 输出 `getStatus` 的返回摘要，用于判定运行与连接情况。

## 影响范围
- 仅增强日志链路与可观测性；不改变任何业务逻辑或安全策略。