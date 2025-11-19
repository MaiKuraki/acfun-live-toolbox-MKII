# 架构评估报告（ACLiveFrame）

## 项目概览

- 工作区：`pnpm` monorepo，核心包 `@app/main`（主进程）、`@app/preload`（预加载）、`@app/renderer`（渲染层），辅助包 `@app/electron-versions`；入口 `packages/entry-point.mjs`；打包配置 `electron-builder.mjs`。
- 技术栈：Electron 39、Vite 7、Vue 3、Pinia、TDesign、Wujie；服务端 `express@4`（本地 API/SSE/WS）、SQLite 持久化。
- 外部 API：`acfunlive-http-api` 真实集成，统一实例与令牌管理在主进程。

## 当前架构（现状图）

- 主进程（集中调度）
  - 启动与依赖注入：`packages/main/src/index.ts:48-116`
  - 窗口管理：`packages/main/src/bootstrap/WindowManager.ts:17-67`
  - IPC 汇总：`packages/main/src/ipc/ipcHandlers.ts`
  - 本地服务与桥接：`packages/main/src/server/ApiServer.ts`（HTTP/SSE/WS）、`packages/main/src/server/WsHub.ts`
  - 插件系统：`packages/main/src/plugins/PluginManager.ts` 及其子模块（窗口/缓存/热重载/性能/懒加载/版本/错误/速率/连接池等）
  - 数据层：`packages/main/src/persistence/DatabaseManager.ts`、`EventWriter.ts`、`QueryService.ts`、`DataManager.ts`

- 渲染层（Vue 应用）
  - 入口：`packages/renderer/src/main.ts`
  - 路由：`packages/renderer/src/router/index.ts`
  - 页面：`packages/renderer/src/pages/*`（管理、系统、控制台、直播、Overlay 等）
  - 只读仓库：上报 `POST /api/renderer/readonly-store`，订阅 `GET /sse/renderer/readonly-store`（主进程集中分发）`packages/main/src/server/ApiServer.ts:1048-1119`

- 预加载层（安全桥）
  - 安全暴露：`packages/preload/src/index.ts`（dialog/fs/login/window/system/overlay/plugin/wujie/hosting/room/account/http/monitoring/console 等）
  - BrowserWindow 配置：`contextIsolation=true`、`nodeIntegration=false`、`sandbox=false`、`preload=exposed.mjs` `packages/main/src/bootstrap/WindowManager.ts:29-33`

- 插件系统（统一边界）
  - 示例插件目录：`buildResources/plugins/*`，窗口示例 `sample-overlay-window/index.js`
  - 作用域：纯静态托管（`ui/window/overlay`）或进程插件（`main`），静态资源路由通过 `ApiServer.registerPluginRoute` 与 `/plugins/:id/*` 统一管理。
  - Overlay：数据接口/消息桥（SSE/HTTP）与包装页 `/overlay-wrapper`。

## 问题点与风险

- 命名冲突与职责重复：`ConnectionPoolManager` 在 `packages/main/src/plugins/ConnectionPoolManager.ts` 与 `packages/main/src/adapter/ConnectionPoolManager.ts` 两处定义，分别承担“通用网络连接池”与“AcFun API 连接池”，易引发认知与调用混淆。
- SSE/WS 心跳分散：多个心跳实现（统一 15s/30s）散布在 `ApiServer.ts:759-763/896-903/1105-1110` 与 `WsHub.ts:242`，建议抽象共享组件与集中配置，统一清理策略以避免泄漏。
- 数据层性能：SQLite 尚未启用 WAL 与同步级别调优，批写入虽使用事务，但并发读能力与写延迟仍有提升空间。
- 版本约束不一致：根 `package.json:16-18` 要求 Node `>=23.0.0`，与 Electron 39 内置 Node 22 不一致，可能造成工具链/CI 认知偏差与不必要的环境冲突。
- 安全策略：`helmet` 在服务端关闭了 CSP/frameguard（`packages/main/src/server/ApiServer.ts:92-99`），`WindowManager` 开发态移除响应头 CSP（`packages/main/src/bootstrap/WindowManager.ts:36-46`）。生产建议维持最小 CSP 白名单策略以降低风险。

## 优化架构（优化图）

- 命名与边界：
  - 将通用连接池重命名为 `PluginConnectionPoolManager`，将 AcFun API 连接池命名为 `AcfunApiConnectionPool`，导出入口分离，事件命名统一（`connection-created/acquired/released/closed/failed`+`stats`）。
  - 插件协调器 `PluginCoordinator` 驱动窗口/缓存/懒加载/更新/性能等子能力，降低多管理器横向耦合。

- 基础设施与配置：
  - 抽象 `SSEHeartbeat` 与 `SSECleanup` 中间件/工具，所有 SSE/WS 通道共享心跳间隔常量与清理函数。
  - 数据层启用 `PRAGMA journal_mode=WAL; synchronous=NORMAL; cache_size; temp_store` 等，并引入语句池与批量大小自适应策略。
  - 根 `engines.node` 与构建目标对齐 Electron Node 主版本；或移除根引擎强约束，改以包内 `vite.config.js:12` 的目标为准。

- 安全与合规：
  - 生产环境保留最小 CSP（允许必要的内联样式/脚本），渲染层继续通过 preload；按页面精细化 frameguard；令牌与敏感信息避免出现在日志。
  - 服务端限流持久化可选开启（按插件 ID 与端点维度），来源白名单复核。

## 关键参考

- 启动与依赖注入：`packages/main/src/index.ts:48-116`
- 窗口配置：`packages/main/src/bootstrap/WindowManager.ts:17-67`
- SSE 心跳：`packages/main/src/server/ApiServer.ts:759-763/896-903/1105-1110`
- WS 心跳：`packages/main/src/server/WsHub.ts:242`
- 数据层：`packages/main/src/persistence/DatabaseManager.ts:52-85`、`EventWriter.ts:65-123`
- 安全中间件：`packages/main/src/server/ApiServer.ts:92-99`
- 连接池实现：`packages/main/src/plugins/ConnectionPoolManager.ts`、`packages/main/src/adapter/ConnectionPoolManager.ts`

## 结论

- 架构以主进程集中调度为核心，渲染层通过 preload/IPC 与本地 API/SSE/WS 协同；插件系统边界清晰并统一静态托管与路由作用域。建议从“命名与职责边界收敛、SSE/WS 基础设施抽象、SQLite 调优、生产安全策略最小化”四个方面落地优化，提升可维护性与运行效率。