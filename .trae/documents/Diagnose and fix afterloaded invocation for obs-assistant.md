## 问题判断
- obs-assistant 已是最新；但“afterloaded 调用后无日志”。
- 直接 VM+VMScript 执行插件主文件时，sandbox 未注入 `console`，插件内多处 `console.info(...)` 将在沙箱中为 `undefined` 导致抛错；我们的代码将异常吞掉（`try { ... } catch {}`），因此看不到任何输出。

## 修复方案
- 为 VM 沙箱注入 `console` 映射，确保插件内 `console.*` 正常工作：
  - 主进程加载阶段的 VM 执行：`sandbox.console = console`，并在调用 `afterloaded()` 前后打印明确日志（如“found afterloaded, invoking...”）。对返回 Promise `await`，捕获异常并打印错误日志。
  - Worker 线程中的 VM 执行：同样为 `sandbox.console = console`；worker 顶层已重定向 `console` 到主进程，因此插件 `console.*` 将被转发并可见。

## 具体改动
- 文件：`packages/main/src/plugins/PluginManager.ts`
  - 在 afterLoaded 的 VM 调用段注入 `sandbox.console = console`；
  - 在找到函数时增加前后日志、对 `Promise` 进行 `await`；异常打印 error 日志。
- 文件：`packages/main/src/plugins/worker/plugin-worker.js`
  - 在构建 `sandbox` 时添加 `console: console`，其余逻辑不变；worker 顶层的 `console` 重定向继续生效。

## 验证
- 重启后在“加载已安装插件”阶段即可看到：
  - “found afterloaded, invoking...”与“afterloaded invoked ok”日志；
  - 插件内部输出 `"[obs-assistant] loop start"` 等日志。
- 进程启动后，worker 中也能看到插件日志；无需再怀疑版本或路径问题。

若确认，我将按上述方案更新两个位置，确保 afterloaded 在主进程与 worker 中的日志均可见。