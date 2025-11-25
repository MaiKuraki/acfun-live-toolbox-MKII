## 问题定位
- 日志源头在 `packages/main/node_modules/acfunlive-http-api/dist/services/LiveService.js:173`：
  - `console.log('getLiveCategories API response:', JSON.stringify(data, null, 2));`
- 我们之前在 `.git-temp-acfunlive` 目录删掉同名日志，但实际运行用的是已安装的 `acfunlive-http-api`。

## 解决方案
- 在 `AcfunApiProxy` 的 `handleLiveEndpoints('categories')` 分支加入一次性响应处理，不调用库层会打印日志的路径，或在调用后过滤控制台输出。
- 更稳方案：在主进程的控制台重写中增加匹配，直接抑制该行，无需改第三方包：
  - 当消息以 `getLiveCategories API response:` 开头时返回，不记录也不转发。
- 插件渲染窗口也做相同抑制，确保任何位置出现该输出都被消音。

## 改动点
- `packages/main/src/index.ts`：在五个 `console.*` 重写的 `suppress` 条件里添加：
  - `message.startsWith('getLiveCategories API response:')`
- `packages/main/src/plugins/PluginWindowManager.ts`：在 `webContents.on('console-message')` 的 `suppress` 条件里添加：
  - `msg.startsWith('getLiveCategories API response:')`

## 验证
- 触发 `/api/acfun/live/categories` 请求，终端不再出现该行；其它错误日志仍保留。
- 若需要临时查看：可删除该规则或开启 `ACFRAME_DEBUG_LOGS=1`（注意此开关影响 HTTP 访问日志，不影响控制台过滤）。

## 说明
- 不改动第三方包，遵循“禁止为兼容旧版本保留回退代码”的原则，集中在控制层做抑制，便于维护。