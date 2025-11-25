## 结论与原因
- 你的 `manifest.json` 已包含 `"lodash.js"`（d:\develop\plugin-example\manifest.json:5）。
- 报错“模块 "lodash" 未被允许（不在 manifest.libs 中）”通常由两类问题触发：
  1) require 的标识与白名单键不匹配（允许键为：`lodash.js`、`./lodash.js`、`lodash`）。
  2) 库已声明但未成功提取导出，导致 `libRegistry` 中该键值为 `undefined`，进而在 `pluginRequire` 查找不到并抛出“未被允许”。
- 结合当前项目：`lodash.js` 是 UMD/IIFE 形式，早期提取算法可能错把 `var undefined` 等顶层变量当作候选名，或未优先选择全局 `_`，导致提取失败。

## 验证与修复步骤
1. 验证 require 标识
- 确认插件代码中使用 `window.require('lodash')` 或 `window.require('lodash.js')`（两者均允许）。
- 若使用 `lodash-es` 或 `lodash/fp`，则需要在 `manifest.libs` 中新增对应文件并加载；当前仅白名单 `lodash.js`。

2. 重启加载
- Worker 首次加载后会缓存 `libRegistry`。修改 `manifest.json` 后请重启宿主进程，使 Worker 重新读取最新白名单与库。

3. 提取算法增强（代码层改动）
- 调整 `extractLibExports`（d:\develop\plugin-example\plugin-worker.js:75）：
  - 优先匹配 IIFE 赋值模式：`var|let|const <Name> = (function`，若命中则以 `<Name>` 为导出名。
  - 对于全局键差异扫描，增加优先选择 `_` 键（仅当文件基名为 `lodash` 时）与函数/对象类型优先；其余键作为后备。
  - 保持 ES export 转换和 CommonJS 执行逻辑，但仅接受“函数或非空对象”，避免空对象覆盖。

4. 日志验证
- 观察加载日志：
  - `[Worker] lib loaded: { libRel: 'lodash.js', basename: 'lodash', t: 'function'|'object' }`
  - 插件入口 `init` 打印：`obs lib ok`（不相关）与自定义测试 `lodash` 可调用结果

## 交付
- 我将按以上方案增强提取算法以稳定识别 `lodash` 的导出，并确保 `window.require('lodash')` 正常返回函数/对象。请确认后我立即执行。