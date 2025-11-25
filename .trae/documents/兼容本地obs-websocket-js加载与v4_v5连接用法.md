## 问题确认
- 当前本地文件 obs-websocket-js.js 是“global版”，require 返回的不是构造函数，导致 `OBS_WEBSOCKET_LIB_INVALID`。
- 参考用例是 v4 风格：`new OBSWebSocket(); obs.connect({ address:'localhost:4444', password })`。我们现在用的是 v5 风格：`obs.connect('ws://127.0.0.1:4455', { password })`。

## 修改方案（仍只使用同目录文件）
1) 可靠获取构造函数
- 在 `index.js` 中：先 `require('./obs-websocket-js.js')`。
- 若不是函数/没有 default/OBSWebSocket 函数，则读取该文件内容并用 `vm.runInNewContext` 执行，取 `sandbox.OBSWebSocket` 赋值；不使用 global。
- 失败时明确 `OBS_WEBSOCKET_LIB_INVALID`。

2) 兼容两种 connect 用法
- 在 `connectObs()` 中按顺序尝试：
  - 先尝试 v4：`obs.connect({ address: '127.0.0.1:'+port, password })`
  - 若抛错或返回失败，再尝试 v5：`obs.connect('ws://127.0.0.1:'+port, password ? { password } : undefined)`
- 记录采用的模式：`connectMode: 'v4' | 'v5'`，并打印日志。

3) 日志
- `module loaded / loop start / loop tick / connect start/success/failed` 保持 info 级；打印所用模式与错误文本。

## 验证
- 重启后应不再出现 `OBS_WEBSOCKET_LIB_INVALID`；若 v4/v5 其一可用，连接应成功并在状态摘要中显示 `connected:true`；失败则有明确原因（认证失败/拒绝/超时）。

## 影响范围
- 仅修改 obs-assistant 的 `index.js` 内部加载与连接逻辑；不改主进程或 UI 行为。