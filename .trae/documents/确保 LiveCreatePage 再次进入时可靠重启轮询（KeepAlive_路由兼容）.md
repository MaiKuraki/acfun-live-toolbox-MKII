## 结论
- 项目当前未使用 `<KeepAlive>` 包裹 `RouterView`，因此“取消 KeepAlive”不会生效。问题更可能是：返回时未触发重新挂载或挂载后未进入检测分支（例如 `transcodeStreamName` 未设置、认证态判定导致提前 return）。

## 方案
- 强制该页面在每次进入时重新挂载：在布局 `LayoutShell.vue` 的 `RouterView` 上增加 `:key="$route.fullPath"`，使路由变化时组件强制重建，从而必然触发 `onMounted`。
- 页面级兜底：在 `LiveCreatePage.vue` 里添加 `watch(() => router.currentRoute.value.fullPath)`，当进入 `'/live/create'` 时：
  - 先 `clearInterval(streamCheckTimer)`；
  - 调用 `/api/acfun/live/stream-status` 判断是否在直播：
    - 未开播 → 设置 `streamStatus='connecting'`，执行 `getStreamInfo()` 刷新密钥并调用 `startStreamStatusCheck()` 创建轮询；
    - 已开播 → 跳转到 `#/live/manage/<liveID>`。
- 保留现有的 `onUnmounted/onDeactivated` 清理，与 `onMounted/onActivated` 的恢复，形成双重保证。

## 验证
- 进入 `#/live/create`：始终触发挂载与检测，定时器创建；按钮从“检测推流中...”到“开始直播”。
- 切换到其它页面再返回：再次挂载并启动定时器，行为一致。

我将：
1) 在 `LayoutShell.vue` 为 `RouterView` 添加 `:key="$route.fullPath"`；
2) 在 `LiveCreatePage.vue` 添加路由 `watch` 的兜底重启逻辑；
3) 保留并验证现有钩子清理/重启，确保定时器稳定启动。