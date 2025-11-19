## 目标
- 将现有封面上传控件改为更简洁的 `<t-upload v-model:files>` 用法，接受 `image/*` 并以 Base64 持久化到 `basicForm.cover`。
- 初始时根据已保存的 Base64（若有）回填到 `files` 以展示缩略图。

## 具体改动
- 模板：用 `<t-upload v-model:files="files" theme="image" accept="image/*" :max="1" :auto-upload="false" placeholder="点击上传图片文件" />`，移除 `before-upload/on-success/on-error/on-remove` 等不必要回调，仅保留 `@change`（如果需要日志）。
- 脚本：
  - 新增 `const files = ref<UploadFile[]>([])` 作为唯一的上传模型源；移除 `coverFiles/coverPreviewVisible/coverPreviewUrl/uploadAction` 与相关处理函数（裁剪如需保留，后续独立触发）。
  - 监听 `files` 变化：当存在 `files[0]` 且其 `raw`（或 `url`）更新时，将文件读为 Base64 并写入 `basicForm.cover`；若 `files` 为空则清空 `basicForm.cover`。
  - `loadDraft()`：当 `basicForm.cover` 有值时，初始化 `files` 为 `[ { url: basicForm.cover, name: 'cover.jpg', status: 'success' } ]`。
  - `saveDraft()`：保持现有逻辑，`cover` 字段写入 Base64。
- 校验：沿用 `basicRules.cover` 的必填校验；提交前如果 `basicForm.cover` 为空则提示。
- 清理：删除无用的与旧上传相关的函数与状态，遵循“删除回退代码”的用户规则。

## 验证
- 类型检查：在 `packages/renderer` 下执行 `pnpm typecheck`；不启动渲染进程、不编写/运行测试。
- 交互：选择图片 → 预览显示 → `saveDraft payload` 含 `cover` Base64；刷新/返回 → `loadDraft` 回填到 `files` 并显示图片。

## 影响面
- 仅修改 `LiveCreatePage.vue` 的封面上传逻辑；不影响推流与分类选择等其他功能。请确认后我立即按此实施。