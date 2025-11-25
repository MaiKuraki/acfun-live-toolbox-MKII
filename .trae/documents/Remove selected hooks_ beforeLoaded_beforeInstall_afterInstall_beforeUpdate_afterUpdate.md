## 目标
- 从生命周期机制中彻底删除以下钩子：`beforeLoaded`、`beforeInstall`、`afterInstall`、`beforeUpdate`、`afterUpdate`。
- 清理类型、默认初始化、注册/执行、SSE 发布、别名映射以及任何调用点，保证构建通过、运行正常。

## 变更范围
### 1) 生命周期类型与初始化
- 文件：`packages/main/src/plugins/PluginLifecycle.ts`
  - 从 `LifecycleHook` 联合类型中移除上述 5 个枚举项。
  - 在 `initializeDefaultHooks()` 的 `allHooks` 列表中移除对应条目。
  - 保持其余钩子与执行逻辑不变。

### 2) ApiBridge 别名映射
- 文件：`packages/main/src/plugins/ApiBridge.ts`
  - 删除 `plugin.beforeLoad` → `beforeInstall`、`plugin.afterLoad` → `afterInstall` 的映射条目。
  - 其余映射保留。

### 3) PluginManager 注册/发布/执行
- 文件：`packages/main/src/plugins/PluginManager.ts`
  - 在 `setupLifecycleEvents()` 中删除对 `beforeInstall`、`afterInstall` 的注册与对应 SSE 发布逻辑：
    - 删除事件发布 `plugin-before-install`、`plugin-after-install`
  - 删除 `loadInstalledPlugins()` 中对 `beforeLoaded` 的执行；保留 `afterLoaded` 的执行与 SSE 发布。
  - 若存在安装流程中显示调用 `beforeInstall/afterInstall`（例如在 `installPlugin()` 阶段），删除对应的 `executeHook` 调用。
  - 保持现有“同名函数调用”机制对剩余钩子（启用/禁用/卸载/错误等）。

### 4) PluginUpdater 钩子执行
- 文件：`packages/main/src/plugins/PluginUpdater.ts`
  - 删除 `executeHook('beforeUpdate')` 与 `executeHook('afterUpdate')` 的调用，以及相关注释。
  - 保持更新流程本身与错误处理逻辑。

### 5) 代码引用清理与SSE影响
- 删除依赖上述钩子的 SSE 事件名：`plugin-before-install`、`plugin-after-install`，以及任何 `beforeUpdate/afterUpdate` 相关 SSE。
- 若 UI 或外部订阅依赖这些事件，需要改为观察 `afterLoaded` 或其它保留钩子；本次仅按你的要求删除，不做兼容回退。

## 验证
- 全量构建与类型检查通过。
- 启动后插件加载只出现 `afterLoaded` 钩子执行与 SSE 发布，不再出现 `beforeLoaded`/安装/更新相关钩子事件。
- 启用/禁用/卸载/错误钩子行为与日志不受影响。

## 备注
- 我会在清理时保留统一的“同名函数调用”机制用于保留的钩子；删除项不再出现在任何路径（类型、注册、执行、SSE）。
- 若后续需要新增其它加载阶段事件，可基于 `afterLoaded` 扩展，不再引入被删除的钩子。