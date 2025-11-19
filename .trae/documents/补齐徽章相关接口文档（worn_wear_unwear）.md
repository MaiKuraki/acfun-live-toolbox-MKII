## 待补全
- 根据 `AcfunApiProxy.ts:1113–1238` 实现，补充徽章接口：
  - `GET /api/acfun/badge/worn`（query: userID 必填）
  - `POST /api/acfun/badge/wear`（body: uperID 必填）
  - `POST /api/acfun/badge/unwear`（无参数）

## 实施
- 在 `docs/apidoc-src/endpoints.apidoc.js` 增加上述端点条目，包含参数说明、返回结构、以及 400 错误示例（按代码中的错误信息）。
- 生成文档并验证页面展示。