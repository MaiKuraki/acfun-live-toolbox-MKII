## 为什么日志顺序仍是“Loaded → Server Ready”
- PluginManager 的构造函数会立即执行 `loadInstalledPlugins()`，所以“Successfully loaded 3 plugins”总是先出现；这是仅加载清单与目录，非进程启动。
- 我已将“启用已标记为启用的插件”放在 `await apiServer.start()` 之后执行；因此服务就绪后才会启动进程（日志应出现 `process.started`、`Plugin enabled successfully`）。

## 当前未触发的根因
- 捆绑插件在安装时默认 `enabled=false`（installBundledExamplesIfMissing 中设置），如果 `plugins.obs-assistant.enabled` 没被设置为 true，就不会在“Server Ready”时启用进程。

## 修改方案
- 在 ApiServer 启动成功后，显式检查 obs-assistant 的配置并自动启用：
  - 读取：`configManager.get('plugins.obs-assistant', { enabled: false })`
  - 若 `enabled===true` → 启用（现有逻辑已支持）
  - 若 `enabled===false` 且 `plugins.obs-assistant.config.autoStartObs===true` → 自动启用 obs-assistant，再调用其进程启动（`enablePlugin('obs-assistant')`）。
- 可选增强：打印明确日志“Server ready → enabling obs-assistant (autoStartObs=true)”以便你确认时序与动作。

## 实施位置
- `packages/main/src/index.ts` 在 `await apiServer.start()` 之后：
  - 读取 `plugins.obs-assistant.enabled` 与 `plugins.obs-assistant.config.autoStartObs`
  - 符合条件时调用 `await pluginManager.enablePlugin('obs-assistant')`

## 验证
- 重启后日志应显示：
  - `HTTP server running at ...`
  - 紧接着 `process.started` / `Plugin enabled successfully obs-assistant`
  - 插件进程初始化日志，然后按 `autoStartObs=true` 尝试启动 OBS（仅启动，不连接）

确认后我将按此修改并提交，确保 obs-assistant 在服务就绪后自动启用并执行初始化启动。