## 目标
- 仅在 `afterloaded` 和进入“创建直播”页面时执行 `启动 obs.exe`，移除轮询与配置更新触发。
- 修复 `OBS_WEBSOCKET_LIB_INVALID`，确保能正常连接 OBS WebSocket。
- 确认各插件均可加载 `manifest.runtime` 中的注入内容（含 `mocks`），并在 obs-assistant 中实际生效。
- 完成变更后执行 commit 与 push。

## 代码改动
- 修改 `buildResources/plugins/obs-assistant/index.js`：
  - 移除轮询机制：删除 `runLoop`、`scheduleNext`、`clearLoop`，不再在配置更新或 SSE 中触发轮询；保留必要的 SSE 路由监听以识别进入“创建直播”页面。
  - 仅在以下时机执行 `ensureObsRunning`：
    - `afterloaded()` 首次加载时（参考: `index.js:275–297`）。
    - SSE 路由事件进入 `'/live/create'` 时（参考: `index.js:525–541`）。
    - 保持渲染层页面已存在的触发：`packages/renderer/src/pages/LiveCreatePage.vue:463–467`，不改动。
  - 修改 `onConfigUpdated`：仅合并配置，不触发任何启动/连接（参考: `index.js:303–313`）。
  - 删除“loop connect result”日志与相关连接尝试（当前位于 `buildResources/plugins/obs-assistant/index.js:261`）。
- 修复 `OBS_WEBSOCKET_LIB_INVALID`：
  - 替换 `buildResources/plugins/obs-assistant/obs-websocket-js.js` 为导出正确 `module.exports` 的包装（保持第三方库在插件根目录，满足 `manifest.runtime.mocks` 要求，参考: `manifest.json:10–15`）。
  - 方案：在该文件末尾显式导出 `module.exports = { default: OBSWebSocket, OBSWebSocket }`，确保 `require('obs-websocket-js')` 或 mocks 返回为函数类，从而 `connectObs()` 不再判定无效（参考: `index.js:98–104` 的校验）。
- 不改动主进程的 `manifest.runtime` 传递逻辑：`ProcessManager.buildSandboxConfig()` 已将 `injectWs/mocks` 注入工作线程（参考: `packages/main/src/plugins/ProcessManager.ts:138–159`）；`PluginManager.startPluginProcess()` 已传入 `manifest`（参考: `packages/main/src/plugins/PluginManager.ts:999`）。

## 验证
- 在开发模式下启用 obs-assistant：主进程启动后会触发 `afterloaded`（参考: `packages/main/src/plugins/PluginManager.ts:188`），观察日志：
  - 仅在 `afterloaded` 执行一次 `ensureObsRunning`，不再出现 `loop tick` 与 `loop connect result`。
  - 进入 `#/live/create` 时，通过 SSE 路由事件再次触发 `ensureObsRunning`，不在其它页面或配置更新事件触发。
- 在 OBS 正常运行且配置了 `wsPort/wsPassword` 时：
  - `connectObs()` 成功（不再返回 `OBS_WEBSOCKET_LIB_INVALID`）。
  - 在创建页里，当 `syncStreaming` 为真，仍可调用 `applyObsSettings` 与 `StartStream/StopStream/GetStreamStatus`。
- 运行时注入：验证 `manifest.runtime.mocks` 的文件被加载且 `safeRequire('obs-websocket-js')` 返回可用构造函数（参考: `packages/main/src/plugins/worker/plugin-worker.js:50–71, 73–100`）。

## 清理
- 清除 `index.js` 中不再使用的函数与日志：
  - 删除或内联 `runLoop/scheduleNext/clearLoop`；移除 `loop` 相关日志。
  - 保留与页面路由、启动序列相关的必要方法（如 `scheduleStartSequence/doStartSequence`）。

## 提交与推送
- 使用以下命令提交当前变更并推送（保持当前分支）：
  - `git add buildResources/plugins/obs-assistant/index.js; git add buildResources/plugins/obs-assistant/obs-websocket-js.js; git commit -m "obs-assistant: 移除轮询，仅在 afterloaded/创建页启动 OBS；修复 OBS WebSocket 库加载导出，解决 OBS_WEBSOCKET_LIB_INVALID"; git push`

如同意以上方案，我将按此实现、验证并执行 commit 与 push。