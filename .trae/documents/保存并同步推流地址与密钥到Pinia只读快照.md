## 背景与现状
- 已存在渲染层 Pinia 仓库 `useStreamStore`，字段包含 `rtmpUrl`、`streamKey`、`expiresAt`，并提供 `refresh()` 获取推流信息：`packages/renderer/src/stores/stream.ts:18-26, 38-68`。
- 只读快照的主进程通道与SSE订阅已就绪：
  - 接收上报：`POST /api/renderer/readonly-store`（需要 body 字段 `type` 与 `payload`）`packages/main/src/server/ApiServer.ts:1083-1098`
  - SSE 分发：`GET /sse/renderer/readonly-store`（事件：`readonly-store-init`/`readonly-store-update`）`packages/main/src/server/ApiServer.ts:1100-1168`
- 渲染层订阅并分发到插件页面：`packages/renderer/src/pages/PluginFramePage.vue` 与 `WindowFramePluginPage.vue` 已监听并转发两类事件。
- 问题：`useStreamStore.syncReadonlyStore()` 当前 POST 使用 `event` 字段而非 `type`，与服务端契约不一致，导致 400：`packages/renderer/src/stores/stream.ts:70-77`。
- 已有统一只读仓库上报工具，可直接使用：`packages/renderer/src/utils/readonlyReporter.ts:56-104`。

## 目标
- 将“直播服务器地址与串流密钥”持久保存到 Pinia（`useStreamStore`）
- 按既有只读仓库协议上报至主进程，确保渲染层与插件均可订阅只读快照，且为只读视图

## 修改内容
- 修正并规范化只读快照上报：
  - 替换 `syncReadonlyStore()` 的直接 `electronApi.http.post` 为调用 `reportReadonlyUpdate({ stream: { rtmpUrl, streamKey, expiresAt } })`，使用统一工具并符合服务端 `type` 字段契约。
  - 同步将 `refresh()` 完成获取后调用 `syncReadonlyStore()` 的流程保留，保障首次与后续更新均能广播。
- 保持/优化 Pinia 状态：
  - 保留 `setStreamInfo()` 的入参与字段写入逻辑：`packages/renderer/src/stores/stream.ts:27-36`。
  - 维持 `isExpired`/`hasValid` 计算属性，避免不必要的请求：`packages/renderer/src/stores/stream.ts:24-26`。
- 清理冗余：
  - 删除不再需要的手写 POST（`event` 字段）路径，避免重复与回退代码。

## 具体改动点
- 文件：`packages/renderer/src/stores/stream.ts`
  - 引入上报工具：`import { reportReadonlyUpdate } from '../utils/readonlyReporter'`
  - 更新 `syncReadonlyStore()`：改为调用 `reportReadonlyUpdate({ stream: { rtmpUrl: rtmpUrl.value, streamKey: streamKey.value, expiresAt: expiresAt.value } })`
  - 删除旧的 `electronApi.http.post('/api/renderer/readonly-store', { event: ... })` 实现

## 验证方式
- 静态检查与类型检查：
  - 通过 IDE/构建的 TypeScript 类型检查，确认引入工具与函数签名正确
- 运行时路径（无需启动渲染服）：
  - 进入“创建直播”页面后，`useStreamStore.refresh(true)` 被触发，Pinia 写入成功，随后只读快照经统一上报工具发送
  - 主进程路由将记录到数据总线，SSE 订阅方收到 `readonly-store-update`，页面模式会合入 `window.__WUJIE_SHARED.readonlyStore.stream`

## 安全与约束
- 只读仓库通道会移除顶层 `plugin` 字段并做敏感字段清理；`streamKey` 仅用于插件应用 OBS 设置，不在页面表单中解密展示
- 不保留兼容性回退代码，所有旧路径删除

## 交付结果
- Pinia 中稳定保存 `rtmpUrl` 与 `streamKey`，并通过只读快照协议持续同步到渲染进程订阅方（只读视图），满足“保存到pina里，并同步给渲染进程只读快照”的要求