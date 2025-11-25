## 问题
- 在 `ipcHandlers.ts` 内注册 `db.getPath`，由于 `initializeIpcHandlers` 可能在热重载或某些流程下被多次调用，导致重复注册报错。

## 方案
- 移除 `ipcHandlers.ts` 中的 `db.getPath` 注册。
- 在 `index.ts` 的 `main()` 中，数据库初始化完成后统一注册一次 `db.getPath`，返回 `DatabaseManager.getPath()` 的真实路径；注册前执行 `ipcMain.removeHandler('db.getPath')` 防重。

## 实施步骤
1. 删除 `packages/main/src/ipc/ipcHandlers.ts` 中 `db.getPath` 相关代码块。
2. 在 `packages/main/src/index.ts` 中，`await databaseManager.initialize()` 后加入：
   - `try { ipcMain.removeHandler('db.getPath'); } catch {}`
   - `ipcMain.handle('db.getPath', async () => ({ success: true, path: databaseManager.getPath() }))`

## 验证
- 启动或热更新均不再出现 “Attempted to register a second handler for 'db.getPath'”。
- 渲染层调用 `window.electronApi.db.getPath()` 返回真实SQLite文件路径，且与 `[DB] path=...]` 一致。