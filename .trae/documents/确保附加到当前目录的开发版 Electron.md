## 问题判断
- 现有会话的窗口 URL多次指向 `file:///.../packages/renderer/dist/index.html`，说明主进程走了生产资源而非渲染端 Dev Server。你反馈的现象与此一致：自动化附加到了“最后一次构建版本”。
- 代码逻辑：`packages/main/src/bootstrap/WindowManager.ts` 会在开发模式下读取 `process.env.VITE_DEV_SERVER_URL`，否则加载 `renderer/dist/index.html`。因此关键是启动 Electron 时必须设置 `VITE_DEV_SERVER_URL` 指向正在运行的 Vite Dev Server。

## 修正方案
- 关闭所有旧的 Electron 进程（避免 9222 端口附加到错误实例）。
- 启动渲染端 Dev Server：`pnpm start`（已有运行则跳过），记录本地地址 `http://localhost:5173/`。
- 以正确的环境变量启动 Electron：
  - 命令：`$env:ELECTRON_ENABLE_LOGGING=1; $env:VITE_DEV_SERVER_URL=http://localhost:5173/; pnpm exec electron . --remote-debugging-port=9222`
  - 作用：强制主窗口使用 Dev Server（`VITE_DEV_SERVER_URL`），保证 MCP 附加的是“当前目录的最新开发版”。
- 验证：读取窗口 URL，期望为 `http://localhost:5173/#/system/settings`；若仍为 `file:///...dist/index.html`，再次终止旧实例并重试。

## 自动化跟进
- 成功验证后，继续之前的自动化操作（导航到设置页、点击需要的按钮），并覆盖保存截图到 `d:\Code\acfun-live-toolbox-MKII\test\latest.png`。

## 代码参考
- 主窗口 URL选择：`packages/main/src/bootstrap/WindowManager.ts:...`（开发模式读取 `process.env.VITE_DEV_SERVER_URL`，生产模式 `renderer/dist/index.html`）
- 插件窗口 URL选择：`packages/main/src/plugins/PluginWindowManager.ts:...`（同理支持 Dev Server）
- Dev Server 注入环境：`packages/main/vite.config.js`（将 `rendererWatchServer.resolvedUrls.local[0]` 写入 `process.env.VITE_DEV_SERVER_URL`）