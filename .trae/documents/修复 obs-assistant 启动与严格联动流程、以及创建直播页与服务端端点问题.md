## 问题回顾
- 启动后直接进入“创建直播”页，obs-assistant 未启动；需先打开插件 UI 页再返回，才出现推流提示。
- 创建直播页底部按钮仍为“等待推流”。
- LiveCreatePage.vue:438 出现 `GET /api/acfun/live/stream-status 400`。
- 新的严格流程要求：
  1) 启动 OBS 推流之前，确认用户未在直播（若已在直播，禁止操作）。
  2) 启动 OBS 推流之前，若 OBS 已在推流，先停止推流，再重新设置密钥，再启动推流。
  3) 推送提示/启动 OBS 推流之前，必须确认用户正处于“创建直播”页面；收到“创建直播”页面事件后延时 3 秒启动；若 3 秒内用户跳转到其他页面则取消。

## 变更方案

### A. 确保 obs-assistant 插件在应用启动时自动运行
- 若插件当前处于启用状态（enabled=true），主进程在启动时应为所有已启用且存在 `manifest.main` 的插件启动进程。
- 调整点：检查 `PluginManager` 初始化流程，增加“对已启用插件的进程启动”步骤（仅启动，无需打开 UI）。
- 备选：在配置中默认启用 obs-assistant（若已有 `plugins.obs-assistant.enabled` 持久化键则遵循该键）。

### B. 在 obs-assistant 中实现严格联动控制
- 文件：`buildResources/plugins/obs-assistant/index.js`
- 路由监听：
  - 保留对 `/sse/plugins/obs-assistant/overlay` 的 `event: ui` 订阅，维护 `state.currentRoutePath`。
  - 当收到 `route-changed` 且 `routePath === '/live/create'`：
    - 若存在 `state.startTimer`，先清除旧定时器；
    - 设置 `startTimer = setTimeout(doStartSequence, 3000)`；若 3 秒内收到 `route-changed` 且路径非 `/live/create`，取消定时器并清除 `state.triggeredStart`。
- 严格前置检查 `doStartSequence()`：
  1) 认证检查：`GET /api/acfun/auth/status`，未认证直接退出（不提示）。
  2) 未开播检查：`GET /api/acfun/live/stream-status`，若返回存在 `liveID` 或等价标识，弹窗提示“当前账号已在直播，禁止自动推流”，退出。
  3) 拉取只读快照 `POST /api/renderer/readonly-store/snapshot`（keys: `['stream']`），获取 `rtmpUrl/streamKey`；缺失则退出。
  4) OBS 状态检查：调用 `GetStreamStatus`；若 `outputActive === true` 表示正在推流，则调用 `StopStream` 并轮询 `GetStreamStatus` 直至 `outputActive === false`（设置最多等待 10 秒，失败则提示并退出）。
  5) 设置推流：调用 `SetStreamServiceSettings(server/key)`；随后调用 `StartStream`。
- 提示逻辑：
  - 仅在进入 `/live/create` 且通过检查后弹窗：“同步推流插件已加载，正在启动obs推流”。
- 幂等控制：
  - 使用 `state.triggeredStart` 防重复；在取消或失败时清除标记。

### C. 修复服务端端点与渲染页逻辑
- 服务端：
  - `GET /api/acfun/live/stream-status` 在 `packages/main/src/server/AcfunApiProxy.ts` 中实现为：
    - 调用 `this.acfunApi.live.getLiveStreamStatus()`；返回 `{ success, data, error, code }`，确保成功响应格式为 200；认证失败也返回 200 + `{ success: false, error: 'not_authenticated' }`，避免前端直接报 400。
- 渲染页：
  - `packages/renderer/src/pages/LiveCreatePage.vue`
    - 确保未认证时不进入状态轮询（保持“等待推流”）；认证通过后开始轮询 `transcode-info`（每 5 秒）。
    - 对 `stream-status` 请求失败不作为致命错误，不阻断 `transcode-info` 轮询与按钮翻转（仅记录日志）。

### D. 测试流（按项目规则使用多个 Agent）
1) 先调用 `electron-test-case-writer`：编写用例覆盖：
   - 应用启动后无需打开插件 UI，obs-assistant 自动订阅并在进入“创建直播”后触发联动；
   - 路由延时控制：3 秒内跳出页面取消启动；
   - OBS 已在推流→先 `StopStream` 再配置与 `StartStream`；
   - 用户已在直播→弹窗禁止自动推流；
   - 按钮由“检测推流中...”翻转至“开始直播”。
2) 执行编码（上述 A–C 变更）。
3) 调用 `bug-fixer`：安装依赖、类型检查与构建；修复所有错误并给出构建产物。
4) 调用 `electron-tester`：运行测试用例，完成导航与断言；若不符合预期，重复 2–4 直至通过。

## 交付与风险
- 改动集中在 obs-assistant 插件、AcfunApiProxy 端点与 Sidebar/LiveCreatePage 交互；不影响其他插件与路由。
- 认证态统一后可避免“界面已登录但认证失败”现象。
- 严格联动流程满足你的三项前置要求，并通过 3 秒延时保证页面上下文正确。

请确认，我将按本方案实施代码与测试，直到测试通过。