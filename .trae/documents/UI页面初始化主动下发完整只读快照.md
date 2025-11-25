## 接口改造（不保留旧SSE）

* 新增 `GET /api/renderer/readonly-store/list`：返回当前可用快照键列表（从 `renderer:readonly-store` 最近记录聚合）。

* 新增 `GET /sse/renderer/readonly-store/subscribe?keys=a,b,c`：仅推送指定快照键的初始快照与后续增量；未提供或为空视为非法，返回 400。

* 新增 `POST /api/renderer/readonly-store/snapshot`：入参 `{ keys: string[] }`，返回指定快照键的最新聚合状态；`keys` 缺失或为空返回 400。

* 移除旧路由 `GET /sse/renderer/readonly-store`，所有订阅必须使用新路径并携带 `keys`。

## 服务端实现位置

* 修改与新增均在 `packages/main/src/server/ApiServer.ts`：

  * 添加列表路由 `GET /api/renderer/readonly-store/list`。

  * 添加订阅路由 `GET /sse/renderer/readonly-store/subscribe`（必需 `keys`）。

  * 添加快照拉取路由 `POST /api/renderer/readonly-store/snapshot`。

  * 删除旧 `GET /sse/renderer/readonly/ store` 实现。

## 插件渲染页接入

* `packages/renderer/src/pages/PluginFramePage.vue`：

  * 挂载时请求 `GET /api/renderer/readonly-store/list`，随后 `POST /api/renderer/readonly-store/snapshot` 获取初始快照，更新 `window.__WUJIE_SHARED.readonlyStore` 并以 `plugin-event/readonly-store-init` 广播。

  * 建立新 SSE 连接至 `GET /sse/renderer/readonly-store/subscribe?keys=...`，消费 `readonly-store-update`。

* `packages/renderer/src/pages/WindowFramePluginPage.vue`：同步更新上述逻辑。

## 验证

* 首次进入 UI 页面立刻显示完整快照；后续增量按订阅键推送。

* 保持敏感字段与顶层 `plugin` 字段过滤逻辑不变，错误参数返回 400。