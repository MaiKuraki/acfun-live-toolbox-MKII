## 目标
- 在房间详情接口返回的字段中，将封面统一映射为 `coverUrl`，来源优先使用 `getUserLiveInfo().data.liveCover`，其次回退到其他可能的封面来源（如摘要或用户头像）。
- 前端仍使用 `room.coverUrl` 展示，无需改动渲染逻辑。

## 修改文件
- `packages/main/src/ipc/ipcHandlers.ts`
  - 在 `room.details` 处理逻辑中，聚合 `AcfunDanmuModule.getUserLiveInfo(userID)`、`getSummary(liveId)` 等结果，新增对 `data.liveCover` 的映射：`coverUrl = userLiveInfo.data?.liveCover || summary.data?.coverUrl || userInfo.data?.avatar || ''`。
  - 保持其他字段不变：`title/isLive/status/viewerCount/likeCount/streamer`。

## 验证
- 类型检查通过。
- 添加或刷新房间详情时，封面为接口返回的 `liveCover`；若该字段缺失，则显示默认封面或其他回退来源。