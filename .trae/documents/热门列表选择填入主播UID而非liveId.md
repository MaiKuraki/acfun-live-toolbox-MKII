## 问题
- 添加房间后显示“未知标题/主播80/房间id：80”，原因是热门列表选择填入了 `liveId`，而房间详情 `room.details` 期望的是主播 `userID`（UID）。导致详情查询失败并使用占位信息。

## 调整
- 修改热门下拉映射：将 `t-select` 的选项 `value` 从 `item.liveId` 改为 `item.streamer.userId`（若无则回退到 `item.owner.userID`）。
- 继续保留提交前的数字清洗 `validateRoomId()`，确保最终传入的是纯数字 UID。

## 修改文件
- `packages/renderer/src/pages/LiveRoomPage.vue`
  - 更新 `hotOptions` 计算逻辑，选项 `value` 使用主播 UID。

## 验证
- 类型检查通过。
- 选择热门直播后，添加房间能正确拉取标题、主播名与封面，不再显示占位。