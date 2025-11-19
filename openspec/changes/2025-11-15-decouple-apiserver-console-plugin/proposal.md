## Why
降低主进程服务层与管理器层的编译期耦合，解决隐性循环依赖风险，提升可维护性与演进弹性。

## What Changes
- `ApiServer` 仅依赖接口类型（`IPluginManager`、`IConsoleManager`），移除对具体实现的直接 `import`。
- `ConsoleManager` 移除对 `ApiServer` 的直接依赖与构造参数。
- 路由冗余清理（`/api/diagnostics`、`/api/logs` 保留单一定义）。
- 统一版本：`express@^5`、`@types/express@^5`、`typescript@^5.9.3`。
- 消息中心持久化增加 JSONL 轮转与上限；`morgan` 按环境开关。

## Impact
- 受影响代码：`packages/main/src/server/ApiServer.ts`、`packages/main/src/console/ConsoleManager.ts`、`packages/main/src/index.ts`、`packages/main/src/persistence/DataManager.ts`、`packages/main/package.json`、`packages/main/src/types/contracts.ts`。
- 能力保持不变：HTTP API、SSE、插件管理、控制台命令。
- 风险与回滚：如出现编译期/运行期异常，可以暂时恢复到具体类依赖或降低 Express 版本。