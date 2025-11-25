## 页面结构与交互调整
- 去掉页面内“连接采集”及其旁边的房间 `<t-select>` 的旧交互；保留房间选择但改为“选到哪个房间即自动触发筛选查询”。
- 在房间或筛选条件变更、查询进行中时，使用 `<t-loading />` 遮罩整页或表格区域（按现有布局决定）以指示加载。
- “导出”左侧新增“查询”按钮：触发提交当前筛选条件并刷新表格数据。

## 筛选表单改造（TDesign 风格）
- 使用 `<t-form layout="inline" label-width="calc(2em + 24px)" scroll-to-first-error="smooth" @reset="onReset" @submit="onSubmit">`。
- 字段：
  - 弹幕类型：`<t-select multiple>`，选项包含：点赞、进入直播间、关注、弹幕、系统、礼物；与后端事件类型键值映射一致（renderer 层维护 `typeOptions` 与 `value=>label` 映射）。
  - 关键词：`<t-tagInput v-model="formData.keywords">`，支持多关键词，查询时传入后端进行匹配（评论内容与系统消息等）。
  - 用户：`<t-select-input>`，支持远程搜索与选择；增加“查询所有用户”的后端接口并支持按关键词搜索用户用于筛选（出于性能考虑做去抖与分页）。
  - 直播日期：`<t-date-picker>`，`disable-date` 使用后端返回的可用日期集合或一个函数来禁用不在集合内的日期。
- 房间 `<t-select>`：选中后立即刷新筛选结果（无需额外“连接采集”动作）。

## 列表与分页
- 使用 `<t-base-table>` 渲染数据，`<t-pagination>` 控制分页（与后端 `GET /api/events` 的分页参数对齐）。
- 列头：时间、类型、用户、内容。
- 内容格式化：
  - 点赞：`点了一个❤️`
  - 进入直播间：`进入了直播间`
  - 关注：`关注了主播`
  - 弹幕：显示弹幕文本
  - 系统：显示系统通知消息
  - 礼物：`送了${礼物数量}个${礼物名称}`
- 采用 renderer 层统一的格式化函数，避免在模板内重复逻辑。

## 后端接口与服务调整
- 事件查询：沿用 `GET /api/events`，确保支持以下参数：房间、类型（多选）、关键词（多关键词）、用户（多选或单选）、日期/时间范围、分页。
- 房间列表：沿用 `GET /api/events/rooms`。
- 用户查询：新增接口（示例）：
  - `GET /api/users`：返回已知用户列表（来源于事件或持久化用户表）。
  - `GET /api/users/search?keyword=...&page=...&pageSize=...`：按关键词远程搜索用户，返回分页列表。
  - 服务层 `QueryService.listUsers / searchUsers` 提供相应能力，优先基于本地事件索引与持久化存储；不依赖 mock。
- 直播日期：新增接口（示例）：
  - `GET /api/events/dates?roomId=...`：返回该房间存在事件的“可选日期列表”（去重并格式化为 `YYYY-MM-DD`）。
  - 服务层 `QueryService.getEventDates(roomId?)` 计算 distinct 日期集合；供前端 `disable-date`。
- 导出接口：沿用 `GET /api/export`（或 `POST /api/export`），由现有 SystemPage 逻辑保持兼容；确保导出与筛选条件对齐。

## renderer 层改造要点（LiveDanmuPage.vue）
- 表单状态 `formData`：包含 `roomId`、`types[]`、`keywords[]`、`users[]`、`date`、分页 `page/pageSize`。
- 监听 `roomId`、`formData` 的关键字段变更：自动触发查询；“查询”按钮作为显式触发入口。
- 统一的 `fetchEvents` 方法：
  - 进入前设置 `loading=true`，渲染 `<t-loading/>` 遮罩；
  - 调用后端并在 finally 关闭遮罩；异常以 `<t-message>` 或现有告警机制提示。
- 远程用户搜索：
  - `<t-select-input>` 的 `onSearch` 触发 `GET /api/users/search`；结果填充 options；
  - 支持选择多个用户或单个用户（依据当前页面设计）。
- 直播日期：页面加载或 roomId 变更时请求 `GET /api/events/dates`，据此生成 `disableDate` 对象或函数。
- 表格与分页：与 `fetchEvents` 返回的 `total`、`data` 同步；分页改变即触发查询。

## 类型与数据模型
- 在 renderer 中定义事件类型枚举与映射，和 `GET /api/events` 的 `type` 字段保持一致；分类格式化函数集中在一个 util。
- 用户实体：`id、name、avatar(optional)`；关键词为字符串列表。
- 日期为 `YYYY-MM-DD`，后端负责转换与去重。

## 清理与规范
- 删除与“兼容旧版本”相关的回退代码（严格按用户规则）。
- 统一使用 pnpm 管理依赖（无需变更，记录为后续执行阶段规范）。
- 遵循现有代码风格与工具链；不引入额外注释。

## 验证与测试（执行阶段）
- 先编写 Electron UI 测试用例：覆盖房间自动查询、加载遮罩、筛选（类型/关键词/用户/日期）、查询按钮、表格与分页、内容格式化与导出按钮位置。
- 实现后：
  - 运行实现对照检查（reflection-checker），确保全部满足改造点；
  - 自动修复与构建（bug-fixer）；
  - 执行 Electron 测试（electron-tester）；
  - 若测试不通过，迭代至通过为止。

## 交付与兼容性说明
- 前端仅对 LiveDanmuPage.vue 与关联组件做结构性改造，保持其他页（SystemPage、EventsHistory）接口兼容。
- 新增的后端接口仅用于本页的用户搜索与日期禁用逻辑，不影响既有导出与事件查询路径。