## 目标
- 在“直播房间管理”页的“添加房间”对话框中，支持两种方式填写房间ID：
  1) 直接输入房间ID或完整链接（现有功能保留）
  2) 点击“热门直播”按钮，下拉展示热门直播列表，选择后自动填入房间ID

## 现状确认
- 直接输入房间ID已实现，并支持从链接中提取房间ID（LiveRoomPage.vue:405-414）。
- 添加房间流程为：构建 `https://live.acfun.cn/live/<roomId>` → 调用 `roomStore.addRoom(roomUrl)`（LiveRoomPage.vue:416-431）。
- 渲染层具备 HTTP 访问主进程代理的能力：`window.electronApi.http.get('/api/acfun/live/hot-lives', { page, size })`（packages/preload/src/index.ts:254-275；主进程路由见 packages/main/src/server/AcfunApiProxy.ts:757-771，ApiServer.ts:183-185）。

## 修改点
- 文件：`packages/renderer/src/pages/LiveRoomPage.vue`
- 在“房间ID”表单项旁新增一个 `t-dropdown` 按钮“热门直播”：
  - 打开时触发 `fetchHotLives()`，调用 `window.electronApi.http.get('/api/acfun/live/hot-lives', { page: 1, size: 50 })` 获取热门房间列表。
  - 将返回数据映射为下拉 `options`：`content` 显示“标题｜主播名｜观众数”，`value` 使用房间 `liveID`。
  - 选择项时执行 `onSelectHotLive(liveId)`：设置 `addForm.roomId = String(liveId)` 并关闭下拉。
- UI 结构建议：在 `t-form-item[name="roomId"]` 内将 `t-input` 与一个小号 `t-button`（被 `t-dropdown` 包裹）并排放置，保持风格与页面一致；保留现有 `@blur="validateRoomId"`。

## 新增状态与方法（script setup）
- `const hotLives = ref<any[]>([])`
- `const hotLoading = ref(false)` / `const hotError = ref<string|null>(null)`
- `const hotOptions = computed(() => map热门房间为下拉项)`
- `async function fetchHotLives()`：调用 `/api/acfun/live/hot-lives`，处理 `{ success, data, error }`，填充 `hotLives` 与状态。
- `function onSelectHotLive(liveId: string | number)`：`addForm.roomId = String(liveId)`。
- `function onHotVisibleChange(visible: boolean)`：`visible && fetchHotLives()`。

## 数据映射细节
- 预期字段：`item.liveID`（房间ID）、`item.title`、`item.owner?.username` 或 `item.streamer?.userName`、`item.viewerCount`。
- 兜底：缺失字段时以“未知标题/未知主播/0”显示，确保不因字段差异导致崩溃。

## 边界与错误处理
- 无需登录即可获取热门列表；若返回 `success=false` 或网络错误，显示 `window.electronApi.popup.toast('热门直播加载失败')`，并保留手动输入路径。
- 列表为空时展示“暂无热门直播”占位项为禁用态。

## 验证
- 仅进行静态代码走查与 typecheck（遵循项目规则，不编写/运行测试）。
- 进入“添加房间”对话框：手动输入与下拉选择均能在提交后成功连接并回填详情（依赖已有 `addRoom` 流程）。

## 兼容与约束
- 不引入新依赖；使用现有 TDesign 组件与 `window.electronApi.http`。
- 不修改 Store 或主进程逻辑；全部改动限定在 `LiveRoomPage.vue`。
- 保持项目中文文案与现有样式风格一致。