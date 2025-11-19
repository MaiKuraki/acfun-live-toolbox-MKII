## 问题
- 现有按需启动插件进程的逻辑在安装目录缺少主入口时尝试“复制打包资源到安装目录”，这与规范不符
- 正确行为：开发环境且插件清单包含 `test: true` 时，直接“优先加载打包资源”的主入口，不对安装目录做写入

## 目标
- 在主进程启动插件进程时，统一按以下规则解析主入口：
  - `isDev && manifest.test === true && bundledRoot存在` → 使用打包资源路径
  - 否则 → 使用安装目录路径
- 不再复制文件到安装目录；仅选择加载路径

## 实施内容
- 修改 `packages/main/src/ipc/ipcHandlers.ts` 的 `plugin.process.execute` 按需启动分支：
  - 计算 `isDev = (process.env.NODE_ENV === 'development' || !app.isPackaged)`
  - 解析 `bundledRootCandidates = [ buildResources/plugins/<id>, resourcesPath/plugins/<id> ]` 并选择存在的 `bundledRoot`
  - `preferBundled = isDev && manifest.test === true && !!bundledRoot`
  - `mainPath = preferBundled ? path.join(bundledRoot, manifest.main) : path.join(installPath, manifest.main)`
  - 直接用该 `mainPath` 调用 `startPluginProcess`，移除复制逻辑
- 保持之前已实现的静态托管规则（ApiServer.ts）与此一致

## 验证
- 类型检查（不改动 acfunlive-http-api、不使用 mock）
- 点击 window 启动插件进程时不写入安装目录，且在 dev+test 情况加载打包资源成功；主窗口不闪退

## 注意
- 不改动安装目录文件；仅解析加载路径
- 生产环境（打包）仍使用安装目录的主入口