## 目标
- rooms_meta 的主键改为自增整数，不再使用 room_id 作为主键；room_id 改为唯一约束以支持 ON CONFLICT(room_id)。

## 实施方案
1. 新表结构
- rooms_meta：
  - id INTEGER PRIMARY KEY AUTOINCREMENT
  - room_id TEXT UNIQUE
  - streamer_name TEXT
  - streamer_user_id TEXT
  - title TEXT
  - cover_url TEXT
  - status TEXT
  - is_live INTEGER
  - viewer_count INTEGER
  - online_count INTEGER
  - live_cover TEXT
  - category_id TEXT
  - category_name TEXT
  - sub_category_id TEXT
  - sub_category_name TEXT
  - updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  - 索引：rooms_meta(updated_at)、rooms_meta(streamer_name)

2. 迁移策略（SQLite）
- 检测现有 rooms_meta 是否存在 id 列：尝试 `SELECT id FROM rooms_meta LIMIT 1`
  - 若报错（缺列），执行迁移：
    - 创建 rooms_meta_new 按新结构
    - 从旧 rooms_meta 复制数据到 rooms_meta_new（缺失列以 NULL 复制）
    - 删除旧 rooms_meta，重命名 rooms_meta_new → rooms_meta
    - 重建索引
- 此迁移仅执行一次，不影响已有数据。

3. 代码调整
- DatabaseManager：
  - 更新建表 SQL 为新结构
  - 在 createTables() 中加上述迁移逻辑
- 其余代码（QueryService、room.details upsert）继续使用 `ON CONFLICT(room_id)`，无需改动，因 room_id 有 UNIQUE 约束可用。

## 验证
- 启动后不报错，rooms_meta 表含 id 自增主键
- 调用 room.details 后 upsert 成功，rooms_meta 记录正常写入
- `/api/events/rooms` 与关键词查询正常工作