## 待补充
- 文档新增 `GET /sse/system/logs`：心跳、init 推送最近日志、后续 log 事件流
- 依据代码：`packages/main/src/server/ApiServer.ts:384–421`

## 修改
- 在 `docs/apidoc-src/endpoints.apidoc.js` 添加条目：
  - 说明 `event: init` 初始批量、`event: log` 单条日志、`event: heartbeat` 心跳
  - 头部 `Accept: text/event-stream`

## 生成
- 执行 `pnpm docs:api` 生成最新文档并验证在页面可见