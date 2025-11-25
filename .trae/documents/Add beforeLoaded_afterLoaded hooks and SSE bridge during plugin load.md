## 目标
- 在插件扫描并读入清单时，新增 `beforeLoaded` 与 `afterLoaded` 两个生命周期钩子，并在加载阶段主动执行。
- 同步把这两个钩子事件发布到插件 Overlay 消息通道（SSE）供 UI 观察。

## 代码改动
### 1) 扩展生命周期钩子类型
- 文件：`packages/main/src/plugins/PluginLifecycle.ts`
- 在 `LifecycleHook` 联合类型中追加：`'beforeLoaded' | 'afterLoaded'`。
  - 参考：类型定义位置 `packages/main/src/plugins/PluginLifecycle.ts:8-30`。
- 在 `initializeDefaultHooks()` 中将这两个新钩子加入 `allHooks` 列表以初始化空注册表（保持与现有默认钩子一致）。
  - 参考：初始化位置 `packages/main/src/plugins/PluginLifecycle.ts:75-89`。
- 无需调整 `executeHook` 签名；现有实现已满足 `{ pluginId, manifest, context }` 并自动补齐 `timestamp`。
  - 参考：执行逻辑 `packages/main/src/plugins/PluginLifecycle.ts:164-210`。

### 2) 在加载阶段执行钩子并桥接到 SSE
- 文件：`packages/main/src/plugins/PluginManager.ts`
- 位置：`loadInstalledPlugins()` 内，解析并合并清单后、构建 `PluginInfo` 之前。
  - 插入：执行 `beforeLoaded` 并发布 SSE。
    - `pluginLifecycleManager.executeHook('beforeLoaded', { pluginId, manifest: mergedManifest, context: { pluginPath } })`
    - `this.dataManager.publish('plugin:' + pluginId + ':overlay', { event: 'plugin-before-loaded', payload: { manifest: mergedManifest, context: { pluginPath } } }, { ttlMs: 2 * 60 * 1000, persist: true, meta: { kind: 'lifecycle' } })`
  - 参考：清单与合并完成到构建 `PluginInfo` 的区域 `packages/main/src/plugins/PluginManager.ts:583-616`。
- 在 `pluginInfo` 加入 `this.plugins` 并记录日志之后，插入：
  - 执行 `afterLoaded` 并发布 SSE。
    - `pluginLifecycleManager.executeHook('afterLoaded', { pluginId, manifest: mergedManifest, context: { pluginPath } })`
    - `this.dataManager.publish('plugin:' + pluginId + ':overlay', { event: 'plugin-after-loaded', payload: { manifest: mergedManifest, context: { pluginPath } } }, { ttlMs: 2 * 60 * 1000, persist: true, meta: { kind: 'lifecycle' } })`
  - 参考：`pluginInfo` 入表与日志位置 `packages/main/src/plugins/PluginManager.ts:617-632`。
- 保持 `loadInstalledPlugins()` 方法签名为同步（`void`），以上两个 `executeHook` 采用非阻塞触发（不 `await`），以避免破坏当前调用点（例如 `packages/main/src/plugins/PluginManager.ts:327` 与 `:1646` 的非 `await` 调用）。
- 不在 `setupLifecycleEvents()` 注册新钩子处理器；加载阶段仅执行与发布即可，遵循现有安装/启用阶段的发布风格。

## 发布通道与事件
- 通道：`plugin:${pluginId}:overlay`
- 事件：`plugin-before-loaded`、`plugin-after-loaded`
- 载荷：`{ manifest, context: { pluginPath } }`
- 发布选项：`{ ttlMs: 120000, persist: true, meta: { kind: 'lifecycle' } }`（与既有生命周期事件一致）。

## 验证
- 启动后查看控制台与日志：应出现 `beforeLoaded/afterLoaded` 执行日志。
- 订阅 SSE：`/sse/plugins/:id/overlay` 可收到 `plugin-before-loaded` 与 `plugin-after-loaded` 事件。
- 顺序不受影响：后续 `enable/disable/install/uninstall` 钩子顺序保持不变，仅增加加载阶段可观测性。

## 后续（确认后执行）
- 按项目规则：先生成 Electron UI 测试用例，完成编码后运行构建与修复，再用自动化测试验证；若不符则迭代直到通过。