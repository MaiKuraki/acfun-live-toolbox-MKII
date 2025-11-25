## 背景与目标
- 依据 docs/API-Core-1.0.0.md，将渲染层不再负责向内嵌 Wujie 子页面转发消息。
- 两个页面移除对 Wujie 的总线桥接；示例插件改为通过 REST 与 SSE 与宿主交互（只读仓库与插件消息中心）。

## 变更范围
- `packages/renderer/src/pages/WindowFramePluginPage.vue`：移除总线注册、事件转发、初始化消息注入等所有 Bus 相关逻辑。
- `packages/renderer/src/pages/PluginManagementPage.vue`：确认不存在 Bus 逻辑；若有残留（当前无），清理。
- `buildResources/plugins/sample-overlay-window/*`：窗口页面改为 REST/SSE 驱动，删除 Bus 调用与“plugin-process”“renderer-popup”等桥接用法。
- `buildResources/plugins/sample-overlay-ui/*`：UI 与 Overlay 页面均改为 REST/SSE 驱动，删除 Bus 调用与“bridge-request/overlay-send”等桥接用法。

## 实施步骤
### 1. WindowFramePluginPage.vue
- 删除 `bus`、`busHandlers`、`registerBusHandlers`、`emitToChild`、`emitInitMessage`、`sendLifecycleEvent` 及相关 onMounted/onUnmounted 注册与注销。
- 保留窗口控制与 WujieVue 加载（按 `buildPluginPageUrl` 解析 URL 与 props），但不再向子页面注入或转发事件。
- 保持 UI 与标题逻辑不变。

### 2. PluginManagementPage.vue
- 代码静态走查确认：文件仅依赖 `resolvePrimaryHostingType`、Overlay 链接构建与插件 Store 操作；不含 Wujie Bus 使用。
- 无改动或仅进行最小化清理（若发现与 Bus 相关的残留，删除）。

### 3. 改造示例插件（sample-overlay-window）
- `window.html`
  - 以 `window.location.origin` 为 API 基址。
  - 使用 REST/SSE：
    - 订阅只读仓库：`GET /sse/renderer/readonly-store/subscribe?keys=account,ui,stream`，处理 `readonly-store-init/readonly-store-update/heartbeat`。
    - 订阅插件消息中心：`GET /sse/plugins/:pluginId/overlay`，处理 `init/update/message/action/closed/heartbeat`。
    - 发送消息：`POST /api/plugins/:pluginId/overlay/messages`，结构 `{ event, payload }`，用于演示“显示提示/警告/确认”改为发消息到插件消息中心（示例事件名 `ui-toast/ui-alert/ui-confirm`）。
  - 移除 `getBus/waitForBus/bridgeRequest`、`plugin-process`、`renderer-popup`、配置读写桥接等不在文档的通道。
  - 保留页面交互与日志区域，改为显示 REST/SSE 的收发结果。

### 4. 改造示例插件（sample-overlay-ui）
- `ui.html`
  - 提取 `pluginId`：从 `location.pathname` 中解析 `/plugins/:pluginId/`。
  - 以 `location.origin` 为基址：首次通过 `POST /api/renderer/readonly-store/snapshot` 拉取 `account,ui,role,rooms,stream` 快照；随后订阅 `GET /sse/renderer/readonly-store/subscribe` 同步增量。
  - 订阅插件消息中心：`GET /sse/plugins/:pluginId/overlay`，将 `message/update/action` 记录到“消息展示区”。
  - “保存背景色”改为：`POST /api/plugins/:pluginId/overlay/messages`，事件名 `config-update`，payload `{ uiBgColor }`，由 Overlay 页面消费并应用；UI 自身直接应用输入的背景色以即时反馈。
  - 删除 `getBus/request/waiters/bridge-response/overlay-send` 等桥接代码。
- `overlay.html`
  - 提取 `pluginId`，以 `location.origin` 订阅 `GET /sse/plugins/:pluginId/overlay`。
  - 处理事件：
    - `init`：展示初始 Overlay 列表/状态；
    - `update`：若 payload 含 `overlay.style.backgroundColor`，应用背景色；
    - `message`：当 `event==='config-update'` 时读取 `payload.uiBgColor` 并应用；当 `event==='text'` 时将文本追加到日志区；
  - 可选：订阅只读仓库 `GET /sse/renderer/readonly-store/subscribe` 以演示叠加渲染；移除对 `window.__WUJIE_SHARED` 的读取。
- `index.js/manifest.json`：保持现有字段；示例逻辑不依赖 Bus，无需变更清单。

## 验证与兼容
- 静态走查与 typecheck（不启动渲染开发服务器）。
- 通过浏览器加载示例页面验证：
  - 能从 `location.origin` 访问 REST/SSE；
  - UI/Window 示范按钮成功向插件消息中心发消息；Overlay 页面能收到并渲染。
- 与文档一致的事件名与端点：仅使用 `API-Core-1.0.0.md` 中列出的端点。

## 风险与回滚
- 子页面对原 Bus 的依赖被移除；若第三方插件依赖 Bus，将需要迁移到 REST/SSE。
- 变更集中在示例与一个窗口页，回滚可通过恢复被删除的 Bus 代码与示例 HTML 中的桥接脚本。

## 交付项
- 已清理 Bus 的 `WindowFramePluginPage.vue`。
- 基于 REST/SSE 的 `sample-overlay-window/window.html` 与 `sample-overlay-ui/ui.html/overlay.html`。
- 不改变 `PluginManagementPage.vue` 的现有业务逻辑；若存在残留 Bus 代码则删除。