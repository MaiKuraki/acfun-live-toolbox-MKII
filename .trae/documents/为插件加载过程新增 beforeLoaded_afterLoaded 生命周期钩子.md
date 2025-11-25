## 目标
- 在“插件被扫描并加载到内存（PluginInfo 创建并加入 Map）”这一时点，增加两个生命周期钩子：`beforeLoaded` 与 `afterLoaded`。
- 将钩子事件同时桥接到消息中心（SSE）以便渲染端或 UI 观察到加载过程。

## 改动点
- `packages/main/src/plugins/PluginLifecycle.ts`
  - 在现有 Hook 类型与注册/执行逻辑中追加两个新钩子：`beforeLoaded`、`afterLoaded`。
  - 保持与其它钩子一致的签名：传递 `{ pluginId, manifest, context }`（context 可包含 `pluginPath` 等载入上下文）。

- `packages/main/src/plugins/PluginManager.ts`
  - 在 `loadInstalledPlugins()` 的每个插件处理流程中：
    1) 读取并修复 `manifest` 后，在创建 `pluginInfo` 之前执行：
       - `await pluginLifecycleManager.executeHook('beforeLoaded', { pluginId, manifest, context: { pluginPath } })`
       - 通过 `DataManager.publish('plugin:${pluginId}:overlay', { event:'plugin-before-loaded', payload:{ manifest, context } }, { persist:true, meta:{ kind:'lifecycle' } })`
    2) 将 `pluginInfo` 加入 `this.plugins` 并记录日志后，执行：
       - `await pluginLifecycleManager.executeHook('afterLoaded', { pluginId, manifest, context: { pluginPath } })`
       - 同步发布 `plugin-after-loaded` 到同一渠道与 TTL
  - 在 `setupLifecycleEvents()` 中无需新增注册；加载阶段直接执行钩子与发布消息即可（参考现有 `beforeInstall/afterInstall` 的发布方式）。

## 验证
- 启动应用后，加载日志应新增：
  - `plugin-before-loaded` 与 `plugin-after-loaded` 的 SSE 事件可在 `/sse/plugins/:id/overlay` 订阅看到
  - 控制台输出新增 “beforeLoaded/afterLoaded” 执行日志
- 不影响后续 `enable/disable/install/uninstall` 的钩子顺序；仅增加加载阶段的可观测性。

## 说明
- 报文中的“娉ㄥ唽...”是 Windows 控制台的编码差异（UTF-8 输出被当成 GBK 渲染）；与本次功能无关。
- 该改动不改变已有“服务就绪后再加载/启用插件”的启动顺序，只是增强加载阶段的生命周期事件。

确认后我将按上述方案修改生命周期与加载逻辑，并提交。