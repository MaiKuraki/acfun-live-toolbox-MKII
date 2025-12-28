import type { RequestFn } from "./types";

export function createFsApi(pluginId: string, request: RequestFn) {
  const pluginStorage = {
    write: (row: any) => request(`/api/plugins/${pluginId}/storage`, "POST", row),
    read: (queryText?: string, size?: number) => {
      const params = new URLSearchParams();
      if (queryText) params.append("q", queryText);
      if (size !== undefined) params.append("size", String(size));
      return request(`/api/plugins/${pluginId}/storage?${params.toString()}`);
    },
    size: () => request(`/api/plugins/${pluginId}/storage/size`),
    remove: (ids: number[]) => request(`/api/plugins/${pluginId}/storage/remove`, "POST", { ids }),
  };

  return {
    pluginStorage,
    readFile: (path: string) => request("/api/fs/read", "POST", { path }),
    writeFile: (path: string, content: string) => request("/api/fs/write", "POST", { path, content }),
  };
}
















