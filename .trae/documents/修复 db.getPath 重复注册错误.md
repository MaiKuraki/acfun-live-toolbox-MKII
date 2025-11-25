## 问题
- Electron 抛出 “Attempted to register a second handler for 'db.getPath'”，说明在进程生命周期中重复执行了 `ipcMain.handle('db.getPath', ...)`。

## 方案
- 在注册前调用 `ipcMain.removeHandler('db.getPath')`，确保只有一个处理器。避免热重启或多次初始化时重复注册。
- 保持现有返回逻辑不变（与 preload 的 `window.electronApi.db.getPath()` 对齐）。

## 实施
- 修改 `packages/main/src/ipc/ipcHandlers.ts`：在调用 `ipcMain.handle('db.getPath', ...)` 前先执行 `ipcMain.removeHandler('db.getPath')` 包装在 try 块中。

## 验证
- 重启或热更新后不再报错；渲染层调用 `window.electronApi.db.getPath()` 返回路径正常。