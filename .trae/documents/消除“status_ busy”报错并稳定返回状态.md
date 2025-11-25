## 问题
- 同时有后台循环与前端状态查询，导致插件工作线程短时忙碌；当前 IPC 在忙碌时仍抛错，用户看到 "Worker ... (status: busy)"。

## 方案（仅改主进程 IPC，不改框架页/插件UI）
- 在 `plugin.process.execute` 增强忙碌处理：
  - 增加更长的等待与退避（初始 500ms，最多 10 次，200ms 递增）。
  - 引入结果缓存：成功时缓存最近一次 `{ pluginId, method }` 的返回值；忙碌重试耗尽时返回缓存并标记 `stale: true`，而不是抛错。
  - 明确返回 `error: 'busy'` 提示，但 `success: true` 携带缓存，避免 UI报错。

## 验证
- 打开插件 UI，状态查询不会再抛错；在工作线程忙碌阶段，能拿到上次状态或等待后拿到新状态。

## 影响范围
- 仅修改 `packages/main/src/ipc/ipcHandlers.ts` 的 `plugin.process.execute` 处理逻辑；不动其他页面与插件代码。