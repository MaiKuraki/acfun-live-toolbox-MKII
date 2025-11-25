## 目标
- 将上游 `ZtLiveScActionSignal` 映射为适配器的统一事件（评论、礼物、点赞、进入、关注），确保触发 RoomManager → EventWriter 写库。
- 在适配器增加必要的调试日志，确认接收的事件类型与字段解析结果。

## 变更
- 修改 `packages/main/src/adapter/AcfunAdapter.ts`：
  - 在 `handleDanmuEvent` 中处理 `ZtLiveScActionSignal`，新增 `handleActionSignal(event)`，根据 `signalType` 路由到 `handleDanmuMessage/handleGiftMessage/handleLikeMessage/handleEnterMessage/handleFollowMessage`。
  - 解析字段时兼容不同结构：`userId/userInfo.userID`、`nickname/userInfo.nickname`、`content/comment.content/message/text`。
  - 增加 `console.info` 调试日志：收到事件类型、解析后的关键字段、最终发射的统一事件类型。

## 验证
- 触发评论与其他类型事件时，适配器应打印解析日志；RoomManager 事件监听触发；EventWriter 打印逐条插入与提交成功日志；`/api/events` 查询返回记录。