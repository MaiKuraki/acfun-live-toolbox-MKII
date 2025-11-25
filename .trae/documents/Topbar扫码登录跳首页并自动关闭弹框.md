**目标**

* 点击 Topbar 右上角“扫码登录”后：跳转到首页并立刻弹出二维码登录框。

* 二维码弹框显示“登录成功”后：1 秒后自动关闭。

**现状**

* 触发点：`packages/renderer/src/components/Topbar.vue:234` 的 `login()` 仅调用 `accountStore.startLogin()`，不会导航或弹出扫码框。

* 弹框组件：`packages/renderer/src/components/home/HomeCardAccount.vue`，通过 `showQrLogin()` 打开 `t-dialog`；成功后 `setTimeout(..., 2000)` 2 秒关闭（见 `HomeCardAccount.vue` 成功回调片段）。

* 路由：`packages/renderer/src/router/index.ts` 使用 `createWebHashHistory`，首页路由为 `name: 'Home'`，`path: '/home'`。

**改动方案**

* Topbar 登录点击：

  * 修改 `login()` 为关闭账号卡片并导航到首页，同时携带查询参数触发弹框：`router.push({ name: 'Home', query: { qrLogin: '1' } })`。

  * 为避免重复创建二维码会话，移除对 `accountStore.startLogin()` 的直接调用（二维码生成由弹框组件内部完成）。

* 首页弹框触发：

  * 在 `HomeCardAccount.vue` 中引入 `useRoute()`，在 `onMounted` 时检测 `route.query.qrLogin === '1'` 则调用 `showQrLogin()`。

  * 增加对 `route.query.qrLogin` 的 `watch`，当值为 `'1'` 时同样触发 `showQrLogin()`，保证路由切换后也能打开弹框。

* 成功关闭延时：

  * 将成功后的关闭延时从 `2000` 毫秒改为 `1000` 毫秒：`setTimeout(() => { qrDialogVisible.value = false; qrSession.value.status = 'idle'; }, 1000)`。

**文件与位置**

* 修改 `Topbar.vue`：`packages/renderer/src/components/Topbar.vue:234` 的 `login()` 实现。

* 修改 `HomeCardAccount.vue`：

  * 增加 `useRoute()` 引用与 `onMounted`/`watch` 触发弹框逻辑。

  * 成功关闭的定时器由 `2000` → `1000`（现片段：`packages/renderer/src/components/home/HomeCardAccount.vue` 中的成功回调）。

* 路由文件无需改动（已有 `name: 'Home'`）。

**验证方案**

* 手动验证：

  * 在任意页面点击 Topbar “扫码登录” → 路由跳转到 `#/home` 且弹框弹出。

  * 完成扫码登录（真实流程），弹框显示成功文案 → 1 秒后自动关闭。

* 自动化（按项目流程）：

  * 编码前：生成 Electron UI 测试用例（导航到首页、触发弹框、观察成功后 1s 关闭）。

  * 编码后：

    * 使用实现一致性检查工具审视改动与需求对齐；

    * 运行错误修复与构建；

    * 执行 Electron 测试；若失败则迭代修复直至通过。

**注意事项**

* 不保留旧版兼容回退代码，移除 Topbar 中对 `accountStore.startLogin()` 的调用，避免重复二维码会话。

* 保持现有代码风格（Composition API、`t-dialog`、TDesign 组件）。

* 仅新增最小触发逻辑，不引入跨组件耦合（使用路由查询参数触发）。

