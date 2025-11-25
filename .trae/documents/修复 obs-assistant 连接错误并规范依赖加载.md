## 目标
- 保留 `buildResources/plugins/obs-assistant/obs-websocket-js.js`，改进 VM 注入方式，使在 Node Worker 环境下能构造 `OBSWebSocket` 并稳定连接。

## 修复思路
1. 构造完整 VM 沙箱
- 提供必要全局：`globalThis/window/self` 指向 sandbox；`setTimeout/clearTimeout/setInterval/clearInterval`
- 提供 `console` 代理，将日志通过 worker 上报
- 注入 `WebSocket`：`sandbox.WebSocket = require('ws')`（Node 实现）
- 提供 `require`：使用 `Module.createRequire(__filename)` 作为 `sandbox.require`，以防库内部使用动态 require

2. 简化注入与导出获取
- 直接执行全局版脚本，不再追加 `'this.OBSWebSocket = ...'` 片段
- 通过 `sandbox.OBSWebSocket` 读取构造器（全局版 `var OBSWebSocket=...` 会挂在上下文全局）
- 若未取得构造器或不是函数，记录 `OBS_WEBSOCKET_INIT_FAILED` 并提示缺少 `WebSocket` 或依赖

3. 连接流程统一为 v5
- 使用 v5 连接签名：`await obs.connect('ws://127.0.0.1:4455', passwordOrUndefined)`
- 删除 v4/v5 双分支与回退逻辑，遵循“禁止保留回退代码”的项目规则
- 保留 `ConnectionClosed` 监听与重试调度

4. 代码改动点
- 更新 `buildResources/plugins/obs-assistant/index.js` 的 VM 注入部分：
  - 新建 sandbox（含 `WebSocket/require/globalThis/...`）
  - 执行脚本并读取 `sandbox.OBSWebSocket`
  - 去除追加代码与旧兼容分支
- 不修改 `obs-websocket-js.js` 文件内容，只调整注入与使用方式

5. 验证
- 开发模式下启动插件，观察日志：初始化成功，`getStatus` 不再出现 `oe is not a constructor`
- 修改密码/端口正确时，`connected: true`；关闭 OBS 后能收到 `ConnectionClosed` 并重试

6. 影响与风险
- 仅影响 obs-assistant 插件加载与连接逻辑，不改动主进程或其他插件
- 依赖 `ws` 已在工程中安装，VM 注入不会引入新依赖

## 交付
- 提交更新后的 `index.js`（改进 VM 注入与连接流程）
- 保留 `obs-websocket-js.js`，作为内置资源使用