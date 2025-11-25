## 现状与解释
- `getStatus()` 已通过系统进程检测 `obs64.exe/obs.exe`（无需文件路径），用于显示“运行中/未运行”（buildResources/plugins/obs-assistant/index.js）。
- `ensureObsRunning()` 仅用于“自动启动 OBS”，这一步需要 `obsPath`；不影响“检测”和“连接”。
- 若用户未配置路径且 OBS 未运行，状态会显示“未运行”，这是符合预期的进程检测结果。

## 调整目标
- UI 不再先调用 `ensureObsRunning`；直接调用 `connectObs`（若 OBS 正在运行且开启 WebSocket，即可成功）。
- 保留“自动启动”作为可选能力：用户配置了 `obsPath` 才使用；未配置不再提示为错误，只作为信息提示。

## 实施步骤（不改框架页）
1. 修改 obs-assistant 的 UI 页面：
   - 新增“连接 OBS”按钮，直接发送 `process.execute` `{ method: 'connectObs' }`；成功后刷新 `getStatus()`。
   - 未配置路径时不再显示错误，仅在用户点击“自动启动”时提示需要配置路径（文案：请在插件配置中选择 OBS 可执行文件）。
2. 保留现有状态显示与重试逻辑：
   - `getStatus()` 周期或事件触发刷新；短时繁忙时按退避重试。

## 验证
- 在未配置 `obsPath`、OBS 已运行时，点击“连接 OBS”能成功；状态显示“已连接（运行中）”。
- 在未配置 `obsPath`、OBS 未运行时，状态显示“未运行”，点击“连接 OBS”提示无法连接；用户可手动启动 OBS 或配置路径启用自动启动。

## 影响范围
- 仅修改 obs-assistant 的 `ui.html`（新增按钮与调用）；不改 `PluginFramePage` 与主进程。