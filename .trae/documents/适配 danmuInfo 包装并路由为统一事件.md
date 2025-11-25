## 目标
- 回调事件仅包含 `danmuInfo` 键，当前路由未处理该包装结构，导致不触发写库。新增对 `danmuInfo` 的解析与路由，使其进入统一事件管线。

## 变更
- 修改 `packages/main/src/adapter/AcfunAdapter.ts`：
  - 在 `handleDanmuEvent` 入口检测 `event.danmuInfo`，调用新方法 `processDanmuInfo(danmuInfo)`。
  - 新增 `processDanmuInfo(di)`：
    - 取 `di.type` 或 `di.signalType` 为类型标识。
    - 若 `di.payload` 是数组，逐条调用 `handleActionSignal({ ...payloadItem, signalType })`；否则按评论样式调用 `handleActionSignal({ signalType, userId, userInfo, content, timestamp })`。
  - 保留现有 ActionSignal 路由和回退逻辑，确保兼容不同结构。

## 验证
- 触发评论或其他事件时：
  - 看到 `[Adapter] callback event ...]` → `[Adapter] inbound ...]` → `[Adapter] ActionSignal ...]` → `[Room] unified ...]` → `[DB] insert ...]` → `[Writer] commit ok ...]`。
- `/api/events` 查询返回记录。