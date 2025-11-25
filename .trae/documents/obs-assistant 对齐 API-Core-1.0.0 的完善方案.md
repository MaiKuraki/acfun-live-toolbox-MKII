## 目标与现状核对
- 目标：在插件启动时按配置连接 OBS（断连重试、错误按最新配置轮询），进入“创建直播”页且未开播时弹出主窗提示并自动配置推流与开播。
- 现状：
  - 连接与重试机制已实现（buildResources/plugins/obs-assistant/index.js:234–253, 187–232）。
  - 只读快照订阅与启动推流已实现（index.js:244–253, 280–397, 399–418；SetStreamServiceSettings 与 StartStream：index.js:150–213）。
  - 弹窗当前使用 IPC 可用时调用；需改为统一 HTTP 接口对齐文档。

## 对齐 API-Core-1.0.0 的改动
### 1) 弹窗改为 HTTP 调用
- 依据 docs/API-Core-1.0.0.md 的窗口与弹窗：`POST /api/popup`。
- 在 index.js 替换 `showToast()` 的实现：改用 Node `http.request` `POST /api/popup`，Body：`{ action: 'toast', message: '同步推流插件已加载，正在启动obs推流' }`，不传 `X-Plugin-ID` 与 `windowId` 以确保主窗口弹窗。

### 2) 只读快照订阅端点对齐
- 文档端点：`GET /sse/renderer/readonly-store/subscribe?keys=account,ui,stream`。
- 在 index.js 的 SSE 订阅方法中，将路径改为 `'/sse/renderer/readonly-store/subscribe?keys=stream'`，保持事件解析（`readonly-store-init/readonly-store-update`）。

### 3) 生命周期事件总线（统一信号）
- 文档说明：插件消息中心新增桥接事件 `lifecycle/room/danmaku`（SSE：`GET /sse/plugins/:pluginId/overlay`）。
- 在 index.js 追加一个可选 SSE 订阅到 `'/sse/plugins/obs-assistant/overlay'`，解析事件中 `event: lifecycle`，当收到 `ready/config-updated` 时设置内部 `uiReady` 标记，用于更稳妥地判定“进入创建直播阶段”。
- 触发条件更新：`uiReady === true` 且只读快照内出现完整 `stream.rtmpUrl/streamKey` 且 `liveStatus === 未开播` → 弹窗 + 配置 + 开播。

### 4) 未开播检测与推流流程保持
- 保持 `GET /api/acfun/live/stream-status` 检测是否存在 `liveID`（docs: 78–91）；未开播时执行：
  - `POST /api/popup` toast（主窗）。
  - `SetStreamServiceSettings` 写入地址与密钥（index.js:150–185）。
  - `StartStream`（index.js:186–205）。
- 保持幂等：同一会话仅触发一次；失败则清理标记允许重试。

### 5) 重试与错误对齐
- 保持现有指数退避与断连重试；配置更新后快速重试（index.js:244–253）。
- 不输出密钥或密码到日志；仅打印摘要错误。

## 验证
- 启动 obs-assistant：检查连接与断连重试日志（index.js:117–139, 187–232）。
- 进入“创建直播”页：只读快照出现 `stream.rtmpUrl/streamKey` → 主窗 `POST /api/popup` 弹 toast → OBS 写入并开播。
- 断连后自动重连；错误轮询按最新配置执行。

## 改动范围
- 仅修改 `buildResources/plugins/obs-assistant/index.js` 的弹窗调用与 SSE 订阅 URL，并追加生命周期 SSE（可选）。
- 不改动 UI 文件；不新增文件；遵循项目约束（不启动渲染预览，不编写/执行测试）。