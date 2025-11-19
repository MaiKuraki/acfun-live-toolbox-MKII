**Hypothesis**

- The plugin shows “错误” because the worker loads `.js` under a root `type: "module"` and encounters CommonJS syntax (`module.exports`). Other sample plugins are likely not starting a process (static-hosted), so they avoid the loader path; OBS Assistant requires a process, so the loader error surfaces.

**Plan (No renames; align with existing plugins)**

1) Restore `obs-assistant` to `main: "index.js"` and keep CommonJS style like the sample plugins.

2) Harden plugin-worker loader to support CommonJS `.js` in an ESM project transparently:

- Keep `await import(url)` first.
- When `import()` fails with messages like “module is not defined in ES module scope” or “ERR_REQUIRE_ESM”, instead of calling plain `require(pluginPath)`, use a robust fallback:
  - Read the plugin file contents and evaluate it in a `vm` sandbox that provides `module`, `exports`, `require` (via `module.createRequire(pluginPath)`), `__dirname` and `__filename`. Return `module.exports`. This keeps behavior consistent with sample plugins while avoiding renames.

3) Leave `obs-assistant` loader for `obs-websocket-js.js` minimal (use normal `require` first, fallback to `globalThis.OBSWebSocket` only if needed). Remove the heavy VM there; the robust worker-side loader will handle CommonJS evaluation already.

4) Ensure plugin visibility:

- `manifest.test: true`, `manifest.config`, and `manifest.ui` metadata are already present. After restarting the app, the plugin manager should copy from `buildResources/plugins` into the user-data `plugins` directory and load the manifest; the config form will render from `manifest.config`.

5) Verification

- Start app → obs-assistant appears with its config and description; enabling no longer errors.
- Enter create-live page → if `syncStreaming` is true, stream server/key apply to OBS via WebSocket.
- Typecheck main package to confirm no regressions.

**Rationale**

- This keeps the same pattern as the existing sample plugins (`index.js` with CommonJS), while making the worker resilient to the ESM project context. No file renames; the loader becomes format-agnostic and avoids future friction.

