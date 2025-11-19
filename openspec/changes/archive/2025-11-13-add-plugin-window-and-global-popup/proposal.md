# Proposal: Add Plugin Window & Global Popup

## Why
- Provide a first-class OS window experience for plugin overlays that need independent focus and sizing, controlled by manifest.
- Offer a renderer-level global popup API for plugins to show confirmations, alerts, and toasts consistently without re-implementing UI.

## What Changes
- Add a "plugin window" capability: clicking a plugin card "查看" or the sidebar entry opens a dedicated OS window for that plugin type. Only one window per plugin type; subsequent triggers focus and bring it to front. Window size/resizable are defined in the plugin manifest.
- Define `/plugins/:plugname/window` route to load `WindowFramePluginPage.vue` (minimal draggable topbar with minimize/close + `PluginFrameManager` content area).
- Add a renderer-level Global Popup service and expose it to plugin UIs via the bridge (bus command or injected API) to show popup dialogs/toasts.
- Provide a sample plugin `sample-overlay-window` modeled on `sample-overlay-ui` that demonstrates window manifest, open/focus behavior, and window content.

## Scope & Impact
- Renderer: new `WindowFramePluginPage.vue`, route wiring, `PluginFrameManager` integration, global popup service exposure to plugin UIs.
- Main: window creation/focus management (single-instance per plugin type), reading manifest window config.
- Preload/Bridge: API surface for plugin pages to request popups and window opens (where applicable via management UI).
- Plugins: sample plugin with `manifest.json` window section and basic overlay display.

## Non-Goals
- Full cross-plugin window composition; only single window per plugin type.
- Blocking modal OS dialogs; popups are renderer-layer.

## Risks & Mitigations
- Window lifecycle: ensure proper cleanup on close; keep single-instance registry keyed by plugin type.
- Popup API misuse: scope to current plugin renderer context and throttle to prevent spam.

## Validation
- Typecheck and static inspections only. Visual verification via preview is required after implementation.

