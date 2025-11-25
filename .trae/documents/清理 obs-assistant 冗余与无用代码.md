## 清理范围
- 只读仓库 SSE：不再用于获取推流信息，删除相关状态与函数，并移除 init/cleanup 中的调用。
- 未使用函数与变量：删除 `parseResolution`、`snapshotStream` 相关残留、`tryStartStreamingIfNeeded` 空实现、未使用的 `path` 引入与 `configLoaded` 标记。
- 保留：overlay SSE（路由触发）、obs-websocket 兜底与 mocks、主动获取快照 `fetchReadonlySnapshot` 与 `fetchLatestStream`。

## 具体清理项
- 删除 state 中 `sseConn/sseBuffer/sseReconnectTimer/snapshotStream`。
- 删除并移除调用：`openReadonlySse/handleSseChunk/parseSseMessage/onReadonlyStoreEvent/scheduleSseReconnect/closeReadonlySse`。
- 删除 `parseResolution` 与 `tryStartStreamingIfNeeded`。
- 移除未使用的 `const path = require('path')`。
- 去除 `loadInitialConfig` 中对 `configLoaded` 的赋值（可选）；保留其合并配置功能。

## 验证
- 构建无误；功能保持：路由 3 秒延迟、主动获取最新 stream、OBS 先停后启、连接错误重试与提示。

如确认，我将执行上述清理。