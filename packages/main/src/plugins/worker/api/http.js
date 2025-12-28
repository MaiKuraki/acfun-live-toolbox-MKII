/**
 * HTTP API 模块
 */
function createHttpApi(request) {
  return {
    post: (path, data, options) => {
      if (/^https?:\/\//.test(path)) {
        return request('/api/proxy/request', 'POST', {
          method: 'POST',
          url: path,
          headers: options?.headers,
          body: data,
        });
      }
      return request(path, 'POST', data, options);
    },
    get: (path, options) => {
      if (/^https?:\/\//.test(path)) {
        return request('/api/proxy/request', 'POST', {
          method: 'GET',
          url: path,
          headers: options?.headers,
        });
      }
      return request(path, 'GET', undefined, options);
    },
  };
}

module.exports = { createHttpApi };

