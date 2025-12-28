import type { RequestFn } from "./types";

export function createRequest(pluginId: string, apiBase: string): RequestFn {
  const request: RequestFn = async (path, method = "GET", body, customOptions = {}) => {
    const url = new URL(path, apiBase).toString();
    const defaultHeaders = {
      "Content-Type": "application/json",
      "X-Plugin-ID": pluginId,
    };
    const headers = { ...defaultHeaders, ...(customOptions.headers || {}) };

    const options: RequestInit = {
      ...customOptions,
      method,
      headers,
    };

    if (body !== undefined && body !== null) {
      const contentType = (headers["Content-Type"] as string) || "";
      if (contentType.includes("application/json") && typeof body !== "string") {
        options.body = JSON.stringify(body);
      } else {
        options.body = body;
      }
    }

    const res = await fetch(url, options);
    const json = await res.json().catch(() => ({ success: res.ok }));
    if (!json.success && !res.ok) {
      const err: any = new Error(json.error || res.statusText);
      err.status = res.status;
      err.response = json;
      throw err;
    }
    return json.data || json;
  };

  return request;
}


