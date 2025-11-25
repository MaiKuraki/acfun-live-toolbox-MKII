## 问题
- 通过 `spawn(p)` 启动 OBS 时未设置工作目录（cwd），OBS 会从当前进程工作目录寻找 `data/locale/en-US.ini`，导致报错 `failed to find locale/en-US.ini`。

## 方案
- 在 `ensureObsRunning()` 中为 `spawn` 设置 `cwd` 为 `path.dirname(obsPath)`，确保 OBS 在其安装目录作为工作目录启动。
- 具体改动：
  - 重新引入 `const path = require('path')`
  - 修改 `spawn(p, [], { detached: true, stdio: 'ignore' })` 为 `spawn(p, [], { cwd: path.dirname(p), detached: true, stdio: 'ignore' })`

## 验证
- 用户填写 `obsPath` 后，启动 OBS 不再出现 locale 文件缺失错误；obs-assistant 能按配置正常连接并执行后续推流。

确认后我将直接修改并构建。