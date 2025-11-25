## 思路
- 通过在沙箱 `require.root` 中加入插件安装目录，允许插件在隔离环境内可靠地 `require('./obs-websocket-js.js')` 作为回退，不再依赖注入顺序与导出形态。
- 在 obs-assistant 顶层增加回退 `require('./obs-websocket-js.js')`，当包名映射未命中或导出形态异常时仍能得到有效的 `OBSWebSocket` 构造函数。

## 实施
1) ProcessManager：传入插件主文件绝对路径，加入其所在目录到 NodeVM `require.root`
- 修改 `buildSandboxConfig(pluginId, manifest)` → `buildSandboxConfig(pluginId, manifest, pluginMainPath)`。
- 计算 `const pluginDir = path.dirname(pluginMainPath)` 并 `roots.push(pluginDir)`。
- 在 `startPluginProcess(pluginId, pluginPath, ...)` 调用处把 `pluginMainPath` 传入。

2) obs-assistant/index.js：添加健壮回退
- 顶层 `require('obs-websocket-js')` 解析失败或非函数时，执行 `require('./obs-websocket-js.js')` 并提取 `default/OBSWebSocket/模块本身`。
- 仅在首次解析失败时触发，不影响正常路径。

## 验证
- 启用→禁用→再启用：顶层回退可用，`connectObs()` 不再返回 `OBS_WEBSOCKET_LIB_INVALID`。
- 与现有 mocks 注入兼容，未来插件也可读取自身相对文件，提升沙箱内可操作性。

## 风险
- 变更仅影响沙箱根路径与该示例插件，范围可控；若需要回退，只需移除新增根并还原插件 require 回退。