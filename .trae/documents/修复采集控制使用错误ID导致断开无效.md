## 结论
- 主进程的房间管理使用“房间ID=主播UID”作为唯一标识：`room.connect/disconnect/status(list)` 都以 UID 识别（ipcHandlers.ts:265-341）。
- 渲染层采集控制按钮与删除等操作使用了 `room.liveId`（直播场次ID），当 `details` 返回了 `liveId`（如 QzZEmO300Hk）与 `roomId`（UID）不同，传给主进程的断开/删除 ID 就不匹配，导致无日志且无效果。
- 你的页面显示“弹幕采集中、房间已连接”，说明 `status/details` 的展示没问题，但按钮调用的 ID 错了。

## 修改点
- 文件：`packages/renderer/src/pages/LiveRoomPage.vue`
  1) 采集按钮 `toggleConnection(room)`：
     - 改为 `window.electronApi.room.disconnect(room.id)` / `connect(room.id)`（使用 UID）。
     - 失败时 toast 提示（显示 `code/error`），避免“无反馈”。
  2) “进入直播间”按钮：
     - 链接应使用 UID（你之前要求如此），改为 `https://live.acfun.cn/live/${room.id}`。
  3) 菜单项与删除：
     - `删除房间` 改为 `roomStore.removeRoom(room.id)`；
     - `复制链接` 改为复制 UID 链接（你之前要求使用 userID）。
  4) 详情对话框选择：
     - `selectedRoomId = room.id` 确保详情窗口基于 UID 查询。

- 文件：`packages/renderer/src/stores/room.ts`
  5) `removeRoom(roomId: string)` 中已经以 `rooms.value.findIndex(room => room.id === roomId)` 对比 UID，不需修改；确保所有调用传入的就是 `id`。

## 验证
- 进入房间管理：
  - 采集标签显示“😊 弹幕获取中”时，点击“断开采集”→ 主进程 `room.disconnect(uid)` 返回 `{ success: true }`；若未连接则返回 `{ success:false, code:'not_found' }` 并 toast。
  - 删除房间：成功断开并在列表移除。
  - 进入直播间链接打开以 UID 为路径。

## 备注
- 显示层继续双标签：直播状态（isLive）与采集状态（status）不变。
- 上述改动不改变主进程逻辑，只修正渲染层调用参数，解决“连接了但断不开”的核心问题。