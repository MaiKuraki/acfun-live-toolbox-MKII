const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * HTTP 请求辅助函数
 */
function createRequest(pluginId, apiBaseUrl) {
  return async (path, method = 'GET', body, customOptions = {}) => {
    return new Promise((resolve, reject) => {
      try {
        if (!apiBaseUrl) {
          reject(new Error('API_BASE_URL_NOT_CONFIGURED'));
          return;
        }
        const url = new URL(path, apiBaseUrl);
        const defaultHeaders = {
          'Content-Type': 'application/json',
          'X-Plugin-ID': pluginId,
        };
        const headers = { ...defaultHeaders, ...(customOptions.headers || {}) };

        // Ensure merged headers are used (don't let customOptions.headers override merged headers)
        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          method,
          ...customOptions,
          headers,
        };

        const httpModule = url.protocol === 'https:' ? https : http;
        const req = httpModule.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              if (!json.success && res.statusCode !== 200) {
                try { console.warn(`[plugin-worker] request failed: ${method} ${url.href} status=${res.statusCode} error=${String(json.error || res.statusMessage)} body=${data}`); } catch (_) {}
                reject(new Error(json.error || res.statusMessage));
              } else {
                resolve(json.data || json);
              }
            } catch (e) {
              // Non-JSON response (possibly 404 HTML). Log for debugging.
              try { console.warn(`[plugin-worker] request ended with non-JSON response: ${method} ${url.href} status=${res.statusCode} body=${data}`); } catch (_) {}
              resolve({ success: res.statusCode === 200 });
            }
          });
        });

        req.on('error', reject);

        if (body !== undefined && body !== null) {
          const contentType = headers['Content-Type'] || '';
          if (contentType.includes('application/json') && typeof body !== 'string') {
            req.write(JSON.stringify(body));
          } else {
            req.write(body);
          }
        }

        req.end();
      } catch (err) {
        reject(err);
      }
    });
  };
}

module.exports = { createRequest };

