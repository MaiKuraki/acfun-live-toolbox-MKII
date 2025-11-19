## 问题
- 列表出现大量“— INFO”行：时间戳显示为“—”，且为 INFO 级别，影响阅读。
- 可能原因：
  - 部分日志条目没有 `timestamp` 字段而使用了其他键（如 `ts`），导致 `formatTs(log.timestamp)` 返回“—”。
  - Debug 复选框未勾选时应只显示 error，但当前仍出现 info（需要确保过滤逻辑或默认值生效）。
  - 空消息的 info 行占据列表（需要过滤或占位）。

## 方案
### 1. 修复时间戳回退
- 修改 `Console.vue`：
  - 将 `formatTs` 入参改为 `string | number | undefined`，内部支持数字与空值。
  - 模板调用改用：`formatTs(log.timestamp ?? (log as any).ts)`，兼容主进程可能用的 `ts` 字段。
  - 若解析失败：优先显示 `HH:mm:ss`，无则显示本地当前时间作为回退，避免“—”。

### 2. 严格过滤 info 噪声
- 保持 `debugMode=false` 默认值；在 `filteredLogs` 中：
  - `debugMode=false` 时仅保留 `error`，并额外过滤空消息（`String(l.message).trim().length > 0`）。
  - `debugMode=true` 时保留现有筛选，但同样过滤空消息。

### 3. 视觉与占位
- 为无内容的行添加占位：“无内容”，但默认不渲染空内容行（减少噪声）。
- 不改变现有样式与虚拟滚动逻辑。

### 4. 验证
- 仅运行类型检查：`pnpm -C packages/renderer typecheck`。
- 手动验证：
  - Debug 未勾选：只见 error 行；
  - Debug 勾选：各级别显示，时间戳不再出现“—”；
  - 导出功能与滚动性能正常。