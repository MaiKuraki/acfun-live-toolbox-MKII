## Root Cause
- When reconnecting to `/sse/plugins/:pluginId/overlay` without `Last-Event-ID`, the server replays the entire recent queue. During plugin disabled period, `ui`/`lifecycle` messages continued to be published and persisted with TTL, so upon re‑enable you receive a burst of past events.

## Fix Plan
- Server: adjust replay behavior to avoid burst when `Last-Event-ID` is missing.
- Plugin: include `Last-Event-ID` for reconnections to avoid replay.

## Server Changes (ApiServer)
- File: `packages/main/src/server/ApiServer.ts`
- Route: `GET /sse/plugins/:pluginId/overlay`
- Logic update:
  - After `getRecent(channel, lastEventId)`, if `lastEventId` is undefined, only replay the latest messages instead of the full queue:
    - Option A: only the last record overall.
    - Option B: the latest per `meta.kind` (e.g., one `ui`, one `lifecycle`).
  - Keep subscription as is to receive only new events.
- Optional: for route‑changed publish (renderer readonly-store forwarding), set `persist: false` and reduce `ttlMs` to a small value (e.g., 10s) to further reduce backlog risk. File region: `packages/main/src/server/ApiServer.ts` near readonly-store → plugin overlay forwarding.

## Plugin Changes (obs-assistant)
- File: `buildResources/plugins/obs-assistant/index.js`
- `openPluginOverlaySse()`:
  - Add request header `Last-Event-ID: state.overlayLastId` so reconnects do not replay already processed records.
  - Keep single-connection guard to prevent duplicate subscriptions.
- `onPluginOverlayEvent()`:
  - Continue tracking `state.overlayLastId = rec.id` to support reconnection.

## Verification
- Enable plugin, navigate routes; disable and re‑enable plugin.
- On re‑enable, server sends only the latest messages; client avoids replay bursts on reconnect.
- Subsequent events arrive once; logs show single send per record id.

## Scope & Safety
- Changes are localized to overlay SSE route and the plugin’s SSE request.
- No breaking changes to other SSE endpoints; replay contraction only applies when `Last-Event-ID` is absent (fresh client).