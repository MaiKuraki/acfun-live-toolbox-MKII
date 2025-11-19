## 现状判断
- 你提供的 /api/debug/db-info 显示 dbPath 正确，但 eventsCount=0，说明目前没有任何事件写入数据库
- /api/debug/events/sample 返回空，验证了上面的结论
- 未看到我们约定的结构化日志（Adapter/Room/Writer/API），可能未连接房间或未开启日志开关

## 目标
- 快速确认：房间是否已连接，事件是否到达并进入写库
- 提供无需 UI 的 HTTP 调试入口，便于你从命令行直接连接/断开房间并观察日志与数据

## 拟实施变更
- 新增调试端点（仅本地使用）
  - `GET /api/debug/rooms`：返回当前主进程管理的房间列表与状态，例如 `{ rooms: [{ roomId, status, eventCount, connectedAt, lastEventAt, reconnectAttempts }] }`
  - `POST /api/debug/room/connect`：接受 `room_id`，调用 `roomManager.addRoom(room_id)`，触发连接；返回 `{ success: true }` 或错误信息
  - `POST /api/debug/room/disconnect`：接受 `room_id`，调用 `roomManager.removeRoom(room_id)`；返回 `{ success: true }`
- 日志开关增强
  - 在日志判断中除 `process.env.ACFRAME_DEBUG_LOGS==='1'` 外，同时读取 `ConfigManager.get('debug.logs', false)`；这样你可以通过设置配置文件或后续设置页面启用日志，无需环境变量
- 使用方法（你操作）
  1. 启用日志开关（环境变量或配置项）
  2. 用 `curl` 连接房间：`curl -X POST http://127.0.0.1:<port>/api/debug/room/connect -H "Content-Type: application/json" -d '{"room_id":"<你的房间ID>"}'`
  3. 查看 `GET /api/debug/rooms`：房间 `status` 应为 `open`，`eventCount` 开始增长
  4. 看到终端日志链路：`[Adapter] connect start` → `[Adapter] danmu start` → `[Adapter] unified ...` → `[Room] enqueue ...` → `[Writer] commit ok ...`
  5. 再次调用 `/api/debug/db-info` 与 `/api/debug/events/sample`，应看到数据

## 验证与后续
- 若仍只收到 ZtLiveScStateSignal（状态信号）而没有弹幕类事件，我将增加将状态信号映射为 `system` 类型入库（仅在你确认需要时进行）
- 若已经有 `[Writer] commit ok` 但 `/api/events` 仍为空，我将调整前端过滤策略或房间ID映射，确保查询命中

请确认以上方案，我将按此实现调试端点与日志开关增强，并指导你用命令行连接房间、贴日志与数据结果，以快速定位问题。