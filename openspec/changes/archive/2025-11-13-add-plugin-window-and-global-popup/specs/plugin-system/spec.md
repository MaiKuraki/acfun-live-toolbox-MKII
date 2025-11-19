# ADDED Requirements — 插件窗口能力

## 需求：插件窗口与清单字段
- 系统 SHALL 支持为插件打开独立 OS 窗口；窗口尺寸与行为由插件 `manifest.window` 定义。
- `manifest.window` 字段建议包含：
  - `width` (number): 窗口宽度（必填）
  - `height` (number): 窗口高度（必填）
  - `resizable` (boolean): 是否允许调整大小（默认 true）
  - `minimizable` (boolean): 是否允许最小化（默认 true）
  - `maximizable` (boolean): 是否允许最大化（默认 true）
  - `frameless` (boolean): 是否无边框（默认 false）

#### Scenario: 定义窗口参数并打开
- 给 `sample-overlay-window` 的 `manifest.json` 增加 `window` 字段，如：`{"width": 480, "height": 320, "resizable": false}`。
- 在插件管理页点击“查看”，系统打开窗口；窗口尺寸与可调整状态与清单一致。

## 需求：同类型插件窗口单实例
- 系统 SHALL 对同一插件类型维持单实例窗口；再次触发打开动作时，不创建新窗口，而是将现有窗口置顶并聚焦。

#### Scenario: 再次点击置顶
- 用户再次点击侧边栏的该插件或管理页的“查看”，窗口被置于最前并获得焦点；不会生成额外实例。

## 需求：窗口路由与页面结构
- 系统 SHALL 使用路由 `/plugins/:plugname/window` 作为窗口内容入口。
- 该路由加载 `WindowFramePluginPage.vue`，页面由：
  - 极简 Topbar（可拖拽、最小化、关闭）
  - `PluginFrameManager` 内容区域（承载插件 UI/Overlay 框架）

#### Scenario: 通过路由承载窗口内容
- 打开窗口后加载对应路由；顶部栏可拖拽窗口，点击最小化或关闭触发窗口管理行为；内容由 `PluginFrameManager` 渲染。

## 需求：触发入口
- 系统 SHALL 在两处触发窗口打开/置顶：
  - 插件管理页卡片的“查看”按钮
  - 侧边栏的插件入口

#### Scenario: 两处入口一致行为
- 两处入口均遵循单实例策略；第一次打开创建窗口，后续点击置顶已有窗口。

## 需求：关闭与清理
- 系统 SHALL 在窗口关闭时清理窗口注册表与资源，确保后续点击可重新创建。

