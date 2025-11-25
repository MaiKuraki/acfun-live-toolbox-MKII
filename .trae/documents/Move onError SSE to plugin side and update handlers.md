## Changes to implement
- In PluginManager, stop broadcasting 'plugin-error' SSE from main; call plugin's onError via vm2 only.
- In main error handler, remove overlay SSE 'runtime-error' publishing; keep system logs.
- In obs-assistant plugin, add onError(error, context) that uses emitOverlayEvent to broadcast error once SSE is ready or queue it.

## Files
- packages/main/src/plugins/PluginManager.ts
  - In setupLifecycleEvents('onError'): remove DataManager.publish to overlay; keep executeInPlugin('onError', ...).
- packages/main/src/plugins/PluginManager.ts
  - In setupErrorHandling(): remove dm.publish(channel, { event:'runtime-error'... }).
- buildResources/plugins/obs-assistant/index.js
  - Add async function onError(err, context) { await emitOverlayEvent('plugin-error', { message, context, ts }); }
  - Export onError in module.exports.

## Outcome
- SSE error events originate from plugin side with queue/ready behavior.
- Main continues to log to 'system:logs' and console for observability.