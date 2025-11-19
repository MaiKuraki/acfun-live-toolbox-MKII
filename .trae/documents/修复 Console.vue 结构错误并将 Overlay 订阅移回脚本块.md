## 问题定位
- 在 `</style>` 之后出现了散落的 JavaScript 代码（行 931 起），导致 SFC 结构错误，类型检查报错定位到 `Record<string, number>`。
- 这段代码本应位于 `<script setup>` 的 `onMounted` 中（订阅 overlay page-status 并聚合连接数）。

## 修复方案
1. 结构修复
- 删除 `</style>` 之后的散落 JS 片段（行 931–末尾的订阅块）。
- 将“Overlay连接数：初始化快照并订阅各插件的页面状态”的整段逻辑移入 `<script setup>` 的 `onMounted` 中，与现有代码合并，保持变量作用域一致（`overlayCounts/overlayCount`）。

2. 逻辑与类型保持
- 保持 `const counts: Record<string, number> = {}` 类型不变。
- 保留 `unsubMap` 清理逻辑于 `onUnmounted`。
- 不改动已实现的 Debug 默认不勾选与过滤逻辑。

## 验证
- 运行渲染层类型检查：`pnpm -C packages/renderer typecheck`。
- 手动验证：浏览器打开某插件 overlay 后，“Overlay 连接”数字即时更新，关闭时减少；Debug 默认不勾选时仅显示 error，勾选显示全部。

## 影响范围
- 仅修复渲染层 SFC 结构与代码位置；无主进程改动；不引入依赖；不保留回退代码。