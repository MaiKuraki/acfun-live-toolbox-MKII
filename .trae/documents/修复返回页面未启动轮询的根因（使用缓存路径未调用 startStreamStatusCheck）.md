## 根因
- LiveCreatePage.vue 在再次进入时，如果 `streamStore.hasValid` 为真，会直接用缓存的 `streamInfo`，但这条分支未设置 `transcodeStreamName`、也未调用 `startStreamStatusCheck()`，导致未创建 setInterval。

## 修复方案
- 在使用缓存路径（`streamStore.hasValid`）时：
  - 设置 `transcodeStreamName.value`（优先用 `streamStore.streamName`，否则从 `streamInfo.streamKey` 去掉查询串后取键名）。
  - 立即调用 `startStreamStatusCheck()` 创建轮询定时器。
- 保持既有 onActivated/onDeactivated/onUnmounted 与路由 watch 的清理/重启逻辑。

## 实施文件
- `packages/renderer/src/pages/LiveCreatePage.vue`
  - 在 onMounted 区块中 `hasValid` 分支添加上述两行逻辑
  - 可选在 onActivated 路由重启逻辑后也执行同样保障（但因调用 `getStreamInfo()`，一般无需重复）

## 验证
- 再次进入“创建直播”页，即便命中缓存分支，也能立即启动轮询，按钮从“检测推流中...”翻转为“开始直播”。

若同意，我将直接修改并构建测试。