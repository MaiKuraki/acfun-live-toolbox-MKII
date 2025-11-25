## 问题判断
- 错误来源：`buildResources/plugins/obs-assistant/index.js` 的 `connectObs()` 在 `typeof OBSWebSocket !== 'function'` 时返回 `OBS_WEBSOCKET_LIB_INVALID`（index.js:77-79）。
- 插件运行模型：主进程通过 `ProcessManager.startPluginProcess` 启动 Worker，Worker 使用 `vm2.NodeVM` 加载插件并通过 `requireOptions.mock` 注入依赖（plugin-worker.js）。
- 关键点：`plugin-worker.js` 在 `vm.run` 之后才应用 `manifest.runtime.mocks`，导致插件在加载期（顶层 `require('obs-websocket-js')`）无法使用清单声明的 mock。首次启用可能命中“本地注入”路径（读取同目录 `obs-websocket-js.js` 并导出 `sandbox.OBSWebSocket`）；禁用→启用后，该本地注入如果未生效或目录修复不同步，会使顶层 `require` 失败，从而出现 `OBS_WEBSOCKET_LIB_INVALID`。

## 解决方案
1) 提前注入 mock：将 `plugin-worker.js` 中对 `manifest.runtime.mocks` 的处理移动到 `vm.run` 之前；统一与本地 `obs-websocket-js.js` 注入同一时点，确保顶层 `require()` 可以解析。
2) 稳健导出解析：
- 在 `plugin-worker.js` 的本地注入分支，注入顺序为：优先 `sandbox.OBSWebSocket`；若不存在再尝试 `module.exports.default` 或 `module.exports.OBSWebSocket`。
- 在 obs-assistant 的 `index.js` 顶层 `require` 解析增加容错：当 `mod` 为对象且含 `OBSWebSocket` 函数时使用它，避免不同打包格式导致的对象导出形态。
3) 保持清理正确：确认 `cleanup()` 已断开 OBS、关闭 SSE、清理定时器（现有实现已覆盖）。

## 修改点
- `packages/main/src/plugins/worker/plugin-worker.js`
  - 将 `cfg.mocks` 读取与注入逻辑移动到 NodeVM 构造前，且与本地 `obs-websocket-js.js` 注入合并；统一写入 `requireOptions.mock` 后再 `vm.run`。
  - 本地注入支持 `module.exports.default`/`module.exports.OBSWebSocket`，避免仅依赖全局符号。
- `buildResources/plugins/obs-assistant/index.js`
  - 在解析 `require('obs-websocket-js')` 时，增加对对象导出的判定：`if (typeof mod === 'object' && typeof mod.OBSWebSocket === 'function') OBSWebSocket = mod.OBSWebSocket;`；其余保持不变。

## 验证策略
- 静态代码走查与类型检查：确保 Worker 在 `vm.run` 前已完整填充 `requireOptions.mock['obs-websocket-js']`。
- 手动流程验证（无需启动渲染服）：
  - 首次启用 `obs-assistant`：`init` 返回 `{ ok: true }`。
  - 禁用后再次启用：不再出现 `OBS_WEBSOCKET_LIB_INVALID`；`connectObs()` 正常进入连接分支或返回连接错误但非库无效。

## 风险与回退
- 变更限定于 Worker 的加载顺序与示例插件的导出解析，主进程与其它插件不受影响。
- 如需回退：仅恢复 `plugin-worker.js` 注入顺序与 `index.js` 导出解析到原状。