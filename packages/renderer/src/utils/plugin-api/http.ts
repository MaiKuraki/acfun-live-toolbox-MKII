import type { RequestFn } from "./types";

export function createHttpApi(request: RequestFn) {
  return {
    post: (path: string, data?: any, options?: RequestInit) => {
      if (/^https?:\/\//.test(path)) {
        return request("/api/proxy/request", "POST", {
          method: "POST",
          url: path,
          headers: options?.headers,
          body: data,
        });
      }
      return request(path, "POST", data, options);
    },
    get: (path: string, options?: RequestInit) => {
      if (/^https?:\/\//.test(path)) {
        return request("/api/proxy/request", "POST", {
          method: "GET",
          url: path,
          headers: options?.headers,
        });
      }
      return request(path, "GET", undefined, options);
    },
  };
}



