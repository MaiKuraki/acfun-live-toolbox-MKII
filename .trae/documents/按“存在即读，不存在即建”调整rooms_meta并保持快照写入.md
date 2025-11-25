## 调整目标
- 不再强制重建或迁移数据库：如果 `events.db` 已存在，直接打开并使用；如果不存在，则按新 schema 创建。
- 保持每次详情都插入 rooms_meta 快照（时间序列），并写入 `like_count` 与分类字段。
- 分类字段为空时使用空字符串而非 NULL，以便后续查询与分析。

## 具体改动
- DatabaseManager
  - 移除对 `rooms_meta` 的 `DROP TABLE` 与任何迁移逻辑（已删除不再考虑重建）。
  - 使用单次 `CREATE TABLE IF NOT EXISTS rooms_meta (...)`：
    - 字段：`id INTEGER PRIMARY KEY AUTOINCREMENT, room_id TEXT, streamer_name TEXT, streamer_user_id TEXT, title TEXT, cover_url TEXT, status TEXT, is_live INTEGER, viewer_count INTEGER, online_count INTEGER, like_count INTEGER, live_cover TEXT, category_id TEXT, category_name TEXT, sub_category_id TEXT, sub_category_name TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`
  - 索引：`idx_rooms_meta_room_updated(room_id, updated_at)`、`idx_rooms_meta_streamer_name`、`idx_rooms_meta_updated_at`（均 `CREATE INDEX IF NOT EXISTS`）
  - 保持事件表的 `CREATE` 与必要的 `ALTER`（如 `received_at/source`）不变

- 写入路径（保持不改渲染层）
  - IPC `room.details`：组装 `resultData` 后执行 `INSERT` 快照；字段映射：
    - `category_id/sub_category_id/category_name/sub_category_name`：优先取 `getUserLiveInfo`，其次 `danmu.getLiveRoomInfo`；缺失时写 `''`
    - `like_count`：取 `getSummary` 或 `roomInfo`，缺失时 `0`
    - `status/is_live`：按是否直播映射
  - HTTP 代理 `/api/acfun/danmu/room-info` 与 `/api/acfun/live/stream-status`：同样执行 `INSERT` 快照并写入 `like_count` 与分类字段；缺失时 `''` 或 `0`

## 验证
- 若 `events.db` 已存在，则不会出现 `table ... already exists` 错误；若不存在则创建新表。
- 调用 `room.details` 或代理端点后，rooms_meta 按 `updated_at` 追加新行。
- 直接打开 rooms_meta 可见 `category_id/sub_category_id` 均为非 NULL（缺失为空字符串）且 `like_count` 有值。