## 问题与目标
- 首次启动未读取正确配置，OBS 连接报“缺失 authentication 字符串”，需在插件启动时主动读取保存的配置。
- 新的联动要求：
  1) 启动 OBS 推流前必须确认用户未在直播，若在直播禁止自动推流。
  2) 启动前如 OBS 已在推流，先 StopStream，再设置密钥，再 StartStream。
  3) 连接错误要持续重试并弹窗“obs连接错误信息：XXX，持续重试中”，仅在用户处于“创建直播”页面时进行；离开页面停止重试；成功连接后才弹出“插件已成功加载，正在启动推流”。
- 创建直播页返回后一直“等待推流”，不再检测，需恢复检测与按钮文案翻转。

## 方案与改动

### 1. 服务端：提供插件配置读取端点
- 在 `packages/main/src/server/AcfunApiProxy.ts` 或 ApiServer 中新增 `GET /api/plugins/:pluginId/config`：返回持久化的 `ConfigManager.get('plugins.${pluginId}.config')`。
- 仅读取，无写入；权限与 CORS 与现有 `/api/plugins` 对齐。

### 2. obs-assistant：启动时主动加载配置与严格重试弹窗
- 文件：`buildResources/plugins/obs-assistant/index.js`
- 启动：`init()` 中在开启循环与 SSE 前调用新端点加载配置，合并到 `state.config`，设置 `configLoaded`。
- 重试弹窗：
  - 在 `connectObs()` 捕获错误后，若 `state.currentRoutePath === '/live/create'`，弹窗“obs连接错误信息：<err>，持续重试中”。
  - 在离开 `'/live/create'` 时停止重试弹窗与禁止新的连接尝试（保留已连的连接）。
- 成功弹窗：仅在 `connectObs` 成功后且 `currentRoutePath === '/live/create'` 的 3 秒延迟序列中弹出“插件已成功加载，正在启动推流”。
- 前置严格检查：
  - `GET /api/acfun/auth/status` 未认证直接退出；
  - `GET /api/acfun/live/stream-status` 检查用户是否正在直播，若是弹窗禁止自动推流并退出；
  - 读取只读快照 `stream` 切片；
  - `GetStreamStatus` 若正在推流，先 `StopStream` 并等待至停止（最多 10 秒）后再设置密钥与启动。
- 路由延迟：收到 `'/live/create'` 事件后设置 3 秒启动定时器；3 秒内路由变化则取消定时器与流程。

### 3. LiveCreatePage：返回后恢复检测
- 文件：`packages/renderer/src/pages/LiveCreatePage.vue`
- 增加 `onActivated()` 钩子，在组件重新激活时调用 `loadStreamInfo()` 或至少 `startStreamStatusCheck()`；在 `onDeactivated()` 清理定时器。
- 确保认证通过后开始 `transcode-info` 轮询；若认证失败保持“等待推流”。

### 4. 连接签名与参数校验
- 在 `connectObs()` 使用 `obs.connect(host, password)`；若库需要选项对象，则切换为 `obs.connect(host, { password })`（按本地 `obs-websocket-js.js` 实现兼容）；保持与现有本地兜底实现一致，不移除兜底代码与 mocks。

### 5. 测试与迭代
- 按项目规则：
  - 先调用 `electron-test-case-writer` 增补用例：启动直达“创建直播”无需进入插件 UI；3 秒延迟取消；用户已在直播禁止；OBS 已在推流先停后启；按钮文案翻转。
  - 执行编码与修复构建（bug-fixer）。
  - 使用 `electron-tester` 按 HASH 导航协议执行端到端测试；若不符预期，迭代修复直至通过。

## 影响与风险
- 新增读取配置端点，限定为只读，不改变既有 API；
- obs-assistant 增加错误弹窗与页面上下文 gating；
- 创建直播页在返回时恢复检测与文案翻转；
- 不引入 mock，遵循实际 OBS 与 acfunlive-http-api。

确认后我将开始实施代码修改、构建，并运行测试，直到完全符合上述严格流程。