## 结论
- 每条 `[ApiServer#SSE /sse/renderer/readonly-store] connect` 都对应一次 `EventSource` 建立连接（服务器端在 packages/main/src/server/ApiServer.ts:1109 打印）。
- 渲染层存在两处订阅：
  - PluginFramePage 在挂载时订阅一次，并在总线 `plugin-ready` 与 `ui-ready` 事件各自重新订阅一次，共计最多 3 次连接（packages/renderer/src/pages/PluginFramePage.vue:418-423、240-244、151-158）。
  - WindowFramePluginPage 在挂载时订阅一次（packages/renderer/src/pages/WindowFramePluginPage.vue:306-309、261-268）。
- 启动时出现 6 次 connect，通常由多页面同时加载叠加 + PluginFramePage 的双事件重订阅触发造成。

## 调整目标
- 保持只读仓库数据及时下行，但避免因重复重订阅造成连接数量膨胀与日志噪声。

## 代码修改方案
1. PluginFramePage 去重重订阅
- 在 `registerBusHandlers` 的 `onReady` 中移除 `storeSource?.close()` 与 `subscribeReadonlyStore()`，仅保留初始化消息与生命周期派发：
  - 位置：packages/renderer/src/pages/PluginFramePage.vue:234-241、242-244。
- 依赖已经通过 `wujieProps` 传入的 `shared.readonlyStore`（packages/renderer/src/pages/PluginFramePage.vue:94-121），让子页在 ready 后自行读取现有快照，无需强制重连拿 `readonly-store-init`。

2. PluginFramePage 连接幂等化
- 在 `subscribeReadonlyStore()` 内增加防抖/幂等守卫：若 `storeSource` 已存在且 `readyState === 1`，跳过创建；若非活跃，先 `close()` 再单次重建。
  - 位置：packages/renderer/src/pages/PluginFramePage.vue:151-158。

3. WindowFramePluginPage 保持现状
- 不做改动，仅在需要时可复用同样的幂等守卫逻辑（非必须）。

## 验证方法
- 启动应用并观察主进程日志：`ApiServer.ts:1109` 的 connect 计数应从 6 降至每活跃页面各 1 次（通常 1–2 次）。
- 静态检查与类型检查：确保子页在 ready 后能从 `shared.readonlyStore` 读取初始数据；`readonly-store-update` 事件仍正常合并。

## 影响评估
- 只读仓库数据传递路径不变；仅移除不必要的重复连接。
- 子页获取初始态从“依赖 init 事件”转为“读取共享只读仓库 + 仍监听后续 update”，功能等价、复杂度更低。