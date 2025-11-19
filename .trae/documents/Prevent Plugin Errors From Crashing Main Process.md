**Root Cause**

* Emitting `error` on a Node `EventEmitter` without a listener throws `ERR_UNHANDLED_ERROR` and terminates the process. Current code emits `error` in `PluginErrorHandler.handleError` (packages/main/src/plugins/PluginErrorHandler.ts:149).

* The plugin worker attempts ESM `import()` first and then `require()`; with root `package.json` set to `"type": "module"`, a CommonJS-style plugin using `module.exports` in a `.js` file is treated as ESM and fails both paths, surfacing the message shown. This failure should be handled gracefully by the main process.

**Fix Strategy**

* Replace unsafe `error` emission with a domain-specific event and/or add a no-op listener so plugin errors are always handled, never crash the main process.

* Keep propagating plugin failures through logging/SSE and recovery flows, but isolate them from the main process.

* Improve error reporting for ESM/CJS mismatch and auto-recover by disabling the faulty plugin process rather than letting the failure bubble.

**Changes**

* PluginErrorHandler

  * Replace `this.emit('error', pluginError)` with `this.emit('plugin-error', pluginError)` and keep existing logs/history and recovery attempt logic intact. File: packages/main/src/plugins/PluginErrorHandler.ts:149.

  * Alternatively (if you prefer minimal diff), add a default `on('error', …)` listener in the constructor that consumes and logs errors to avoid `ERR_UNHANDLED_ERROR`. Domain event is cleaner and recommended.

* PluginManager

  * Hook `pluginErrorHandler.on('plugin-error', …)` to publish a lifecycle record to the per-plugin overlay SSE channel (e.g., `event: 'runtime-error'`, `meta.kind: 'lifecycle'`) via `DataManager`. This matches existing `config-updated` publishing and keeps the UI informed. Relevant area: setupErrorHandling block (packages/main/src/plugins/PluginManager.ts:300+).

* ProcessManager

  * In `executeInPlugin`, await `pluginErrorHandler.handleError(...)` so the recovery strategy is computed before rethrowing, and consider acting on returned `RecoveryAction` (e.g., disable process). Reference: packages/main/src/plugins/ProcessManager.ts:208–214.

  * Existing `worker.error` handling already attempts process recovery; keep that path.

* Plugin Worker

  * Keep the current ESM/CJS dual-load logic; extend error normalization so `ERR_REQUIRE_ESM` and "module is not defined" surface a concise guidance message (rename to `.cjs` for CJS or refactor to ESM). File: packages/main/src/plugins/worker/plugin-worker.js:17–31.

**Behavioral Guarantees**

* Plugin runtime/load errors will no longer emit an unhandled `error` event, preventing main process termination.

* Faulty plugins transition to `error` state and can be auto-disabled or recovered; the main renderer and API server continue running.

* SSE continues to deliver overlay updates and lifecycle events (`runtime-error`, `config-updated`) so the UI can reflect plugin status.

**Verification**

* Reproduce by updating overlay plugin config to trigger plugin start; confirm:

  * Main process stays alive; renderer remains responsive.

  * Logs show `runtime_error` recorded and a recovery action taken.

  * SSE `/sse/plugins/:pluginId/overlay` emits a lifecycle record `runtime-error` followed by normal heartbeats.

* Trigger a plugin with `.js` using CommonJS in ESM mode; verify the worker emits a normalized error and the plugin is marked `error` without affecting the app.

**Notes**

* For CommonJS plugins, ensure `manifest.main` uses `.cjs` or refactor to ESM when `.js` is used under `"type": "module"`. This avoids loader ambiguity and improves interoperability.

* No changes to acfunlive-http-api or tests are involved. We will only static typecheck as per project rules.

