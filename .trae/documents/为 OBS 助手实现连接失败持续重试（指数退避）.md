## 问题原因
- 文案来源：`tryShowErrorToast` 在 `buildResources/plugins/obs-assistant/index.js:579-580` 提示“持续重试中”，但当前并没有为 OBS 连接实现真正的持续重试循环。
- 现有调度：仅在进入 `"/live/create"` 路由时通过一次性定时器触发 `tryAutoObsFlow`（`buildResources/plugins/obs-assistant/index.js:460-462`），不包含后续失败重试。
- SSE 有重连：`scheduleOverlaySseReconnect` 使用定时器重连（`buildResources/plugins/obs-assistant/index.js:431`），但 OBS 连接不具备同样机制。
- 失败路径：`connectObs()` 失败仅触发错误提示（`buildResources/plugins/obs-assistant/index.js:127`），没有安排下一次连接尝试。

## 改动目标
- 为 OBS 连接引入“持续重试（指数退避）”机制，与 SSE 重连保持一致的结构和风格。
- 在成功连接或离开目标路由时及时清理重试定时器，避免并发连接和资源泄漏。

## 技术方案
- 新增状态变量：
  - `state.obsReconnectTimer`（定时器句柄）
  - `state.obsRetryCount`（当前重试次数，初始 0）
  - `state.obsRetryBaseDelay`（基础延迟，建议 3000ms），并计算 `delay = Math.min(base * 2^count, 60000)` 上限 60s。
- 新增函数 `scheduleObsReconnect(reason)`：
  - 清理旧定时器 → 计算下一次延迟 → 设置 `setTimeout(connectObs, delay)` → 递增 `obsRetryCount`。
  - 首次进入重试时触发一次 `tryShowErrorToast(...)`，之后依赖节流避免刷屏。
- 接入点：
  - 在 `connectObs()` 失败分支调用 `scheduleObsReconnect(...)`（`buildResources/plugins/obs-assistant/index.js:127`）。
  - 在 `onPluginOverlayEvent` 路由进入时：如果已有 `obsReconnectTimer` 先清理，再用一次性 `tryAutoObsFlow()` 做首次尝试（`buildResources/plugins/obs-assistant/index.js:460-462`），失败即进入持续重试。
  - 在 `connectObs()` 成功后：清理 `obsReconnectTimer` 与 `obsRetryCount`（`buildResources/plugins/obs-assistant/index.js:74-130` 成功路径）。
  - 在离开 `"/live/create"` 路由时：清理 `obsReconnectTimer` 与 `obsRetryCount`（`buildResources/plugins/obs-assistant/index.js:446-476`）。
- 并发与条件控制：
  - 复用 `state.connecting`/`state.connected` 互斥（`buildResources/plugins/obs-assistant/index.js:75-76`），定时器触发时若处于连接中则跳过当前尝试。
  - 仅在 `state.currentRoutePath === "/live/create"` 时进行重试，保持与 UI 场景一致。

## 边界处理
- 最大延迟封顶防止过长等待；成功连接后立即停表归零。
- 避免与 SSE 重连相互干扰：两者各自持有独立定时器与状态。
- 保持 toast 节流：继续使用 `lastErrorToastAt` 的 3s 节流（`buildResources/plugins/obs-assistant/index.js:577-579`）。

## 代码位置与修改点
- `connectObs()`：失败分支挂接 `scheduleObsReconnect`（`buildResources/plugins/obs-assistant/index.js:127`）。
- `onPluginOverlayEvent`：进入路由时初始化/清理重试（`buildResources/plugins/obs-assistant/index.js:460-462`）。
- `tryAutoObsFlow()`：保持一次性尝试，失败后由 `scheduleObsReconnect` 接管（`buildResources/plugins/obs-assistant/index.js:478-525`）。
- 靠近 `scheduleOverlaySseReconnect` 增加 `scheduleObsReconnect`（`buildResources/plugins/obs-assistant/index.js:413-432`），复用一致的写法与清理逻辑。

## 验证方案（获批后执行）
- 在控制台记录每次重试的 `count` 和 `delay`，进入 `"/live/create"` 后断开 OBS 服务以观察指数退避行为；恢复服务后应自动连接并清理定时器。
- 按项目流程：生成 Electron 测试用例 → 对照需求反射检查 → 自动修复与构建 → 运行 Electron 测试；若失败则回到修复阶段。

## 兼容性与清理
- 不保留旧版回退代码；若存在与新机制重复的占位逻辑将直接删除，保持实现单一清晰。