import { ipcMain, app, dialog, shell, BrowserWindow } from 'electron';
import { acfunDanmuModule } from '../adapter/AcfunDanmuModule';
import { RoomManager } from '../rooms/RoomManager';
import { TokenManager } from '../server/TokenManager';
import { PluginManager } from '../plugins/PluginManager';
import { OverlayManager } from '../plugins/OverlayManager';
import { PluginWindowManager } from '../plugins/PluginWindowManager';
import { ConsoleManager } from '../console/ConsoleManager';
import { WindowManager } from '../bootstrap/WindowManager';
import { ConfigManager } from '../config/ConfigManager'; // Import ConfigManager
import { LogManager } from '../logging/LogManager';
import { DiagnosticsService } from '../logging/DiagnosticsService';
import * as fs from 'fs';
import path from 'path';
import { pluginLifecycleManager } from '../plugins/PluginLifecycle';
import { DataManager } from '../persistence/DataManager';
import PluginPageStatusManager from '../persistence/PluginPageStatusManager';

/**
 * Initializes all IPC handlers for the main process.
 * This is where the renderer process can communicate with the main process.
 */
export function initializeIpcHandlers(
  roomManager: RoomManager,
  tokenManager: TokenManager,
  pluginManager: PluginManager,
  overlayManager: OverlayManager,
  consoleManager: ConsoleManager,
  windowManager: WindowManager,
  pluginWindowManager: PluginWindowManager,
  configManager: ConfigManager, // Add ConfigManager to parameters
  logManager: LogManager,
  diagnosticsService: DiagnosticsService,
  databaseManager: import('../persistence/DatabaseManager').DatabaseManager
) {
  console.log('[IPC] Initializing IPC handlers...');
  const dataManager = DataManager.getInstance();
  const pageStatusManager = PluginPageStatusManager.getInstance();
  const monitoringSubscriptions = new Map<number, Map<string, () => void>>();

  ipcMain.handle('add-room', (event, roomId: string) => {
    console.log(`[IPC] Received request to add room: ${roomId}`);
    roomManager.addRoom(roomId);
  });

  // Example IPC handler
  ipcMain.handle('get-app-version', (event) => {
    return app.getVersion();
  });

  // Login: QR start -> returns base64 data URL
  ipcMain.handle('login.qrStart', async () => {
    try {
      const result = await tokenManager.loginWithQRCode();
      
      if (result.success && result.qrCode) {
        // 返回前端期望的格式（包含过期信息）
        const expiresIn = result.qrCode.expiresIn;
        const expireAt = typeof expiresIn === 'number' ? Date.now() + expiresIn * 1000 : undefined;
        const sessionId = (result.qrCode as any).sessionId;
        return { qrCodeDataUrl: result.qrCode.qrCodeDataUrl, expiresIn, expireAt, sessionId };
      } else {
        return { error: result.error || '获取二维码失败' };
      }
    } catch (err: any) {
      return { error: err?.message || String(err) };
    }
  });

  // Login: poll status
  ipcMain.handle('login.qrCheck', async () => {
    try {
      const result = await tokenManager.checkQRLoginStatus();
      // 不向渲染层暴露敏感令牌，仅返回最小信息
      if (result.success && result.tokenInfo) {
        return { success: true, tokenInfo: { userID: result.tokenInfo.userID } };
      }
      return { success: false, error: result.error || 'unknown_error' };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // Login: finalize
  ipcMain.handle('login.qrFinalize', async () => {
    try {
      const result = await tokenManager.finalizeQrLogin();
      // 不向渲染层暴露敏感令牌，仅返回最小信息
      if (result.success && result.tokenInfo) {
        return { success: true, tokenInfo: { userID: result.tokenInfo.userID } };
      }
      return { success: false, error: result.error || 'not_authenticated' };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // Login: cancel current QR session
  ipcMain.handle('login.qrCancel', async () => {
    try {
      return tokenManager.cancelQrLogin();
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // Logout: clear secrets
  ipcMain.handle('login.logout', async () => {
    await tokenManager.logout();
    return { ok: true };}
  );

  ipcMain.handle('system.getSystemLog', async (event, count) => {
    return logManager.getRecentLogs(count);
  });

  ipcMain.handle('system.genDiagnosticZip', async () => {
    return diagnosticsService.generateDiagnosticPackage();
  });

  // System: 打开文件所在文件夹
  ipcMain.handle('system.showItemInFolder', async (_event, targetPath: string) => {
    try {
      if (!targetPath || typeof targetPath !== 'string') {
        throw new Error('Invalid path');
      }
      shell.showItemInFolder(targetPath);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || String(error) };
    }
  });

  // System: 使用外部浏览器打开链接
  ipcMain.handle('system.openExternal', async (_event, targetUrl: string) => {
    try {
      if (!targetUrl || typeof targetUrl !== 'string') {
        throw new Error('Invalid url');
      }
      await shell.openExternal(targetUrl);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || String(error) };
    }
  });

  ipcMain.handle('system.publishLog', async (_event, payload: { source?: string; message?: string; level?: 'info' | 'error' | 'warn' | 'debug'; correlationId?: string }) => {
    try {
      const src = String(payload?.source || 'renderer');
      const msg = String(payload?.message || '');
      const lvl = (payload?.level || 'info') as any;
      logManager.addLog(src, msg, lvl, payload?.correlationId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // --- Monitoring: Plugin Page Status ---
  ipcMain.handle('monitoring.pageStatus.query', async (event, pluginId?: string) => {
    try {
      return { success: true, data: pageStatusManager.querySnapshot(pluginId) };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('monitoring.pageStatus.listen', async (event, pluginIdRaw: string) => {
    try {
      const pluginId = String(pluginIdRaw || '').trim();
      if (!pluginId) {
        return { success: false, error: 'invalid_plugin_id' };
      }
      const wcId = event.sender.id;
      let byPlugin = monitoringSubscriptions.get(wcId);
      if (!byPlugin) { byPlugin = new Map(); monitoringSubscriptions.set(wcId, byPlugin); }
      const existing = byPlugin.get(pluginId);
      if (existing) { try { existing(); } catch {} byPlugin.delete(pluginId); }

      const channel = `plugin:${pluginId}:page-status`;
      const unsub = dataManager.subscribe(channel, (rec: any) => {
        try { event.sender.send('monitoring.pageStatus.updated', { pluginId, record: rec }); } catch {}
      }, undefined);
      byPlugin.set(pluginId, unsub);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('monitoring.pageStatus.unlisten', async (event, pluginIdRaw: string) => {
    try {
      const pluginId = String(pluginIdRaw || '').trim();
      if (!pluginId) {
        return { success: false, error: 'invalid_plugin_id' };
      }
      const wcId = event.sender.id;
      const byPlugin = monitoringSubscriptions.get(wcId);
      const unsub = byPlugin?.get(pluginId);
      if (unsub) { try { unsub(); } catch {} byPlugin?.delete(pluginId); }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // Account: get current user info via main process, requires valid token
  ipcMain.handle('account.getUserInfo', async () => {
    try {
      const info = await tokenManager.getTokenInfo();
      const validation = await tokenManager.validateToken(info || undefined);
      if (!validation.isValid) {
        return { success: false, error: validation.reason || 'not_authenticated' };
      }

      const userId = String(info?.userID || '').trim();
      if (!userId) {
        return { success: false, error: 'no_user_id' };
      }

      const api = tokenManager.getApiInstance();
      const result = await api.user.getUserInfo(userId);
      if (result?.success && result?.data) {
        const data = result.data as any;
        // 参照 acfunlive-http-api 的 UserInfoResponse，返回完整字段集
        const userIdOut: string = String(data?.userId ?? userId);
        const userNameRaw = typeof data?.userName === 'string' && data.userName.trim().length > 0
          ? data.userName.trim()
          : `用户${userIdOut}`;
        // 清洗 URL 字段
        const cleanUrl = (u: any) => {
          if (!u || typeof u !== 'string') return '';
          const s = String(u).trim().replace(/[`'\"]/g, '');
          return /^https?:\/\//i.test(s) ? s : '';
        };
        const avatar = cleanUrl(data?.avatar);
        const avatarFrame = cleanUrl(data?.avatarFrame);

        const fullData = {
          userId: userIdOut,
          userName: userNameRaw,
          avatar,
          level: Number(data?.level ?? 0),
          fansCount: Number(data?.fansCount ?? 0),
          followCount: Number(data?.followCount ?? 0),
          signature: typeof data?.signature === 'string' ? data.signature : undefined,
          isLive: Boolean(data?.isLive),
          liveRoomId: typeof data?.liveRoomId !== 'undefined' ? String(data?.liveRoomId) : undefined,
          avatarFrame: avatarFrame || undefined,
          contributeCount: typeof data?.contributeCount === 'number' ? data.contributeCount : undefined,
          verifiedText: typeof data?.verifiedText === 'string' ? data.verifiedText : undefined,
          isJoinUpCollege: Boolean(data?.isJoinUpCollege),
          isFollowing: typeof data?.isFollowing === 'boolean' ? data.isFollowing : undefined,
          isFollowed: typeof data?.isFollowed === 'boolean' ? data.isFollowed : undefined,
          likeCount: typeof data?.likeCount === 'number' ? data.likeCount : undefined,
        };
        return { success: true, data: fullData };
      }
      return { success: false, error: result?.error || 'fetch_failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // --- Room Management ---
  ipcMain.handle('room.connect', async (_event, roomIdRaw: string) => {
    try {
      const roomId = String(roomIdRaw || '').trim();
      if (!roomId) {
        return { success: false, code: 'invalid_room_id', error: '房间ID无效' };
      }

      // 最大房间数量检查（RoomManager 当前最大为 3）
      if (roomManager.getRoomCount() >= 3) {
        return { success: false, code: 'max_rooms_reached', error: '已达到最大房间数' };
      }

      // 重复连接检查
      if (roomManager.getRoomInfo(roomId)) {
        return { success: false, code: 'already_connected', error: '房间已连接' };
      }

      const success = await roomManager.addRoom(roomId);
      return success
        ? { success: true }
        : { success: false, code: 'connect_failed', error: '连接失败' };
    } catch (err: any) {
      return { success: false, code: 'exception', error: err?.message || String(err) };
    }
  });

  ipcMain.handle('room.disconnect', async (_event, roomIdRaw: string) => {
    try {
      const roomId = String(roomIdRaw || '').trim();
      if (!roomId) {
        return { success: false, code: 'invalid_room_id', error: '房间ID无效' };
      }
      if (!roomManager.getRoomInfo(roomId)) {
        return { success: false, code: 'not_found', error: '房间未连接' };
      }
      const success = await roomManager.removeRoom(roomId);
      return success
        ? { success: true }
        : { success: false, code: 'disconnect_failed', error: '断开失败' };
    } catch (err: any) {
      return { success: false, code: 'exception', error: err?.message || String(err) };
    }
  });

  ipcMain.handle('room.list', async () => {
    try {
      const rooms = roomManager.getAllRooms().map(r => ({
        roomId: r.roomId,
        status: r.status,
        eventCount: r.eventCount,
        connectedAt: r.connectedAt ?? null,
        lastEventAt: r.lastEventAt ?? null,
        reconnectAttempts: r.reconnectAttempts
      }));
      return { rooms };
    } catch (err: any) {
      return { error: err?.message || String(err) };
    }
  });

  ipcMain.handle('room.status', async (_event, roomId: string) => {
    try {
      const info = roomManager.getRoomInfo(String(roomId));
      return info
        ? {
            roomId: info.roomId,
            status: info.status,
            eventCount: info.eventCount,
            connectedAt: info.connectedAt ?? null,
            lastEventAt: info.lastEventAt ?? null,
            reconnectAttempts: info.reconnectAttempts
          }
        : { error: 'not_found', code: 'not_found' };
    } catch (err: any) {
      return { error: err?.message || String(err) };
    }
  });

  // 获取房间详情（标题、主播、封面、观众数、点赞数等）
  ipcMain.handle('room.details', async (_event, roomIdRaw: string) => {
    try {
      const roomId = String(roomIdRaw || '').trim();
      if (!roomId) {
        return { success: false, code: 'invalid_room_id', error: '房间ID无效' };
      }

      // 聚合多来源，容错
      let data: any = {};
      let profile: any = {};
      let isLive = false;
      let liveId: string | undefined = undefined;
      let viewerCount = 0;
      let likeCount = 0;
      let ownerUserName: string | undefined;
      let titleFromRoomInfo: string | undefined;
      let streamerAvatar: string | undefined;

      try {
        const userInfoRes = await acfunDanmuModule.getUserLiveInfo(Number(roomId));
        if (userInfoRes && userInfoRes.success === true) {
          data = userInfoRes.data || {};
          profile = data.profile || {};
          isLive = Boolean(data.liveID);
          liveId = data.liveID ? String(data.liveID) : undefined;
          viewerCount = typeof data.onlineCount === 'number' ? data.onlineCount : viewerCount;
        }
      } catch {}

      if (liveId) {
        try {
          const summaryRes = await acfunDanmuModule.getSummary(liveId);
          if (summaryRes && summaryRes.success === true) {
            const s = summaryRes.data || {};
            if (typeof s.viewerCount === 'number') viewerCount = s.viewerCount;
            if (typeof s.likeCount === 'number') likeCount = s.likeCount;
          }
        } catch {}
      }

      // 进一步尝试通过弹幕房间信息获取更准确的主播名称与基础信息
      try {
        const api = await acfunDanmuModule.getApiInstance();
        const roomInfoRes = await (api as any).danmu?.getLiveRoomInfo?.(roomId);
        if (roomInfoRes && roomInfoRes.success === true) {
          const ri = roomInfoRes.data || {};
          if (typeof ri?.owner?.username === 'string' && ri.owner.username.trim().length > 0) {
            ownerUserName = ri.owner.username;
          }
          if (typeof ri.viewerCount === 'number') viewerCount = ri.viewerCount;
          if (typeof ri.likeCount === 'number') likeCount = ri.likeCount;
          if (typeof ri.title === 'string' && ri.title.trim().length > 0) {
            titleFromRoomInfo = ri.title;
          }
          if (typeof ri.owner?.avatar === 'string' && ri.owner.avatar.trim().length > 0) {
            streamerAvatar = ri.owner.avatar;
          }
          if (!liveId && typeof ri.liveID === 'string' && ri.liveID.trim().length > 0) {
            liveId = ri.liveID;
            isLive = true;
          }
        }
      } catch {}

      // 进一步通过用户信息获取更准确的主播名称与头像
      try {
        const api = await acfunDanmuModule.getApiInstance();
        const userInfo = await (api as any).user?.getUserInfo?.(String(roomId));
        if (userInfo && userInfo.success === true) {
          const ud = userInfo.data || {};
          const nameCandidate = typeof ud.userName === 'string' ? ud.userName.trim() : '';
          const avatarCandidate = typeof ud.avatar === 'string' ? ud.avatar.trim() : '';
          if (nameCandidate.length > 0) ownerUserName = nameCandidate;
          if (avatarCandidate.length > 0) streamerAvatar = avatarCandidate;
          if (!profile || Object.keys(profile).length === 0) profile = ud;
        }
      } catch {}

      const clean = (u: any) => {
        if (!u || typeof u !== 'string') return '';
        const s = String(u).trim().replace(/[`'\"]/g, '');
        return /^https?:\/\//i.test(s) ? s : '';
      };
      const coverUrlFinal = (() => {
        const fromLive = clean((data as any).liveCover);
        if (fromLive) return fromLive;
        const fromData = clean((data as any).coverUrl);
        if (fromData) return fromData;
        const fromAvatar = clean(streamerAvatar || profile.avatar);
        return fromAvatar || '';
      })();
      const statusFinal = isLive ? 'open' : 'closed';
      const streamerNameFinal = ownerUserName || (typeof profile.nickname === 'string' ? profile.nickname : (typeof profile.userName === 'string' ? profile.userName : `主播${roomId}`));
      const streamerUidFinal = profile.userID ? String(profile.userID) : roomId;
      const categoryId = (data as any)?.categoryID ?? (data as any)?.categoryId ?? null;
      const categoryName = (data as any)?.categoryName ?? null;
      const subCategoryId = (data as any)?.subCategoryID ?? (data as any)?.subCategoryId ?? null;
      const subCategoryName = (data as any)?.subCategoryName ?? null;
      try {
        const db = databaseManager.getDb();
        const stmt = db.prepare(`
          INSERT INTO rooms_meta (
            room_id, streamer_name, streamer_user_id,
            title, cover_url, status, is_live,
            viewer_count, online_count, like_count, live_cover,
            category_id, category_name, sub_category_id, sub_category_name,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        stmt.run(
          roomId,
          streamerNameFinal || null,
          streamerUidFinal || null,
          typeof data.title === 'string' ? data.title : (titleFromRoomInfo || `直播间 ${roomId}`),
          coverUrlFinal,
          statusFinal,
          isLive ? 1 : 0,
          typeof viewerCount === 'number' ? viewerCount : 0,
          typeof viewerCount === 'number' ? viewerCount : 0,
          typeof likeCount === 'number' ? likeCount : 0,
          (data as any)?.liveCover || null,
          categoryId != null ? String(categoryId) : '',
          categoryName != null ? String(categoryName) : '',
          subCategoryId != null ? String(subCategoryId) : '',
          subCategoryName != null ? String(subCategoryName) : '',
          () => { try { stmt.finalize(); } catch {} }
        );
      } catch {}
      return {
        success: true,
        data: {
          roomId,
          liveId,
          title: typeof data.title === 'string' ? data.title : (titleFromRoomInfo || `直播间 ${roomId}`),
          isLive,
          status: statusFinal,
          startTime: data.liveStartTime ? Number(new Date(data.liveStartTime)) : undefined,
          viewerCount,
          likeCount,
          coverUrl: coverUrlFinal,
          streamer: {
            userId: streamerUidFinal,
            userName: streamerNameFinal,
            avatar: streamerAvatar || (typeof profile.avatar === 'string' ? profile.avatar : ''),
            level: typeof profile.level === 'number' ? profile.level : 0
          }
        }
      };
    } catch (err: any) {
      return { success: false, code: 'exception', error: err?.message || String(err) };
    }
  });

  // 设置房间优先级
  ipcMain.handle('room.setPriority', async (_event, roomIdRaw: string, priorityRaw: number) => {
    try {
      const roomId = String(roomIdRaw || '').trim();
      const priority = Number(priorityRaw);
      if (!roomId) return { success: false, code: 'invalid_room_id', error: '房间ID无效' };
      if (!Number.isFinite(priority)) return { success: false, code: 'invalid_priority', error: '优先级无效' };
      const ok = roomManager.setRoomPriority(roomId, priority);
      return ok ? { success: true } : { success: false, code: 'not_found', error: '房间未连接' };
    } catch (err: any) {
      return { success: false, code: 'exception', error: err?.message || String(err) };
    }
  });

  // 设置房间标签
  ipcMain.handle('room.setLabel', async (_event, roomIdRaw: string, labelRaw: string) => {
    try {
      const roomId = String(roomIdRaw || '').trim();
      const label = String(labelRaw || '').trim();
      if (!roomId) return { success: false, code: 'invalid_room_id', error: '房间ID无效' };
      const ok = roomManager.setRoomLabel(roomId, label);
      return ok ? { success: true } : { success: false, code: 'not_found', error: '房间未连接' };
    } catch (err: any) {
      return { success: false, code: 'exception', error: err?.message || String(err) };
    }
  });

  // TODO: Re-implement handlers for the new architecture
  // - Window management (minimize, maximize, close)
  // - Settings management
  // - Room management (connect, disconnect)
  // - Data queries (get events, etc.)

  // --- Plugin Management ---
  
  // 获取已安装插件列表
  ipcMain.handle('plugin.list', async () => {
    try {
      const plugins = await pluginManager.getInstalledPlugins();
      return { success: true, data: plugins };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 安装插件
  ipcMain.handle('plugin.install', async (_event, options: any) => {
    try {
      const result = await pluginManager.installPlugin(options);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 卸载插件
  ipcMain.handle('plugin.uninstall', async (_event, pluginId: string) => {
    try {
      await pluginManager.uninstallPlugin(pluginId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 启用插件
  ipcMain.handle('plugin.enable', async (_event, pluginId: string) => {
    try {
      await pluginManager.enablePlugin(pluginId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 禁用插件
  ipcMain.handle('plugin.disable', async (_event, pluginId: string) => {
    try {
      await pluginManager.disablePlugin(pluginId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 获取单个插件信息
  ipcMain.handle('plugin.get', async (_event, pluginId: string) => {
    try {
      const plugin = await pluginManager.getPlugin(pluginId);
      return plugin ? { success: true, data: plugin } : { success: false, error: '插件未找到' };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // --- Plugin Window Management ---
  ipcMain.handle('plugin.window.open', async (_event, pluginId: string) => {
    return pluginWindowManager.open(String(pluginId));
  });

  ipcMain.handle('plugin.window.focus', async (_event, pluginId: string) => {
    return pluginWindowManager.focus(String(pluginId));
  });

  ipcMain.handle('plugin.window.close', async (_event, pluginId: string) => {
    return pluginWindowManager.close(String(pluginId));
  });

  ipcMain.handle('plugin.window.isOpen', async (_event, pluginId: string) => {
    return pluginWindowManager.isOpen(String(pluginId));
  });

  ipcMain.handle('plugin.window.list', async () => {
    return pluginWindowManager.list();
  });

  // --- Plugin Process Execution ---
  const pluginToastTicker = new Map<string, NodeJS.Timeout>();
  const startTicker = (pluginId: string, message: string, options?: any) => {
    if (pluginToastTicker.has(pluginId)) return;
    const interval = setInterval(() => {
      try {
        const win = windowManager.getMainWindow();
        win?.webContents.send('renderer-global-popup', { action: 'toast', payload: { message, options } });
      } catch (e) {}
    }, 3000);
    pluginToastTicker.set(pluginId, interval);
  };
  const stopTicker = (pluginId: string) => {
    const h = pluginToastTicker.get(pluginId);
    if (h) { try { clearInterval(h); } catch {} pluginToastTicker.delete(pluginId); }
  };

  // 结果缓存（按插件+方法）
  const _procResultCache = new Map<string, { data: any; ts: number }>();
  ipcMain.handle('plugin.process.execute', async (_event, pluginId: string, method: string, args?: any[]) => {
    try {
      try { console.log('[IPC] plugin.process.execute start', { pluginId, method, argsLen: Array.isArray(args) ? args.length : 0 }); } catch {}
      const pm = (pluginManager as any).processManager as any;
      if (!pm) return { success: false, error: 'process_manager_not_available' };
      // 按需启动插件进程
      try {
        const info = (pluginManager as any).getPlugin?.(String(pluginId));
        const proc = pm.getProcessInfo?.(String(pluginId));
        if (!proc && info && info.manifest && typeof info.manifest.main === 'string' && info.manifest.main.trim().length > 0) {
          const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
          const bundledRootCandidates = [
            path.join(process.cwd(), 'buildResources', 'plugins', String(info.id)),
            path.join(((process as any).resourcesPath || process.cwd()), 'plugins', String(info.id))
          ];
          const bundledRoot = bundledRootCandidates.find(p => { try { return fs.existsSync(p); } catch { return false; } });
          const preferBundled = !!bundledRoot && (info.manifest as any)?.test === true;
          const mainPath = preferBundled ? path.join(bundledRoot!, info.manifest.main) : path.join(info.installPath, info.manifest.main);
          await pm.startPluginProcess?.(String(pluginId), mainPath);
        }
      } catch {}
      const execArgs = Array.isArray(args) ? args : [];
      const cacheKey = `${String(pluginId)}:${String(method)}`;
      // 更稳的退避策略
      const maxAttempts = 10;
      let attempt = 0;
      let lastErr: any = null;
      try { await new Promise(r => setTimeout(r, 500)); } catch {}
      let res: any = undefined;
      while (attempt < maxAttempts) {
        try {
          res = await pm.executeInPlugin(String(pluginId), String(method), execArgs);
          lastErr = null;
          break;
        } catch (e: any) {
          const msg = String(e?.message || e);
          lastErr = e;
          if (msg.includes('status: busy')) {
            const wait = 200 + attempt * 200; // 递增等待
            await new Promise(r => setTimeout(r, wait));
            attempt++;
            continue;
          }
          break;
        }
      }
      if (lastErr && !String(lastErr?.message || lastErr).includes('status: busy')) {
        throw lastErr;
      }
      // 缓存结果
      try { _procResultCache.set(cacheKey, { data: res, ts: Date.now() }); } catch {}
      // 忙碌耗尽：返回缓存而非抛错
      if (lastErr && String(lastErr?.message || lastErr).includes('status: busy')) {
        const cached = _procResultCache.get(cacheKey);
        try { console.warn('[IPC] plugin.process.execute busy', { pluginId, method, attempts: maxAttempts }); } catch {}
        return { success: true, data: cached ? cached.data : undefined, stale: true, error: 'busy' };
      }
      // 辅助：根据方法名控制ticker
      try {
        if (String(method) === 'enableTicker') {
          const msg = (args && args[0]) || 'Ticker: toast';
          const opts = (args && args[1]) || { durationMs: 2500 };
          startTicker(String(pluginId), String(msg), opts);
        }
        if (String(method) === 'disableTicker') {
          stopTicker(String(pluginId));
        }
      } catch {}
      try {
        const summary = (() => {
          try {
            if (method === 'getStatus' && res && typeof res === 'object') {
              return { connected: !!res.connected, connecting: !!res.connecting, running: !!res.running, lastError: res.lastError || '', lastAttempt: res.lastAttempt || '' };
            }
            return undefined;
          } catch { return undefined; }
        })();
        console.log('[IPC] plugin.process.execute done', { pluginId, method, stale: false, summary });
      } catch {}
      return { success: true, data: res };
    } catch (err: any) {
      try { console.error('[IPC] plugin.process.execute fail', { pluginId, method, error: err?.message || String(err) }); } catch {}
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('plugin.process.message', async (_event, pluginId: string, type: string, payload?: any) => {
    try {
      const pm = (pluginManager as any).processManager as any;
      if (!pm) return { success: false, error: 'process_manager_not_available' };
      const res = await pm.sendMessageToPlugin(String(pluginId), String(type), payload, true);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 清理：插件禁用或卸载时停止ticker
  try {
    (pluginManager as any).on?.('plugin.disabled', ({ id }: any) => stopTicker(String(id)));
    (pluginManager as any).on?.('plugin.uninstalled', ({ id }: any) => stopTicker(String(id)));
  } catch {}

  // 获取插件配置
  ipcMain.handle('plugin.getConfig', async (_event, pluginId: string) => {
    try {
      const id = String(pluginId || '').trim();
      if (!id) {
        return { success: false, error: '插件ID无效' };
      }
      // 直接读取配置管理器中的插件配置节点
      const config = configManager.get(`plugins.${id}.config`, {});
      return { success: true, data: config || {} };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 更新插件配置（浅合并）
  ipcMain.handle('plugin.updateConfig', async (_event, pluginId: string, newConfig: Record<string, any>) => {
    try {
      const id = String(pluginId || '').trim();
      if (!id) {
        return { success: false, error: '插件ID无效' };
      }
      if (!newConfig || typeof newConfig !== 'object') {
        return { success: false, error: '配置格式无效' };
      }
      const current = (configManager.get(`plugins.${id}.config`, {}) || {}) as Record<string, any>;
      const merged = { ...current, ...newConfig };
      configManager.set(`plugins.${id}.config`, merged);

      // 配置更新后，同步该插件的 Overlay 样式（例如背景色）到运行时状态
      try {
        const bg = merged && typeof merged.uiBgColor === 'string' ? merged.uiBgColor : undefined;
        if (bg) {
          const overlays = overlayManager.getAllOverlays().filter(o => o.pluginId === id);
          await Promise.all(
            overlays.map(o => overlayManager.updateOverlay(o.id, {
              style: { ...(o.style || {}), backgroundColor: bg }
            }))
          );
        }
      } catch (syncErr) {
        console.warn('[IPC] plugin.updateConfig overlay sync failed:', syncErr);
      }

      // 发布生命周期事件：配置已更新（供 overlay-wrapper 通过 SSE 订阅）
      try {
        const channel = `plugin:${id}:overlay`;
        dataManager.publish(
          channel,
          { event: 'config-updated', payload: { config: merged } },
          { ttlMs: 5 * 60 * 1000, persist: true, meta: { kind: 'lifecycle' } },
        );
      } catch (pubErr) {
        console.warn('[IPC] plugin.updateConfig lifecycle publish failed:', pubErr);
      }

      // 通知插件窗口：配置已更新（供 window frame 转发到子页）
      try {
        pluginWindowManager.send(id, 'plugin-config-updated', { pluginId: id, config: merged });
      } catch {}

      // 同步 tickerEnabled 到主进程的全局ticker
      try {
        const enabled = !!merged.tickerEnabled;
        if (enabled) startTicker(id, 'Ticker: toast', { durationMs: 2500 }); else stopTicker(id);
      } catch {}

      try {
        const pm = (pluginManager as any).processManager as any;
        const info = (pluginManager as any).getPlugin?.(String(id));
        const proc = pm?.getProcessInfo?.(String(id));
        if (!proc && info && info.manifest && typeof info.manifest.main === 'string' && info.manifest.main.trim().length > 0) {
          const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
          const bundledRootCandidates = [
            path.join(process.cwd(), 'buildResources', 'plugins', String(info.id)),
            path.join(((process as any).resourcesPath || process.cwd()), 'plugins', String(info.id))
          ];
          const bundledRoot = bundledRootCandidates.find(p => { try { return fs.existsSync(p); } catch { return false; } });
          const preferBundled = !!bundledRoot && isDev && (info.manifest as any)?.test === true;
          const mainPath = preferBundled ? path.join(bundledRoot!, info.manifest.main) : path.join(info.installPath, info.manifest.main);
          await pm.startPluginProcess?.(String(id), mainPath);
        }
        try { await pm.executeInPlugin?.(String(id), 'onConfigUpdated', [merged]); } catch {}
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 获取插件统计信息
  ipcMain.handle('plugin.stats', async () => {
    try {
      const stats = await pluginManager.getPluginStats();
      return { success: true, data: stats };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 获取插件日志
  ipcMain.handle('plugin.logs', async (_event, pluginId?: string, limit?: number) => {
    try {
      const logs = await pluginManager.getPluginLogs(pluginId, limit);
      return { success: true, data: logs };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 获取插件错误历史
  ipcMain.handle('plugin.errorHistory', async (_event, pluginId: string) => {
    try {
      const history = await pluginManager.getPluginErrorHistory(pluginId);
      return { success: true, data: history };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 获取插件错误统计
  ipcMain.handle('plugin.errorStats', async () => {
    try {
      const stats = await pluginManager.getPluginErrorStats();
      return { success: true, data: stats };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 生命周期：由渲染进程（UI/Window页面）发起的钩子事件
  ipcMain.handle('plugin.lifecycle.emit', async (_event, hookName: string, pluginId: string, context?: Record<string, any>) => {
    try {
      const plugin = await pluginManager.getPlugin(pluginId);
      await pluginLifecycleManager.executeHook(hookName as any, {
        pluginId,
        plugin: plugin || undefined,
        manifest: plugin?.manifest,
        context: {
          pageType: (context && typeof (context as any).pageType === 'string') ? (context as any).pageType : 'ui',
          ...context
        }
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 执行插件恢复操作
  ipcMain.handle('plugin.recovery', async (_event, pluginId: string, action: string, context?: Record<string, any>) => {
    try {
      const result = await pluginManager.executePluginRecovery(pluginId, action as any, context);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 执行插件方法
  ipcMain.handle('plugin.execute', async (_event, pluginId: string, method: string, args?: any[]) => {
    try {
      const pm = (pluginManager as any).processManager as any;
      const info = (pluginManager as any).getPlugin?.(String(pluginId));
      const proc = pm?.getProcessInfo?.(String(pluginId));
      if (!proc) {
        if (info && info.manifest && typeof info.manifest.main === 'string' && info.manifest.main.trim().length > 0) {
          const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
          const bundledRootCandidates = [
            path.join(process.cwd(), 'buildResources', 'plugins', String(info.id)),
            path.join(((process as any).resourcesPath || process.cwd()), 'plugins', String(info.id))
          ];
          const bundledRoot = bundledRootCandidates.find(p => { try { return fs.existsSync(p); } catch { return false; } });
          const preferBundled = !!bundledRoot && isDev && (info.manifest as any)?.test === true;
          const mainPath = preferBundled ? path.join(bundledRoot!, info.manifest.main) : path.join(info.installPath, info.manifest.main);
          await pm.startPluginProcess?.(String(pluginId), mainPath);
        }
      }
      const res = await pm.executeInPlugin?.(String(pluginId), String(method), Array.isArray(args) ? args : []);
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 重置插件错误计数
  ipcMain.handle('plugin.resetErrorCount', async (_event, pluginId: string, errorType?: string) => {
    try {
      pluginManager.resetPluginErrorCount(pluginId, errorType as any);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // --- 文件对话框和安装相关 ---
  
  // 打开文件选择对话框
  ipcMain.handle('plugin.selectFile', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: '选择插件文件',
        filters: [
          { name: '插件文件', extensions: ['zip', 'tar', 'gz', 'tgz'] },
          { name: '所有文件', extensions: ['*'] }
        ],
        properties: ['openFile']
      });
      
      if (result.canceled || !result.filePaths.length) {
        return { success: false, canceled: true };
      }
      
      return { success: true, filePath: result.filePaths[0] };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 安装插件（带文件选择）
  ipcMain.handle('plugin.installFromFile', async (_event, options?: any) => {
    try {
      // 如果没有提供文件路径，先打开文件选择对话框
      let filePath = options?.filePath;
      
      if (!filePath) {
        const fileResult = await dialog.showOpenDialog({
          title: '选择要安装的插件文件',
          filters: [
            { name: '插件文件', extensions: ['zip', 'tar', 'gz', 'tgz'] },
            { name: '所有文件', extensions: ['*'] }
          ],
          properties: ['openFile']
        });
        
        if (fileResult.canceled || !fileResult.filePaths.length) {
          return { success: false, canceled: true };
        }
        
        filePath = fileResult.filePaths[0];
      }
      
      const installOptions = {
        filePath,
        overwrite: options?.overwrite || false,
        enable: options?.enable || false,
        skipSignatureVerification: options?.skipSignatureVerification || false,
        skipChecksumVerification: options?.skipChecksumVerification || false,
        allowUnsafe: options?.allowUnsafe || false,
        expectedChecksum: options?.expectedChecksum
      };
      
      const result = await pluginManager.installPlugin(installOptions);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 验证插件文件
  ipcMain.handle('plugin.validateFile', async (_event, filePath: string) => {
    try {
      const manifest = await pluginManager.validatePluginFile(filePath);
      return { success: true, data: manifest };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // --- Plugin Popup System 已移除 ---

  // --- Overlay System ---

  // 创建overlay
  ipcMain.handle('overlay.create', async (_event, options: any) => {
    try {
      const result = await overlayManager.createOverlay(options);
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 更新overlay
  ipcMain.handle('overlay.update', async (_event, overlayId: string, updates: any) => {
    try {
      const result = await overlayManager.updateOverlay(overlayId, updates);
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 关闭overlay
  ipcMain.handle('overlay.close', async (_event, overlayId: string) => {
    try {
      const result = await overlayManager.closeOverlay(overlayId);
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 显示overlay
  ipcMain.handle('overlay.show', async (_event, overlayId: string) => {
    try {
      const result = await overlayManager.showOverlay(overlayId);
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 隐藏overlay
  ipcMain.handle('overlay.hide', async (_event, overlayId: string) => {
    try {
      const result = await overlayManager.hideOverlay(overlayId);
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 将overlay置于前台
  ipcMain.handle('overlay.bringToFront', async (_event, overlayId: string) => {
    try {
      const result = await overlayManager.bringToFront(overlayId);
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 获取overlay列表
  ipcMain.handle('overlay.list', async () => {
    try {
      const result = await overlayManager.listOverlays();
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 发送消息到 overlay（UI/Window -> Overlay）
  ipcMain.handle('overlay.send', async (_event, overlayId: string, eventName: string, payload?: any) => {
    try {
      const result = await overlayManager.sendMessage(overlayId, eventName, payload);
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 处理overlay动作
  ipcMain.handle('overlay.action', async (_event, overlayId: string, action: string, data?: any) => {
    try {
      const result = await overlayManager.handleOverlayAction(overlayId, action, data);
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // --- Console Management ---

  // 创建控制台会话
  ipcMain.handle('console:createSession', async (_event, options: { source: 'local' | 'remote'; userId?: string }) => {
    try {
      const sessionId = consoleManager.createSession(options.source, options.userId);
      const session = consoleManager.getSession(sessionId);
      return { success: true, data: session };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 结束控制台会话
  ipcMain.handle('console:endSession', async (_event, options: { sessionId: string }) => {
    try {
      consoleManager.endSession(options.sessionId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 执行控制台命令
  ipcMain.handle('console:executeCommand', async (_event, options: { sessionId: string; commandLine: string }) => {
    try {
      const result = await consoleManager.executeCommand(options.sessionId, options.commandLine);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 获取可用命令列表（返回可克隆 DTO，移除不可序列化的 handler 等属性）
  ipcMain.handle('console:getCommands', async () => {
    try {
      const commands = consoleManager.getCommands().map((c: any) => ({
        name: String(c?.name || ''),
        description: String(c?.description || ''),
        usage: typeof c?.usage === 'string' ? c.usage : '',
        category: String(c?.category || 'system')
      }));
      return { success: true, data: commands };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 获取会话信息
  ipcMain.handle('console:getSession', async (_event, options: { sessionId: string }) => {
    try {
      const session = consoleManager.getSession(options.sessionId);
      if (session) {
        return { success: true, data: session };
      } else {
        return { success: false, error: 'Session not found' };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 获取活跃会话列表
  ipcMain.handle('console:getActiveSessions', async () => {
    try {
      const sessions = consoleManager.getActiveSessions();
      return { success: true, data: sessions };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // --- Plugin Development Tools ---

  // 保存开发工具配置
  ipcMain.handle('plugin.devtools.saveConfig', async (_event, config: any) => {
    try {
      const result = await pluginManager.saveDevConfig(config);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 获取开发工具配置
  ipcMain.handle('plugin.devtools.getConfig', async (_event, pluginId?: string) => {
    try {
      const config = await pluginManager.getDevConfig(pluginId);
      return { success: true, data: config };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 启动外部项目调试
  ipcMain.handle('plugin.devtools.startDebug', async (_event, config: any) => {
    try {
      const result = await pluginManager.startExternalDebug(config);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 停止外部项目调试
  ipcMain.handle('plugin.devtools.stopDebug', async (_event, pluginId: string) => {
    try {
      const result = await pluginManager.stopExternalDebug(pluginId);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 测试外部项目连接
  ipcMain.handle('plugin.devtools.testConnection', async (_event, config: any) => {
    try {
      const result = await pluginManager.testExternalConnection(config);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 获取调试状态
  ipcMain.handle('plugin.devtools.getDebugStatus', async (_event, pluginId: string) => {
    try {
      const status = await pluginManager.getDebugStatus(pluginId);
      return { success: true, data: status };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 启用热重载
  ipcMain.handle('plugin.devtools.enableHotReload', async (_event, pluginId: string) => {
    try {
      const result = await pluginManager.enableHotReload(pluginId);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 禁用热重载
  ipcMain.handle('plugin.devtools.disableHotReload', async (_event, pluginId: string) => {
    try {
      const result = await pluginManager.disableHotReload(pluginId);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // --- Dialog API ---
  
  // 显示打开文件对话框
  ipcMain.handle('dialog.showOpenDialog', async (_event, options: any) => {
    try {
      const result = await dialog.showOpenDialog(options);
      return result;
    } catch (err: any) {
      return { canceled: true, error: err?.message || String(err) };
    }
  });

  // 显示保存文件对话框
  ipcMain.handle('dialog.showSaveDialog', async (_event, options: any) => {
    try {
      const result = await dialog.showSaveDialog(options);
      return result;
    } catch (err: any) {
      return { canceled: true, error: err?.message || String(err) };
    }
  });

  // --- File System API ---
  
  // 检查文件/目录是否存在
  ipcMain.handle('fs.exists', async (_event, path: string) => {
    try {
      return fs.existsSync(path);
    } catch (err: any) {
      return false;
    }
  });

  // 读取文件
  ipcMain.handle('fs.readFile', async (_event, path: string) => {
    try {
      return fs.readFileSync(path, 'utf8');
    } catch (err: any) {
      throw new Error(`Failed to read file: ${err?.message || String(err)}`);
    }
  });

  // 写入文件
  ipcMain.handle('fs.writeFile', async (_event, path: string, data: string) => {
    try {
      fs.writeFileSync(path, data, 'utf8');
      return true;
    } catch (err: any) {
      throw new Error(`Failed to write file: ${err?.message || String(err)}`);
    }
  });

  // 窗口控制处理程序
  ipcMain.handle('window.minimize', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.minimize();
    }
  });

  ipcMain.handle('window.close', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.close();
    }
  });

  ipcMain.handle('window.maximize', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) {
        win.restore();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.handle('window.restore', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.restore();
    }
  });

  // Config: Get all config
  ipcMain.handle('system.getConfig', () => {
    return configManager.getAll();
  });

  // Config: Update config
  ipcMain.handle('system.updateConfig', (event, newConfig: Record<string, any>) => {
    try {
      // Basic validation
      if (typeof newConfig !== 'object' || newConfig === null) {
        throw new Error('Invalid configuration format.');
      }
      configManager.setAll(newConfig);
      try {
        // 即时应用：保持登录关闭时清理磁盘令牌
        if (Object.prototype.hasOwnProperty.call(newConfig, 'auth.keepLogin')) {
          const keep = !!newConfig['auth.keepLogin'];
          if (!keep) {
            try { (tokenManager as any).clearStoredTokenInfo?.(); } catch {}
          }
        }
        // 即时应用：托盘隐藏行为
        if (Object.prototype.hasOwnProperty.call(newConfig, 'ui.minimizeToTray')) {
          const enabled = !!newConfig['ui.minimizeToTray'];
          try { windowManager.setMinimizeToTray(enabled); } catch {}
        }
        // 即时应用：开机自启动
        if (Object.prototype.hasOwnProperty.call(newConfig, 'app.autoStart')) {
          const enabled = !!newConfig['app.autoStart'];
          try { app.setLoginItemSettings({ openAtLogin: enabled }); } catch {}
        }
        // 配置目录：复制当前配置到新目录（完整切换需重启）
        if (Object.prototype.hasOwnProperty.call(newConfig, 'config.dir')) {
          const dir = String(newConfig['config.dir'] || '');
          if (dir && dir.length > 0) {
            try {
              const userData = app.getPath('userData');
              const srcConfig = path.join(userData, 'config.json');
              const srcSecrets = path.join(userData, 'secrets.json');
              try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch {}
              try { if (fs.existsSync(srcConfig)) fs.copyFileSync(srcConfig, path.join(dir, 'config.json')); } catch {}
              try { if (fs.existsSync(srcSecrets)) fs.copyFileSync(srcSecrets, path.join(dir, 'secrets.json')); } catch {}
            } catch {}
          }
        }
      } catch {}
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system.getUserDataDir', async () => {
    try { return { success: true, path: app.getPath('userData') }; } catch (err: any) { return { success: false, error: err?.message || String(err) }; }
  });

  ipcMain.handle('system.getBuildInfo', async () => {
    try {
      let version = app.getVersion();
      let buildTime = Date.now();
      const tryParsePkg = (pkgPath: string) => {
        try {
          if (!fs.existsSync(pkgPath)) return false;
          const raw = fs.readFileSync(pkgPath, 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.version === 'string' && parsed.version.trim().length > 0) {
            if (typeof parsed.name === 'string' && parsed.name.trim().length > 0) {
              version = String(parsed.version).trim();
              const st = fs.statSync(pkgPath);
              buildTime = (st as any).mtimeMs || st.mtime.getTime();
              return true;
            }
          }
          return false;
        } catch { return false; }
      };

      // 1) 从 app.getAppPath() 向上递归查找，命中根 package.json
      try {
        let cur = app.getAppPath();
        for (let i = 0; i < 5; i++) { // 向上最多 5 层
          const candidate = path.join(cur, 'package.json');
          if (tryParsePkg(candidate)) break;
          const parent = path.dirname(cur);
          if (!parent || parent === cur) break;
          cur = parent;
        }
      } catch {}

      // 2) 回退：process.cwd()/package.json
      if (!version || version === app.getVersion()) {
        tryParsePkg(path.join(path.resolve(process.cwd()), 'package.json'));
      }

      return { success: true, version, buildTime };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // Database path helpers
  const resolveDbPath = (): string => {
    try {
      const envPath = process.env.ACFUN_TEST_DB_PATH;
      if (envPath && envPath.trim().length > 0) return envPath;
    } catch {}
    try {
      const configured = configManager.get<string>('database.path', '');
      if (configured && configured.trim().length > 0) return configured;
    } catch {}
    try {
      return path.join(app.getPath('userData'), 'events.db');
    } catch {
      return path.join(require('os').tmpdir(), 'acfun-events.db');
    }
  };

  ipcMain.handle('db.getPath', async () => {
    try { return { success: true, path: resolveDbPath() }; } catch (err: any) { return { success: false, error: err?.message || String(err) }; }
  });

  ipcMain.handle('db.setPath', async (_event, targetPath: string) => {
    try {
      if (!targetPath || typeof targetPath !== 'string') return { success: false, error: 'invalid_path' };
      const dir = path.dirname(targetPath);
      try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch {}
      configManager.set('database.path', targetPath);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // Storage stats
  ipcMain.handle('system.getStorageStats', async () => {
    try {
      const userData = app.getPath('userData');
      const dbPath = resolveDbPath();
      const safeSizeOf = (p: string): number => { try { const st = fs.statSync(p); return st.isFile() ? st.size : 0; } catch { return 0; } };
      const sumDir = (p: string): number => {
        let total = 0;
        try {
          if (!fs.existsSync(p)) return 0;
          const st = fs.statSync(p);
          if (st.isFile()) return st.size;
          const entries = fs.readdirSync(p);
          for (const name of entries) {
            if (name.startsWith('.') && (name.includes('cache') || name.includes('temp') || name.includes('backup'))) continue;
            const child = path.join(p, name);
            try { const cst = fs.statSync(child); total += cst.isFile() ? cst.size : sumDir(child); } catch {}
          }
        } catch {}
        return total;
      };
      const dbBytes = safeSizeOf(dbPath);
      const configBytes = safeSizeOf(path.join(userData, 'config.json')) + safeSizeOf(path.join(userData, 'secrets.json'));
      const pluginsBytes = sumDir(path.join(userData, 'plugins'));
      const totalBytes = dbBytes + configBytes + pluginsBytes;
      return { success: true, dbBytes, configBytes, pluginsBytes, totalBytes };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 简易文件状态查询：返回 mtimeMs
  ipcMain.handle('system.statPath', async (_event, targetPath: string) => {
    try {
      if (!targetPath || typeof targetPath !== 'string') {
        return { success: false, error: 'invalid_path' };
      }
      const st = fs.statSync(targetPath);
      const mtimeMs = (st as any).mtimeMs || st.mtime.getTime();
      return { success: true, mtimeMs };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('system.getReadmeSummary', async () => {
    try {
      const root = path.resolve(process.cwd());
      const file = path.join(root, 'README.md');
      if (!fs.existsSync(file)) return { success: false, error: 'README_NOT_FOUND' };
      const content = fs.readFileSync(file, 'utf8');
      let summary = '';
      try {
        const h3Match = content.match(/<h3>([^<]+)<\/h3>/i);
        const pMatch = content.match(/<p>([^<]+)<\/p>/i);
        const title = h3Match ? h3Match[1].trim() : '';
        const intro = pMatch ? pMatch[1].trim() : '';
        summary = [title, intro].filter(Boolean).join(' - ');
      } catch {}
      if (!summary) {
        const lines = content.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        const titleLine = lines.find(l => l && !l.startsWith('#') && !l.startsWith('[') && l.length > 0) || '';
        summary = titleLine || '适用于ACFUN的开放式直播框架工具 - 一个功能强大、可扩展的 AcFun 直播工具框架，提供弹幕收集、数据分析、插件系统等功能';
      }
      return { success: true, summary };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('config.exportZip', async (_event, targetPath?: string) => {
    try {
      let filepath = '';
      if (typeof targetPath === 'string' && targetPath.trim().length > 0) {
        filepath = targetPath.trim();
        const dir = path.dirname(filepath);
        try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch {}
      } else {
        const outDir = path.join(app.getPath('userData'), 'config-exports');
        try { if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true }); } catch {}
        const filename = `config-${Date.now()}.zip`;
        filepath = path.join(outDir, filename);
      }
      const output = fs.createWriteStream(filepath);
      const archiver = (await import('archiver')).default('zip', { zlib: { level: 9 } });
      await new Promise<void>((resolve, reject) => {
        output.on('close', () => resolve());
        output.on('error', (e) => reject(e));
        archiver.on('error', (e: any) => reject(e));
        archiver.pipe(output);
        const userData = app.getPath('userData');
        const configFile = path.join(userData, 'config.json');
        const secretsFile = path.join(userData, 'secrets.json');
        try { if (fs.existsSync(configFile)) archiver.file(configFile, { name: 'config.json' }); } catch {}
        try { if (fs.existsSync(secretsFile)) archiver.file(secretsFile, { name: 'secrets.json' }); } catch {}
        archiver.finalize();
      });
      return { success: true, filepath };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('config.importZip', async (_event, zipPath: string) => {
    try {
      if (!zipPath || typeof zipPath !== 'string' || !fs.existsSync(zipPath)) {
        return { success: false, error: 'zip_not_found' };
      }
      const unzipper = await import('unzipper');
      const userData = app.getPath('userData');
      await fs.createReadStream(zipPath).pipe(unzipper.Extract({ path: userData })).promise();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  // （重复块已移除）
  
  // 窗口控制处理程序
  // 重复的 window.* 处理器已移除（已在上文定义）

  const pendingConfirms = new Map<string, (result: boolean) => void>();
  ipcMain.handle('popup.toast', async (event, payload: { message: string; options?: any }) => {
    try {
      let win = windowManager.getMainWindow();
      if (!win || win.isDestroyed()) {
        const current = BrowserWindow.fromWebContents(event.sender);
        win = BrowserWindow.getAllWindows().find(w => w && !w.isDestroyed() && w !== current) || null;
      }
      win?.webContents.send('renderer-global-popup', { action: 'toast', payload });
      return { success: !!win };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('popup.alert', async (event, payload: { title: string; message: string; options?: any }) => {
    try {
      let win = windowManager.getMainWindow();
      if (!win || win.isDestroyed()) {
        const current = BrowserWindow.fromWebContents(event.sender);
        win = BrowserWindow.getAllWindows().find(w => w && !w.isDestroyed() && w !== current) || null;
      }
      win?.webContents.send('renderer-global-popup', { action: 'alert', payload });
      return { success: !!win };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('popup.confirm', async (event, payload: { title: string; message: string; options?: any }) => {
    try {
      let win = windowManager.getMainWindow();
      if (!win || win.isDestroyed()) {
        const current = BrowserWindow.fromWebContents(event.sender);
        win = BrowserWindow.getAllWindows().find(w => w && !w.isDestroyed() && w !== current) || null;
      }
      if (!win) return { success: false, error: 'main_window_not_available' };
      const requestId = String(Date.now()) + '-' + Math.random().toString(16).slice(2);
      const resultPromise = new Promise<boolean>((resolve) => {
        pendingConfirms.set(requestId, resolve);
        setTimeout(() => {
          if (pendingConfirms.has(requestId)) {
            pendingConfirms.delete(requestId);
            resolve(false);
          }
        }, 30000);
      });
      win.webContents.send('renderer-global-popup', { action: 'confirm', payload, requestId });
      const ok = await resultPromise;
      return { success: true, result: ok };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('popup.confirm.respond', async (_event, requestId: string, result: boolean) => {
    try {
      const resolver = pendingConfirms.get(requestId);
      if (resolver) {
        pendingConfirms.delete(requestId);
        resolver(!!result);
        return { success: true };
      }
      return { success: false, error: 'request_not_found' };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

console.log('[IPC] All IPC handlers initialized successfully');
}
  ipcMain.handle('config.setDir', async (_event, dir: string) => {
    try {
      const target = String(dir || '').trim();
      if (!target) return { success: false, error: 'invalid_dir' };
      try { if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true }); } catch {}
      // 保存设置
      configManager.set('config.dir', target);
      // 复制现有配置文件
      const userData = app.getPath('userData');
      const srcConfig = path.join(userData, 'config.json');
      const srcSecrets = path.join(userData, 'secrets.json');
      try { if (fs.existsSync(srcConfig)) fs.copyFileSync(srcConfig, path.join(target, 'config.json')); } catch {}
      try { if (fs.existsSync(srcSecrets)) fs.copyFileSync(srcSecrets, path.join(target, 'secrets.json')); } catch {}
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('system.setAutoStart', async (_event, enabled: boolean) => {
    try { app.setLoginItemSettings({ openAtLogin: !!enabled }); return { success: true }; } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('system.setMinimizeToTray', async (_event, enabled: boolean) => {
    try { windowManager.setMinimizeToTray(!!enabled); return { success: true }; } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  });
