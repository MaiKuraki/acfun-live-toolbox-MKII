## 目标
- 全面迁移到 vm2：取消 NodeVM，使用 `VM + VMScript` 载入插件代码并在沙箱中直接调用生命周期同名函数。
- 取消自动 `init()` 调用：在进程启动后，按加载阶段的标记，调用插件自定义的 `afterloaded()`；其它生命周期也统一按“同名函数”方式调用（如 `beforeEnable()`、`afterEnable()` 等）。

## 设计与命名
- 函数命名规则：生命周期钩子与插件内函数一一对应，采用驼峰同名：
  - 加载阶段：`beforeLoaded()`、`afterLoaded()`（插件如定义）
  - 安装：`beforeInstall()`、`afterInstall()`
  - 启用/禁用：`beforeEnable()`、`afterEnable()`、`beforeDisable()`、`afterDisable()`
  - 卸载/更新/错误：`beforeUninstall()`、`afterUninstall()`、`beforeUpdate()`、`afterUpdate()`、`onError()`
- 若插件未定义该函数则跳过；所有调用均在沙箱内执行并捕获错误。

## 变更范围
### A) Worker：改为 VM+VMScript 载入与执行
- 文件：`packages/main/src/plugins/worker/plugin-worker.js`
- 调整：
  - 引入 `VM, VMScript`；构建 `sandbox = { module:{exports:{}}, exports:{}, console:redirect, globalThis/self/window, require:safeRequire, ...mocks }`
  - `safeRequire`：允许 Node 内建少量模块、限制文件访问到插件目录及允许 roots；合并现有 mocks（包含 `ws` 与本地 `obs-websocket-js.js` 注入）。
  - `loadPlugin(pluginPath)`：读取源码→`new VMScript(code, pluginPath)`→`vm.run(script)`→导出 `plugin = sandbox.module.exports.default ?? sandbox.module.exports ?? {}`，并保留 `sandbox` 引用。
  - 执行请求：
    - 优先调用导出 `plugin[method]`；若不存在则尝试 `sandbox[method]`（全局/模块作用域定义的函数）。
    - 结果序列化回传；统一错误捕获。
  - 移除 NodeVM 路径（不再保留回退）。

### B) 主进程：取消自动 init 并在生命周期触发时调用同名函数
- 文件：`packages/main/src/plugins/ProcessManager.ts`
  - 在 `startPluginProcess` 中移除 `executeInPlugin('init')`；保持进程启动与通道创建。
- 文件：`packages/main/src/plugins/PluginManager.ts`
  - 加载阶段：保持现有 `beforeLoaded/afterLoaded` 的日志与 SSE 发布；将插件 ID 加入 `pendingLifecycleCalls['afterloaded']` 标记。
  - 进程启动事件：`process.started` 时读取标记并按顺序调用：
    - 若标记包含 `afterloaded`：`executeInPlugin(pluginId, 'afterloaded', [])`；成功后清除标记。
  - 其它生命周期：在各 `executeHook(...)` 位置，同步调用 `executeInPlugin(pluginId, '<hookName>', [payload])`（若进程未启动则忽略或延后，按需要可采用“待启动队列”）。

### C) 生命周期管理器（保持）
- `PluginLifecycleManager` 保留以便系统内部钩子或日志/统计；但不再要求插件端通过 `ApiBridge.lifecycle.on()` 注册。
- 现有 SSE 发布保持原样；插件端如有 UI/Overlay 需要仍可通过 SSE 感知事件。

## 验证
- 启用 `obs-assistant`：
  - 加载阶段日志出现 `beforeLoaded/afterLoaded`；`process.started` 后 worker 调用 `afterloaded()`（若定义），而不再调用 `init()`。
  - SSE `plugin:<id>:overlay` 能看到加载阶段事件；若插件定义其它生命周期函数，在相应阶段也会被沙箱调用。
- 回归：其它插件若未定义对应函数，将跳过调用；主进程稳定性不受影响。

## 注意
- 插件代码如依赖 `require`，需保证路径在允许范围内；本方案的 `safeRequire` 将沿用与 NodeVM 相近的白名单。
- 如需在未启动进程前调用加载阶段同名函数（直接在主进程沙箱中执行），可在后续迭代加入“主进程沙箱执行器”，但优先保持进程内执行一致性。

请确认以上方案，我将据此修改 worker 与主进程，并完成构建与测试。