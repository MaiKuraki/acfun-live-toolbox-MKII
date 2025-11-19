# 分阶段实施计划

## 范围与约束

- 依赖 `pnpm` 工作区；测试仅静态走查与类型检查；不 mock `acfunlive-http-api`。
- 不启动渲染进程开发服务器；遵循 `openspec/AGENTS.md`。

## Phase 1（1–2 天）：快速收敛与配置

- 命名与边界：连接池命名区分与导出入口整理（不改业务逻辑）
- 心跳常量与清理：抽取共享常量与清理函数（不改行为，仅统一实现）
- 数据层 PRAGMA：启用 WAL 与同步级别；保持事务批插入路径不变
- 日志分级：按环境切换等级，减少生产噪音与敏感信息风险

## Phase 2（2–3 天）：插件协调与消息层优化

- 收敛 `Plugin*Manager` 结构到 `PluginCoordinator` 驱动的子能力层
- SSE/只读仓库：快照合并去重与增量策略优化，统一事件名契约
- Overlay 包装页路由与资源入口一致化（SPA/Route/HTML）文档化与校验

## Phase 3（2 天）：安全策略最小化与限流增强

- 服务端启用最小 CSP（生产），frameguard 按需关闭；预加载桥保持
- RateLimitManager 可选持久化与白名单复核；端点级限流配置

## Phase 4（1 天）：版本与构建一致性与文档收尾

- 根 `engines.node` 与 Electron Node 主版本对齐或移除约束
- 构建体积与白名单复核；交付文档与依赖图更新

## 验证与交付

- 验证：`pnpm -r run typecheck` 全包通过；不运行集成测试；静态代码走查
- 交付：
  - 架构评估报告 `docs/architecture-assessment.md`
  - 模块依赖图 `docs/dependency-map.md`
  - 重构路线图 `docs/refactor-roadmap.md`
  - 风险/收益矩阵 `docs/risk-benefit-matrix.md`
  - 分阶段实施计划 `docs/phased-implementation-plan.md`