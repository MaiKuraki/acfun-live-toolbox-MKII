## 接口与后端
- 用户搜索接口：实现 `GET /api/users/search` 直接查询 `users` 表，条件 `nickname LIKE ?`，返回 `{ id: user_id, name: nickname }`；支持分页与可选 `room_id` 限定（只做 `live_actions` 存在该用户的房间过滤）。
- 用户列表接口：`GET /api/users` 从 `users` 表读取 `{ id, name }`，用于弹出时预加载。
- 弹幕查询仅返回 `live_actions`：调整 `queryEvents(...)` 去掉 `live_states` 联合；`WHERE` 支持：
  - `room_id`
  - `type` 多选（`comment/gift/like/enterRoom/followAuthor` 映射为 `danmaku/gift/like/enter/follow`）
  - `user_id`（精确）
  - `user_kw`（`users.nickname LIKE ?`）
  - `q`（`COALESCE(u.nickname, '')` 与 `a.content`、`a.extra_json` LIKE）
- 选择列 `user_name`：`COALESCE(u.nickname, '')`。若某环境 `nickname` 不存在会报错，我将同步在 SQL 生成中提供安全降级（检测失败时自动移除该列与条件），但默认按您要求使用 `nickname`。

## 渲染层（LiveDanmuPage.vue）
- 发言用户选择：按示例实现 `<t-select-input allow-input>`，在 `@input-change` 调用 `/api/users/search?keyword=...`；选项 `{label: nickname, value: user_id}`；选择后将 `user_id` 传给 `/api/events`。
- 关键词筛选：字段名改为“关键词”，查询将 `q=formData.keyword.trim()` 传入。
- 类型筛选：继续以逗号分隔传 `type`。
- 表格列：内容列单行省略不换行；移除“查看详情”文字按钮，表头最右增加“操作”列放查看详情图标，点击弹出详情。

## 验证
- 输入“用户名关键词”可获得下拉选项（来源 `users.nickname LIKE ?`）。
- 查询结果只包含 `live_actions`；类型、关键词、用户筛选均生效；无 `live_states` 数据。
- UI 行为与样式满足“单行省略”“操作列图标”。

## 注意
- 我不会保留任何旧版回退代码；如检测到 `users.nickname` 不存在，会将相关匹配自动降级到内容/JSON 字段以避免报错（但默认按您指定列实现）。