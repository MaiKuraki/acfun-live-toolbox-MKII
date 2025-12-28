# ACLiveFrame 代码库概览

## 项目简介

ACLiveFrame 是一个基于 Electron 的桌面应用程序，为 AcFun 直播平台提供强大的工具集。项目采用 monorepo 架构，使用 pnpm workspaces 管理多个包。

- **项目名称**: ACLiveFrame
- **版本**: 2.9.8
- **技术栈**: Electron 39, Vue 3, TypeScript 5.9, Vite 7
- **包管理器**: pnpm
- **Node.js 要求**: >= 22.0.0

## 核心特性

1. **实时弹幕捕获与处理**: 高性能弹幕消息实时获取和处理
2. **礼物统计分析**: 自动统计礼物数据，支持多维度分析
3. **插件系统**: 模块化架构，支持插件动态加载、卸载和热更新
4. **数据持久化**: SQLite 数据库存储事件数据，支持查询和导出
5. **OBS 集成**: 通过 WebSocket 与 OBS Studio 集成
6. **安全认证**: 支持二维码登录和令牌管理

## 项目结构

```
acfun-live-toolbox-MKII/
├── packages/                    # 核心包目录
│   ├── main/                   # Electron 主进程
│   ├── preload/                # 预加载脚本（IPC 桥接）
│   ├── renderer/               # 渲染进程（Vue 应用）
│   ├── electron-versions/      # Electron 版本工具
│   ├── integrate-renderer/     # 渲染器集成工具
│   └── entry-point.mjs         # 应用入口点
├── plugins/                     # 用户插件目录
├── buildResources/              # 构建资源
│   └── plugins/                # 内置示例插件
├── docs/                        # 项目文档
│   ├── api-reference.md        # API 参考
│   ├── plugin-development.md   # 插件开发指南
│   ├── architecture-assessment.md  # 架构评估
│   └── dependency-map.md       # 依赖关系图
├── openspec/                    # OpenSpec 规范
│   ├── project.md              # 项目上下文
│   ├── specs/                  # 功能规范
│   └── changes/                # 变更记录
├── plugin-cli/                 # 插件开发 CLI 工具
├── package.json                # 根 package.json
├── pnpm-workspace.yaml         # pnpm 工作区配置
└── electron-builder.mjs        # Electron 构建配置
```

## 核心包

### @app/main (主进程)
- **位置**: `packages/main/`
- **职责**: Electron 主进程，负责应用核心逻辑
- **主要模块**: 启动初始化、窗口管理、API 服务器、插件系统、数据持久化、AcFun 适配器、房间管理、配置管理、IPC 处理、令牌管理、控制台、日志
- **详细模块列表**: 参见 [模块索引](./module-index.md)

### @app/preload (预加载脚本)
- **位置**: `packages/preload/`
- **职责**: 安全桥接层，通过 `contextBridge` 暴露 API 给渲染进程
- **主要功能**: 暴露 `window.electronApi` 对象，IPC 通信桥接，安全隔离

### @app/renderer (渲染进程)
- **位置**: `packages/renderer/`
- **职责**: Vue 3 前端应用
- **技术栈**: Vue 3, Vue Router 4, Pinia, TDesign, Wujie
- **主要目录**: 页面、组件、状态管理、路由、工具
- **详细模块列表**: 参见 [模块索引](./module-index.md)

### @app/electron-versions
- **位置**: `packages/electron-versions/`
- **职责**: Electron/Chromium/Node 版本信息工具

## 模块依赖关系

### 通信协议
- **IPC**: 主进程 ↔ 渲染进程（通过 preload）
- **HTTP**: 本地 API 服务器（端口 1299）
- **SSE**: 服务器发送事件（只读状态、Overlay 通信）
- **WebSocket**: 实时事件广播

### 主进程模块关系
- `index.ts` → `DatabaseManager` → `EventWriter` → SQLite（事务批插入）
- `RoomManager` → 事件 → `WsHub.broadcastEvent()`；房间状态 → `WsHub.broadcastRoomStatus()`
- `ApiServer`（HTTP/SSE/WS） ← `PluginManager/ConsoleManager` 注入引用
- `TokenManager`（统一 `acfunlive-http-api` 实例）
- `WindowManager/PluginWindowManager`（BrowserWindow 与插件窗口控制）

### 预加载与渲染模块关系
- 预加载 `exposed.mjs` 暴露 `electronApi.*` 合约，渲染层仅走 IPC/HTTP
- 渲染层订阅只读仓库与 Overlay 通道，路由与页面按需注册插件子页

## 架构模式

### 1. 进程架构

```
┌─────────────────────────────────────┐
│         Electron Main Process       │
│  (Node.js, 完整系统访问权限)         │
│                                     │
│  - ApiServer (Express)              │
│  - PluginManager                    │
│  - RoomManager                      │
│  - DatabaseManager                  │
│  - TokenManager                     │
└──────────────┬──────────────────────┘
               │ IPC
               │
┌──────────────▼──────────────────────┐
│         Preload Script              │
│  (contextBridge, 安全桥接)          │
│                                     │
│  - window.electronApi               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Renderer Process (Vue 3)       │
│  (受限环境, 无 Node 访问)            │
│                                     │
│  - Vue Router                       │
│  - Pinia Stores                     │
│  - TDesign Components               │
└─────────────────────────────────────┘
```

### 2. 插件系统架构

```
┌─────────────────────────────────────┐
│         Plugin Manager              │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   PluginCoordinator          │  │
│  │   - 生命周期管理              │  │
│  │   - 资源协调                  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ Process  │  │ Window   │        │
│  │ Manager  │  │ Manager  │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │  Cache   │  │  Hot     │        │
│  │ Manager  │  │  Reload  │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

**插件类型**:
1. **Main 插件**: 运行在主进程（Node.js Worker）
2. **UI 插件**: 通过 Wujie 嵌入到主应用路由
3. **Window 插件**: 独立 BrowserWindow
4. **Overlay 插件**: 用于 OBS 浏览器源

**插件 API 注入**:
- Main 插件: 直接注入到 Worker 全局上下文
- UI/Window 插件: 通过 Wujie props 注入
- Overlay 插件: 通过 iframe postMessage 注入

### 3. 数据流

```
┌──────────────┐
│ AcFun API    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ AcfunAdapter │
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│ RoomManager  │─────▶│ EventWriter  │
└──────┬───────┘      └──────┬───────┘
       │                     │
       │                     ▼
       │            ┌──────────────┐
       │            │ SQLite DB    │
       │            └──────────────┘
       │
       ▼
┌──────────────┐
│   WsHub      │─────▶ Broadcast Events
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Renderer    │
│  (Vue App)   │
└──────────────┘
```

## 关键服务

### 1. ApiServer

**位置**: `packages/main/src/server/ApiServer.ts`

**功能**:
- HTTP 服务器（Express）
- SSE 端点（只读状态、Overlay 通信）
- WebSocket 端点（事件广播）
- 插件路由注册（`/plugins/:id/*`）
- AcFun API 代理
- 静态资源托管

**主要端点**:
- `GET /`: 服务器信息
- `GET /health`: 健康检查
- `GET /api/events`: 事件查询（SQLite）
- `GET /sse/plugins/:pluginId/overlay`: 插件 Overlay SSE（统一通道，包含 store/config/lifecycle/message 等）
- `GET /sse/overlay/:overlayId`: Overlay SSE
- `WS /ws`: WebSocket 事件广播

### 2. PluginManager

**位置**: `packages/main/src/plugins/PluginManager.ts`

**功能**:
- 插件安装/卸载
- 插件启用/禁用
- 插件生命周期管理
- 插件配置管理
- 插件日志和错误处理
- 插件热重载
- 插件性能监控

### 3. DatabaseManager

**位置**: `packages/main/src/persistence/DatabaseManager.ts`

**功能**:
- SQLite 数据库连接管理
- 事件表结构管理
- 房间元数据管理
- 批量事务写入

**表结构**:
- `events`: 事件表（id, event_id, type, room_id, source, user_id, username, payload, timestamp, received_at, raw_data, created_at）
- `rooms_meta`: 房间元数据（room_id, streamer_name, streamer_user_id, updated_at）

### 4. TokenManager

**位置**: `packages/main/src/server/TokenManager.ts`

**功能**:
- AcFun API 令牌管理
- 二维码登录流程
- 令牌刷新和过期处理
- 令牌持久化（`secrets.json`）

### 5. RoomManager

**位置**: `packages/main/src/rooms/RoomManager.ts`

**功能**:
- 直播间连接管理
- 弹幕事件处理
- 房间状态管理
- 事件广播到 WebSocket

## 安全模型

### 窗口安全配置

```typescript
{
  webPreferences: {
    nodeIntegration: false,        // 禁用 Node 集成
    contextIsolation: true,        // 启用上下文隔离
    sandbox: false,                // 禁用沙箱（preload 需要）
    preload: 'path/to/preload.js'  // 预加载脚本
  }
}
```

### 预加载脚本职责

- 通过 `contextBridge` 安全暴露 API
- 不直接暴露 Node.js API
- 所有渲染进程操作通过 IPC

### 插件安全

- Main 插件运行在 Worker 线程（隔离）
- UI/Window 插件通过 Wujie 隔离 DOM 和 JS 上下文
- Overlay 插件运行在 iframe 中
- API 访问控制（不同插件类型有不同的 API 权限）

## 开发工作流

```bash
# 安装依赖
pnpm install

# 启动开发环境
pnpm start

# 构建
pnpm build

# 类型检查
pnpm typecheck:all

# 测试
pnpm test
```

插件开发请参考 [插件开发指南](../guides/plugin-development.md)。

## 数据持久化

### SQLite 数据库

- **位置**: `app.getPath('userData')/events.db`
- **写入策略**: 批量事务写入，默认刷新窗口 1s，批次大小约 100
- **查询 API**: `GET /api/events`（支持分页、过滤、时间范围查询）

### 配置存储

- **electron-store**: 应用配置
- **electron-data**: 用户数据
- **secrets.json**: 认证令牌（加密存储）

## 性能优化

1. **连接池**: AcFun API 连接池和通用连接池
2. **内存池**: 插件内存池管理
3. **批量写入**: SQLite 批量事务写入
4. **懒加载**: 插件懒加载机制
5. **缓存**: 插件缓存管理
6. **Worker 线程**: Main 插件运行在 Worker 线程

## 已知问题与改进方向

### 命名冲突
- `ConnectionPoolManager` 在两个位置定义（通用连接池 vs AcFun API 连接池），建议重命名区分

### SSE/WS 心跳
- 多个心跳实现分散在不同位置，建议抽象共享心跳组件

### SQLite 性能
- 尚未启用 WAL 模式，建议启用 WAL 和同步级别调优

### 安全策略
- 开发环境关闭了 CSP，生产环境建议保留最小 CSP 策略

### 版本约束
- 根 `package.json` 要求 Node `>=22.0.0`，与 Electron 39 内置 Node 22 一致

## 相关文档

- [API 参考](../api/api-reference.md) - 插件 API 详细参考
- [插件开发指南](../guides/plugin-development.md) - 插件开发完整指南
- [集成指南](../guides/integration-guide.md) - 系统集成和配置指南
- [模块索引](./module-index.md) - 所有模块的文件位置索引

