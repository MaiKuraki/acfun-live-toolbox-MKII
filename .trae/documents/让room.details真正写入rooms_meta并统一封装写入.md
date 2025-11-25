## 目标
- 不改动渲染层；在主进程最上游拦截所有获取房间/直播信息的接口调用，一旦成功返回即写入/更新 rooms_meta。

## 拦截位置
- 主进程 AcfunDanmuModule（或其 API 实例）的方法：
  - `getUserLiveInfo(roomUid)`（用户直播信息）
  - `getLiveRoomInfo(roomUid)`（弹幕房间信息）
  - `getSummary(liveId)`（直播摘要）
- 这些是 room.details 与 HTTP 代理共同依赖的上游调用点；在此统一进行 upsert，保证任一路径都会触发写入。

## 实施方案
- 新增一个无日志的写入辅助：`RoomsMetaWriter.upsert(db, snapshot)`，填充字段：
  - `room_id, streamer_name, streamer_user_id, title, cover_url, status, is_live, viewer_count, online_count, live_cover, category_id, category_name, sub_category_id, sub_category_name, updated_at`
- 修改 AcfunDanmuModule：在上述方法成功返回后，规范化数据为 snapshot 并调用 `RoomsMetaWriter.upsert`。
  - 统一以主播 UID 作为 `room_id`。
  - `status/is_live`：依据是否有 `liveID` 或流状态判断。
  - `title/cover_url/viewerCount/likeCount/分类字段`：尽量从返回中获取，缺失填空或 0。
- 保持现有 IPC/HTTP 处理器不变；渲染层无需改动。

## 验证
- 调用渲染层的 `window.electronApi.room.details(roomId)` 会触发上游方法，rooms_meta 写入成功。
- 通过 HTTP 代理访问相关端点同样会触发写入。
- 直接打开数据库查看 `rooms_meta`，可见记录更新。