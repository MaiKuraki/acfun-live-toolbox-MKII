## 可能根因
- 数据库文件路径不一致：主进程可能通过 `applyUserDataRedirect` 将 `userData` 指向了自定义目录（`config.json` 中的 `config.dir`），你打开的可能是默认路径的数据库。
- 写入触发路径未覆盖：当前 upsert 在 IPC `room.details` 与 HTTP `/api/acfun/danmu/room-info`、`/api/acfun/live/stream-status` 路径触发；若你的调用绕过这些路径（直接用 acfunlive-http-api），则不会写入。

## 方案（不增加任何调试接口）
1. 路径一致性
- 明确 DatabaseManager 始终使用 `app.getPath('userData')/events.db`，保留 `applyUserDataRedirect`；你只需打开该 `userData` 目录下的 `events.db`（若 `config.json` 指定了 `config.dir`，则数据库在该目录）。

2. 统一 rooms_meta 写入
- 提取一个共享的 `upsertRoomsMeta(roomId, snapshot)` 辅助函数（persistence 层），不含日志；
- 在以下所有活跃路径调用：
  - IPC `room.details`
  - HTTP 代理：`/api/acfun/danmu/room-info`、`/api/acfun/live/stream-status`、`/api/acfun/live/summary`
  - RoomManager：房间状态切到 `open` 时，抓取 `getLiveRoomInfo`/`getSummary` 后 upsert
  - AcfunDanmuModule：对外提供 `getUserLiveInfo/getLiveRoomInfo/getSummary` 的包装时，成功返回即 upsert
- 字段覆盖：`title, cover_url, status, is_live, viewer_count, online_count, live_cover, category_id, category_name, sub_category_id, sub_category_name, streamer_name, streamer_user_id`；`room_id` 使用主播 UID。

3. 迁移与结构
- 保持 `rooms_meta` 为自增主键 `id`、`room_id` 唯一；已有迁移逻辑不改动。

## 验证
- 你通过任意路径（IPC/HTTP/内部模块）获取房间信息或 live 状态后，直接在数据库的 `rooms_meta` 表看到新增或更新的记录；无需任何调试接口。
- `events.db` 的位置以 `app.getPath('userData')`（考虑 `config.dir` 重定向）为准。