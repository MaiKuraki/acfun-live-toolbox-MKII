## 计划
- 让注入逻辑完全声明式：由插件 manifest.runtime 控制沙箱注入的 mocks 和是否注入 ws，不再在主进程写死任何模块名。
- 修复插件进程无法启动导致 afterloaded 未触发的问题（ws/obs-websocket-js 在用户目录解析失败）。

## 改动
1) ProcessManager：从 manifest.runtime 读取注入配置
- 文件：packages/main/src/plugins/ProcessManager.ts
- 改：buildSandboxConfig(pluginId, manifest) → injectWs: !!manifest.runtime?.injectWs；mocks: manifest.runtime?.mocks

2) Worker：仅按 mocks 声明注入模块，不再自动扫描 obs-websocket-js.js
- 文件：packages/main/src/plugins/worker/plugin-worker.js
- 改：去除无条件 localObs 注入；改为遍历 cfg.mocks，若值为相对路径，读取并注入导出；保留 cfg.injectWs → mocks['ws']。

3) 插件 manifest：声明需要的注入
- 文件：buildResources/plugins/obs-assistant/manifest.json
- 增：runtime.injectWs: true；已存在 runtime.mocks.obs-websocket-js: "obs-websocket-js.js"。

## 预期
- 插件进程能启动（ws/obs-websocket-js 通过 manifest 注入），主进程在 process.started 调用插件 afterloaded 并发布 SSE。
- 其它插件按需声明 mocks，不受影响；主进程无硬编码依赖。