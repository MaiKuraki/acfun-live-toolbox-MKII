## 问题
- 来自 acfunlive-http-api 的行为事件在解析后仅包含 `danmuInfo`，不带类型或计数字段；适配器回退把这类事件误判为 `enter`，导致 like/关注缺失。

## 方案
1. 传递上游的类型提示
- 在 `processDanmuInfo` 中，从父事件 `parent` 读取 `type/action/messageType/signalType` 作为 `tHint`，并将其随事件一并传递，便于后续判断。

2. 强化类型推断与回退策略
- 在 `handleActionSignal` 的类型推断阶段：
  - 若无 `signalType` 和显式特征（文本/礼物/点赞计数），但存在用户信息，则使用 `parentType` 或默认按 `like` 归类，而非 `enter`。
  - 若 `parentType` 显示为 `follow`，则归为 `follow`。

3. 保留原始事件
- 将 `parent` 或 `di` 放入 `raw`，便于后续核对与调试。

## 验证
- 静态走查：确认 `like/follow` 在“仅有 danmuInfo”的情况下被识别为对应类型，不再落入 `enter`。
- 观察写库日志与样本查询：`events.type` 包含 `like/follow`，`payload` 允许为空，`raw_data` 有完整记录。

## 风险
- 某些真正的进房事件在极端情况下可能被误判为 `like`；可后续根据更多信号细化规则。