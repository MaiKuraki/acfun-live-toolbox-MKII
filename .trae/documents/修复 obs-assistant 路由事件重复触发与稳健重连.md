## Diagnosis
- Root cause: `afterloaded` runs twice.
  - plugin-worker calls `window.afterloaded()` after loading main script (packages/main/src/plugins/worker/plugin-worker.js:88-93).
  - ProcessManager triggers `executeInPlugin(pluginId, 'afterloaded', ...)` on `process.started` (packages/main/src/plugins/PluginManager.ts:187).
  - Two invocations open two SSE connections, so same record (e.g., id "100") is consumed twice and logs duplicate.
- Server side reviewed:
  - /sse/plugins/:pluginId/overlay sends recent then subscribes without sinceId; it does not duplicate a single record (packages/main/src/server/ApiServer.ts:1116-1124).
  - DataManager.subscribe only replays when sinceId is provided (packages/main/src/persistence/DataManager.ts:114-121).

## Changes
1) Remove auto-call of `afterloaded` in plugin-worker:
- In proceedMain, execute main code but do not invoke `window.afterloaded()` automatically. Rely on ProcessManager execute to call it once.
- File: packages/main/src/plugins/worker/plugin-worker.js.

2) Add SSE connection guard on plugin side:
- In `openPluginOverlaySse()`, if `state.overlaySseConn` is non-null, skip creating a new request; or close existing before reopening.
- File: buildResources/plugins/obs-assistant/index.js.

3) Optional hardening:
- Debounce route "ui" handling if needed by ignoring duplicate `rec.id` already processed (maintain `lastProcessedId`).
- File: buildResources/plugins/obs-assistant/index.js.

## Verification
- Observe only one `[ApiServer#SSE /sse/plugins/:pluginId/overlay] connect` per plugin.
- Plugin logs for `=========================` appear once per record id.
- Route change to `/live/create` triggers `tryAutoObsFlow` once (no duplicate toasts).

## Rollback Safety
- The server is unchanged.
- Lifecycle remains consistent: single `afterloaded` triggered via ProcessManager.
- SSE connection guard prevents accidental duplicate even if future changes call `afterloaded` twice.