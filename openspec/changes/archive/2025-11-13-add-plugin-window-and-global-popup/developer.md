# Developer Notes: Plugin Window & Renderer Popup Bridge

## Plugin Window Manifest
- Add `window` section in plugin manifest under `buildResources/plugins/<plugin-id>/manifest.json`.
- Fields:
  - `html`: entry HTML file for window content (non-SPA), e.g. `window.html`.
  - `spa`: boolean, set `true` if using SPA router (optional).
  - `route`: string, initial route for SPA (optional).
- Example:
  ```json
  {
    "id": "sample-overlay-window",
    "name": "Sample Overlay Window",
    "version": "1.0.0",
    "author": "Toolkit",
    "description": "A sample plugin manifest demonstrating window hosting",
    "window": {
      "html": "window.html",
      "spa": false,
      "route": "/"
    }
  }
  ```
- Open/focus window from renderer: `window.electronApi.plugin.window.open('<plugin-id>')`.
- Router page: `/plugins/:plugname/window` uses `WindowFramePluginPage.vue` with draggable top bar (minimize/close).

## Renderer Popup Bridge
- Plugins call popup via Wujie bus bridge with `command: 'renderer-popup'`.
- Actions: `toast`, `alert`, `confirm`.
- Payload:
  - `title`: string (for `alert`/`confirm`).
  - `message`: string.
  - `options.durationMs`: number (toast duration, default 2500ms).
- Example (inside `window.html`):
  ```js
  function bridgeRequest(command, payload) {
    const bus = window.$wujie && window.$wujie.bus;
    const requestId = String(Date.now()) + '-' + Math.random().toString(16).slice(2);
    bus && bus.$emit && bus.$emit('bridge-request', { requestId, command, payload });
  }
  bridgeRequest('renderer-popup', { action: 'toast', payload: { message: 'Hello!', options: { durationMs: 2500 } } });
  ```

## Scope & Throttling
- Popups are scoped to the calling window/plugin via `contextId` (internally set to plugin id).
- Throttling: max 3 `toast` per second per context; `alert`/`confirm` allow single concurrent instance per context.
- Implementation: `packages/renderer/src/services/globalPopup.ts` using `tdesign-vue-next` `MessagePlugin` and `DialogPlugin`.

## Files Touched
- `packages/renderer/src/pages/PluginFramePage.vue`: handles `renderer-popup` bridge.
- `packages/renderer/src/pages/WindowFramePluginPage.vue`: handles `renderer-popup` bridge.
- `buildResources/plugins/sample-overlay-window/manifest.json`: sample manifest.
- `buildResources/plugins/sample-overlay-window/window.html`: sample window page with buttons to trigger popups.

## Notes
- Single-instance windows enforced by main process `PluginWindowManager`.
- Visual verification requires running the app; do not start renderer dev server unless instructed.
