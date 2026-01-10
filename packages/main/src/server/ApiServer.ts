import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { getLogManager } from "../logging/LogManager";
import { createServer, Server } from "http";
import { QueryService } from "../persistence/QueryService";
import { CsvExporter } from "../persistence/CsvExporter";
import { DatabaseManager } from "../persistence/DatabaseManager";
import { DiagnosticsService } from "../logging/DiagnosticsService";
import { OverlayManager } from "../plugins/OverlayManager";
import { IPluginManager, IConsoleManager } from "../types/contracts";
import { WindowManager } from "../bootstrap/WindowManager";
import { PluginWindowManager } from "../plugins/PluginWindowManager";
import { AcfunApiProxy } from "./AcfunApiProxy";
import { TokenManager } from "./TokenManager";
import { DataManager, IDataManager } from "../persistence/DataManager";
import { registerAll } from "./routes";

/**
 * API 服务器配置
 */
export interface ApiServerConfig {
  port: number;
  host?: string;
  enableCors?: boolean;
  enableHelmet?: boolean;
  enableCompression?: boolean;
  enableLogging?: boolean;
}

/**
 * Manages the local HTTP server.
 */
export class ApiServer {
  private app: express.Application;
  private server: Server | null = null;
  private lastStartError: string | undefined;
  private config: ApiServerConfig;
  private queryService: QueryService;
  private csvExporter: CsvExporter;
  private diagnosticsService: DiagnosticsService;
  private overlayManager: OverlayManager;
  private consoleManager: IConsoleManager;
  private acfunApiProxy: AcfunApiProxy;
  private pluginRoutes: Map<
    string,
    { method: "GET" | "POST"; path: string; handler: express.RequestHandler }[]
  > = new Map();
  private pluginManager?: IPluginManager;
  private dataManager: IDataManager;
  private windowManager?: WindowManager;
  private pluginWindowManager?: PluginWindowManager;
  private connections: Set<import("net").Socket> = new Set();
  private routesInitialized: boolean = false;

  constructor(
    config: ApiServerConfig = { port: 1299 },
    databaseManager: DatabaseManager,
    diagnosticsService: DiagnosticsService,
    overlayManager: OverlayManager,
    consoleManager: IConsoleManager
  ) {
    this.config = {
      host: "127.0.0.1",
      enableCors: true,
      enableHelmet: true,
      enableCompression: true,
      enableLogging: process.env.NODE_ENV === "development",
      ...config,
    };

    this.app = express();
    this.queryService = new QueryService(databaseManager);
    this.csvExporter = new CsvExporter(this.queryService);
    this.diagnosticsService = diagnosticsService;
    this.overlayManager = overlayManager;
    this.consoleManager = consoleManager;
    this.acfunApiProxy = new AcfunApiProxy(
      {},
      TokenManager.getInstance(),
      databaseManager
    );
    this.dataManager = DataManager.getInstance();

    this.configureMiddleware();
    this.configureErrorHandling();
  }

  /**
   * 注入 PluginManager 引用，用于统一静态托管插件页面。
   */
  public setPluginManager(pm: IPluginManager): void {
    this.pluginManager = pm;
    try {
      this.acfunApiProxy.setPluginManager(pm);
    } catch {}
  }

  public setWindowManagers(
    windowManager: WindowManager,
    pluginWindowManager: PluginWindowManager
  ): void {
    this.windowManager = windowManager;
    this.pluginWindowManager = pluginWindowManager;
  }

  public setPort(port: number): void {
    this.config.port = port;
  }

  /**
   * 配置中间件
   */
  private configureMiddleware(): void {
    // 安全中间件
    if (this.config.enableHelmet) {
      this.app.use(
        helmet({
          contentSecurityPolicy: false,
          crossOriginEmbedderPolicy: false,
          frameguard: false,
          crossOriginResourcePolicy: { policy: "cross-origin" },
        })
      );
    }

    // CORS 中间件
    if (this.config.enableCors) {
      this.app.use(
        cors({
          origin: true, // 允许所有来源，适用于本地开发
          credentials: true,
        })
      );
    }

    // 压缩中间件（跳过 SSE，避免缓冲导致客户端看不到 onopen/heartbeat）
    if (this.config.enableCompression) {
      const shouldCompress = (req: express.Request, res: express.Response) => {
        try {
          const ct = res.getHeader("Content-Type");
          if (typeof ct === "string" && ct.indexOf("text/event-stream") >= 0)
            return false;
          if (
            Array.isArray(ct) &&
            ct.some((v: any) => String(v).indexOf("text/event-stream") >= 0)
          )
            return false;
          const accept = req.headers["accept"];
          if (
            typeof accept === "string" &&
            accept.indexOf("text/event-stream") >= 0
          )
            return false;
        } catch {}
        return compression.filter(req as any, res as any);
      };
      this.app.use(compression({ filter: shouldCompress }));
    }

    if (this.config.enableLogging) {
      const logManager = getLogManager();
      this.app.use(
        morgan("combined", {
          skip: (req: express.Request, res: express.Response) => {
            if (process.env.ACFRAME_DEBUG_LOGS === "1") return false;
            const url = req.originalUrl || req.url || "";
            if (
              url.startsWith("/api/renderer/readonly-store") ||
              url.indexOf("/renderer/readonly-store") >= 0
            )
              return true;
            const status = res.statusCode || 0;
            if (status < 400) return true;
            const ua = String(req.headers["user-agent"] || "");
            if (ua.includes("ACLiveFrame")) return true;
            return false;
          },
          stream: {
            write: (msg: string) => {
              try {
                logManager.addLog("http", String(msg || "").trim(), "info");
              } catch {}
            },
          },
        })
      );
    }

    // 解析中间件
    this.app.use(express.json({ limit: "20mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "20mb" }));

    

    // 禁用全局 ETag，避免插件静态资源返回 304 导致示例脚本未更新
    this.app.disable("etag");
  }

  /**
   * 配置路由
   */
  private configureRoutes(): void {
    const context = {
      app: this.app,
      config: this.config,
      queryService: this.queryService,
      csvExporter: this.csvExporter,
      diagnosticsService: this.diagnosticsService,
      overlayManager: this.overlayManager,
      consoleManager: this.consoleManager,
      acfunApiProxy: this.acfunApiProxy,
      pluginManager: this.pluginManager,
      dataManager: this.dataManager,
      windowManager: this.windowManager,
      pluginWindowManager: this.pluginWindowManager,
      pluginRoutes: this.pluginRoutes,
      getWindowManager: () => this.windowManager,
      getPluginWindowManager: () => this.pluginWindowManager,
      getPluginManager: () => this.pluginManager,
    };
    registerAll(context);
    this.app.use((req: express.Request, res: express.Response) => {
      res.status(404).json({ error: "Not Found", path: req.originalUrl });
    });
    return;
  }

  public setRoomManager(
    roomManager: import("../rooms/RoomManager").RoomManager
  ): void {
    try {
      this.acfunApiProxy.setRoomManager(roomManager);
    } catch {}
  }

  /**
   * 配置错误处理
   */
  private configureErrorHandling(): void {
    this.app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error("[ApiServer] Error:", err);

        res.status(err.status || 500).json({
          success: false,
          error: err.message || "Internal Server Error",
          ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        });
      }
    );
  }

  /**
   * 获取 Express 应用实例
   */
  public getApp(): express.Application {
    return this.app;
  }
  public getLastError(): string | undefined {
    return this.lastStartError;
  }

  /**
   * 由 PluginManager/ApiBridge 调用，为插件注册 HTTP 路由。
   * 路由仅在 `/plugins/:id/*` 作用域下可达。
   */
  public registerPluginRoute(
    pluginId: string,
    def: { method: "GET" | "POST"; path: string },
    handler: express.RequestHandler
  ): void {
    if (!/^[a-zA-Z0-9_]+$/.test(pluginId)) {
      throw new Error("INVALID_PLUGIN_ID");
    }
    if (!/^[\/a-zA-Z0-9_\-]*$/.test(def.path)) {
      throw new Error("INVALID_ROUTE_PATH");
    }
    const list = this.pluginRoutes.get(pluginId) || [];
    list.push({ method: def.method, path: def.path || "/", handler });
    this.pluginRoutes.set(pluginId, list);
    console.log(
      `[ApiServer] Registered plugin route: [${def.method}] /plugins/${pluginId}${def.path}`
    );
  }

  /**
   * 启动服务器
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.routesInitialized) {
          this.configureRoutes();
          this.routesInitialized = true;
        }
        this.server = createServer(this.app);
        console.log(
          `[ApiServer] HTTP server created, starting listen on ${this.config.host}:${this.config.port}`
        );

        try {
          this.server.on("connection", (socket) => {
            try {
              this.connections.add(socket);
              socket.on("close", () => {
                try {
                  this.connections.delete(socket);
                } catch {}
              });
            } catch {}
          });
        } catch {}

        this.server.listen(this.config.port, this.config.host, () => {
          console.log(
            `[ApiServer] HTTP server running at http://${this.config.host}:${this.config.port}`
          );
          this.lastStartError = undefined;
          resolve();
        });

        this.server.on("error", (error) => {
          console.error("[ApiServer] Server error:", error);
          try {
            this.lastStartError = String((error as any)?.message || error);
          } catch {}
          reject(error);
        });
      } catch (error) {
        console.error("[ApiServer] Start failed:", error);
        try {
          this.lastStartError = String((error as any)?.message || error);
        } catch {}
        reject(error);
      }
    });
  }

  /**
   * 停止服务器
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      console.log("[ApiServer] Shutting down server...");

      if (this.server) {
        try {
          for (const s of Array.from(this.connections)) {
            try {
              s.destroy();
            } catch {}
          }
          this.connections.clear();
        } catch {}

        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          try {
            console.warn("[ApiServer] Server close timed out; proceeding");
          } catch {}
          try {
            this.server = null;
          } catch {}
          resolve();
        }, 3000);

        this.server.close(() => {
          if (settled) return;
          settled = true;
          try {
            clearTimeout(timer);
          } catch {}
          console.log("[ApiServer] Server closed");
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 获取服务器状态
   */
  public isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }
}
