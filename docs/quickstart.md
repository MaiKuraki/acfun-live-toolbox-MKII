# 快速开始

本指南将帮助您快速搭建和运行 ACLiveFrame 开发环境。

## 🎯 环境要求

- **Node.js**: >= 22.0.0
- **pnpm**: >= 8.0.0 (推荐包管理器)
- **操作系统**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)

## 🚀 安装和运行

### 1. 克隆项目
```bash
git clone https://github.com/your-org/ACLiveFrame.git
cd ACLiveFrame
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 启动开发环境
```bash
pnpm start
```

### 4. 构建生产版本
```bash
pnpm build
```

## 🎮 首次使用

1. **启动应用**: 运行 `pnpm start` 启动开发环境
2. **账号登录**: 使用 AcFun 手机客户端扫描二维码登录
3. **连接直播间**: 输入房间号或主播ID开始监听
4. **配置功能**: 根据需要启用相应的功能模块

## 🔐 认证设置

### 二维码登录（推荐）

1. 启动应用后，点击"登录"按钮
2. 使用 AcFun 手机客户端扫描二维码
3. 确认登录后，系统会自动保存认证信息

### 手动配置

如果二维码登录失败，可以手动配置认证信息：

1. **获取认证令牌**:
   - 登录 AcFun 网页版
   - 打开浏览器开发者工具 (F12)
   - 在网络请求中找到包含认证信息的请求
   - 复制相关的认证参数

2. **配置认证信息**:
   ```json
   {
     "userID": "你的用户ID",
     "securityKey": "安全密钥",
     "serviceToken": "服务令牌",
     "deviceID": "设备ID"
   }
   ```

详细的认证设置请参考 [集成指南](../../openspec/)。

## 🔌 插件开发

项目提供了专用的插件开发 CLI 工具 (`plugin-cli/`)，支持创建、开发和打包插件。

### 快速创建插件

```bash
# 使用插件模板创建新插件
cd plugin-cli
pnpm create <your-plugin-id>

# 进入新创建的插件目录
cd ../<your-plugin-id>

# 安装依赖
pnpm install

# 开发模式（支持热重载）
pnpm dev

# 构建插件
pnpm build

# 打包插件为 .zip 文件
pnpm package
```

更多插件开发信息请参考 [插件开发指南](plugin-development.md) 和 [插件 CLI 工具说明](../../plugin-cli/README.md)。

## 🛠️ 故障排除

遇到问题时，可以：

- 查看 [常见问题](troubleshooting.md) 获取解决方案
- 检查应用日志：`%APPDATA%/ACLiveFrame/logs/`
- 查看控制台日志：按 F12 打开开发者工具
- 生成诊断报告：菜单 → 帮助 → 生成诊断报告

---

<div align="center">
  <p>准备好了吗？让我们开始使用 ACLiveFrame！</p>
  <p>📖 <a href="architecture.md">了解项目架构</a> | 🔌 <a href="plugin-development.md">开始插件开发</a></p>
</div>











