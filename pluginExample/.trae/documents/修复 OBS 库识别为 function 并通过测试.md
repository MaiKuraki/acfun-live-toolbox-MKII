## 问题定位
- 现象：终端输出显示 `obs lib fail`，而 CJS/ES 命名/默认库均正常。
- 线索：Worker 日志先显示 `export type function`（已识别到 `OBSWebSocket` 为函数），但随后 `lib loaded` 的类型为 `object` 且键为空，说明最终写入 `libRegistry` 的导出被回退/覆盖成了空对象。
- 可能原因：
  1) `extractLibExports()` 内部路径顺序导致后续分支覆盖了前面识别到的函数；或多次 `eval` 返回不一致。
  2) CommonJS执行返回默认空对象 `{}` 被采纳。
  3) 名称匹配与后续前后键差异扫描之间存在竞争，最终结果非函数。

## 修复方案
1. 调整提取优先级与单次执行
- 顺序：ES export 转换 → 全局 IIFE 名称匹配/新增键扫描 → CommonJS 执行。
- 每种路径只执行一次源码，避免重复 `eval` 引发状态覆盖；将 `eval` 结果立即返回并终止后续分支。

2. 严格结果筛选
- 若得到 `{}` 或 `null/undefined`，统一视为无效，不写入 `libRegistry`。
- 当全局键扫描出现多个新增键时：优先使用名称匹配结果；否则选择首个对象/函数值。

3. 结果规范化
- 若返回为对象且存在单一函数属性或 `default` 为函数，则返回那个函数。
- 针对 `OBSWebSocket` 的 IIFE：命名匹配优先，直接返回该函数，不做额外包装。

4. 验证
- 运行 `node index.js`，期望输出：
  - `obs lib ok`
  - `cjsLib: cjs-ok`
  - `esNamedLib: es-named-ok`
  - `esDefaultLib: es-default-ok`

## 代码改动点
- `d:\develop\plugin-example\plugin-worker.js`
  - 重构 `extractLibExports()`：
    - 先处理 ES export 转换（单次 `eval` + 读取 `window.__libExport__`）。
    - 再处理全局 IIFE（名称匹配 + 单次 `eval` + 读取变量；若无匹配则前后键差异扫描）。
    - 最后处理 CommonJS（`runModuleInWindow`），仅在返回非空对象或函数时采纳。
  - 加入结果规范化：对象只含 `default` 函数则返回该函数；空对象拒绝；函数直接返回。

5. 风险控制
- 不引入任何对特定库名的硬编码；仅基于通用形态识别。
- 不改变 `manifest.json` 与插件入口 `test.js` 的调用方式。