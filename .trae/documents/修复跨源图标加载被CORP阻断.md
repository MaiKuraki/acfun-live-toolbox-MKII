## 问题
- 浏览器错误 `net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin 200 (OK)` 表示响应带有 `Cross-Origin-Resource-Policy: same-origin`，而前端来自不同源（5174端口），导致图片被阻断。
- 服务器启用了 `helmet()`，默认会设置 CORP 为 same-origin；当前仅关闭了 `contentSecurityPolicy/crossOriginEmbedderPolicy/frameguard`，但未修改 `crossOriginResourcePolicy`。

## 改动点
- 修改 `packages/main/src/server/ApiServer.ts` 的 `configureMiddleware()`：
  - 使用 `helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false, frameguard: false, crossOriginResourcePolicy: { policy: 'cross-origin' } })`（或直接 `crossOriginResourcePolicy: false`）。
  - 这是全局修复，确保所有静态资源可被跨源页面嵌入。
- 保险起见，在插件静态托管 `sendFile()` 处补充响应头：
  - `res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')`
  - 保持已有 `Cache-Control` 等；`cors()` 已启用，继续保留。

## 验证
- 启动应用后，打开插件列表；网络面板检查 `/plugins/<id>/ui/icon.svg` 响应头应为 `Cross-Origin-Resource-Policy: cross-origin`，请求不再被阻断；图标正常显示。
- 回归检查：禁用插件时仅放行图标路径的逻辑仍有效（`ApiServer.ts:594-604`），不影响安全策略。

## 影响范围与注意
- 仅调整 CORP 策略，不开启跨域脚本执行；对图片/字体/媒体等跨源嵌入生效。
- 保持 `CORS` 的 `origin: true` 与 `credentials: true` 设置不变。

## 如有需要的后续
- 若你希望只对 `/plugins/:id/*` 生效而不全局，改为仅在 `sendFile()` 设置 CORP 头，不在 `helmet()` 全局设置。