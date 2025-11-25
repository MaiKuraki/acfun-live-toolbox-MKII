## 目标
- 在 obs-assistant 的 `init()` 阶段，严格依赖配置 `autoStartObs` 决定是否启动 OBS（仅启动，不连接）。
- 启动后进行一次运行状态验证，并通过日志与弹窗提示告知成功或失败。

## 修改点
- `buildResources/plugins/obs-assistant/index.js`
  - 在 `init()` 中：
    - 读取配置后，若 `state.config.autoStartObs === true`：
      - 执行 `ensureObsRunning()` 启动 OBS
      - `await sleep(500)`，随后调用 `isObsRunning()` 验证
      - 成功：`showToast('已检测到 OBS 已启动')`
      - 失败：`showToast('OBS 启动失败，请检查路径与权限')`
  - 保持现有逻辑：循环检测只在进入“创建直播”页时启用；推流严格前置检查与延迟。

## 验证
- 启用插件后，即使不切换页面，也能看到 OBS 启动结果反馈；进入“创建直播”页时才开始连接与推流流程。