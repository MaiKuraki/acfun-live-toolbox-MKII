**问题定位**
- RoomManager 已调用 `DanmuSQLiteWriter.handleNormalized`，但该函数优先使用 `event.raw` 转交给 `handleEvent`。
- 来自 AcfunAdapter 的 `raw` 为 `{ type:'comment'|'gift'|'like'|'enter'|'follow', ... }`，不含 `actionType`。现有 `handleEvent` 将 `evt.type` 视为状态事件，导致行为事件误走 `insertState('comment')` 或被忽略。

**修复方案**
- 重写 `handleNormalized` 的分支：
  - 对 `event.event_type in ['danmaku','gift','like','enter','follow']`，直接构造行为事件对象（`actionType`、`danmuInfo.sendTime`、`userInfo`、`content` 等），调用 `upsertUser` 与 `insertAction`；不再将 `raw` 传入 `handleEvent`。
  - 对状态事件（`bananaCount/displayInfo/topUsers/recentComment/chat*...`），优先使用 `event.raw?.data`，必要时回退解析 `event.content`；调用 `insertState`。
- 轻调 `handleEvent` 保持仅处理 acfunlive-http-api 的 `actionType` 与特殊 `type`（`recentComment/topUsers`）。

**预期结果**
- 行为事件全部入 `live_actions`，状态/通知统一入 `live_states`，`users` 维表按回调更新。
- 继续保留 ApiBridge 与 AcfunApiProxy 接入路径无重复写入风险（唯一索引去重）。

**验证**
- 类型检查；
- 观察新三表插入记录数量增加；如 gift/banana 等依赖 raw 的细字段缺失，先插入基本信息，后续可增强从 raw 提取。