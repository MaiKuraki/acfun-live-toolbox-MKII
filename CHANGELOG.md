# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **PluginManager 清理**: 从 `PluginManager.ts` 中移除了以下已废弃的无用方法：
  - `updatePlugin()` - 插件更新功能已被移除，直接抛出错误
  - `rollbackPluginUpdate()` - 插件更新回滚功能已被移除，仅记录警告
  - `getPluginVersionHistory()` - 版本历史管理已被移除，返回 null
  - `checkPluginUpdates()` - 插件更新检查已被移除，返回 null
  - `getPluginChangelog()` - 变更日志获取已被移除，返回空数组
  - `rollbackPluginVersion()` - 插件版本回滚已被移除，仅记录警告
  - `compareVersions()` - 版本比较功能已被移除，恒返回 0
  - `satisfiesVersionConstraint()` - 版本约束检查已被移除，恒返回 true
  - `cleanupOldVersions()` - 旧版本清理功能已被移除，no-op

### Removed
- 移除了 PluginManager 中所有与插件版本管理和更新相关的占位/废弃方法
- 这些方法在项目源码中从未被调用，仅存在于历史编译产物中

### Compatibility
- 此变更不影响现有功能，因为删除的方法从未被项目中的其他模块调用
- 保留的 `getConnectionPoolStats()` 方法继续为系统监控接口提供支持
- 保留的调试相关方法（`startExternalDebug`、`stopExternalDebug`、`testExternalConnection` 等）继续为开发工具提供支持

### Technical Details
- 通过全局引用搜索确认删除的方法在项目源码中无调用
- TypeScript 编译、构建和类型检查均通过
- 代码清理降低了维护成本并简化了 PluginManager 接口

