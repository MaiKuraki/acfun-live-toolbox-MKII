## 页面清理
- 删除“可用接口”中冗余的端点列表渲染块：`packages/renderer/src/pages/ApiDocs.vue` 模板内的
```
<div v-if="serverInfo" class="api-endpoints"> ... 端点列表 ... </div>
```
- 保留顶部状态与“静态接口文档” iframe，以及“小程序开发”说明板块；整体布局保持双 Tab（“可用接口”“小程序开发”）。

## apidoc 内容完善
- 在 `docs/apidoc-src/endpoints.apidoc.js` 为各端点补充完整说明：
  - 参数：`@apiParam` 和 `@apiQuery`，对 `/plugins/:id/overlay` 增加 `@apiParam {String} id`
  - 返回：`@apiSuccess` 字段结构、示例 `@apiSuccessExample`
  - 错误：`@apiErrorExample`
  - 调用示例：`curl`/`fetch` 代码片段（简洁，可复制）
- 覆盖重点端点：
  - 事件查询与统计：`GET /api/events/query`、`GET /api/stats/events`
  - 只读仓库 SSE：`GET /sse/renderer/readonly-store`（SSE 头与心跳说明）
  - 插件静态托管：`GET /plugins/:id/overlay[/*]`（静态资源入口与路由匹配规则）
  - AcFun 代理（公共只读为主）：`GET /api/acfun/live/categories`、`GET /api/acfun/live/hot-lives?category&page&size`、`GET /api/acfun/user/info?userID`
- 若涉及登录态的代理端点，统一在文档顶部声明认证前提与返回 401 的语义，避免在每个条目重复冗长说明。

## 生成与验证
- 执行 `pnpm docs:api` 生成最新静态文档到 `docs/apidoc`。
- 验证浏览：
  - 应用运行后访问 `http://127.0.0.1:18299/docs/api/index.html`
  - 页面“系统 → 开发文档 → 可用接口”Tab 的 iframe 内容应展示参数、返回、示例

## 交付与准则
- 严格删除旧的静态内容与冗余展示；不保留回退代码。
- 仅编辑现有文件，不新建无必要的文件；遵循 pnpm 与项目规则。
- 不修改或 mock `acfunlive-http-api`；所有示例以真实端点为准。