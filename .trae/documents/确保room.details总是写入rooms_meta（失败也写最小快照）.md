## 问题
- 渲染层只调用 `room.details`；当前处理器在 `getUserLiveInfo` 失败时直接返回失败，不执行写入。

## 方案
- 重构 `room.details`：即使 `getUserLiveInfo` 失败也继续从其它来源尝试获取最小快照并写入 rooms_meta；始终返回成功数据（字段不足用空值/0/closed）。

## 实施要点
- 调用顺序：
  1) `getUserLiveInfo(roomId)`（容错）
  2) `danmu.getLiveRoomInfo(roomId)`（容错）
  3) `user.getUserInfo(roomId)`（容错）
  4) 若有 `liveId` 再调用 `live.getSummary(liveId)`（容错）
- 组装 `resultData`：始终包含 `roomId, title, coverUrl, status('open'|'closed'), isLive(0|1), viewerCount, likeCount, streamer{userId,userName,avatar,level}` 与分类字段；缺失用空值或默认。
- 在返回前执行 `rooms_meta` upsert（不加任何调试日志），用 `room_id=roomId`。

## 验证
- 无论上游接口是否部分失败，`room.details` 仍返回成功数据，并写入/更新 rooms_meta；你直接打开数据库应能看到记录。