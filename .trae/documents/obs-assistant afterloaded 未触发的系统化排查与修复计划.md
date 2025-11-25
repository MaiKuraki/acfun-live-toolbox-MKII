## 现状确认
- afterloaded 已在插件内定义与导出：buildResources/plugins/obs-assistant/index.js:275；导出项包含 afterloaded：buildResources/plugins/obs-assistant/index.js:355-367。
- 主进程进程启动后已统一可选调用 afterloaded 并发布 SSE：packages/main/src/plugins/PluginManager.ts:182-194。
- 之前日志出现“方法未找到”源于插件未定义阶段；当前代码已定义，下一步以日志与调试增强验证调用链。

## 步骤一：代码层面检查
- 确认导出正确：检查 module.exports 是否包含 afterloaded（已包含）。
- 触发机制核对：主进程仅在 process.started 后调用 afterloaded（已符合架构要求）。
- DOM/框架钩子：obs-assistant 不依赖 DOM 生命周期，仅通过主进程触发与自身定时循环，保持现状。
- 调用栈异常阻断：在 afterloaded 内为关键调用（loadInitialConfig、ensureObsRunning、openPluginOverlaySse、scheduleNext）加入口标记与错误输出，确保异常可见。

## 步骤二：调试与日志增强
- 在 afterloaded 入口添加执行标记：console.log("afterloaded init")。
- 细化异常输出：用 try-catch 包裹 afterloaded 主体，打印错误堆栈（err.stack || String(err)），同时返回 { ok:false, error } 保持主进程错误路径一致。
- 性能监测：引入 perf_hooks（PerformanceObserver、performance），在入口/出口做 mark+measure（如 "obs_afterloaded_start"、"obs_afterloaded_end"），并在 measure 输出耗时；可额外通过 queueMicrotask/setImmediate 观察任务队列入列情况（在日志中输出队列入列完成标记）。

## 步骤三：终端反馈处理
- 启动应用：使用 `pnpm start`；打开系统日志与插件日志视图。
- 观察日志：
  - Worker 侧应出现 "afterloaded init" 与耗时输出；
  - 主进程侧应出现 `plugin-after-loaded` SSE 发布日志与 overlay SSE 连接成功日志。
- 如果未触发：
  - 检查 PluginManager 是否成功 startPluginProcess（packages/main/src/plugins/PluginManager.ts:951-999）；
  - 检查 `plugins.obs-assistant.config.autoStartObs` 与 `obsPath` 持久化配置打印（packages/main/src/index.ts:189-197）是否符合预期；
  - 复核 executeInPlugin 的可选降噪路径（packages/main/src/plugins/ProcessManager.ts:231-247，264-271）。
- 版本标记：每次修改完成并验证后添加注释 tag（例如 `git tag -a obs-assistant-afterloaded-v1 -m "afterloaded 调试增强"`），便于回溯。

## 步骤四：验证标准
- 在测试环境与终端日志中捕获：
  - afterloaded 入口标记与性能测量输出；
  - 完整执行，无异常堆栈输出（或异常时能清晰打印）；
  - 主进程通道 `plugin:obs-assistant:overlay` 发布 `plugin-after-loaded` 事件记录；
  - obs-assistant 定时循环 tick 与连接状态日志（"loop tick"、"connectObs success"）。

## 执行细节（代码改动点）
- buildResources/plugins/obs-assistant/index.js：
  - 在 275 行 afterloaded 入口加 `console.log('afterloaded init')` 与 `performance.mark`；
  - 引入 `const { PerformanceObserver, performance } = require('perf_hooks')` 并在出口 `performance.measure` + 输出耗时；
  - 加强 try-catch：打印 `e.stack || String(e)`。
- packages/main/src/plugins/PluginManager.ts：维持现有 process.started → afterloaded 可选触发与 SSE 发布逻辑（182-194），仅做日志核对。

## 项目流程集成
- 按项目规则：
  1) 使用电子测试用例编写器生成验证用例（afterloaded 触发、SSE 发布、overlay 连接状态）。
  2) 运行实现度反射检查；不满足则回到 1 调整。
  3) 运行自动修复并构建。
  4) 执行 Electron 自动化测试。
  5) 不通过则回到 3；通过则结束。

## 运行与观测
- 运行：`pnpm start`；必要时设置 `ACFRAME_DEBUG_LOGS=1` 以增强服务器端路由/事件日志。
- 观测：
  - 主进程："Server ready → loading plugins"、持久化配置快照、`plugin-after-loaded` 发布；
  - Worker："[obs-assistant] module loaded" → "afterloaded init" → 性能耗时 → 循环 tick/连接成功日志。

请确认以上计划，确认后我将按步骤实施修改、运行与验证，并根据日志结果迭代优化直至完整证据链达成。