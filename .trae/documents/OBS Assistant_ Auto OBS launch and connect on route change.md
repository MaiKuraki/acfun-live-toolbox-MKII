## Scope
- Update `buildResources/plugins/obs-assistant/index.js` to react to overlay SSE route changes.
- When route becomes `/live/create`, refresh saved config, auto-launch OBS if enabled and path exists, and connect to OBS if sync is enabled.
- Report connection status to the main window via popup API.
- Remove obsolete auto-stream logic and related timers to comply with the no-rollback rule.

## Changes
- Subscribe via existing overlay SSE handler and use `onPluginOverlayEvent` for `event: ui` → `route-changed`.
- Add `tryAutoObsFlow()`:
  - Refresh config via `loadInitialConfig()`.
  - If `autoStartObs` and `obsPath` present → call `ensureObsRunning()`.
  - If `syncStreaming` enabled → call `connectObs()` using `wsPort` and `wsPassword` from config.
  - Use `/api/popup` toast messages for success/failure.
- Replace current `scheduleStartSequence()` call on `/live/create` with `tryAutoObsFlow()`.
- Remove legacy functions and state used for auto-push:
  - `scheduleStartSequence`, `clearStartTimer`, `doStartSequence`, `getObsStreamStatus`, `stopObsStreamingWithWait`, `fetchLatestStream`.
  - Remove `triggeredStart` and `startTimer` from `state`.
- Keep existing SSE subscription (`openPluginOverlaySse`) and config merge on `config-updated` lifecycle events.

## Verification
- Manual route change to `/live/create` triggers auto OBS launch and connect.
- Popup toasts show success or error details.
- No streaming starts automatically; only launch/connect per config.
- No unused code remains in the file after cleanup.

## Next Steps After Approval
- Implement edits with no inline comments.
- Generate Electron UI test cases for route-triggered flow.
- Run implementation alignment checks, auto-fix/build, then run Electron tests.
- Iterate until tests pass without mocks and without adding new dependencies.