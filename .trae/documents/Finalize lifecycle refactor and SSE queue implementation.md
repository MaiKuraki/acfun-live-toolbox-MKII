## Remaining implementation to satisfy your goals
- Remove load-stage afterLoaded trigger and SSE from PluginManager.
- Remove all enable/disable/uninstall hook registrations and SSE from PluginManager.
- Add vm2-only lifecycle calling: keep process.started calling `afterloaded()`, add stop-before call `beforeUnloaded()`.
- Implement SSE waiting queue in obs-assistant plugin with `emitOverlayEvent` and `overlaySseReady/overlaySseQueue`.

## Files to change
1) packages/main/src/plugins/PluginManager.ts
- In `loadInstalledPlugins()`, delete the block that executes `afterLoaded` and publishes SSE; do not add `pendingInitAfterLoaded` during load stage.
- In `setupLifecycleEvents()`, delete registrations and SSE publishing for `beforeEnable/afterEnable/beforeDisable/afterDisable/beforeUninstall/afterUninstall`.

2) packages/main/src/plugins/ProcessManager.ts
- In `stopPluginProcess()`, before cleanup, add a safe call: `executeInPlugin(pluginId, 'beforeUnloaded', [], 5000)`.

3) buildResources/plugins/obs-assistant/index.js
- Add `overlaySseReady` and `overlaySseQueue` in state.
- Add `emitOverlayEvent(event, payload)` that queues or POSTs to `/api/plugins/obs-assistant/overlay/messages` when ready.
- Mark ready and flush queue after SSE connection established in `openPluginOverlaySse()`.
- Implement `async function beforeUnloaded()` to perform cleanup and emit a lifecycle event via `emitOverlayEvent`.

## Result
- Lifecycle now only triggers via vm2 functions: `afterloaded()` after process start, `beforeUnloaded()` before process stop.
- SSE emission is plugin-driven and safely queued until SSE is ready.
- All enable/disable/uninstall hook code and SSE are removed as requested.