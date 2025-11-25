## 目标
- 屏蔽你截图中的 2xx 成功访问日志（尤其是 `/api/acfun/*` 相关）以减少噪音，同时保留 4xx/5xx 错误访问日志。
- 统一 Morgan 的输出到系统日志管线，便于在需要时恢复/查看。

## 现状确认
- HTTP 访问日志通过 Morgan 注册在 `packages/main/src/server/ApiServer.ts:135-143`，仅开发模式启用；当前仅跳过 `/api/renderer/readonly-store`。
- 控制台输出在 `packages/main/src/index.ts:42-107` 被重写并存在少量抑制，但 Morgan 默认写 `process.stdout`，不会经过重写，所以你看到大量 GET 200 行。
- `/api/acfun` 路由由 `packages/main/src/server/ApiServer.ts:743-744` 挂载到 `AcfunApiProxy`；内部也有 `console.log/warn/error`，这些会进入系统日志，但与访问日志不同。

## 修改方案
- 扩展 Morgan 的 `skip` 策略（`packages/main/src/server/ApiServer.ts`）：
  - 全局跳过 2xx/3xx（只保留 4xx/5xx）；
  - 额外跳过以 `/api/acfun/` 开头的路径；
  - 额外跳过 UA 包含 `ACLiveFrame` 的访问（Electron 自身轮询产生的噪音）。
- 增加可控开关：当 `process.env.ACFRAME_DEBUG_LOGS === '1'` 时，不跳过任何访问日志（开发排障用），否则按上述规则屏蔽。
- 可选：为审计统一 Morgan 的输出到系统日志（LogManager），配置 `stream.write` → `LogManager.addLog('http', msg.trim(), 'info')`，这样即使控制台不显示也能在系统日志/文件中保留；默认仍按 `skip` 规则屏蔽 2xx/3xx。

## 具体改动点
- `packages/main/src/server/ApiServer.ts:135-143` 附近：
  - 调整 `morgan('combined', { skip })` 的 `skip(req, res)` 逻辑，加入：
    - `if (process.env.ACFRAME_DEBUG_LOGS === '1') return false`
    - `const status = res.statusCode; if (status < 400) return true`
    - `const url = req.originalUrl || req.url || ''; if (url.startsWith('/api/acfun/')) return true`
    - `const ua = req.headers['user-agent'] || ''; if (ua.includes('ACLiveFrame')) return true`
  - 可选新增 `stream: { write: msg => LogManager.addLog('http', msg.trim(), 'info') }`

## 验证
- 开发模式下运行：触发 `/api/acfun/*` 请求，确认终端不再出现 2xx/3xx GET 行；故意触发 4xx/5xx（如缺参），确认错误访问仍记录。
- 设置 `ACFRAME_DEBUG_LOGS=1` 后重启，确认所有访问日志恢复显示。
- 检查系统日志文件与 SSE 是否仍保留错误访问审计（若启用 `stream` 方案）。

## 注意
- 不保留回退代码；以简洁明确的 `skip` 规则实现，无冗余注释。
- 不影响 `/api/acfun` 功能路由及其内部业务日志（`AcfunApiProxy.ts`），仅屏蔽 HTTP 访问层噪音。