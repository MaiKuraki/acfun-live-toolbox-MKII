## 核心思路
- 仅对文档静态路由 `/docs/api` 开启强缓存与 ETag，不影响现有全局禁用 ETag 的策略（主要用于插件静态资源实时更新）
- 设置 `Cache-Control: public, max-age=7d, immutable` 并显式启用 `etag`，减少重复加载 `main.bundle.js`、`bootstrap.min.css` 等大资源

## 修改点
- 文件：`packages/main/src/server/ApiServer.ts`
  - 替换当前 `/docs/api` 的静态托管为带缓存参数的 `express.static(apidocDir, { maxAge: '7d', etag: true, cacheControl: true, immutable: true })`
  - 在该路由前增加中间件设置响应头：`Cache-Control: public, max-age=604800, immutable`

## 验证
- 运行类型检查
- 在浏览器访问 `http://127.0.0.1:18299/docs/api/index.html`，确认首次加载后二次加载明显加速（命中缓存；静态资源 status 为 200 (from cache) 或 304）

## 注意
- 仅作用于文档静态路由，不改变插件资源的无缓存策略，以避免示例脚本更新被 304 缓存拦截