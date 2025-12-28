import type { ApiContext } from "./context";
import type express from "express";

export function registerHealth({ app, wsHub }: ApiContext): void {
  app.get("/api/health", (req: express.Request, res: express.Response) => {
    res.json({
      status: "ok",
      timestamp: Date.now(),
      websocket_clients: wsHub?.getClientCount() || 0,
    });
  });
}

