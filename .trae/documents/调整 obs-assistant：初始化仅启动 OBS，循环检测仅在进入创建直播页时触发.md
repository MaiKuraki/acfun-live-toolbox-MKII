## 目标
- 插件加载时：仅判断并启动 OBS（ensureObsRunning），不进行连接与循环检测。
- 循环检测（连接与重试）只在用户进入“创建直播”页面时触发；离开页面立即停止循环。

## 具体修改
- 在 `init()`：
  - 保留加载配置（loadInitialConfig）
  - 若 `config.autoStartObs` 为真，直接调用 `ensureObsRunning()`（仅启动，不连接）
  - 移除 `scheduleNext(2000)` 的初始循环启动
  - 保留 overlay SSE（路由事件）用于触发后续逻辑
- 新增状态：`state.loopEnabled: boolean`，默认 `false`
- 在 `scheduleNext(ms)`：若 `loopEnabled === false`，直接返回不设置定时器
- 在 `runLoop()`：
  - 若 `loopEnabled === false`，直接返回；不再尝试 `ensureObsRunning`
  - 当 `!state.connected` 时进行 `connectObs()` 重试；成功后按当前逻辑缩短/延长 `retryMs`
- 在 `onPluginOverlayEvent(ev, rec)`：
  - 当 `routePath === '/live/create'`：设置 `loopEnabled = true` 并 `scheduleNext(200)`（快速启动检测循环），同时保留 3 秒延迟的启动推流序列
  - 当路由离开创建页：清理循环 `clearStartTimer(); clearLoop();` 并设置 `loopEnabled = false`

## 验证
- 插件加载后立即按配置启动 OBS（不连接）；进入“创建直播”时开始连接与重试循环；离开页面停止循环；推流序列继续遵循 3 秒延迟、主动拉取 stream、OBS 先停后启、延迟 1 秒启动的严格规则。