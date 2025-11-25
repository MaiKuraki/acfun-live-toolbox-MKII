## 关键点确认
- 实际表名为 `rooms_meta`（复数），迁移时临时使用 `rooms_meta_new`，最终会重命名回 `rooms_meta`。请确认你检查的表名是否为 `rooms_meta`。
- 自动写入路径现有两处：
  - IPC `room.details` 成功后 upsert。
  - HTTP 代理 `ApiProxy` 的 `/api/acfun/danmu/room-info` 和 `/api/acfun/live/stream-status` 成功后 upsert。
- 这些 upsert 都依赖 `result.success === true`，以及传入参数名正确（如 `liverUID`）。

## 验证步骤
1. 表存在与结构：
- 执行 `PRAGMA table_info(rooms_meta)` 验证列；`SELECT COUNT(*) FROM rooms_meta` 验证行数。

2. 路径触发与日志：
- 调用 `window.electronApi.room.details('<roomId>')`，查看是否出现 `[rooms_meta] upsert room=... status=... isLive=... viewer=...]`。
- 通过 HTTP 调用 `/api/acfun/danmu/room-info?liverUID=<主播UID>` 和 `/api/acfun/live/stream-status`，检查对应 `[rooms_meta] upsert route=...]` 日志。

3. 参数与返回：
- 确认 `room.info` 使用的是 `liverUID`（主播 UID），不是 `liveId`；并确保返回 `success: true`。

## 若仍无数据的改进
- 在上述路径中增加“attempt”日志：进入 upsert 前打印 `[rooms_meta] attempt route=... room=...]`，失败时打印具体原因（无 data、success=false、参数缺失）。
- 若 upstream 返回失败但你仍希望写入基本快照（例如仅 `status` 与 `is_live`），可以在 `stream-status` 路径上始终 upsert 基本字段（我们已加）。

## 预期结果
- 通过任一路径拉取 live 状态后，`rooms_meta` 写入成功；`events/rooms` 与关键词查询可利用该信息。