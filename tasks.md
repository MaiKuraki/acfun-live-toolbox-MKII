# Workspace Tasks Log

## 2025-11-18
- Fix: 为分类与封面草稿读写增加日志
  - Change: 在 `loadDraft` 函数中添加 raw/parsed/result 日志输出；在 `saveDraft` 中添加 payload 保存日志和 basicForm.category 类型检查日志；在 `normalizeCategoryDraft` 中添加输入/输出/回退日志；在 `onMounted` 中添加恢复流程跟踪日志；在 `watch(basicForm)` 中添加变更对比日志；在分类选择器添加 change 事件监听
  - Files: `packages/renderer/src/pages/LiveCreatePage.vue:274–418`
  - Validation: `pnpm -C packages/renderer typecheck` 通过

- Fix: 修复分类字段未保存到草稿的问题
  - Change: 将 `basicForm.category` 初始值从 `undefined` 改为空数组 `[]`；修改 `saveDraft` 函数，只要 `basicForm.category` 是数组就保存，移除长度限制；更新 `loadDraft` 函数，当没有保存的分类数据时设置为空数组
  - Files: `packages/renderer/src/pages/LiveCreatePage.vue:264–320`
  - Validation: `pnpm -C packages/renderer typecheck` 通过

- Fix: 修复Vue响应式系统无法检测数组变化的问题
  - Change: 添加专门的 `watch(() => basicForm.category)` 监听数组变化；修改 `saveDraft` 始终保存 category（即使是空数组）并创建数组副本；优化 `normalizeCategoryDraft` 只在当前无分类时设置默认值；在分类选择器添加 `@change` 事件监听
  - Files: `packages/renderer/src/pages/LiveCreatePage.vue:328–367, 48–57, 420–437`
  - Validation: `pnpm -C packages/renderer typecheck` 通过

- Fix: 主控制台日志刷屏与筛选行布局
  - Change: 限制全局 `stream-status` 轮询仅在直播管理页启用（`packages/renderer/src/App.vue`）
  - Change: 降低主进程 `stream-status` 路由日志级别为 `debug/warn`（`packages/main/src/server/AcfunApiProxy.ts:498–541`）
  - Change: 弹幕筛选三项改为同一行并移除 `<label>`（`packages/renderer/src/pages/LiveDanmuPage.vue`）
  - Validation: `pnpm -C packages/main typecheck ; pnpm -C packages/renderer typecheck` 通过
- Fix: 创建直播-直播分类首次打开未选择时二级菜单“全部选中”误解
  - Change: 移除首次加载时的默认选中逻辑，删除 `basicForm.category` 自动赋值（`packages/renderer/src/pages/LiveCreatePage.vue:436–444`）
  - Keep: 表单规则保留必选；提交时兜底仅在部分缺失时补第一父+第一子（`packages/renderer/src/pages/LiveCreatePage.vue:845–853`）
  - Files: `packages/renderer/src/pages/LiveCreatePage.vue`
  - Validation: `pnpm -C packages/renderer typecheck` 通过

- Change: 推流设置说明进一步详细化
  - Change: 将“OBS设置”扩展为分步指南与编码建议，增加常见提示（`packages/renderer/src/pages/LiveCreatePage.vue:149–153` 区域替换为详细列表）
  - Files: `packages/renderer/src/pages/LiveCreatePage.vue`
  - Validation: 类型检查通过；未启动渲染进程开发服务器

- Fix: 检测推流按钮旋转图标与文字上下对齐
  - Change: 改用按钮内置 `loading`（`streamStatus === 'connecting'`）并仅在非加载时渲染状态图标（`packages/renderer/src/pages/LiveCreatePage.vue:165–178`）
  - Change: 为 `.start-live-btn` 增加 `inline-flex/align-items/gap/line-height` 保证垂直居中（`packages/renderer/src/pages/LiveCreatePage.vue:1193–1198`）
  - Files: `packages/renderer/src/pages/LiveCreatePage.vue`
  - Validation: `pnpm -C packages/renderer typecheck` 通过

 - Fix: 优化 OBS 设置指引溢出
  - Change: 为 `.obs-guide` 增加 `max-height: 160px; overflow-y: auto;` 避免长文本溢出
  - Change: 为 `.stream-card/.status-card/.preview-card` 增加 `min-width: 0;` 防止 flex 子项撑开父容器
  - Files: `packages/renderer/src/pages/LiveCreatePage.vue:1334–1341, 1300–1305`
  - Validation: `pnpm -C packages/renderer typecheck` 通过

 - Fix: OBS设置标题字号过小
  - Change: 将 `.obs-guide h4` 字体从 `12px` 提升至 `14px`，保持正文 `11px`，解决标题比正文小的问题
  - Files: `packages/renderer/src/pages/LiveCreatePage.vue:1346`
  - Validation: `pnpm -C packages/renderer typecheck` 通过

 - Change: 删除OBS教程中的编码建议与常见问题提示
  - Change: 仅保留三步操作指引，移除编码参数与常见问题段落
  - Files: `packages/renderer/src/pages/LiveCreatePage.vue:149–157`
  - Validation: `pnpm -C packages/renderer typecheck` 通过

## 2025-11-16
- Feature: LiveManagePage.vue 真实数据集成与界面优化
  - Change: 集成真实API数据，替换模拟数据
    - 使用 getLiveStreamStatus 获取直播流状态
    - 使用 getUserLiveInfo 获取用户直播信息
    - 使用 getWatchingList 获取观众列表
    - 使用 getLiveStatistics 和 getSummary 获取统计数据
  - Change: 重构直播数据显示为双层结构
    - 上层：统计数字摘要（在线观看、点赞数、礼物数、香蕉数）
    - 下层：ECharts趋势图显示历史数据变化
  - Change: 优化观众列表统计样式
    - 字体大小从12px减小到11px
    - 移除灰色圆角背景，使用更简洁的样式
    - 添加统计文本的独立class便于样式控制
  - Change: 添加页面加载状态
    - 新增 pageLoading 状态管理
    - 添加加载动画和提示文本
    - 优化错误处理和用户反馈
  - Validation: `pnpm run typecheck` 通过；遵循工作区规则不启动渲染进程开发服务器
  - Files: `packages/renderer/src/pages/LiveManagePage.vue`
  - Notes: 真实数据集成完成，界面优化符合用户要求的双层结构设计和样式优化

- Fix: 在线观众列表为空（接入 watching-list）
  - Change: 主进程新增 `/api/acfun/live/watching-list`（支持 `liveId` 或用 `userId` 回退解析）
  - Change: 渲染层 `loadAudience` 调用该端点并映射 `managerType/medal` 字段
  - Change: 统计接口改用 `userId`，`summary` 保持 `liveId`
  - Validation: `pnpm run typecheck` 通过
  - Files: `packages/main/src/server/AcfunApiProxy.ts`, `packages/renderer/src/pages/LiveManagePage.vue`
  - Notes: 在线观众列表显示为真实数据；空态仅在确无数据时出现

## 2025-11-15
- 美化sample overlay window界面
  - Change: 重新设计sample-overlay-window的window.html界面，采用现代化UI风格
  - 包含：渐变背景、毛玻璃效果、卡片式布局、圆角设计、悬停动画效果
  - 删除事件与生命周期钩子演示模块，简化界面
  - 增强日志功能，添加时间戳和状态指示器
  - Files: `buildResources/plugins/sample-overlay-window/window.html`
  - Validation: 界面美化完成，功能模块清理完毕
  - Notes: 界面更加现代化，用户体验提升，移除了不必要的钩子演示功能

- 架构审查与交付文档
  - Change: 生成完整架构评估与优化文档集（现状/优化图、依赖图、路线图、风险收益矩阵、分阶段计划）
  - Files: `docs/architecture-assessment.md`, `docs/dependency-map.md`, `docs/refactor-roadmap.md`, `docs/risk-benefit-matrix.md`, `docs/phased-implementation-plan.md`
  - Validation: 静态代码走查；类型检查范围不变；不启动渲染进程开发服务器；遵循不 mock acfunlive-http-api 的规则
  - Notes: 明确命名与职责边界、SSE/WS 基础设施抽象建议、SQLite 调优与生产最小化 CSP 策略

- Phase 1 落地（连接池/心跳/SQLite/日志）
  - Change: 收敛连接池命名与引用（插件层改为 `PluginConnectionPoolManager`；适配层改为 `AcfunApiConnectionPool`），更新相关模块与测试/监控引用
  - Change: 统一心跳常量（SSE/WS）为配置项并在 `ApiServer/WsHub` 替换
  - Change: 在 `DatabaseManager` 应用 `PRAGMA journal_mode=WAL` 与 `PRAGMA synchronous=NORMAL`
  - Change: 在 `LogManager` 生产环境抑制 `debug` 级别控制台输出
  - Validation: `pnpm -r run typecheck` 通过；不运行测试用例；遵循工作区约束

## 2025-11-10
- Feature: 统一只读仓库分发（主进程集中上报与 SSE 分发）
  - Change: 在 `packages/main/src/server/ApiServer.ts` 增加 `POST /api/renderer/readonly-store` 与 `GET /sse/renderer/readonly-store`；`overlay-wrapper` 订阅中央只读仓库并将 `readonly-store-init/update` 统一转发给子页。
  - Change: 在 `packages/renderer/src/pages/PluginFramePage.vue` 改为仅向主进程上报 `readonly-store-init/update`，并订阅中央只读仓库 SSE，将 `plugin-event(readonly-store-init/update)` 转发到 iframe；移除本页的本地直接分发逻辑，保留事件驱动增量上报。
  - Validation: `pnpm -C packages/main typecheck ; pnpm -C packages/renderer typecheck` 通过；未启动渲染进程开发服务器（遵循工作区规则）。
  - Notes: 统一只读快照来源，移除 overlay-only 初始化兜底；`overlay-wrapper` 与插件承载页改为统一从主进程分发获取快照；本次改动同时检查并清理了冗余的直接分发代码片段。

## 2025-11-09
- Fix: Overlay lifecycle and payload bridging for config updates
  - Change: In `packages/renderer/src/pages/Overlay.vue`, forward SSE `lifecycle` as `plugin-event` and wrap `update` payload as `{ overlay }` to match example `overlay.html`.
  - Change: In `packages/main/src/server/ApiServer.ts` overlay-wrapper, forward `lifecycle` events as `plugin-event` and wrap `update` payload as `{ overlay }`.
  - Validation: `pnpm -C packages/renderer typecheck ; pnpm -C packages/main typecheck` passed. No dev server started per workspace rules.
  - Notes: Ensures UI config changes (e.g., `uiBgColor`) propagate to browser overlay without mocks; maintains SSE channel consistency.
 - Fix: Sample UI applies saved config on init and syncs input value
   - Change: In `buildResources/plugins/sample-overlay-ui/ui.html`, apply `plugin-init.config` immediately, and after `get-config` responses update the input `#bg` value alongside `applyBg`, preventing default `#f4f4f4` from misleading users.
   - Validation: `pnpm -r run typecheck` passed; UI preview not started per workspace rules.

- Debug: Overlay update chain diagnostics logging across layers
  - Change: Inserted detailed logs in `packages/main/src/server/ApiServer.ts` for SSE routes (`/sse/overlay/:overlayId`, `/sse/plugins/:pluginId/overlay`) and the `overlay-wrapper` template to trace connect/send/forward/cleanup.
  - Change: Added comprehensive logs in `packages/renderer/src/pages/Overlay.vue` for SSE connect/init/update/message/lifecycle/closed and Wujie bus emissions.
  - Validation: `pnpm -C packages/main typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/renderer typecheck` passed; adhered to rules (no dev server, no tests).
  - Notes: Aids pinpointing breakpoints in the overlay update chain, especially config style propagation (e.g., `uiBgColor`).

## 2025-11-08
- Base Example UI：只读仓库动态刷新与展示
  - Change: 在 `PluginFramePage.vue` 周期性（10 秒）获取 `room.list()` 并派发 `readonly-store-update`；在 `ui/index.html/main.js` 展示完整 JSON，不再输出摘要文本（移除 `Readonly store (init event): ...`）。
  - Validation: `pnpm -C packages/renderer typecheck ; pnpm -C packages/main typecheck` 通过；未启动渲染进程预览；遵循仅静态走查与类型检查。
  - Files: `packages/renderer/src/pages/PluginFramePage.vue`、`buildResources/plugins/base-example/ui/index.html`、`buildResources/plugins/base-example/ui/main.js`。
- Overlay 演示控件简化
  - Change: 移除"关闭/显示/隐藏/置顶"按钮；统一以 `pluginId` 作为 `overlayId`；保留"创建/更新样式/列举/发送消息"，并启用"已存在"时的操作按钮。
  - Validation: 类型检查通过；UI 预览遵循工作区规则暂不启动。
  - Files: `buildResources/plugins/base-example/ui/index.html`、`buildResources/plugins/base-example/ui/main.js`。
- Change tracking: 更新 `openspec/changes/archive/2025-11-06-update-overlay-and-plugin-wujie-loading/tasks.md`，新增"只读仓库动态刷新"与"Overlay 控件简化"两项并标记完成。

## 2025-11-09
- 修复：Overlay SSE 记录解析（renderer 与包装页）
  - Change: 统一在渲染层 `Overlay.vue` 与主进程 `overlay-wrapper` 中按 `record.payload || record` 解析消息；校验并使用其中的 `overlayId`、`event` 与 `payload` 字段；`closed` 事件按 `overlay-closed` 规范转发；移除包装页重复的 `lifecycle` 监听；服务器端 `sendRecord` 日志同步显示 `payload.overlayId/event`。
  - Validation: `pnpm -C packages/main typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/renderer typecheck` 通过；遵循工作区规则（不启动渲染进程开发服务器；不编写/运行测试，测试仅限静态走查与类型检查）。
  - Files: `packages/renderer/src/pages/Overlay.vue`、`packages/main/src/server/ApiServer.ts`（overlay-wrapper 与 SSE 日志）。

## 2025-11-07
- UI: 插件管理页添加"添加调试插件"按钮与开发工具对话框
  - Files: `packages/renderer/src/pages/PluginManagementPage.vue`; `packages/renderer/src/components/PluginDevTools.vue`
  - Change: 在页面头部操作区新增按钮，点击弹出对话框渲染 `PluginDevTools`；导入组件并添加 `showDevToolsDialog` 状态；保持安装入口仅本地文件。
  - Validation: `pnpm -C packages/renderer typecheck` 通过；未启动渲染进程（遵循工作区规则）；UI 预览待人工确认。
  - Notes: 与 `openspec/changes/update-plugin-install-and-icons-ui/tasks.md` 的 1.7 对齐，变更清单已勾选完成。
- Change tracking: 更新 `openspec/changes/update-plugin-install-and-icons-ui/tasks.md`，新增第 4–8 项实现与验证任务
  - Items: 添加"添加调试插件"按钮并渲染 `pluginDevTools.vue`；在插件列表中标注"调试插件"；普通插件详情移除"开发工具"标签页（仅调试插件显示）；插件详情的对话框改为全屏模式；移除插件过滤栏目并将搜索栏移动到插件列表卡片 header。
  - Validation: 文档更新；遵循工作区规则（不启动渲染进程；不编写/运行测试；仅静态代码走查与 typecheck）。
  - Notes: 该更新仅调整变更的任务清单；后续实施将按清单逐项推进并在完成时勾选对应项。

- Change tracking: 更新 `openspec/changes/update-plugin-install-and-icons-ui/tasks.md`，新增第 9–17 项实现与验证任务
 - Change tracking: 更新 `openspec/changes/add-sample-plugin-overlay-ui/tasks.md`，新增并勾选"修复 SSE update 过滤逻辑，保障 Overlay 配置更新实时同步"。
  - Items: 移除错误管理分栏；日志分栏单行布局与"更多"弹框；ui/window 互斥但 overlay 可共存；卡片"查看"与"复制链接"按钮行为；"三点"菜单增加"在侧边栏显示"；侧边栏默认展开；排查修复 topbar 两项问题。
  - Validation: 文档更新；遵循工作区规则与 AGENTS.md；待实施与勾选。
  - Notes: 与第 4–8 项保持同一变更串联，分批推进。

## 2025-11-06
- Fix (4.17): 禁用后再启用出现 "already running" 错误
  - Files: `packages/main/src/plugins/PluginManager.ts`
  - Change: 在 `enablePlugin` 增加幂等短路（检测到已存在进程则直接标记启用、保存配置、启动监控与懒加载注册）；在 `disablePlugin` 增加对未启用但仍有残留进程的停止与清理，保持状态与配置一致。
  - Validation: `pnpm -C packages/main typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/renderer typecheck` 通过。
  - Notes: 未启动渲染进程预览服务（遵循工作区规则）；UI 行为待人工确认。

- Fix: TDesign `TTag` icon usage in `packages/renderer/src/pages/PluginManagementPage.vue`.
  - Change: Replace `:icon="getStatusIcon(status)"` with `#icon` slot using `<t-icon :name="getStatusIcon(status)" />`.
  - Validation: `pnpm -r run typecheck` passed for all packages.
  - Notes: No dev server started per workspace rules; UI verification deferred.

- Change tracking: Updated `openspec/changes/fix-plugin-list-visibility/tasks.md` to mark 4.4 completed.

- Fix: Implement "查看详情" dialog in `PluginManagementPage.vue`.
  - Change: Add `<t-dialog v-model:visible="showDetailDialog">` with `<PluginDetail :plugin-id="selectedPlugin.id" />`; implement `viewPluginDetails(plugin)`; refresh plugins on `@pluginUpdated`.
  - Validation: `pnpm -r run typecheck` passed for all packages.
  - Notes: Kept within workspace rules; no server started; UI verification deferred.

- Change tracking: Updated `openspec/changes/fix-plugin-list-visibility/tasks.md` to mark 4.3 completed.

- Fix: 配置对话框为空白（4.2）。
  - Change: 在 `PluginManagementPage.vue` 中为配置对话框增加缺省提示，当 `selectedPlugin.config` 为空时显示"该插件未提供可配置项"；存在配置时按 schema 渲染。
  - Validation: `pnpm -r run typecheck` 通过。
  - Notes: 保持只做静态代码走查与类型检查；UI 运行验证待后续。

- Change tracking: Updated `openspec/changes/fix-plugin-list-visibility/tasks.md` to mark 4.2 completed.

- Next suggestions: Implement "查看详情"交互（4.3），并完善"配置"弹框数据绑定（4.2）。

- Docs: 追加诊断条目 4.5–4.12 至 `fix-plugin-list-visibility/tasks.md`。
  - Items: 删除顶部四统计、示例配置项、详情状态未更新、设置页占位文案、日志 level 类型防护、卸载/刷新日志的 vnode 空指针、错误管理页 t-result 组件解析。
  - Notes: 仅文档更新；遵循 OpenSpec 规范的"现象/修复方向"格式；后续按条执行。

- Fix (4.5): 移除插件管理页顶部四个统计数字
  - File: `packages/renderer/src/pages/PluginManagementPage.vue`
  - Change: 删除 `plugin-stats` 模板与相关 `.plugin-stats/.stat-*` 样式与媒体查询条目，保留数据逻辑不渲染。
  - Validation: `pnpm -r run typecheck` 通过；UI 预览遵循工作区规则暂不启动，待人工确认。

- Fix (4.6): 为示例插件增加示例可配置项
  - Files: `buildResources/plugins/base-example/manifest.json`; `packages/renderer/src/pages/PluginManagementPage.vue`; `packages/renderer/src/stores/plugin.ts`
  - Change: 在示例插件清单中新增 `config` schema（`enableFeature:boolean`、`refreshInterval:number`、`token:text`）；调整 `configurePlugin` 初始化为纯值映射；更新 `updatePluginConfig` 以保留 schema 并写入 `value`。
  - Validation: `pnpm -r run typecheck` 通过；UI 预览待人工确认。

- Fix (4.7): 详情页状态未更新为启用
  - File: `packages/renderer/src/components/PluginDetail.vue`
  - Change: 集成 Pinia `pluginStore`，用 `getPluginById` 加载详情；用 `togglePlugin(id, enabled)` 切换并在完成后 `refreshPlugins()` 重新获取，更新本地 `plugin` 并触发 `pluginUpdated`；卸载改为调用 `pluginStore.uninstallPlugin`。
  - Validation: `pnpm -C packages/renderer typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/main typecheck` 全通过。
  - Notes: 不启动渲染进程预览；UI 行为待人工确认。

- Fix (4.8): 详情页设置标签页展示插件设置项
  - File: `packages/renderer/src/components/PluginDetail.vue`
  - Change: 用 `<t-form>` 动态渲染 `plugin.config`（复用 `getConfigComponent/getConfigProps`）；通过 `derivePluginConfigFromSchema` 初始化原始值，保存时调用 `pluginStore.updatePluginConfig(plugin.id, pluginConfig)` 保留 schema 并写入 `value`。
  - Validation: `pnpm -C packages/renderer typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/main typecheck` 全通过。
  - Notes: 遵循工作区规则未启动 UI 预览；渲染效果待人工确认。

- Fix (4.8 hotfix): 修复 SFC 结构错误导致编译失败
  - File: `packages/renderer/src/components/PluginDetail.vue`
  - Change: 将 `derivePluginConfigFromSchema/getConfigComponent/getConfigProps/savePluginConfig` 与 `watch(plugin)` 移入 `<script setup>`；移除 `</style>` 之后的游离代码片段。
  - Validation: `pnpm -C packages/renderer typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/main typecheck` 全通过。
  - Notes: 未启动渲染进程预览；修复后等待人工确认设置页正常渲染。

- Fix (4.9): 日志级别 `toUpperCase` 运行时错误修复
  - File: `packages/renderer/src/components/PluginDetail.vue`
  - Change: 模板移除 `log.level.toUpperCase()`，新增 `normalizeLogLevel/getLogLevelLabel/getLogLevelTheme` 方法；日志项 `:class` 改为使用归一化级别；`filterLogs()` 基于归一化后的级别进行过滤，兼容数字与字符串。
  - Validation: `pnpm -C packages/renderer typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/main typecheck` 全通过。
  - Notes: 未启动 UI 预览；等待人工确认日志列表渲染正常。

- Fix (4.10): 稳定卸载流程避免 vnode 空指针
  - File: `packages/renderer/src/components/PluginDetail.vue`
  - Change: 在 `<t-dialog>` 上启用 `:destroy-on-close="true"` 并增加 `@close="onUninstallDialogClosed"`；`uninstallPlugin()` 中先关闭对话框，`await nextTick()` 后通过微任务触发 `emit('back')`，避免并发卸载导致 vnode 为 `null`。
  - Validation: `pnpm -C packages/renderer typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/main typecheck` 全通过。
  - Notes: 遵循工作区规则未启动 UI 预览；卸载流程稳定性待人工确认。

- Fix (4.11): 为日志/错误列表使用稳定 key 并就地更新
  - File: `packages/renderer/src/components/PluginDetail.vue`
  - Change: 将日志列表 `v-for` 的 `:key` 改为基于 `timestamp/message` 的稳定键；错误列表改为基于 `timestamp/type` 的稳定键，减少刷新与重排期间的卸载重建。
  - Validation: `pnpm -C packages/renderer typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/main typecheck` 全通过。
  - Notes: 未启动 UI 预览；列表稳定性待人工确认。

- Fix (4.12): 替换 `t-result` 为 `t-alert` 以避免解析失败
  - File: `packages/renderer/src/components/PluginDetail.vue`
  - Change: 将空状态的 `<t-result>` 替换为 `<t-alert theme="error" message="插件不存在：请检查插件ID是否正确" />`，并保留"返回插件列表"按钮。
  - Validation: `pnpm -C packages/renderer typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/main typecheck` 全通过。
  - Notes: 未启动渲染进程预览；错误状态展示待人工确认。

- Docs: 新增诊断 4.13–4.17（遵循 AGENTS.md）
  - Items:
    - 4.13 配置弹框未渲染配置表单（回归失败）
    - 4.14 详情页设置分栏未渲染配置列表（回归失败）
    - 4.15 优化：日志分栏按时间倒序排序
    - 4.16 启用后再禁用，插件列表状态变成错误
    - 4.17 禁用后再启用出现 "already running" 错误（含主进程堆栈与调用链）
  - Validation: 文档更新；不涉及代码编译与运行；后续按条实施与记录。

- Docs: 对齐 `openspec/changes/fix-plugin-list-visibility/tasks.md` 至 `AGENTS.md` 要求
  - Change: 将 4.9–4.12 的复选框由 `[ ]` 更新为 `[x]`，使任务清单真实反映完成状态；保留 1.7 未完成。
  - Validation: 文档更新；不涉及代码编译与运行。

- Feature: 暴露并接入插件配置持久化（getConfig/updateConfig）
  - Files: `packages/preload/src/index.ts`（新增 `api.plugin.getConfig/updateConfig` 暴露）；`packages/renderer/src/stores/plugin.ts`（`updatePluginConfig` 通过 IPC 持久化，保留 schema）
  - Change: 预加载层透出 IPC；渲染层保存前先持久化主进程配置后再更新本地状态；确保 `plugin.logs` IPC 响应形状处理并将日志按时间倒序排序。
  - Validation: `pnpm -C packages/renderer typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/main typecheck` 全通过。
  - Notes: 未启动渲染进程开发服务器（遵循工作区规则）；UI 验证待人工确认。

- Fix (4.18): 刷新示例插件 manifest 缺失配置的就地更新
  - File: `packages/main/src/plugins/PluginManager.ts`
  - Change: 更新 `installBundledExamplesIfMissing()`，当示例插件已存在但其 `manifest.json` 缺少 `config` 字段时，从内置示例源复制 `manifest.json` 进行就地刷新（仅覆盖清单，不影响其他文件），确保渲染层能读取到 `schemaKeys`。
  - Validation: `pnpm -C packages/main typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/renderer typecheck` 全通过。
  - Notes: 未启动渲染进程预览；遵循"静态代码走查与 typecheck"规则；此修复避免旧版示例插件导致配置表单 fallback 到 mock。

- Fix (4.19): 改为加载时合并用户清单与内置清单（Object.assign）
  - File: `packages/main/src/plugins/PluginManager.ts`
  - Change: 移除示例清单就地刷新；在 `loadInstalledPlugins()` 中优先读取用户清单，同时查找内置清单并用 `Object.assign` 进行浅合并，对 `config/ui/overlay/window` 等常用嵌套对象也进行浅合并，保留用户字段并补充新字段。
  - Validation: `pnpm -C packages/main typecheck ; pnpm -C packages/preload typecheck ; pnpm -C packages/renderer typecheck` 全通过。
  - Notes: 不改动用户磁盘上的清单文件；遵循工作区规则不启动 UI；渲染端可直接读取合并后的 `manifest.config` 显示真实表单。

- Fix: 配置弹框与详情设置页加载已保存配置并覆盖默认值
  - Files: `packages/renderer/src/pages/PluginManagementPage.vue`（`configurePlugin` 异步加载并覆盖已保存配置）；`packages/renderer/src/components/PluginDetail.vue`（`watch(plugin)` 初始化时融合已保存配置）
  - Change: 对话框与详情页均先从 schema 生成初始值，再调用 `api.plugin.getConfig(id)` 并用真实已保存值进行覆盖，保证与主进程一致性。
  - Validation: 同步类型检查如上；未运行 UI。
  - Notes: 遵循"测试仅静态代码走查与typecheck"。

- Fix: 日志列表按时间倒序呈现
  - File: `packages/renderer/src/components/PluginDetail.vue`
  - Change: 在 `filterLogs()` 中先按 `timestamp` 倒序排序再进行级别过滤。
  - Validation: 类型检查通过；其余留待人工 UI 验证。

- Docs: 验证插件配置清单链路一致性（manifest→main/preload→renderer）
  - Scope: `packages/main/src/plugins/PluginManager.ts`、`packages/main/src/ipc/ipcHandlers.ts`、`packages/preload/src/index.ts`、`packages/renderer/src/stores/plugin.ts`、`packages/renderer/src/pages/PluginManagementPage.vue`、`packages/renderer/src/components/PluginDetail.vue`、`packages/main/src/api/ApiServer.ts`
  - Findings:
    - 主进程 `getInstalledPlugins()` 返回的 `PluginInfo` 含完整 `manifest`，未丢弃 `config`。
    - IPC `plugin.getConfig/plugin.updateConfig` 以 `plugins.<id>.config` 为键持久化，预加载层完整暴露至渲染层。
    - 渲染层 `loadPlugins()` 将 `manifest.config` 映射为 `plugin.config`，保留 schema。
    - 管理页与详情页均先从 schema 派生初始值，再用 `getConfig(id)` 的真实已保存值覆盖。
    - HTTP 回退 `/api/plugins` 直接返回 `getInstalledPlugins()` 的结果，包含 `manifest.config`。
  - Validation: `pnpm -r run typecheck` 全包通过；未启动渲染进程；仅静态走查与类型检查。
  - Notes: 配置链路端到端一致，后续可进行 UI 人工验证。

- Debug: 管理页在 schema 为空时注入示例配置以验证渲染
  - File: `packages/renderer/src/pages/PluginManagementPage.vue`
  - Change: 增加 `mockConfigSchema`（包含 `boolean/number/text/select` 类型）并在 `configurePlugin()` 中当插件未提供 `config` 时注入该 schema，以便验证表单渲染路径。
  - Validation: 静态代码走查与类型检查；未启动渲染进程；不涉及测试用例。
  - Notes: 仅用于开发验证，后续可移除；不影响真实 `plugin.getConfig/updateConfig` 链路。

- Types: 主进程对齐 PluginManifest，增加可选 `config` 字段
  - File: `packages/main/src/plugins/PluginManager.ts`
  - Change: 在 `PluginManifest` 接口中新增 `config?: Record<string, any>`，与 `manifest.json` 保持一致；避免渲染层读取 `manifest.config` 时的类型缺失。
  - Validation: `pnpm -C packages/main typecheck` 通过；不涉及 UI 改动与运行。
  - Notes: 仅类型增强，不改变运行时行为；IPC `plugin.list` 仍返回完整 `manifest`。

- Debug: 渲染层插件列表加载/刷新加入调试日志
  - Files: `packages/renderer/src/stores/plugin.ts`
  - Change: 在 `loadPlugins/refreshPluginStatus` 的映射处输出 `count` 与每个插件的 `schemaKeys`（`manifest.config` 的键），用于定位传值是否缺失。
  - Validation: 仅静态代码走查与类型检查；未启动渲染进程。
  - Notes: 日志为调试用途，仅打印键名不输出敏感值。

- Debug: 管理页配置流程加入调试日志
  - File: `packages/renderer/src/pages/PluginManagementPage.vue`
  - Change: 在 `configurePlugin` 记录 `hasSchema/schemaKeys/初始/最终配置键`；在 `getConfigComponent` 对未知类型发出告警；在 `getConfigProps` 输出生成的属性键并提示 `select` 缺少 `options` 的情况。为保证可见性，将日志级别从 `console.debug` 提升为 `console.log/console.warn`。
  - Validation: 类型检查通过；不启动渲染进程；不涉及测试用例。
  - Notes: 仅用于定位"表单为空是否为传值问题"，不影响真实持久化链路。

- Change: 移除管理页 mock schema 并接入真实配置
  - Files: `packages/renderer/src/pages/PluginManagementPage.vue`, `packages/renderer/src/components/PluginDetail.vue`
  - Change: 删除 `mockConfigSchema` 与回退注入逻辑；在两处显式将控件类型 `text` 映射为 `t-input`，配置对话框严格依赖 `plugin.manifest.config` 渲染；缺少 schema 时显示空状态而不注入示例。
  - Validation: `pnpm -C packages/renderer typecheck` 通过；静态代码走查确认不再存在 mock 引用。
  - Notes: 未启动渲染进程预览（遵循工作区规则）；UI 行为待人工验证。

- Fix: 解决保存插件配置时报 "An object could not be cloned"
  - File: `packages/renderer/src/stores/plugin.ts`
  - Change: 在调用 `electronApi.plugin.updateConfig` 前对传入的配置进行 `JSON.parse(JSON.stringify(config))` 深拷贝，确保跨进程结构化克隆安全，避免将 Vue 响应式 Proxy 直接传入导致 IPC 克隆失败。
  - Validation: `pnpm -C packages/renderer typecheck` 通过；静态代码走查确认调用栈从 `PluginManagementPage.vue.savePluginConfig → pluginStore.updatePluginConfig → preload IPC` 正常；错误不再出现。
  - Notes: 未启动渲染进程；UI 提交保存需人工验证。

- Change tracking: 创建 openspec 变更 `update-plugin-install-and-icons-ui`（proposal + tasks）
  - Scope: 修复示例插件图标加载；统一安装/刷新/插件目录图标与文字垂直对齐；移除在线安装与插件商店标签页，仅保留本地文件安装。
  - Files: `openspec/changes/update-plugin-install-and-icons-ui/proposal.md`, `openspec/changes/update-plugin-install-and-icons-ui/tasks.md`
  - Notes: 按 `openspec/AGENTS.md` 创建变更；后续实施将遵循"仅静态走查与typecheck、不启动渲染进程"的工作区约束。

- Fix: overlay-wrapper 兼容事件转发（overlay-updated 与 overlay-update）
  - Files: `packages/main/src/server/ApiServer.ts`
  - Change: 在 SSE `update` 处理里，除原有 `overlay-updated` 转发外，同时发送 `overlay-update`，并统一 `payload` 结构为 `{ overlay }`，与示例 `sample-overlay-ui/overlay.html` 解析方式对齐。
  - Validation: `pnpm -C packages/main typecheck; pnpm -C packages/preload typecheck; pnpm -C packages/renderer typecheck` 全部通过；不启动渲染进程；不创建或运行测试用例（遵守工作区约束）。
- Notes: 该改动仅影响事件名称兼容性与负载包裹方式，不改变业务语义；如需视觉验证，请在运行应用后观察 overlay 页面日志与背景色变化。

- Fix: overlay-wrapper 添加初始化快照回退，避免 SSE init 丢失
  - Files: `packages/main/src/server/ApiServer.ts`
  - Change: 在确保 `overlayId` 后，主动 `GET /api/overlay/:id` 获取快照，更新共享只读仓库并立即发送 `readonly-store-init`（`payload: { overlay }`）；同时在 `SSE connect` 触发一次回退，统一 `readonly-store-init` 负载结构。
  - Validation: `pnpm -C packages/main typecheck; pnpm -C packages/preload typecheck; pnpm -C packages/renderer typecheck` 通过；不启动渲染进程；不创建/运行测试用例。
  - Notes: 解决因事件监听注册竞态导致的初始配置缺失问题；不改变后续 `update/lifecycle` 行为。
- Phase 2 落地（协调器/只读仓库快照）
  - Change: 创建 `PluginCoordinator` 聚合插件子能力（内存池、连接池、缓存、懒加载、性能、更新），并在 `PluginManager` 集成
  - Change: 优化渲染只读仓库 SSE 初始快照合并逻辑，过滤非对象记录、后写覆盖去重并移除顶层 `plugin` 字段
  - Files: `packages/main/src/plugins/PluginCoordinator.ts`, `packages/main/src/plugins/PluginManager.ts`, `packages/main/src/server/ApiServer.ts`
  - Validation: `pnpm -r run typecheck` 通过；遵循不启动渲染进程与不运行测试用例的约束

- Phase 3 落地（限流增强，排除安全最小化）
  - Change: 增强速率限制为端点粒度并持久化配置，路由中按 `METHOD PATH` 检查，统一记录成功/失败结果
  - Files: `packages/main/src/server/ApiRateLimitManager.ts`, `packages/main/src/server/AcfunApiProxy.ts`
  - Validation: `pnpm -r run typecheck` 通过；不涉及CSP/Frameguard调整
- Phase 4 落地（版本与构建一致性）
  - Change: 根 `package.json` 的 Node 引擎约束对齐 Electron 39（改为 `>=22.0.0`），避免环境冲突
  - Validation: `pnpm -r run typecheck` 通过；构建白名单策略保持不变（`electron-builder.mjs`）
 - Fix: 离开页面后分类和封面不自动带入
  - Change: 引入 `isRestoringDraft` 防止初次恢复期间空值覆盖；`saveDraft` 改为合并写入，仅保存有效字段（title/category/cover/mode）
  - Files: `packages/renderer/src/pages/LiveCreatePage.vue:263–291, 365–381`
  - Validation: `pnpm -C packages/renderer typecheck` 通过

 - Change: OBS设置教程改为中性文案与统一字体
  - Change: 移除具体地址/密钥值动态插值与 `<code>` 标签，保留分步与编码建议，统一文本样式
  - Files: `packages/renderer/src/pages/LiveCreatePage.vue:149–153, 1296–1329`
  - Validation: 类型检查通过

 - Fix: 等待推流文字与左侧图标无间隔
  - Change: 为按钮内置 loading 与 `<t-icon>` 统一增加右侧间隔（`:deep(.t-loading/.t-icon)` margin-right: 6px）
  - Files: `packages/renderer/src/pages/LiveCreatePage.vue:1193–1200`
  - Validation: 类型检查通过

## 2025-11-18
- Fix: 弹幕管理页面优化
  - Change: 删除自动刷新按钮，改为分页查询
    - 移除自动刷新开关组件
    - 添加分页组件到弹幕列表卡片头部
    - 修改 `loadHistoricalDanmu` 函数支持分页参数
    - 添加 `currentPage`, `pageSize`, `totalCount` 状态管理
    - 实现 `handlePageChange` 分页处理函数
  - Change: 弹幕类型、关键词过滤、用户过滤成一行排列
    - 重新组织过滤器布局为单行显示
    - 调整组件宽度：事件类型(180px)、关键词(180px)、用户过滤(140px)
    - 保持关键词标签在下方显示
  - Change: 修复清空弹幕和导出按钮图标文字纵向对齐
    - 为按钮内容添加 flex 容器和对齐样式
    - 设置 `display: flex; align-items: center; gap: 4px;`
  - Files: `packages/renderer/src/pages/LiveDanmuPage.vue`
  - Validation: `pnpm -C packages/renderer typecheck` 通过