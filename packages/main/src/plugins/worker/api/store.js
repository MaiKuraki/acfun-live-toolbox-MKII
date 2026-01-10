/**
 * Store API 模块
 */
function createStoreApi(pluginId, request, sseManager) {
  return {
    get: (keys) => request('/api/renderer/readonly-store/snapshot', 'POST', { keys }),
    onChange: async (keys, callback) => {
      const targetKeys = Array.isArray(keys) && keys.length > 0 ? keys : ['*'];

      sseManager.callbacksRegistry.store = (payload) => {
        if (!payload || typeof payload !== 'object') return;
        const allowAll = targetKeys.includes('*');
        const filtered = {};
        Object.keys(payload || {}).forEach((k) => {
          if (!allowAll && !targetKeys.includes(k)) return;
          filtered[k] = payload[k];
        });
        if (Object.keys(filtered).length === 0) return;
        try {
          console.log(`[plugin-worker] store.onChange: keys=${JSON.stringify(targetKeys)}, filtered=${JSON.stringify(filtered)}`);
        } catch (e) {
          // ignore log errors
        }
        callback(filtered);
      };

      try {
        const clientId = await sseManager.ensureConnection();
        const resp = await request(`/api/plugins/${encodeURIComponent(pluginId)}/subscribe/store`, 'POST', {
          clientId,
          keys: targetKeys,
          includeSnapshot: true,
        });

        const data = (resp && resp.data) || resp;
        if ((resp && resp.success) === false) {
          console.warn('[plugin-worker] store.onChange subscribe failed:', resp.error);
          return { success: false, error: resp.error ?? 'subscribe store failed' };
        }

        if (Array.isArray(data?.keys)) {
          sseManager._serverState.store.keys = data.keys;
        } else {
          sseManager._serverState.store.keys = targetKeys;
        }
        if (data?.storeSnapshot && typeof data.storeSnapshot === 'object') {
          sseManager._serverState.store.snapshot = data.storeSnapshot;
          const allowAll = targetKeys.includes('*');
          const filtered = {};
          Object.keys(data.storeSnapshot || {}).forEach((k) => {
            if (!allowAll && !targetKeys.includes(k)) return;
            filtered[k] = data.storeSnapshot[k];
          });
          if (Object.keys(filtered).length > 0) {
            callback(filtered);
          }
        }

        return { success: true };
      } catch (e) {
        console.warn('[plugin-worker] store.onChange subscribe error:', e);
        return { success: false, error: String(e?.message || e) };
      }
    },
    offChange: async () => {
      sseManager.callbacksRegistry.store = null;
      sseManager._serverState.store.keys = [];
      sseManager._serverState.store.snapshot = null;

      try {
        const clientId = await sseManager.ensureConnection();
        const resp = await request(`/api/plugins/${encodeURIComponent(pluginId)}/unsubscribe/store`, 'POST', { clientId });
        if ((resp && resp.success) === false) {
          console.warn('[plugin-worker] store.offChange unsubscribe failed:', resp.error);
          return { success: false, error: resp.error ?? 'unsubscribe store failed' };
        }
        return { success: true };
      } catch (e) {
        console.warn('[plugin-worker] store.offChange unsubscribe error:', e);
        return { success: false, error: String(e?.message || e) };
      }
    },
  };
}

module.exports = { createStoreApi };

