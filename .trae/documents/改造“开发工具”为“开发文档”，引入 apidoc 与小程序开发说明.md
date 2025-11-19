## 信息架构调整
- 将现有 `开发工具` 页面改为 `开发文档`，保持现有路由但更新文案与结构：
  - 页面：`packages/renderer/src/pages/ApiDocs.vue`
  - 路由：`packages/renderer/src/router.ts`（`/system/develop`，meta 标题改为“开发文档”）
  - 侧边栏文案：`packages/renderer/src/components/Sidebar.vue` 更名为“开发文档”入口
- 页面分为两大块：
  - 可用接口（接口清单 + 静态 API 文档 iframe）
  - 小程序开发（原理、架构、接口、事件、消息传输、示例全说明）

## 可用接口文档（apidoc 接入）
- 新增依赖与脚本（遵循 pnpm）：在根或 `packages/main` 引入 `apidoc`，增加生成脚本（如 `pnpm run docs:api`）。
- 新增 `apidoc.json` 配置，指向需要扫描的主进程服务与代理：
  - `packages/main/src/server/ApiServer.ts`（HTTP、SSE、插件托管）
  - `packages/main/src/server/AcfunApiProxy.ts`（`/api/acfun/*` 代理端点）
- 为核心端点补充 `@api` 注释块：
  - 事件查询与统计：`/api/events/query`、`/api/stats/events`（`packages/main/src/server/ApiServer.ts:237` 附近）
  - AcFun 代理：`/api/acfun/*`（`packages/main/src/server/AcfunApiProxy.ts:108` 路由入口；模块分发例如弹幕 `:293`、直播 `:747` 等）
  - 插件页面托管：`/plugins/:id/*`（`packages/main/src/server/ApiServer.ts:531`、静态托管逻辑见 `:559`）
  - SSE 仓库订阅：`/sse/renderer/readonly-store`（`packages/main/src/server/ApiServer.ts:1054`）
  - Overlay 操作/消息：REST 与总线广播（Overlay 管理逻辑见 `packages/main/src/plugins/OverlayManager.ts:369`、统计 `:524`）
- 生成目录与托管：
  - 输出至 `docs/apidoc`（或 `packages/main/dist/docs/apidoc`）
  - 主进程托管：`ApiServer` 增加 `app.use('/docs/api', express.static(...))`（保持只读）
- 渲染侧集成：
  - `ApiDocs.vue` 增加 Tab 与 iframe，指向 `http://127.0.0.1:18299/docs/api/index.html`；左侧仍展示 `/` 根信息中的分组端点清单（`packages/renderer/src/pages/ApiDocs.vue:91-114`）

## 测试用例（根 test 目录，禁用 mock）
- 测试框架与约束：
  - 根 `package.json` 使用 Playwright；`packages/main` 使用 Vitest（`packages/main/vitest.config.ts` 已收集 `../../test/**/*.test.ts`）。
  - 所有测试文件创建于根 `test/`；不使用 mock，`acfunlive-http-api` 必须真实请求。
- 覆盖范围：
  - 公共只读接口（无需登录）：`/api/acfun/live/categories`、`/api/acfun/live/hot-lives`、`/api/acfun/user/info?userID=...`
  - 事件查询与 SSE：`/api/events/query` 的参数校验与分页；`/sse/renderer/readonly-store` 能建立与心跳（不做长连断言，仅校验响应头）
  - 插件托管路由：`/plugins/:id/overlay` 与静态入口返回 200
- 文件示例（不执行，仅交付）：
  - `test/api/acfun-public-read.test.ts`（Vitest）
  - `test/api/sse-readonly-store.test.ts`（Vitest）
  - `test/plugins/static-hosting.test.ts`（Playwright 轻量访问）

## 小程序开发文档（页面内完整说明）
- 实现原理：主进程统一托管、受控能力暴露、SSE/IPC/总线三通道通信；UI 与 Overlay 作为微前端子应用承载。
- 架构分层：
  - overlay：管理、路由与动作（`packages/main/src/plugins/OverlayManager.ts:369` 发送消息；统计 `:524`）
  - window：窗口创建与单例（`packages/main/src/bootstrap/WindowManager.ts` 引导；`packages/main/src/plugins/PluginWindowManager.ts` 单实例与置顶）
  - ui（渲染）：只读仓库订阅与总线（`packages/main/src/server/ApiServer.ts:1054` SSE；渲染路由宿主 `packages/renderer/src/pages/PluginFramePage.vue`）
  - index.js（插件入口）：暴露 `init/cleanup/handleMessage`，由主进程挂载与事件分发（样例见下）
- 接口说明：
  - 主进程自身接口：事件查询与统计、SSE 仓库、插件静态托管（`ApiServer.ts:237`、`:531`、`:1054`）
  - AcFun HTTP API 代理：`/api/acfun/*` 分模块端点（代理入口 `AcfunApiProxy.ts:108`；弹幕 `:293`，直播 `:747` 等）；统一认证 `TokenManager`（使用点见 `packages/main/src/server/TokenManager.ts`、桥接 `packages/main/src/plugins/ApiBridge.ts:673`）
- 事件（生命周期与订阅）：
  - Overlay 事件：`overlay-updated`、`overlay-message`（管理器触发与广播，见 `OverlayManager.ts:369`）
  - 渲染只读仓库：`/sse/renderer/readonly-store` 建连后按通道推送（`ApiServer.ts:1054`）
  - Wujie 总线：宿主与子应用事件编排（`PluginFramePage.vue` 中总线替换/解绑的变更任务说明）
- 消息传输：
  - UI/Window→Overlay：REST 或总线消息，统一经 `OverlayManager.sendMessage`（`packages/main/src/plugins/OverlayManager.ts:369`）
  - 主进程→渲染/Overlay：SSE 下行与事件广播（`ApiServer.ts:989` publish overlay-action；心跳 `:906`）
- 自带样例：
  - UI 叠加层示例：`buildResources/plugins/sample-overlay-ui/overlay.html`、脚本 `index.js`
  - 窗口叠加层示例：`buildResources/plugins/sample-overlay-window/window.html`、脚本 `index.js`

## 交付物与变更清单
- UI：`ApiDocs.vue` 增加 Tab、标题改为“开发文档”；`Sidebar.vue` 与路由 meta 文案更新。
- 服务：`ApiServer.ts` 增加 `/docs/api` 静态托管；必要端点补充 `@api` 注释。
- 配置：新增 `apidoc.json`；在 `packages/main/package.json` 增加 `docs:api` 生成脚本。
- 测试：在根 `test/` 新增 3 个测试文件（Vitest/Playwright），不执行。
- 文档：在“开发文档”页面内编写小程序开发说明与代码引用段落。

## 规范与安全
- 所有安装与脚本使用 `pnpm`；不引入回退代码，若有旧逻辑一律删除。
- 不启动渲染开发服务器；不在未授权场景下写入或暴露敏感令牌。
- 测试不使用 mock，`acfunlive-http-api` 使用真实请求；测试仅交付不执行（遵循项目规则）。

## 验收与后续
- 验收项：页面展示两大块、`/docs/api` 可用、端点清单正确、样例路径可访问、测试文件齐备。
- 后续：根据端点增量补充 `@api` 注释块；完善渲染端的只读仓库文档页；必要时将 JSDoc 站点与 apidoc 协同托管。