## 变更目标
- 彻底把“插件扫描+加载+启用”改为在 ApiServer 成功启动并监听端口后才执行，保证 obs-assistant 在 init 阶段访问 /api 不会因为服务未就绪而失败。

## 代码调整
- 修改 `PluginManager` 构造流程：
  - 移除构造函数里的 `this.loadInstalledPlugins()` 立即加载行为。
  - 新增一个公开方法 `bootstrapInstalledPlugins()`（或将 `loadInstalledPlugins()` 改为公开），用于在服务就绪之后显式调用。
- 修改 `packages/main/src/index.ts` 启动流程：
  - 保留当前 ApiServer 构建、注入 PluginManager 引用。
  - 调用 `await apiServer.start()` 完成服务启动。
  - 服务启动后，调用 `pluginManager.bootstrapInstalledPlugins()` 进行插件目录扫描与加载。
  - 然后启用标记为 `enabled=true` 的插件：
    - 遍历 `pluginManager.getInstalledPlugins().filter(p => p.enabled)` 执行 `await pluginManager.enablePlugin(p.id)`
    - 针对 obs-assistant，若 `enabled=false` 但 `plugins.obs-assistant.config.autoStartObs===true`，也执行 `await pluginManager.enablePlugin('obs-assistant')`

## 兼容性与影响
- 由于 ApiServer 已在此时就绪，obs-assistant 的 `init()` 中 `loadInitialConfig()` 访问 `/api/plugins/obs-assistant/config` 能稳定成功。
- /plugins 静态托管在服务启动后立即设置，插件目录加载紧随其后；若首个静态请求发生在加载之前，风险较低，随后即可正常。
- IPC 处理器初始化在 server.start 之后进行，不依赖插件已加载；后续启用插件进程不影响 IPC 注册。

## 验证
- 启动日志顺序变更：
  1) ApiServer running（HTTP/WebSocket就绪）
  2) Plugins loaded（新日志）
  3) process.started / Plugin enabled successfully（obs-assistant）
  4) obs-assistant init 日志 + autoStartObs 启动 OBS（仅启动，不连接）

## 额外日志与诊断
- 在 server ready 后的加载与启用步骤增加信息日志（如“Server ready → loading plugins”、“Server ready → enabling obs-assistant”）以便你确认时序。

请确认，随后我将按以上方案修改 PluginManager 与 index.ts，并提交变更。