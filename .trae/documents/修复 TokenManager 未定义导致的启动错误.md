## 问题
- 在 ApiServer 中构造 AcfunApiProxy 时使用了 `TokenManager.getInstance()`，但 ApiServer 文件未导入 TokenManager，导致运行时报 `ReferenceError: TokenManager is not defined`。

## 方案
- 在 `packages/main/src/server/ApiServer.ts` 顶部显式导入 `TokenManager`：`import { TokenManager } from './TokenManager'`
- 保持现有 `new AcfunApiProxy({}, TokenManager.getInstance(), databaseManager)` 构造不变。

## 验证
- 重新启动主进程不再出现 ReferenceError。
- ApiProxy 仍能正常注入 DatabaseManager 并执行 rooms_meta upsert。