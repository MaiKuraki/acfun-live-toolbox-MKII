## 目标
让在 libs（浏览器上下文）与主入口（CJS 包装）中调用的 `console.*`，统一通过既有转发机制输出到主进程控制台与插件日志。

## 方法
- 利用现有的全局 `console` 转发（已在 worker 顶部替换），将该转发后的 `console` 注入到 `windowRef.console` 中，使浏览器上下文执行的代码也使用转发控制台。
- 保持 CJS 包装代码继续使用全局 `console`（已转发），无需额外改动。

## 修改点
- 文件：`packages/main/src/plugins/worker/plugin-worker.js`
- 位置：完成 `Happy DOM` 初始化后（`windowRef/documentRef` 设置完成），注入 `windowRef.console = console`。
- 保障：`vm.runInContext` 使用的上下文为 `windowRef`，因此调用 `console` 将走转发逻辑。

## 验证
- 在 libs 与主入口内任意 `console.log/info/warn/error/debug` 将出现在主进程控制台并镜像到插件日志。