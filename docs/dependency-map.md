# 模块依赖图（主/预/渲染/插件）

## 层级与跨层协议

- 协议：IPC（预加载桥）/ HTTP（本地 API）/ SSE（只读仓库与 Overlay）/ WS（事件广播）
- 统一边界：插件资源与路由在 `/plugins/:id/*` 作用域，受 `PluginManager` 与 `ApiServer` 协同控制。

## 主进程模块关系（摘要）

- `index.ts` →
  - `DatabaseManager` → `EventWriter` → SQLite（事务批插入）
  - `RoomManager` → 事件 → `WsHub.broadcastEvent()`；房间状态 → `WsHub.broadcastRoomStatus()`
  - `ConfigManager/DiagnosticsService/OverlayManager`
  - `ApiServer`（HTTP/SSE/WS） ← `PluginManager/ConsoleManager` 注入引用
  - `TokenManager`（统一 `acfunlive-http-api` 实例）
  - `WindowManager/PluginWindowManager`（BrowserWindow 与插件窗口控制）

- `ApiServer` ↔ `PluginManager`
  - 注册插件路由与静态托管；Overlay 事件转发至每插件消息中心 `DataManager` 通道 `plugin:${id}:overlay`
  - SSE 通道与心跳：`/sse/overlay/:overlayId`、`/sse/plugins/:pluginId/overlay`、`/sse/renderer/readonly-store`

- `TokenManager`
  - 单例 API 与令牌生命周期（QR 登录/刷新/过期事件）
  - 使用 `createApi`/`setAuthToken/clearAuthToken`；持久化 `secrets.json`

- 连接池（命名冲突待收敛）
  - `plugins/ConnectionPoolManager.ts`（HTTP/HTTPS/TCP/IPC 通用连接）
  - `adapter/ConnectionPoolManager.ts`（AcFun API 连接 + 熔断/健康检查/性能指标）

## 预加载与渲染模块关系（摘要）

- 预加载 `exposed.mjs` 暴露 `electronApi.*` 合约（dialog/fs/login/window/system/overlay/plugin/wujie/hosting/room/account/http/monitoring/console 等），渲染层仅走 IPC/HTTP，不直接使用 Node 能力。
- 渲染层订阅只读仓库与 Overlay 通道，路由与页面按需注册插件子页。

## 关键代码引用

- 启动：`packages/main/src/index.ts:48-116`
- 本地服务：`packages/main/src/server/ApiServer.ts`
- 数据层：`packages/main/src/persistence/DatabaseManager.ts:52-85`、`EventWriter.ts:65-123`
- 连接池：`packages/main/src/plugins/ConnectionPoolManager.ts`、`packages/main/src/adapter/ConnectionPoolManager.ts`
- 预加载桥：`packages/preload/src/index.ts`
- 渲染入口：`packages/renderer/src/main.ts`、路由 `packages/renderer/src/router/index.ts`

## 依赖图建议（后续工具化）

- 生成静态依赖图（按包与模块）：主/预/渲染/插件分区，标注跨层协议（IPC/HTTP/SSE/WS）。
- 检测循环依赖：重点关注 `plugins/* ↔ server/* ↔ adapter/*`。如存在，提议通过接口抽象与事件桥解耦。