## 缺失项与修正
- 将事件查询文档从 `/api/events/query` 修正为实际的 `/api/events`
- 增补 Core 端点：
  - `GET /api/health`（状态/时间戳/WS客户端数）
  - `GET /api/plugins`（已安装插件列表）
  - `GET /api/console/data`（commands/sessions/websocket_clients）
  - `GET /api/export` 与 `POST /api/export`（已加入，但将示例补充）
  - SSE：`GET /sse/overlay`、`GET /sse/plugins/:pluginId/overlay`（事件名、id与payload结构说明）
- 增补 AcFun 代理端点：
  - Live：`stream-url`、`stream-settings`、`stream-status`、`transcode-info`、`start`、`stop`、`update`、`statistics`、`summary`、`watching-list`、`categories`、`user-info`（含必填参数与401/400示例）
  - Clip：`clip-permission`（GET/PUT，`canCut` 必填）
  - Gift：`all` 与 `live`（`liveID` 必填）
  - Manager：`list`、`add`、`remove`、`kick-records`、`kick`（参数与错误示例）
  - Replay：`replay/info`（`liveId` 必填）
  - Image：`image/upload`（`imageFile` 必填）
  - EventSource：`eventsource/connect`、`eventsource/disconnect`（`liverUID` 必填与成功/失败）
- 保持所有示例与字段严格以 `ApiServer.ts` 与 `AcfunApiProxy.ts`、`QueryService.ts` 实际实现为准

## 实施
- 编辑 `docs/apidoc-src/endpoints.apidoc.js`：添加上述端点，并修正 `/api/events` 文档；每个条目补充 `@apiParam/@apiQuery`、`@apiSuccess`、`@apiSuccessExample` 与 `@apiErrorExample`
- 生成文档：`pnpm docs:api`；验证 `docs/apidoc/index.html` 可见上述端点

## 验证
- 检查成功/失败示例完整性与参数校验文案（如 `liveId is required`、`managerUID is required`、`canCut is required`）
- 确认所有新增条目与路径均与代码一致（逐条对照 AcfunApiProxy 与 ApiServer 路由）