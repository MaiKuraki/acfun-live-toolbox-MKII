## 目标
- 在插件清单 `manifest.json` 顶层增加 `icon` 字段（文件名），并将图标文件放在插件目录的 `ui/` 子目录下；列表、详情、侧边栏统一读取并显示。

## 现状核查
- 列表页已按 `plugin.icon` 渲染图标：`packages/renderer/src/pages/PluginManagementPage.vue:98-107`
- 列表数据映射时已从 `manifest.icon` 生成静态托管 URL：`packages/renderer/src/stores/plugin.ts:162-168`
- 服务器静态托管在禁用态仅允许访问 `ui/<manifest.icon>`：`packages/main/src/server/ApiServer.ts:594-604`
- 主进程 `PluginManifest` 仅声明了 `ui.icon`，没有顶层 `icon`：`packages/main/src/plugins/PluginManager.ts:43-47`

## 方案
1. Manifest 标准化
- 在插件清单顶层新增 `icon: string`（例如 `"icon": "obs.png"`）。
- 图标文件必须位于插件安装目录的 `ui/` 下（如 `ui/obs.png`）；支持扩展名：`.png`、`.jpg`/`.jpeg`、`.ico`、`.svg`。

2. 类型与校验
- 扩展 `PluginManifest` 接口，增加顶层 `icon?: string`（保留 `ui.icon` 用于显示用名/描述，不再用于图标）。
- 在 `validatePluginManifest()` 中校验：
  - `icon` 若存在，必须为非空字符串，且扩展名在白名单内；
  - 可选地校验文件存在：`path.join(pluginDir, 'ui', manifest.icon)`。
  - 其余校验保持不变。

3. 渲染与数据流
- 渲染层无需改动：已读取 `manifest.icon` 构造 URL `/plugins/:id/ui/<icon>` 并赋给 `plugin.icon`（`packages/renderer/src/stores/plugin.ts:162-168`）。
- 失败回退保留（默认 `t-icon`）：`packages/renderer/src/pages/PluginManagementPage.vue:98-107`。

4. 示例插件
- 在 `buildResources/plugins/obs-assistant/manifest.json` 添加 `"icon": "obs.png"`。
- 在 `buildResources/plugins/obs-assistant/ui/` 目录放置同名图标文件。
- 其他内置/已安装插件按同样规范处理。

5. 验证
- 运行应用，打开插件列表，确认：
  - 图标正常显示；
  - 禁用插件时仍可加载图标（由服务器路由放行，见 `ApiServer.ts:594-604`）。
- 运行类型检查：确保新增 `icon` 字段类型通过。

## 验收标准
- 所有插件的图标在列表、详情、侧边栏均能显示；无图标时回退到默认 `t-icon`。
- 禁用插件的图标仍可显示，其余资源被拦截。
- 清单校验在图标文件缺失或扩展名非法时给出明确错误。

## 变更点
- `packages/main/src/plugins/PluginManager.ts`：`PluginManifest` 顶层新增 `icon?: string`；`validatePluginManifest()` 增加 `icon` 校验。
- `buildResources/plugins/*/manifest.json`：新增顶层 `icon` 字段；`ui/` 下放置对应文件。
