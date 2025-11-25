## 问题复盘
- 现象：`[AcfunApiProxy][stream-status] upstream resp success:false error:"...主播当前未开播(380023)"`。
- 调研结论：库中 `LiveService.getLiveStreamStatus()` 先调用 `apiPost(..., expectedCode=1)`，该包装函数会在 `result!==1` 时直接返回 `success:false` 与错误信息，导致后续“未开播→返回默认对象且 `isLive:false`”的分支无法执行。
- 测试期望：严格按 `acfundanmu.js/tests/LiveService.getLiveStreamStatus.test.ts`，未开播时应返回 `success:true`，默认对象 + `isLive:false`。

## 方案
- 在服务端代理 `packages/main/src/server/AcfunApiProxy.ts` 的 `stream-status` 分支对上游失败进行语义归一：
  - 若失败且错误包含未开播信号（`error_msg` 含“未开播”或 `code===380023`），则强制返回 `success:true` 且 `data` 为默认对象：
    - `liveID:''`、`streamName:''`、`title:''`、`liveCover:''`、`liveStartTime:0`、`panoramic:false`、`bizUnit:''`、`bizCustomData:''`、`isLive:false`
  - 若失败且错误包含认证关键词（`cookies`/`token`/`unauthorized`），维持 `401`。
  - 其余失败保持 `success:false`；但去除旧有“失败仍返回200+空对象”的回退代码（已删除）。
- 前端不变：继续以 `data.liveID` 真值判断跳转；未开播返回 `''` 不会误跳。

## 验证
- 代码变更后：
  - 代理层返回将与测试用例一致（未开播→`success:true` + 默认对象）。
  - 构建与类型检查通过。
  - 控制台日志仍会打印上游失败，但对外HTTP响应将是规范化的成功结构。

## 后续
- 等上游库修复 `apiPost` 的期望码验证策略后，可去除本层归一；当前变更为“契约强制执行”，不属于旧版兼容回退。