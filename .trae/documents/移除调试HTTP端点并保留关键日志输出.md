## 目标
- 删除所有调试用HTTP接口，只保留终端console.log关键节点日志
- 不影响正常业务端点（/api/events、/api/events/rooms等）

## 删除内容
- 删除以下调试端点的路由注册（ApiServer.ts）：
  - GET /api/debug/db-info
  - GET /api/debug/events/sample
  - GET /api/debug/rooms
  - POST /api/debug/room/connect
  - POST /api/debug/room/disconnect
- 可选：保留 QueryService 内部调试方法（getDbInfo、getEventsSample）但不再对外暴露HTTP端点；如你要求彻底清理，也可一并删除这些方法

## 保留/增强的日志输出（console.log）
- Adapter（packages/main/src/adapter/AcfunAdapter.ts）
  - connect开始/成功/失败
  - danmu服务启动（sessionId）
  - 原始事件到达（type/ts）
  - 统一事件标准化（type/roomId/ts/user）
- RoomManager（packages/main/src/rooms/RoomManager.ts）
  - 房间状态变更（status）
  - 写入队列前（enqueue）
- EventWriter（packages/main/src/persistence/EventWriter.ts）
  - 入队后队列长度
  - 批量写入开始/结束
  - 事务提交成功（commit ok count）
- ApiServer（packages/main/src/server/ApiServer.ts）
  - /api/events 请求参数与返回摘要
  - /api/events/rooms 返回数量
- 日志开关：继续使用 `process.env.ACFRAME_DEBUG_LOGS==='1'` 控制，默认关闭

## 验收标准
- 所有 /api/debug/* 请求返回404或不再存在
- 关键节点在终端按开关输出日志
- 类型检查通过（pnpm run typecheck）

请确认以上方案，我将执行删除调试端点并保留日志输出。