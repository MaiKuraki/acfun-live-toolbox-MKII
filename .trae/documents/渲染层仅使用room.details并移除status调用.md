## 目标
- 渲染层房间管理与轮询全部改为使用 `window.electronApi.room.details(roomId)`，不再调用 `window.electronApi.room.status(roomId)`。

## 修改范围
- `packages/renderer/src/stores/room.ts`
  - 在 `refreshRoomStatus` 中移除并发的 `room.status` 请求，仅请求 `room.details` 并更新房间对象。
  - 在初始化与 `addRoom` 时，不再调用 `room.status`，只拉取 `room.details`。
  - 将房间的 `status/isLive` 从 `details` 映射：`status = isLive ? 'open' : 'closed'`，其余展示字段从 `details` 更新。
- 组件逻辑保持不变（LiveRoomPage.vue 等仍依赖 store 的房间对象），由 store 提供的数据完全来自 `details`。

## 验证
- 打开房间管理页面后，仅通过 `details` 刷新标题/封面/观众数/分类与 `status/isLive`。
- 轮询只命中 `details`，不会发起 `status` 的 IPC 调用。
- rooms_meta 将在每次 `details` 成功后自动 upsert。

## 注意
- 主进程中的 `room.status` handler 保留，不影响其他可能使用的路径；渲染层不再调用。