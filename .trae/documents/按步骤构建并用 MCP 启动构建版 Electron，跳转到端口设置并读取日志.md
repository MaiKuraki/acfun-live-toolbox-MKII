## 执行概览
- 构建项目：运行 `pnpm run build`（根目录），生成最新产物到各包的 `dist`。
- 启动构建版 Electron：清空 `VITE_DEV_SERVER_URL`，以远程调试端口启动当前目录的 Electron，确保加载 `renderer/dist/index.html`（生产路径）。
- 导航与点击：用自动化执行 `window.location.hash = '#/system/settings'`，点击“网络设置”标签页。
- 日志验证：检查主进程与渲染进程的控制台日志是否可同时读取。

## 具体命令
- 构建：`pnpm run build`
- 关闭旧实例并启动构建版 Electron（分号连接）：
  - `Get-Process -Name electron -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Seconds 1; $env:ELECTRON_ENABLE_LOGGING=1; $env:VITE_DEV_SERVER_URL=$null; pnpm exec electron . --remote-debugging-port=9222`

## MCP 自动化步骤
- 读取窗口信息，确认连接的目标窗口。
- 控制台执行跳转：`window.location.hash = '#/system/settings'`
- 点击“网络设置”标签页。
- 读取日志：
  - 主进程：读取主进程控制台日志
  - 渲染进程：读取渲染进程控制台日志

## 交付与验证
- 返回窗口 URL 与操作结果，说明是否为构建版（应为 `file:///.../renderer/dist/index.html`）。
- 展示主进程与渲染进程日志摘录，确认可同时读取。