**Observation**

- Overlay UI shows repeated "readonly-store-update" with empty overlayId/keys, and background color does not update. This indicates the overlay page is only receiving renderer readonly-store SSE, not per-plugin overlay SSE updates that carry `overlay.style.backgroundColor`.
- The per-plugin SSE `/sse/plugins/:pluginId/overlay` denies connections when a plugin is disabled or in error. The sample overlay plugins declare `main: index.js` and can fail to load under ESM/CJS mismatch, leaving them in `error` and blocking the plugin channel.
- IPC `plugin.updateConfig` still merges `uiBgColor` into existing overlays via `OverlayManager.updateOverlay`, but the overlay page only gets the update when subscribed to the overlay event stream.

**Plan**

1) Add robust fallback in the overlay wrapper template to subscribe to overlay-specific SSE `/sse/overlay/:overlayId` whenever the plugin channel is unavailable, errors, or returns 403.

- Introduce a `subscribeOverlayChannel(overlayId)` that listens for `init`, `update`, `message`, `closed`, `heartbeat` and forwards:
  - `update` → post `{ type: 'overlay-event', event: 'overlay-updated', payload: { overlay } }`
  - `message` → post `{ type: 'overlay-event', event: msg.event, payload: msg.payload }`
  - `closed` → post `{ type: 'overlay-event', event: 'overlay-closed' }`
- Invoke this subscription if `/sse/plugins/:pluginId/overlay` is denied or throws, and also when the plugin channel disconnects.

2) Keep current plugin-channel behavior (when plugin is enabled) to deliver richer lifecycle events (`config-updated`) and overlay aggregation; the fallback ensures overlays are always updated even when plugin processes fail.

3) No changes to IPC or OverlayManager logic; they already merge `uiBgColor` into overlays and publish `overlay-updated` events.

**Expected Results**

- Background color changes via plugin config begin reflecting immediately in both `overlay-ui` and `sample overlay-window`:
  - If plugin channel is active → receive `overlay-updated` from plugin SSE.
  - If plugin is in error or disabled → receive `update` from overlay SSE `/sse/overlay/:overlayId`.
- Logs in overlay page show `[overlay-updated]` entries with non-empty `overlayId` and keys.

**Verification**

- Change `uiBgColor` in plugin management.
- Observe:
  - Overlay wrapper connects to either plugin SSE or overlay SSE.
  - Child overlay page receives `overlay-updated` with `style.backgroundColor` set.
  - Renderer readonly-store continues to heartbeat without interfering.

**Scope & Safety**

- Modify only `packages/main/src/server/templates/overlay-wrapper.html` script to add the fallback subscription.
- No tests, servers, or external systems changes; adheres to project rules (typecheck only).