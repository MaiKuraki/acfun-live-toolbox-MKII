## 问题
- 加载阶段主进程 VM 调用插件主文件时，出现 "Cannot find module 'ws'"；随后报告未找到 afterloaded。
- 主因：VM 沙箱使用原生 require，未模拟 'ws' 与本地 obs-websocket-js；且优先读取的是已安装路径，可能与捆绑版不一致。

## 修复方案
- 在加载阶段主进程 VM：
  1) 优先选择捆绑版主文件路径：`buildResources/plugins/<id>/<main>`；不存在则退回已安装路径。
  2) 注入 `safeRequire`：
     - mocks：注入 `ws`（如果可用，否则提供空 stub）、注入本地 `obs-websocket-js.js` 的导出；
     - 允许少量内建模块；限制加载路径到插件目录或允许 roots。
  3) 沙箱包含 `console`，执行 `VMScript`，查找并调用 `sandbox.afterloaded` 或 `module.exports.afterloaded`。
  4) 使用 Promise 链式调用并打印日志，避免在同步函数内使用 `await`。

## 变更文件
- `packages/main/src/plugins/PluginManager.ts`：更新主进程 VM 调用段，实现上述路径选择与 `safeRequire` 注入。

## 验证
- 启动时不再出现 "Cannot find module 'ws'"；加载阶段能看到 "Invoking bundled afterloaded in main VM" 与插件自身日志 "[obs-assistant] loop start"；如函数不存在，打印明确的 not found 提示。