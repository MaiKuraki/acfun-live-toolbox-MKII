/**
 * Store API 模块
 */
function createStoreApi(pluginId, request, subscribeSse) {
  return {
    get: (keys) => request('/api/renderer/readonly-store/snapshot', 'POST', { keys }),
    onChange: (keys, callback) => {
      const targetKeys = Array.isArray(keys) && keys.length > 0 ? keys : ['*'];
      const sub = subscribeSse(
        ['store'],
        (kind) => kind === 'store',
        (env) => {
          if (env.kind !== 'store') return;
          const allowAll = targetKeys.includes('*');
          const payload = env.payload || {};
          const filtered = {};
          Object.keys(payload || {}).forEach((k) => {
            if (!allowAll && !targetKeys.includes(k)) return;
            filtered[k] = payload[k];
          });
          if (Object.keys(filtered).length === 0) return;
          try {
            console.log(`[plugin-worker] store.onChange: keys=${JSON.stringify(targetKeys)}, filtered=${JSON.stringify(filtered)}`);
          } catch {}
          callback(filtered);
        },
        { storeKeys: targetKeys, requestStoreSnapshot: true }
      );
      return { close: () => sub.close() };
    },
  };
}

module.exports = { createStoreApi };

