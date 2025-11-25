## 问题与目标
- 问题1：未认证时从侧边栏点击“创建直播”仍会跳转；正确行为应为弹出“要直播请先登录哦”，并阻止跳转。
- 问题2：界面显示“已登录”，但 `/api/acfun/auth/status` 返回 `authenticated=false`；需统一认证态。

## 修改方案

### 1. 侧边栏点击“创建直播”增加鉴权拦截
- 文件：`packages/renderer/src/components/Sidebar.vue`
- 变更：将 `@click="navigateTo('/live/create')"` 改为 `@click="navigateToLiveCreate()"`
- 新增方法：`async function navigateToLiveCreate()`
  - 调用 `window.electronApi.http.get('/api/acfun/auth/status')`
  - 若 `authenticated !== true`：`POST /api/popup` 显示 `alert`，`title: '提示'`，`message: '要直播请先登录哦'`；`return` 不跳转
  - 若认证通过：执行 `router.push('/live/create')` 并 `reportReadonlyUpdate({ ui })`
- 目的：用户体验与规范一致（未登录不进入创建直播页）

### 2. 统一认证状态与展示
- 文件：`packages/main/src/server/AcfunApiProxy.ts`
- 变更：`GET /api/acfun/auth/status` 改为使用 `TokenManager.validateToken()`，返回：
  - `{ authenticated: boolean, reason?: string, timestamp }`
- 好处：与 `account.getUserInfo` 的校验路径一致；同时暴露 `reason` 便于前端与测试用例诊断

### 3. 渲染层账户仓库与页面行为修正
- 文件：`packages/renderer/src/stores/account.ts`
- 新增：`async function syncAuthStatus()` 在启动与路由变化时调用 `/api/acfun/auth/status`；当返回 `authenticated=false` 时：
  - `loginState.isLoggedIn=false`，清理 `userInfo` 与 `localStorage`，并上报 `readonly-store-update`
- 目的：避免仅凭 `localStorage` 将 UI 误判为已登录；认证态以主进程真实令牌为准

### 4. 回滚 LiveCreatePage 轮询逻辑到正确行为
- 文件：`packages/renderer/src/pages/LiveCreatePage.vue`
- 恢复初始逻辑：
  - 在 `startStreamStatusCheck()` 中，若 `/api/acfun/auth/status` 未认证：`streamStatus='waiting'` 并 `return`（不继续轮询）
- 目的：保持“未登录不可进入创建直播页”的前提；进入页面时必须已认证，页面内部不应绕过鉴权继续检测

## 测试与验证流程（自动化+人工）
- 自动化用例（已有）：
  - 验证未认证点击侧边栏“创建直播”触发 `alert: '要直播请先登录哦'` 且不导航（HASH导航通过 eval 不应触发）
  - 验证认证后进入“创建直播”页，按钮先为“检测推流中...”，转码就绪后变为“开始直播”并启用
  - 验证 `/api/acfun/auth/status` 与 UI 展示一致
- 人工验证：
  - 注销后点击侧边栏按钮，确认弹窗与不跳转
  - 登录后再次点击，确认路由进入并按钮状态翻转

## 影响范围与兼容
- 仅在“创建直播”入口增加鉴权拦截；不影响其他路由
- 认证态接口返回更丰富（含 reason），前端可选用但无需强依赖
- 账户仓库新增一致性校验，提升真实状态同步，不改变现有登录流程

## 风险控制
- 所有变更遵循项目现有 HTTP/API 访问模式，不引入 mock
- 侧边栏弹窗使用 HTTP `/api/popup`，不依赖渲染层 IPC 自定义实现

若同意以上方案，我将开始实施代码修改、构建与测试，直到通过。