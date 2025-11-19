# OBS Assistant

- 自动检测并启动 OBS（可配置可执行路径）
- 进入“创建直播”页面后自动同步推流服务器与串流密钥到 OBS（可开关）
- 支持配置 OBS WebSocket 端口与密码

## 配置项

- `obsPath`：OBS 可执行文件路径（例如 `C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe`）
- `autoStartObs`：应用启动后若未检测到 OBS 则自动启动
- `syncStreaming`：进入创建直播页面自动同步推流到 OBS
- `wsPort`：OBS WebSocket 端口（默认 4455）
- `wsPassword`：OBS WebSocket 密码（如启用）