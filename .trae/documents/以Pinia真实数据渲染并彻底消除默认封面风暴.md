## 问题与目标
- 不再构造占位房间对象；进入页面直接用 Pinia 的真实房间数据渲染。
- 移除导致默认封面重复请求的根因：空封面渲染 + 404 错误循环 + 页面重复加载。
- 保持主进程 `room.status` 与 `room.details` 的聚合逻辑不变（ipcHandlers.ts:325 起）。

## Store改造（Pinia）
- 文件：packages/renderer/src/stores/room.ts
- 改造 `loadRooms()`（104-180）：
  - 保留从本地存储恢复的 `savedRooms`（真实数据）。
  - 对主进程返回的连接房间 ID 不再映射占位对象；改为批量拉取详情：`Promise.allSettled(room.details(roomId[]))`。
  - 仅将成功返回的详情转换为 `Room` 并 push 到 `rooms.value`；失败的不入列（日志记录）。
- 改造 `addRoom(roomUrl)`（287-404）：
  - `connect` 之后立即 `details(roomId)`，仅在详情成功时 push 新房间；失败则 toast 提示，不入列。
- 刷新 `refreshRoomStatus()`（203-285）：
  - 保持已有一次性批量就地更新与 `isRefreshing` 互斥，保证同一周期只写一次，避免中间态与闪烁。

## 页面改造（仅渲染真实数据）
- 房间管理页：packages/renderer/src/pages/LiveRoomPage.vue
  - 删除页面级 `onMounted(() => roomStore.loadRooms())`（574-576），避免重复加载；依赖 Store 在初始化时 `loadRooms()/startAutoRefresh()`（617-621）。
  - 封面渲染：将 `<img :src="room.coverUrl || '/default-cover.png'" ...>` 改为条件渲染：
    - `v-if="room.coverUrl"` 时渲染 `<img :src="room.coverUrl">`
    - `v-else` 渲染一个不发网络请求的占位元素（本地样式方块或 SVG），彻底避免默认封面网络请求
  - 移除或保护错误回调 `@error="onCoverError"`：若保留则一次性回退并 `target.onerror=null`，防止循环
- 直播管理页：packages/renderer/src/pages/LiveManagePage.vue
  - 将封面渲染改为条件：`v-if="liveInfo.cover"` 用 `<img>`；否则使用本地占位，不请求默认封面

## 样式与交互（稳定渲染）
- 操作区保持固定槽位与 `v-show` 控制，不再因条件增减节点触发布局重排（LiveRoomPage.vue:191-226）。
- `.room-item` 过渡仅限颜色（662-670），避免尺寸/显示参与动画。

## 验证与观测
- Network：进入房间管理页不再出现 `default-cover.png` 请求；封面仅在真实 URL 时发起请求。
- Performance：进入页与定时刷新仅出现一次统一更新；卡片无闪烁。
- 错误容忍：`details` 失败的房间不进入列表；`status` 与 `details` 在刷新时批量就地更新，避免中间态。

## 说明
- 主进程 `room.details` 封面清洗逻辑已存在（ipcHandlers.ts:419-438），前端遵循“无封面不渲染图片”的策略即可避免错误链路。
- 如需默认图标风格，可在 CSS 占位元素中使用背景色与圆角，统一视觉且零网络请求。