## 目标
- 去掉加载阶段触发的 `afterLoaded`，并统一生命周期为两点：`afterLoaded`（启用后或客户端启动时完成加载后触发）与`beforeUnloaded`（禁用前或客户端进程结束前触发）。
- 删除并清理：`beforeEnable/afterEnable/beforeDisable/afterDisable/beforeUninstall/afterUninstall` 的所有逻辑与代码。
- 所有生命周期触发改为 vm2 直接调用插件主文件中的同名函数，完全与 SSE 解耦。
- 为 SSE 广播加入等待队列机制：SSE 初始化之前产生的事件入队，初始化完成后依次广播；初始化后产生的事件直接广播。

## 代码改动
### 1) 生命周期类型与初始化
- 文件：`packages/main/src/plugins/PluginLifecycle.ts`
  - 移除 `beforeEnable/afterEnable/beforeDisable/afterDisable/beforeUninstall/afterUninstall` 类型项
  - 保留并新增：`afterLoaded`、`beforeUnloaded`、`onError/onRecover`、页面钩子（Ui/Window/Overlay）
  - 更新 `initializeDefaultHooks()` 只初始化保留的钩子集合

### 2) PluginManager 调整
- 文件：`packages/main/src/plugins/PluginManager.ts`
  - 删除 `loadInstalledPlugins()` 中的加载阶段 `afterLoaded` 执行与 SSE 发布（保留加载日志），确保加载阶段不再触发生命周期
  - 删除 `setupLifecycleEvents()` 中所有启用/禁用/卸载相关钩子注册与 SSE 逻辑
  - 在 `process.started`（插件进程启动）中：
    - 使用 `executeInPlugin(pluginId, 'afterloaded', [])` 触发插件 `afterloaded()`（vm2 触发）
    - 调用 `queueOrBroadcast(pluginId, { event:'plugin-after-loaded', payload:{...} })`
  - 在禁用路径与进程结束路径：
    - 在停止进程前执行 `executeInPlugin(pluginId, 'beforeUnloaded', [])`
    - 调用 `queueOrBroadcast(pluginId, { event:'plugin-before-unloaded', payload:{...} })`
  - 新增 `queueOrBroadcast(pluginId, message)` 与 `markSseReady(pluginId)`：
    - 维护 `pendingSseMessages: Map<string, any[]>` 与 `sseReady: Set<string>`
    - 若未就绪：入队；就绪后：批量 `DataManager.publish` 并清空队列

### 3) ProcessManager 调整
- 文件：`packages/main/src/plugins/ProcessManager.ts`
  - 在 `stopPluginProcess()` 内：停止前先通过 `executeInPlugin(pluginId, 'beforeUnloaded', [])`（忽略不存在）
  - 保持启动/停止/错误事件发射与日志不变

### 4) ApiBridge 清理
- 文件：`packages/main/src/plugins/ApiBridge.ts`
  - 删除已移除钩子相关的别名映射（启用/禁用/卸载的映射与安装/加载别名）

### 5) PluginUpdater 清理
- 文件：`packages/main/src/plugins/PluginUpdater.ts`
  - 移除 `beforeUpdate/afterUpdate` 钩子执行（已完成）

### 6) 插件侧（obs-assistant/index.js）
- 所有生命周期仅通过导出同名函数：`afterloaded()`、`beforeUnloaded()`（新增）
- 新增通用 SSE 发送方法：
  - `emitOverlayEvent(event, payload)`：若 `overlaySseReady` 为 false → push 至 `overlaySseQueue`；当 `openPluginOverlaySse()` 成功后将队列按序发送；之后直接发送
- 保留现有业务逻辑（OBS 检测/连接等），将原生命周期相关直接操作迁移到同名函数执行内

## 触发顺序
- 启动或启用后：插件进程启动 → 触发 `afterLoaded`（vm2 调用） → SSE（就绪则即时，否则排队）
- 禁用或进程结束前：触发 `beforeUnloaded`（vm2 调用） → 停止进程 → SSE（就绪则即时，否则排队）

## 验证
- 构建与类型检查通过
- 启动应用：
  - 不再在加载阶段看到 `afterLoaded`；在 `process.started` 后看到 `afterLoaded` 函数日志与 SSE 事件
  - 禁用或退出时：在停止前看到 `beforeUnloaded` 函数日志与 SSE 事件
- SSE 排队：
  - 在 SSE 连接建立前触发的事件可在连接后被依次广播；连接建立后事件即时广播

如确认，我将实施上述改动并补充 `beforeUnloaded` 的插件示例与 SSE 队列实现。