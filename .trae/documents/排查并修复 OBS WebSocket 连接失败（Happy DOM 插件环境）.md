## 目标
在 `buildResources/plugins/obs-assistant/index.js` 的所有捕获错误处输出结构化日志，包含函数名、错误信息、堆栈与关键上下文（如主机、端口、配置），便于定位连接失败根因。

## 覆盖范围
- 连接链路：`connectObs`、`applyObsSettings`、`startStreaming`、`applyObsAndStart`、`getObsStreamStatus`、`stopObsStreamingWithWait`。
- 初始化与生命周期：`afterloaded`、`ensureObsRunning`、`onConfigUpdated`、`cleanup`、`beforeUnloaded`、`onError`。
- 通信/网络：`openPluginOverlaySse` 的请求 `error/close` 分支已存在；补充 `httpGetJson/httpPostJson` 的 `error` 分支日志；`parseOverlaySseMessage` 的解析异常。

## 日志格式
- 统一前缀：`[obs-assistant]` + 函数名。
- 字段：`error`（消息）、`stack`（如有）、`host/port`（在连接函数）、`wsPassword`（仅打印是否为空，不打印明文）、`obsPath`（截断路径）。
- 示例：
  - `console.error('[obs-assistant] connectObs failed', { host, port, hasPassword: !!password, error: e?.message || String(e), stack: e?.stack || '' });`
  - `console.warn('[obs-assistant] httpGetJson error', { path: pathname, error: e?.message || String(e) });`

## 实施要点
- 保留现有逻辑与返回值，不修改控制流，仅在每个 `catch` 内插入 `console.error/console.warn`。
- 避免打印敏感信息（不输出密码明文）。
- 不添加注释，仅添加日志语句，符合项目无注释要求。

## 验证
- 重新进入“创建直播页面”，观察是否出现 `connectObs start/failed/success` 与详细错误堆栈。
- 手动执行 `connectObs` 与 `ensureObsRunning`，确认各自日志输出完整。