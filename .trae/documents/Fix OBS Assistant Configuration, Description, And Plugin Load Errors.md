**Issues Identified**

1. Configuration form not visible and no description for `obs-assistant` → ensure manifest provides clear `config` schema, `name`/`description` metadata, and optional README so the plugin manager can render entries properly.

2. Enabling shows plugin error and unrelated Acfun connection logs → likely the plugin worker failed loading `obs-websocket-js.js` (global build), returning `OBSWsLibNotAvailable` internally; meanwhile the system logs show the background Acfun adapter failures. We will harden the OBS lib loading and keep the plugin isolated from Acfun.

**Plan**

* Enhance `obs-assistant` manifest:

  * Keep existing `config` fields and description.

  * Add `ui` metadata (`name`, `description`) to surface info in plugin management.

  * Add `README.md` with a short introduction and usage (path, auto-start, sync streaming, port/password).

* Fix plugin runtime loader:

  * Replace current global lookup with robust require path: use the return value of `require('./obs-websocket-js.js')` (global build may export the constructor), fallback to `globalThis.OBSWebSocket` if needed.

  * Improve error messages when library is not available.

* Verification:

  * Typecheck main package.

  * Re-enable plugin and confirm no crash; configuration visible; description rendered.

  * Open create-live page to confirm auto OBS sync triggers without Acfun impact.

**Scope & Safety**

* Only update files under `buildResources/plugins/obs-assistant` and plugin loader logic; no changes to Acfun modules; maintain isolation and stability.

