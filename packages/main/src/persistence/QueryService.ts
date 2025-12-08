import { DatabaseManager } from './DatabaseManager';
import { NormalizedEvent, NormalizedEventType } from '../types';
import { TokenManager } from '../server/TokenManager';

export interface EventQuery {
  room_id?: string;
  room_kw?: string; // 主播用户名关键词（模糊匹配）
  from_ts?: number;
  to_ts?: number;
  from_date?: string;
  to_date?: string;
  type?: NormalizedEventType;
  types?: NormalizedEventType[]; // 新字段：支持类型集合过滤
  user_id?: string;
  user_ids?: string[];
  user_kw?: string; // 中文用户名关键词（模糊匹配）
  q?: string;
  page?: number;
  pageSize?: number;
  live_id?: string;
}

export interface EventQueryResult {
  items: NormalizedEvent[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export class QueryService {
  private databaseManager: DatabaseManager;

  constructor(databaseManager: DatabaseManager) {
    this.databaseManager = databaseManager;
  }

  public async queryEvents(query: EventQuery): Promise<EventQueryResult> {
    const { room_id, room_kw, from_ts, to_ts, from_date, to_date, type, types, user_id, user_kw, q, page = 1, pageSize = 200, live_id } = query;
    const offset = (page - 1) * pageSize;
    const actionTypeMap: Record<string, NormalizedEventType> = { comment: 'danmaku', gift: 'gift', like: 'like', enterRoom: 'enter', followAuthor: 'follow' };
    const typeList: NormalizedEventType[] | undefined = Array.isArray(types) && types.length > 0 ? types : (type ? [type] : undefined);
    const actionFilters = typeList ? typeList.filter(t => ['danmaku','gift','like','enter','follow'].includes(t)) : undefined;

    const whereActions: string[] = [];
    const paramsActions: any[] = [];
    const hasNick = await this.hasUsersNicknameColumn();
    if (room_id) { whereActions.push('a.liver_id = ?'); paramsActions.push(room_id); }
    if (live_id) { whereActions.push('a.live_id = ?'); paramsActions.push(live_id); }
    whereActions.push('a.user_id IS NOT NULL AND CAST(a.user_id AS INTEGER) <> 0');
    if (room_kw && !room_id) {
      const resolvedRoomIds = await this.resolveRoomIdsByKeyword(room_kw);
      if (resolvedRoomIds.length === 0) return { items: [], total: 0, page, pageSize, hasNext: false };
      whereActions.push(`a.live_id IN (${resolvedRoomIds.map(() => '?').join(',')})`);
      paramsActions.push(...resolvedRoomIds);
    }
    const hasDateRange = !!(from_date || to_date);
    if (!hasDateRange) {
      if (from_ts) { whereActions.push('a.send_time >= ?'); paramsActions.push(from_ts); }
      if (to_ts) { whereActions.push('a.send_time <= ?'); paramsActions.push(to_ts); }
    } else {
      // 按 rooms_meta.created_at 的日期范围先取 live_id 集合，再用 live_id 过滤事件
      const whereDates: string[] = [];
      const paramsDates: any[] = [];
      if (from_date) { whereDates.push(`date(created_at) >= date(?)`); paramsDates.push(from_date); }
      if (to_date) { whereDates.push(`date(created_at) <= date(?)`); paramsDates.push(to_date); }
      if (room_id) { whereDates.push('room_id = ?'); paramsDates.push(room_id); }
      const whereClauseDates = whereDates.length ? `WHERE ${whereDates.join(' AND ')}` : '';
      const liveRows = await this.executeQuery<{ live_id: string }>(
        `SELECT DISTINCT live_id FROM rooms_meta ${whereClauseDates}`,
        paramsDates
      );
      const liveIds = Array.from(new Set(liveRows.map(r => String(r.live_id)).filter(Boolean)));
      if (liveIds.length === 0) {
        return { items: [], total: 0, page, pageSize, hasNext: false };
      }
      whereActions.push(`a.live_id IN (${liveIds.map(() => '?').join(',')})`);
      paramsActions.push(...liveIds);
    }
    if (user_id) { whereActions.push('a.user_id = ?'); paramsActions.push(user_id); }
    if (Array.isArray(query.user_ids) && query.user_ids.length > 0) {
      const ids = query.user_ids.map(id => String(id)).filter(Boolean);
      if (ids.length > 0) {
        whereActions.push(`a.user_id IN (${ids.map(() => '?').join(',')})`);
        paramsActions.push(...ids);
      }
    }
    const needNicknameFilter = !!(user_kw && user_kw.trim().length > 0 && hasNick);
    if (needNicknameFilter) { whereActions.push('u.nickname LIKE ?'); paramsActions.push(`%${user_kw.trim()}%`); }
    const hasQ = !!(q && q.trim().length > 0);
    if (hasQ) { const like = `%${q!.trim()}%`; if (hasNick) { whereActions.push('(COALESCE(u.nickname,"") LIKE ? OR COALESCE(a.content,"") LIKE ? OR COALESCE(a.extra_json,"") LIKE ?)'); paramsActions.push(like, like, like); } else { whereActions.push('(COALESCE(a.content,"") LIKE ? OR COALESCE(a.extra_json,"") LIKE ?)'); paramsActions.push(like, like); } }
    if (actionFilters && actionFilters.length > 0) {
      const actionKeys = actionFilters.map(t => Object.keys(actionTypeMap).find(k => actionTypeMap[k] === t)).filter(Boolean) as string[];
      if (actionKeys.length > 0) { whereActions.push(`a.action_type IN (${actionKeys.map(() => '?').join(',')})`); paramsActions.push(...actionKeys); } else { whereActions.push('1=0'); }
    }
    const whereClauseActions = whereActions.length > 0 ? `WHERE ${whereActions.join(' AND ')}` : '';

    const sqlActions = `
      SELECT 
        a.send_time AS ts,
        a.liver_id AS room_id,
        a.live_id AS live_id,
        'acfun' AS source,
        CASE a.action_type 
          WHEN 'comment' THEN 'danmaku'
          WHEN 'gift' THEN 'gift'
          WHEN 'like' THEN 'like'
          WHEN 'enterRoom' THEN 'enter'
          WHEN 'followAuthor' THEN 'follow'
          WHEN 'shareLive' THEN 'shareLive'
          WHEN 'richText' THEN 'richText'
          ELSE 'system'
        END AS event_type,
        CAST(a.user_id AS TEXT) AS user_id,
        ${hasNick ? 'COALESCE(u.nickname, \'\')' : "COALESCE(json_extract(a.extra_json, '$.user.userName'), json_extract(a.extra_json, '$.user.nickname'), json_extract(a.extra_json, '$.user.name'), json_extract(a.extra_json, '$.userName'), json_extract(a.extra_json, '$.nickname'))"} AS user_name,
        a.content AS content,
        a.extra_json AS raw,
        u.avatar AS user_avatar,
        u.raw_json AS user_raw_json,
        u.medal_level AS user_medal_level,
        u.medal_club AS user_medal_club,
        a.id AS _id,
        g.count AS gift_count,
        g.gift_name AS gift_name,
        g.value AS gift_value
      FROM live_actions a
      LEFT JOIN users u ON u.user_id = a.user_id
      LEFT JOIN live_gifts g ON g.action_id = a.id
      ${whereClauseActions}
    `;
    const listSql = `
      ${sqlActions}
      ORDER BY ts DESC, _id DESC
      LIMIT ? OFFSET ?
    `;
    const debug = process.env.ACFRAME_DEBUG_LOGS === '1';
    const tList = Date.now();
    const rows = await this.executeQuery<any>(listSql, [...paramsActions, pageSize, offset]);
    if (debug) { try { console.log('[QueryService] events list ms=', Date.now() - tList); } catch {} }

    const countNeedsJoin = hasNick && (needNicknameFilter || hasQ);
    const countFrom = countNeedsJoin ? 'FROM live_actions a LEFT JOIN users u ON u.user_id = a.user_id' : 'FROM live_actions a';
    const countActionsSql = `SELECT COUNT(1) AS c ${countFrom} ${whereClauseActions}`;
    const tCount = Date.now();
    const [ca] = await this.executeQuery<{ c: number }>(countActionsSql, paramsActions);
    if (debug) { try { console.log('[QueryService] events count ms=', Date.now() - tCount); } catch {} }
    const total = (ca?.c || 0);
    const hasNext = offset + pageSize < total;

    const items: NormalizedEvent[] = rows.map(row => {
      const baseRaw = row.raw ? safeJson(row.raw) : null;
      let merged = baseRaw && typeof baseRaw === 'object' ? { ...baseRaw } : {};
      const avatar = row.user_avatar ? String(row.user_avatar) : '';
      let medal: any = null;
      if (row.user_raw_json) {
        try {
          const uj = JSON.parse(String(row.user_raw_json));
          const m = uj?.userInfo?.medal || uj?.medal;
          if (m) medal = { clubName: String(m.clubName || ''), level: Number(m.level || 0) };
        } catch {}
      }
      if (!medal) {
        const ml = Number(row.user_medal_level || 0);
        const mc = String(row.user_medal_club || '');
        if (ml || mc) medal = { clubName: mc, level: ml };
      }
      const currentUser = merged.userInfo || merged.user || {};
      const enrichedUser = { ...currentUser };
      if (avatar) enrichedUser.avatar = avatar;
      if (medal && !enrichedUser.medal) enrichedUser.medal = medal;
      if (Object.keys(enrichedUser).length > 0) {
        if (merged.userInfo) merged.userInfo = enrichedUser; else merged.user = enrichedUser;
      }
      let finalContent = row.content ? String(row.content) : null;
      if (row.event_type === 'gift') {
        const cnt = Number(row.gift_count || (merged?.count)) || 1;
        const name = String(row.gift_name || merged?.giftDetail?.giftName || '') || '';
        let val = Number(row.gift_value);
        if (!val || isNaN(val)) {
          const price = Number(merged?.giftDetail?.price || 0);
          val = price && cnt ? price * cnt : Number(merged?.value || 0);
        }
        const isBanana = name ? (/香蕉|蕉|banana/i).test(name) : false;
        if (name) {
          finalContent = isBanana ? `送了${cnt}个${name}` : `送了${cnt}个${name}（价值${(val / 10000)}元）`;
        }
        merged = { ...merged, gift: { count: cnt, gift_name: name, value: Number(val || 0) } };
      }
      return {
        ts: Number(row.ts),
        received_at: Number(row.ts),
        room_id: String(row.room_id),
        live_id: row.live_id != null ? String(row.live_id) : undefined,
        source: String(row.source || 'acfun'),
        event_type: row.event_type as NormalizedEventType,
        user_id: row.user_id ? String(row.user_id) : null,
        user_name: row.user_name ? String(row.user_name) : null,
        content: finalContent,
        raw: merged
      } as NormalizedEvent;
    });

    return { items, total, page, pageSize, hasNext };
  }

  public async deleteEvents(query: EventQuery): Promise<number> {
    const { room_id, room_kw, from_ts, to_ts, from_date, to_date, type, types, user_id, user_kw, q, live_id } = query;
    const actionTypeMap: Record<string, NormalizedEventType> = { comment: 'danmaku', gift: 'gift', like: 'like', enterRoom: 'enter', followAuthor: 'follow' };
    const typeList: NormalizedEventType[] | undefined = Array.isArray(types) && types.length > 0 ? types : (type ? [type] : undefined);
    const actionFilters = typeList ? typeList.filter(t => ['danmaku','gift','like','enter','follow'].includes(t)) : undefined;

    const whereActions: string[] = [];
    const paramsActions: any[] = [];
    const hasNick = await this.hasUsersNicknameColumn();
    if (room_id) { whereActions.push('a.liver_id = ?'); paramsActions.push(room_id); }
    if (live_id) { whereActions.push('a.live_id = ?'); paramsActions.push(live_id); }
    whereActions.push('a.user_id IS NOT NULL AND CAST(a.user_id AS INTEGER) <> 0');
    if (room_kw && !room_id) {
      const resolvedRoomIds = await this.resolveRoomIdsByKeyword(room_kw);
      if (resolvedRoomIds.length === 0) return 0;
      whereActions.push(`a.live_id IN (${resolvedRoomIds.map(() => '?').join(',')})`);
      paramsActions.push(...resolvedRoomIds);
    }
    const hasDateRange = !!(from_date || to_date);
    if (!hasDateRange) {
      if (from_ts) { whereActions.push('a.send_time >= ?'); paramsActions.push(from_ts); }
      if (to_ts) { whereActions.push('a.send_time <= ?'); paramsActions.push(to_ts); }
    } else {
      const whereDates: string[] = [];
      const paramsDates: any[] = [];
      if (from_date) { whereDates.push(`date(created_at) >= date(?)`); paramsDates.push(from_date); }
      if (to_date) { whereDates.push(`date(created_at) <= date(?)`); paramsDates.push(to_date); }
      if (room_id) { whereDates.push('room_id = ?'); paramsDates.push(room_id); }
      const whereClauseDates = whereDates.length ? `WHERE ${whereDates.join(' AND ')}` : '';
      const liveRows = await this.executeQuery<{ live_id: string }>(
        `SELECT DISTINCT live_id FROM rooms_meta ${whereClauseDates}`,
        paramsDates
      );
      const liveIds = Array.from(new Set(liveRows.map(r => String(r.live_id)).filter(Boolean)));
      if (liveIds.length === 0) {
        return 0;
      }
      whereActions.push(`a.live_id IN (${liveIds.map(() => '?').join(',')})`);
      paramsActions.push(...liveIds);
    }
    if (user_id) { whereActions.push('a.user_id = ?'); paramsActions.push(user_id); }
    if (Array.isArray(query.user_ids) && query.user_ids.length > 0) {
      const ids = query.user_ids.map(id => String(id)).filter(Boolean);
      if (ids.length > 0) {
        whereActions.push(`a.user_id IN (${ids.map(() => '?').join(',')})`);
        paramsActions.push(...ids);
      }
    }
    const needNicknameFilter = !!(user_kw && user_kw.trim().length > 0 && hasNick);
    if (needNicknameFilter) { whereActions.push('u.nickname LIKE ?'); paramsActions.push(`%${user_kw.trim()}%`); }
    const hasQ = !!(q && q.trim().length > 0);
    if (hasQ) { const like = `%${q!.trim()}%`; if (hasNick) { whereActions.push('(COALESCE(u.nickname,"") LIKE ? OR COALESCE(a.content,"") LIKE ? OR COALESCE(a.extra_json,"") LIKE ?)'); paramsActions.push(like, like, like); } else { whereActions.push('(COALESCE(a.content,"") LIKE ? OR COALESCE(a.extra_json,"") LIKE ?)'); paramsActions.push(like, like); } }
    if (actionFilters && actionFilters.length > 0) {
      const actionKeys = actionFilters.map(t => Object.keys(actionTypeMap).find(k => actionTypeMap[k] === t)).filter(Boolean) as string[];
      if (actionKeys.length > 0) { whereActions.push(`a.action_type IN (${actionKeys.map(() => '?').join(',')})`); paramsActions.push(...actionKeys); } else { whereActions.push('1=0'); }
    }
    const whereClauseActions = whereActions.length > 0 ? `WHERE ${whereActions.join(' AND ')}` : '';

    // 使用子查询进行删除
    const deleteSql = `
      DELETE FROM live_actions 
      WHERE id IN (
        SELECT a.id 
        FROM live_actions a 
        LEFT JOIN users u ON u.user_id = a.user_id 
        ${whereClauseActions}
      )
    `;

    // 执行删除前先获取受影响行数（SQLite DELETE 不直接返回 count，但在 run 的 this.changes 中返回）
    // 或者我们可以直接 run，然后获取 changes
    
    return new Promise((resolve, reject) => {
      const db = this.databaseManager.getDb();
      db.run(deleteSql, paramsActions, function(err) {
        if (err) {
          console.error('[QueryService] deleteEvents error:', err);
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  private async hasUsersNicknameColumn(): Promise<boolean> {
    try {
      const rows = await this.executeQuery<{ name: string }>('PRAGMA table_info(users)', []);
      const hasByPragma = rows.some(r => String(r.name).toLowerCase() === 'nickname');
      if (!hasByPragma) return false;
      try {
        await this.executeQuery<any>('SELECT nickname FROM users LIMIT 1', []);
        return true;
      } catch { return false; }
    } catch { return false; }
  }

  private async executeQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const db = this.databaseManager.getDb();
      
      db.all(sql, params, (err, rows) => {
        if (err) {
          try {
            console.error('SQL ERROR:', err?.message || err);
            console.error('SQL:', sql);
            console.error('PARAMS:', params);
          } catch {}
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  public async getEventById(id: number): Promise<NormalizedEvent | null> {
    const sql = `
      SELECT * FROM (
        SELECT a.id AS _id, a.send_time AS ts, a.liver_id AS room_id, a.live_id AS live_id, 'acfun' AS source,
               CASE a.action_type WHEN 'comment' THEN 'danmaku' WHEN 'gift' THEN 'gift' WHEN 'like' THEN 'like' WHEN 'enterRoom' THEN 'enter' WHEN 'followAuthor' THEN 'follow' WHEN 'shareLive' THEN 'shareLive' WHEN 'richText' THEN 'richText' ELSE 'system' END AS event_type,
               CAST(a.user_id AS TEXT) AS user_id, (SELECT nickname FROM users WHERE user_id=a.user_id) AS user_name, a.content AS content, a.extra_json AS raw
        FROM live_actions a WHERE a.id = ?
        UNION ALL
        SELECT s.id AS _id, s.report_time AS ts, s.liver_id AS room_id, s.live_id AS live_id, 'acfun' AS source,
               s.state_type AS event_type, NULL AS user_id, NULL AS user_name,
               CASE s.state_type WHEN 'bananaCount' THEN CAST(s.metric_main AS TEXT) WHEN 'displayInfo' THEN json_extract(s.raw_data, '$.watchingCount') ELSE NULL END AS content,
               s.raw_data AS raw
        FROM live_states s WHERE s.id = ?
      ) LIMIT 1
    `;
    const rows = await this.executeQuery<any>(sql, [id, id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return { ts: Number(r.ts), received_at: Number(r.ts), room_id: String(r.room_id), live_id: r.live_id != null ? String(r.live_id) : undefined, source: String(r.source || 'acfun'), event_type: r.event_type as NormalizedEventType, user_id: r.user_id ? String(r.user_id) : null, user_name: r.user_name ? String(r.user_name) : null, content: r.content ? String(r.content) : null, raw: r.raw ? safeJson(r.raw) : null };
  }

  public async getEventStats(room_id?: string): Promise<{ total: number; byType: Record<string, number>; dateRange: { earliest: number | null; latest: number | null } }> {
    const byType: Record<string, number> = {};
    let total = 0;
    let earliest: number | null = null;
    let latest: number | null = null;

    const whereA = room_id ? 'WHERE a.liver_id = ?' : '';
    const pA = room_id ? [room_id] : [];
    const rowsA = await this.executeQuery<{ type: string; cnt: number; earliest: number; latest: number }>(`SELECT a.action_type AS type, COUNT(1) AS cnt, MIN(a.send_time) AS earliest, MAX(a.send_time) AS latest FROM live_actions a ${whereA} GROUP BY a.action_type`, pA);
    for (const r of rowsA) {
      const t = r.type === 'comment' ? 'danmaku' : (r.type === 'enterRoom' ? 'enter' : (r.type === 'followAuthor' ? 'follow' : r.type));
      byType[t] = (byType[t] || 0) + r.cnt;
      total += r.cnt;
      earliest = earliest == null ? r.earliest : Math.min(earliest, r.earliest);
      latest = latest == null ? r.latest : Math.max(latest, r.latest);
    }
    const whereS = room_id ? 'WHERE s.liver_id = ?' : '';
    const pS = room_id ? [room_id] : [];
    const rowsS = await this.executeQuery<{ type: string; cnt: number; earliest: number; latest: number }>(`SELECT s.state_type AS type, COUNT(1) AS cnt, MIN(s.report_time) AS earliest, MAX(s.report_time) AS latest FROM live_states s ${whereS} GROUP BY s.state_type`, pS);
    for (const r of rowsS) {
      byType[r.type] = (byType[r.type] || 0) + r.cnt;
      total += r.cnt;
      earliest = earliest == null ? r.earliest : Math.min(earliest, r.earliest);
      latest = latest == null ? r.latest : Math.max(latest, r.latest);
    }
    return { total, byType, dateRange: { earliest, latest } };
  }

  // 根据主播用户名关键词解析 room_id 集合（使用 rooms_meta，必要时从 API 补充）
  private async resolveRoomIdsByKeyword(keyword: string): Promise<string[]> {
    const kw = keyword.trim();
    if (!kw) return [];

    // 先查 rooms_meta 表
    const like = `%${kw}%`;
    const existing = await this.executeQuery<{ room_id: string }>(
      'SELECT room_id FROM rooms_meta WHERE streamer_name LIKE ?',
      [like]
    );
    const matched = existing.map(r => String(r.room_id));
    if (matched.length > 0) {
      return matched;
    }

    // 无匹配则尝试补全 rooms_meta：遍历 events 中已知房间并拉取主播名
    const distinctRooms = await this.executeQuery<{ room_id: string }>(
      `SELECT room_id FROM (
        SELECT DISTINCT live_id AS room_id FROM live_actions
        UNION
        SELECT DISTINCT live_id AS room_id FROM live_states
      )`,
      []
    );
    const roomIds = distinctRooms.map(r => String(r.room_id));
    if (roomIds.length === 0) return [];

    const tokenMgr = TokenManager.getInstance();
    const api: any = tokenMgr.getApiInstance();

    for (const rid of roomIds) {
      try {
        let streamerName: string | undefined;
        let streamerUid: string | undefined;

        // 优先通过 live 用户信息获取 profile.userName
        try {
          const res = await api.live.getUserLiveInfo(Number(rid));
          if (res && res.success) {
            const profile = res.data?.profile || {};
            if (typeof profile.userName === 'string' && profile.userName.trim().length > 0) {
              streamerName = String(profile.userName);
            }
            if (profile.userID != null) {
              streamerUid = String(profile.userID);
            }
          }
        } catch {}

        // 兜底通过 danmu.getLiveRoomInfo 获取 owner.userName
        if (!streamerName) {
          try {
            const roomRes = await api.danmu.getLiveRoomInfo(rid);
            const owner = roomRes?.data?.owner || roomRes?.owner || {};
            const n = owner.userName || owner.nickname || owner.name;
            if (typeof n === 'string' && n.trim().length > 0) {
              streamerName = String(n);
            }
            const uidRaw = owner.userID || owner.uid || owner.id;
            if (uidRaw != null) streamerUid = String(uidRaw);
          } catch {}
        }

        if (streamerName) {
          await this.executeRun(
            `INSERT INTO rooms_meta (live_id, room_id, streamer_name, streamer_user_id, updated_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(live_id) DO UPDATE SET streamer_name=excluded.streamer_name, streamer_user_id=excluded.streamer_user_id, room_id=excluded.room_id, updated_at=CURRENT_TIMESTAMP`,
            [rid, streamerUid || null, streamerName, streamerUid || null]
          );
        }
      } catch {}
    }

    // 重新按关键词查一次
    const refreshed = await this.executeQuery<{ room_id: string }>(
      'SELECT room_id FROM rooms_meta WHERE streamer_name LIKE ?',
      [like]
    );
    return refreshed.map(r => String(r.room_id));
  }

  private async executeRun(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = this.databaseManager.getDb();
      db.run(sql, params, (err: any) => {
        if (err) {
          try {
            console.error('SQL EXEC ERROR:', err?.message || err);
            console.error('SQL:', sql);
            console.error('PARAMS:', params);
          } catch {}
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public async listRooms(limit: number = 200): Promise<Array<{ roomId: string; streamerName: string }>> {
    const sql = `
      SELECT rm.room_id AS room_id, COALESCE(rm.streamer_name,'') AS streamer_name
      FROM rooms_meta rm
      INNER JOIN (
        SELECT room_id, streamer_user_id, MAX(created_at) AS created_at
        FROM rooms_meta
        WHERE COALESCE(streamer_name,'') <> ''
        GROUP BY room_id, streamer_user_id
      ) latest
      ON latest.room_id = rm.room_id AND latest.streamer_user_id = rm.streamer_user_id AND latest.created_at = rm.created_at
      GROUP BY rm.room_id
      ORDER BY MAX(rm.created_at) DESC
      LIMIT ?
    `;
    const rows = await this.executeQuery<{ room_id: string; streamer_name: string }>(sql, [limit]);
    const list = rows.map(row => ({ roomId: String(row.room_id), streamerName: row.streamer_name || '' }));
    const missing = list.filter(r => !r.streamerName || r.streamerName.trim().length === 0);
    if (missing.length > 0) {
      const tokenMgr = TokenManager.getInstance();
      const api: any = tokenMgr.getApiInstance();
      const debug = process.env.ACFRAME_DEBUG_LOGS === '1';
      for (const r of missing) {
        try {
          let name: string | undefined;
          let uid: string | undefined;
          if (api) {
            try {
              const res = await api.live.getUserLiveInfo(Number(r.roomId));
              if (res && res.success) {
                const profile = res.data?.profile || {};
                if (profile.userName) name = String(profile.userName);
                if (profile.userID != null) uid = String(profile.userID);
              }
            } catch {}
            if (!name) {
              try {
                const roomRes = await api.danmu.getLiveRoomInfo(r.roomId);
                const owner = roomRes?.data?.owner || roomRes?.owner || {};
                const n = owner.userName || owner.nickname || owner.name;
                if (typeof n === 'string' && n.trim().length > 0) name = String(n);
                const uidRaw = owner.userID || owner.uid || owner.id;
                if (uidRaw != null) uid = String(uidRaw);
              } catch {}
            }
          }
          if (name) {
            await this.executeRun(
              `INSERT INTO rooms_meta (live_id, room_id, streamer_name, streamer_user_id, created_at)
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(live_id) DO UPDATE SET streamer_name=excluded.streamer_name, streamer_user_id=excluded.streamer_user_id, room_id=excluded.room_id`,
              [r.roomId, uid || null, name, uid || null]
            );
            r.streamerName = name;
          }
        } catch (e) {
          if (debug) { try { console.warn('[QueryService] listRooms enrich failed', r.roomId, e); } catch {} }
        }
      }
    }
    return list;
  }

  public async getDbInfo(): Promise<{ eventsCount: number; latestEventTs: number | null; latestRoomIds: string[]; roomsMetaCount: number }> {
    const c1 = await this.executeQuery<{ total: number }>('SELECT COUNT(*) AS total FROM live_actions', []);
    const c2 = await this.executeQuery<{ total: number }>('SELECT COUNT(*) AS total FROM live_states', []);
    const latest = await this.executeQuery<{ ts: number; room_id: string }>(
      `SELECT ts, room_id FROM (
        SELECT MAX(send_time) AS ts, live_id AS room_id FROM live_actions
        UNION ALL
        SELECT MAX(report_time) AS ts, live_id AS room_id FROM live_states
      ) ORDER BY ts DESC LIMIT 10`, []);
    const roomsRows = await this.executeQuery<{ total: number }>('SELECT COUNT(*) AS total FROM rooms_meta', []);
    const latestTs = latest[0]?.ts ?? null;
    const latestRoomIds = Array.from(new Set(latest.map(r => String(r.room_id))));
    return { eventsCount: (c1[0]?.total || 0) + (c2[0]?.total || 0), latestEventTs: latestTs, latestRoomIds, roomsMetaCount: roomsRows[0]?.total || 0 };
  }

  public async getEventsSample(limit: number = 20): Promise<Array<{ id: number; room_id: string; type: string; ts: number }>> {
    const rows = await this.executeQuery<{ id: number; room_id: string; type: string; ts: number }>(
      `SELECT id, room_id, type, ts FROM (
        SELECT a.id AS id, a.liver_id AS room_id, a.action_type AS type, a.send_time AS ts FROM live_actions a
        UNION ALL
        SELECT s.id AS id, s.liver_id AS room_id, s.state_type AS type, s.report_time AS ts FROM live_states s
      ) ORDER BY ts DESC, id DESC LIMIT ?`, [limit]
    );
    return rows.map(r => ({ id: r.id, room_id: String(r.room_id), type: String(r.type), ts: Number(r.ts) }));
  }

  public async listUsers(limit: number = 200, room_id?: string): Promise<Array<{ id: string; name: string }>> {
    const hasNick = await this.hasUsersNicknameColumn();
    if (hasNick) {
      if (room_id) {
        const rows = await this.executeQuery<{ user_id: string; nickname: string }>(
          `SELECT DISTINCT CAST(u.user_id AS TEXT) AS user_id, COALESCE(u.nickname,'') AS nickname
           FROM users u
           WHERE EXISTS (SELECT 1 FROM live_actions a WHERE a.user_id = u.user_id AND a.liver_id = ?)
           ORDER BY nickname ASC
           LIMIT ?`, [room_id, limit]
        );
        return rows.map(r => ({ id: String(r.user_id), name: r.nickname || String(r.user_id) }));
      }
      const rows = await this.executeQuery<{ user_id: string; nickname: string }>(
        `SELECT CAST(user_id AS TEXT) AS user_id, COALESCE(nickname,'') AS nickname
         FROM users
         ORDER BY updated_at DESC
         LIMIT ?`, [limit]
      );
      return rows.map(r => ({ id: String(r.user_id), name: r.nickname || String(r.user_id) }));
    } else {
      if (room_id) {
        const rows = await this.executeQuery<{ user_id: string; name: string }>(
          `SELECT DISTINCT CAST(a.user_id AS TEXT) AS user_id, COALESCE(json_extract(a.extra_json, '$.user.userName'),'') AS name
           FROM live_actions a
           WHERE a.liver_id = ? AND a.user_id IS NOT NULL
           ORDER BY name ASC
           LIMIT ?`, [room_id, limit]
        );
        return rows.map(r => ({ id: String(r.user_id), name: r.name || String(r.user_id) }));
      }
      const rows = await this.executeQuery<{ user_id: string; name: string }>(
        `SELECT DISTINCT CAST(a.user_id AS TEXT) AS user_id, COALESCE(json_extract(a.extra_json, '$.user.userName'),'') AS name
         FROM live_actions a
         WHERE a.user_id IS NOT NULL
         ORDER BY name ASC
         LIMIT ?`, [limit]
      );
      return rows.map(r => ({ id: String(r.user_id), name: r.name || String(r.user_id) }));
    }
  }

  public async searchUsers(keyword: string, page: number = 1, pageSize: number = 20, room_id?: string): Promise<{ items: Array<{ id: string; name: string }>; total: number; page: number; pageSize: number; hasNext: boolean }>{
    const kw = String(keyword || '').trim();
    const like = `%${kw}%`;
    const offset = (page - 1) * pageSize;
    const hasNick = await this.hasUsersNicknameColumn();
    if (hasNick) {
      if (room_id) {
        const rows = await this.executeQuery<{ user_id: string; nickname: string }>(
          `SELECT CAST(u.user_id AS TEXT) AS user_id, COALESCE(u.nickname,'') AS nickname
           FROM users u
           WHERE EXISTS (SELECT 1 FROM live_actions a WHERE a.user_id = u.user_id AND a.liver_id = ?)
             AND COALESCE(u.nickname,'') LIKE ?
           ORDER BY nickname ASC
           LIMIT ? OFFSET ?`, [room_id, like, pageSize, offset]
        );
        const cntRows = await this.executeQuery<{ c: number }>(
          `SELECT COUNT(1) AS c FROM users u WHERE EXISTS (SELECT 1 FROM live_actions a WHERE a.user_id = u.user_id AND a.liver_id = ?) AND COALESCE(u.nickname,'') LIKE ?`, [room_id, like]
        );
        const total = cntRows[0]?.c || 0;
        const items = rows.map(r => ({ id: String(r.user_id), name: r.nickname || String(r.user_id) }));
        return { items, total, page, pageSize, hasNext: offset + pageSize < total };
      }
      const rows = await this.executeQuery<{ user_id: string; nickname: string }>(
        `SELECT CAST(user_id AS TEXT) AS user_id, COALESCE(nickname,'') AS nickname
         FROM users
         WHERE COALESCE(nickname,'') LIKE ?
         ORDER BY nickname ASC
         LIMIT ? OFFSET ?`, [like, pageSize, offset]
      );
      const cntRows = await this.executeQuery<{ c: number }>(
        `SELECT COUNT(1) AS c FROM users WHERE COALESCE(nickname,'') LIKE ?`, [like]
      );
      const total = cntRows[0]?.c || 0;
      const items = rows.map(r => ({ id: String(r.user_id), name: r.nickname || String(r.user_id) }));
      return { items, total, page, pageSize, hasNext: offset + pageSize < total };
    } else {
      if (room_id) {
        const rows = await this.executeQuery<{ user_id: string; name: string }>(
          `SELECT DISTINCT CAST(a.user_id AS TEXT) AS user_id, COALESCE(json_extract(a.extra_json, '$.user.userName'),'') AS name
           FROM live_actions a
           WHERE a.liver_id = ? AND COALESCE(json_extract(a.extra_json, '$.user.userName'),'') LIKE ?
           ORDER BY name ASC
           LIMIT ? OFFSET ?`, [room_id, like, pageSize, offset]
        );
        const cntRows = await this.executeQuery<{ c: number }>(
          `SELECT COUNT(1) AS c FROM (
             SELECT DISTINCT a.user_id
             FROM live_actions a
             WHERE a.liver_id = ? AND COALESCE(json_extract(a.extra_json, '$.user.userName'),'') LIKE ?
           )`, [room_id, like]
        );
        const total = cntRows[0]?.c || 0;
        const items = rows.map(r => ({ id: String(r.user_id), name: r.name || String(r.user_id) }));
        return { items, total, page, pageSize, hasNext: offset + pageSize < total };
      }
      const rows = await this.executeQuery<{ user_id: string; name: string }>(
        `SELECT DISTINCT CAST(a.user_id AS TEXT) AS user_id, COALESCE(json_extract(a.extra_json, '$.user.userName'),'') AS name
         FROM live_actions a
         WHERE COALESCE(json_extract(a.extra_json, '$.user.userName'),'') LIKE ?
         ORDER BY name ASC
         LIMIT ? OFFSET ?`, [like, pageSize, offset]
      );
      const cntRows = await this.executeQuery<{ c: number }>(
        `SELECT COUNT(1) AS c FROM (
           SELECT DISTINCT a.user_id
           FROM live_actions a
           WHERE COALESCE(json_extract(a.extra_json, '$.user.userName'),'') LIKE ?
         )`, [like]
      );
      const total = cntRows[0]?.c || 0;
      const items = rows.map(r => ({ id: String(r.user_id), name: r.name || String(r.user_id) }));
      return { items, total, page, pageSize, hasNext: offset + pageSize < total };
    }
  }

  public async getEventDates(room_id?: string): Promise<string[]> {
    const where = room_id ? 'WHERE room_id = ?' : '';
    const params = room_id ? [room_id] : [];
    const rows = await this.executeQuery<{ d: string }>(
      `SELECT strftime('%Y-%m-%d', created_at) AS d FROM rooms_meta ${where} GROUP BY d ORDER BY d DESC`, params
    );
    return rows.map(r => String(r.d || '')).filter(Boolean);
  }
}
function safeJson(s: string): any { try { return JSON.parse(s); } catch { return null; } }
