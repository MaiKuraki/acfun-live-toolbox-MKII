## 目标
- 将“房间ID”输入改为 `t-select`（filterable + creatable），点击输入框弹出下拉，从热门直播中直接选择并填入房间ID。
- 移除之前的下拉按钮方案，避免 `onChange.apply is not a function` 异常。

## 调整点
- 文件：`packages/renderer/src/pages/LiveRoomPage.vue`
- 在 `t-form-item[name="roomId"]` 用 `t-select v-model="addForm.roomId"` 替换 `t-input + t-dropdown`，设置 `filterable clearable creatable :loading="hotLoading"`，并在 `@popup-visible-change` 与 `@focus` 时拉取热门列表。
- 选项结构采用 `label/value`，不使用 `onClick`，规避 TDesign 事件调用问题。
- 在提交前于 `addRoom()` 中调用一次 `validateRoomId()`，保证从链接中提取 ID。
- 清理无用方法与样式：移除旧的 `onSelectHotLive/onHotVisibleChange` 与 `.roomid-input-row` 样式。

## 验证
- 运行渲染包类型检查，确保无 TS 错误。
- 交互：点击“房间ID”选择框展开热门列表，选择即写入；也支持直接输入数字或完整链接。

## 约束
- 不改动 store/主进程逻辑；仅在该页面实现最小可用改动。
- 不引入新依赖，仅使用现有 TDesign 组件。