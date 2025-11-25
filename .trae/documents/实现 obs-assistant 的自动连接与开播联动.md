## 目标
- 插件启动后按保存配置连接 OBS，具备断连重试与配置变更重试。
- 订阅 `/sse/plugins/obs-assistant/overlay` 的 `event: ui` 路由事件，进入“创建直播”且未开播时弹主窗口提示并自动配置推流地址与密钥，然后开始推流。
- 不使用 curl；使用 Node `http.request` 建立 SSE 连接。
- 保留 `obs-websocket-js` 包的导入与本地兜底实现、保留 `manifest.runtime.mocks`，确保稳定联动。

## 现状核对
- 已有：OBS 连接与重试（index.js:243-279）、断连重试回调（index.js:115-124）、只读快照 SSE（index.js:365-436）、配置与开播能力（index.js:175-232, 212-224）、未开播检查（index.js:455-463）。
- 待补：订阅插件 Overlay SSE 并处理 `event: ui`；弹窗改走 HTTP；在收到 `config-updated` 时合并配置并重试。

## 修改点
- 新增 `openPluginOverlaySse()`：
  - 通过 `http.request` 订阅 `GET /sse/plugins/obs-assistant/overlay`（端口取 `process.env.ACFRAME_API_PORT` 或默认 18299，`Accept: text/event-stream`）。
  - 复用 `handleSseChunk`/`parseSseMessage` 解析，新增分派：
    - `event === 'ui'` 且 `data.payload.event === 'route-changed'` 且 `payload.routePath === '/live/create'`：
      - 调用 `checkLiveStatus()`；未开播→`fetchReadonlySnapshot(['stream'])` 取 `rtmpUrl/streamKey`→`showToast()`（HTTP `POST /api/popup`）→`applyObsAndStart({ rtmpUrl, streamKey }, null)`。
    - `data.payload.event === 'config-updated'` 且含 `payload.config`：合并到 `state.config`，`scheduleNext(500)` 按最新配置重试连接。
  - 连接关闭或错误时 3 秒重连。
- 新增工具函数：
  - `httpPostJson(pathname, body)`：`Content-Type: application/json` 的 POST。
  - `fetchReadonlySnapshot(keys)`：`POST /api/renderer/readonly-store/snapshot` 返回 `{ stream }`。
  - 重写 `showToast(message)`：改用 `POST /api/popup`（主窗口）。
- 在 `init()` 中调用 `openReadonlySse()` 与新增 `openPluginOverlaySse()`，完成双通道订阅。
- 保留 `obs-websocket-js` 的本地兜底与 `manifest.runtime.mocks`，不删除任何兜底代码。

## 重试与幂等
- OBS 连接指数退避至 10s；断连后快速重试。
- SSE 断开 3s 重连。
- 用 `state.triggeredStart` 防重复触发；失败则清除标记允许重试。

## 验证
- 启用插件后进入“创建直播”，观察弹窗与 OBS 自动配置与开播。
- 修改插件配置（端口/密码/OBS 路径），确认连接重试按最新配置执行。
- 查看 `/sse/plugins/obs-assistant/overlay` 流的 `event: ui` 是否正确驱动联动。