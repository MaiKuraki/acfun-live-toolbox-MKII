import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { getLogManager } from '../logging/LogManager';
import { createServer, Server } from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { app, shell, dialog, globalShortcut, BrowserWindow } from 'electron';
import { WsHub } from './WsHub';
import { QueryService, EventQuery } from '../persistence/QueryService';
import { CsvExporter, ExportOptions } from '../persistence/CsvExporter';
import { DatabaseManager } from '../persistence/DatabaseManager';
import { DiagnosticsService } from '../logging/DiagnosticsService';
import { OverlayManager } from '../plugins/OverlayManager';
import { IPluginManager, IConsoleManager } from '../types/contracts';
import { WindowManager } from '../bootstrap/WindowManager';
import { PluginWindowManager } from '../plugins/PluginWindowManager';
import { ConfigManager } from '../config/ConfigManager';
import { AcfunApiProxy } from './AcfunApiProxy';
import { TokenManager } from './TokenManager';
import { NormalizedEventType } from '../types';
import { DataManager, IDataManager } from '../persistence/DataManager';
import PluginPageStatusManager from '../persistence/PluginPageStatusManager';
import { SSE_HEARTBEAT_MS } from '../config/config';
import { pluginLogger } from '../plugins/PluginLogger';

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
 * Manages the local HTTP and WebSocket server.
 */
export class ApiServer {
  private app: express.Application;
  private server: Server | null = null;
  private lastStartError: string | undefined;
  private wsHub: WsHub;
  private config: ApiServerConfig;
  private queryService: QueryService;
  private csvExporter: CsvExporter;
  private diagnosticsService: DiagnosticsService;
  private overlayManager: OverlayManager;
  private consoleManager: IConsoleManager;
  private acfunApiProxy: AcfunApiProxy;
  private databaseManager: DatabaseManager;
  private pluginRoutes: Map<string, { method: 'GET' | 'POST'; path: string; handler: express.RequestHandler }[]> = new Map();
  private pluginManager?: IPluginManager;
  private dataManager: IDataManager;
  private templatesCache: Record<string, string> = {};
  private windowManager?: WindowManager;
  private pluginWindowManager?: PluginWindowManager;
  private connections: Set<import('net').Socket> = new Set();
  private pluginShortcuts: Map<string, Set<string>> = new Map();

  constructor(config: ApiServerConfig = { port: 1299 }, databaseManager: DatabaseManager, diagnosticsService: DiagnosticsService, overlayManager: OverlayManager, consoleManager: IConsoleManager) {
    this.config = {
      host: '127.0.0.1',
      enableCors: true,
      enableHelmet: true,
      enableCompression: true,
      enableLogging: process.env.NODE_ENV === 'development',
      ...config
    };

    this.app = express();
    this.wsHub = new WsHub();
    this.queryService = new QueryService(databaseManager);
    this.csvExporter = new CsvExporter(this.queryService);
    this.diagnosticsService = diagnosticsService;
    this.overlayManager = overlayManager;
    this.consoleManager = consoleManager;
    this.databaseManager = databaseManager;
    this.acfunApiProxy = new AcfunApiProxy({}, TokenManager.getInstance(), databaseManager);
    this.dataManager = DataManager.getInstance();

    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  /**
   * 注入 PluginManager 引用，用于统一静态托管插件页面。
   */
  public setPluginManager(pm: IPluginManager): void {
    this.pluginManager = pm;
    try { this.acfunApiProxy.setPluginManager(pm); } catch {}
  }

  public setWindowManagers(windowManager: WindowManager, pluginWindowManager: PluginWindowManager): void {
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
      this.app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        frameguard: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' }
      }));
    }

    // CORS 中间件
    if (this.config.enableCors) {
      this.app.use(cors({
        origin: true, // 允许所有来源，适用于本地开发
        credentials: true
      }));
    }

    // 压缩中间件（跳过 SSE，避免缓冲导致客户端看不到 onopen/heartbeat）
    if (this.config.enableCompression) {
      const shouldCompress = (req: express.Request, res: express.Response) => {
        try {
          const ct = res.getHeader('Content-Type');
          if (typeof ct === 'string' && ct.indexOf('text/event-stream') >= 0) return false;
          if (Array.isArray(ct) && ct.some((v: any) => String(v).indexOf('text/event-stream') >= 0)) return false;
          const accept = req.headers['accept'];
          if (typeof accept === 'string' && accept.indexOf('text/event-stream') >= 0) return false;
        } catch {}
        return compression.filter(req as any, res as any);
      };
      this.app.use(compression({ filter: shouldCompress }));
    }

    if (this.config.enableLogging) {
      const logManager = getLogManager();
      this.app.use(morgan('combined', {
        skip: (req: express.Request, res: express.Response) => {
          if (process.env.ACFRAME_DEBUG_LOGS === '1') return false;
          const url = req.originalUrl || req.url || '';
          if (url.startsWith('/api/renderer/readonly-store') || url.indexOf('/renderer/readonly-store') >= 0) return true;
          const status = res.statusCode || 0;
          if (status < 400) return true;
          const ua = String(req.headers['user-agent'] || '');
          if (ua.includes('ACLiveFrame')) return true;
          return false;
        },
        stream: {
          write: (msg: string) => {
            try { logManager.addLog('http', String(msg || '').trim(), 'info'); } catch {}
          }
        }
      }));
    }

    // 解析中间件
    this.app.use(express.json({ limit: '20mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '20mb' }));

    // 禁用全局 ETag，避免插件静态资源返回 304 导致示例脚本未更新
    this.app.disable('etag');
  }

  /**
   * 配置路由
   */
  private configureRoutes(): void {
    // Root endpoint - API server info
    this.app.get('/', (req: express.Request, res: express.Response) => {
      res.json({
        name: 'ACFun Live Toolbox API Server',
        status: 'running',
        version: '1.0.0',
        websocket_clients: this.wsHub?.getClientCount() || 0,
        websocket_endpoint: `ws://127.0.0.1:${this.config.port}`,
        endpoints: {
          api: [
            { method: 'GET', path: '/api/health', description: 'Server health check' },
            { method: 'GET', path: '/api/plugins', description: 'List installed plugins' },
            { method: 'GET', path: '/api/events', description: 'Query events with pagination' },
            { method: 'GET', path: '/api/events/dates', description: 'List available event dates' },
            { method: 'GET', path: '/api/users', description: 'List known users' },
            { method: 'GET', path: '/api/users/search', description: 'Search users by keyword' },
            { method: 'GET', path: '/api/stats/events', description: 'Event statistics' },
            { method: 'GET', path: '/api/diagnostics', description: 'System diagnostics' },
            { method: 'GET', path: '/api/logs', description: 'Application logs' },
            { method: 'POST', path: '/api/export', description: 'Export data to CSV' }
          ],
          acfun: [
            { method: 'ALL', path: '/api/acfun/*', description: 'AcFun Live API proxy endpoints' },
            // 认证相关
            { method: 'GET', path: '/api/acfun/auth/status', description: 'Check authentication status' },
            { method: 'POST', path: '/api/acfun/auth/qr-login', description: 'Start QR code login' },
            { method: 'GET', path: '/api/acfun/auth/qr-status', description: 'Check QR code login status' },
            { method: 'POST', path: '/api/acfun/auth/token', description: 'Set authentication token' },
            { method: 'DELETE', path: '/api/acfun/auth/token', description: 'Clear authentication token' },
            // 用户相关
            { method: 'GET', path: '/api/acfun/user/info', description: 'Get user information' },
            { method: 'GET', path: '/api/acfun/user/wallet', description: 'Get user wallet information' },
            // 弹幕相关
            { method: 'POST', path: '/api/acfun/danmu/start', description: 'Start danmu session' },
            { method: 'POST', path: '/api/acfun/danmu/stop', description: 'Stop danmu session' },
            { method: 'GET', path: '/api/acfun/danmu/connection-state', description: 'Get current user danmu connection state' },
            { method: 'GET', path: '/api/acfun/danmu/room-info', description: 'Get live room information' },
            { method: 'POST', path: '/api/acfun/danmu/send', description: 'Send danmu/comment' },
            // 直播相关
            { method: 'GET', path: '/api/acfun/live/permission', description: 'Check live permission' },
            { method: 'GET', path: '/api/acfun/live/stream-url', description: 'Get stream URL' },
            { method: 'GET', path: '/api/acfun/live/stream-settings', description: 'Get stream settings' },
            { method: 'GET', path: '/api/acfun/live/stream-status', description: 'Get stream status' },
            { method: 'POST', path: '/api/acfun/live/start', description: 'Start live stream' },
            { method: 'POST', path: '/api/acfun/live/stop', description: 'Stop live stream' },
            { method: 'PUT', path: '/api/acfun/live/update', description: 'Update live room settings' },
            { method: 'GET', path: '/api/acfun/live/statistics', description: 'Get live statistics' },
            { method: 'GET', path: '/api/acfun/live/summary', description: 'Get live summary' },
            { method: 'GET', path: '/api/acfun/live/hot-lives', description: 'Get hot live list' },
            { method: 'GET', path: '/api/acfun/live/categories', description: 'Get live categories' },
            { method: 'GET', path: '/api/acfun/live/user-info', description: 'Get user live info' },
            { method: 'GET', path: '/api/acfun/live/clip-permission', description: 'Get clip permission' },
            { method: 'PUT', path: '/api/acfun/live/clip-permission', description: 'Set clip permission' },
            // 礼物相关
            { method: 'GET', path: '/api/acfun/gift/all', description: 'Get all gift list' },
            { method: 'GET', path: '/api/acfun/gift/live', description: 'Get live gift list' },
            // 房管相关
            { method: 'GET', path: '/api/acfun/manager/list', description: 'Get manager list' },
            { method: 'POST', path: '/api/acfun/manager/add', description: 'Add manager' },
            { method: 'DELETE', path: '/api/acfun/manager/remove', description: 'Remove manager' },
            { method: 'GET', path: '/api/acfun/manager/kick-records', description: 'Get kick records' },
            { method: 'POST', path: '/api/acfun/manager/kick', description: 'Kick user' },
            // 权限管理相关
            { method: 'GET', path: '/api/acfun/permissions/plugins', description: 'Get all plugin permissions' },
            { method: 'POST', path: '/api/acfun/permissions/plugins', description: 'Set plugin permission' },
            { method: 'GET', path: '/api/acfun/permissions/plugins/:pluginId', description: 'Get specific plugin permission' },
            { method: 'DELETE', path: '/api/acfun/permissions/plugins/:pluginId', description: 'Remove plugin permission' },
            { method: 'GET', path: '/api/acfun/permissions/api-endpoints', description: 'Get API endpoint permissions' },
            { method: 'POST', path: '/api/acfun/permissions/check', description: 'Check permission for plugin and endpoint' },
            { method: 'POST', path: '/api/acfun/permissions/rate-limit/reset', description: 'Reset rate limit for plugin' }
          ],
          console: [
            { method: 'GET', path: '/api/console/data', description: 'Get console page data' },
            { method: 'POST', path: '/api/console/sessions', description: 'Create console session' },
            { method: 'GET', path: '/api/console/sessions', description: 'List console sessions' },
            { method: 'DELETE', path: '/api/console/sessions/:id', description: 'Delete console session' },
            { method: 'POST', path: '/api/console/sessions/:id/execute', description: 'Execute console command' },
            { method: 'GET', path: '/api/console/commands', description: 'Get available commands' }
          ],
          overlay: [
            { method: 'GET', path: '/api/overlay/:overlayId', description: 'Get overlay data by ID' }
          ],
          window: [
            { method: 'POST', path: '/api/popup', description: 'Show global popup on main or plugin window' },
            { method: 'POST', path: '/api/windows/show', description: 'Show and focus target window (main or plugin window)' },
            { method: 'POST', path: '/api/windows/focus', description: 'Focus target window (main or plugin window)' },
            { method: 'POST', path: '/api/windows/close', description: 'Close target window (main or plugin window)' },
            { method: 'GET', path: '/api/windows/list', description: 'List plugin windows state' },
            { method: 'GET', path: '/api/windows/self', description: 'Get caller window identity (pluginId or main)' }
          ]
        }
      });
    });

    const apidocDir = path.resolve(process.cwd(), 'docs', 'apidoc');
    try {
      if (fs.existsSync(apidocDir)) {
        this.app.use('/docs/api', (express as any).static(apidocDir, {
          cacheControl: true,
          maxAge: '7d',
          setHeaders: (res: any, filePath: string) => {
            try {
              if (filePath && filePath.endsWith('index.html')) {
                res.setHeader('Cache-Control', 'no-store');
              } else {
                res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
              }
            } catch {}
          }
        }));
      }
    } catch {}

    // Health check endpoint
    this.app.get('/api/health', (req: express.Request, res: express.Response) => {
      res.json({
        status: 'ok',
        timestamp: Date.now(),
        websocket_clients: this.wsHub?.getClientCount() || 0
      });
    });

    // GET /api/events - 查询分页事件
    this.app.get('/api/events', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        // 解析 type（支持集合）
        const rawType = req.query.type as string | string | undefined;
        let typesArr: NormalizedEventType[] | undefined;
        if (Array.isArray(rawType)) {
          typesArr = (rawType as string[]).map(s => String(s)).filter(Boolean) as NormalizedEventType[];
        } else if (typeof rawType === 'string' && rawType.trim().length > 0) {
          typesArr = rawType.split(',').map(s => s.trim()).filter(Boolean) as NormalizedEventType[];
        }

        const rawUserIds = (req.query.user_ids as string | undefined);
        const idsArr = rawUserIds ? rawUserIds.split(',').map(s => s.trim()).filter(Boolean) : undefined;
        const query: EventQuery = {
          room_id: req.query.room_id as string,
          live_id: req.query.live_id as string,
          room_kw: req.query.room_kw as string,
          from_ts: req.query.from_ts ? parseInt(req.query.from_ts as string) : undefined,
          to_ts: req.query.to_ts ? parseInt(req.query.to_ts as string) : undefined,
          from_date: req.query.from_date ? String(req.query.from_date) : undefined,
          to_date: req.query.to_date ? String(req.query.to_date) : undefined,
          types: typesArr,
          user_id: req.query.user_id as string,
          user_ids: idsArr,
          user_kw: req.query.user_kw as string,
          q: req.query.q as string,
          page: req.query.page ? parseInt(req.query.page as string) : 1,
          pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 200
        };

        // 验证参数
        if (query.pageSize && (query.pageSize < 1 || query.pageSize > 1000)) {
          return res.status(400).json({
            error: 'Invalid pageSize. Must be between 1 and 1000.'
          });
        }

        if (query.page && query.page < 1) {
          return res.status(400).json({
            error: 'Invalid page. Must be >= 1.'
          });
        }

        const result = await this.queryService.queryEvents(query);
        if (process.env.ACFRAME_DEBUG_LOGS === '1') {
          try {
            console.log('[API] /api/events params room_id=' + String(query.room_id || '') + ' live_id=' + String(query.live_id || '') + ' page=' + String(query.page) + ' pageSize=' + String(query.pageSize) + ' type=' + String((typesArr || []).join(',')) + ' total=' + String(result.total) + ' items=' + String(result.items.length));
          } catch {}
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    });

    // DELETE /api/events - 根据条件删除事件
    this.app.delete('/api/events', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const rawType = req.query.type as string | string | undefined;
        let typesArr: NormalizedEventType[] | undefined;
        if (Array.isArray(rawType)) {
          typesArr = (rawType as string[]).map(s => String(s)).filter(Boolean) as NormalizedEventType[];
        } else if (typeof rawType === 'string' && rawType.trim().length > 0) {
          typesArr = rawType.split(',').map(s => s.trim()).filter(Boolean) as NormalizedEventType[];
        }

        const rawUserIds = (req.query.user_ids as string | undefined);
        const idsArr = rawUserIds ? rawUserIds.split(',').map(s => s.trim()).filter(Boolean) : undefined;

        const query: EventQuery = {
          room_id: req.query.room_id as string,
          live_id: req.query.live_id as string,
          room_kw: req.query.room_kw as string,
          from_ts: req.query.from_ts ? parseInt(req.query.from_ts as string) : undefined,
          to_ts: req.query.to_ts ? parseInt(req.query.to_ts as string) : undefined,
          from_date: req.query.from_date ? String(req.query.from_date) : undefined,
          to_date: req.query.to_date ? String(req.query.to_date) : undefined,
          types: typesArr,
          user_id: req.query.user_id as string,
          user_ids: idsArr,
          user_kw: req.query.user_kw as string,
          q: req.query.q as string
        };

        const deletedCount = await this.queryService.deleteEvents(query);
        res.json({ success: true, deleted: deletedCount });
      } catch (error) {
        next(error);
      }
    });

    // GET /api/events/dates - 返回事件存在的日期集合
    this.app.get('/api/events/dates', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const roomId = (req.query.room_id as string) || undefined;
        const dates = await this.queryService.getEventDates(roomId);
        return res.json({ dates });
      } catch (error) { next(error); }
    });

    // GET /api/users - 列出已知用户
    this.app.get('/api/users', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const limit = req.query.limit ? Math.max(1, Math.min(1000, parseInt(String(req.query.limit)))) : 200;
        const roomId = (req.query.room_id as string) || undefined;
        const items = await this.queryService.listUsers(limit, roomId);
        return res.json({ items, total: items.length });
      } catch (error) { next(error); }
    });

    // GET /api/users/search - 用户搜索
    this.app.get('/api/users/search', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const keyword = String(req.query.keyword || '').trim();
        const page = req.query.page ? Math.max(1, parseInt(String(req.query.page))) : 1;
        const pageSize = req.query.pageSize ? Math.max(1, Math.min(200, parseInt(String(req.query.pageSize)))) : 20;
        const roomId = (req.query.room_id as string) || undefined;
        const result = await this.queryService.searchUsers(keyword, page, pageSize, roomId);
        return res.json(result);
      } catch (error) { next(error); }
    });

    // GET /api/stats/events - 聚合事件统计
    this.app.get('/api/stats/events', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const roomId = (req.query.room_id as string) || undefined;
        const stats = await this.queryService.getEventStats(roomId);
        res.json({ success: true, ...stats });
      } catch (error) {
        next(error);
      }
    });

    this.app.get('/api/events/rooms', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const limit = req.query.limit ? Math.max(1, Math.min(1000, parseInt(String(req.query.limit)))) : 200;
        const rooms = await this.queryService.listRooms(limit);
        if (process.env.ACFRAME_DEBUG_LOGS === '1') {
          try { console.log('[API] /api/events/rooms rooms=' + String(rooms.length)); } catch {}
        }
        res.json({ rooms });
      } catch (error) {
        next(error);
      }
    });


    this.app.get('/api/export', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const rawType = req.query.type as string | string[] | undefined;
        let typesArr: NormalizedEventType[] | undefined;
        if (Array.isArray(rawType)) {
          typesArr = (rawType as string[]).map(s => String(s).trim()).filter(Boolean) as NormalizedEventType[];
        } else if (typeof rawType === 'string' && rawType.trim().length > 0) {
          typesArr = rawType.split(',').map(s => s.trim()).filter(Boolean) as NormalizedEventType[];
        }

        const options: ExportOptions = {
          room_id: req.query.room_id as string,
          from_ts: req.query.from_ts ? parseInt(String(req.query.from_ts)) : undefined,
          to_ts: req.query.to_ts ? parseInt(String(req.query.to_ts)) : undefined,
          from_date: req.query.from_date ? String(req.query.from_date) : undefined,
          to_date: req.query.to_date ? String(req.query.to_date) : undefined,
          types: typesArr,
          filename: req.query.filename as string,
          includeRaw: req.query.includeRaw === 'true'
        };

        const result = await this.csvExporter.exportToCsv(options);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.setHeader('X-Record-Count', String(result.recordCount));

        const stream = fs.createReadStream(result.filepath, { encoding: 'utf8' });
        stream.on('error', (err) => next(err));
        stream.pipe(res);
      } catch (error) {
        next(error);
      }
    });

    

    this.app.post('/api/export', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const rawType = req.body?.type as string | string[] | undefined;
        const rawTypes = req.body?.types as string[] | undefined;
        let typesArr: NormalizedEventType[] | undefined;
        if (Array.isArray(rawTypes)) {
          typesArr = rawTypes.map(s => String(s).trim()).filter(Boolean) as NormalizedEventType[];
        } else if (Array.isArray(rawType)) {
          typesArr = (rawType as string[]).map(s => String(s).trim()).filter(Boolean) as NormalizedEventType[];
        } else if (typeof rawType === 'string' && rawType.trim().length > 0) {
          typesArr = rawType.split(',').map(s => s.trim()).filter(Boolean) as NormalizedEventType[];
        }

        const options: ExportOptions = {
          room_id: req.body.room_id,
          from_ts: req.body.from_ts ? parseInt(String(req.body.from_ts)) : undefined,
          to_ts: req.body.to_ts ? parseInt(String(req.body.to_ts)) : undefined,
          from_date: req.body.from_date ? String(req.body.from_date) : undefined,
          to_date: req.body.to_date ? String(req.body.to_date) : undefined,
          types: typesArr,
          filename: req.body.filename,
          includeRaw: !!req.body.includeRaw
        };

        const result = await this.csvExporter.exportToCsv(options);

        res.json({
          success: true,
          filename: result.filename,
          filepath: result.filepath,
          recordCount: result.recordCount,
          fileSize: result.fileSize
        });
      } catch (error) {
        next(error);
      }
    });

    // GET /test-overlay.html - 测试页面
    this.app.get('/test-overlay.html', (req: express.Request, res: express.Response) => {
      const testPagePath = path.join(process.cwd(), 'test-overlay.html');
      if (fs.existsSync(testPagePath)) {
        res.sendFile(testPagePath);
      } else {
        res.status(404).send('Test overlay page not found');
      }
    });

    // GET /api/console/data - 获取控制台页面数据
    this.app.get('/api/console/data', (req: express.Request, res: express.Response) => {
      try {
        const commands = this.consoleManager.getCommands();
        const sessions = this.consoleManager.getActiveSessions();

        res.json({
          success: true,
          data: {
            commands,
            sessions,
            websocket_clients: this.wsHub?.getClientCount() || 0
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: (error as Error).message
        });
      }
    });


    
    this.app.get('/sse/system/logs', (req: express.Request, res: express.Response) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      try { (res as any).flushHeaders?.(); } catch {}
      try { res.write(':\n\n'); } catch {}

      const channel = 'system:logs';
      const send = (entry: any) => {
        try {
          res.write('event: log\n');
          res.write(`data: ${JSON.stringify(entry)}\n\n`);
        } catch {}
      };

      try {
        const recent = this.diagnosticsService.getRecentLogs(200);
        res.write('event: init\n');
        res.write(`data: ${JSON.stringify(recent)}\n\n`);
      } catch {}

      const unsubscribe = this.dataManager.subscribe(channel, send as any, undefined);

      const heartbeat = setInterval(() => {
        try {
          res.write('event: heartbeat\n');
          res.write(`data: {"ts": ${Date.now()}}\n\n`);
        } catch {}
      }, SSE_HEARTBEAT_MS);

      const cleanup = () => {
        try { unsubscribe(); } catch {}
        try { clearInterval(heartbeat); } catch {}
        try { res.end(); } catch {}
      };
      req.on('close', cleanup);
    });

    // Popup: POST /api/popup
    this.app.post('/api/popup', async (req: express.Request, res: express.Response) => {
      try {
        const headerPluginId = String(req.get('X-Plugin-ID') || '').trim();
        const { action, title, message, options, windowId } = (req.body || {}) as { action?: string; title?: string; message?: string; options?: any; windowId?: string };
        const targetPluginId = String(windowId || headerPluginId || '').trim();
        const act = String(action || '').trim();
        if (!act || !message) {
          return res.status(400).json({ success: false, error: 'INVALID_PARAMS' });
        }
        const payload: any = act === 'toast'
          ? { action: 'toast', payload: { message, options } }
          : act === 'alert'
            ? { action: 'alert', payload: { title: String(title || ''), message, options } }
            : act === 'confirm'
              ? { action: 'confirm', payload: { title: String(title || ''), message, options } }
              : null;
        if (!payload) {
          return res.status(400).json({ success: false, error: 'UNSUPPORTED_ACTION' });
        }
        let ok = false;
        if (targetPluginId) {
          ok = !!this.pluginWindowManager?.send(targetPluginId, 'renderer-global-popup', payload);
        }
        // Fallback to main window if plugin window not found (e.g. embedded UI mode)
        if (!ok) {
          const win = this.windowManager?.getMainWindow();
          if (win && !win.isDestroyed()) { try { win.webContents.send('renderer-global-popup', payload); ok = true; } catch {} }
        }
        if (!ok) {
          return res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
        }
        return res.json({ success: true });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error?.message || 'POPUP_FAILED' });
      }
    });

    const resolveWindow = (req: express.Request): { main?: boolean; pluginId?: string } => {
      const headerPluginId = String(req.get('X-Plugin-ID') || '').trim();
      const { windowId, pluginId } = (req.body || {}) as any;
      const target = String(windowId || pluginId || headerPluginId || '').trim();
      if (target) return { pluginId: target };
      return { main: true };
    };

    const getTargetBrowserWindow = (req: express.Request): BrowserWindow | null => {
      const target = resolveWindow(req);
      if (target.pluginId) {
        return this.pluginWindowManager?.getWindow(target.pluginId) || null;
      }
      return this.windowManager?.getMainWindow() || null;
    };

    // Window extended control
    this.app.post('/api/windows/minimize', (req, res) => {
      const win = getTargetBrowserWindow(req);
      if (win && !win.isDestroyed()) { win.minimize(); return res.json({ success: true }); }
      res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
    });

    this.app.post('/api/windows/maximize', (req, res) => {
      const win = getTargetBrowserWindow(req);
      if (win && !win.isDestroyed()) {
        if (win.isMaximized()) win.unmaximize(); else win.maximize();
        return res.json({ success: true });
      }
      res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
    });

    this.app.post('/api/windows/restore', (req, res) => {
      const win = getTargetBrowserWindow(req);
      if (win && !win.isDestroyed()) { win.restore(); return res.json({ success: true }); }
      res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
    });

    this.app.get('/api/windows/size', (req, res) => {
      const win = getTargetBrowserWindow(req);
      if (win && !win.isDestroyed()) {
        const [width, height] = win.getSize();
        return res.json({ success: true, width, height });
      }
      res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
    });

    this.app.post('/api/windows/size', (req, res) => {
      const win = getTargetBrowserWindow(req);
      if (win && !win.isDestroyed()) {
        const { width, height } = req.body;
        if (typeof width === 'number' && typeof height === 'number') {
          win.setSize(width, height);
          return res.json({ success: true });
        }
        return res.status(400).json({ success: false, error: 'INVALID_SIZE' });
      }
      res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
    });

    this.app.get('/api/windows/position', (req, res) => {
      const win = getTargetBrowserWindow(req);
      if (win && !win.isDestroyed()) {
        const [x, y] = win.getPosition();
        return res.json({ success: true, x, y });
      }
      res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
    });

    this.app.post('/api/windows/position', (req, res) => {
      const win = getTargetBrowserWindow(req);
      if (win && !win.isDestroyed()) {
        const { x, y } = req.body;
        if (typeof x === 'number' && typeof y === 'number') {
          win.setPosition(x, y);
          return res.json({ success: true });
        }
        return res.status(400).json({ success: false, error: 'INVALID_POSITION' });
      }
      res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
    });

    this.app.post('/api/windows/opacity', (req, res) => {
      const win = getTargetBrowserWindow(req);
      if (win && !win.isDestroyed()) {
        const { opacity } = req.body;
        if (typeof opacity === 'number') {
          win.setOpacity(opacity);
          return res.json({ success: true });
        }
        return res.status(400).json({ success: false, error: 'INVALID_OPACITY' });
      }
      res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
    });

    this.app.post('/api/windows/top', (req, res) => {
      const win = getTargetBrowserWindow(req);
      if (win && !win.isDestroyed()) {
        const { flag } = req.body;
        win.setAlwaysOnTop(!!flag);
        return res.json({ success: true });
      }
      res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
    });

    this.app.post('/api/windows/resizable', (req, res) => {
      const win = getTargetBrowserWindow(req);
      if (win && !win.isDestroyed()) {
        const { flag } = req.body;
        win.setResizable(!!flag);
        return res.json({ success: true });
      }
      res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
    });

    this.app.post('/api/windows/ignore-mouse', (req, res) => {
      const win = getTargetBrowserWindow(req);
      if (win && !win.isDestroyed()) {
        const { ignore, options } = req.body;
        win.setIgnoreMouseEvents(!!ignore, options);
        return res.json({ success: true });
      }
      res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
    });



    // FS (Scoped)
    this.app.post('/api/fs/read', async (req, res) => {
      try {
        const { path: relPath } = req.body;
        const { pluginId } = resolveWindow(req);
        if (!pluginId) return res.status(403).json({ error: 'PLUGIN_CONTEXT_REQUIRED' });
        const storageRoot = path.join(app.getPath('userData'), 'plugin-data', pluginId);
        const safePath = path.resolve(storageRoot, relPath);
        if (!safePath.startsWith(storageRoot)) return res.status(403).json({ error: 'PATH_TRAVERSAL' });
        if (!fs.existsSync(safePath)) return res.status(404).json({ error: 'FILE_NOT_FOUND' });
        const content = fs.readFileSync(safePath, 'utf-8');
        res.json({ success: true, data: content });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    });

    this.app.post('/api/fs/write', async (req, res) => {
      try {
        const { path: relPath, content } = req.body;
        const { pluginId } = resolveWindow(req);
        if (!pluginId) return res.status(403).json({ error: 'PLUGIN_CONTEXT_REQUIRED' });
        const storageRoot = path.join(app.getPath('userData'), 'plugin-data', pluginId);
        if (!fs.existsSync(storageRoot)) fs.mkdirSync(storageRoot, { recursive: true });
        const safePath = path.resolve(storageRoot, relPath);
        if (!safePath.startsWith(storageRoot)) return res.status(403).json({ error: 'PATH_TRAVERSAL' });
        fs.writeFileSync(safePath, content, 'utf-8');
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    });

    // Shortcut
    this.app.post('/api/shortcut/register', (req, res) => {
      const { accelerator } = req.body;
      const { pluginId } = resolveWindow(req);
      if (!pluginId) return res.status(400).json({ error: 'PLUGIN_CONTEXT_REQUIRED' });
      
      // Note: Electron globalShortcut is global. Conflict management is needed but skipped for now.
      try {
        // 1. Validate modifier
        const lowerAcc = accelerator.toLowerCase();
        const hasModifier = ['commandorcontrol', 'cmdorctrl', 'command', 'control', 'ctrl', 'alt', 'option', 'shift', 'super', 'meta']
          .some(m => lowerAcc.includes(m));
        
        if (!hasModifier) {
           return res.status(400).json({ success: false, error: 'INVALID_SHORTCUT_NO_MODIFIER' });
        }

        // 2. Check conflict (Global)
        if (globalShortcut.isRegistered(accelerator)) {
           return res.status(409).json({ success: false, error: 'SHORTCUT_ALREADY_REGISTERED' });
        }

        const ret = globalShortcut.register(accelerator, () => {
          // Send event to plugin
          this.pluginWindowManager?.send(pluginId, 'shortcut-triggered', { accelerator });
          
          // Broadcast to SSE clients (UI/Overlay)
          const channel = `plugin:${pluginId}:overlay`;
          try {
            this.dataManager.publish(channel, { 
              event: 'shortcut-triggered', 
              payload: { accelerator } 
            }, { 
              ttlMs: 5000, 
              persist: false, 
              meta: { kind: 'shortcut' } 
            });
          } catch (err) {
            console.error('[ApiServer] Failed to broadcast shortcut event', err);
          }
        });
        if (!ret) return res.json({ success: false, error: 'REGISTER_FAILED' });
        
        // Track shortcut
        if (!this.pluginShortcuts.has(pluginId)) {
          this.pluginShortcuts.set(pluginId, new Set());
        }
        this.pluginShortcuts.get(pluginId)?.add(accelerator);

        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
      }
    });

    this.app.post('/api/shortcut/unregister', (req, res) => {
      const { accelerator } = req.body;
      const { pluginId } = resolveWindow(req);
      
      try {
        // Handle wildcard "*"
        if (accelerator === '*') {
          if (!pluginId) return res.status(400).json({ error: 'PLUGIN_CONTEXT_REQUIRED_FOR_WILDCARD' });
          const shortcuts = this.pluginShortcuts.get(pluginId);
          if (shortcuts) {
            for (const acc of shortcuts) {
              try { globalShortcut.unregister(acc); } catch {}
            }
            shortcuts.clear();
          }
          return res.json({ success: true });
        }

        // Handle array or single string
        const targets = Array.isArray(accelerator) ? accelerator : [accelerator];
        
        for (const acc of targets) {
          if (acc === '*') { // Allow mixed wildcard in array? Be safe and ignore or treat as wildcard logic above if standalone.
             continue; // Ignore wildcard inside array for safety or strictness.
          }
          globalShortcut.unregister(acc);
          if (pluginId && this.pluginShortcuts.has(pluginId)) {
            this.pluginShortcuts.get(pluginId)?.delete(acc);
          }
        }
        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
      }
    });

    this.app.post('/api/shortcut/unregister-all', (req, res) => {
      const { pluginId } = resolveWindow(req);
      if (!pluginId) return res.status(400).json({ error: 'PLUGIN_CONTEXT_REQUIRED' });

      try {
        const shortcuts = this.pluginShortcuts.get(pluginId);
        if (shortcuts) {
          for (const acc of shortcuts) {
            try { globalShortcut.unregister(acc); } catch {}
          }
          shortcuts.clear();
        }
        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
      }
    });

    this.app.post('/api/shortcut/list', (req, res) => {
      const { pluginId } = resolveWindow(req);
      if (!pluginId) return res.status(400).json({ error: 'PLUGIN_CONTEXT_REQUIRED' });
      
      const shortcuts = this.pluginShortcuts.get(pluginId);
      res.json({ success: true, shortcuts: shortcuts ? Array.from(shortcuts) : [] });
    });

    this.app.post('/api/shortcut/is-registered', (req, res) => {
      const { accelerator } = req.body;
      try {
        const registered = globalShortcut.isRegistered(accelerator);
        res.json({ success: true, registered });
      } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
      }
    });

    // Window control: show
    this.app.post('/api/windows/show', async (req: express.Request, res: express.Response) => {
      try {
        const target = resolveWindow(req);
        if (target.pluginId) {
          const r = await this.pluginWindowManager?.focus(target.pluginId);
          const ok = !!(r && (r as any).success);
          return ok ? res.json({ success: true }) : res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
        }
        const win = this.windowManager?.getMainWindow();
        if (win && !win.isDestroyed()) { try { win.show(); win.focus(); } catch {} return res.json({ success: true }); }
        return res.status(404).json({ success: false, error: 'MAIN_WINDOW_NOT_FOUND' });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error?.message || 'SHOW_FAILED' });
      }
    });

    // Window control: focus
    this.app.post('/api/windows/focus', async (req: express.Request, res: express.Response) => {
      try {
        const target = resolveWindow(req);
        if (target.pluginId) {
          const r = await this.pluginWindowManager?.focus(target.pluginId);
          const ok = !!(r && (r as any).success);
          return ok ? res.json({ success: true }) : res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
        }
        const win = this.windowManager?.getMainWindow();
        if (win && !win.isDestroyed()) { try { win.show(); win.focus(); } catch {} return res.json({ success: true }); }
        return res.status(404).json({ success: false, error: 'MAIN_WINDOW_NOT_FOUND' });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error?.message || 'FOCUS_FAILED' });
      }
    });

    // Window control: blur
    this.app.post('/api/windows/blur', async (req: express.Request, res: express.Response) => {
      try {
        const target = resolveWindow(req);
        if (target.pluginId) {
          const win = this.pluginWindowManager?.getWindow(target.pluginId);
          if (win && !win.isDestroyed()) { win.blur(); return res.json({ success: true }); }
          return res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
        }
        const win = this.windowManager?.getMainWindow();
        if (win && !win.isDestroyed()) { try { win.blur(); } catch {} return res.json({ success: true }); }
        return res.status(404).json({ success: false, error: 'MAIN_WINDOW_NOT_FOUND' });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error?.message || 'BLUR_FAILED' });
      }
    });

    // Window control: hide
    this.app.post('/api/windows/hide', async (req: express.Request, res: express.Response) => {
      try {
        const target = resolveWindow(req);
        if (target.pluginId) {
          const win = this.pluginWindowManager?.getWindow(target.pluginId);
          if (win && !win.isDestroyed()) { win.hide(); return res.json({ success: true }); }
          return res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
        }
        const win = this.windowManager?.getMainWindow();
        if (win && !win.isDestroyed()) { try { win.hide(); } catch {} return res.json({ success: true }); }
        return res.status(404).json({ success: false, error: 'MAIN_WINDOW_NOT_FOUND' });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error?.message || 'HIDE_FAILED' });
      }
    });

    // Logger API
    this.app.post('/api/logger', (req: express.Request, res: express.Response) => {
      try {
        const { level, message } = req.body;
        const { pluginId } = resolveWindow(req);
        const msg = String(message || '');
        
        if (pluginId) {
          if (level === 'error') pluginLogger.error(msg, pluginId);
          else if (level === 'warn') pluginLogger.warn(msg, pluginId);
          else pluginLogger.info(msg, pluginId);
        } else {
          const logManager = getLogManager();
          const src = 'Plugin:Unknown';
          if (level === 'error') logManager.addLog(src, msg, 'error');
          else if (level === 'warn') logManager.addLog(src, msg, 'warn');
          else logManager.addLog(src, msg, 'info');
        }
        
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    });

    // Window control: close
    this.app.post('/api/windows/close', async (req: express.Request, res: express.Response) => {
      try {
        const { pluginId } = resolveWindow(req);
        if (pluginId) {
          const r = await this.pluginWindowManager?.close(pluginId);
          const ok = !!(r && (r as any).success);
          return ok ? res.json({ success: true }) : res.status(404).json({ success: false, error: 'WINDOW_NOT_FOUND' });
        }
        const win = this.windowManager?.getMainWindow();
        if (win && !win.isDestroyed()) { try { win.close(); } catch {} return res.json({ success: true }); }
        return res.status(404).json({ success: false, error: 'MAIN_WINDOW_NOT_FOUND' });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error?.message || 'CLOSE_FAILED' });
      }
    });

    // Window list
    this.app.get('/api/windows/list', async (_req: express.Request, res: express.Response) => {
      try {
        const list = await this.pluginWindowManager?.list();
        const main = this.windowManager?.getMainWindow();
        const mainState = main && !main.isDestroyed() ? { windowId: 'main', visible: main.isVisible(), focused: main.isFocused() } : { windowId: 'main', visible: false, focused: false };
        const windows = Array.isArray((list as any)?.windows) ? (list as any).windows.map((w: any) => ({ windowId: w.pluginId, visible: !!w.visible, focused: !!w.focused })) : [];
        return res.json({ success: true, windows: [mainState, ...windows] });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error?.message || 'LIST_FAILED' });
      }
    });

    // Window self identity
    this.app.get('/api/windows/self', async (req: express.Request, res: express.Response) => {
      try {
        const headerPluginId = String(req.get('X-Plugin-ID') || '').trim();
        const windowId = headerPluginId || 'main';
        return res.json({ success: true, windowId });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error?.message || 'SELF_FAILED' });
      }
    });

    // System control
    this.app.post('/api/system/open-external', async (req: express.Request, res: express.Response) => {
      try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ success: false, error: 'URL_REQUIRED' });
        await shell.openExternal(url);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message || 'OPEN_EXTERNAL_FAILED' });
      }
    });

    this.app.post('/api/system/show-item', async (req: express.Request, res: express.Response) => {
      try {
        const { path: itemPath } = req.body;
        if (!itemPath) return res.status(400).json({ success: false, error: 'PATH_REQUIRED' });
        const fullPath = path.resolve(itemPath);
        shell.showItemInFolder(fullPath);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message || 'SHOW_ITEM_FAILED' });
      }
    });

    this.app.post('/api/system/open-path', async (req: express.Request, res: express.Response) => {
      try {
        const { path: itemPath } = req.body;
        if (!itemPath) return res.status(400).json({ success: false, error: 'PATH_REQUIRED' });
        const fullPath = path.resolve(itemPath);
        const error = await shell.openPath(fullPath);
        if (error) throw new Error(error);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message || 'OPEN_PATH_FAILED' });
      }
    });

    
    this.app.get('/api/logs', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const level = (req.query.level as string | undefined)?.toLowerCase() as ('info' | 'error' | 'warn' | 'debug' | undefined);
        const source = req.query.source as string | undefined;
        const fromTs = req.query.from_ts ? parseInt(String(req.query.from_ts)) : undefined;
        const toTs = req.query.to_ts ? parseInt(String(req.query.to_ts)) : undefined;
        const limit = req.query.limit ? Math.min(1000, Math.max(1, parseInt(String(req.query.limit)))) : 200;

        let logs = this.diagnosticsService.getRecentLogs(limit) as any[];
        if (level) logs = logs.filter(l => String(l.level).toLowerCase() === level);
        if (source) logs = logs.filter(l => String(l.source || '').includes(source));
        if (fromTs) logs = logs.filter(l => new Date(String(l.timestamp)).getTime() >= fromTs);
        if (toTs) logs = logs.filter(l => new Date(String(l.timestamp)).getTime() <= toTs);

        res.json({ success: true, data: logs });
      } catch (error) { next(error); }
    });

    
    this.app.post('/api/logs/export', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const fromTs = req.body?.from_ts ? parseInt(String(req.body.from_ts)) : undefined;
        const toTs = req.body?.to_ts ? parseInt(String(req.body.to_ts)) : undefined;
        const level = String(req.body?.level || 'error').toLowerCase();
        const source = req.body?.source ? String(req.body.source) : undefined;
        const limit = req.body?.limit ? Math.min(5000, Math.max(1, parseInt(String(req.body.limit)))) : 1000;

        let logs = this.diagnosticsService.getRecentLogs(limit) as any[];
        logs = logs.filter(l => String(l.level).toLowerCase() === level);
        if (source) logs = logs.filter(l => String(l.source || '').includes(source));
        if (fromTs) logs = logs.filter(l => new Date(String(l.timestamp)).getTime() >= fromTs);
        if (toTs) logs = logs.filter(l => new Date(String(l.timestamp)).getTime() <= toTs);

        const outDir = path.join(app.getPath('userData'), 'logs-exports');
        try { if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true }); } catch {}
        const filename = `error-logs-${Date.now()}.json`;
        const filepath = path.join(outDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(logs, null, 2), 'utf-8');
        res.json({ success: true, filepath, count: logs.length });
      } catch (error) { next(error); }
    });

    // Console API endpoints
    // POST /api/console/sessions - 创建控制台会话
    this.app.post('/api/console/sessions', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const { name } = req.body;
        const session = await this.consoleManager.createSession(name);
        res.json({ success: true, session });
      } catch (error) {
        next(error);
      }
    });

    // DELETE /api/console/sessions/:sessionId - 结束控制台会话
    this.app.delete('/api/console/sessions/:sessionId', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const { sessionId } = req.params;
        const success = await this.consoleManager.endSession(sessionId);
        res.json({ success });
      } catch (error) {
        next(error);
      }
    });

    // POST /api/console/sessions/:sessionId/execute - 执行控制台命令
    this.app.post('/api/console/sessions/:sessionId/execute', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const { sessionId } = req.params;
        const { command } = req.body;
        const result = await this.consoleManager.executeCommand(sessionId, command);
        res.json({ success: true, result });
      } catch (error) {
        next(error);
      }
    });

    // GET /api/console/commands - 获取可用命令列表
    this.app.get('/api/console/commands', (req: express.Request, res: express.Response) => {
      try {
        const commands = this.consoleManager.getCommands();
        res.json({ success: true, commands });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // GET /api/console/sessions - 获取活动会话列表
    this.app.get('/api/console/sessions', (req: express.Request, res: express.Response) => {
      try {
        const sessions = this.consoleManager.getActiveSessions();
        res.json({ success: true, sessions });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // GET /api/console/sessions/:sessionId - 获取特定会话信息
    this.app.get('/api/console/sessions/:sessionId', (req: express.Request, res: express.Response) => {
      try {
        const { sessionId } = req.params;
        const session = this.consoleManager.getSession(sessionId);
        if (session) {
          res.json({ success: true, session });
        } else {
          res.status(404).json({ success: false, error: 'Session not found' });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // GET /api/plugins - 返回已安装插件列表（用于渲染层HTTP回退）
    this.app.get('/api/plugins', (req: express.Request, res: express.Response) => {
      try {
        if (!this.pluginManager) {
          return res.status(503).json({ success: false, error: 'PLUGIN_MANAGER_NOT_AVAILABLE' });
        }
        const plugins = this.pluginManager.getInstalledPlugins();
        res.json({ success: true, plugins });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // Plugin Storage API
    
    // POST /api/plugins/:pluginId/storage - Write
    this.app.post('/api/plugins/:pluginId/storage', async (req: express.Request, res: express.Response) => {
      try {
        const pluginId = String(req.params.pluginId || '').trim();
        if (!pluginId) return res.status(400).json({ success: false, error: 'INVALID_PLUGIN_ID' });
        
        // Ensure table exists
        await this.ensurePluginStorageTable();

        const row = req.body;
        const db = this.databaseManager.getDb();
        const createTime = Date.now();
        
        await new Promise<void>((resolve, reject) => {
          db.run(
            `INSERT INTO plugin_storage (plugin_id, createTime, data) VALUES (?, ?, ?)`,
            [pluginId, createTime, JSON.stringify(row || {})],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    });

    // GET /api/plugins/:pluginId/storage - Read
    this.app.get('/api/plugins/:pluginId/storage', async (req: express.Request, res: express.Response) => {
      try {
        const pluginId = String(req.params.pluginId || '').trim();
        if (!pluginId) return res.status(400).json({ success: false, error: 'INVALID_PLUGIN_ID' });

        await this.ensurePluginStorageTable();
        const db = this.databaseManager.getDb();
        
        const queryText = req.query.q ? String(req.query.q) : undefined;
        const size = req.query.size ? Math.max(1, parseInt(String(req.query.size))) : 1; // Default 1, unless size passed

        let sql = `SELECT id, plugin_id, createTime, data FROM plugin_storage WHERE plugin_id = ?`;
        const params: any[] = [pluginId];

        if (queryText) {
          sql += ` AND data LIKE ?`;
          params.push(`%${queryText}%`);
        }

        sql += ` ORDER BY createTime DESC LIMIT ?`;
        params.push(size);

        const rows = await new Promise<any[]>((resolve, reject) => {
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        // Parse JSON data
        const results = rows.map(r => {
          try {
            return { ...r, data: JSON.parse(r.data) };
          } catch {
            return r;
          }
        });

        // If size not passed (default 1), user might expect single object or array?
        // Requirement says: "如果不传入size参数则返回最新一条数据，否则按createTime倒序排列返回size行数数据"
        // Usually list API returns list. "返回最新一条数据" could mean return object directly or list of 1.
        // Given "返回数据行数组" for the other case, and typically consistency, I'll return array.
        // BUT, if the user explicitly wants "Latest ONE data" (singular), maybe they expect the object.
        // However, "storage Read... 返回数据行数组" (Return data row array).
        // So I will return array.
        res.json({ success: true, data: results });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    });

    // GET /api/plugins/:pluginId/storage/size - Count
    this.app.get('/api/plugins/:pluginId/storage/size', async (req: express.Request, res: express.Response) => {
      try {
        const pluginId = String(req.params.pluginId || '').trim();
        if (!pluginId) return res.status(400).json({ success: false, error: 'INVALID_PLUGIN_ID' });

        await this.ensurePluginStorageTable();
        const db = this.databaseManager.getDb();

        const count = await new Promise<number>((resolve, reject) => {
          db.get(`SELECT COUNT(*) as count FROM plugin_storage WHERE plugin_id = ?`, [pluginId], (err, row: any) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
          });
        });

        res.json({ success: true, count });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    });

    // POST /api/plugins/:pluginId/storage/remove - Remove
    this.app.post('/api/plugins/:pluginId/storage/remove', async (req: express.Request, res: express.Response) => {
      try {
        const pluginId = String(req.params.pluginId || '').trim();
        if (!pluginId) return res.status(400).json({ success: false, error: 'INVALID_PLUGIN_ID' });
        
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
           return res.status(400).json({ success: false, error: 'INVALID_IDS' });
        }

        await this.ensurePluginStorageTable();
        const db = this.databaseManager.getDb();
        
        // Safe parameter substitution for IN clause
        const placeholders = ids.map(() => '?').join(',');
        const sql = `DELETE FROM plugin_storage WHERE plugin_id = ? AND id IN (${placeholders})`;
        const params = [pluginId, ...ids];

        await new Promise<void>((resolve, reject) => {
          db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve();
          });
        });

        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message });
      }
    });

    // GET /api/plugins/:pluginId/config - 读取插件已保存配置（只读）
    this.app.get('/api/plugins/:pluginId/config', (req: express.Request, res: express.Response) => {
      try {
        const pluginId = String(req.params.pluginId || '').trim();
        if (!pluginId) {
          return res.status(400).json({ success: false, error: 'INVALID_PLUGIN_ID' });
        }
        let conf: Record<string, any> | null = null;
        let fromStore: Record<string, any> | null = null;
        try {
          const userData = app.getPath('userData');
          const filePath = path.join(userData, 'config.json');
          const raw = fs.readFileSync(filePath, 'utf-8');
          const json = JSON.parse(raw || '{}');
          const plugins = (json && typeof json === 'object' ? (json as any).plugins : null) || null;
          const obs = plugins && typeof plugins === 'object' ? (plugins as any)[pluginId] : null;
          const data = obs && typeof obs === 'object' ? (obs as any).config : null;
          if (data && typeof data === 'object') {
            conf = data as Record<string, any>;
          }
        } catch {}
        try {
          const cfg = new ConfigManager();
          fromStore = (cfg.get(`plugins.${pluginId}.config`, {}) || {}) as Record<string, any>;
        } catch {}
        if (!conf || (conf && Object.keys(conf).length === 0)) {
          conf = fromStore || {};
        } else if (fromStore && Object.keys(fromStore).length > 0) {
          conf = { ...fromStore, ...conf };
        }
        res.json({ success: true, data: conf || {} });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // POST /api/plugins/:pluginId/config - 更新插件配置
    this.app.post('/api/plugins/:pluginId/config', (req: express.Request, res: express.Response) => {
      try {
        const pluginId = String(req.params.pluginId || '').trim();
        if (!pluginId) return res.status(400).json({ success: false, error: 'INVALID_PLUGIN_ID' });
        const updates = req.body;
        
        const cfg = new ConfigManager();
        const current = (cfg.get(`plugins.${pluginId}.config`, {}) || {}) as Record<string, any>;
        const next = { ...current, ...updates };
        cfg.set(`plugins.${pluginId}.config`, next);
        
        // Broadcast config change
        const channel = `plugin:${pluginId}:overlay`;
        try {
          this.dataManager.publish(channel, { event: 'config-changed', payload: next }, { ttlMs: 10000, persist: false, meta: { kind: 'config' } });
        } catch {}
        
        res.json({ success: true, data: next });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // DELETE /api/plugins/:pluginId/config - 删除配置项
    this.app.delete('/api/plugins/:pluginId/config', (req: express.Request, res: express.Response) => {
      try {
        const pluginId = String(req.params.pluginId || '').trim();
        if (!pluginId) return res.status(400).json({ success: false, error: 'INVALID_PLUGIN_ID' });
        
        const key = req.body.key;
        if (!key) return res.status(400).json({ success: false, error: 'KEY_REQUIRED' });

        const cfg = new ConfigManager();
        const current = (cfg.get(`plugins.${pluginId}.config`, {}) || {}) as Record<string, any>;
        
        if (key in current) {
          delete current[key];
          cfg.set(`plugins.${pluginId}.config`, current);
          
          // Broadcast config change
          const channel = `plugin:${pluginId}:overlay`;
          try {
            this.dataManager.publish(channel, { event: 'config-changed', payload: current }, { ttlMs: 10000, persist: false, meta: { kind: 'config' } });
          } catch {}
        }

        res.json({ success: true, data: current });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // POST /api/proxy/request - 通用 HTTP 请求代理 (避免 renderer CORS)
    this.app.post('/api/proxy/request', async (req: express.Request, res: express.Response) => {
      try {
        const { method, url, headers, body } = req.body;
        if (!url) return res.status(400).json({ success: false, error: 'URL_REQUIRED' });

        if (!/^https?:\/\//.test(url)) {
             return res.status(400).json({ success: false, error: 'INVALID_URL_PROTOCOL' });
        }

        const fetchOptions: any = {
          method: method || 'GET',
          headers: headers || {},
        };
        
        if (body !== undefined && body !== null) {
           if (typeof body === 'object') {
              fetchOptions.body = JSON.stringify(body);
              const hasCt = Object.keys(fetchOptions.headers).some(k => k.toLowerCase() === 'content-type');
              if (!hasCt) {
                 fetchOptions.headers['Content-Type'] = 'application/json';
              }
           } else {
              fetchOptions.body = String(body);
           }
        }

        const response = await fetch(url, fetchOptions);
        const status = response.status;
        const respHeaders: Record<string, string> = {};
        response.headers.forEach((val, key) => { respHeaders[key] = val; });

        const text = await response.text();
        let data = text;
        try {
           data = JSON.parse(text);
        } catch {}

        res.json({
          success: true,
          data,
          status,
          headers: respHeaders
        });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error?.message || 'PROXY_REQUEST_FAILED' });
      }
    });

    // AcFun API 代理路由 - 将所有 /api/acfun/* 请求代理到 AcfunApiProxy
    this.app.use('/api/acfun', this.acfunApiProxy.createRoutes());

    // GET /plugins/:id/*rest - 插件页面托管（path-to-regexp v8 命名通配符）
    this.app.all('/plugins/:id/*rest', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const pluginId = req.params.id;
      const splat = (req.params as any).rest;
      const reqPath = `/${Array.isArray(splat) ? splat.join('/') : (splat || '')}`; // path within plugin scope

      // 路由命中检查（只匹配已注册的前缀路径）
      const routes = this.pluginRoutes.get(pluginId) || [];
      const method = req.method.toUpperCase() as 'GET' | 'POST';
      const candidate = routes.find(r => r.method === method && reqPath.startsWith(r.path));

      if (!candidate) {
        // 统一静态托管：/plugins/:id/ui[/*]、/window[/*]、/overlay[/*] 与 *.html 入口
        try {
          if (!this.pluginManager) {
            return res.status(404).json({ error: 'PLUGIN_MANAGER_NOT_AVAILABLE' });
          }
          const plugin = this.pluginManager.getPlugin(pluginId);
          if (!plugin) {
            return res.status(404).json({ error: 'PLUGIN_NOT_FOUND', pluginId });
          }

          const segments = reqPath.split('/').filter(Boolean);
          // 禁用态拦截：仅允许访问根目录图标文件，其余页面/静态资源拒绝
          try {
            const isEnabled = plugin.status === 'enabled' && plugin.enabled === true;
            if (!isEnabled) {
              const manifestIcon = (plugin.manifest && (plugin.manifest as any).icon) ? String((plugin.manifest as any).icon) : 'icon.svg';
              const isIconRequest = segments.length === 1 && segments[0] === manifestIcon;
              if (!isIconRequest) {
                return res.status(403).json({ error: 'PLUGIN_DISABLED', pluginId, path: reqPath });
              }
            }
          } catch {}
          // 支持直接 *.html 入口，例如 /plugins/:id/ui.html
          const directHtmlMatch = segments.length === 1 && /^(ui|window|overlay)\.html$/i.test(segments[0]);


          const getPageConf = (type: 'ui' | 'window' | 'overlay') => {
            const m: any = plugin.manifest || {};
            const conf = m[type] || {};
            return {
              spa: conf?.spa === true,
              route: typeof conf?.route === 'string' ? conf.route : undefined,
              html: typeof conf?.html === 'string' ? conf.html : undefined,
            } as { spa: boolean; route?: string; html?: string };
          };

          const sendFile = (absPath: string) => {
            // 仅允许安装目录下的文件
            const installRoot = path.resolve(plugin.installPath);
            const resolved = path.resolve(absPath);

            // 防止目录穿越
            if (!resolved.startsWith(installRoot)) {
              return res.status(403).json({ error: 'FORBIDDEN_PATH' });
            }
            
            if (!fs.existsSync(resolved)) {
              return res.status(404).json({ error: 'FILE_NOT_FOUND', path: reqPath });
            }

            // 禁用缓存，确保最新资源被加载而非 304
            try {
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');
              res.setHeader('Surrogate-Control', 'no-store');
              res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            } catch {}
            return res.sendFile(resolved);
          };

          // 根目录图标直达：/plugins/:id/<manifest.icon>
          try {
            const manifestIcon = (plugin.manifest && (plugin.manifest as any).icon) ? String((plugin.manifest as any).icon) : 'icon.svg';
            if (segments.length === 1 && segments[0] === manifestIcon) {
              return sendFile(path.join(plugin.installPath, manifestIcon));
            }
          } catch {}

          const servePage = (type: 'ui' | 'window' | 'overlay', subPath: string[]) => {
            const conf = getPageConf(type);
            const defaultHtml = `${type}.html`;

            // 1) direct entry: /plugins/:id/<type>
            if (subPath.length === 0) {
              const htmlFile = conf.html || defaultHtml;
              return sendFile(path.join(plugin.installPath, htmlFile));
            }

            // 2) SPA fallback: /plugins/:id/<type>/* -> serve entry html
            if (conf.spa) {
              const htmlFile = conf.html || defaultHtml;
              return sendFile(path.join(plugin.installPath, htmlFile));
            }

            // 3) 非 SPA：按静态资源路径映射
            // 对于声明为子目录入口（如 overlay/index.html），将子路径相对于该目录进行解析；
            // 未声明子目录时（如 ui.html），默认使用 <type>/ 作为资源前缀。
            const rel = subPath.join('/');
            const declaredDir = conf.html && conf.html.includes('/') ? path.dirname(conf.html) : undefined;
            const resourceBase = declaredDir && declaredDir !== '.' ? declaredDir : type;
            const abs = path.join(plugin.installPath, resourceBase, rel);
            return sendFile(abs);
          };

          if (directHtmlMatch) {
            const type = segments[0].split('.')[0] as 'ui' | 'window' | 'overlay';
            const conf = getPageConf(type);
            const htmlFile = conf.html || `${type}.html`;
            return sendFile(path.join(plugin.installPath, htmlFile));
          }

          const pageType = segments[0] as 'ui' | 'window' | 'overlay';
          if (pageType === 'ui' || pageType === 'window' || pageType === 'overlay') {
            return servePage(pageType, segments.slice(1));
          }

          // 若不匹配约定页面作用域，则返回 404
          return res.status(404).json({
            error: 'PLUGIN_ROUTE_NOT_FOUND',
            pluginId,
            path: reqPath,
            method
          });
        } catch (err) {
          console.error('[ApiServer] Static hosting error:', err);
          return res.status(500).json({ error: 'PLUGIN_STATIC_HOSTING_ERROR' });
        }
      }

      // 调用已注册处理器；确保插件无法逃逸作用域
      try {
        candidate.handler(req, res, next);
      } catch (err) {
        console.error('[ApiServer] Plugin route handler error:', err);
        res.status(500).json({ error: 'PLUGIN_HANDLER_ERROR' });
      }
    });

    // GET /api/overlay/:overlayId - 获取 Overlay 数据
    this.app.get('/api/overlay/:overlayId', (req: express.Request, res: express.Response) => {
      const overlayId = req.params.overlayId;
      const room = req.query.room as string;
      const token = req.query.token as string;

      try {
        // 获取overlay配置
        const overlay = this.overlayManager.getOverlay(overlayId);

        if (!overlay) {
          return res.status(404).json({
            success: false,
            error: 'OVERLAY_NOT_FOUND',
            message: `Overlay with ID '${overlayId}' does not exist or has been removed.`,
            overlayId
          });
        }

        // 返回overlay数据
        res.json({
          success: true,
          data: {
            overlay,
            room,
            token,
            websocket_endpoint: `ws://127.0.0.1:${this.config.port}`
          }
        });

      } catch (error) {
        console.error('[ApiServer] Error getting overlay data:', error);
        res.status(500).json({
          success: false,
          error: 'OVERLAY_ERROR',
          message: 'An error occurred while retrieving overlay data.',
          details: (error as Error).message
        });
      }
    });

    // SSE: GET /sse/overlay/:overlayId - 订阅指定 Overlay 的事件（更新、消息、关闭）
    this.app.get('/sse/overlay/:overlayId', (req: express.Request, res: express.Response) => {
      const overlayId = req.params.overlayId;

      // 设置 SSE 头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      // 禁用反向代理的缓冲，确保事件及时送达
      res.setHeader('X-Accel-Buffering', 'no');
      // 立刻刷新响应头，避免压缩/缓冲阻塞 onopen
      try { (res as any).flushHeaders?.(); } catch {}
      // 发送一个注释包以确保连接迅速进入 OPEN
      try { res.write(`:\n\n`); } catch {}
      console.log('[ApiServer#SSE /sse/overlay] connect', { overlayId });

      const send = (event: string, data: any) => {
        try {
          res.write(`event: ${event}\n`);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          try { console.log('[ApiServer#SSE /sse/overlay] send', { overlayId, event }); } catch {}
        } catch (e) {
          console.warn('[ApiServer] SSE send failed:', e);
        }
      };

      // 初始状态
      const ov = this.overlayManager.getOverlay(overlayId);
      if (!ov) {
        send('closed', { overlayId });
        try { res.end(); } catch {}
        console.log('[ApiServer#SSE /sse/overlay] overlay not found -> closed', { overlayId });
        return;
      }
      console.log('[ApiServer#SSE /sse/overlay] init overlay', { overlayId, pluginId: ov.pluginId, visible: ov.visible });
      send('init', { overlay: ov });

      // 心跳：保持连接并提供可观测性（与插件 SSE 保持一致的 15s 心跳）
      const heartbeat = setInterval(() => {
        try {
          send('heartbeat', { ts: Date.now() });
        } catch {}
      }, SSE_HEARTBEAT_MS);

      // 事件监听
      const onUpdated = (updated: any) => {
        if (updated?.id === overlayId) {
          console.log('[ApiServer#SSE /sse/overlay] onUpdated', { overlayId });
          send('update', { overlay: updated });
        }
      };
      const onMessage = (msg: any) => {
        if (msg?.overlayId === overlayId) {
          console.log('[ApiServer#SSE /sse/overlay] onMessage', { overlayId, event: msg?.event });
          send('message', msg);
        }
      };
      const onClosed = (id: string) => {
        if (id === overlayId) {
          console.log('[ApiServer#SSE /sse/overlay] onClosed', { overlayId });
          send('closed', { overlayId });
          cleanup();
          try { res.end(); } catch {}
        }
      };
      const onAction = (act: any) => {
        if (act?.overlayId === overlayId) {
          // 统一转发为 SSE 'action' 事件，便于 UI 订阅注册状态
          console.log('[ApiServer#SSE /sse/overlay] onAction', { overlayId, action: act?.action });
          send('action', act);
        }
      };

      try {
        const ov = this.overlayManager.getOverlay(overlayId);
        const pluginId = ov?.pluginId || 'unknown';
        const channel = `plugin:${pluginId}:overlay`;
        try { (require('./SseQueueService') as any).SseQueueService.getInstance().markReady(channel); } catch {}
      } catch {}

      const cleanup = () => {
        try {
          this.overlayManager.off('overlay-updated', onUpdated as any);
          this.overlayManager.off('overlay-message', onMessage as any);
          this.overlayManager.off('overlay-closed', onClosed as any);
          this.overlayManager.off('overlay-action', onAction as any);
          clearInterval(heartbeat);
        } catch {}
      };

      this.overlayManager.on('overlay-updated', onUpdated as any);
      this.overlayManager.on('overlay-message', onMessage as any);
      this.overlayManager.on('overlay-closed', onClosed as any);
      this.overlayManager.on('overlay-action', onAction as any);

      // 连接关闭时清理
      req.on('close', () => {
        cleanup();
        try { res.end(); } catch {}
        console.log('[ApiServer#SSE /sse/overlay] disconnect', { overlayId });
      });
    });

    // GET /sse/plugins/:pluginId/overlay - 订阅插件的 overlay 消息中心（支持 Last-Event-ID + 心跳）
    this.app.get('/sse/plugins/:pluginId/overlay', (req: express.Request, res: express.Response) => {
      const pluginId = req.params.pluginId;
      const lastEventId = (req.headers['last-event-id'] as string) || (req.query.lastEventId as string) || undefined;
      const rawTypes = ((req.query.types as any) || (req.query.type as any) || (req.query.kinds as any) || (req.query.kind as any));
      const normalize = (v: any): string[] => {
        if (!v) return [];
        if (Array.isArray(v)) return v.map(x => String(x || '').trim()).filter(Boolean);
        return String(v || '').split(',').map(x => x.trim()).filter(Boolean);
      };
      const typesArr = normalize(rawTypes);
      const defaultKinds = ['message', 'update', 'closed', 'action', 'ui', 'lifecycle'];
      
      // 解析订阅规则：Map<kind, Set<roomId> | 'all'>
      const subscriptions = new Map<string, Set<string> | 'all'>();
      const inputs = typesArr.length > 0 ? typesArr : defaultKinds;
      const ROOM_REQUIRED_KINDS = new Set(['danmaku']); // 强制要求房间ID的类型

      for (const input of inputs) {
        // 支持 format: "kind:roomId" (e.g. "danmaku:123456")
        const parts = input.split(':');
        const kind = parts[0].toLowerCase();
        // 如果后面有参数，且不为空，则视为 roomId (暂取第一个参数作为 roomId)
        const roomId = parts.length > 1 && parts[1].trim() ? parts[1].trim() : undefined;

        // 检查是否强制要求 roomId
        if (ROOM_REQUIRED_KINDS.has(kind) && !roomId) {
           res.status(400);
           res.setHeader('Content-Type', 'application/json; charset=utf-8');
           return res.end(JSON.stringify({
             success: false,
             error: `Subscription kind '${kind}' requires a roomId (e.g. '${kind}:123456').`
           }));
        }

        if (!subscriptions.has(kind)) {
          subscriptions.set(kind, new Set());
        }
        const current = subscriptions.get(kind)!;

        // 如果已经是 'all' (全量订阅)，或者本次输入没有指定 roomId (表示该类型全量)，则设为 'all'
        if (current === 'all' || !roomId) {
          subscriptions.set(kind, 'all');
        } else {
          // 否则加入 roomId 白名单
          (current as Set<string>).add(roomId);
        }
      }

      // 禁用态：拒绝订阅 overlay SSE（避免禁用插件仍可接收事件）
      try {
        const plugin = this.pluginManager?.getPlugin(pluginId);
        const isEnabled = plugin && plugin.status === 'enabled' && plugin.enabled === true;
        if (!isEnabled) {
          res.status(403);
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return res.end(`PLUGIN_DISABLED: ${pluginId}`);
        }
      } catch {}

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      try { (res as any).flushHeaders?.(); } catch {}
      try { res.write(`:\n\n`); } catch {}
      console.log('[ApiServer#SSE /sse/plugins/:pluginId/overlay] connect', { pluginId, lastEventId, subscriptions: Array.from(subscriptions.entries()) });

      const channel = `plugin:${pluginId}:overlay`;
      try { (require('./SseQueueService') as any).SseQueueService.getInstance().markReady(channel); } catch {}
      const statusManager = PluginPageStatusManager.getInstance();
      const clientId = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

      const checkFilter = (kind: string, rec: any): boolean => {
        const filter = subscriptions.get(kind);
        if (!filter) return false; // 未订阅该类型

        if (filter === 'all') return true; // 全量订阅该类型

        // 按房间ID过滤
        // 尝试从常见 payload 结构中提取 roomId
        let eventRoomId: string | undefined;
        const payload = rec.payload; // 这是 DataManager 包装的 { event, payload: inner }

        // 1. normalized-event (danmaku) -> payload.payload.room_id
        if (payload?.payload?.room_id) {
          eventRoomId = String(payload.payload.room_id);
        }
        // 2. room events (room-status-change, etc) -> payload.payload.roomId
        else if (payload?.payload?.roomId) {
          eventRoomId = String(payload.payload.roomId);
        }
        
        // 如果无法提取房间ID，但在白名单模式下，默认视为不匹配（安全策略）
        // 或者也可以放行（宽松策略）。考虑到这是为了减少负载，严格匹配更好。
        if (eventRoomId && filter.has(eventRoomId)) {
          return true;
        }
        
        return false;
      };

      const sendRecord = (rec: any) => {
        try {
          if (rec && typeof rec.id === 'string') {
            res.write(`id: ${rec.id}\n`);
          }
          const kind = String((rec?.meta && rec.meta.kind) || 'message').toLowerCase();
          
          if (!checkFilter(kind, rec)) {
            return;
          }

          res.write(`event: ${kind}\n`);
          res.write(`data: ${JSON.stringify(rec)}\n\n`);
          try {
            var msg = (rec && rec.payload) || rec;
            // console.log('[ApiServer#SSE /sse/plugins/:pluginId/overlay] sendRecord', { pluginId, kind, overlayId: msg && msg.overlayId, event: msg && msg.event });
          } catch {}
        } catch (e) {
          console.warn('[ApiServer] SSE(plugin overlay) send failed:', e);
        }
      };

      // 初始状态：推送该插件相关的 overlay 快照（补齐缺失的样式配置）
      try {
        const overlaysSource = this.overlayManager.getAllOverlays().filter(o => o.pluginId === pluginId);
        let overlays = overlaysSource;
        try {
          const cfg = new ConfigManager();
          const conf = (cfg.get(`plugins.${pluginId}.config`, {}) || {}) as Record<string, any>;
          const desiredBg = typeof conf.uiBgColor === 'string' ? conf.uiBgColor : undefined;
          if (desiredBg) {
            overlays = overlaysSource.map(o => {
              const hasBg = !!(o?.style?.backgroundColor);
              if (hasBg) return o;
              return { ...o, style: { ...(o.style || {}), backgroundColor: desiredBg } };
            });
          }
        } catch {}
        res.write(`event: init\n`);
        res.write(`data: ${JSON.stringify({ overlays })}\n\n`);
        console.log('[ApiServer#SSE /sse/plugins/:pluginId/overlay] init overlays', { pluginId, count: overlays.length });
      } catch {}

      // 回放自 lastEventId 之后的记录
      try {
        let recent = this.dataManager.getRecent(channel, lastEventId).filter(r => {
          const kind = String(r?.meta?.kind ?? 'message').toLowerCase();
          return checkFilter(kind, r);
        });
        if (!lastEventId) {
          const picked: any[] = [];
          const seen = new Set<string>();
          for (let i = recent.length - 1; i >= 0; i--) {
            const kind = recent[i]?.meta?.kind ?? 'message';
            const k = String(kind).toLowerCase();
            if (!seen.has(k)) { seen.add(k); picked.push(recent[i]); }
          }
          recent = picked.reverse();
        }
        for (const rec of recent) sendRecord(rec);
      } catch {}

      // 订阅后续记录
      const unsubscribe = this.dataManager.subscribe(channel, sendRecord as any, undefined);

      // 标记连接
      try { statusManager.overlayClientConnected(pluginId, clientId); } catch {}

      // 心跳（防止中间代理断开，同时更新页面状态聚合器）
      const heartbeat = setInterval(() => {
        try {
          res.write(`event: heartbeat\n`);
          res.write(`data: {\"ts\": ${Date.now()}}\n\n`);
        } catch {}
        try { statusManager.overlayClientHeartbeat(pluginId, clientId); } catch {}
      }, SSE_HEARTBEAT_MS);

      const cleanup = () => {
        try { unsubscribe(); } catch {}
        try { clearInterval(heartbeat); } catch {}
        try { res.end(); } catch {}
        try { statusManager.overlayClientDisconnected(pluginId, clientId); } catch {}
        console.log('[ApiServer#SSE /sse/plugins/:pluginId/overlay] disconnect', { pluginId, clientId });
      };
      req.on('close', cleanup);
    });

    // POST /api/plugins/:pluginId/overlay/messages - 入队插件 overlay 消息（overlayId 缺省时按插件广播）
    this.app.post('/api/plugins/:pluginId/overlay/messages', async (req: express.Request, res: express.Response) => {
      const pluginId = req.params.pluginId;
      const { overlayId, event, payload, ttlMs, persist } = (req.body || {}) as { overlayId?: string; event?: string; payload?: any; ttlMs?: number; persist?: boolean };

      if (!event || typeof event !== 'string') {
        return res.status(400).json({ success: false, error: 'INVALID_EVENT' });
      }
      try {
        const channel = `plugin:${pluginId}:overlay`;
        const id = String(overlayId || '').trim();
        if (!id) {
          // 广播：枚举该插件的所有 overlay，并为每个 overlayId 发布一条消息
          const overlays = this.overlayManager.getAllOverlays().filter(ov => String(ov?.pluginId || '') === String(pluginId));
          const ids: string[] = [];
          const { SseQueueService } = require('./SseQueueService');
          const sq = SseQueueService.getInstance();
          for (const ov of overlays) {
            const recOrQueued = sq.queueOrPublish(channel, { overlayId: ov.id, event, payload }, { ttlMs, persist: persist !== false, meta: { kind: 'message' } });
            if (recOrQueued && recOrQueued.id) ids.push(recOrQueued.id);
          }
          return res.json({ success: true, count: ids.length, ids });
        } else {
          const { SseQueueService } = require('./SseQueueService');
          const sq = SseQueueService.getInstance();
          const record = sq.queueOrPublish(channel, { overlayId: id, event, payload }, { ttlMs, persist: persist !== false, meta: { kind: 'message' } });
          return res.json({ success: true, id: record && record.id });
        }
      } catch (error: any) {
        console.error('[ApiServer] enqueue plugin overlay message failed:', error);
        return res.status(500).json({ success: false, error: error?.message || 'ENQUEUE_FAILED' });
      }
    });

    // Bridge OverlayManager events into MessageCenter (per-plugin channel)
    const publishOverlayMessage = (msg: any) => {
      try {
        const ov = msg?.overlayId ? this.overlayManager.getOverlay(msg.overlayId) : undefined;
        const pluginId = ov?.pluginId || 'unknown';
        const channel = `plugin:${pluginId}:overlay`;
        try { if ((this.dataManager as any).hasSubscribers(channel)) { console.log('[ApiServer#publish] overlay-message', { pluginId, channel, overlayId: msg?.overlayId, event: msg?.event }); } } catch {}
      try { (require('./SseQueueService') as any).SseQueueService.getInstance().queueOrPublish(channel, msg, { ttlMs: 5 * 60 * 1000, persist: true, meta: { kind: 'message' } }); } catch {}
      } catch (e) {
        console.warn('[ApiServer] publish overlay-message failed:', e);
      }
    };
    const publishOverlayUpdated = (ov: any) => {
      try {
        if (!ov || !ov.id) return;
        const pluginId = ov?.pluginId || 'unknown';
        const channel = `plugin:${pluginId}:overlay`;
        try { if ((this.dataManager as any).hasSubscribers(channel)) { console.log('[ApiServer#publish] overlay-updated', { pluginId, channel, overlayId: ov?.id }); } } catch {}
      try { (require('./SseQueueService') as any).SseQueueService.getInstance().queueOrPublish(channel, { overlayId: ov.id, event: 'overlay-updated', payload: ov }, { ttlMs: 5 * 60 * 1000, persist: true, meta: { kind: 'update' } }); } catch {}
      } catch (e) {
        console.warn('[ApiServer] publish overlay-updated failed:', e);
      }
    };
    const publishOverlayClosed = (overlayId: string) => {
      try {
        const ov = this.overlayManager.getOverlay(overlayId);
        const pluginId = ov?.pluginId || 'unknown';
        const channel = `plugin:${pluginId}:overlay`;
        try { if ((this.dataManager as any).hasSubscribers(channel)) { console.log('[ApiServer#publish] overlay-closed', { pluginId, channel, overlayId }); } } catch {}
      try { (require('./SseQueueService') as any).SseQueueService.getInstance().queueOrPublish(channel, { overlayId, event: 'overlay-closed' }, { ttlMs: 60 * 1000, persist: true, meta: { kind: 'closed' } }); } catch {}
      } catch (e) {
        console.warn('[ApiServer] publish overlay-closed failed:', e);
      }
    };
    const publishOverlayAction = (act: any) => {
      try {
        const ov = act?.overlay;
        const pluginId = ov?.pluginId || 'unknown';
        const channel = `plugin:${pluginId}:overlay`;
        try { if ((this.dataManager as any).hasSubscribers(channel)) { console.log('[ApiServer#publish] overlay-action', { pluginId, channel, overlayId: act?.overlayId, action: act?.action }); } } catch {}
      try { (require('./SseQueueService') as any).SseQueueService.getInstance().queueOrPublish(channel, { overlayId: act?.overlayId, event: 'overlay-action', payload: { action: act?.action, data: act?.data } }, { ttlMs: 2 * 60 * 1000, persist: true, meta: { kind: 'action' } }); } catch {}
      } catch (e) {
        console.warn('[ApiServer] publish overlay-action failed:', e);
      }
    };

    // Register once per ApiServer instance
    this.overlayManager.on('overlay-message', publishOverlayMessage as any);
    this.overlayManager.on('overlay-updated', publishOverlayUpdated as any);
    this.overlayManager.on('overlay-closed', publishOverlayClosed as any);
    this.overlayManager.on('overlay-action', publishOverlayAction as any);

    // POST /api/overlay/:overlayId/action - 转发子页面的动作到 OverlayManager
    this.app.post('/api/overlay/:overlayId/action', async (req: express.Request, res: express.Response) => {
      const overlayId = req.params.overlayId;
      const { action, data } = (req.body || {}) as { action?: string; data?: any };

      if (!action || typeof action !== 'string') {
        return res.status(400).json({ success: false, error: 'INVALID_ACTION' });
      }
      try {
        const result = await this.overlayManager.handleOverlayAction(overlayId, action, data);
        return res.json(result);
      } catch (error: any) {
        console.error('[ApiServer] handle overlay action failed:', error);
        return res.status(500).json({ success: false, error: error?.message || 'ACTION_FAILED' });
      }
    });

    // POST /api/overlay/:overlayId/send - 向 Overlay 发送自定义消息（转发到事件总线）
    this.app.post('/api/overlay/:overlayId/send', async (req: express.Request, res: express.Response) => {
      const overlayId = req.params.overlayId;
      const { event, payload } = (req.body || {}) as { event?: string; payload?: any };

      if (!event || typeof event !== 'string') {
        return res.status(400).json({ success: false, error: 'INVALID_EVENT' });
      }
      try {
        const result = await this.overlayManager.sendMessage(overlayId, event, payload);
        return res.json(result);
      } catch (error: any) {
        console.error('[ApiServer] send overlay message failed:', error);
        return res.status(500).json({ success: false, error: error?.message || 'SEND_FAILED' });
      }
    });

    // POST /api/renderer/readonly-store - 渲染层只读仓库快照上报（统一源头）
    this.app.post('/api/renderer/readonly-store', async (req: express.Request, res: express.Response) => {
      try {
        const { type, payload } = (req.body || {}) as { type?: string; payload?: any };
        const evt = String(type || '').trim();
        if (!evt || (evt !== 'readonly-store-init' && evt !== 'readonly-store-update')) {
          return res.status(400).json({ success: false, error: 'INVALID_EVENT' });
        }
        const channel = 'renderer:readonly-store';
        const record = this.dataManager.publish(channel, { event: evt, payload }, { ttlMs: 10 * 60 * 1000, persist: true, meta: { kind: 'readonly-store' } });
        return res.json({ success: true, id: record.id });
      } catch (error: any) {
        console.error('[ApiServer] renderer readonly-store enqueue failed:', error);
        return res.status(500).json({ success: false, error: error?.message || 'ENQUEUE_FAILED' });
      }
    });

    this.app.get('/api/renderer/readonly-store/list', (req: express.Request, res: express.Response) => {
      try {
        const channel = 'renderer:readonly-store';
        const recent = this.dataManager.getRecent(channel) || [];
        const set = new Set<string>();
        for (const rec of recent) {
          const outer = (rec && (rec.payload ?? rec)) as any;
          const data = outer && (outer.payload ?? outer);
          if (!data || typeof data !== 'object' || Array.isArray(data)) continue;
          for (const key of Object.keys(data)) { set.add(key); }
        }
        return res.json({ success: true, keys: Array.from(set) });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error?.message || 'LIST_FAILED' });
      }
    });

    this.app.post('/api/renderer/readonly-store/snapshot', (req: express.Request, res: express.Response) => {
      try {
        const keys = ((req.body || {}) as any).keys as string[];
        if (!Array.isArray(keys) || keys.length === 0) {
          return res.status(400).json({ success: false, error: 'INVALID_KEYS' });
        }
        const isWildcard = keys.includes('*');
        const allow = new Set<string>(keys.map(k => String(k)));
        const channel = 'renderer:readonly-store';
        const recent = this.dataManager.getRecent(channel) || [];
        const snapshot: Record<string, any> = {};
        for (const rec of recent) {
          const outer = (rec && (rec.payload ?? rec)) as any;
          const data = outer && (outer.payload ?? outer);
          if (!data || typeof data !== 'object' || Array.isArray(data)) continue;
          for (const key of Object.keys(data)) {
            if (!isWildcard && !allow.has(key)) continue;
            // Wildcard blacklist: token, plugin
            if (isWildcard && (key === 'token' || key === 'plugin')) continue;
            
            const val = (data as any)[key];
            if (val === undefined) continue;
            snapshot[key] = val;
          }
        }
        try { if ('plugin' in snapshot) delete (snapshot as any).plugin; } catch {}
        return res.json({ success: true, data: snapshot });
      } catch (error: any) {
        return res.status(500).json({ success: false, error: error?.message || 'SNAPSHOT_FAILED' });
      }
    });

    this.app.get('/sse/renderer/readonly-store/subscribe', (req: express.Request, res: express.Response) => {
      // 标准 SSE 头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      try { (res as any).flushHeaders?.(); } catch {}
      try { res.write(':\n\n'); } catch {}
      console.log('[ApiServer#SSE /sse/renderer/readonly-store/subscribe] connect');
      const rawKeys = String((req.query.keys || '') as any).trim();
      if (!rawKeys) {
        try { res.write('event: error\n'); res.write('data: {"error":"INVALID_KEYS"}\n\n'); } catch {}
        try { res.end(); } catch {}
        return;
      }
      const keys = rawKeys.split(',').map(s => s.trim()).filter(Boolean);
      const isWildcard = keys.includes('*');
      const allow = new Set<string>(keys);
      const channel = 'renderer:readonly-store';
          const sendRecord = (rec: any) => {
            try {
              if (rec && typeof rec.id === 'string') {
                res.write(`id: ${rec.id}\n`);
              }
              const kind = (rec?.meta && rec.meta.kind) || 'readonly-store';
              const payload = (rec && rec.payload) || rec;
              // 事件名沿用 payload.event（init/update），便于前端区分
              const evt = String(payload && payload.event || 'readonly-store-update');
              // 过滤顶层 plugin 字段
              const dataObj = (payload && payload.payload) ? { ...(payload.payload || {}) } : {};
              try { if (dataObj && typeof dataObj === 'object' && 'plugin' in dataObj) delete (dataObj as any).plugin; } catch {}
          const filtered: Record<string, any> = {};
          for (const k of Object.keys(dataObj)) { 
            if (!isWildcard && !allow.has(k)) continue;
            if (isWildcard && (k === 'token' || k === 'plugin')) continue;
            filtered[k] = (dataObj as any)[k]; 
          }
          if (Object.keys(filtered).length === 0) { return; }
          res.write(`event: ${evt}\n`);
          res.write(`data: ${JSON.stringify(filtered)}\n\n`);
            } catch (e) {
              console.warn('[ApiServer] SSE(renderer store) send failed:', e);
            }
          };

      // 初始快照：汇总最近记录的各切片，构造完整 init 快照
      try {
        const recent = this.dataManager.getRecent(channel) || [];
        const snapshot: Record<string, any> = {};
        for (const rec of recent) {
          const outer = (rec && (rec.payload ?? rec)) as any;
          const data = outer && (outer.payload ?? outer);
          if (!data || typeof data !== 'object' || Array.isArray(data)) continue;
          for (const key of Object.keys(data)) {
            const val = (data as any)[key];
            if (val === undefined) continue;
            
            if (!isWildcard && !allow.has(key)) continue;
            if (isWildcard && (key === 'token' || key === 'plugin')) continue;

            snapshot[key] = val;
          }
        }
        if ('plugin' in snapshot) delete (snapshot as any).plugin;
        if (Object.keys(snapshot).length > 0) {
          res.write('event: readonly-store-init\n');
          res.write(`data: ${JSON.stringify(snapshot)}\n\n`);
        }
      } catch {}

      // 订阅后续更新
      const unsubscribe = this.dataManager.subscribe(channel, sendRecord as any, undefined);

      // 心跳保持
      const heartbeat = setInterval(() => {
        try {
          res.write('event: heartbeat\n');
          res.write(`data: {"ts": ${Date.now()}}\n\n`);
        } catch {}
      }, SSE_HEARTBEAT_MS);

      const cleanup = () => {
        try { unsubscribe(); } catch {}
        try { clearInterval(heartbeat); } catch {}
        try { res.end(); } catch {}
        console.log('[ApiServer#SSE /sse/renderer/readonly-store/subscribe] disconnect');
      };
      req.on('close', cleanup);
    });

    try {
      const onReadonlyUpdate = (rec: any) => {
        try {
          const payload = rec?.payload?.payload;
          const evt = rec?.payload?.event;
          const ui = payload?.ui;
          if (evt === 'readonly-store-update' && ui && (ui.routePath || ui.pageName || ui.pageTitle)) {
            const plugins = this.pluginManager?.getInstalledPlugins().filter(p => p.enabled) || [];
            for (const p of plugins) {
              const channel = `plugin:${p.id}:overlay`;
              this.dataManager.publish(channel, { event: 'route-changed', payload: { routePath: ui.routePath, pageName: ui.pageName, pageTitle: ui.pageTitle } }, { ttlMs: 10000, persist: false, meta: { kind: 'ui' } });
            }
          }
        } catch {}
      };
      this.dataManager.subscribe('renderer:readonly-store', onReadonlyUpdate as any, undefined);
    } catch {}

    // POST /api/overlay/create - 创建一个 Overlay（替代渲染层 preload 创建）
    this.app.post('/api/overlay/create', async (req: express.Request, res: express.Response) => {
      try {
        const options = (req.body || {}) as any;

        // 在创建前尝试读取插件最新配置以合并样式（例如背景色）
        let mergedOptions = options;
        try {
          const pluginId = String(options?.pluginId || '').trim();
          if (pluginId) {
            const cfg = new ConfigManager();
            const conf = (cfg.get(`plugins.${pluginId}.config`, {}) || {}) as Record<string, any>;
            const desiredBg = typeof conf.uiBgColor === 'string' ? conf.uiBgColor : undefined;
            if (desiredBg) {
              mergedOptions = {
                ...options,
                style: { ...(options?.style || {}), backgroundColor: desiredBg }
              };
            }
          }
        } catch {}

        const result = await this.overlayManager.createOverlay(mergedOptions);

        // 单实例策略下，如返回已存在的 overlayId，确保样式仍与最新配置对齐
        try {
          const overlayId = result?.overlayId;
          if (result?.success && overlayId) {
            const ov = this.overlayManager.getOverlay(overlayId);
            const pluginId = String(mergedOptions?.pluginId || ov?.pluginId || '').trim();
            if (pluginId) {
              const cfg = new ConfigManager();
              const conf = (cfg.get(`plugins.${pluginId}.config`, {}) || {}) as Record<string, any>;
              const desiredBg = typeof conf.uiBgColor === 'string' ? conf.uiBgColor : undefined;
              const hasBg = !!(ov?.style?.backgroundColor);
              if (ov && desiredBg && !hasBg) {
                await this.overlayManager.updateOverlay(overlayId, {
                  style: { ...(ov.style || {}), backgroundColor: desiredBg }
                });
              }
            }
          }
        } catch {}

        return res.json(result);
      } catch (error: any) {
        console.error('[ApiServer] create overlay failed:', error);
        return res.status(500).json({ success: false, error: error?.message || 'CREATE_FAILED' });
      }
    });

    // GET /overlay-wrapper - 外部浏览器包装页，统一容器并桥接事件
    this.app.get('/overlay-wrapper', (req: express.Request, res: express.Response) => {
      try {
        const pluginId = String(req.query.plugin || '').trim();
        const type = String(req.query.type || 'overlay');
        const overlayId = String(req.query.overlayId || '').trim();
        const route = req.query.route ? String(req.query.route) : undefined;
        const html = req.query.html ? String(req.query.html) : undefined;

        if (!pluginId) {
          return this.sendErrorHtml(res, 400, 'Bad Request', 'Missing query parameter: plugin');
        }
        // overlayId 可选：支持插件级包装（不强制 overlayId）

        const plugin = this.pluginManager?.getPlugin(pluginId);
        if (!plugin) {
          return this.sendErrorHtml(res, 404, 'Not Found', `Plugin '${this.escapeHtml(pluginId)}' not found.`);
        }
        // 禁用态：拒绝包装页访问（避免通过外部浏览器绕过前端按钮限制）
        try {
          const isEnabled = plugin.status === 'enabled' && plugin.enabled === true;
          if (!isEnabled) {
            return this.sendErrorHtml(res, 403, 'Forbidden', `Plugin '${this.escapeHtml(plugin.id)}' is disabled.`);
          }
        } catch {}

        // 依据 manifest.overlay 的静态托管声明构造页面 URL
        const conf = plugin.manifest?.[type as 'overlay' | 'ui' | 'window'] || {} as any;
        const isSpa = Boolean(conf?.spa);
        const pageRoute = route || conf?.route || '';
        const pageHtml = html || conf?.html || `${type}.html`;
        const base = `http://${this.config.host}:${this.config.port}`;

        let pluginPagePath = '';
        if (isSpa) {
          // SPA：/plugins/:id/<type>，可选 route 参数
          pluginPagePath = `/plugins/${pluginId}/${type}` + (pageRoute ? `?route=${encodeURIComponent(pageRoute)}` : '');
        } else {
          // 非 SPA：/plugins/:id/<html>
          pluginPagePath = `/plugins/${pluginId}/${pageHtml}`;
        }
        // 仅携带时间戳避免缓存，不在子页 URL 中显式暴露 overlayId（由包装页通过 props 注入）
        const delimiter = pluginPagePath.includes('?') ? '&' : '?';
        const pluginUrl = `${base}${pluginPagePath}${delimiter}t=${Date.now()}`;

        const htmlDoc = this.renderTemplate('overlay-wrapper', {
          TITLE: this.escapeHtml(plugin.name || plugin.id),
          PLUGIN_ID_JSON: JSON.stringify(pluginId),
          OVERLAY_ID_JSON: JSON.stringify(overlayId),
          PLUGIN_URL_JSON: JSON.stringify(pluginUrl)
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.send(htmlDoc);
      } catch (err) {
        console.error('[ApiServer] overlay-wrapper route error:', err);
        return this.sendErrorHtml(res, 500, 'Internal Server Error', 'Unexpected error in overlay wrapper.');
      }
    });

    // 404 handler（Express v5 推荐不传路径）
    this.app.use((req: express.Request, res: express.Response) => {
      res.status(404).json({
        error: 'Not Found',
        path: req.originalUrl
      });
    });
  }

  public setRoomManager(roomManager: import('../rooms/RoomManager').RoomManager): void {
    try { this.acfunApiProxy.setRoomManager(roomManager); } catch {}
  }

  /**
   * 配置错误处理
   */
  private configureErrorHandling(): void {
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('[ApiServer] Error:', err);

      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  }

  /**
   * 获取 WebSocket Hub 实例
   */
  public getWsHub(): WsHub {
    return this.wsHub;
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
    def: { method: 'GET' | 'POST'; path: string },
    handler: express.RequestHandler
  ): void {
    if (!/^[a-zA-Z0-9_]+$/.test(pluginId)) {
      throw new Error('INVALID_PLUGIN_ID');
    }
    if (!/^[\/a-zA-Z0-9_\-]*$/.test(def.path)) {
      throw new Error('INVALID_ROUTE_PATH');
    }
    const list = this.pluginRoutes.get(pluginId) || [];
    list.push({ method: def.method, path: def.path || '/', handler });
    this.pluginRoutes.set(pluginId, list);
    console.log(`[ApiServer] Registered plugin route: [${def.method}] /plugins/${pluginId}${def.path}`);
  }

  /**
   * 启动服务器
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = createServer(this.app);
        console.log(`[ApiServer] HTTP server created, starting listen on ${this.config.host}:${this.config.port}`);

        try {
          this.server.on('connection', (socket) => {
            try {
              this.connections.add(socket);
              socket.on('close', () => { try { this.connections.delete(socket); } catch {} });
            } catch {}
          });
        } catch {}

        this.server.listen(this.config.port, this.config.host, () => {
          console.log(`[ApiServer] HTTP server running at http://${this.config.host}:${this.config.port}`);
          try {
            // 初始化 WebSocket 服务器在 HTTP 监听成功后，避免底层 zlib/网络栈异常
            this.wsHub.initialize(this.server!);
            console.log(`[ApiServer] WebSocket server started`);
          } catch (err) {
            console.error('[ApiServer] WebSocket initialization failed:', err);
          }
          this.lastStartError = undefined;
          resolve();
        });

        this.server.on('error', (error) => {
          console.error('[ApiServer] Server error:', error);
          try { this.lastStartError = String((error as any)?.message || error); } catch {}
          reject(error);
        });

      } catch (error) {
        console.error('[ApiServer] Start failed:', error);
        try { this.lastStartError = String((error as any)?.message || error); } catch {}
        reject(error);
      }
    });
  }

  /**
   * 停止服务器
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      console.log('[ApiServer] Shutting down server...');

      // 关闭 WebSocket Hub
      this.wsHub.close();

      if (this.server) {
        try {
          for (const s of Array.from(this.connections)) {
            try { s.destroy(); } catch {}
          }
          this.connections.clear();
        } catch {}

        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          try { console.warn('[ApiServer] Server close timed out; proceeding'); } catch {}
          try { this.server = null; } catch {}
          resolve();
        }, 3000);

        this.server.close(() => {
          if (settled) return;
          settled = true;
          try { clearTimeout(timer); } catch {}
          console.log('[ApiServer] Server closed');
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }


  /**
   * Ensure plugin_storage table exists
   */
  private async ensurePluginStorageTable(): Promise<void> {
    const db = this.databaseManager.getDb();
    return new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS plugin_storage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plugin_id TEXT NOT NULL,
          createTime INTEGER NOT NULL,
          data TEXT NOT NULL
        )
      `, (err) => {
        if (err) return reject(err);
        // Add index on plugin_id and createTime for faster queries
        db.run(`CREATE INDEX IF NOT EXISTS idx_plugin_storage_pid_time ON plugin_storage (plugin_id, createTime DESC)`, (err2) => {
           if (err2) console.warn('[ApiServer] Failed to create index for plugin_storage:', err2);
           resolve();
        });
      });
    });
  }

  /**
   * HTML转义
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * 解析模板文件路径，兼容 src 与编译输出位置
   */
  private resolveTemplatePath(name: string): string | null {
    const filename = `${name}.html`;
    const candidates = [
      path.resolve(__dirname, 'templates', filename),
      // 若运行在 dist/server 下，尝试回溯到 src 目录
      path.resolve(__dirname, '../../src/server/templates', filename),
      // 直接使用工作区绝对路径（开发环境）
      path.resolve(process.cwd(), 'packages', 'main', 'src', 'server', 'templates', filename)
    ];
    for (const p of candidates) {
      try { if (fs.existsSync(p)) return p; } catch {}
    }
    return null;
  }

  /**
   * 读取模板文件（带内存缓存与兜底内容）
   */
  private loadTemplate(name: string): string {
    const cached = this.templatesCache[name];
    if (cached) return cached;
    const abs = this.resolveTemplatePath(name);
    if (abs) {
      try {
        const content = fs.readFileSync(abs, 'utf-8');
        this.templatesCache[name] = content;
        return content;
      } catch {}
    }
    // 未找到模板文件时抛出错误，禁止使用内联回退模板
    throw new Error(`Template '${name}' not found`);
  }

  /**
   * 渲染模板：用 {{KEY}} 进行占位与替换
   */
  private renderTemplate(name: string, placeholders: Record<string, string>): string {
    let tpl = this.loadTemplate(name);
    for (const key of Object.keys(placeholders)) {
      const val = String(placeholders[key] ?? '');
      const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      tpl = tpl.replace(re, val);
    }
    return tpl;
  }

  /**
   * 统一发送错误 HTML（使用 error 模板）
   */
  private sendErrorHtml(res: express.Response, status: number, title: string, message: string): express.Response {
    try {
      const html = this.renderTemplate('error', {
        STATUS_CODE: String(status),
        TITLE: this.escapeHtml(title),
        MESSAGE: this.escapeHtml(message)
      });
      try {
        res.status(status);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } catch {}
      return res.send(html);
    } catch (e) {
      // 当错误模板缺失时，退回纯文本响应以避免服务崩溃（非 HTML）
      try { res.status(status); } catch {}
      return res.type('text/plain').send(`${status} ${title}\n${message}`);
    }
  }


  /**
   * 获取服务器状态
   */
  public isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }
}
