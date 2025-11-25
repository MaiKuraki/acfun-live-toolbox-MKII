## 目标
- 在插件进程 `index.js` 后台轮询连接 OBS，自动重试与断线重连；配置变化后使用新参数。
- UI 页面只请求并显示状态，不触发连接或启动。

## 插件进程改造
- 新增轮询与重连：
  - 增加 `startLoop()` 与 `stopLoop()`，在 `init()` 时启动循环，在 `cleanup()` 时停止。
  - 循环逻辑：未连接时每隔 `retryMs`（初始 1000ms，指数退避至最大 10000ms）尝试：
    1) 检查是否运行；若 `autoStartObs=true && obsPath` 则尝试启动。
    2) 调用 `connectObs()`；成功后重置退避；失败继续退避。
  - 监听连接关闭事件，将 `connected=false` 并触发下一次重连。
- 配置更新：
  - 在 `onConfigUpdated()` 中重置退避并立即触发下一次连接尝试，使用新的 `wsPort/wsPassword/autoStartObs/obsPath`。
- 状态接口：保留 `getStatus()` 返回 `{connected, connecting, running}`。

## UI调整
- 删除“连接 OBS”按钮与相关逻辑，保留 `requestWithRetry('process.execute', { method: 'getStatus' })` 轮询或事件触发刷新；显示“已连接/未连接（运行中/未运行）”。

## 验证
- 启动应用后，插件进程自动尝试连接；断线后自动重连；修改配置（端口/密码/路径/自动启动）会立即生效并重试。
- UI 仅显示状态，不参与连接控制。