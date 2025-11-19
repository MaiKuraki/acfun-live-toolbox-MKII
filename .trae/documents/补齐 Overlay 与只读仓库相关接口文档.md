## 待补全
- Overlay REST：
  - GET /api/overlay/:overlayId（返回 overlay/room/token/WebSocket端点；404 OVERLAY_NOT_FOUND）
  - POST /api/overlay/:overlayId/action（body: action/data；400 INVALID_ACTION；500 ACTION_FAILED）
  - POST /api/overlay/:overlayId/send（body: event/payload；400 INVALID_EVENT；500 SEND_FAILED）
  - POST /api/overlay/create（body: options；返回 OverlayManager.createOverlay 结果；500 CREATE_FAILED）
- 插件 Overlay 消息中心：
  - POST /api/plugins/:pluginId/overlay/messages（body: overlayId? event payload ttlMs persist；400 INVALID_EVENT；成功返回 id 或 count/ids）
- 只读仓库：
  - POST /api/renderer/readonly-store（body: type=readonly-store-init|readonly-store-update, payload；400 INVALID_EVENT；返回 id）
- 包装页：
  - GET /overlay-wrapper（query: plugin type overlayId route html；返回 HTML，403 disabled，404 plugin not found）

## 实施
- 在 docs/apidoc-src/endpoints.apidoc.js 增加上述端点条目与错误示例，严格对照 ApiServer.ts 实现
- 生成文档并验证 index.html 展示完整