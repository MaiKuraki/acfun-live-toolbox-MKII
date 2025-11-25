## 原因解释
- `console` 注入直接引用宿主已有对象，无需模块解析；Node 进程本身就有 `console`。
- `WebSocket` 在 Node 中不是内置，全局通常是 `undefined`；需要从已安装的 `ws` 包获取实现。
- 当前使用 `Module.createRequire(__filename)` 在插件目录解析 `ws`，该目录没有 `node_modules`，所以会报 `Cannot find module 'ws'`。

## 修复方案
- 在 `buildResources/plugins/obs-assistant/index.js` 的沙箱构建处，新增稳健的 `resolveWs()`：
  - 依次尝试创建 `createRequire` 于以下根，并 `require('ws')`：
    1. `process.cwd()/packages/main/package.json`
    2. `process.cwd()/package.json`
    3. `(process.resourcesPath || process.cwd())/package.json`
  - 返回第一个成功解析到的 `WebSocket` 实现及对应的 `createRequire`
- 统一注入时机：与 `console`、计时器、`globalThis/window/self` 一起，将 `WebSocket` 与选中的 `require` 注入到 `sandbox`，然后执行 `obs-websocket-js.js`，读取 `sandbox.OBSWebSocket`。
- 保持 v5 连接签名：`await obs.connect('ws://127.0.0.1:<port>', passwordOrUndefined)`；不保留旧版回退。

## 验证
- 开发模式启动后不再出现 `Cannot find module 'ws'`；`getStatus` 返回正常；正确密码时 `connected: true`。
- 关闭 OBS 时能收到 `ConnectionClosed` 并自动重试。

## 影响面
- 仅改动 obs-assistant 插件的沙箱注入逻辑，不影响主进程与其他插件。