## 问题
- 启动日志显示 `DROP`/`CREATE` 顺序未生效：`CREATE TABLE rooms_meta` 在 `DROP TABLE IF EXISTS rooms_meta` 之前执行或并发，导致 `SQLITE_ERROR: table rooms_meta already exists`。
- 分类与点赞字段仍可能为空：`category_id/sub_category_id` 未从所有来源补齐，`like_count` 未覆盖所有路径。
- 你要求：删除旧迁移逻辑、强制按新 schema 初始化，并把每次获取的最新状态都插入 rooms_meta（时间序列）。

## 修改方案
1) 强制重建顺序（同步执行）
- 在 `DatabaseManager.createTables()` 中，用 `this.db.serialize(() => { ... })` 保证顺序：
  - `BEGIN` → `DROP TABLE IF EXISTS rooms_meta` → `CREATE TABLE rooms_meta (...)` → 创建索引 → `COMMIT`
- 移除任何其他位置对 rooms_meta 的 `CREATE TABLE` 调用，确保只有这一个入口。
- 若 `DROP/CREATE` 失败，捕获并重试一次；否则抛出明确错误并停止初始化。

2) 完善快照写入（所有来源）
- IPC `room.details`：
  - 始终 `INSERT` 一条新记录（不覆盖）；`room_id` 为主播 UID。
  - 字段补齐策略：
    - `category_id/sub_category_id/category_name/sub_category_name`：先从 `getUserLiveInfo`，若缺失再从 `danmu.getLiveRoomInfo`；仍缺失时写空字符串 `''`（非 null）。
    - `like_count`：从 `getSummary` 和 `roomInfo` 取，缺失则 0。
- HTTP 代理 `/api/acfun/danmu/room-info` 和 `/api/acfun/live/stream-status`：统一 `INSERT` 快照，并写入 `like_count` 与分类字段；缺失写空字符串或 0。

3) Schema 一致化
- rooms_meta （仅新结构）：
  - `id INTEGER PRIMARY KEY AUTOINCREMENT`
  - `room_id TEXT`
  - `streamer_name TEXT`, `streamer_user_id TEXT`
  - `title TEXT`, `cover_url TEXT`
  - `status TEXT`, `is_live INTEGER`
  - `viewer_count INTEGER`, `online_count INTEGER`, `like_count INTEGER`
  - `live_cover TEXT`
  - `category_id TEXT`, `category_name TEXT`, `sub_category_id TEXT`, `sub_category_name TEXT`
  - `updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`
- 索引：`idx_rooms_meta_room_updated(room_id, updated_at)`、`idx_rooms_meta_streamer_name`、`idx_rooms_meta_updated_at`

## 验证
- 启动时不再出现 `table ... already exists`；rooms_meta 表按新结构重建。
- 每次调用 `room.details` 或代理端点都会新增一行快照，`updated_at` 递增。
- 直接查看数据库：`category_id/sub_category_id` 不再为空（为空字符串则表示上游未提供），`like_count` 有值（缺失时为 0）。