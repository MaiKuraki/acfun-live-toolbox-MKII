## 问题与目标
- 问题：示例 Overlay 所在的窗口页触发的 `show toast/alert/confirm` 未能在原主窗口唤起全局弹框。
- 目标：统一改为通过 Wujie 的 `eventBus` 发送到外部 Frame（渲染层），由外部 Frame 经由主进程转发到主窗口，主窗口执行全局弹框；与第一个样例插件发送消息的原理一致。

## 现状核实
- 窗口页（示例）已通过 Wujie 事件总线发起桥接：`buildResources/plugins/sample-overlay-window/window.html:25-40` 使用 `bus.$emit('bridge-request', { command: 'renderer-popup', payload })`。
- 渲染层（窗口容器页）已经将 `renderer-popup` 转到预加载 Popup API：`packages/renderer/src/pages/WindowFramePluginPage.vue:118-133` 调用 `window.electronApi.popup.toast/alert/confirm`。
- 预加载层暴露 Popup API 到渲染层：`packages/preload/src/index.ts:105-110`。
- 主进程接收 Popup IPC 并转发到主窗口：`packages/main/src/ipc/ipcHandlers.ts:1120-1186`，向主窗口发送 `renderer-global-popup`，并维护 `confirm` 的 `pendingConfirms`。
- 主窗口渲染进程监听 `renderer-global-popup` 并实际展示：`packages/renderer/src/main.ts:21-36`（主窗口路由下生效）。
- 外部 Frame（插件 UI 容器页）当前对 `renderer-popup` 是直接调用 `GlobalPopup.*` 而非走主进程：`packages/renderer/src/pages/PluginFramePage.vue:373-389`。

## 变更方案
- 将外部 Frame 对 `renderer-popup` 的处理从“直接调用 `GlobalPopup.*`”改为“通过预加载 Popup API → 主进程 → 主窗口全局弹框”。
  - 修改位置：`packages/renderer/src/pages/PluginFramePage.vue:373-389`。
  - 行为：
    - `toast` → `await window.electronApi.popup.toast(message, opts);`
    - `alert` → `await window.electronApi.popup.alert(title, message, opts);`
    - `confirm` → `const res = await window.electronApi.popup.confirm(title || '确认', message, opts);`
    - 保持 `bridge-response` 回传格式不变（`{ shown/opened/result }`）。
  - 清理：移除 `GlobalPopup` 的导入与使用（遵循“严禁保留回退代码”的要求）。
- 保持窗口容器页（WindowFramePluginPage）现有桥接逻辑不变：它已按目标路径转发（引用：`packages/renderer/src/pages/WindowFramePluginPage.vue:118-133`）。
- 保持示例窗口页的事件发起不变：它已用 `bus.$emit('bridge-request', ...)`（引用：`buildResources/plugins/sample-overlay-window/window.html:25-40`）。

## 验证步骤
- 静态核查与类型检查：
  - 快速走查修改后的 `PluginFramePage.vue`，确认不再引用 `GlobalPopup`；`opts` 保留 `durationMs/contextId` 字段。
  - 执行类型检查（仅静态检查，不启动渲染服务器、不写测试）。
- 手动场景验证（开发者操作说明）：
  - 打开示例 Overlay 的窗口页，点击三种按钮：观察主窗口出现对应的 Toast/Alert/Confirm。
  - 在插件 UI 容器页内，通过 `bridge-request: renderer-popup` 测试同样弹框路径；确认主窗口展示，而不是局部展示。
  - 验证 `confirm` 能在 30 秒内正确返回结果（对应 `ipcHandlers.ts:1156-1168`）。

## 风险与注意
- 主窗口监听条件：`packages/renderer/src/main.ts:21-36` 使用 `if (!hash.includes('/plugins/') || !hash.includes('/window'))`，确保主窗口页面路由下仍会监听 `renderer-global-popup`（示例 UI 页包含 `/plugins/` 但不包含 `/window`，条件成立）。
- 不引入任何 mock；不触碰 `acfunlive-http-api`；不改动已有 IPC 通道名。
- 清理冗余：删除 `PluginFramePage.vue` 中 `GlobalPopup` 引入与调用，避免双路径导致不一致。

## 交付项
- 代码改动仅限：`packages/renderer/src/pages/PluginFramePage.vue`（替换 `renderer-popup` 分支实现 + 删除未用 import）。
- 不创建新文件；不变更其他模块；遵循现有代码风格与约定。
- 更新完成后在变更记录中勾选此项并简要备注（待执行阶段）。