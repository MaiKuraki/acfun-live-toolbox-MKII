## 目标
- 修复 `enablePlugin()` 中的错误早退：当持久化配置 `enabled=true` 时直接返回，导致进程未启动、`afterloaded()` 未触发。
- 调整为仅以“进程是否已存在”为幂等条件：已存在→返回；不存在→继续启动进程。

## 修改点
- 文件：`packages/main/src/plugins/PluginManager.ts`
- 方法：`public async enablePlugin(pluginId: string): Promise<void>`（约 877 行）
- 改动：
  1) 删除/注释开头的 `if (plugin.enabled) { return; }`（约 883–885 行）
  2) 保留并使用现有 `existingProcess` 幂等分支（约 888–913 行）作为唯一早退条件
  3) 可选强化日志：在方法开始打印 `enabled` 与 `existingProcess`，辅助后续排查

## 预期行为
- 启动时即使 `enabled=true`，只要进程不存在就会启动：调用 `ProcessManager.startPluginProcess(...)`
- 进程启动事件触发后，主进程无条件调用 `afterloaded()` 并统一发布 `plugin-after-loaded` 到 SSE

## 验证
- 观察启动日志：“Plugin process started successfully” 出现，其后有 `plugin-after-loaded` 与插件业务日志
- 禁用/退出时仍按方案触发 `beforeUnloaded` 并发布 SSE

如确认，我将执行上述修改并验证日志输出。