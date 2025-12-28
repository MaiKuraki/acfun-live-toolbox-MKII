/**
 * Overlay API 模块
 */
function createOverlayApi(pluginId, request, sseManager) {
  return {
    send: async (overlayId, payload, clientId, senderType) => {
      const url = `/api/plugins/${encodeURIComponent(pluginId)}/overlay/messages`;
      const body = { payload };
      if (overlayId) body.overlayId = overlayId;
      const headers = {};
      if (clientId) headers['X-Client-ID'] = clientId;
      if (senderType) headers['X-Plugin-Type'] = senderType;

      

      return request(url, 'POST', body, { headers });
    },
  };
}

module.exports = { createOverlayApi };

