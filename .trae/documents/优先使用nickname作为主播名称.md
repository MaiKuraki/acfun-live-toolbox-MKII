## 目标
- 在房间详情的聚合结果中，主播名称优先使用 `getUserLiveInfo().data.profile.nickname`，不足时再回退到其他来源（`roomInfo.owner.username`、`userInfo.userName`、`profile.userName`）。

## 修改文件
- `packages/main/src/ipc/ipcHandlers.ts`
  - 在 `room.details` 的返回数据中，将 `streamer.userName` 的来源改为优先取 `profile.nickname`。

## 验证
- 类型检查通过。
- 刷新房间详情后，前端显示主播名称为 `nickname`（如存在），否则按既有回退逻辑显示。