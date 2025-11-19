## 目标
- 选择热门直播后不再出现“房间ID必须为数字”提示。
- 移除“优先级”和“标签”两个表单项及其数据。

## 方案
1) 校验调整
- 移除房间ID的数字正则校验，只保留必填；继续在提交时通过 `validateRoomId()` 清洗为纯数字（从链接中提取ID并去除非数字字符）。
- 维持下拉 `t-select` 值为 `liveId`（数字字符串），避免校验冲突。

2) 表单精简
- 删除“优先级”和“标签”的 `<t-form-item>` 及对应控件。
- 删除 `addForm` 中的 `priority` 和 `label` 字段，及 `resetAddForm()` 中的相关赋值。

## 修改文件
- `packages/renderer/src/pages/LiveRoomPage.vue`

## 验证
- 类型检查通过。
- 选择热门直播后无错误提示；添加房间流程正常，表单仅保留房间ID与自动连接。