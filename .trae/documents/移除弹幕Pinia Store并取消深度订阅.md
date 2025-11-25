## 目标
- 弹幕数据改为页面局部状态管理，不进入全局 Pinia store
- 取消对弹幕列表的深度 watch 与只读上报，降低性能开销

## 现状确认
- `packages/renderer/src/stores/danmu.ts` 内含弹幕列表、过滤与 WebSocket 连接、以及 `watch(..., { deep: true })` 的只读上报（参见 danmu.ts:268）。
- 代码库中未发现 `useDanmuStore` 的任何引用，仅定义（全局搜索确认）。
- `packages/renderer/src/pages/LiveDanmuPage.vue` 已使用本地 `ref` 管理弹幕与过滤、分页，无需全局 store。

## 变更方案
1. 删除 `packages/renderer/src/stores/danmu.ts` 整个文件，移除：
   - `danmuList`、`filteredDanmuList`、`stats` 等与弹幕集合相关的状态与计算
   - WebSocket 连接与事件派发逻辑（与 Electron 预加载 API 路线不一致）
   - 深度 `watch` 的只读上报（`reportReadonlyUpdate` 中的 `danmu` 切片）
2. 不再对弹幕进行任何只读上报；只保留房间状态由 `room.ts` 管理与上报。
3. 保持 `LiveDanmuPage.vue` 的局部状态与现有 HTTP 加载/导出逻辑不变（它已满足需求）。

## 兼容性与验证
- 引用检查：全局搜索确认无任何文件引用 `useDanmuStore`，删除不会引发导入错误。
- 类型检查与构建：在确认后执行 `pnpm -C packages/renderer typecheck; pnpm -C packages/renderer build` 进行静态验证。

## 清理与文档
- 删除冗余代码后，检查并清理无用类型与注释。
- 更新 `change` 目录下对应 `tasks.md` 的完成状态（若存在）。
- 会话结束后将要点写入 memory。