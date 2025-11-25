**问题**
- 旧 `events` 表已删除，`ApiServer` 仍通过 `QueryService` 查询 `events`，触发 `SQLITE_ERROR: no such table: events`。

**方案**
- 重构 `packages/main/src/persistence/QueryService.ts`，改为基于新三表 `live_actions` 与 `live_states` 的统一查询，保持原 API 兼容。

**实现要点**
- `queryEvents(query)`：
  - 映射 `NormalizedEventType` → `live_actions.action_type`（danmaku→comment, gift→gift, like→like, enter→enterRoom, follow→followAuthor）。
  - 映射状态类型 → `live_states.state_type`（bananaCount/displayInfo/topUsers/recentComment/chat* 等）。
  - 构造两个 SELECT 语句并 `UNION ALL`，统一返回列：`ts, room_id, source, event_type, user_id, user_name, content, raw`。
  - 可选连接 `users` 表获取 `user_name`。
  - 按 `ts DESC, event_type` 排序，支持房间/时间/用户/关键词过滤，分页与总数计算。

- `getEventStats(room_id?)`：
  - 分别统计 `live_actions` 与 `live_states`，映射为统一类型键并合并计数，返回总数与时间范围。

- `listRooms(limit)`：
  - 从 `live_actions` 与 `live_states` 取 `DISTINCT live_id`，连接 `rooms_meta` 获取主播名，按最近 `ts` 排序。

- `getDbInfo()` 与 `getEventsSample()`：
  - 基于新三表重写，`getEventsSample()` 使用联合查询返回最近的若干条事件（动作+状态）。

**不改动**
- 其他服务文件保持不变；SSE/HTTP 端点仍调用 `QueryService` 的同名方法，但现在查询新三表，错误消失。

**验证**
- 运行类型检查，确保无引用旧 `events` 的残留。
- 通过 `GET /api/events` 与 `GET /api/stats/events` 返回正常数据（来自新三表）。