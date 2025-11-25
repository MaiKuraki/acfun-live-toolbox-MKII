## 问题定位
- `OBS_WEBSOCKET_LIB_INVALID` 表示 `globalThis.OBSWebSocket` 未注入。当前 `injectScript` 将代码插入 DOM 后再用 CJS 包装执行，导致浏览器版 `obs-websocket-js` 不能把构造函数挂到 `window/globalThis`。
- 双次执行隐患已修复，但 libs 仍在 CJS 环境下运行，无法导出到全局。

## 修复方案
- 在 Worker 中区分两类执行：
  - libs：以“浏览器全局上下文”执行（`vm.runInContext`），使 `var/this/globalThis` 指向 `windowRef`，从而 `OBSWebSocket` 挂到 `window/globalThis`。
  - main（`index.js`）：继续用 CJS 包装器执行。

## 具体改动
1) 修改 `packages/main/src/plugins/worker/plugin-worker.js`：
- 新增 `injectLibScript(code, filename)`：
  - 创建上下文：`{ window: windowRef, document: documentRef, globalThis: windowRef, require: safeRequire }`
  - 使用 `vm.runInContext(code, ctx, { filename })` 执行，不返回 `module.exports`，依赖全局挂载。
- libs 加载循环改用 `injectLibScript`，主入口仍用现有 `runCjs` 执行。
- 保留为 `<script>` 标签设置非标准 `type`，避免 Happy DOM 自动执行。

2) 提供 WebSocket 实现（通过 libs）：
- 在 `buildResources/plugins/obs-assistant` 新增 `ws-shim.js`：`window.WebSocket = require('ws');`
- 更新 `manifest.json` 的 `libs` 为：`["./ws-shim.js", "./obs-websocket-js.js"]`（确保先提供 WebSocket，再加载 OBS 库）。

## 验证
- 插件启动后，主进程的调试调用会打印：
  - 若成功：`connectObs success`。
  - 若失败：具体错误文本与堆栈（握手/认证类问题再排查）。
- 可在 Worker 内部轻量打印 `typeof window.WebSocket` 与 `typeof globalThis.OBSWebSocket`（如必要）确认注入成功。

## 注意
- 不恢复任何旧版 `runtime.mocks/injectWs`，严格使用 `libs`。
- 保持现有业务逻辑与返回值不变，仅调整执行环境。