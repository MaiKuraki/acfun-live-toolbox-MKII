## 根因研判
- 动态导入失败通常由以下原因触发：
  - SFC 结构不合法（出现 `<style>` 之后的散落 JS/未闭合标签/缺失 `<script setup>`）。
  - 构建器无法解析模块（语法错误、无效导出）。
  - Dev 服务器返回 404/500（模块路径或时戳缓存异常）。
- 当前仓库此前存在 `</style>` 之后散落 JS 的问题，已移除并将订阅逻辑归位到 `onMounted`；需验证 dev 环境是否仍使用旧缓存导致加载失败。

## 修复计划
1. 代码合法性验证（只读）
- 运行渲染层类型检查：`pnpm -C packages/renderer typecheck`（已通过，继续执行一次以确认）。
- 进行一次构建编译验证（不启动 dev server）：`pnpm -C packages/renderer build`，让 Vite 对 SFC 做完整编译以暴露语法/结构问题。

2. 路由稳定性检查（只读）
- 检查 `router/index.ts` 的 `System → Console` 子路由：懒加载 `() => import('../pages/Console.vue')` 已存在，保持不变。
- 检查 `Sidebar.vue` 点击项：`navigateTo('/system/console')` 已正确，保留。

3. 若构建仍失败的回退修复（实施）
- 全量扫描 `Console.vue`：
  - 确保仅存在 `<template>/<script setup lang="ts">/<style scoped>` 三块，结尾无游离代码；
  - 导入路径有效（`../stores/console`、`../services/globalPopup` 等文件存在且可编译）。
- 如定位到具体语法问题（例如非法字符或未闭合模板），逐一修复并重跑类型检查与构建。

4. 缓存影响排查（说明）
- 若仅在 dev server 下失败，通常是 HMR 缓存造成的时戳污染；建议用户硬刷新或重启 dev server。我们保持仓库侧代码正确，不在本次会话启动渲染进程。

## 交付与验证
- 完成上述修复后，`pnpm -C packages/renderer typecheck ; pnpm -C packages/renderer build` 均通过。
- 浏览器点击侧边栏“控制台”不再报 `Failed to fetch dynamically imported module`，页面正常渲染。