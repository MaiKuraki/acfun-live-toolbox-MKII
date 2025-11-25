## 后端修复
- 关键词报错：在事件查询中仅当 `users` 表存在 `nickname` 列时才引用 `u.nickname`；否则完全移除对 `u.nickname` 的过滤与选择，避免 `SQLITE_ERROR`。
- 列存在检测：增强 `hasUsersNicknameColumn()`，除 `PRAGMA table_info(users)` 外，尝试执行 `SELECT nickname FROM users LIMIT 1`，失败则判定为不存在。
- 用户名降级提取：当 `nickname` 不存在时，用 `COALESCE(json_extract(a.extra_json, '$.user.userName'), json_extract(a.extra_json, '$.user.nickname'), json_extract(a.extra_json, '$.user.name'), json_extract(a.extra_json, '$.userName'), json_extract(a.extra_json, '$.nickname'))` 作为 `user_name`。
- 事件列表仍只返回 `live_actions`，不再 UNION `live_states`，保证类型筛选与分页一致。

## 用户搜索接口
- `GET /api/users/search`：
  - 有 `nickname`：`users.nickname LIKE ?` 搜索，并用 `EXISTS (SELECT 1 FROM live_actions ... room_id)` 进行房间限定。
  - 无 `nickname`：从 `live_actions.extra_json` 提取用户昵称并 LIKE 搜索，房间限定同上。
- 返回 `{ items: [{ id: user_id, name: nickname }], total }`。

## 前端改动（LiveDanmuPage.vue）
- 用户下拉显示：
  - 增加受控属性 `popupVisible` 绑定到 `<t-select-input :popup-visible="userPopupVisible" @popup-visible-change="onUserPopupVisible">`。
  - 在 `onUserSearch` 获取到 `options` 后自动 `userPopupVisible = true`；选择后 `userPopupVisible = false`。
  - 仅在选择下拉项后调用事件查询（不在输入时调用），即在 `onUserSelect` 或 `@change` 时触发 `onSubmit`。
- 输入调用 users 接口：保持 `@input-change` 只调用 `/api/users/search`，不调用 `/api/events`；选择后才调用 `/api/events`。
- 用户列展示：`userName` 为空时显示 `userId` 作为回退，保证“用户”列不空。

## 验证
- 请求示例 `room_id=173620&type=danmaku&q=睡了` 不再报 `no such column: u.nickname`。
- 输入用户名关键词时弹出下拉并显示匹配的 `nickname`；选择后才发起事件查询，列表正确过滤。
- “用户”列在弹幕类型数据中不再为空（至少显示 `userId` 或提取的昵称）。

## 说明
- 保持不添加旧版兼容回退代码；若数据库后续增加 `nickname` 列，逻辑会自动启用昵称过滤与展示。