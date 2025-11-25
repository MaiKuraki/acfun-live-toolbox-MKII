## 目标
- 将插件（包括 obs-assistant）的加载与进程启动改为在主进程 HTTP 服务成功启动之后执行，避免插件在 init 阶段访问 /api 时因服务未就绪而失败。

## 启动时序调整
- 文件：`packages/main/src/index.ts`
  - 现状：通常先初始化 PluginManager 并加载插件，再启动 ApiServer。
  - 改造：
    1) 构造 ApiServer 并执行 `await apiServer.start()`；仅在 start() resolve 后继续下一步
    2) 将 `ACFRAME_API_PORT` 等环境变量设置为 ApiServer 已运行的端口（如有必要继承到插件 worker 的 env）
    3) 初始化并加载插件：`pluginManager.loadPlugins()`，然后按已启用清单启动工作进程（ProcessManager.startPluginProcess）

## 插件环境与配置传递
- 确保在启动 worker 时附带 `process.env.ACFRAME_API_PORT`（当前 obs-assistant 通过该 env 访问 API），来源于 ApiServer 配置
- 插件加载时（init）不再需要配置加载重试，因 HTTP 已就绪；保留现逻辑即可（`loadInitialConfig()`）

## 防护：服务就绪事件
- 可选增强：在 ApiServer.start() 成功后向内部总线发布 `server-ready` 事件，PluginManager 订阅该事件以触发插件启动；若启动顺序已调整，此增强可留作诊断用途

## 影响面
- 启动时序变更仅影响主进程入口与插件加载顺序；插件代码不需要改动（obs-assistant 已依赖 `/api/plugins/obs-assistant/config` 与 `ACFRAME_API_PORT`）
- 其他插件同样受益于服务先行就绪，避免早期 HTTP/WS 未连接的异常

## 验证
- 启动应用：确认 ApiServer 日志显示运行端口后再加载插件日志（`process.started` / 插件 `init`）
- obs-assistant 在 init 阶段读取配置并按 `autoStartObs` 尝试启动 OBS，不再出现接口未就绪导致的空配置问题

## 回滚策略
- 如出现需要插件先启动的特殊插件（依赖文件而非 HTTP），可在 PluginManager 中支持 per-plugin 标记（`requiresServerReady: false`）以提前启动；默认按就绪后再启动