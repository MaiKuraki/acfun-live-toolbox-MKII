## 任务概述
- 原因：当前 `stream-status` 返回 `success: false` 且 `error: 主播当前未开播`，与新版库行为不一致（新版在未开播时返回 `success: true` + 默认对象，`isLive: false`）。
- 目标：强制升级至最新 `acfunlive-http-api`，删除旧版兼容/回退逻辑，统一按新版返回结构处理，前后端以 `isLive` 判定开播状态。

## 依赖升级
- 在项目根执行依赖升级与锁定更新：`pnpm up acfunlive-http-api -r; pnpm install; pnpm -C packages\main list acfunlive-http-api`。
- 验证 `packages\main\node_modules\acfunlive-http-api\dist\services\LiveService.d.ts:172-182` 中 `getLiveStreamStatus()` 确认包含 `isLive: boolean` 与默认字段。

## 服务端改造
- 文件：`packages/main/src/server/AcfunApiProxy.ts`。
- 路由分支：`case 'stream-status'`（约 `586-684`）。
- 改动要点：
  - 保留认证检查与 401 返回（`AcfunApiProxy.ts:591-598`）。
  - 删除失败场景的回退标准化数据 `normalizedData = result.success ? result.data : { liveID: null, streamName: null }`（`AcfunApiProxy.ts:668-674`）。
  - 统一透传新版库的数据：总是返回 `code: 200`，`success: result.success`，`data: result.data`；仅当 `error` 包含认证关键词（`cookies`/`token`/`unauthorized`）时返回 401。
  - 数据落库逻辑沿用，但以 `data.liveID` 的真值判断房间状态（`open/closed`）；新版未开播时 `liveID: ''`，可正确写入 `closed`（`AcfunApiProxy.ts:636-661`）。

## 插件桥检查
- 文件：`packages/main/src/plugins/ApiBridge.ts`。
- 现状：`acfun.live.getLiveStreamStatus` 通过 `invokeAcfun` 直接返回 `result.data`（`ApiBridge.ts:637-639`）；`invokeAcfun` 在 `result.success === false` 时抛错（`ApiBridge.ts:497-526`）。
- 结论：新版库未开播场景返回 `success: true`，无需改动；保持认证失败与真实异常抛错。

## 前端消费检查
- 关键页面：`packages/renderer/src/pages/LiveCreatePage.vue`。
- 行为：通过 `GET /api/acfun/live/stream-status` 判断是否跳转（`LiveCreatePage.vue:445-449, 808-812, 845-849`），当前以 `data.liveID` 真值跳转。
- 结论：新版未开播返回 `liveID: ''`，为假值，不会误跳转；可选增强（非必须）在后续将状态展示改为依据 `data.isLive`，但本次不改动前端。

## 清理旧版兼容逻辑
- 遵循用户规则“严禁为兼容旧版本保留回退代码，直接删除”。
- 删除 `stream-status` 分支中的失败回退标准化与 200 强制成功的特殊处理，仅保留认证失败分支。

## 验证流程（确认后执行）
- 生成 UI 测试用例（登录后在创建页与管理页验证未开播与开播两种状态）：使用测试用例编写器生成覆盖流状态与跳转逻辑的用例。
- 实现完成后：
  - 用实现对照检查器审查需求匹配度；不全则回到测试用例完善。
  - 用自动修复与构建器修复潜在错误并完成构建。
  - 用 Electron 自动化测试器执行端到端测试，验证 `/api/acfun/live/stream-status` 正常返回默认对象并且前端不误跳转。
- 测试不通过则进入修复循环直至通过。

## 交付项
- 升级后的依赖锁与版本。
- 修改后的 `AcfunApiProxy.ts` 路由逻辑（去除旧版回退，统一透传新版数据）。
- 控制台与日志：`[AcfunApiProxy][stream-status] upstream resp` 打印将反映 `isLive: false` 默认对象，无错误。

## 风险与回滚
- 无旧版兼容代码保留，若上游暂时未升级至新行为可能导致 `success: false` → 返回 400；本次按用户要求不做兼容保留。
- 若需热修复，仅在确认后恢复“失败仍 200 + 空对象”的处理，但不在本次改动范围内。