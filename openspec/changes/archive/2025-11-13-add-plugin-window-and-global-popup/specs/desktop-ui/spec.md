# ADDED Requirements — 桌面UI与全局弹窗

## 需求：Renderer 全局弹窗服务
- 系统 SHALL 在 Renderer 层提供统一的全局弹窗服务，供插件入口脚本（如 `d:\Code\acfun-live-toolbox-MKII\buildResources\plugins\sample-overlay-ui\index.js`）与插件 UI/Overlay 调用，包含：
  - `alert(title, message, options?)`：非阻塞信息提示框
  - `confirm(title, message, options?)`：确认对话框，返回 `Promise<boolean>`
  - `toast(message, options?)`：轻提示，支持 `durationMs`
- 弹窗服务 SHALL 遵循统一的桌面主题样式，覆盖在当前渲染上下文（主窗口或插件窗口）之上。
- 插件 UI SHALL 通过 Bridge 调用弹窗服务，推荐定义桥接命令：
  - `type: 'renderer-popup'`，`action: 'alert' | 'confirm' | 'toast'`，`payload: { title?, message, options? }`
- 插件入口脚本（`index.js`）SHALL 通过插件管理器桥接到 Renderer 的弹窗服务，调用规范与 UI 相同（转发 `{ type: 'renderer-popup', action, payload }`）。
- 弹窗服务 MUST 进行节流与范围控制：
  - 每插件上下文每秒不超过3次 `toast` 展示；
  - `alert/confirm` 打开并发受限，避免对用户造成干扰。
- 安全性：所有文案按纯文本处理，不渲染HTML，以防脚本注入。

#### Scenario: 插件触发确认对话框
1. 插件 UI 调用 `bridge.request({ type: 'renderer-popup', action: 'confirm', payload: { title: '确认操作', message: '确定要清空配置吗？' } })`
2. 渲染层显示主题化确认弹窗；用户点击“确定/取消”。
3. Bridge 返回布尔结果，插件据此继续或中止操作。

## 需求：WindowFramePluginPage 布局
- 路由 `/plugins/:plugname/window` SHALL 加载 `WindowFramePluginPage.vue`，页面包含：
  - 极简 Topbar：
    - 可拖拽（CSS `-webkit-app-region: drag`）
    - 控件：最小化、关闭（按钮区域 `-webkit-app-region: no-drag`）
  - 内容区：嵌入 `PluginFrameManager`，承载插件 UI/Overlay
- Topbar 控件行为：
  - 点击最小化 → 调用窗口管理器最小化当前窗口
  - 点击关闭 → 关闭并触发窗口注册表清理

#### Scenario: 拖拽与控制
1. 用户按住顶部栏任意空白区域拖拽窗口移动。
2. 点击最小化按钮窗口进入任务栏；点击关闭按钮窗口销毁。
3. 再次从入口打开时重新创建并加载对应插件内容。

## 需求：弹窗服务在窗口中的作用域
- 当调用发生于插件窗口中时，弹窗 SHALL 仅在该窗口内显示。
- 当调用发生于主窗口或非窗口页面时，弹窗 SHALL 在当前活动渲染上下文中显示。

## 可访问性与国际化
- 弹窗与按钮 SHALL 支持键盘导航与焦点管理。
- `confirm` 对话框 MUST 将“确认/取消”正确设置为可聚焦元素并提供键盘操作。
- 文案由插件传入；系统可选提供多语言包以适配核心按钮文案。

## 约束与风格
- 弹窗样式遵循桌面UI主题，不引入原生阻塞式系统对话框。
- `toast` 默认时长 2500ms，可在 `options.durationMs` 范围 1000–10000ms 中调整。

