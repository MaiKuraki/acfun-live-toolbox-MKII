## 问题定位
- 现象：数据库 `events.type` 被写成 `enter`，且弹幕 `payload` 为空，导致原始信息（如 `content`）丢失。
- 根因：在 `AcfunAdapter` 的回调处理里，当收到 acfunlive-http-api 的标准事件（含 `danmuInfo`）时，仅把 `danmuInfo` 传入后续处理，丢失了事件本体上的 `content/giftDetail/...` 字段，进而被回退逻辑误判为 `enter`。
  - 代码位置：`packages/main/src/adapter/AcfunAdapter.ts:691-694` 调用了 `processDanmuInfo(event.danmuInfo)`，而没有把 `event` 本体一并传入。
  - 该函数中随后派发 `handleActionSignal` 时 `content` 为空、`signalType` 也为空，触发了 `enter` 回退（`packages/main/src/adapter/AcfunAdapter.ts:783-818`）。
- 数据写入链路确认：`RoomManager` 标准化并入队（`packages/main/src/rooms/RoomManager.ts:208-230`）→ `EventWriter.writeBatch` 按 `event.event_type` 和 `event.content` 入库（`packages/main/src/persistence/EventWriter.ts:93-110`）。

## 修复方案
1. 正确传递完整事件用于解析
- 将 `handleDanmuEvent` 中的 `this.processDanmuInfo(event.danmuInfo)` 修改为 `this.processDanmuInfo(event.danmuInfo, event)`，使 `processDanmuInfo` 能合并 `danmuInfo` 与事件本体，正确抽取 `content/giftDetail/likeDelta/...`。
- 变更点：`packages/main/src/adapter/AcfunAdapter.ts:691-694`。

2. 强化 `processDanmuInfo` 的内容抽取与类型判定
- 已有合并逻辑：`merge(di, parent)`，继续沿用，但基于 `parent` 明确内容提取顺序：
  - `content ← parent.content || parent.comment?.content || parent.message || parent.text`
  - `gift ← parent.giftDetail?.name + ' x' + parent.count`
  - `like ← parent.likeCount || parent.likeDelta || parent.totalLike`
- 若能从上述获取到 `content` 则判定为 `comment/danmaku`；否则根据 `gift/like` 判定；没有内容但仅有用户则判为 `enter`。
- 变更点：`packages/main/src/adapter/AcfunAdapter.ts:755-778` 与 `packages/main/src/adapter/AcfunAdapter.ts:783-818` 的判定路径不动，仅确保 `parent` 参与合并后能得到正确 `content`。

3. 确保写库前的标准化保留文本
- `emitUnifiedEvent` 已按 `message?.data?.content ?? message?.content ?? message?.text` 取文本（`packages/main/src/adapter/AcfunAdapter.ts:984-1011`），在第1步后，`message.content` 将存在，入库即为 `events.payload`。
- 为提高原始信息可回溯性，将 `emitUnifiedEvent` 的 `raw` 取值改为优先使用 `message.raw || message`，并在 `processDanmuInfo/handle*Message` 调用链把原始事件放入 `raw` 字段（不影响现有逻辑）。

## 验证与回归
- 启动后观察日志：
  - 适配器统一事件日志打印 `type=danmaku/gift/like/enter` 与 `content` 不为空（`AcfunAdapter.emitUnifiedEvent`）。
  - 写库日志打印 `[DB] insert type=danmaku ... content="..."`（`packages/main/src/persistence/EventWriter.ts:93-106`）。
- 使用现有查询服务静态检查：
  - 通过 `QueryService.getEventsSample` 查看最新样本类型分布（`packages/main/src/persistence/QueryService.ts:411-417`）。
  - 通过 `QueryService.queryEvents` 的 `type=danmaku` 过滤确认弹幕 `content` 存在（`packages/main/src/persistence/QueryService.ts:128-162`）。
- 不引入 mock；仅做静态代码走查和类型检查，符合项目规则。

## 风险与兼容性
- 该改动不涉及依赖升级或表结构变更，行为仅限事件判定与原始事件保留，属于兼容修复。
- 保留 `system` 回退以兜底未知类型；不会影响既有 `enter/gift/like/follow` 判定。

## 交付内容
- 代码修复：`AcfunAdapter.handleDanmuEvent` 传参修正；`emitUnifiedEvent` 原始事件保留优化（如需）。
- 静态验证通过；不新增测试文件、不运行测试。