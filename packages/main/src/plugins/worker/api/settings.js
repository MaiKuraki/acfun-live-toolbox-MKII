/**
 * Settings API 模块
 */
function createSettingsApi(pluginId, request, subscribeSse) {
  return {
    get: () => request(`/api/plugins/${pluginId}/config`),
    set: (key, value) => request(`/api/plugins/${pluginId}/config`, 'POST', { [key]: value }),
    delete: (key) => request(`/api/plugins/${pluginId}/config/${encodeURIComponent(key)}`, 'DELETE'),
    onChange: (callback) => {
      return subscribeSse(
        ['config'],
        (type, data) => type === 'config' && data?.event === 'config-changed',
        (env) => {
          try {
            console.log(`[plugin-worker] settings.onChange: config=${JSON.stringify(env.payload)}`);
          } catch {}
          callback(env.payload);
        }
      );
    },
  };
}

module.exports = { createSettingsApi };

