## 问题定位
- 触发来源：更新插件配置时调用 `onConfigUpdated` → 报错“Method onConfigUpdated not found on window”。
- 根因分析：`obs-assistant` 入口脚本在 `require` 阶段语法错误，导致模块加载为空对象，从而找不到导出方法。
  - 证据：`buildResources/plugins/obs-assistant/index.js:8` 的日志字符串未闭合，`require` 失败后被静默捕获，`plugin` 变为 `{}`。
  - 执行路径：`packages/main/src/plugins/worker/plugin-worker.js:73–84` 加载模块、`151–158` 查找方法并抛出“not found on window”。

## 修复方案
- 修复语法错误：补齐 `buildResources/plugins/obs-assistant/index.js:8` 的字符串和括号，使文件可被 `require` 正常解析。
- 保持导出：`module.exports` 已包含 `onConfigUpdated` 等方法（`buildResources/plugins/obs-assistant/index.js:586–598`），无需改动导出结构。
- 可选一致性调整（后续优化）：
  - 去除 `plugin-worker` 中旧版生命周期调用，保持与主流程一致（移除 `beforeloaded/afterloaded`，`packages/main/src/plugins/worker/plugin-worker.js:60, 83`）。此项不影响本次错误修复，可延后。

## 验证步骤（不改动外部系统）
- 构建与运行后，触发配置更新：调用主进程的 `pm.executeInPlugin(id, 'onConfigUpdated', [merged])`（来源：`packages/main/src/ipc/ipcHandlers.ts:818`）。
- 期待行为：不再出现“method not found”；`onConfigUpdated` 返回 `{ ok: true }`，并更新内部 `state.config`。

## 测试与质量流程（按项目规则）
- 先用“Electron测试用例编写器”生成覆盖场景：
  - 启动插件、更新配置、观察 HappyDOM Worker 日志与返回值。
- 用“实现度反查器”比对实现与需求。
- 用“错误修复器”进行构建与类型/终端问题修复（如有）。
- 用“Electron测试器”执行自动化流程验证通过；若失败迭代修复直至通过。

若确认以上方案，下一步我将提交对应代码修复并执行验证流程。