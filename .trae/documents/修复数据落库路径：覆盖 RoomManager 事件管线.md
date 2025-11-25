**目标**
- 移除旧版 `events` 表及所有写入路径，不保留兼容代码。
- 事件持久化统一切换到 `users`、`live_actions`、`live_states`。

**改动清单**
- 数据库层
  - 删除 `events` 表创建与索引、迁移逻辑；启动时执行 `DROP TABLE IF EXISTS events`。
  - 保留并仅初始化 `createDanmuSchema`（三表与索引）。
- 持久化与房间管线
  - 删除 `EventWriter.ts` 文件与 `persistence/index.ts` 中的导出。
  - 修改 `RoomManager`：
    - 构造函数新增 `databaseManager` 参数，内部构造 `DanmuSQLiteWriter`。
    - 在 `adapter.on('event')` 中调用 `writer.handleNormalized(roomId, enriched)`；去除对 `EventWriter.enqueue` 的调用。
- 入口
  - 修改 `packages/main/src/index.ts`：删除 `EventWriter` 实例与相关引用；构造 `RoomManager` 时传入 `databaseManager`。

**验证**
- 运行类型检查。
- 启动弹幕后：
  - `users` 表出现最新用户信息；
  - `live_actions` 有评论/礼物/投蕉/富文本/进房等；
  - `live_states` 有香蕉、displayInfo、topUsers、recentComment 等。
- 旧 `events` 表不可用（已删除），任何依赖该表的查询/导出暂不可用（按“直接删除回退代码”的要求执行）。

**注意**
- 不修改 `AcfunApiProxy` 与 `ApiBridge` 现有接入，它们继续写入新三表；避免重复写入在 RoomManager 做一次去重控制（通过唯一索引保证）。