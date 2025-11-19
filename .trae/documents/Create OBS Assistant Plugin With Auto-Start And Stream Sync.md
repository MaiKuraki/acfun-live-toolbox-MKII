**Overview**

* Create a new plugin `obs-assistant` under `buildResources/plugins/obs-assistant` using the provided `obs-websocket-js.js` library to control OBS.

* Add config fields to select the OBS executable path, enable auto-start, toggle stream sync, and set OBS WebSocket port/password.

* Implement plugin runtime to auto-start OBS on app start if not running and apply stream URL/encoding to OBS when the user opens the create-live page.

**Plugin Files**

* `manifest.json`

  * id: `obs-assistant`

  * main: `index.js`

  * config:

    * `obsPath` (text): Path to OBS executable (e.g., `C:\Program Files\obs-studio\bin\64bit\obs64.exe`).

    * `autoStartObs` (boolean): Auto-start OBS when app starts.

    * `syncStreaming` (boolean): Enable auto-sync of stream info to OBS.

    * `wsPort` (number): OBS WebSocket server port, default 4455.

    * `wsPassword` (text): OBS WebSocket password.

  * No UI/overlay required.

* `index.js`

  * Exports methods:

    * `init()` → reads config via method calls from IPC, checks process list, starts OBS if `autoStartObs` is true and not running.

    * `onConfigUpdated(config)` → caches new config, reconnects OBS if credentials changed.

    * `ensureObsRunning()` → checks/starts OBS using `obsPath`.

    * `applyObsSettings({ rtmpUrl, streamKey }, transcode)` → connects via WebSocket to OBS and sets stream service to RTMP custom with server/key; applies encoder/resolution from `transcode` when available.

    * `cleanup()` → closes WebSocket and timers.

  * Uses `child_process` for process detection/launch, requires `obs-websocket-js.js` for WebSocket control.

**Main Process Integration**

* IPC: Extend `plugin.updateConfig` handler to call `processManager.executeInPlugin(id, 'onConfigUpdated', [merged])` after saving config, so plugin sees updates immediately.

* IPC: Add a new handler `plugin.execute` that takes `pluginId`, `method`, `args` and calls `processManager.executeInPlugin` (with guard checks). This allows renderer pages to trigger plugin methods.

**Renderer Integration**

* `LiveCreatePage.vue`:

  * On mount and when stream info is available, read `obs-assistant` config via `window.electronApi.plugin.getConfig('obs-assistant')`.

  * If `syncStreaming` is true, call `window.electronApi.plugin.execute('obs-assistant', 'applyObsSettings', [{ rtmpUrl, streamKey }, transcodeInfo])`.

  * Optionally call `ensureObsRunning` on mount when `autoStartObs` is true (harmless if already running).

**Behavior**

* App start: plugin `init` runs in worker; if `autoStartObs` and OBS not running, it launches OBS using configured path.

* User opens create-live page: renderer retrieves stream URL/key and calls plugin to configure OBS via WebSocket (port/password from config). Resolution/encoder, if available, are also applied.

**Verification**

* Typecheck the main package.

* Manual validation flow: set config, restart app → OBS auto-start; open create-live page → stream URL/key applied to OBS; port/password respected.

**Notes**

* All changes keep the plugin isolated in a worker thread; no mocks; no server startup.

* Windows-specific process detection uses `tasklist` filtering for `obs64.exe` with a fallback to process name checks.

* If OBS WebSocket fails, the plugin logs and returns a structured error while keeping the app stable.

