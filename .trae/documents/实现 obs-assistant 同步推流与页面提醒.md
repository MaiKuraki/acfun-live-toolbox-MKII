## 目标
- 启动即按保存配置连接 OBS，错误按最新配置指数回退重试，断连自动重试。
- 监听渲染层只读快照（SSE），在“创建直播”阶段拿到 `rtmpUrl/streamKey` 后，配置到 OBS 并自动开始推流。
- 当检测到未开播且准备启动推流时，尝试触发主窗 Toast（若进程环境允许 IPC），否则安全降级为日志提示。

## 现状复用
- 连接/重试/断连恢复：`init/runLoop/connectObs/onConfigUpdated` 已具备（buildResources/plugins/obs-assistant/index.js:32–115, 187–253）。
- OBS 参数下发：`applyObsSettings(stream, transcodes)` 已实现 `SetStreamServiceSettings`（index.js:150–185）。

## 新增能力（全部在 index.js）
### 1) 开播控制
- 新增 `async function startStreaming()`：
  - 前置：若未连接则复用 `connectObs()`；失败返回 `{ ok: false, error }` 并让循环继续重试。
  - 成功路径：`await state.obs.call('StartStream')`；返回 `{ ok: true, started: true }`。
- 新增组合方法 `async function applyObsAndStart(stream, transcodes)`：
  - 先 `applyObsSettings(stream, transcodes)`，成功后调用 `startStreaming()`；统一错误返回。

### 2) 只读快照监听（SSE 客户端）
- 读取 API 端口：`const port = Number(process.env.ACFRAME_API_PORT || 18299)`；基址 `http://127.0.0.1:${port}`（renderer 的 `getApiBase` 对齐，packages/renderer/src/utils/hosting.ts:15–19）。
- 实现极简 SSE 订阅到 `GET /sse/renderer/readonly-store`：
  - 使用 Node 原生 `http.request` 建立长连接；按 `event:`/`data:` 分片解析；处理 `readonly-store-init` 与 `readonly-store-update`。
  - 维护本地只读快照副本 `snapshot.stream`（仅所需字段：`rtmpUrl`、`streamKey`、可选 `transcodes`）。
  - 断线自动重连（3s 回退），并在 `onConfigUpdated` 时重置。

### 3) 创建直播阶段检测与触发
- 未开播检测：在拿到 `snapshot.stream` 后，`GET /api/acfun/live/stream-status`（同基址）解析 JSON，判定不存在 `liveID` 即“未开播”。
- 触发动作：
  - 尝试主窗弹窗：若进程可用 `require('electron').ipcRenderer?.invoke`，则 `invoke('popup.toast', { message: '同步推流插件已加载，正在启动obs推流' })`；否则降级为 `console.info`。
  - 推流：调用 `applyObsAndStart(snapshot.stream, snapshot.transcodes)`；失败以指数回退重试，不打印密钥。
- 幂等保护：同一会话仅在“未开播且有完整 stream 信息”时触发一次；状态改变/断线后可再次触发。

### 4) 日志与安全
- 不输出 `streamKey/wsPassword`；错误仅打印摘要。
- 连接/重试日志沿用现有 `console.info/console.warn/console.error` 统一到主日志。

## 验证
- 配置 `obsPath/wsPort/wsPassword`，启用 `autoStartObs/syncStreaming`。
- 进入“创建直播”页，只读快照产生 `stream.rtmpUrl/streamKey`。
- 观察：
  - 后台日志打印“准备启动 OBS 推流”；若 IPC 可用，主窗显示 Toast。
  - OBS 中服务地址/密钥更新并自动 `StartStream`。

## 代码改动范围
- 仅改动 `buildResources/plugins/obs-assistant/index.js`：新增 SSE 订阅/解析、`startStreaming` 与 `applyObsAndStart`、未开播检测与触发逻辑；不改 UI 文件。