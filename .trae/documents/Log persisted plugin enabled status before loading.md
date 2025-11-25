## 变更说明
- 在主进程启动并准备加载插件之前，打印持久化配置中的插件启用状态到控制台，辅助排查为什么进程没有启动从而未触发 afterloaded。

## 修改点
- 文件：packages/main/src/index.ts
- 位置：在 `await apiServer.start()` 之后、`pluginManager.loadInstalledPlugins()` 之前，新增控制台输出：
  - 打印整段 `plugins` 持久化配置对象
  - 单独打印 `obs-assistant` 的 `enabled` 与其 `config.autoStartObs` 状态

## 示例输出
- `[Main] Persisted plugins config snapshot= { ... }`
- `[Main] Persisted obs-assistant enabled= true|false`
- `[Main] Persisted obs-assistant autoStartObs= true|false`

## 预期效果
- 启动日志中清晰可见当前持久化的启用状态，确认是否满足自动启用或显式启用条件，从而定位未触发进程启动的原因。