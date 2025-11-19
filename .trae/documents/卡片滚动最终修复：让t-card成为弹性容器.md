## 问题
- `.t-card__body`未占满卡片，内部列表无法滚动；部分情况下设置 `overflow:hidden` 还会影响滚动条的显示。

## 方案
- 让整张 `t-card` 变为弹性容器，头部与操作区不参与伸缩，主体（`.t-card__body`）填满剩余高度：
  - `.room-list-card { display:flex; flex-direction:column; height:100%; }`
  - `.room-list-card :deep(.t-card__header), .room-list-card :deep(.t-card__actions) { flex-shrink:0; }`
  - `.room-list-card :deep(.t-card__body) { flex:1; min-height:0; }`（移除 `overflow:hidden`）
  - `.room-list { flex:1; min-height:0; overflow-y:auto; }`（保持不变）
- 这将确保 `.t-card__body` 拿到剩余空间，内部 `.room-list` 才能出现滚动条。

## 验证
- 类型检查通过。
- 房间>3时卡片内部显示滚动条，不再溢出。