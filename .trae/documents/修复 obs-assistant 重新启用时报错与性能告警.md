## 问题诊断
- 复现日志显示，首次启用成功后，第二次启用时主进程调用 `getStatus` 失败，报错 “Method getStatus not found on plugin”。
- 插件 Worker 加载流程优先使用动态 `import`（记录为 `mode: 'esm'`），失败再回退至 `require` 或沙箱执行；最终以 `plugin = mod.default ?? mod` 作为导出对象。参见 `packages/main/src/plugins/worker/plugin-worker.js:34-86` 与方法分发校验 `packages/main/src/plugins/worker/plugin-worker.js:152-154`。
- obs-assistant 的开发版主入口确实导出了 `getStatus`（`buildResources/plugins/obs-assistant/index.js:182-195`，并在 `module.exports` 中暴露，`buildResources/plugins/obs-assistant/index.js:336-344`）。
- 实际运行时加载的是用户数据目录拷贝版本：`C:\Users\<user>\AppData\Roaming\ACLiveFrame\plugins\obs-assistant\index.js`（日志中的 pluginPath）。这说明在打包环境中走了“安装目录版本”而非开发资源目录。
- IPC 层在执行前若未启动进程，会根据 `NODE_ENV`、`app.isPackaged` 与 `manifest.test` 决定是否“优先开发资源目录”。在打包环境中，即便 `manifest.test: true`，也不会优先开发资源目录，见 `packages/main/src/ipc/ipcHandlers.ts:643-651`。
- 结合以上两个点，较大概率是“用户数据目录内的 obs-assistant 版本陈旧或缺少 `getStatus` 导出”，导致二次启用时 UI 轮询状态的调用失败。
- 性能告警（CPU 100%）可能来自插件内部定时轮询与多次进程检测链（`tasklist/wmic/powershell`）在短间隔内重复触发：初始 `scheduleNext(500)`、连接失败指数退避等，见 `buildResources/plugins/obs-assistant/index.js:261-297, 299-307` 与 `60-115, 269-297`。

## 修复方案
1) 统一插件来源与版本修复
- 在打包/生产环境中，优先确保用户数据目录内的 obs-assistant 与开发资源目录版本一致，并且主入口包含必需导出：`init/cleanup/getStatus`。
- 启用前做轻量校验：若发现安装目录版本缺少必需方法或版本低于捆绑版本，则自动用捆绑版本覆盖安装目录（不保留兼容/回退代码，直接替换）。
- 替换逻辑可沿用现有 “缺失主入口修复” 模式（`packages/main/src/plugins/PluginManager.ts:997-1015`）扩展为“主入口内容校验与版本对比复制”。

2) IPC 层路径选择一致化
- 将 `packages/main/src/ipc/ipcHandlers.ts` 中的路径选择调整为：如果 `manifest.test === true` 则始终优先使用捆绑资源目录（不再受 `isDev/app.isPackaged` 影响），以避免生产环境下加载到旧安装版本。
- 代码位置：`packages/main/src/ipc/ipcHandlers.ts:643-651`。

3) Worker 端可观测性增强（不引入旧版兼容逻辑）
- 当出现 “Method X not found on plugin” 时，额外记录 `Object.keys(plugin)` 与 `typeof plugin`，便于定位是“导出对象不符”还是“加载到错误文件”。仅日志增强，不添加任何回退执行路径。
- 代码位置：`packages/main/src/plugins/worker/plugin-worker.js:152-154`。

4) 插件内部性能优化（减少高占用告警）
- 将初始轮询间隔从 500ms 提高到 2000ms，并限制 `isObsRunning` 检测链为一次快速路径（优先 `tasklist`，失败后延迟再尝试其他方法），避免在短期内连番 `exec` 调用。
- 成功连接后维持 3s-10s 的轮询节奏（已有退避），并在 `ConnectionClosed` 回调中延时再重连，避免紧密重试。
- 代码位置：`buildResources/plugins/obs-assistant/index.js:261-297, 299-307` 及 `60-115` 检测链。

## 具体改动点
- `packages/main/src/ipc/ipcHandlers.ts`：
  - 修改 `preferBundled` 的判定为：`const preferBundled = !!bundledRoot && (info.manifest as any)?.test === true;`。
  - 保持其余逻辑不变。
- `packages/main/src/plugins/PluginManager.ts`：
  - 在 `enablePlugin()` 启动前，读取捆绑 manifest 与安装目录 manifest，对比版本；若安装目录版本落后或主入口校验不通过，拷贝捆绑版覆盖安装目录。
  - 主入口校验：启动前快速解析文件并检查导出名称集合（允许 CJS/ESM，校验存在 `init/cleanup/getStatus`）。
- `packages/main/src/plugins/worker/plugin-worker.js`：
  - 在方法缺失错误分支增加键名与 `typeof plugin` 日志。
- `buildResources/plugins/obs-assistant/index.js`：
  - 提升初始轮询间隔与进程检测策略，减少 CPU 峰值。

## 验证方案
- 在打包环境下，清空用户数据插件目录后重新启用 obs-assistant，确认：
  - 首次启用成功，`init` 执行完成；随后调用 `getStatus` 返回包含连接、运行状态与错误信息摘要（由 `ipcHandlers.ts:704-711` 打印 summary）。
  - 不再出现 “Method getStatus not found on plugin”。
  - 性能监控不再触发 100% CPU 的警告；如仍有告警，打印的 metrics 中 `cpuUsage.percent` 明显降低。
- 在开发环境下，确认始终使用捆绑版路径加载，避免与安装目录版本不一致导致的问题。

## 影响面与风险控制
- 路径选择与版本修复仅影响 obs-assistant 或标记为 `test: true` 的插件；其他插件行为不变。
- Worker 端仅增强日志，不改变执行流。
- obs-assistant 内部节奏调整对功能无负面影响，减少系统资源占用。

## 后续
- 若用户数据目录中仍存在其他旧插件导致类似问题，可复用“主入口校验 + 覆盖安装”的方案。
- 对性能监控计算公式进行稳定性校准（如采样窗口与平滑处理），减少误报。