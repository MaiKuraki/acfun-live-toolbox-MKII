**Goal**

* When a plugin fails (load/runtime), print a clear error line to the main process terminal, not only to system logs SSE or files.

**Change**

* Hook the existing `pluginErrorHandler.on('plugin-error', ...)` in `PluginManager.setupErrorHandling()` to call `console.error` with plugin id, message and stack when present.

* Keep current file logging (`pluginLogger`) and SSE publishing as-is; this adds console output without changing behavior elsewhere.

**Verification**

* Typecheck main package.

* Trigger a plugin error (e.g., enable `obs-assistant` with invalid config) and observe the main process terminal prints `[PluginError] <pluginId> <message>` and stack when available.

