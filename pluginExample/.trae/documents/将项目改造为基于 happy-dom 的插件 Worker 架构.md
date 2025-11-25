## 问题与目标

* 现状：`<script src="https://cdn.jsdelivr.net/...">` 在 `happy-dom` 下触发 `onerror`（`d:\develop\plugin-example\index.js:16`），外部脚本未加载成功。

* 目标：在保留 `<script src>` 的方式下，能够真正从外部 CDN 拉取并执行脚本，使 `onload` 触发，随后示例代码正常运行。

## 技术依据

* `happy-dom` 支持通过 `IFetchInterceptor` 拦截并替换资源请求结果，可在发起请求前返回自定义 `Response`（参考官方文档 [IFetchInterceptor](https://github.com/capricorn86/happy-dom/wiki/IFetchInterceptor)）。

* 脚本、样式等资源的获取由内部 fetch 流程驱动；在拦截器中为目标 URL 返回 200 响应和 JS 文本，即可让 `<script src>` 正常走加载/执行流程并触发 `onload`。

## 方案设计

* 在创建 `Window` 时配置 `settings.fetch.interceptor.beforeAsyncRequest`：

  * 匹配 `https://cdn.jsdelivr.net/npm/obs-websocket-js`（含可能的重定向），使用 Node 的 `fetch`（或 `https`）拉取真实内容。

  * 返回 `new window.Response(body, { status: 200, headers: { 'content-type': 'application/javascript' } })`，让 `happy-dom` 将其作为脚本内容执行。

* 保留现有 `<script src>` 与 `onload`/`onerror` 逻辑；但将 `onerror` 补充输出 `error.message` 以利排查。

* 修正变量名大小写：

  * `index.js:22` 从 `window.OBSWebsocket` 改为 `window.OBSWebSocket`。

  * `d:\develop\plugin-example\test.js:3` 从 `OBSWebsocket` 改为 `OBSWebSocket` 或 `window.OBSWebSocket`。

* 仍保留本地 `obs-websocket-js.js` 文件备用，但在本方案中不使用它。

## 代码改动要点

* `index.js` 中 `new Window({ settings: { ... } })` 添加：

  * `settings.fetch = { interceptor: { beforeAsyncRequest: async ({ request, window }) => { /* 远程拉取后返回 Response */ } } }`。

* `scriptElement.onerror` 中打印 `error?.message`，便于定位网络或解析问题。

* 将最终打印改为 `console.log(window.OBSWebSocket)`；在 `onload` 后执行 `window.eval(mainContent)` 保持原有顺序。

## 验证步骤

* 运行：`node index.js`。

* 期望：

  * 不再出现 `脚本加载失败:`；而是看到 `obs-websocket-js 加载完成`。

  * 打印出 `OBSWebSocket`（构造函数/对象）。

  * `test.js` 不再输出 `ReferenceError`。

## 备选与回退

* 若 CDN 不可达或 Node 环境缺少 `fetch`，拦截器可改用 `https` 模块请求；或临时切换为本地执行（`window.eval(content)`）作为回退。

* 如需模拟“外部加载但不真正请求”，可结合 `handleDisabledFileLoadingAsSuccess` 仅消除错误（但不会获取真实内容），不满足本次目标，仅作调试辅助（见社区讨论）。

## 变更影响面

* 仅改动 `index.js` 与 `test.js` 两处，维持现有依赖与项目结构。

## 参考

* IFetchInterceptor 文档：capricorn86/happy-dom Wiki（2025-05-26 更新）

