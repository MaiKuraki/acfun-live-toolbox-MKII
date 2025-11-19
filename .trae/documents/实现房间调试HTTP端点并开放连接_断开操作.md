## 目标
- 提供可直接在命令行使用的房间调试端点：查询房间状态、连接房间、断开房间
- 便于你在无 UI 的情况下验证“事件→入库→查询”的整条链路

## 变更内容
- ConsoleManager：新增公开方法
  - `listRooms(): RoomInfo[]` 返回 `roomManager.getAllRooms()`
  - `connectRoom(roomId: string): Promise<boolean>` 调用 `roomManager.addRoom(roomId)`
  - `disconnectRoom(roomId: string): Promise<boolean>` 调用 `roomManager.removeRoom(roomId)`
- ApiServer：新增HTTP端点
  - `GET /api/debug/rooms` → `{ success: true, rooms }`
  - `POST /api/debug/room/connect`（body: `{ room_id: string }`）→ `{ success: true } | { success: false, error }`
  - `POST /api/debug/room/disconnect`（body: `{ room_id: string }`）→ `{ success: true } | { success: false, error }`
- 端点仅本地使用，不做鉴权；保持与当前调试用途一致

## 使用方式
- 启动时开启日志：`ACFRAME_DEBUG_LOGS=1`
- 连接房间：
  - `curl -X POST http://127.0.0.1:18299/api/debug/room/connect -H "Content-Type: application/json" -d '{"room_id":"<你的房间ID>"}'`
- 查看房间状态：
  - `curl http://127.0.0.1:18299/api/debug/rooms`
- 断开房间：
  - `curl -X POST http://127.0.0.1:18299/api/debug/room/disconnect -H "Content-Type: application/json" -d '{"room_id":"<你的房间ID>"}'`

## 验证
- 终端应出现我们植入的结构化日志（Adapter/Room/Writer/API）
- `/api/debug/db-info` 与 `/api/debug/events/sample` 应显示非空数据（当直播间产生事件时）

请确认，我将立即实现这些端点并提交。