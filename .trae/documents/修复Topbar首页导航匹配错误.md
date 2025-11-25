**问题**

* 点击Topbar“扫码登录”时报错：`No match for { name: 'Home' }`，说明按“路由名”跳转未匹配到路由。

**原因分析**

* 路由配置存在首页：`packages/renderer/src/router/index.ts:36-44` 定义 `name: 'Home'`。

* 某些运行场景下（插件窗口或路由树未就绪），按“路由名”解析可能失败。

**改动方案**

* 将 Topbar 登录的导航由“按路由名”改为“按路径”以提高鲁棒性：`router.push({ path: '/home', query: { qrLogin: '1' } })`。

* 增加降级兜底：若 `router.push` 抛错，则设置 `window.location.hash = '#/home?qrLogin=1'` 强制进入首页并附带触发参数。

* 保留现有首页弹框触发逻辑（已在 `HomeCardAccount.vue` 中实现对 `qrLogin=1` 的 mounted 与 watch 触发）。

**修改文件**

* `packages/renderer/src/components/Topbar.vue:234` 的 `login()` 实现。

**验证**

* 点击“扫码登录”应跳转至 `#/home` 并弹出二维码弹框。

* 在不同页面与插件窗口场景下均能正常触发。

