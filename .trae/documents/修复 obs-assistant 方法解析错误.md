## 原因
- 新的插件 Worker 使用 `runModuleInWindow` 在窗口域执行入口脚本，但未将返回的 `module.exports` 绑定到 `windowRef.module.exports`。
- `ProcessManager.executeInPlugin()` 查找顺序是 `windowRef[method] → windowRef.module.exports[method]`。`obs-assistant` 以 `module.exports` 方式导出，导致方法解析失败。

## 修复
- 在执行入口脚本后，将 `runModuleInWindow(...)` 返回的导出对象绑定到 `windowRef.module = { exports }`。
- 保持现有 `window.require` 与库白名单机制不变；无需修改 `obs-assistant/index.js`（其已导出 `module.exports = {...}`）。

## 变更点
- 文件：`packages/main/src/plugins/worker/plugin-worker.js`
- 位置：入口执行段（`indexContent` 加载处）
- 代码：
  - 执行入口：`const exportsObj = runModuleInWindow({...});`
  - 绑定：`windowRef.module = { exports: exportsObj }; windowRef.exports = exportsObj;`

## 验证
- 启动插件后，`executeInPlugin('onConfigUpdated', ...)` 能找到并执行；错误日志消失。
- 现有 UI/Overlay/SSE 行为保持正常。

## 影响
- 仅影响入口绑定方式；不改变其他架构组件。