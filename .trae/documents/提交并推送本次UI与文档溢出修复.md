## 变更概览
- 修改 `packages/renderer/src/pages/Settings.vue`：
  - 路径与按钮文字溢出处理（ellipsis、min-width: 0）
  - 链接跳转改为异步并加入错误提示（openExternal 调用）
  - 存储占用区重构、卡片化开关、响应式优化
- 修改 `packages/renderer/src/pages/ApiDocs.vue`：
  - 长路径与参考文件的溢出处理（title、等宽字体、路径单元格样式）
  - 网格容器与子卡片 `min-width: 0` 并增加响应式断点
  - 表格列宽固定与溢出隐藏，移动端字体与间距优化
- TypeScript 类型检查已通过

## 提交信息（中文多段说明）
- 第一段（主题）：
  - 优化设置页与开发文档的文字溢出与布局
- 第二段（详情）：
  - Settings.vue：路径/按钮省略显示、openExternal 异步错误处理、存储占用UI重构、响应式
  - ApiDocs.vue：长路径省略+title、网格/表格溢出处理与断点、移动端适配
  - 清理无用样式与保持一致的视觉规范

## 推送流程
- 获取当前分支并检查远端：
  - `git status -s ; git remote -v`
- 统一暂存并提交：
  - `git add -A ; git commit -m "优化设置页与开发文档的文字溢出与布局" -m "Settings.vue: ellipsis/响应式/openExternal错误处理；ApiDocs.vue: 路径省略/网格与表格溢出处理/断点优化；类型检查通过"`
- 推送到当前分支：
  - 方案A（已有上游）：`git push`
  - 方案B（首次设置上游）：`$branch = (git rev-parse --abbrev-ref HEAD).Trim() ; git push -u origin $branch`
- 若远端拒绝（需更新）：
  - `git fetch origin ; git pull --rebase ; git push`

## 更新变更记录
- 更新 `change/tasks.md`：将“文字溢出与链接跳转404修复”标记为完成，并简述具体变更点（不新增回退代码）

## 验证
- 本地再次运行类型检查：`pnpm run typecheck`
- 访问设置页与开发文档页，检查长路径/参考文本在不同宽度下不溢出，悬停可查看完整title；点击外链无404并正确打开

## 将执行的实际命令（PowerShell；使用分号连接）
- `git status -s ; git remote -v`
- `git add -A ; git commit -m "优化设置页与开发文档的文字溢出与布局" -m "Settings.vue: ellipsis/响应式/openExternal错误处理；ApiDocs.vue: 路径省略/网格与表格溢出处理/断点优化；类型检查通过"`
- `git push` 或 `($branch = (git rev-parse --abbrev-ref HEAD).Trim() ; git push -u origin $branch)`
- 如遇拒绝：`git fetch origin ; git pull --rebase ; git push`
- `pnpm run typecheck`

请确认以上计划，我将按此执行提交并推送。