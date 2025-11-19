**Root Cause**

- The plugin file was `index.js` written in CommonJS (`require/module.exports`). With root `package.json` set to `"type": "module"`, a `.js` file is treated as ESM. Loading via dynamic `import()` triggers "require/module is not defined" in ESM scope; fallback `require()` also fails under ESM. This yields error status on enable.

- The plugin manager shows config based on `manifest.config`; if the plugin copy into the user-data `plugins` directory didn’t occur or the manifest’s `main` fails to load, UI can display error and not render config.

**Plan**

1) Rename the plugin entry to CommonJS explicitly:

- Rename `buildResources/plugins/obs-assistant/index.js` → `index.cjs` and update `manifest.main` to `index.cjs`. This eliminates ESM/CJS ambiguity and lets the worker load via `import()` (returns default) or `require()` reliably.

2) Harden obs-websocket loader fallback:

- Ensure VM fallback defines `globalThis` to the sandbox so a global build can attach `OBSWebSocket` properly.

3) Keep manifest metadata as-is:

- `test: true` is present; `ui.name`/`ui.description` already added; `config` schema present. After restart, the plugin will display with its config.

**Verification**

- Typecheck the main package.

- After restart, the plugin should appear with config and description; enabling no longer errors; on create-live page, sync applies when configured.

