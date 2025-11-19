## 目标
- 将“导出”按钮移动到弹幕列表卡片的 Header 区域，与3个过滤输入同排显示
- 在后端接入真实数据库查询，补齐历史房间查询端点，解决“获取了弹幕都查不到”
- 保证弹幕列表卡片撑满剩余空间

## 前端调整（renderer）
- 修改 `packages/renderer/src/pages/LiveDanmuPage.vue`
  - 移除页面顶栏 `.page-header` 中的“导出”按钮
  - 在弹幕列表卡片 `t-card` 的 `#header` 插槽右侧新增“导出”按钮，沿用现有 `exportDanmu` 方法和 `exportingDanmu` 状态
  - 维持3个过滤输入（事件类型、关键词、用户过滤）保持一行横排，溢出横向滚动
  - 确认卡片样式：`danmu-list-card` 设为 `flex: 1; min-height: 0; overflow: hidden;`，列表区域 `danmu-list` 设为 `flex: 1; overflow-y: auto;`
  - 保留现有分页控件在卡片底部，不动逻辑

## 后端接入（main）
- 补齐历史房间查询 API：`GET /api/events/rooms`
  - 修改 `packages/main/src/server/ApiServer.ts`
  - 实现逻辑：从 SQLite 读取历史事件中出现过的房间并关联房间元数据
    - SQL 示例：
      - `SELECT e.room_id, COALESCE(r.streamer_name,'') AS streamer_name, MAX(e.timestamp) AS last_ts FROM events e LEFT JOIN rooms_meta r ON r.room_id = e.room_id GROUP BY e.room_id ORDER BY last_ts DESC LIMIT 200;`
    - 返回格式：`{ rooms: Array<{ roomId: string; streamerName: string }> }`
  - 若数据库为空，返回 `rooms: []`，前端自动回退本地存储（已实现）

- 确认现有事件查询 API：`GET /api/events`
  - 该端点已在 `ApiServer` 中实现，调用 `QueryService.queryEvents` 执行真实 SQLite 查询
  - `QueryService`（`packages/main/src/persistence/QueryService.ts`）使用 `DatabaseManager.getDb()` 直接查询 `events` 表，并支持分页、类型集合过滤、时间范围、用户过滤、关键字过滤
  - 如仍无数据，需确保房间已连接并产生事件：
    - 通过 IPC `room.connect` 发起房间连接（`packages/main/src/ipc/ipcHandlers.ts:265`），`RoomManager` 会将事件写入数据库（`EventWriter`）

## 验证要点
- 前端：页面渲染后，卡片 Header 显示3个过滤输入 + 导出按钮；底部显示分页；卡片垂直撑满页面
- 后端：
  - 调用 `GET /api/events/rooms` 返回 JSON（非 HTML），字段符合 `{ rooms: [{ roomId, streamerName }] }`
  - 调用 `GET /api/events?room_id={rid}&page=1&pageSize=20&type=danmaku,gift,...` 返回真实事件数据

## 代码参考
- 事件查询端点定义：`packages/main/src/server/ApiServer.ts:249-292`
- 事件查询实现：`packages/main/src/persistence/QueryService.ts:34-171`
- 数据库初始化：`packages/main/src/persistence/DatabaseManager.ts:29-141`
- 事件写入：`packages/main/src/persistence/EventWriter.ts:65-123`
- 房间连接 IPC：`packages/main/src/ipc/ipcHandlers.ts:264-289`

## 可能风险与处理
- 数据库为空导致无历史房间：端点返回空数组，前端仍会显示但无下拉项；需要通过 IPC 连接房间以产生数据
- 端点返回 HTML 导致 JSON 解析错误：明确设置 `res.json(...)` 并确保路径无静态页面拦截

请确认以上方案，我将按该方案实施前端改动与后端端点实现，并进行静态类型检查验证。