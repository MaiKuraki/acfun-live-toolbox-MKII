import type { ApiContext } from "./context";
import type express from "express";
import * as fs from "fs";
import * as path from "path";

export function registerStatic({ app, wsHub }: ApiContext): void {
  app.get("/", (req: express.Request, res: express.Response) => {
    res.json({
      name: "ACFun Live Toolbox API Server",
      status: "running",
      version: "1.0.0",
      websocket_clients: wsHub?.getClientCount() || 0,
      websocket_endpoint: `ws://127.0.0.1:${(req as any).socket?.localPort || 1299}`,
    });
  });

  app.get("/test-overlay.html", (req: express.Request, res: express.Response) => {
    const testPagePath = path.join(process.cwd(), "test-overlay.html");
    if (fs.existsSync(testPagePath)) res.sendFile(testPagePath);
    else res.status(404).send("Test overlay page not found");
  });
}

