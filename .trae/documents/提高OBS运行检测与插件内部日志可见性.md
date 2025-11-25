## 目标
- 解决“OBS明明开着却显示未运行”的检测偏差，增加端口探测作为运行信号。
- 让插件内部的console日志（包括连接失败原因）在“查看详情-日志”里可见，便于定位问题。

## 改动
1) obs-assistant/index.js
- 新增端口探测：快速尝试连接 `127.0.0.1:<wsPort>`（300ms超时），结果作为 `wsListening` 信号。
- getStatus 返回 `running = isObsRunning() || wsListening`，同时保留 `lastError/lastAttempt`。
- 在连接失败与循环重试处 `console.error/console.warn` 打印详细原因（会被插件日志捕获）。

2) 插件工作线程日志转发
- plugin-worker.js 拦截 `console.log/warn/error/debug`，转发为 `parentPort.postMessage({ type:'plugin_log', level, message })`。
- WorkerPoolManager 处理 `plugin_log` 消息并写入 `pluginLogger`（按级别）。

## 验证
- 当OBS已运行但tasklist不命中时，端口探测仍能显示“运行中”。
- 插件内部的详细错误与重试信息可在“插件管理→查看详情→日志”中看到。