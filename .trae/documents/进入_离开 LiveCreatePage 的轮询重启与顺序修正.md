## 目标
- 离开 LiveCreatePage 时立即 clearInterval；进入时重新 setInterval 并首先调用 /api/acfun/live/stream-status。
- 流程：
  - 进入页→调用 stream-status 判断是否在直播；
    - 未开播→刷新推流密钥（stream-settings + 可选 stream-url），获取新密钥后开始轮询 transcode-info（setInterval）；
    - 已开播→跳转直播管理页。

## 代码改动
- LiveCreatePage.vue：
  - 导入 onUnmounted 钩子。
  - 在 onUnmounted 和 onDeactivated 中 clearInterval(streamCheckTimer)。
  - 调整 onMounted 的顺序：将 stream-status 检测提前至加载推流信息之前，未开播再执行 getStreamInfo()（其中会启动 startStreamStatusCheck()）。
  - 保留 onActivated 重启逻辑，保证 KeepAlive 场景也能恢复轮询。

## 验证
- 进入创建直播页：先判断是否在直播；未开播则刷新密钥并开始轮询，按钮从“检测推流中...”到“开始直播”。
- 切到其他页面再返回：定时器被清理并重新创建，检测流程如上。

确认后立即实施并构建，确保行为符合要求。