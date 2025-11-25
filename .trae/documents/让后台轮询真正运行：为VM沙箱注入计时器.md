## 结论
- 日志显示：`loop start` 已打印，但没有任何 `loop tick` 或 `connectObs`，同时 `getStatus` 能打印 `running: true`。
- 这符合“插件以 VM 模式加载且沙箱缺少计时器 API”的症状：`setTimeout` 未注入，`scheduleNext()` 不会执行，从而后台轮询不运行。

## 修改
- 在 `plugin-worker.js` 的 VM 沙箱对象中注入计时器：
  - `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` 直接引用工作线程的全局实现。
- 其它逻辑不变；日志转发已生效。

## 验证
- 重启并打开 UI 后，主进程应看到：
  - `[obs-assistant] loop start` → 后续持续出现 `[obs-assistant] loop tick`、`loop detect`、`connectObs start/success/failed`。
  - `getStatus` 摘要中的 `connected/connecting` 会随连接状态变化。

## 影响
- 仅修复 VM 模式的计时器环境，不改变业务逻辑或安全策略。