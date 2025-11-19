## 目标
- 使静态接口文档更详细，但严格以现有代码为准，不编造
- 为每个条目同时提供成功与失败示例（如参数缺失、校验失败）

## 涵盖端点
- 事件查询与统计：
  - GET /api/events/query（返回 EventQueryResult 明确字段：items、total、page、pageSize、hasNext，items 内字段与 QueryService 映射一致）
  - GET /api/stats/events（返回 total、byType、dateRange{earliest,latest}，可选 query room_id）
- 数据导出：
  - GET/POST /api/export（基于 ApiServer，参数与返回字段：filename、filepath、recordCount、fileSize）
- SSE：
  - GET /sse/renderer/readonly-store（SSE 头、心跳 event: heartbeat、data JSON）
- 插件静态托管：
  - GET /plugins/:id/overlay（路径参数 id）
- 认证：
  - GET /api/acfun/auth/status（返回 authenticated 布尔与 timestamp）
  - POST /api/acfun/auth/qr-login（返回 qrCode、expiresIn、sessionId）
  - GET /api/acfun/auth/qr-status（返回 token 状态或错误）
  - POST /api/acfun/auth/token（body.token 必填，成功/失败示例）
  - DELETE /api/acfun/auth/token（清除令牌）
- AcFun 代理只读端点（示例为主）：
  - GET /api/acfun/live/categories、GET /api/acfun/live/hot-lives（category/page/size）、GET /api/acfun/user/info（userID）
  - GET /api/acfun/gift/live（liveID 必填）、GET /api/acfun/preview/list
  - GET /api/acfun/badge/detail（uperID 必填）、/list、/rank（uperID）、/worn

## 实施步骤
- 编辑 `docs/apidoc-src/endpoints.apidoc.js`：
  - 补充 `@apiParam/@apiQuery`、`@apiSuccess` 字段与结构
  - 增加 `@apiSuccessExample` 与 `@apiErrorExample`，错误文案使用代码里的实际 `error` 字段（如 `userID is required`、`liveID is required`）
  - 补充导出与认证相关端点说明
- 生成文档：`pnpm docs:api`
- 验证输出存在：`docs/apidoc/index.html`，并从 UI 按钮在外部浏览器打开

## 注意
- 文档内容严格依据 `ApiServer.ts`、`AcfunApiProxy.ts`、`QueryService.ts` 的实际返回与校验
- 不添加与现有代码不符的字段或示例