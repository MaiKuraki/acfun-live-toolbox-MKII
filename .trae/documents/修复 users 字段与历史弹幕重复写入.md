**问题**
1. users 表的 avatar/manager_type/medal_level/medal_club 为空：在 handleNormalized 中使用了占位 userInfo，未从 raw 提取真实字段。
2. live_actions 历史弹幕重复：recentComment 的每条评论和统一的 danmaku 事件保存两次，且 send_time 不一致（统一事件用了当前时间），导致唯一索引未生效。

**修复方案**
- 在 DanmuSQLiteWriter.handleNormalized：
  - 对行为事件（danmaku/gift/like/enter/follow）：
    - userInfo 优先取 `event.raw.userInfo`（或 `event.raw.danmuInfo.userInfo`），包含 avatar/managerType/medal 等；否则回退占位。
    - send_time 优先使用 `event.raw.sendTime` 或 `event.raw.sendTimeMs` 或 `event.raw.danmuInfo.sendTime`；仅在都缺失时使用 `event.ts`。
    - danmaku content 优先 `event.raw.content`。
    - gift 提取 `raw.giftDetail/count/value`。
  - 对状态/通知事件：保持仅写入 `live_states`，不再为 recentComment 的 data 逐条写入 actions（已取消）。
- 目标：
  - users 表字段完整更新；
  - 历史弹幕只保存一份，唯一索引生效（send_time一致）。

**验证**
- 类型检查。
- 观察 users 的 avatar/manager_type/medal_* 填充；live_actions 在历史弹幕获取阶段不再出现重复条目。