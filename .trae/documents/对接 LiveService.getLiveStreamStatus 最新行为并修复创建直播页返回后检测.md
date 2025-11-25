## 目标
- 与 acfundanmu.js 最新测试行为对齐：统一以 `data.liveID` 判断是否开播，标准化服务端 `stream-status` 响应与错误码。
- 页面进入与返回时，始终先检测是否开播；未开播则刷新密钥并开始轮询；已开播则跳转到直播管理页。

## 改动点

### 1. 服务端端点规范化（/api/acfun/live/stream-status）
- 保持认证失败→返回 401（`error` 包含 `token/cookies`）
- 其它情况一律返回 200：
  - 当上游返回 `success=false`，也返回 200，并标准化 `data` 为 `{ liveID: null, streamName: null }`（避免前端 400）
  - 正常返回保留 `data.liveID/streamName/title`，用于前端判断
- 目的：匹配最新测试行为，前端仅看 `data.liveID` 即可判断是否开播

### 2. obs-assistant 检测逻辑对齐
- `checkLiveStatus()` 仅读取 `data.liveID`，不再读取顶层 `liveID`
- 保持认证态 gating 与前置检查流程不变

### 3. 创建直播页进入/返回检测
- 进入页面：先调用 `/api/acfun/live/stream-status` 判断：
  - `data.liveID` 存在→跳 `#/live/manage/<liveID>`
  - 否则刷新密钥（`stream-settings` + `stream-url`）并开始轮询 `transcode-info`
- 返回页面（onActivated）：
  - 清理遗留定时器→再次调用上述“进入页面”流程，确保从“等待推流”恢复为“检测推流中...”并最终“开始直播”

## 验证
- 未开播→进入与返回均可刷新密钥并开始检测，按钮从“检测推流中...”到“开始直播”
- 已开播→进入或返回均直接跳转管理页
- 认证失败→保持“等待推流”，不开始检测

## 影响
- 仅修改 `AcfunApiProxy` 响应规范与 `obs-assistant`/页面的消费逻辑；不影响其它功能。

确认后我将实施上述改动并构建测试。