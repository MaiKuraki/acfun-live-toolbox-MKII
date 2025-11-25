## Change
- In `buildResources/plugins/obs-assistant/index.js` inside `tryAutoObsFlow` success branch, include detailed error messages in toasts.

## Implementation
- When `applyObsSettings` fails, toast: `推流参数设置失败：${error || '未知错误'}`.
- When `startStreaming` fails, toast: `启动OBS推流失败：${error || '未知错误'}`.
- In catch block, toast: `推流流程执行出错：${e2.message || String(e2)}`.

## Verification
- On failures, popup shows specific error details instead of generic messages.
- No other behavior changed.