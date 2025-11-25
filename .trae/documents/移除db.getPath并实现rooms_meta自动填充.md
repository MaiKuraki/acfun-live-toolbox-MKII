## 变更目标
- 移除渲染层 `window.electronApi.db.getPath()` 及其主进程处理器。
- 在每次获取房间详情（live状态）时，自动 upsert `rooms_meta`，并追加字段：`title, cover_url, status, is_live, viewer_count, online_count, live_cover, category_id, category_name, sub_category_id, sub_category_name`。

## 实施要点
1. 移除 db.getPath：
- 删除 preload 暴露的 `db.getPath`
- 删除 `index.ts` 中 `ipcMain.handle('db.getPath', ...)`

2. rooms_meta schema 扩展与迁移：
- 扩展建表语句添加上述列
- 增加迁移：对每列执行 `ALTER TABLE rooms_meta ADD COLUMN ...`，忽略“duplicate column name”报错

3. room.details 自动 upsert：
- 为 `initializeIpcHandlers` 增加 `databaseManager` 参数；在 `index.ts` 调用时传入
- 在 `room.details` 处理成功后，执行 upsert：按 `room_id` 冲突更新上述字段

## 验证
- 渲染层不再存在 `window.electronApi.db.getPath()`
- 每次调用 `room.details` 后，`rooms_meta` 记录被更新，包含所需字段
- 启动无重复handler错误