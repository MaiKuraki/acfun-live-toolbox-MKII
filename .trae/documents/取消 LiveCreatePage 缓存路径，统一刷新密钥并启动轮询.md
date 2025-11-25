## 目标
- 每次进入“创建直播”页都走接口刷新密钥并写入 streamStore，随后启动转码轮询；不再从 streamStore 读取缓存。

## 改动
- 在 LiveCreatePage.vue 的 onMounted 逻辑中删除 `streamStore.hasValid` 分支，统一执行：
  1) 调用 `/api/acfun/live/stream-status` 判断是否在直播（已在直播则跳转管理页）
  2) `loadStreamInfo()` 刷新密钥（`stream-settings` + 可选 `stream-url`），更新 `streamInfo`
  3) 调用 `streamStore.setStreamInfo` 与 `streamStore.syncReadonlyStore`
  4) 保持 `startStreamStatusCheck()` 在 `getStreamInfo()` 内触发，创建定时器

## 影响
- 始终从接口拉取最新密钥，避免因命中缓存路径未设置转码名或未启动轮询导致定时器缺失。

## 验证
- 进入/返回“创建直播”页，均刷新密钥并启动轮询，按钮由“检测推流中...”翻转为“开始直播”。