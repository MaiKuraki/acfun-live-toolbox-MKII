## 现象
- 你确认 OBS 已开启，但状态仍是“未连接（未运行）”。目前 index.js 用 `tasklist` 检测进程，并尝试 WebSocket 连接；失败原因未在 UI 显示。

## 改进方案（诊断增强，不改框架页）
- index.js
  - 增加 `lastError`、`lastAttempt` 字段；在 `connectObs()`/重试循环中记录具体失败原因（如 `ECONNREFUSED`、`authentication failed`、`ETIMEDOUT`）。
  - `getStatus()` 返回 `{ connected, connecting, running, lastError, lastAttempt }`。
  - 进程检测增加回退：`tasklist` 失败时再尝试 `wmic process` 或 `powershell Get-Process obs64,obs`，提升命中率。
  - 可选：在连接失败时记录一次端口探测（`netstat -ano | findstr :<port>`），用于判断端口是否被占用或未监听。
- UI（obs-assistant/ui.html）
  - 在状态下方显示 `lastError` 文案，帮助定位端口/密码/防火墙等问题。
  - 保留只读状态刷新逻辑，不提供主动连接按钮。

## 交付与验证
- 提交上述改动后：
  - UI 可看到具体错误（例如“连接被拒绝”、“密码错误”、“超时”）。
  - 进程检测更稳，避免误判“未运行”。

## 你的立即动作
- 确认 OBS 的 WebSocket 端口和密码与插件配置一致；确保已开启 v5 WebSocket 服务并允许本机访问。防火墙放行对应端口。