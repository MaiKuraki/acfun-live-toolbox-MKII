## 问题概述
- 仍出现 “Attempted to register a second handler for 'db.getPath'”，说明 `initializeIpcHandlers` 被重复调用，导致同名通道重复注册。
- `rooms_meta` 为空：当前设计仅在使用 `room_kw`（主播名关键词）查询时按需补全并写入；普通事件写入不会自动填充该表。

## 计划修复
1. 为 `initializeIpcHandlers` 增加一次性守卫（幂等）：
- 在模块级设置 `let ipcInitialized = false`；函数开头：
  - 若已初始化则直接返回，阻止重复注册；否则标记为已初始化。

2. 保持 `db.getPath` 仅在 `index.ts` 注册一次：
- 已迁移并防重；结合幂等守卫可彻底避免重复注册错误。

3. 说明 `rooms_meta` 的生成机制：
- 只有在使用 `room_kw` 查询时才会拉取主播信息并 upsert 到 `rooms_meta`；这是按需索引优化的设计。若需要自动填充，可在后续增加后台任务（监听新房间ID并异步补全）。

## 验证步骤
- 启动后不再出现重复注册错误。
- 调用 `window.electronApi.db.getPath()` 正常返回路径。
- 使用 `/api/events?room_kw=<主播名关键词>` 触发 `rooms_meta` 写入；或后续实现后台填充任务。