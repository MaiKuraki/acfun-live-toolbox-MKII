import type { ApiContext } from "./context";
import type express from "express";
import * as fs from "fs";
import * as path from "path";

export function registerStatic({ app }: ApiContext): void {
  app.get("/", (req: express.Request, res: express.Response) => {
    res.json({
      name: "ACFun Live Toolbox API Server",
      status: "running",
      version: "1.0.0",
    });
  });

  app.get("/test-overlay.html", (req: express.Request, res: express.Response) => {
    const testPagePath = path.join(process.cwd(), "test-overlay.html");
    if (fs.existsSync(testPagePath)) res.sendFile(testPagePath);
    else res.status(404).send("Test overlay page not found");
  });

  // Host renderer app under /app using middleware
  app.use("/app", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      // Resolve static root: prefer project packages/renderer/dist (dev), fallback to packaged path
      let staticRoot = path.join(process.cwd(), "packages/renderer/dist");
      if (!fs.existsSync(staticRoot)) {
        staticRoot = path.join(__dirname, "../../renderer/dist");
      }

      // Get the requested path relative to /app
      // req.path is the path after the mount point, so for /app/index.html, req.path is /index.html
      const requestedPath = req.path === "/" ? "index.html" : req.path.substring(1);
      const fullPath = path.join(staticRoot, requestedPath);

      // Security check: ensure the resolved path is within the static root
      const resolvedPath = path.resolve(fullPath);
      if (!resolvedPath.startsWith(path.resolve(staticRoot))) {
        return res.status(403).send("Forbidden");
      }

      // Only handle GET requests for static files
      if (req.method !== "GET") {
        return next();
      }

      // If the file exists, serve it
      if (fs.existsSync(resolvedPath)) {
        return res.sendFile(resolvedPath);
      }

      // SPA fallback: serve index.html for non-existent files
      const indexPath = path.join(staticRoot, "index.html");
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }

      res.status(404).send("App not found");
    } catch (err) {
      console.error("[ApiServer] App hosting error:", err);
      res.status(500).send("Internal server error");
    }
  });
}

