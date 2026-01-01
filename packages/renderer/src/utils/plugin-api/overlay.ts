import type { RequestFn } from "./types";

export function createOverlayApi(pluginId: string, request: RequestFn) {
  return {
    send: (overlayId: string | undefined, payload?: any, clientId?: string, senderType?: string) => {
      const url = `/api/plugins/${encodeURIComponent(pluginId)}/overlay/messages`;
      const body: any = { payload };
      if (overlayId) body.overlayId = overlayId;
      const headers: Record<string, string> = {};
      if (clientId) headers["X-Client-ID"] = clientId;
      if (senderType) headers["X-Plugin-Type"] = senderType;
      return request(url, "POST", body, { headers });
    },
  };
}






















