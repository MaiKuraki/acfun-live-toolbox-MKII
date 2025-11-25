## 问题确认
- 你调用的是 `room.info`（acfunlive-http-api 的房间信息获取），而当前自动写入仅在 IPC 的 `room.details` 路径执行。如果前端或插件通过 HTTP 代理（ApiProxy）直接访问 `acfun` 相关接口（如 `/api/acfun/live/user-info`, `/api/acfun/danmu/room-info`, `/api/acfun/live/summary`），则不会触发现有 upsert，导致 `rooms_meta` 为空。

## 改进计划
- 在所有“获取live状态/房间信息”的路径统一写入 `rooms_meta`：
  1. ApiServer 的 `AcfunApiProxy`：在以下成功响应后调用 upsert：
     - `/api/acfun/live/user-info`（user live info）
     - `/api/acfun/danmu/room-info`（danmu room info）
     - `/api/acfun/live/summary`（live summary）
     - `/api/acfun/live/stream-status`（如返回房间状态）
     - 字段映射同 IPC `room.details` 的逻辑，包含：`title, cover_url, status, is_live, viewer_count, online_count, live_cover, category_id, category_name, sub_category_id, sub_category_name`，以及主播 `streamer_name/streamer_user_id`。
  2. RoomManager：在房间状态切换到 `open` 时触发一次 `acfunDanmuModule.getSummary` 与 `getLiveRoomInfo`，随后 upsert，确保采集链路也能写入。
  3. 统一封装 `upsertRoomsMeta(roomId, snapshot)` 辅助函数，避免重复代码。

## 诊断与日志
- 在每次 upsert 前后输出：`[rooms_meta] upsert route=<endpoint|source> room=<roomId> status=<open|closed> isLive=<0|1> viewer=<viewerCount>`；失败输出错误日志。

## 验证
- 经由任何路径获取 live/房间信息后，`rooms_meta` 有记录，包含所有扩展字段；`/api/events/rooms` 与关键词查询正常工作。