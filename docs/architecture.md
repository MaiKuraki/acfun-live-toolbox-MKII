# 项目架构

ACLiveFrame 采用现代化的技术栈和模块化架构设计，提供高性能、可扩展的直播工具框架。

## 🛠️ 技术栈

### 前端框架
- **Vue 3** + **TypeScript** - 现代化的前端框架，提供类型安全和组件化开发
- **Vite** - 快速的构建工具，支持热模块替换和优化的生产构建
- **TDesign Vue Next** - 腾讯开源的 Vue 3 组件库，提供一致的 UI 体验

### 桌面应用框架
- **Electron** - 跨平台桌面应用框架，支持 Windows、macOS 和 Linux

### API 集成
- **acfunlive-http-api** - AcFun 直播平台的官方 HTTP API 客户端库

### 测试与质量
- **Vitest** + **Playwright** - 单元测试和端到端测试框架
- **ESLint** + **Prettier** - 代码质量和格式化工具

### 包管理
- **pnpm workspaces** - 高效的包管理和工作空间管理

## 📁 项目结构

```
ACLiveFrame/
├── packages/                          # pnpm 工作空间
│   ├── main/                          # Electron 主进程
│   │   ├── src/
│   │   │   ├── adapter/               # AcFun API 适配器
│   │   │   ├── bootstrap/             # 应用启动逻辑
│   │   │   ├── config/                # 配置管理
│   │   │   ├── console/               # 控制台管理
│   │   │   ├── dependencyCheck.ts     # 依赖检查
│   │   │   ├── events/                # 事件系统
│   │   │   ├── index.ts               # 主进程入口
│   │   │   ├── ipc/                   # 进程间通信
│   │   │   ├── logging/               # 日志系统
│   │   │   ├── ModuleContext.ts       # 模块上下文
│   │   │   ├── ModuleRunner.ts        # 模块运行器
│   │   │   ├── persistence/           # 数据持久化
│   │   │   ├── plugins/               # 插件系统
│   │   │   ├── rooms/                 # 房间管理
│   │   │   ├── server/                # API 服务器
│   │   │   ├── types/                 # 类型定义
│   │   │   └── utils/                 # 工具函数
│   │   └── package.json
│   ├── preload/                       # 预加载脚本
│   │   ├── src/
│   │   │   ├── exposed.ts             # 暴露的 API
│   │   │   └── index.ts               # 预加载入口
│   │   └── package.json
│   ├── renderer/                      # 渲染进程 (Vue 应用)
│   │   ├── src/
│   │   │   ├── components/            # Vue 组件
│   │   │   ├── pages/                 # 页面组件
│   │   │   ├── stores/                # Pinia 状态管理
│   │   │   ├── router/                # Vue Router
│   │   │   └── utils/                 # 前端工具
│   │   └── package.json
│   ├── electron-versions/             # Electron 版本管理
│   └── integrate-renderer/            # 渲染进程集成工具
├── plugin-cli/                        # 插件开发 CLI 工具
│   ├── src/
│   │   ├── app/                       # 前端应用模板
│   │   ├── main/                      # 后端插件模板
│   │   └── types/                     # API 类型定义
│   ├── scripts/                       # CLI 脚本
│   └── README.md                      # CLI 工具说明
├── openspec/                          # OpenSpec 规范
│   ├── changes/                       # 变更记录
│   ├── project.md                     # 项目规范
│   └── specs/                         # 详细规范
├── buildResources/                    # 构建资源
└── dist/                              # 构建输出
```

## 🏛️ 核心模块详解

### 主进程 (packages/main/)

主进程负责核心业务逻辑、插件管理和系统集成：

#### 🔌 插件系统 (plugins/)
- **插件管理器**: 负责插件的加载、卸载和生命周期管理
- **API 桥接**: 为插件提供统一的 API 接口
- **隔离运行时**: 每个插件运行在独立的沙箱环境中

#### 📡 API 服务器 (server/)
- **RESTful API**: 提供数据查询和管理接口
- **WebSocket 支持**: 实时数据推送
- **CORS 处理**: 处理跨域请求

#### 💾 数据持久化 (persistence/)
- **SQLite 存储**: 事件数据和元数据的持久化存储
- **查询优化**: 支持复杂的数据查询和过滤
- **数据迁移**: 自动处理数据库结构变更

#### 🌐 AcFun 适配器 (adapter/)
- **API 客户端**: 与 AcFun 平台的 HTTP API 集成
- **认证管理**: 二维码登录和令牌管理
- **数据转换**: 将 AcFun 数据转换为内部格式

### 渲染进程 (packages/renderer/)

前端 Vue 应用提供用户界面：

#### 🎨 用户界面 (components/pages/)
- **响应式设计**: 支持多种屏幕尺寸
- **实时更新**: WebSocket 实时数据展示
- **插件集成**: 动态加载插件界面

#### 📊 状态管理 (stores/)
- **Pinia**: Vue 3 官方状态管理库
- **模块化**: 按功能划分的状态模块
- **持久化**: 自动保存用户偏好设置

### 插件 CLI (plugin-cli/)

专用的插件开发工具：

#### 📦 模板系统
- **标准化模板**: 统一的插件项目结构
- **热重载支持**: 开发时自动重新加载
- **构建优化**: 优化的生产构建配置

#### 🛠️ 开发工具
- **脚手架**: 快速创建新插件项目
- **类型定义**: 完整的 TypeScript 类型支持
- **调试支持**: 内置的调试和测试工具

## 🔄 数据流

### 弹幕数据流
```
AcFun API → 主进程适配器 → 事件总线 → 插件处理 → SQLite 存储 → API 查询 → 前端展示
```

### 插件通信流
```
插件前端 ↔ IPC 桥接 ↔ 主进程 API ↔ 系统服务 ↔ 外部 API
```

### 用户交互流
```
用户操作 → Vue 组件 → Pinia Store → IPC 调用 → 主进程处理 → 数据更新 → UI 响应
```

## 🚀 性能优化

### 异步架构
- **全异步处理**: 所有 I/O 操作都是异步的，避免阻塞主线程
- **连接池**: 优化的 HTTP 连接池，减少连接开销
- **批量处理**: 事件数据的批量写入和处理

### 内存管理
- **资源池**: 连接和内存的池化管理
- **垃圾回收**: 主动清理不再使用的资源
- **内存监控**: 实时监控内存使用情况

### 缓存策略
- **多级缓存**: API 响应缓存和计算结果缓存
- **智能失效**: 基于时间和事件触发的缓存更新
- **压缩存储**: 数据压缩减少存储空间占用

## 🔒 安全设计

### 插件隔离
- **沙箱环境**: 插件运行在受限的执行环境中
- **权限控制**: 细粒度的 API 访问权限控制
- **代码审查**: 可选的插件代码安全检查

### 数据安全
- **加密存储**: 敏感数据的加密存储
- **访问控制**: 基于角色的数据访问控制
- **审计日志**: 完整的操作审计记录

## 📈 可扩展性

### 插件架构
- **标准化接口**: 统一的插件开发接口
- **动态加载**: 运行时动态加载和卸载插件
- **版本管理**: 插件版本兼容性和升级管理

### API 设计
- **RESTful 设计**: 标准化的 REST API 设计
- **向后兼容**: 保持 API 的向后兼容性
- **文档驱动**: 基于 OpenAPI 规范的 API 文档

---

<div align="center">
  <p>了解更多：</p>
  <p>🚀 <a href="quickstart.md">快速开始</a> | 🔌 <a href="plugin-development.md">插件开发</a> | 🔧 <a href="troubleshooting.md">故障排除</a></p>
</div>






