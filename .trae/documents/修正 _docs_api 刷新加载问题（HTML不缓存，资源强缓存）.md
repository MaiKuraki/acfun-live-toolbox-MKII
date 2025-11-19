## 原因分析
- 为 /docs/api 全量设置了强缓存与 immutable，导致浏览器对 index.html 也不再发起重新获取或错误处理路径，刷新可能命中异常状态而不加载

## 修正策略
- HTML 不缓存，资源强缓存：
  - 对 `index.html` 设置 `Cache-Control: no-store`
  - 对 JS/CSS/图片等静态资源设置 `Cache-Control: public, max-age=7d, immutable`
- 移除之前为整个 /docs/api 路由统一设置的强缓存中间件，改用 `express.static` 的 `setHeaders` 按文件路径区分设置

## 修改点
- 文件：`packages/main/src/server/ApiServer.ts`
  - 替换 `/docs/api` 静态托管为：
```
this.app.use('/docs/api', express.static(apidocDir, {
  cacheControl: true,
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-store');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    }
  }
}))
```

## 验证
- 类型检查通过
- 刷新 `http://127.0.0.1:18299/docs/api/index.html` 时，HTML 每次重新获取，资源命中缓存；加载稳定且更快