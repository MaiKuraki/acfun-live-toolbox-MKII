## 问题
- 目前“like/关注”事件出现缺失，原因可能有两处：
  - 过滤器将非弹幕事件也做了限流/去重，导致 like/follow 被丢弃（默认 duplicate/rate-limit 未限定类型）。
  - 适配器分派虽含 like/follow，但状态流与行为流的多源事件需统一归档与摘要。

## 改动
1. 限定过滤器仅作用于弹幕
- `packages/main/src/events/normalize.ts`：
  - `rate_limit_filter` 改为仅对 `event.event_type === 'danmaku'` 生效。
  - `duplicate_filter` 改为仅对 `event.event_type === 'danmaku'` 生效。
  - 保持 `spam_filter` 原样（已限定弹幕）。

2. 明确保证 like/follow 入库
- 适配器分派已含：
  - 行为事件：`like`、`follow`（含 danmuInfo → `processDanmuInfo` → `handleActionSignal` → `handleLikeMessage/handleFollowMessage`）
  - 回退分支通过 `signalType` 包含 `like/follow` 的字符串匹配
- 验证并保留：
  - 在 `emitUnifiedEvent('like'|'follow', message)` 保留 `raw`，`room_id`，允许 `content` 为空；
  - 静态检查写库日志确保 `events.type=like/follow` 成功入库。

## 验证
- 静态走查：
  - 检查过滤器作用域变更不影响 gift/enter/follow/like 的存储。
  - 通过 `QueryService.getEventsSample`/`queryEvents(types=['like','follow'])` 进行只读验证。

## 风险
- 事件量增加（不再对 like/follow 去重/限流），但符合“保存全部事件”的要求；DB/索引无需更改。