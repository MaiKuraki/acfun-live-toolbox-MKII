## 目标
1. 移除旧数据库迁移逻辑，统一按新 schema 初始化。
2. 将每次获取房间详情的最新状态作为一条快照插入 rooms_meta（不覆盖），以支持时间序列分析。
3. 修正分类与点赞写入：确保 `category_id/sub_category_id` 写入，补充 `like_count` 字段。

## 方案
- 数据库层（DatabaseManager）：
  - 强制使用新表结构：`rooms_meta(id INTEGER PRIMARY KEY AUTOINCREMENT, room_id TEXT, streamer_name, streamer_user_id, title, cover_url, status, is_live, viewer_count, online_count, like_count, live_cover, category_id, category_name, sub_category_id, sub_category_name, updated_at DEFAULT CURRENT_TIMESTAMP)`。
  - 删除 rooms_meta 的迁移兼容代码；启动时 `DROP TABLE IF EXISTS rooms_meta` 然后 `CREATE TABLE rooms_meta (...)`。
  - 增加索引：`idx_rooms_meta_room_updated(room_id, updated_at)` 和 `idx_rooms_meta_streamer_name`、`idx_rooms_meta_updated_at`。
- 写入路径：改为“每次插入一条快照”，不再 `ON CONFLICT(room_id)` 覆盖。
  - IPC `room.details`：成功组装后执行 `INSERT`，包含 `like_count` 与分类字段；分类从 `getUserLiveInfo` 或 `danmu.getLiveRoomInfo` 补齐，缺失写空字符串。
  - HTTP 代理 `/api/acfun/danmu/room-info` 与 `/api/acfun/live/stream-status`：同样调整为 `INSERT` 快照，包含 `like_count` 与分类字段。
- 渲染层无需改动。

## 验证
- 应用启动后，rooms_meta 表按新结构创建。
- 每次调用 `room.details` 或代理端点都会新增一行快照，`updated_at` 记录时间。
- 分类与点赞字段不再为空。