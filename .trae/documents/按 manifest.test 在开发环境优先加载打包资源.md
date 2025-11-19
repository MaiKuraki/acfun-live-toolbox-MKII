## 目标
- 在开发环境（未打包）且插件清单 `manifest.test === true` 时，静态托管优先从打包资源目录加载，而不是用户安装目录副本
- 清理现有硬编码 `preferBundledFor` 列表，统一改为基于清单字段驱动
- 为现有两个内置示例插件的清单添加 `test: true`

## 代码改动
- 修改静态托管逻辑：`packages/main/src/server/ApiServer.ts:569-592`
  - 读取 `plugin.manifest.test`（布尔）并判断是否开发环境（例如 `!app.isPackaged` 或 `process.env.NODE_ENV === 'development'`）
  - 当两者同时成立则启用“优先打包资源”路径，替代当前 `preferBundledFor` 逻辑
  - 保留安全路径检查（仅当 `resolved` 位于安装目录内时才映射到打包资源对应相对路径）
- 扩展清单类型定义：`packages/main/src/plugins/PluginManager.ts` 的 `PluginManifest` 接口
  - 添加 `test?: boolean` 可选字段，保证类型检查通过
- 更新内置示例插件清单
  - `buildResources/plugins/sample-overlay-ui/manifest.json` 增加 `"test": true`
  - `buildResources/plugins/sample-overlay-window/manifest.json` 增加 `"test": true`

## 实现步骤
1. 在 `ApiServer.ts` 的 `sendFile` 内：
   - 删除 `preferBundledFor` 集合与相关判断
   - 设置 `const preferBundled = isDev && plugin.manifest && plugin.manifest.test === true && !!bundledRoot`
   - 若 `preferBundled` 为真，则计算安装目录相对路径 `rel`，拼入 `bundledRoot` 得到候选路径，存在则覆盖为最终发送路径
2. 在 `PluginManager.ts` 的 `PluginManifest` 接口增加 `test?: boolean`
3. 在两个示例清单 `manifest.json` 中添加 `test: true`

## 验证
- 仅进行类型检查与静态走查：运行 `pnpm typecheck`，确保 `ApiServer.ts` 与 `PluginManager.ts` 无类型错误
- 开发服务器运行时访问插件静态文件，确认路径优先来自打包资源（日志或手动对比文件差异）

## 兼容性与清理
- 移除旧的硬编码插件 ID 白名单，避免“兼容旧版本的回退代码”
- 不影响生产环境（打包模式），生产仍从安装目录读取

## 变更记录
- 更新 `openspec/changes/archive/2025-11-13-add-plugin-window-and-global-popup/tasks.md`，添加并勾选该项说明