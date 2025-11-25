## 开发环境与启动
- 在 PowerShell 终端执行：`pnpm start; $env:ELECTRON_ENABLE_LOGGING=1; pnpm exec electron . --remote-debugging-port=9222`。
- 含义：先启动渲染端 Dev Server 并构建主/预加载，再以开启远程调试的方式启动 Electron（MCP 需 9222 端口）。
- 入口关系：Electron 加载 `packages/entry-point.mjs` → 主进程 `packages/main/dist/index.cjs`（源文件 `packages/main/src/index.ts`）。

## 通过 MCP 控制 Electron
- 读取窗口信息以定位主窗口。
- 导航到设置页：
  - 方式一（推荐）：使用命令导航哈希路由到 `#/system/settings`。
  - 方式二：解析页面结构后点击侧边栏菜单项“系统设置”。
- 修改端口：在设置页“网络配置”中找到端口输入框（占位符“请输入端口号”），填入新端口值（默认拟定 `18300`，可按需调整）。
- 保存：该页为自动保存，输入后约 300ms 触发持久化，无需手动点击。

## 验证保存与重启
- 立即验证已保存：在渲染进程执行 `window.electronApi.system.getConfig()`，检查 `server.port` 已更新为新值。
- 重启以生效：关闭并重新启动应用（同启动命令），主进程会按新端口启动 API 服务器。
- 验证端口生效：
  - 读取主进程日志应出现 `HTTP server running at http://127.0.0.1:<端口>`。
  - 也可访问 `http://127.0.0.1:<端口>/` 返回服务器信息（含 `websocket_endpoint`）。

## 关键代码参考
- 设置页端口输入与保存：`packages/renderer/src/pages/Settings.vue:69-86, 378-397, 417-431`
- 侧边栏导航到设置页：`packages/renderer/src/components/Sidebar.vue:113-121, 227-243`
- 主进程读取端口：`packages/main/src/index.ts:143, 151, 172-174, 187`
- 服务器监听与日志：`packages/main/src/server/ApiServer.ts:1548-1566, 1560-1566`

## 注意事项
- 变更端口后需重启应用才会真正生效（页面已提示）。
- 命令分隔使用分号；避免 `&&`。
- 若 9222 已占用，请改用其他远程调试端口并保持 MCP 配置一致。
- 若新端口被占用，`ApiServer` 会在日志中报错；请选用未占用端口。