## 目标

* 以 `pluginExample` 的 Happy-DOM + Worker 架构为参考，重构当前插件系统的加载与库管理流程。

* 引入通用的“库白名单 + require”机制，移除针对单库的静态/特例注入，确保可控与安全。

* 保持现有 UI/Window/Overlay 静态托管与 SSE 通道不变，统一进程侧执行与消息协议。

## 关键改动

* 插件 Worker：用通用模块执行与库提取替换现有 `eval` 注入与特例分支。

  * 新增 `runModuleInWindow` 与 `extractLibExports`，在 Happy‑DOM 窗口域执行模块，精准获取导出（兼容 CJS/IIFE/默认导出）。

  * 依据 `manifest.libs` 构建 `libRegistry`，并提供受控 `window.require`（仅白名单可用）。

  * 以 `Function` 工厂在窗口域执行入口 `main`，向插件传入 `require`，统一方法查找（`windowRef[method]` 或 `module.exports[method]`）。

  * 移除对 `obs-websocket-js` 的静态/特例桥接逻辑。

* 清单校验：沿用当前校验逻辑，确保 `main` 或 `ui/window/overlay` 至少一个存在，并验证 `libs` 文件存在与类型。

* 仍保留：进程内日志转发、内存监控、SSE 频道与消息签名/加密通道。

## 影响范围与文件

* `packages/main/src/plugins/worker/plugin-worker.js`：重写库加载段与入口执行段（参考 `pluginExample/plugin-worker.js` 的实现）。

* `packages/main/src/plugins/PluginManager.ts`：保留现有 `libs` 校验与合并；无需结构性改动，重点是确保与新 Worker 协同。

  * 清单结构已支持 `libs/ui/overlay/window/wujie`（验证函数位于 `packages/main/src/plugins/PluginManager.ts:1183`）。

* UI/Window/Overlay 静态托管与 SSE：保持既有实现（见 `packages/main/src/server/ApiServer.ts` 与 `OverlayManager`），无需调整；现有插件 UI 页面仍可正常托管。

## 具体实现步骤

1. Worker 初始化与环境注入

* 在 `Happy‑DOM` 创建后绑定：`window/document/navigator/console/path/http/https/child_process/ws` 等必要桥接；注入 `pluginApi.emit` 事件桥。

* 移除“为了兼容旧版本”的任何静态注入分支，统一走库白名单与 `require`。

1. 通用库提取与白名单注册

* 读取 `manifest.libs` → 逐个 `fs.readFileSync` → 用 `extractLibExports(code, filename, windowRef)` 提取：

  * 先比对 `windowRef` 执行前后键差（优先返回函数或非空对象）。

  * 若未命中，则在沙箱快照差异中优先识别常见导出（如 `timeago`）。

* 将提取到的导出对象注册到 `libRegistry`（支持键：原始文件名、`./文件名`、去扩展名基名）。

* 定义 `pluginRequire(id)`：仅返回 `libRegistry` 命中项；否则抛错“未被允许（不在 manifest.libs 中）”。

* 将 `window.require = pluginRequire`。

1. 入口脚本执行与生命周期钩子

* 解析 `manifest.main` 与测试模式 `test`（允许从 `buildResources/plugins/<id>` 读取内置入口）。

* 通过 `runModuleInWindow({ code, filename, windowRef, requireFn })` 执行入口脚本。

* 兼容 `afterLoaded/afterloaded` 钩子调用；方法执行时优先从 `windowRef`，备选 `module.exports`（现有行为保留）。

1. 插件示例与内置插件对齐

* 将内置 `obs-assistant` 改为使用 `window.require('obs-websocket-js')` 获取库实例，移除对全局 `OBSWebSocket` 的依赖。

* 其 `manifest.json` 已包含 `libs:['./obs-websocket-js.js']`，与新的 require 机制一致；其它示例（overlay/window）无需改动入口逻辑。

1. 安全与性能

* 禁止库内部再 `require`（仅入口可用），防止逃逸；保留消息签名/HMAC 与可选 AES‑256‑CBC 加密（`SecureCommunicationChannel`）。

* 保留内存监控与忙碌退避；日志转发维持不变。

## 测试与验收流程（遵守项目规则）

* 编码前：并行生成 Electron UI 测试用例，覆盖：

  * 插件进程启动与 `afterloaded` 钩子；

  * `window.require('obs-websocket-js')/lodash/timeago` 生效；

  * 插件页向 `/api/plugins/:id/overlay/messages` 发送消息并在 SSE `/sse/plugins/:id/overlay` 收到；

  * `ProcessManager.executeInPlugin('getStatus')` 正常返回。

* 编码后：

  * 反思检查实现度（reflection‑checker），若不符 → 回到测试用例完善；

  * 运行自动修复与构建（bug‑fixer）；

  * 执行 Electron 自动化测试（electron‑tester）；

  * 测试失败 → 返回修复迭代，直至通过。

## 回退策略与兼容声明

* 根据用户规则，严禁保留旧版兼容回退；本次重构将彻底移除对库的静态注入特例。

* 内置插件会同步迁移到 `window.require` 用法；第三方插件需按新机制更新其入口与 `manifest.libs`。

## 交付物

* 重写后的 `plugin-worker.js`（通用库捕获/require/入口执行）。

* 更新 `obs-assistant/index.js` 用 `window.require` 拉取 `obs-websocket-js`。

* 文档补充：在现有 `docs/plugin-development.md` 中追加“库白名单 + require 用法示例”。

* 完整自动化测试用例与构建验证。

