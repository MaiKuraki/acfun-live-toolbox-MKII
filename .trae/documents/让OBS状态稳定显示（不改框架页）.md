## 问题分析
- “OBS 连接状态：未知”来自 UI 请求 `process.execute('getStatus')` 未拿到响应（插件工作线程忙）。
- 日志显示 `Worker ... status: busy`，说明在插件进程刚启动或初始化阶段立即调用导致拒绝执行。
- 未配置 `obsPath` 只影响“自动启动 OBS”，不影响 `getStatus()`：该方法通过 `tasklist` 检测 `obs64.exe/obs.exe`，无需路径。

## 调整方案（不改 PluginFramePage）
1. 在 `obs-assistant/ui.html` 增加通用请求重试工具：
   - `requestWithRetry(command, payload, { retries: 5, delayMs: 400 })`
   - 用 Wujie bus 发送 `bridge-request`；收到 `bridge-response` 成功则渲染；失败且消息包含 `busy` 时按退避重试。
   - 最终失败则显示“未连接（未运行或插件忙）”。
2. UI 刷新策略：
   - 在 `ui-ready`、`plugin-init`、`lifecycle ready/config-updated` 事件触发时调用 `requestWithRetry('process.execute', { method: 'getStatus' })`。
   - 可选：每隔 5 秒自动刷新一次（用户若需要实时显示）。

## 可选增强（主进程，不改框架页）：
- 将 `plugin.process.execute` 的初始等待从 200ms 调整为 500ms，并将重试次数从 5 提高到 8，以降低“busy”返回概率。
- 该改动在 `ipcHandlers.ts` 中，接口保持不变。

## 验证
- 打开 obs-assistant UI，首次显示不再长期停留在“未知”；在插件初始化短暂忙碌时，重试后应显示“已连接/未连接（运行中/未运行）”。

## 影响范围
- 仅修改 obs-assistant 的 `ui.html`（新增重试工具与状态文案）；不改 `PluginFramePage`。主进程的可选增强若执行也不会影响现有 API。