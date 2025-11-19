## 缺失与修正清单
- 修正 Overlay SSE 路径为实际的 `GET /sse/overlay/:overlayId`，补充 `overlayId` 参数说明
- 补充 Console 端点：
  - `POST /api/console/sessions`（创建会话，body: name）
  - `DELETE /api/console/sessions/:sessionId`（结束会话）
  - `POST /api/console/sessions/:sessionId/execute`（执行命令，body: command）
  - `GET /api/console/commands`（命令列表）
  - `GET /api/console/sessions`（会话列表）
  - `GET /api/console/sessions/:sessionId`（会话详情）
- 补充日志端点：
  - `GET /api/logs`（query: level/source/from_ts/to_ts/limit；返回 recent logs）
  - `POST /api/logs/export`（body: level/source/from_ts/to_ts/limit；返回导出文件路径与数量）

## 实施
- 在 `docs/apidoc-src/endpoints.apidoc.js` 增加上述条目，严格对照 `ApiServer.ts` 的入参与返回结构；为每条文档补充成功与错误示例（404/400/500）
- 重新生成文档并验证 `docs/apidoc/index.html` 展示完整性

## 验证
- 刷新页面观察 index.html 每次重新获取，静态资源命中缓存；文档条目完整且参数/返回与代码一致