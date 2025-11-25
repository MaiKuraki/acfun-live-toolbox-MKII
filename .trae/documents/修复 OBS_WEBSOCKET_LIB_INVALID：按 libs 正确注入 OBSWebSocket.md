## 问题
当前 `injectScript` 在将脚本追加到 DOM 后，Happy DOM 会尝试立即执行 `<script>` 的内容；随后我们又用 `runCjs` 手动执行同一段代码，导致同一脚本被执行两次，且第一次会因缺少 `require/module/exports` 报错（被 catch 掩盖）。

## 修复
- 在 `injectScript` 中为 `<script>` 设置一个浏览器不识别的 `type`，例如 `application/x-cjs`，使其不会被 Happy DOM 当作可执行脚本运行；保留插入 DOM 的行为以便调试或依赖结构。
- 继续使用现有 `runCjs` 执行一次，确保仅在模拟的 CommonJS 环境中运行。

## 变更点
- 文件：`packages/main/src/plugins/worker/plugin-worker.js`
- 函数：`injectScript`
- 修改：在创建的 `<script>` 上添加 `type` 属性为非标准值，并保持其余逻辑不变。

## 验证
- 再次加载插件时不应出现第一次执行导致的 `ReferenceError`；日志只记录一次执行。
- 该修复仅解决“双次执行”隐患，不影响后续对 `OBSWebSocket` 注入问题的排查与修复。