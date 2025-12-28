import type { ApiContext } from "./context";
import type express from "express";

export function registerConsole({ app, consoleManager }: ApiContext): void {
  app.get("/api/console/data", (req: express.Request, res: express.Response) => {
    try {
      const commands = consoleManager.getCommands();
      const sessions = consoleManager.getActiveSessions();
      res.json({ success: true, data: { commands, sessions } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  app.post(
    "/api/console/sessions",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try { const { name } = req.body; const session = await consoleManager.createSession(name); res.json({ success: true, session }); }
      catch (error) { next(error); }
    }
  );

  app.delete(
    "/api/console/sessions/:sessionId",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try { const { sessionId } = req.params; const success = await consoleManager.endSession(sessionId); res.json({ success }); }
      catch (error) { next(error); }
    }
  );

  app.post(
    "/api/console/sessions/:sessionId/execute",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try { const { sessionId } = req.params; const { command } = req.body; const result = await consoleManager.executeCommand(sessionId, command); res.json({ success: true, result }); }
      catch (error) { next(error); }
    }
  );

  app.get("/api/console/commands", (req: express.Request, res: express.Response) => {
    try { const commands = consoleManager.getCommands(); res.json({ success: true, commands }); }
    catch (error) { res.status(500).json({ success: false, error: (error as Error).message }); }
  });

  app.get("/api/console/sessions", (req: express.Request, res: express.Response) => {
    try { const sessions = consoleManager.getActiveSessions(); res.json({ success: true, sessions }); }
    catch (error) { res.status(500).json({ success: false, error: (error as Error).message }); }
  });

  app.get("/api/console/sessions/:sessionId", (req: express.Request, res: express.Response) => {
    try { const { sessionId } = req.params; const session = consoleManager.getSession(sessionId); if (session) res.json({ success: true, session }); else res.status(404).json({ success: false, error: "Session not found" }); }
    catch (error) { res.status(500).json({ success: false, error: (error as Error).message }); }
  });
}

