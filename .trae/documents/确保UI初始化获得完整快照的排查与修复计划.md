## 目标
- 插件容器页不再广播或订阅只读快照、lifecycle、overlay 事件。
- 插件 `ui.html` 自行通过 SSE 订阅：
  - 渲染只读快照：`GET /sse/renderer/readonly-store/subscribe?keys=...`
  - 插件 Overlay 消息中心：`GET /sse/plugins/:pluginId/overlay`（承载 lifecycle/overlay 事件：init/update/message/action/closed/heartbeat）
- `ui.html` 在初始化时拉取快照列表与指定快照的当前状态。

## 服务端（已就绪）
- 只读快照：`/api/renderer/readonly-store/list`、`/api/renderer/readonly-store/snapshot`、`/sse/renderer/readonly-store/subscribe?keys=...`
- 插件 Overlay：`/sse/plugins/:pluginId/overlay`

## 客户端改动
- 容器页
  - `packages/renderer/src/pages/PluginFramePage.vue`
    - 移除只读快照初始化与订阅代码、移除对 `readonly-store` 的 `emitToChild` 广播。
    - 移除 `sendLifecycleEvent` 的自动广播；保留桥接与 Overlay 操作转发（POST），不再注入与广播只读仓库。
  - `packages/renderer/src/pages/WindowFramePluginPage.vue`
    - 同步清理上述广播与订阅逻辑。
- 插件 `ui.html`
  - `buildResources/plugins/sample-overlay-ui/ui.html`
    - 通过总线桥接 `get-api-base` 获取 `base`。
    - 从 `window.__WUJIE.props.pluginId` 读取 `pluginId`。
    - 拉取快照列表与当前快照；建立只读快照 SSE（按键过滤）。
    - 建立 `EventSource` 至 `/sse/plugins/:pluginId/overlay`，处理 `init/update/message/action/closed/heartbeat`（其中 `event: lifecycle` 也透传）。
    - 统一渲染到页面（替换原先依赖 `plugin-event/readonly-store` 的逻辑）。
  - `buildResources/plugins/obs-assistant/ui.html`
    - 添加相同的只读快照拉取与 SSE 订阅；并按需展示/使用事件与快照数据。

## 验证
- 首次进入 UI 页面即可拉取完整快照并展示；随后 SSE 增量持续更新。
- 插件的 Overlay 与生命周期事件由 `ui.html` 自行订阅并处理。

## 约束
- 不保留旧兼容路径；容器页不再进行任何只读仓库或 lifecycle/overlay 广播。
- 敏感字段过滤依然由服务端实现。