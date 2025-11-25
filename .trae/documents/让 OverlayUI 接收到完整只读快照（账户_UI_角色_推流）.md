## 问题定位
- 当前 OverlayUI 订阅的只读快照只看到 `rooms` 切片，原因是其他 Pinia store（account/ui/role/stream）仅在“发生变更”时调用增量上报，初始化阶段未主动执行一次“初始快照”上报。
- 主进程初始快照由最近记录聚合而成：`packages/main/src/server/ApiServer.ts:1131-1148`，只有发布过的切片才会出现在 init 中；未发布则缺失。

## 目标
- 在应用启动或 store 初始化时，主动上报一次 `readonly-store-init`，确保 OverlayUI 初始即能收到完整切片：`account`、`ui`、`role`、`stream`。
- 保持现有增量上报逻辑不变，后续变更通过 `readonly-store-update` 持续同步。

## 改动点
- `packages/renderer/src/utils/readonlyReporter.ts` 已提供 `reportReadonlyInit` 和 `reportReadonlyUpdate`，无需新工具。
- 为以下 store 在初始化完成后补充一次 init 上报：
  - `account.ts`：在 `loadUserInfo()` 完成后，构造最小 `profile` 并 `reportReadonlyInit({ account: { isLoggedIn, profile } })`，参考 `packages/renderer/src/stores/account.ts:279-293` 的现有增量上报结构。
  - `ui.ts`：`loadFromStorage()` 后调用 `reportReadonlyInit({ ui: { theme, sidebarCollapsed, isFullscreen, windowSize } })`，参考 `packages/renderer/src/stores/ui.ts:101-117` 的增量结构。
  - `role.ts`：`initRole()` 后调用 `reportReadonlyInit({ role: { current, statsScope } })`，参考 `packages/renderer/src/stores/role.ts:52-64` 的增量结构。
  - `stream.ts`：在 `setStreamInfo()` 或首次 `refresh()` 完成后，除已有 `syncReadonlyStore()` 外，再调用一次 `reportReadonlyInit({ stream: { rtmpUrl, streamKey, expiresAt } })` 保证初次也进入最近记录；参考 `packages/renderer/src/stores/stream.ts:71-79`。

## 验证
- 启动后 OverlayUI 连接 `/sse/renderer/readonly-store`，应在 `readonly-store-init` 中看到四个切片：`rooms`、`account`、`ui`、`role`，当进入创建直播页或触发刷新后出现 `stream` 切片；若已有流信息，`stream` 也会在 init 里出现。
- 依旧满足敏感字段过滤与 `plugin` 顶层过滤：主进程已在发送前移除 `plugin` 字段：`packages/main/src/server/ApiServer.ts:1121-1125`。

## 说明
- 不改变现有事件通道与订阅逻辑（`PluginFramePage.vue` 及 `WindowFramePluginPage.vue` 保持不变）。
- 遵循“删除回退代码”的约束：仅新增初始化上报，不保留兼容旧路径。