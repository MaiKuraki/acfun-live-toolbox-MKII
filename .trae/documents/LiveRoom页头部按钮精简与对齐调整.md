## 目标
- 删除“创建直播”按钮，只保留“添加房间”和“刷新”。
- 修复“添加房间”和“刷新”两个按钮的图标与文字垂直对齐问题，统一视觉对齐。

## 修改文件
- `packages/renderer/src/pages/LiveRoomPage.vue`

## 具体改动
1) 删除“创建直播”按钮
- 移除页头 `header-actions` 中的 `<t-button theme="success" @click="createLive">` 整块。
- 同时删除不再使用的方法 `createLive()`。

2) 图标与文字垂直对齐
- 将两个按钮的图标改为使用 TDesign 的 `#icon` 插槽：
  - `添加房间`：`<t-button theme="primary"> <template #icon><t-icon name="add" /></template> 添加房间 </t-button>`
  - `刷新`：`<t-button variant="outline"> <template #icon><t-icon name="refresh" /></template> 刷新 </t-button>`
- 补充一个轻量样式确保内容容器居中：
  - 为按钮添加类名（如 `class="room-action-btn"`），在同文件 `<style scoped>` 中添加：
    - `.room-action-btn :deep(.t-button__content) { align-items: center; }`
    - 如有必要增加微小间距，使图标与文字视觉平衡（保持 TDesign 默认间距即可）。

## 验证
- 运行渲染包的类型检查，确保无未引用方法和类型错误。
- 静态检查页面：按钮排列仅显示“添加房间”、“刷新”，图标与文案垂直居中。

## 约束
- 不引入依赖；仅在现有文件内做最小改动。
- 不影响其他页面和交互逻辑（添加房间弹窗与刷新函数保持不变）。