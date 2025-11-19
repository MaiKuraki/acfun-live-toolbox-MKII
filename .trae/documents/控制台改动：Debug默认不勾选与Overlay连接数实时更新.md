## 目标
- 将日志筛选区的 Debug 复选框默认改为不勾选（false）。
- 页面中的 “Overlay 连接” 数字随浏览器打开/关闭 overlay 实时更新（取消 15s 轮询的延迟）。

## 技术方案
### 1. Debug 默认不勾选
- 文件：`packages/renderer/src/pages/Console.vue`
- 将 `const debugMode = ref(true)` 修改为 `ref(false)`，其余过滤逻辑保持不变：
  - 未勾选：仅显示 `error` 级日志（文本搜索仍生效）。
  - 勾选：显示全部日志并保留现有级别/文本筛选。

### 2. Overlay 连接数实时更新（订阅式）
- 文件：`packages/renderer/src/pages/Console.vue`
- 新增状态：`const overlayCounts = ref<Record<string, number>>({});`
- 初始化：
  - 调用 `window.electronApi.monitoring.queryPageStatus()` 获取快照，填充 `overlayCounts`（按 `plugins[].pluginId → connectedCount`）并计算 `overlayCount`（求和）。
  - 获取插件列表（`electronApi.plugin.list()` 或现有 `plugin.stats()`），枚举 `pluginId`。
- 订阅：
  - 对每个 `pluginId` 调用 `window.electronApi.monitoring.subscribePageStatus(pluginId, listener)`。
  - 在 `listener({ pluginId, record })` 中：当收到 `overlay-connected/overlay-disconnected/overlay-heartbeat`，重新计算该 `pluginId` 的 `connectedCount`（从 `querySnapshot(pluginId)` 或维护的计数），更新 `overlayCounts[pluginId]`，并汇总到 `overlayCount`。
  - 保存每个订阅返回的 `unsubscribe` 以便 `onUnmounted` 清理。
- 保留一次性快照轮询作为兜底（可将 15s 轮询降低或移除，但本次优先用订阅即刻更新）。

## 实施步骤
1. 修改 Debug 默认值为 false。
2. 在 `onMounted`：
   - 读取初始快照并设置 `overlayCounts/overlayCount`。
   - 获取插件列表并对每个插件建立订阅；把返回的 `unsubscribe` 缓存到 `Map<string, () => Promise<void>>`。
3. 在 `onUnmounted`：依次调用每个 `unsubscribe`，清理订阅与定时器。
4. 保持现有虚拟滚动、日志导出等逻辑不变。

## 验证
- 仅运行类型检查：`pnpm -C packages/renderer typecheck`。
- 打开浏览器访问某插件的 overlay（`/sse/plugins/:pluginId/overlay` 在服务器侧会触发 `overlayClientConnected/Disconnected`）：
  - 页面 “Overlay 连接” 数字应即时变化（无需等待 15s）。
- 切换 Debug 复选框：默认不勾选时只显示 error；勾选显示全部。

## 其他
- 不新增依赖，不引入回退代码。
- 遵循工作区规则：不运行测试、仅静态走查与类型检查。
- 若订阅不到某插件（未安装或无 overlay），该插件跳过即可，不影响总数。