## 问题
- 日志显示插件以 VM 模式加载：`mode: 'vm'`。
- 我们在插件里写了 `console.info('[obs-assistant] ...')`，但主进程没有看到任何 obs-assistant 的日志，说明 VM 沙箱内没有正确的 `console`，插件的日志调用没有被拦截/转发。

## 方案（不改变业务逻辑，仅修复日志链路）
- 在 `plugin-worker.js` 的 VM 回退加载路径中，创建 `sandbox` 时注入 `console: console`，让插件代码使用到的 `console.*` 指向工作线程的 `console`（已被我们拦截并转发到主进程）。
- 保持其它注入（`module/exports/require/__dirname/__filename/global/globalThis`）不变。

## 验证
- 重启并打开 obs-assistant UI 后，应看到：
  - `[Plugin obs-assistant] [obs-assistant] module loaded`
  - `loop start/tick`、`isObsRunning result`、`connectObs start/success/failed` 等 info/error 级日志。
- 若仍未显示，则继续沿链路检查插件方法体是否执行到相应日志点。

## 影响范围
- 仅影响 VM 加载模式下的日志可见性；不改任何业务逻辑或安全策略。