## 目标
- 在 Worker 初始化后，把 Node 核心模块对象注入到 `window`。
- 读取插件 `manifest.json` 的 `libs` 列表，按序以 `<script>` 注入并用 `onload` 维护 `checkList`。
- `checkList` 完成后再注入主入口 `index.js`，设置 `onload` 调用 `window.afterLoaded()`。
- 全流程错误使用 `console.error` 打印。

## 实现要点
- 注入 Node 模块：`windowRef.path = require('path')`、`windowRef.fs = require('fs')`、`windowRef.child_process = require('child_process')`、`windowRef.crypto`、`windowRef.os`、`windowRef.events`、`windowRef.http`、`windowRef.https`。
- `checkList` 结构：`Map<absPath, { loaded: boolean }>`；初始化为 `false`。
- 加载库脚本：为每个 lib 创建 `<script>` 节点并设置 `onload` 更新 `checkList`；由于 Happy DOM 不支持从文件 URL 直接加载，采用同步读取文件内容 `fs.readFileSync(abs, 'utf-8')` → `script.textContent = code` 注入后手动触发 `onload`。
- 完成检测：每次库脚本注入后检测 `checkList` 是否全部 `true`；全通过后进入主入口注入。
- 主入口：读取 `index.js` 内容，创建 `<script>`，设置 `onload` 执行 `try { windowRef.afterLoaded() } catch(e) { console.error(e) }`，将脚本插入 `document.body`。
- 预钩子：在任何脚本注入前执行 `try { windowRef.beforeLoaded() } catch(e) { console.error(e) }`。
- 可选事件：必要时触发 `windowRef.dispatchEvent(new windowRef.Event('load'))` 以兼容依赖 `load` 的插件。

## 消息路由
- 保持现有路由：优先调用 `windowRef.handleMessage(type, payload)`；否则回退到 `windowRef[method](...args)`。
- 返回值进行安全序列化后回传主线程；异常打印并返回错误对象。

## 错误处理
- 所有步骤包裹 `try/catch`：读取 manifest、注入脚本、触发钩子、消息执行、退出清理。
- 统一打印：`console.error(e && e.message ? e.message : String(e))`。

## 代码改动范围
- 文件：`packages/main/src/plugins/worker/plugin-worker.js`
- 增加：`initNodeBindings()`、`loadLibsWithChecklist()` 两个内部函数；调整 `loadPlugin()` 的调用顺序与脚本注入位置到 `document.body`。
- 删除/替换：不再使用旧的导出对象探测逻辑；严格按全局函数钩子工作。

## 验证与测试
- 生成 Electron UI 测试用例：验证 `beforeLoaded/afterLoaded/handleMessage/cleanup` 的调用与日志输出；验证 `libs` 按序注入与 `checkList` 变更。
- 代码完成后执行自动修复与构建，再运行测试；不通过则迭代修复。