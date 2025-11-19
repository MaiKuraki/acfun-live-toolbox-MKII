# Tasks: Add Plugin Window & Global Popup

## Proposal Stage (this change)
- [x] Scaffold change directory with proposal and specs delta files
- [x] Write proposal (Why/What/Impact)
- [x] Draft initial tasks list
- [x] Author specs delta for plugin window capability
- [x] Author specs delta for global popup capability
- [x] Fix desktop-ui spec: popup callable from `buildResources/plugins/sample-overlay-ui/index.js`

## Implementation Checklist (do not start until proposal approval)
- [x] Implement renderer Global Popup service (confirm/alert/toast) and bridge exposure to plugin UIs
- [x] Create `WindowFramePluginPage.vue` with minimal draggable topbar + minimize/close controls, and embed `PluginFrameManager`
- [x] Wire `/plugins/:plugname/window` route to load `WindowFramePluginPage.vue`
- [x] Implement main-process window manager: read manifest window config, create/focus window, enforce single-instance per plugin type
- [x] Update plugin management page "查看" and sidebar click to open/focus plugin window
- [x] Scaffold `buildResources/plugins/sample-overlay-window` with manifest window section, basic overlay content
- [x] Update developer docs: manifest window fields, popup API usage, sample overlay window notes
- [x] Typecheck (pnpm) and static inspection for main/renderer packages
- [x] Remove legacy manifest `.wujie.url` compatibility from plugin hosting
- [ ] Visual verification via preview (ui and window contents)
- [x] Route external frame `renderer-popup` via preload IPC → main window
- [x] Harden sample overlay window bus discovery & bridge request envelope
- [x] Fix popup IPC handlers scope to use WindowManager inside initializer
 - [x] Add WindowFramePluginPage readonly-store SSE + plugin-init + config bridge
 - [x] Add plugin.process.execute/message IPC and main ticker management
 - [x] Create sample-overlay-window index.js and update manifest main
- [x] Enhance window.html with store snapshot, theme, index.js demo and ticker toggle
 - [x] Prefer bundled resources in dev when manifest.test=true; add test to samples
