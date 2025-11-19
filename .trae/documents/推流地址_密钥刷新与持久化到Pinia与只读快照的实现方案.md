## 目标
- 在“推流地址/密钥”区域增加刷新按钮（手动刷新）。
- 将推流地址/密钥持久化到 Pinia，并同步到主进程只读快照；除非过期或用户手动刷新，不再频繁请求。

## UI改动（LiveCreatePage.vue）
- 在“服务器地址（RTMP）”与“串流密钥”两行右侧增加 `刷新` 按钮：
  - 点击触发 `refreshStreamInfo()`（强制刷新）。
  - 按钮禁用条件：正在刷新；按钮文案根据状态显示“刷新/已更新”。
- 初次渲染时：
  - 若 Pinia 中已有未过期数据，直接显示；不调用后端。
  - 若无或过期，显示“正在获取推流地址...”并调用后端。

## Pinia存储（新增 stores/stream.ts）
- 状态：
  - `rtmpUrl: string`, `streamKey: string`, `expiresAt: number | null`, `lastFetched: number | null`
- getters：
  - `isExpired: boolean`（`expiresAt && Date.now() >= expiresAt`）
  - `hasValid: boolean`（`rtmpUrl && streamKey && !isExpired`）
- actions：
  - `setStreamInfo({ rtmpUrl, streamKey, expiresAt })`
  - `loadFromCache()`（从 localStorage 读取一次，或由页面注入）
  - `refresh(force?: boolean)`：当 `force` 或 `isExpired` 时请求；成功后 `setStreamInfo`
  - `syncReadonlyStore()`：将当前数据 POST 到 `/api/renderer/readonly-store`（事件 `readonly-store-update`，payload `{ stream: { rtmpUrl, streamKey, expiresAt } }`）

## 后端交互与只读快照
- 获取逻辑复用现有两步：
  - `/api/acfun/live/stream-settings` 获取基础地址（必要时解析 `streamPushAddress`）
  - 若能获取 `liveId`，调用 `/api/acfun/live/stream-url` 获得签名后的地址与 key
- 每次成功刷新后：
  - 更新 Pinia
  - 调用 `syncReadonlyStore()` 同步到只读快照（主进程统一分发 SSE）

## 页面集成（LiveCreatePage.vue）
- `onMounted`：
  - 读取 Pinia `hasValid` → 展示/跳过后端请求；否则调用 `streamStore.refresh()`
- 刷新按钮：
  - 调用 `streamStore.refresh(true)`，完成后页面从 store 展示
- 离开/返回页面：
  - 若 `hasValid` 则继续使用缓存；过期时才自动刷新

## 过期与刷新策略
- 以后端给的 `expiresAt` 为准；若无则设置 60 分钟默认过期时间
- 手动刷新总是强制请求并覆盖

## 安全与规范
- 不在日志输出明文 `streamKey`；仅在 UI 以 `type='password'` 显示（已有实现）
- 遵循用户规则：删除回退代码；仅必要新增 `stores/stream.ts`
- 不创建测试用例；仅类型检查

## 验证
- 类型检查：`pnpm -C packages/renderer typecheck`（执行后我会确认通过）
- 实际行为：
  - 初次打开/过期 → 自动拉取并展示；
  - 手动刷新 → 覆盖并展示；
  - 返回页面 → 使用 Pinia 缓存；
  - 主进程只读快照可被其他页面/进程订阅（SSE）。

请确认，我将按此方案实施（新增 Pinia store、页面按钮与刷新逻辑、只读快照同步），并进行类型检查与日志核验。