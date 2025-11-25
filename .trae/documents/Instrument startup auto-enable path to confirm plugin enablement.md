## 目标
- 使用 vm2 沙箱执行插件注册的生命周期钩子，提升隔离与安全性；内部系统钩子保持原样直接执行。
- 将 `obs-assistant` 插件的 `init()` 触发时机改为在 `afterLoaded` 生命周期发生后执行（加载完成时置位，进程启动后调用）。

## 实现思路
### A) 生命周期钩子沙箱化
- 位置：`packages/main/src/plugins/PluginLifecycle.ts`
- 变更：
  - 引入 `vm2` 的 `VM`。
  - 扩展 `LifecycleHookRegistration`，新增 `useSandbox?: boolean`（默认：当 `pluginId` 存在时为 `true`，系统内部注册为 `false`）。
  - 在 `registerHook` 内根据 `options.pluginId` 设置 `useSandbox` 默认值。
  - 在 `executeHook` 中：
    - 若 `registration.useSandbox === true` 且存在 `registration.handler`，则使用 `VM` 创建沙箱，向 `sandbox` 注入 `data`（事件载荷），以 `vm.run` 执行 `const handler = <fn>; handler(data)`；若返回值为 Promise 则 `await`。
    - 其它情况保持原有直接 `await registration.handler(eventData)`。
- 兼容性：
  - 现有系统内部钩子（安装/启用/禁用/卸载等在 `PluginManager.setupLifecycleEvents` 注册）不受影响。
  - 插件通过 `ApiBridge.lifecycle.on()` 注册的钩子自动走沙箱执行路径，无需插件改动。

### B) `afterLoaded` 触发插件 `init()`
- 位置：`packages/main/src/plugins/PluginManager.ts`
- 变更：
  - 新增成员：`private pendingInitAfterLoaded: Set<string> = new Set();`
  - 在 `loadInstalledPlugins()` 中已执行 `beforeLoaded/afterLoaded`；为每个成功 `afterLoaded` 的插件将 `pluginId` 加入 `pendingInitAfterLoaded`。
  - 在 `setupLifecycleEvents()` 中注册一个 `afterLoaded` 处理，仅负责将插件加入 `pendingInitAfterLoaded`（若上一步已加入可忽略）。
  - 在 `setupProcessManagerEvents()` 的 `process.started` 监听中：若 `pendingInitAfterLoaded` 包含该 `pluginId`，调用 `this.processManager.executeInPlugin(pluginId, 'init', [])`，成功后从集合移除。
  - 在 `ProcessManager.startPluginProcess()` 中移除开机即 `await executeInPlugin(pluginId, 'init', [])` 的逻辑，避免重复与提前调用。
- 兼容性：
  - 插件进程仍按启用时机启动；仅改变 `init()` 被调用时机为“加载后标记、进程启动后执行”。
  - 若某插件未触发 `afterLoaded`（例如加载失败），则不会自动调用 `init()`。

### C) 关联文件
- `buildResources/plugins/obs-assistant/index.js` 无需改动函数体；其 `init()` 将由主进程在 `afterLoaded` 标记后、进程启动成功时统一调用。
- 已确认 `vm2` 依赖存在并在本仓库使用（避免外部依赖假设）。

## 验证
- 启动应用：
  - 控制台可见生命周期沙箱执行日志；若插件钩子抛错，错误被捕获并不会影响主进程。
  - SSE `/sse/plugins/:id/overlay` 能观察到 `plugin-before-loaded` / `plugin-after-loaded` 事件（已在上一改动实现）。
  - `process.started` 后，看到对目标插件 `executeInPlugin('init')` 的调用日志；`obs-assistant` 的常规初始化日志随后出现。
- 回归：
  - 安装/启用/禁用/卸载钩子顺序与行为不变；系统内部钩子仍直接执行。

## 后续流程
- 按项目规则：
  1. 生成 Electron 测试用例覆盖“加载→启用→afterLoaded→init 调用”与“钩子沙箱错误捕获”。
  2. 完成编码后进行构建与错误修复。
  3. 用自动化测试运行验证；若不符，迭代修正直至通过。