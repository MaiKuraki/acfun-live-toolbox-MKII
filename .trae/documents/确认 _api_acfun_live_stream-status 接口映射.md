## 目标
- 明确 `/api/acfun/live/stream-status` 在代码中的实现位置及其上游调用的 acfunlive-http-api 方法

## 发现与结论
- 路由由主进程注册并交由 `AcfunApiProxy` 统一处理
- 具体调用的 acfunlive-http-api 方法为 `live.getLiveStreamStatus()`

## 代码定位
- 路由挂载：`packages\main\src\server\ApiServer.ts:723-725`
- 路由分发：`packages\main\src\server\AcfunApiProxy.ts:94-165`、`170-192`
- 直播端点处理器：`packages\main\src\server\AcfunApiProxy.ts:531-678`（stream-status 分支：`586-679`）
- 上游 API 调用：`packages\main\src\server\AcfunApiProxy.ts:609`（`this.acfunApi.live.getLiveStreamStatus()`）
- acfunlive-http-api 声明：`packages\main\node_modules\acfunlive-http-api\dist\services\LiveService.d.ts:170-181`

## 后续可选
- 如需，我可补充该路由的行为说明或添加日志以辅助排障；暂不改动代码。