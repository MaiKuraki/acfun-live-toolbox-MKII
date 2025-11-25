## 问题复现
- 强制修改 `window.location.hash` 能看到 `event: ui` 的 `route-changed`，说明桥接与SSE通道正常。
- 点击侧边栏不出现路由事件，推断 `router.afterEach` 未触发或触发后未成功上报。

## 可能原因
- 侧边栏 `router.push` 导航成功，但 `afterEach` 未执行（受导航状态或时机影响）。
- Hash 路由未变化（点击同一路由）导致 `hashchange` 不触发。
- 上报节流在时序上被其他切片覆盖，导致该批次未含 `ui` 字段。

## 修复与加固方案
1) 侧边栏点击后立即上报（不依赖 afterEach）：
- 在 `Sidebar.vue` 的 `navigateTo(path)` 中，`await router.push(path)` 成功后，取 `router.currentRoute.value` 构造 `ui.routePath/pageName/pageTitle`，立刻调用 `reportReadonlyUpdate({ ui: ... })`。
- 这样无论 `afterEach` 或 `hashchange` 是否触发，都有一次明确的增量上报。

2) 去重与相同路由点击处理：
- 若目标路由与当前路由相同，仍进行一次上报（防止同一路径点击不产生事件）。

3) 观测与排查辅助（仅日志）：
- 在 `router.afterEach` 处输出一次简短日志（控制台）以确认是否触发；在 `Sidebar.navigateTo` 上报后也输出一次日志。

## 验证
- 订阅：`curl.exe --no-buffer -H "Accept: text/event-stream" "http://127.0.0.1:18299/sse/plugins/obs-assistant/overlay"`
- 点击侧边栏切换到“直播→房间管理”后，出现：`event: ui`，`payload.event: 'route-changed'`，`payload.payload` 含 `routePath/pageName/pageTitle`。
- 订阅只读仓库：`curl.exe --no-buffer -H "Accept: text/event-stream" "http://127.0.0.1:18299/sse/renderer/readonly-store/subscribe?keys=ui"`，看到 `readonly-store-update` 的 `ui` 字段含同样路由信息。

## 影响面
- 仅在侧边栏导航函数添加一次显式上报；不改变既有路由与SSE结构；不保留回退代码。