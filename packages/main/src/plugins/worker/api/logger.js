/**
 * Logger API 模块
 */
function createLoggerApi(pluginId, request) {
  return {
    info: (message) => {
      console.log(`[Plugin:${pluginId}]`, message);
      request('/api/logger', 'POST', { level: 'info', message }).catch(() => {});
    },
    warn: (message) => {
      console.warn(`[Plugin:${pluginId}]`, message);
      request('/api/logger', 'POST', { level: 'warn', message }).catch(() => {});
    },
    error: (message) => {
      console.error(`[Plugin:${pluginId}]`, message);
      request('/api/logger', 'POST', { level: 'error', message }).catch(() => {});
    },
  };
}

module.exports = { createLoggerApi };

