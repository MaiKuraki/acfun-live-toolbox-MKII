## 问题
- 在 LiveCreatePage.vue 中重复导入了 `onActivated` 和 `onDeactivated`，导致编译报错 Identifier has already been declared。

## 解决方案
- 删除重复的导入语句，保留单行合并导入：`import { ref, reactive, computed, onMounted, nextTick, watch, onActivated, onDeactivated } from 'vue'`。
- 运行类型检查与构建，确保无其它相关错误。

## 验证
- 渲染层编译通过，无重复声明错误。
- 页面生命周期钩子正常生效（返回页面后恢复检测）。