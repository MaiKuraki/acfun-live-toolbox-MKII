**Issue**

* The error shows JSON parse failure for `obs-assistant` manifest in the user-data plugins directory, not the bundled `buildResources` one. A stale or malformed `manifest.json` was already copied earlier and now fails parsing, causing the plugin to enter error state.

**Plan**

* Enhance `PluginManager.loadInstalledPlugins()` manifest handling:

  * Read `manifest.json` from user-data.

  * If JSON.parse throws `SyntaxError`, try to locate the bundled manifest from `buildResources/plugins/<id>/manifest.json` or `process.resourcesPath/plugins/<id>/manifest.json`.

  * If a bundled manifest is found and parses successfully, overwrite the user-data `manifest.json` with the bundled one, then continue loading using the repaired manifest.

  * Log the repair and keep normal flow (including merging base/default fields).

* This avoids manual deletion, keeps plugin list healthy, and prevents invalid manifests from blocking startup.

**Verification**

* Typecheck main package.

* Restart app: `obs-assistant` loads with the repaired manifest and shows config/description.

* If bundled manifest is missing, the existing error handling remains (plugin marked error with logged message).

