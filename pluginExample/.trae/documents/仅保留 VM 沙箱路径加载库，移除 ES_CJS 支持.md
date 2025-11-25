## 目标
- 移除对 ES export 转换与 CommonJS 执行的所有补充路径，仅通过 VM 沙箱执行 IIFE/UMD 并镜像导出来加载库。

## 修改点
- `plugin-worker.js` 的 `extractLibExports`：
  - 删除 `module.exports/exports.*` 重写分支与 `runModuleInWindow` 的 CJS 回退。
  - 删除 ES `export` 转换分支。
  - 保留并强化 `runIIFELibWithVM()`：一次执行，比较 `windowRef` 与沙箱新增键，优先返回函数或非空对象（包含对 `_`/`timeago` 等常见键优先）。
  - 返回值仅来源于 VM 路径，若无导出则返回 `undefined`。
- libs 加载循环：
  - 仅在导出有效（函数/非空对象）时登记到 `libRegistry`，否则记录错误但不抛异常（避免影响其他库加载）。

## 影响
- 已加入的 CJS/ES 示例库将不再可用，这是预期行为；UMD/IIFE 库（如 `obs-websocket-js.js`、`lodash.js`、`timeago.min.js`）继续正常。

## 验证
- 运行后期望：
  - `obs lib ok`
  - `lodash`、`timeago` 输出对象/函数信息
  - 对 CJS/ES 示例库的调用将提示缺失/错误，但不影响整体执行。