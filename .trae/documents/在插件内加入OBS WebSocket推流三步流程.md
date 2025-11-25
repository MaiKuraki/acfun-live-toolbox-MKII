## Scope

* Update `buildResources/plugins/obs-assistant/index.js` at the success branch in `tryAutoObsFlow` to: (1) stop stream if active, (2) set RTMP server/key, (3) start stream.

## Implementation

* Add `fetchLatestStreamInfo()`:

  * Try `POST /api/renderer/readonly-store/snapshot` with `keys: ['stream']` and return `{ rtmpUrl, streamKey }`.

  * If missing, stop

* Add `obsEnsureStopped(timeoutMs=500)`:

  * Call `GetStreamStatus`; if `outputActive` is true, call `StopStream` and poll `GetStreamStatus` until inactive or timeout.

* In `tryAutoObsFlow`, after a successful `connectObs()`:

  * Show toast "已成功连接，开始尝试推流".

  * Call `obsEnsureStopped()`.

  * Retrieve `{ rtmpUrl, streamKey }` via `fetchLatestStreamInfo()`; if not available, show error toast and return.

  * Call existing `applyObsSettings({ rtmpUrl, streamKey }, null)`.

  * Call existing `startStreaming()`.

  * Show success toast on completion; show error toast if any step fails.

## Verification

* On `/live/create` route, with OBS connected, logs show single attempt path; if OBS was streaming, it stops first.

* Settings are applied and streaming starts; popup toasts reflect each outcome.

* No reintroduction of legacy auto-push scheduler; minimal new helpers only.

## Notes

* Uses existing `OBSWebSocket` via `state.obs.call`.

* No comments added in code; error handling follows current style with toasts and console logging.

