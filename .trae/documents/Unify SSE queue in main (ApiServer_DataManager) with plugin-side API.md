## 结论
- 主进程已有统一 SSE 处理点：`packages/main/src/server/ApiServer.ts`，涵盖 `/sse/plugins/:pluginId/overlay`、`/sse/overlay/:overlayId`、`/sse/system/logs`、`/sse/renderer/readonly-store/subscribe`。
- 建议在主进程（DataManager/ApiServer）统一实现“等待队列”机制，插件侧只调用一个发布 API（HTTP 或主进程通道），不再自行维护队列。

## 设计方案
- 新增 SseQueueService（或在 DataManager 内部实现队列）：
  - `queueOrPublish(channel, payload)`：若对应 channel 未就绪（无订阅），则入队；就绪后直接 `publish`。
  - `markChannelReady(channel)`：当 SSE 客户端连接到 `/sse/...` 时由 ApiServer 调用；将队列消息依序 `publish`，并清空队列。
  - `markChannelClosed(channel)`：客户端断开；可选择不重置就绪标记（仍允许直发），或策略化重置为未就绪下次再入队。
  - 数据结构：`pending: Map<string, any[]>`、`ready: Set<string>`。
- ApiServer 集成：
  - 在 `/sse/plugins/:pluginId/overlay`（约 1037–1131）和 `/sse/overlay/:overlayId`（约 941–1035）建立连接时调用 `markChannelReady(channel)`。
  - 断开时可调用 `markChannelClosed(channel)`（策略可配置）。
- 插件侧调用方式：
  - 继续通过 `POST /api/plugins/:pluginId/overlay/messages` 发送事件；ApiServer 在接收后调用 `SseQueueService.queueOrPublish(channel, payload)`。
  - 或提供轻量 SDK（包装 HTTP）方法 `emitOverlayEvent(pluginId, event, payload)`；插件无需感知就绪与队列。

## 改动点
- `packages/main/src/persistence/DataManager.ts`（或新建 `SseQueueService.ts`）：实现队列 API
  - `queueOrPublish(channel, payload)`
  - `markChannelReady(channel)`
  - `markChannelClosed(channel)`
- `packages/main/src/server/ApiServer.ts`：在 SSE 连接建立/关闭时调用上述接口
- `packages/main/src/plugins/PluginManager.ts`：将生命周期事件（若主进程仍需发布）改用 `queueOrPublish`
- 插件侧（如 obs-assistant）
  - 去除内部队列实现，仅调用 HTTP 发布（现有 `httpPostJson('/api/plugins/obs-assistant/overlay/messages', ...)` 保留）

## 验证
- 未连接 SSE 时：事件入队；连接后自动回放并按序广播；连接后产生事件即时广播。
- 插件侧无需关注 SSE 就绪；主进程统一队列确保消息可靠性。

## 注意
- “就绪”定义建议基于“至少一个订阅者连接”；断开时是否重置为未就绪需根据使用场景谨慎选择（默认不重置，就绪后直发）。
- 队列大小与TTL需要策略（避免无限增长）。

若确认，我将在主进程实现 SseQueueService、接入 ApiServer 的 SSE 端点，并迁移现有代码改用队列发布；同时简化插件侧为单一发布API调用。