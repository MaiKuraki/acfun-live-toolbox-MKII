## 改造目标
- 统一采用 Happy‑DOM 的 `window` 沙盒来执行插件 `index.js`，实现作用域隔离与 DOM 能力。
- 在执行主逻辑前，按 `manifest.json.libs` 顺序注入第三方依赖（以 `window.eval` 执行）。
- 约定生命周期钩子为 `window.afterLoaded()`；支持现有 `afterloaded()` 别名调用。
- 调用路径改为直接在 `window` 作用域查找并执行方法（例如 `ensureObsRunning`、`applyObsSettings`）。

## 影响面与文件
- 修改：`packages/main/src/plugins/worker/plugin-worker.js`
- 复用：插件自身 `manifest.json` 的 `libs` 字段（如 `buildResources/plugins/obs-assistant/manifest.json:10–12`）。
- 保持：主进程的 `ProcessManager`/`WorkerPoolManager` 通信与生命周期流程不变（只调整 Worker 内部加载方式）。

## 实施步骤
1. 初始化 Happy‑DOM 环境
- 使用 `new Window({ url: 'http://localhost:8080', width: 1920, height: 1080 })` 创建 `windowRef`/`documentRef`。
- 将 Node 能力桥接到 `window`：`console`、`require`、`fs`、`path`、`child_process`、`http/https` 等（现有桥接保留）。
- 为 CommonJS 代码准备最小导出环境：`window.module = { exports: {} }`、`window.exports = window.module.exports`。

2. 按 `manifest.json` 注入依赖
- 读取 Worker 入参的插件目录，解析 `manifest.json` 的 `libs` 列表。
- 逐个读取依赖文件内容并在 `window` 作用域执行：`window.eval(libContent)`。
- 对于 `module.exports` 型依赖，执行后仍可被插件 `require` 引用（因已注入 `require`/`module`）；无需额外全局别名。

3. 执行主逻辑（index.js）
- 读取 `index.js` 文本并用 `window.eval(indexContent)` 执行，确保其顶层声明的函数挂载到 `window`。
- 调用生命周期钩子：优先 `window.afterLoaded()`，若不存在则调用 `window.afterloaded()`（两种写法择一即可）。

4. 方法调用改造
- Worker 的 `execute` 处理：不再依赖 `require` 的导出对象，改为在 `windowRef` 上寻找同名函数：`const fn = windowRef[method]`；找不到时报错或按 `optional` 返回 `undefined`。
- 退出清理：如存在 `window.cleanup` 则调用。

5. 错误与日志
- 保留并完善将插件日志转发到主进程的逻辑（`plugin_log`）。
- 对依赖文件缺失、JSON 解析失败、钩子执行失败做明确错误输出。

## 兼容与迁移
- 现有 `obs-assistant/index.js` 顶层函数在 `eval` 环境会挂到 `window`，末尾的 `module.exports = {...}` 因有 `window.module` 不会抛错。
- 清单已含 `libs`：`buildResources/plugins/obs-assistant/manifest.json:10–12`，无需额外改动。
- 钩子命名建议统一为 `afterLoaded`，短期在 Worker 侧支持别名以便平滑迁移。

## 验证要点
- 加载顺序：打印并确认先加载 `libs` 后执行 `index.js`。
- 钩子执行：`afterLoaded()` 被调用且无异常；可观察 DOM 操作输出。
- 方法调用：主进程执行 `getStatus`、`connectObs` 等应成功并返回结构化结果。
- 依赖可用：`obs-websocket-js.js` 能被使用（`window` 或 `require` 路径均可）。

## 参考代码位置
- 现有主逻辑 `require` 路径：`packages/main/src/plugins/worker/plugin-worker.js:73–85`（将改为读取文本并 `window.eval`）。
- 现有环境桥接：`packages/main/src/plugins/worker/plugin-worker.js:35–56`（继续使用）。
- 现有插件方法调用：`packages/main/src/plugins/worker/plugin-worker.js:139–175`（改为从 `windowRef` 解析函数）。

## 后续流程（按项目规则）
- 编码前：生成 Electron UI 测试用例，覆盖插件列表显示与启停、方法执行成功路径和失败路径。
- 编码后：使用实现对照检查（reflection）、自动修复构建（bug‑fixer）、执行测试（electron‑tester）；如测试失败，迭代修复直至通过。