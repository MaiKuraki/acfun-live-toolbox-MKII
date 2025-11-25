## 目标
- 房间状态与详情统一保存在 Pinia 的 `roomStore.rooms` 中，并通过全局定时器刷新；不再依赖进入房间管理页触发刷新。

## 现状与问题
- `roomStore` 已实现 `autoRefresh`、`refreshInterval`、`startAutoRefresh/stopAutoRefresh`，定时调用 `refreshRoomStatus()`（packages/renderer/src/stores/room.ts:580-613）。
- 目前仅在页面使用时创建 store 并在 LiveRoomPage.vue onMounted 调用 `roomStore.loadRooms()`，导致未打开页面时不刷新。

## 方案
1) 在渲染进程入口初始化 store 并开启全局刷新
- 文件：`packages/renderer/src/main.ts`（或 `App.vue` 顶层）
  - 在应用启动时：
    - 创建 Pinia → 调用 `useRoomStore()` → 执行 `loadRooms()`
    - 若 `autoRefresh` 为真，调用 `startAutoRefresh()`
  - 这样即使不打开房间管理页也会定时刷新房间状态。

2) 页面去除冗余初始化
- 文件：`packages/renderer/src/pages/LiveRoomPage.vue`
  - 移除 `onMounted(() => roomStore.loadRooms())`；仅保留手动“刷新”按钮调用 `roomStore.refreshRooms()`。
  - 页面只订阅 store 数据展示，不负责启动刷新。

3) 设置项支持
- 文件：`packages/renderer/src/pages/Settings.vue`
  - 给“自动刷新”开关和“刷新间隔（秒）”输入框绑定 store：`setAutoRefresh(enabled, interval)`。
  - 修改后立即重启计时器（store 已支持）。

4) 细节增强（可选）
- 在窗口失焦或最小化时暂停刷新，回到前台时恢复，以节省资源；可通过 `document.visibilityState` 监听实现。

## 验证
- 类型检查通过。
- 启动应用后即加载房间列表并定时刷新，无需打开房间管理页；设置中的开关与间隔变更后生效；点击页面“刷新”按钮仍可手动触发一次刷新。