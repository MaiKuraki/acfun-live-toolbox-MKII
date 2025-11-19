# 重构路线图（维度与优先级）

## 目标

- 收敛命名与职责边界、抽象基础设施、提升数据层与消息层效率、强化生产安全策略。

## 路线与里程碑

- 里程碑 A（命名与边界，优先级高）
  - 将 `plugins/ConnectionPoolManager.ts` 重命名与重定位为 `PluginConnectionPoolManager`（通用连接）
  - 将 `adapter/ConnectionPoolManager.ts` 重命名为 `AcfunApiConnectionPool`，明确只管理 `acfunlive-http-api` 实例与其健康/熔断/指标
  - 整理导出入口并统一事件命名与统计接口

- 里程碑 B（SSE/WS 基础设施，优先级高）
  - 提取 `SSEHeartbeat` 与 `SSECleanup` 工具，替换 `ApiServer.ts:759-763/896-903/1105-1110` 与 WS 心跳 `WsHub.ts:242` 的分散实现
  - 心跳间隔与清理策略集中配置（环境/插件维度可调整）

- 里程碑 C（数据层调优，优先级高）
  - 启用 SQLite WAL 与同步级别调整；设置 `cache_size/temp_store` 等基础 PRAGMA
  - 引入预编译语句池与批量大小自适应（按队列长度/延迟动态调节）
  - 复核索引覆盖与查询路径（`QueryService`）以适配新增维度筛选

- 里程碑 D（日志与序列化，优先级中）
  - 按环境切换日志等级（开发 verbose、生产 info+warn+error），统一使用 `LogManager`
  - SSE/WS 负载体最小化与必要字段保留；只读仓库快照合并优化（去重与增量）

- 里程碑 E（安全策略，优先级中）
  - 服务端启用最小 CSP，按页面白名单内联样式与必要脚本指令；frameguard 按需关闭
  - 统一来源白名单与插件端点鉴权；RateLimitManager 可选持久化

- 里程碑 F（版本与构建，优先级低）
  - 根 `engines.node` 与 Electron Node 主版本对齐；或移除根引擎约束以避免混淆
  - 保持 `electron-builder` 工作区白名单策略以最小体积发布

## 退出准则（完成定义）

- 命名与职责边界清晰，重复实现移除且文档更新
- SSE/WS 心跳与清理一致，泄漏告警归零
- 数据层在目标负载下写延迟与读并发达到预期（>30% 提升）
- 生产安全策略通过静态审查与最小权限检查
- CI 通过类型检查与打包检查；测试遵循“不 mock acfunlive-http-api”的约束