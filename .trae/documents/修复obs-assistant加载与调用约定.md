## 目标
- 使 obs-assistant 插件在 Worker 的全局函数约定下正常运行并响应方法调用。

## 代码改动
- 修改 Worker：
  - 将钩子调用改为 `windowRef.beforeloaded()` 与 `windowRef.afterloaded()`（小写），匹配插件现有函数名。
  - 在初始化注入别名：`windowRef.childProcess = require('child_process')`，并设置 `windowRef.exec = childProcess.exec`、`windowRef.spawn = childProcess.spawn`。
  - 保持 `windowRef.http`、`windowRef.path` 等注入。
- 修改插件 `buildResources/plugins/obs-assistant/index.js`：
  - 不再使用 `require('http')`，改为 `const http = window.http`；`const path = window.path`；`const { spawn, exec } = window.childProcess`。
  - 将核心方法挂到 `window`：`window.ensureObsRunning = ensureObsRunning`、`window.connectObs = connectObs`、`window.applyObsSettings = applyObsSettings`、`window.applyObsAndStart = applyObsAndStart`、`window.startStreaming = startStreaming`、`window.getStatus = getStatus`、`window.cleanup = cleanup`、`window.onConfigUpdated = onConfigUpdated`、`window.afterloaded = afterloaded`、`window.beforeUnloaded = beforeUnloaded`。
  - 保留现有模块导出但不依赖其运行。

## 执行与验证
- 重新注入并执行插件后，调用 `ensureObsRunning` 应命中 `window.ensureObsRunning` 并返回结果。
- 控制台打印任何步骤错误，确认 `afterloaded` 在主脚本注入完成后被调用。

## 注意
- 不涉及测试文件或外部依赖修改；仅限上述两个文件的内容更新。