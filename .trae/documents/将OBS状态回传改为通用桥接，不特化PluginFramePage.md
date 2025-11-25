## 目标
- 不在 PluginFramePage 写特化逻辑；抽象为通用桥接命令，让任何插件 UI 都能调用其自身进程方法。

## 方案
- 通用桥接：在现有桥接处理里增加 `process.execute` 命令，统一转发到 `window.electronApi.plugin.process.execute(pluginId, method, args)`，返回结果通过 `bridge-response`。
- 移除特化命令：删掉之前加的 `obs-status` 分支。
- 插件UI改造：obs-assistant 的 `ui.html` 改为请求 `process.execute`，payload `{ method: 'getStatus' }`，不再依赖 PluginFramePage 的特化。
- 插件进程：保留已实现的 `getStatus()`。

## 验证
- 打开 obs-assistant UI 页面，能显示“已连接/未连接（运行中/未运行）”。
- 其它插件如需进程方法调用，直接发起 `process.execute`，无需再改 PluginFramePage。

## 影响
- PluginFramePage 只新增一个通用命令处理；obs-assistant UI 仅改为调用通用命令；不会引入耦合。