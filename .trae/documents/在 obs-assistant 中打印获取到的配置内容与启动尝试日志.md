## 目标
- 在插件日志中打印从 `/api/plugins/obs-assistant/config` 获取到的原始响应与合并后的 `state.config`，便于定位为何未启动 OBS。
- 在初始化阶段输出启动尝试与运行状态日志：打印 `autoStartObs`、`obsPath`，以及 `ensureObsRunning()` 尝试与 `isObsRunning()` 验证结果。

## 修改点
- 文件：`buildResources/plugins/obs-assistant/index.js`
- 在 `loadInitialConfig()`：
  - 打印原始响应对象 `j`
  - 合并后打印 `state.config`
- 在 `init()`：
  - 打印 `autoStartObs` 与 `obsPath`
  - 在调用 `ensureObsRunning()` 前后打印尝试与结果；调用后短暂延时并打印 `isObsRunning()` 验证结果

## 验证
- 启动应用后，在插件日志中可看到：
  - `[obs-assistant] initial config response ...`
  - `[obs-assistant] merged config ...`
  - `[obs-assistant] init autoStartObs=..., obsPath=...`
  - `[obs-assistant] ensureObsRunning attempt` 与结果日志
  - `[obs-assistant] isObsRunning result ...`

完成后，你可依据日志确认配置是否正确读取，以及启动是否被触发与成功。