## 目标
- 子页（sample overlay window）具备与 overlay UI 相同的只读仓库快照能力
- 支持动态修改 UI 背景色（配置写入、事件广播、页面应用）
- 新增 index.js 并在窗口页展示其能力：显示可用变量、可调用函数示例、动态开关演示
- 增加定时提示功能：点击按钮后主窗口每 3 秒弹出 toast；即使关闭窗口仍持续运行；再次点击或禁用/卸载插件时停止

## 总体设计
- 渲染层外部 Frame（WindowFramePluginPage）扩展为“宿主桥接器”：与 PluginFramePage 对齐，负责：
  - 订阅只读仓库（SSE）并向子页广播 `plugin-event: readonly-store-init/readonly-store-update`
  - 发出 `plugin-init` 注入初始配置（与 UI 一致）
  - 处理 `bridge-request: get-config/set-config`（与 UI 一致）
  - 保留现有 `renderer-popup` 路由，继续走主进程 → 主窗口弹框
- 插件进程链路：创建 `buildResources/plugins/sample-overlay-window/index.js`（后端主模块）
  - 方法：`init/cleanup/handleMessage` + 能力函数 `enableTicker/disableTicker/getTickerStatus/getEnvSnapshot/updateWindowTheme`
  - 通过 Worker 安全通道向主进程报告消息（类型 `host.popup`），由主进程路由到主窗口执行全局弹框
- 主进程桥接：ProcessManager 监听安全通道消息
  - 订阅 `SecureCommunicationChannel` 的 `message.received` 事件
  - 将 `type: 'host.popup'` 的消息转发为 `renderer-global-popup`（toast/alert/confirm），保证弹框在主窗口显示
- 窗口子页（window.html）实现：
  - 展示只读仓库快照区域（初始快照 + 增量更新）
  - 背景色输入框 + 保存按钮（通过 `bridge-request: set-config` 写入；收到 `config-updated` 后应用）
  - index.js 能力展示区：
    - “环境变量”展示：调用 `getEnvSnapshot` 获取并显示（如 Node 版本、内存占用、tick 状态等）
    - “函数演示”按钮：调用 `enableTicker/disableTicker/updateWindowTheme` 等，展示返回值与状态
    - “定时提示开关”按钮：调用 `enableTicker/disableTicker`；按钮 UI 实时反映 `getTickerStatus()` 返回状态

## 详细改动
1) 扩展 WindowFramePluginPage（packages/renderer/src/pages/WindowFramePluginPage.vue）
- 新增只读仓库订阅：复用 `PluginFramePage.vue:152-197` 的 SSE 逻辑（`/sse/renderer/readonly-store`）
- 发出 `plugin-init`：参考 `PluginFramePage.vue:201-231`，从主进程读取配置并注入到子页
- 增加 `bridge-request` 处理：支持 `get-config/set-config`（参考 `PluginFramePage.vue:312-339`），对 `set-config` 后发出 `config-updated` 生命周期事件
- 保持现有 `renderer-popup` 分支不变（已走主进程 → 主窗口）

2) 创建插件主模块（buildResources/plugins/sample-overlay-window/index.js）
- 导出：
  - `init()`：初始化内部状态 `tickerEnabled=false`、`tickerHandle=null`
  - `cleanup()`：清理计时器
  - `handleMessage(type,payload)`：保留扩展点（暂返回 `ok:true`）
  - `enableTicker(message?, options?)`：若未启用，创建 `setInterval` 每 3s 通过 `parentPort.postMessage({ id, type:'host.popup', payload:{ action:'toast', message, options }, timestamp })` 推送给主进程
  - `disableTicker()`：清除计时器并置 `tickerEnabled=false`
  - `getTickerStatus()`：返回当前启用状态
  - `getEnvSnapshot()`：返回 Node 版本、进程内存占用、ticker 状态等
  - `updateWindowTheme({ uiBgColor })`：返回 `{ ok:true, next:{ uiBgColor } }`（交由外部 Frame 调用 `set-config` 持久化与广播）

3) 主进程桥接（packages/main/src/plugins/ProcessManager.ts）
- 在 `setupEventHandlers()` 或构造阶段，给 `communicationChannel` 增加 `message.received` 监听：
  - 当 `message.type==='host.popup'` 时，取 `payload.action/payload.options`，调用主窗口 `webContents.send('renderer-global-popup', { action, payload })`
  - 对 `confirm` 保持与 `ipcHandlers.ts:1148-1172` 一致的 `pendingConfirms` 机制以获得结果（或简化为仅 toast/alert）
  - 增加基础防抖与错误日志

4) 窗口子页（buildResources/plugins/sample-overlay-window/window.html）
- 添加三块 UI：
  - 只读仓库展示：订阅 `plugin-event: readonly-store-init/readonly-store-update`，渲染 JSON 快照
  - 主题设置：输入 `#RRGGBB`，点击保存 → `bridge-request: set-config { config: { uiBgColor } }`，收到 `config-updated` 后应用
  - index.js 能力展示：
    - 显示 `getEnvSnapshot()` 返回内容
    - 按钮调用：`plugin-process.execute { method:'enableTicker' | 'disableTicker' | 'updateWindowTheme', args }`
    - 状态按钮：显示当前 `getTickerStatus()` 返回值，点击切换状态
- 事件通道：复用现有 `bus.$emit('bridge-request', ...)`；新增命令 `plugin-process`，由外部 Frame 转至主进程 IPC：
  - `action: 'execute'` → `plugin.process.execute(pluginId, method, args)`
  - `action: 'message'` → `plugin.process.sendMessage(pluginId, type, payload)`（可选备用）

5) 主进程 IPC 扩展（packages/main/src/ipc/ipcHandlers.ts）
- 新增：
  - `plugin.process.execute(pluginId, method, args)` → 调用 `pluginManager.processManager.executeInPlugin(pluginId, method, args)`
  - 可选 `plugin.process.sendMessage(pluginId, type, payload)` → 调用 `processManager.sendMessageToPlugin(pluginId, type, payload, true)`
- 返回统一成功结构（`{ success, data | error }`），外部 Frame 回传 `bridge-response`

## 可靠性与状态
- 计时器运行于插件的 Worker 线程，不依赖窗口生命周期，满足“关闭窗口仍持续”
- 停止条件：再次点击按钮（调用 `disableTicker()`）、禁用插件（`disablePlugin` 会停止进程并调用 `cleanup()`）、卸载插件
- 按钮状态：始终通过 `getTickerStatus()` 读取最新状态；窗口重开时自动刷取
- 错误处理：
  - index.js 方法均返回 `{ ok, error? }`
  - 外部 Frame 捕获 IPC/执行错误并在 UI 显示
  - 主进程桥接增加日志与防抖，避免过快发送影响性能

## 交付文件
- `packages/renderer/src/pages/WindowFramePluginPage.vue`：新增只读仓库桥接、配置桥接、`plugin-process` 桥接
- `buildResources/plugins/sample-overlay-window/index.js`：新增插件主模块（方法见上）
- `buildResources/plugins/sample-overlay-window/window.html`：新增 UI 区域与调用逻辑
- `packages/main/src/plugins/ProcessManager.ts`：监听 `message.received` 并转发到主窗口弹框
- `packages/main/src/ipc/ipcHandlers.ts`：新增 `plugin.process.execute`（可选同类 `sendMessage`）

## 验证
- 静态类型检查（`pnpm typecheck`），不运行测试、不启动额外服务
- 联调流程：
  - 启用 `sample-overlay-window` 插件，打开窗口页
  - 观察只读仓库初始快照与增量更新是否显示
  - 修改背景色输入保存，主窗口主题色更新并收到 `config-updated`（窗口页应用）
  - 点击“定时提示开关”，主窗口每 3 秒弹出 toast；关闭窗口后仍持续；再次点击停止

## 备注
- 保持现有弹框路径：子页 → 外部 Frame → 预加载 → 主进程 → 主窗口
- 不引入 mock，不改动 acfunlive-http-api
- 所有新增逻辑遵循现有代码风格与约定；删除不再需要的回退代码