## 目标
- 将密钥与推流链接的获取从 SSE 改为主动请求，每次开启推流前都拉取最新值；获取后等待 1 秒再启动 OBS 推流。

## 具体改动
- 停止使用只读仓库 SSE 更新 `snapshotStream`：
  - 在 `onReadonlyStoreEvent` 中移除对 `state.snapshotStream` 的写入和 `tryStartStreamingIfNeeded()` 调用（保留函数但不再触发）。
  - 可保留 SSE 连接用于其他用途（不删除 SSE 相关代码）。
- 新增主动拉取函数：
  - `async function fetchLatestStream()`：通过 `POST /api/renderer/readonly-store/snapshot`，`{ keys: ['stream'] }` 获取只读仓库最新的 `rtmpUrl/streamKey`；返回 `{ rtmpUrl, streamKey }`。
  - 若返回为空，终止启动流程。
- 在 `doStartSequence()` 中替换数据来源：
  - 不再使用 `state.snapshotStream`，改为 `const s = await fetchLatestStream()`；若缺失直接退出。
  - 保留现有前置检查：认证态、用户未在直播、OBS 已在推流时先 `StopStream` 并等待停止。
  - 在设置 `SetStreamServiceSettings` 前执行 `await sleep(1000)`，随后调用 `applyObsAndStart({ rtmpUrl, streamKey }, ...)`。
- 新增通用延迟函数：
  - `function sleep(ms)`：`return new Promise(r => setTimeout(r, ms))`。

## 不变/保留
- 路由 gating（仅在 `/live/create` 且 3 秒延迟确认后执行启动流程）。
- 连接错误重试与错误弹窗策略，成功连接后才弹“插件已成功加载，正在启动推流”。
- obs-websocket 兜底实现与 runtime.mocks 保持不变（之前你的要求）。

## 验证
- 进入“创建直播”，3 秒后启动流程：
  - 主动拉取最新 `rtmpUrl/streamKey` 成功→延迟 1 秒→设置 OBS 服务→启动推流
  - 若用户已在直播→提示禁止自动推流
  - 若 OBS 正在推流→先停后启
- 离开“创建直播”页→取消定时器与重试；返回后按上述流程重新运行。