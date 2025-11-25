## 问题原因
- 插件进程运行在 vm2 NodeVM 沙箱内，允许的 Node 内置模块白名单不包含 `http/https`（packages/main/src/plugins/ProcessManager.ts:151）。
- 我们在 obs-assistant/index.js 中使用了 `require('http')` 执行 SSE 与 JSON 请求，因此在 Worker 侧报错 “Cannot find module 'http'”。

## 解决方案
1) 扩展沙箱白名单
- 在 `packages/main/src/plugins/ProcessManager.ts:151` 的 `buildSandboxConfig()` 将 `http`、`https` 加入 `require.builtin` 白名单，使插件可安全使用 Node 内置 HTTP。
- 白名单调整：`['path','fs','child_process','crypto','os','events'] → ['path','fs','child_process','crypto','os','events','http','https']`。

2) 保持插件端实现不变
- 现有 obs-assistant/index.js 内的 SSE 订阅、JSON GET、自动推流逻辑无需改动（已实现断线重连与安全日志），待白名单更新后即可工作。
- 弹窗调用保持“可用则调用、不可用则降级为日志”的策略，不影响主要功能。

3) 验证
- 启动插件，观察不再出现 `Cannot find module 'http'`。
- 进入“创建直播”页，确认：收到只读快照中的 `stream.rtmpUrl/streamKey` → 主窗 Toast（若 IPC 可用）→ 设置 OBS 推流服务 → 调用 `StartStream`。
- 断连后自动重试，指数退避按现有逻辑执行。

## 影响范围与风险
- 仅调整 Worker 沙箱允许的内置模块；不改变外部 API 与 UI。
- vm2 NodeVM 原生支持内置模块白名单，此改动符合沙箱控制模型。

若批准，将立即更新白名单，完成验证。