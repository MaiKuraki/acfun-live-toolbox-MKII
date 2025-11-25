## 目标
- 在 obs-assistant 插件中，将 OBS 连接状态从进程逻辑回传到 UI 页面，并在 UI 显示“已连接/未连接”。

## 实现方案
- 插件进程（index.js）
  - 新增导出方法 `getStatus()` 返回 `{ connected, connecting, running }`；其中 `running` 由 `isObsRunning()` 判定。
  - 保持现有 `connectObs()` 与状态字段 `state.connected/state.connecting`。

- 渲染桥接（PluginFramePage.vue）
  - 在 `onBridgeRequest` 中新增命令 `obs-status`，通过 `window.electronApi.plugin.process.execute(pluginId, 'getStatus')` 调用插件方法，并把结果以 `bridge-response` 回传到 UI。

- UI 页面（ui.html）
  - 增加状态展示区域：`<div id="obsStatus">OBS 连接状态：未知</div>`。
  - 在 `DOMContentLoaded` 时及收到 `plugin-init`/`lifecycle ready|config-updated` 事件后，发起 `bridge-request('obs-status')`，将返回值渲染为“已连接/未连接（运行中/未运行）”。

## 验证
- 打开插件 UI 页面，看到状态正确显示。
- 触发连接变化（如配置端口或启动 OBS）后，再次刷新/收到生命周期事件能更新状态。

## 影响范围
- 仅修改 obs-assistant 插件目录下的脚本、插件框架页桥接逻辑与该插件的 UI；不会影响其他插件行为。