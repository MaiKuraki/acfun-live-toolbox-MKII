## 待修复问题与根因
- Window 页面出现两个 Topbar 且带侧边栏：路由 `#/plugins/:plugname/window` 由独立窗口加载的是整套应用布局（Topbar+Sidebar）再渲染 `WindowFramePluginPage.vue` 自带简版 Topbar，造成重复。位置：`packages/renderer/src/layouts/LayoutShell.vue:4-15`、`packages/renderer/src/pages/WindowFramePluginPage.vue:1-29`。
- Window 内按钮会开新窗口而非在主窗口弹提示：`WindowFramePluginPage.vue` 已桥接 Wujie bus 到 `GlobalPopup`，但 `GlobalPopup.ts` 对 TDesign 的插件 API 使用不当，导致行为与类型报错。位置：`packages/renderer/src/services/globalPopup.ts:1-83`。
- 插件详情页“取消/确认”需改为单一“返回”：当前详情使用 `t-dialog` 默认 footer，需自定义只保留“返回”。位置：`packages/renderer/src/pages/PluginManagementPage.vue:283-298` 与 `components/PluginDetail.vue`。
- Window 插件没有 overlay 却仍显示“复制链接”：前端逻辑对 `overlay` 缺失仍构造默认 `overlay.html`，应严格基于清单是否声明 overlay。位置：`packages/renderer/src/stores/plugin.ts:639-648`、`packages/renderer/src/pages/PluginManagementPage.vue:164-181, 427-437`。
- 有“导出配置”但无“导入配置”：需要补充导入，并写入主进程持久化。位置：`packages/renderer/src/pages/PluginManagementPage.vue:570-597` 菜单与 `stores/plugin.ts` 的 `updateConfig`。
- `<t-icon name="plugin">` 不显示图标：未引入 TDesign 图标资源，`<t-icon>` 生成 `<svg><use href="#t-icon-plugin">` 但 sprite 未注入。位置：`packages/renderer/package.json`、入口文件 `main.ts` 或 `App.vue`。

## 变更方案
1) 为插件窗口提供“极简布局”
- 在路由为 `'/plugins/:plugname/window'` 时隐藏应用级 Topbar 与 Sidebar，仅渲染内容区域。
- 做法：在 `router.ts` 为该路由添加 `meta: { layout: 'window' }`；在 `layouts/LayoutShell.vue` 使用 `useRoute()`，根据 `route.meta.layout === 'window'` 条件渲染：
  - 隐藏 `<Topbar/>` 与 `<Sidebar/>`；保留 `<RouterView/>`。
- 保留 `WindowFramePluginPage.vue` 的简版 Topbar，用作窗口专用控制。

2) 修正 GlobalPopup 以在主窗口弹出
- `MessagePlugin.info`：改为对象形式 `MessagePlugin.info({ content, duration })`，避免类型错误。
- `DialogPlugin.alert/confirm`：返回 `DialogInstance`，关闭应调用 `.hide()` 或 `.destroy()` 而不是当作函数调用。
- 维持节流与并发锁，确保多个窗口上下文下的弹窗都在主渲染进程集中显示。

3) 插件详情对话框仅保留“返回”按钮
- 在 `PluginManagementPage.vue` 的详情 `t-dialog` 设置 `:footer="false"` 并在 `PluginDetail` 内（或对话框 header 区）提供一个“返回”按钮，触发 `@back` 关闭。
- 或者在 `t-dialog` 的 `#footer` 插槽中只渲染一个“返回”。

4) 严格控制“复制链接”按钮显示
- 在 `stores/plugin.ts:getPluginOverlayUrl` 当 `conf.overlay` 为 `null/undefined` 时直接返回 `null`，不再调用 `buildPluginPageUrl`；使 `canCopyOverlay` 返回 `false`。
- 保留现有的禁用态与异步预解析保护。

5) 增加“导入配置”
- 在 `getPluginMenuOptions` 增加“导入配置”菜单项：打开文件对话框，读取 JSON，`window.electronApi.plugin.updateConfig(pluginId, parsed)` 写入；成功后刷新并提示。
- 在后端已存在 `plugin.updateConfig` IPC，沿用即可。

6) 引入并注册 TDesign 图标资源
- 安装 `tdesign-icons-vue-next` 依赖，并在渲染入口（如 `main.ts`）全局注册或引入 iconfont 资源（按 TDesign 官方指南），确保 `<t-icon name="...">` 可用。
- 替换个别手写 `<svg><use>` 引用为 `<t-icon>` 组件，统一风格。

## 验证与回归
- 启动开发模式，打开插件窗口：应仅见简版 Topbar，无侧边栏；点击 3 个按钮在主窗口弹出 Toast/Alert/Confirm。
- 在插件管理页：无 overlay 的插件不显示“复制链接”；详情页对话框仅有“返回”。
- 导入配置后与导出内容一致，可通过 `plugin.getConfig` 验证。
- 图标正常显示，不再出现空的 `<use href="#t-icon-plugin">`。

## 涉及文件
- `packages/renderer/src/layouts/LayoutShell.vue`
- `packages/renderer/src/pages/WindowFramePluginPage.vue`
- `packages/renderer/src/pages/PluginManagementPage.vue`
- `packages/renderer/src/stores/plugin.ts`
- `packages/renderer/src/services/globalPopup.ts`
- `packages/renderer/src/router.ts`
- `packages/renderer/src/main.ts` 或入口文件（引入图标）
- `packages/renderer/package.json`（添加 icons 依赖）

如确认，开始按上述步骤修改并提交验证。