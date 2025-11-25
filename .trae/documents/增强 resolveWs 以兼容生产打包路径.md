## 范围与现状
- 现已在主进程完成 vm2 集成：
  - 传递沙箱配置到工作线程：`packages/main/src/plugins/WorkerPoolManager.ts:87, 106-117`
  - 构造沙箱配置并传递：`packages/main/src/plugins/ProcessManager.ts:99-105, 138-161`
  - 工作线程使用 `vm2.NodeVM` 加载入口：`packages/main/src/plugins/worker/plugin-worker.js:16, 35-76`
- 插件目录：`buildResources/plugins`（如 `obs-assistant`、`sample-overlay-window`、`sample-overlay-ui`）
  - `sample-*` 多为静态托管，无进程主入口；无需切换，仅保留静态资源
  - 目标：所有包含 `manifest.main` 的插件统一按 NodeVM 执行，不允许插件自建 VM 或自行注入依赖

## 统一沙箱模型
- 加载入口：主进程按现有规则选择入口
  - 开发模式且 `manifest.test: true` → `process.cwd()/buildResources/plugins/<id>/<main>`（`packages/main/src/ipc/ipcHandlers.ts:904-913`）
  - 常规启用 → `appData/plugins/<id>/<main>`（`packages/main/src/plugins/PluginManager.ts:998-1017`）
- NodeVM 配置统一：由 `buildSandboxConfig(pluginId)` 构造（`ProcessManager.ts:138-161`）
  - `console: 'redirect'` 重定向到主进程日志
  - `require.external: true`，`require.root` 覆盖开发与生产；`require.mock` 注入关键模块（如 `ws`）
  - 最小权限白名单：`builtin: ['path','fs','child_process','crypto','os','events']`（后续可按插件需求扩展）

## 插件端迁移规则
- 删除所有插件内部 VM 注入与依赖解析逻辑（例如 `vm.runInContext`、内置全局包拼接注入）
- 直接在插件入口使用标准 Node 导入：
  - ESM：`import x from 'pkg'` / `import('pkg')`
  - CJS：`const x = require('pkg')`
- 如果插件需要浏览器全局版库（类似 `obs-websocket-js.js`），改为依赖 npm 包，由 NodeVM 的 `require` 解析与 `mock` 解决路径差异
- 保持插件导出的 API 不变（`init/onConfigUpdated/applyObsSettings/cleanup/...`）

## 具体实施步骤
1. 代码走查 `buildResources/plugins/*`，标记含 `manifest.main` 的插件并识别自建 VM 逻辑
2. 按迁移规则重写这些插件入口：移除 VM 相关代码，改用标准导入
3. 保留静态托管插件（`ui/overlay/window`）原样，无需进程变更
4. 验证（静态）：
  - 类型检查：`pnpm -C packages/main typecheck`
  - 手动验证流程说明：启用插件、执行方法、观察日志与重启/热重载事件

## 交付内容
- 对所有含主入口插件完成迁移，并更新为 NodeVM 兼容的入口导入
- 保持现有 `PluginManager/ProcessManager/IPC` 行为不变
- 清理冗余与旧版兼容分支，遵守“严禁保留回退代码”规则

## 安全与生产
- 使用主进程统一沙箱，限定内置模块与依赖根；生产环境通过 `require.root` 与 `require.mock` 保证解析一致；日志与重试机制保持一致