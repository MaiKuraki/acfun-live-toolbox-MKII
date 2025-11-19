## 1. Implementation
- [x] 1.1 清理 ApiServer 重复路由定义
- [x] 1.2 ApiServer 改为依赖 IPluginManager/IConsoleManager 接口
- [x] 1.3 ConsoleManager 移除对 ApiServer 的直接依赖
- [x] 1.4 升级并统一 express/typescript 版本
- [x] 1.5 DataManager 增加 JSONL 轮转与上限
- [x] 1.6 morgan 按环境开关
- [x] 1.7 全仓类型检查验证
- [x] 1.8 插件子系统 type-only 导入，消除运行时循环依赖
- [x] 1.9 DatabaseManager PRAGMA 优化（busy_timeout/temp_store/journal_size_limit）
- [x] 1.10 DataManager 持久化改为异步 appendFile

## 2. Validation
- [x] 类型检查通过（`pnpm -r run typecheck`）
- [x] 代码走查（依赖注入生效、无循环导入）

## 3. Architecture Audit
- [x] 完成全项目架构审查（结构/技术栈/依赖/性能）
- [x] 输出优化建议（连接池收敛、认证单源、SSE/WS心跳集中、定时器错峰）