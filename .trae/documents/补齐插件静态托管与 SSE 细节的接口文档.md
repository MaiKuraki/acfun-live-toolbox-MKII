## 发现的遗漏
- 插件静态托管除 overlay 外，还支持 ui/window 与 *.html 直达入口；禁用插件时仅允许图标资源，其余返回 403
- SSE 细节：/sse/overlay/:overlayId 支持事件类别（updated/message/closed/action）与心跳；/sse/plugins/:pluginId/overlay 支持 Last-Event-ID

## 计划补充
- 在 docs/apidoc-src/endpoints.apidoc.js 增加：
  - GET /plugins/:id/ui[/*] 与 /plugins/:id/window[/*] 的静态托管说明（以及 /plugins/:id/ui.html、/window.html、/overlay.html 直达入口）
  - 403 禁用插件访问的行为说明及仅图标例外
  - /sse/overlay/:overlayId 的事件类别与心跳示例；/sse/plugins/:pluginId/overlay 的 Last-Event-ID 说明
- 生成文档并验证 index.html 显示完整

## 保留与约束
- 坚持严格以 ApiServer.ts 的实现为准，不增加代码未实现的端点（例如 /api/diagnostics 未见实现，则不记录）