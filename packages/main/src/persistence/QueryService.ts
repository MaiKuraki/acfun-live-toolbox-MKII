import { DatabaseManager } from './DatabaseManager';
import { NormalizedEvent, NormalizedEventType } from '../types';
import { TokenManager } from '../server/TokenManager';

export interface EventQuery {
  room_id?: string;
  room_kw?: string; // 主播用户名关键词（模糊匹配）
  from_ts?: number;
  to_ts?: number;
  type?: NormalizedEventType; // 兼容旧字段
  types?: NormalizedEventType[]; // 新字段：支持类型集合过滤
  user_id?: string;
  user_kw?: string; // 中文用户名关键词（模糊匹配）
  q?: string;
  page?: number;
  pageSize?: number;
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
    const { room_id, room_kw, from_ts, to_ts, type, types, user_id, user_kw, q, page = 1, pageSize = 200 } = query;
    const offset = (page - 1) * pageSize;
    const actionTypeMap: Record<string, NormalizedEventType> = { comment: 'danmaku', gift: 'gift', like: 'like', enterRoom: 'enter', followAuthor: 'follow' };
    const typeList: NormalizedEventType[] | undefined = Array.isArray(types) && types.length > 0 ? types : (type ? [type] : undefined);
    const actionFilters = typeList ? typeList.filter(t => ['danmaku','gift','like','enter','follow'].includes(t)) : undefined;

    const whereActions: string[] = [];
    const paramsActions: any[] = [];
    const hasNick = await this.hasUsersNicknameColumn();
    if (room_id) { whereActions.push('a.live_id = ?'); paramsActions.push(room_id); }
    if (room_kw && !room_id) {
      const resolvedRoomIds = await this.resolveRoomIdsByKeyword(room_kw);
      if (resolvedRoomIds.length === 0) return { items: [], total: 0, page, pageSize, hasNext: false };
      whereActions.push(`a.live_id IN (${resolvedRoomIds.map(() => '?').join(',')})`);
      paramsActions.push(...resolvedRoomIds);
    }
    if (from_ts) { whereActions.push('a.send_time >= ?'); paramsActions.push(from_ts); }
    if (to_ts) { whereActions.push('a.send_time <= ?'); paramsActions.push(to_ts); }
    if (user_id) { whereActions.push('a.user_id = ?'); paramsActions.push(user_id); }
    if (user_kw && user_kw.trim().length > 0 && hasNick) { whereActions.push('u.nickname LIKE ?'); paramsActions.push(`%${user_kw.trim()}%`); }
    if (q && q.trim().length > 0) { const like = `%${q.trim()}%`; if (hasNick) { whereActions.push('(COALESCE(u.nickname,"") LIKE ? OR COALESCE(a.content,"") LIKE ? OR COALESCE(a.extra_json,"") LIKE ?)'); paramsActions.push(like, like, like); } else { whereActions.push('(COALESCE(a.content,"") LIKE ? OR COALESCE(a.extra_json,"") LIKE ?)'); paramsActions.push(like, like); } }
    if (actionFilters && actionFilters.length > 0) {
      const actionKeys = actionFilters.map(t => Object.keys(actionTypeMap).find(k => actionTypeMap[k] === t)).filter(Boolean) as string[];
      if (actionKeys.length > 0) { whereActions.push(`a.action_type IN (${actionKeys.map(() => '?').join(',')})`); paramsActions.push(...actionKeys); } else { whereActions.push('1=0'); }
    }
    const whereClauseActions = whereActions.length > 0 ? `WHERE ${whereActions.join(' AND ')}` : '';

    const sqlActions = `
      SELECT 
        a.send_time AS ts,
        a.live_id AS room_id,
        'acfun' AS source,
        CASE a.action_type 
          WHEN 'comment' THEN 'danmaku'
          WHEN 'gift' THEN 'gift'
          WHEN 'like' THEN 'like'
          WHEN 'enterRoom' THEN 'enter'
          WHEN 'followAuthor' THEN 'follow'
          ELSE 'system'
        END AS event_type,
        CAST(a.user_id AS TEXT) AS user_id,
        ${hasNick ? 'COALESCE(u.nickname, \'\')' : "COALESCE(json_extract(a.extra_json, '$.user.userName'), json_extract(a.extra_json, '$.user.nickname'), json_extract(a.extra_json, '$.user.name'), json_extract(a.extra_json, '$.userName'), json_extract(a.extra_json, '$.nickname'))"} AS user_name,
        a.content AS content,
        a.extra_json AS raw,
        a.id AS _id
      FROM live_actions a
      LEFT JOIN users u ON u.user_id = a.user_id
      ${whereClauseActions}
    `;
    const listSql = `
      ${sqlActions}
      ORDER BY ts DESC, _id DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.executeQuery<any>(listSql, [...paramsActions, pageSize, offset]);

    const countActionsSql = `SELECT COUNT(1) AS c FROM live_actions a ${whereClauseActions}`;
    const [ca] = await this.executeQuery<{ c: number }>(countActionsSql, paramsActions);
    const total = (ca?.c || 0);
    const hasNext = offset + pageSize < total;

    const items: NormalizedEvent[] = rows.map(row => ({
      ts: Number(row.ts),
      received_at: Number(row.ts),
      room_id: String(row.room_id),
      source: String(row.source || 'acfun'),
      event_type: row.event_type as NormalizedEventType,
      user_id: row.user_id ? String(row.user_id) : null,
      user_name: row.user_name ? String(row.user_name) : null,
      content: row.content ? String(row.content) : null,
      raw: row.raw ? safeJson(row.raw) : null
    }));

    return { items, total, page, pageSize, hasNext };
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
          console.error('Query error:', err);
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
        SELECT a.id AS _id, a.send_time AS ts, a.live_id AS room_id, 'acfun' AS source,
               CASE a.action_type WHEN 'comment' THEN 'danmaku' WHEN 'gift' THEN 'gift' WHEN 'like' THEN 'like' WHEN 'enterRoom' THEN 'enter' WHEN 'followAuthor' THEN 'follow' ELSE 'system' END AS event_type,
               CAST(a.user_id AS TEXT) AS user_id, (SELECT nickname FROM users WHERE user_id=a.user_id) AS user_name, a.content AS content, a.extra_json AS raw
        FROM live_actions a WHERE a.id = ?
        UNION ALL
        SELECT s.id AS _id, s.report_time AS ts, s.live_id AS room_id, 'acfun' AS source,
               s.state_type AS event_type, NULL AS user_id, NULL AS user_name,
               CASE s.state_type WHEN 'bananaCount' THEN CAST(s.metric_main AS TEXT) WHEN 'displayInfo' THEN json_extract(s.raw_data, '$.watchingCount') ELSE NULL END AS content,
               s.raw_data AS raw
        FROM live_states s WHERE s.id = ?
      ) LIMIT 1
    `;
    const rows = await this.executeQuery<any>(sql, [id, id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return { ts: Number(r.ts), received_at: Number(r.ts), room_id: String(r.room_id), source: String(r.source || 'acfun'), event_type: r.event_type as NormalizedEventType, user_id: r.user_id ? String(r.user_id) : null, user_name: r.user_name ? String(r.user_name) : null, content: r.content ? String(r.content) : null, raw: r.raw ? safeJson(r.raw) : null };
  }

  public async getEventStats(room_id?: string): Promise<{ total: number; byType: Record<string, number>; dateRange: { earliest: number | null; latest: number | null } }> {
    const byType: Record<string, number> = {};
    let total = 0;
    let earliest: number | null = null;
    let latest: number | null = null;

    const whereA = room_id ? 'WHERE a.live_id = ?' : '';
    const pA = room_id ? [room_id] : [];
    const rowsA = await this.executeQuery<{ type: string; cnt: number; earliest: number; latest: number }>(`SELECT a.action_type AS type, COUNT(1) AS cnt, MIN(a.send_time) AS earliest, MAX(a.send_time) AS latest FROM live_actions a ${whereA} GROUP BY a.action_type`, pA);
    for (const r of rowsA) {
      const t = r.type === 'comment' ? 'danmaku' : (r.type === 'enterRoom' ? 'enter' : (r.type === 'followAuthor' ? 'follow' : r.type));
      byType[t] = (byType[t] || 0) + r.cnt;
      total += r.cnt;
      earliest = earliest == null ? r.earliest : Math.min(earliest, r.earliest);
      latest = latest == null ? r.latest : Math.max(latest, r.latest);
    }
    const whereS = room_id ? 'WHERE s.live_id = ?' : '';
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
          // upsert 到 rooms_meta
          await this.executeRun(
            `INSERT INTO rooms_meta (room_id, streamer_name, streamer_user_id, updated_at)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(room_id) DO UPDATE SET streamer_name=excluded.streamer_name, streamer_user_id=excluded.streamer_user_id, updated_at=CURRENT_TIMESTAMP`,
            [rid, streamerName, streamerUid || null]
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
          console.error('Exec error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public async listRooms(limit: number = 200): Promise<Array<{ roomId: string; streamerName: string }>> {
    const sql = `
      SELECT room_id, MAX(streamer_name) AS streamer_name, MAX(last_ts) AS last_ts
      FROM (
        SELECT a.live_id AS room_id, COALESCE(r.streamer_name,'') AS streamer_name, MAX(a.send_time) AS last_ts
        FROM live_actions a LEFT JOIN rooms_meta r ON r.room_id = a.live_id
        GROUP BY a.live_id
        UNION ALL
        SELECT s.live_id AS room_id, COALESCE(r.streamer_name,'') AS streamer_name, MAX(s.report_time) AS last_ts
        FROM live_states s LEFT JOIN rooms_meta r ON r.room_id = s.live_id
        GROUP BY s.live_id
      )
      GROUP BY room_id
      ORDER BY last_ts DESC
      LIMIT ?
    `;
    const rows = await this.executeQuery<{ room_id: string; streamer_name: string }>(sql, [limit]);
    return rows.map(row => ({ roomId: String(row.room_id), streamerName: row.streamer_name || '' }));
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
        SELECT a.id AS id, a.live_id AS room_id, a.action_type AS type, a.send_time AS ts FROM live_actions a
        UNION ALL
        SELECT s.id AS id, s.live_id AS room_id, s.state_type AS type, s.report_time AS ts FROM live_states s
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
           WHERE EXISTS (SELECT 1 FROM live_actions a WHERE a.user_id = u.user_id AND a.live_id = ?)
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
           WHERE a.live_id = ? AND a.user_id IS NOT NULL
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
           WHERE EXISTS (SELECT 1 FROM live_actions a WHERE a.user_id = u.user_id AND a.live_id = ?)
             AND COALESCE(u.nickname,'') LIKE ?
           ORDER BY nickname ASC
           LIMIT ? OFFSET ?`, [room_id, like, pageSize, offset]
        );
        const cntRows = await this.executeQuery<{ c: number }>(
          `SELECT COUNT(1) AS c FROM users u WHERE EXISTS (SELECT 1 FROM live_actions a WHERE a.user_id = u.user_id AND a.live_id = ?) AND COALESCE(u.nickname,'') LIKE ?`, [room_id, like]
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
           WHERE a.live_id = ? AND COALESCE(json_extract(a.extra_json, '$.user.userName'),'') LIKE ?
           ORDER BY name ASC
           LIMIT ? OFFSET ?`, [room_id, like, pageSize, offset]
        );
        const cntRows = await this.executeQuery<{ c: number }>(
          `SELECT COUNT(1) AS c FROM (
             SELECT DISTINCT a.user_id
             FROM live_actions a
             WHERE a.live_id = ? AND COALESCE(json_extract(a.extra_json, '$.user.userName'),'') LIKE ?
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
    const paramsA: any[] = [];
    const paramsS: any[] = [];
    const whereA = room_id ? 'WHERE a.live_id = ?' : '';
    const whereS = room_id ? 'WHERE s.live_id = ?' : '';
    if (room_id) { paramsA.push(room_id); paramsS.push(room_id); }
    const rowsA = await this.executeQuery<{ d: string }>(
      `SELECT strftime('%Y-%m-%d', datetime(a.send_time/1000, 'unixepoch')) AS d FROM live_actions a ${whereA} GROUP BY d ORDER BY d DESC`, paramsA
    );
    const rowsS = await this.executeQuery<{ d: string }>(
      `SELECT strftime('%Y-%m-%d', datetime(s.report_time/1000, 'unixepoch')) AS d FROM live_states s ${whereS} GROUP BY d ORDER BY d DESC`, paramsS
    );
    const set = new Set<string>();
    for (const r of rowsA) { if (r.d) set.add(String(r.d)); }
    for (const r of rowsS) { if (r.d) set.add(String(r.d)); }
    return Array.from(set).sort((a, b) => a < b ? 1 : (a > b ? -1 : 0));
  }
}
function safeJson(s: string): any { try { return JSON.parse(s); } catch { return null; } }
