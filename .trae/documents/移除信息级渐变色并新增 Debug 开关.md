## 目标
- 信息级日志行取消渐变背景，改为无背景（保持清爽可读）。
- 在日志筛选区新增“Debug”复选框（默认勾选）。
  - 勾选：显示所有日志（当前筛选仍生效）。
  - 取消勾选：只显示 error 级日志（忽略级别筛选，文本筛选仍可用）。

## 变更点
### 样式调整
- 文件：`packages/renderer/src/pages/Console.vue`
- CSS：
  - 修改 `.log-row[data-level="info"]` 背景：去掉 `linear-gradient(...)`，设为透明/无背景；保留左侧边界线以维持层级感。
  - 保留 error/warn/debug 当前样式，不改动。

### UI 增加控件
- 文件：`packages/renderer/src/pages/Console.vue`
- 在日志工具栏的 `filters` 容器中，新增一个 `t-checkbox`，标签：`Debug`，`v-model="debugMode"`，默认 `true`。

### 逻辑调整
- 文件：`packages/renderer/src/pages/Console.vue`
- 新增：`const debugMode = ref(true)`。
- 修改 `filteredLogs` 计算属性：
  - 若 `debugMode === false`，则仅保留 `normalizeLogLevel(l.level) === 'error'` 的日志；忽略 `levelFilter`（文本筛选 `textFilter` 仍生效）。
  - 若 `debugMode === true`，沿用当前筛选逻辑（级别筛选 + 文本筛选 + 倒序）。
- 其它逻辑（虚拟滚动、批量更新、滚动控制）无需调整，仍基于 `filteredLogs` 工作。

## 验证
- 运行类型检查：`pnpm run typecheck`（仅静态检查）。
- 打开控制台页面：
  - 观察 info 行不再有渐变背景；
  - 切换 Debug 复选框：
    - 勾选：显示全部（仍可用级别/文本筛选）；
    - 取消：仅 error 行显示，滚动与性能正常。

## 兼容性与约束
- 仅修改渲染进程页面样式与筛选逻辑，不影响主进程与 SSE。
- 遵循现有 TDesign 组件用法（使用 `t-checkbox`）。
- 不引入新依赖；不添加回退代码。