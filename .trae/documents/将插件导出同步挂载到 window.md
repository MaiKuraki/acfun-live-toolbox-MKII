## 目标
- 让 `module.exports` 的插件方法同时挂载为 `window.<method>`，满足“可直接在窗口域调用”的使用习惯。

## 背景
- 目前 Worker 已将入口返回的导出绑定到 `window.module.exports`，且方法查找顺序支持 `window[method] → window.module.exports[method]`。
- 用户希望 `buildResources/plugins/obs-assistant/index.js:587-600` 中的导出被挂载到 `window`，避免只存在于 `module.exports`。

## 方案
- 在入口执行后：
  - 保留 `windowRef.module = { exports: exportsObj }`；
  - 遍历 `exportsObj` 的函数键，若 `windowRef[key]` 不存在，则赋值为 `exportsObj[key]`，不覆盖已有同名函数。

## 影响
- 无破坏性改动；统一行为为“导出对象 + 同名挂载到 window”，提升可用性。

## 验证
- 入口导出的 `onConfigUpdated`、`getStatus` 等方法可在窗口域直接调用（`window.onConfigUpdated`）。
- 插件调用路径（`executeInPlugin('onConfigUpdated')`）保持正常。