## 目标
- 不再构造任何“占位房间对象”。房间列表仅由 Pinia 中的真实数据驱动渲染。
- 进入房间管理页面时，直接读取 Pinia 的 `rooms` 展示，不做页面层的对象重组或临时占位。

## 问题定位
- 目前在 `loadRooms()` 中会把主进程返回的房间 ID 转换为占位对象（标题/封面/主播名等使用默认值）：packages/renderer/src/stores/room.ts:106-136。
- 页面进入时还会再次调用 `loadRooms()`：packages/renderer/src/pages/LiveRoomPage.vue:574-576，造成重复加载与占位渲染。

## 方案
1) 改造 Pinia 的 `loadRooms()` 不创建占位对象：
- 保留从本地存储恢复的 `savedRooms`（这些是真实数据），但对主进程返回的连接房间 ID：
  - 不立刻 `push` 占位对象；为每个缺失的房间 ID触发一次 `details(roomId)`，在成功返回后再 `push` 完整房间对象。
  - 如果 `details` 失败，则该房间不进入列表（不产生占位），并在控制台记录。
- 首屏渲染：`rooms.value` 来自存储或已成功 `details` 的房间；不再出现空封面的占位卡片。

2) 改造 `addRoom(roomUrl)`：
- 连接成功后立即请求 `details(roomId)`；只有在成功拿到详情时才把房间 `push` 到 `rooms`。
- 若详情失败，不入列，给出 toast 错误提示（已存在逻辑可重用）。

3) 批量刷新策略保持稳定：
- 继续使用一次性批量更新（已实现），只对现有房间就地赋值；不替换数组、不产生新占位。

4) 页面侧调整：
- 移除 `LiveRoomPage.vue` 的 `onMounted(() => roomStore.loadRooms())`，避免重复加载与占位渲染。
- 进入页面仅绑定 Pinia 的 `rooms/isLoading` 展示，加载时显示 loading 状态，列表为空时显示空态，不再因占位对象导致图片错误。

5) 封面渲染策略（避免默认封面风暴）：
- `<img>` 仅在 `room.coverUrl` 真值时渲染；否则显示一个本地占位 div（不发网络请求）。
- 移除 `@error="onCoverError"` 或做一次性保护，防止 404 死循环。

## 预期效果
- 房间卡片只在完整数据到位后出现；进入页面时没有占位卡片，避免空封面、错误回调、大量请求。
- 页面只依赖 Pinia 的真实 `rooms` 渲染；刷新与定时更新仅就地更新现有对象，避免闪烁。