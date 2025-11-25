## 可行性结论
- 可行：在 Node 的 `vm` 沙箱中执行 IIFE/UMD 库，并将其产生的“全局导出”镜像到 `happy-dom` 的 `window`，可稳定拿到如 `timeago`、`_`、`OBSWebSocket` 等变量。
- 优势：避免复杂的源码解析；隔离库的执行环境；更易统一处理不同的 IIFE/UMD 变体。

## 实施方案
1. 新增执行器 `runIIFELibWithVM(code, filename, windowRef)`：
- 构造沙箱（不暴露 Node 能力）：
  - `window/self/global/globalThis: windowRef`
  - `document: windowRef.document`
  - `console: console`
  - `setTimeout/clearTimeout: windowRef` 中的实现
  - `module/exports: undefined`（避免走 CommonJS 分支）
- 在执行前快照 `windowRef` 的键集合。
- 使用 `vm.runInNewContext(code, sandbox, { filename, displayErrors: true })` 执行一次。
- 执行后对比 `windowRef` 新增键，选择对象/函数类型的值作为导出；若没有新增键，则回退检查 `sandbox` 自身键变化并选取对象/函数类型。
- 将选中的导出返回；并在库注册阶段生成三种 require 键：原始文件名、带 `./` 前缀、去后缀的基名（例如 `timeago.min`）。

2. 加载流程调整（libs 循环）：
- 识别顺序：
  - 若包含 `export` 关键字 → 走 ES 导出转换路径（现有实现）。
  - 否则优先尝试 VM 执行 IIFE/UMD 路径（上述 `runIIFELibWithVM`）。
  - 若仍无导出 → 回退尝试 CommonJS 执行（仅接受函数或非空对象）。
- 统一只在“有有效导出（函数/非空对象）”时登记到 `libRegistry`，否则记录错误日志。

3. 安全与兼容
- 沙箱不提供 `require/process/Buffer`，避免库越权访问 Node。
- IIFE 常见“根对象”判断：`window/global/globalThis/this`；沙箱映射确保赋值落到 `windowRef`。
- 不使用任何库名硬编码；`timeago.min.js` 会在执行后自动在窗口挂 `timeago` 或函数对象，随后登记为 `require('timeago.min')` 可用。

4. 验证用例
- `timeago.min.js`：期望 `lib loaded` 显示 `t: 'function'|'object'`，`k` 为其导出方法；在插件入口 `require('timeago.min')` 正常返回。
- 其他 IIFE/UMD 库（如 `_`）：同样通过 VM 路径识别并返回。

5. 交付与变更范围
- 仅修改 `plugin-worker.js` 的库加载器部分，新增 `runIIFELibWithVM` 并更新分支顺序；不改动清单或插件入口接口。