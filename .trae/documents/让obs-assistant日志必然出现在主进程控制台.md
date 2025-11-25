## 目标
- 在不做端口探测的前提下，确保你能在主进程终端看到：进程检测结果和连接尝试/失败原因。

## 拟更改（仅日志级别和触发时机，不改逻辑）
- 将 `isObsRunning` 的日志从 `console.debug` 提升为 `console.info`。
- 在 `init()` 执行后立即输出一次 `console.info('[obs-assistant] loop start')`，确认后台轮询已启动。
- 在每次 `runLoop()` tick 开始处输出 `console.info('[obs-assistant] loop tick')`，并在 `isObsRunning` 返回后用 `console.info` 打印结果。
- 保持 `connectObs start/success/failed` 的 `console.info/error` 级别不变（已实现）。
- 在 `onConfigUpdated()` 输出 `console.info('[obs-assistant] config updated', next)`，方便确认新参数生效与重试触发。

## 预期效果
- 主进程终端将出现：
  - `[Plugin obs-assistant] [obs-assistant] loop start`
  - `[Plugin obs-assistant] [obs-assistant] loop tick`
  - `[Plugin obs-assistant] [obs-assistant] isObsRunning result { running: ... }`
  - `[Plugin obs-assistant] [obs-assistant] connectObs start { host, port }` / `success` / `failed <原因>`
  - `[Plugin obs-assistant] [obs-assistant] config updated { ... }`
- 插件详情日志与主进程终端输出保持一致，便于定位问题。

## 验证方法
- 重启应用并打开 obs-assistant 的 UI；观察主进程终端是否出现上述信息。
- 若 `isObsRunning result` 为 true 而 `connectObs failed`，根据失败原因（认证失败/拒绝/超时）调整 OBS WebSocket 设置或插件配置。