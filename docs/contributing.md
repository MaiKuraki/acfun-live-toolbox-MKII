# 贡献指南

感谢您对 ACLiveFrame 项目的兴趣！我们欢迎各种形式的贡献，包括代码改进、文档完善、问题报告和功能建议。

## 🤝 参与贡献

### 贡献类型

- **🐛 问题修复**: 修复 bug 和问题
- **✨ 新功能**: 添加新功能和特性
- **📚 文档**: 改进文档和示例
- **🎨 UI/UX**: 界面和用户体验改进
- **⚡ 性能**: 性能优化和改进
- **🔧 工具**: 开发工具和构建优化
- **🧪 测试**: 添加或改进测试

## 🚀 开发环境设置

### 环境要求
- Node.js >= 22.0.0
- pnpm >= 8.0.0
- Git

### 开发流程

1. **Fork 项目**
   ```bash
   # Fork ACLiveFrame 到您的 GitHub 账户
   ```

2. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/ACLiveFrame.git
   cd ACLiveFrame
   ```

3. **安装依赖**
   ```bash
   pnpm install
   ```

4. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   # 或者
   git checkout -b fix/bug-description
   ```

5. **启动开发环境**
   ```bash
   pnpm start
   ```

6. **进行开发和测试**
   - 编写代码
   - 添加测试
   - 确保代码规范

## 📝 代码规范

### TypeScript 开发
- 使用 TypeScript 进行所有新代码开发
- 充分利用类型系统，避免 `any` 类型
- 添加适当的类型定义和接口

### 代码风格
- 遵循 ESLint 和 Prettier 配置
- 使用有意义的变量和函数命名
- 添加必要的注释和文档

### 提交规范

提交信息格式：
```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建和工具相关

**示例**:
```
feat(auth): add QR code login support

- Implement QR code generation
- Add login status verification
- Update authentication flow

Closes #123
```

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:unit

# 运行端到端测试
pnpm test:e2e

# 生成覆盖率报告
pnpm test:coverage
```

### 测试要求
- 为新功能添加单元测试
- 修复 bug 时添加回归测试
- 保持测试覆盖率在合理水平
- 确保所有测试通过

## 📋 Pull Request 流程

### 创建 PR

1. **确保分支更新**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **推送分支**
   ```bash
   git push origin feature/your-feature
   ```

3. **创建 Pull Request**
   - 在 GitHub 上访问您的 fork
   - 点击 "New pull request"
   - 选择正确的分支
   - 填写 PR 描述

### PR 要求

**标题**: 清晰描述变更内容
```
✅ feat: add dark mode support
❌ fix bug
```

**描述**: 详细说明变更内容
- 问题描述
- 解决方案
- 变更范围
- 测试说明

**检查清单**:
- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 通过了所有测试
- [ ] 提交信息清晰

### 代码审查

PR 提交后将进入代码审查流程：
1. **自动化检查**: CI/CD 运行测试和检查
2. **人工审查**: 维护者审查代码质量
3. **讨论与修改**: 根据反馈进行修改
4. **合并**: 审查通过后合并到主分支

## 🔧 开发工具

### 插件开发
- 使用 `plugin-cli/` 工具开发插件
- 参考 [插件开发指南](plugin-development.md)
- 遵循插件 API 规范

### 调试技巧
- 使用浏览器开发者工具调试渲染进程
- 查看主进程日志输出
- 利用插件系统的调试接口

### 性能分析
- 使用 Chrome DevTools 进行性能分析
- 监控内存使用情况
- 分析网络请求性能

## 📚 文档贡献

### 文档改进
- 修复文档错误和拼写问题
- 完善示例代码
- 添加缺失的说明

### 文档结构
- 保持文档组织清晰
- 使用一致的格式和术语
- 更新目录和链接

## 🐛 问题报告

### Bug 报告
- 使用 [GitHub Issues](https://github.com/your-org/ACLiveFrame/issues) 模板
- 提供详细的复现步骤
- 包含环境信息和日志
- 说明期望行为和实际行为

### 功能请求
- 描述功能需求和使用场景
- 解释为什么需要这个功能
- 提供可能的实现方案

## 📞 沟通渠道

- **Issues**: [GitHub Issues](https://github.com/your-org/ACLiveFrame/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/ACLiveFrame/discussions)
- **Discord/社区**: 加入我们的开发者社区

## 🎯 行为准则

### 尊重他人
- 保持友好的沟通态度
- 尊重不同的观点和意见
- 建设性的批评和建议

### 质量优先
- 确保代码和文档质量
- 遵循项目规范和最佳实践
- 重视用户体验和安全性

### 持续改进
- 学习和分享新技术
- 参与代码审查和知识分享
- 帮助新贡献者融入项目

## 🙏 致谢

感谢所有贡献者的时间和精力！您的贡献让 ACLiveFrame 变得更好。

---

<div align="center">
  <p>准备贡献代码了吗？</p>
  <p>🚀 <a href="quickstart.md">快速开始</a> | 🔌 <a href="plugin-development.md">插件开发</a> | 🔧 <a href="troubleshooting.md">故障排除</a></p>
</div>
