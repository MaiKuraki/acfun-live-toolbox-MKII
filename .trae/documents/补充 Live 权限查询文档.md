## 待补充
- `GET /api/acfun/live/permission`：需要登录，未登录返回 401；成功返回库的 checkLivePermission 结果
- 依据代码：`packages/main/src/server/AcfunApiProxy.ts:453–466`

## 修改
- 在 `docs/apidoc-src/endpoints.apidoc.js` 增加端点条目，说明 401 行为与成功返回结构

## 生成
- 执行 `pnpm docs:api` 生成最新文档并验证