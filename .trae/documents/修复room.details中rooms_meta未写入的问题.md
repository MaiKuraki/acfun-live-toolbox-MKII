## 原因
- 在 `room.details` 的处理器中，先 `return { success: true, data: ... }`，随后才写入 `rooms_meta`，导致写入代码位于返回语句之后，永远不会执行。

## 修复
- 重构 `room.details`：
  - 先构建 `resultData` 对象（包含 title、coverUrl、status、isLive、viewerCount、likeCount、streamer 信息等）。
  - 使用 `resultData` 字段执行 `rooms_meta` upsert。
  - 最后 `return { success: true, data: resultData }`。
- 增加一次性日志：`[rooms_meta] upsert room=<roomId> status=<status> isLive=<isLive> viewer=<viewerCount>`，便于确认写入触发。

## 验证
- 调用 `window.electronApi.room.details(<roomId>)` 后，控制台应输出 upsert 日志；`rooms_meta` 表出现对应记录；随后 `/api/events/rooms` 的 `streamerName` 可从 `rooms_meta` 提供。