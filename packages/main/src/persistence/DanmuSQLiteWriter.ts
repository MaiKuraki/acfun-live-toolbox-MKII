import * as sqlite3 from 'sqlite3';

export async function createDanmuSchema(db: sqlite3.Database): Promise<void> {
  await run(db, `
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      nickname TEXT,
      avatar TEXT,
      manager_type INTEGER,
      medal_level INTEGER,
      medal_club TEXT,
      updated_at INTEGER
    );
  `);
  await run(db, `
    CREATE TABLE IF NOT EXISTS live_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      live_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      send_time INTEGER NOT NULL,
      content TEXT,
      quantity INTEGER DEFAULT 0,
      value_amount INTEGER DEFAULT 0,
      product_name TEXT,
      extra_json TEXT,
      CONSTRAINT uniq_action UNIQUE (live_id, user_id, action_type, send_time, content)
    );
  `);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_actions_live_type ON live_actions(live_id, action_type);`);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_actions_user ON live_actions(user_id);`);
  await run(db, `
    CREATE TABLE IF NOT EXISTS live_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      live_id TEXT NOT NULL,
      report_time INTEGER NOT NULL,
      state_type TEXT NOT NULL,
      metric_main INTEGER,
      metric_sub INTEGER,
      raw_data TEXT
    );
  `);
}

function run(db: sqlite3.Database, sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => err ? reject(err) : resolve());
  });
}

export class DanmuSQLiteWriter {
  private db: sqlite3.Database;
  constructor(db: sqlite3.Database) { this.db = db; }
  async handleNormalized(liveId: string, event: any): Promise<void> {
    const t = String(event?.event_type || '').toLowerCase();
    const rawObj: any = event?.raw || {};
    const rawUser = rawObj?.userInfo || rawObj?.danmuInfo?.userInfo || null;
    const userInfo = rawUser ? {
      userID: Number(rawUser.userID ?? rawUser.userId ?? event?.user_id ?? 0),
      nickname: String(rawUser.nickname ?? rawUser.name ?? event?.user_name ?? ''),
      avatar: String(rawUser.avatar ?? ''),
      medal: {
        uperID: Number(rawUser.medal?.uperID ?? 0),
        userID: Number(rawUser.medal?.userID ?? 0),
        clubName: String(rawUser.medal?.clubName ?? ''),
        level: Number(rawUser.medal?.level ?? 0)
      },
      managerType: Number(rawUser.managerType ?? 0)
    } : {
      userID: Number(event?.user_id || 0),
      nickname: String(event?.user_name || ''),
      avatar: '',
      medal: { uperID: 0, userID: 0, clubName: '', level: 0 },
      managerType: 0
    };
    const sendTime = Number(
      rawObj?.sendTime ?? rawObj?.sendTimeMs ?? rawObj?.danmuInfo?.sendTime ?? event?.ts ?? Date.now()
    );

    if (t === 'danmaku' || t === 'gift' || t === 'like' || t === 'enter' || t === 'follow') {
      const actionType = (
        t === 'danmaku' ? 'comment' :
        t === 'gift' ? 'gift' :
        t === 'like' ? 'like' :
        t === 'enter' ? 'enterRoom' :
        t === 'follow' ? 'followAuthor' : 'comment'
      );
      const obj: any = { actionType, danmuInfo: { sendTime, userInfo } };
      if (t === 'danmaku') obj.content = toStr(rawObj?.content ?? event?.content) || '';
      // 尝试从 raw 提取礼物等细节
      if (t === 'gift' && rawObj) {
        obj.count = toInt(rawObj?.count);
        obj.value = toInt(rawObj?.value);
        obj.giftDetail = rawObj?.giftDetail || null;
      }
      await this.upsertUser(userInfo);
      await this.insertAction(liveId, obj);
      return;
    }

    if (t === 'bananacount' || t === 'displayinfo' || t === 'topusers' || t === 'recentcomment' || t === 'redpacklist' || t === 'chatcall' || t === 'chataccept' || t === 'chatready' || t === 'chatend' || t === 'kickedout' || t === 'violationalert' || t === 'managerstate' || t === 'end') {
      const canon = (
        t === 'bananacount' ? 'bananaCount' :
        t === 'displayinfo' ? 'displayInfo' :
        t === 'topusers' ? 'topUsers' :
        t === 'recentcomment' ? 'recentComment' :
        t === 'redpacklist' ? 'redpackList' :
        t === 'chatcall' ? 'chatCall' :
        t === 'chataccept' ? 'chatAccept' :
        t === 'chatready' ? 'chatReady' :
        t === 'chatend' ? 'chatEnd' :
        t === 'kickedout' ? 'kickedOut' :
        t === 'violationalert' ? 'violationAlert' :
        t === 'managerstate' ? 'managerState' : 'end'
      );
      const data = event?.raw?.data ?? event?.raw ?? event?.content ?? null;
      await this.insertState(liveId, canon, data);
      return;
    }
  }
  async handleEvent(liveId: string, evt: any): Promise<void> {
    if (evt && !evt.actionType && !evt.type && evt.sendTime != null && evt.userInfo) {
      const asComment = {
        actionType: 'comment',
        danmuInfo: { sendTime: Number(evt.sendTime), userInfo: evt.userInfo },
        content: toStr(evt.content)
      };
      await this.insertAction(liveId, asComment);
      return;
    }
    if (evt && evt.actionType) {
      const ui = evt.danmuInfo?.userInfo;
      if (ui) await this.upsertUser(ui);
      await this.insertAction(liveId, evt);
      return;
    }
    if (evt && evt.type) {
      if (evt.type === 'recentComment' && Array.isArray(evt.data)) {
        for (const it of evt.data) {
          const e = { actionType: 'comment', danmuInfo: { sendTime: it.sendTime, userInfo: it.userInfo }, content: it.content };
          await this.insertAction(liveId, e);
        }
        return;
      }
      if (evt.type === 'topUsers' && Array.isArray(evt.data)) {
        for (const it of evt.data) { if (it.userInfo) await this.upsertUser(it.userInfo); }
        await this.insertState(liveId, 'topUsers', evt.data);
        return;
      }
      await this.insertState(liveId, String(evt.type), evt.data);
    }
  }
  async upsertUser(userInfo: any): Promise<void> {
    const sql = `
      INSERT INTO users (user_id, nickname, avatar, manager_type, medal_level, medal_club, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET nickname=excluded.nickname, avatar=excluded.avatar, manager_type=excluded.manager_type, medal_level=excluded.medal_level, medal_club=excluded.medal_club, updated_at=excluded.updated_at
    `;
    const medal = userInfo.medal || {};
    const params = [
      toInt(userInfo.userID),
      toStr(userInfo.nickname),
      toStr(userInfo.avatar),
      toInt(userInfo.managerType),
      toInt(medal.level),
      toStr(medal.clubName),
      Date.now()
    ];
    await run(this.db, sql, params);
  }
  async insertAction(liveId: string, evt: any): Promise<void> {
    const actionType = String(evt.actionType || '');
    const sendTime = toInt(evt.danmuInfo?.sendTime);
    const userId = toInt(evt.danmuInfo?.userInfo?.userID);
    let content: string | null = null;
    let quantity = 0;
    let value = 0;
    let productName: string | null = null;
    let extra: string | null = null;
    if (actionType === 'comment') {
      content = toStr(evt.content) || null;
    } else if (actionType === 'gift') {
      quantity = toInt(evt.count);
      value = toInt(evt.value);
      productName = toStr(evt.giftDetail?.giftName) || null;
      extra = jsonOrNull(evt.giftDetail);
    } else if (actionType === 'throwBanana') {
      quantity = toInt(evt.bananaCount);
    } else if (actionType === 'richText') {
      extra = jsonOrNull(evt.segments);
    } else if (actionType === 'shareLive') {
      extra = JSON.stringify({ platform: toInt(evt.sharePlatform) });
    } else if (actionType === 'joinClub') {
      extra = jsonOrNull(evt.fansInfo);
    } else if (actionType === 'enterRoom' || actionType === 'like' || actionType === 'followAuthor') {
    }
    const sql = `
      INSERT OR IGNORE INTO live_actions (live_id, user_id, action_type, send_time, content, quantity, value_amount, product_name, extra_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [toStr(liveId), userId, actionType, sendTime, content, quantity, value, productName, extra];
    await run(this.db, sql, params);
  }
  async insertState(liveId: string, type: string, data: any): Promise<void> {
    if (type === 'bananaCount') {
      const sql = `INSERT INTO live_states (live_id, report_time, state_type, metric_main) VALUES (?, ?, ?, ?)`;
      const params = [toStr(liveId), Date.now(), type, toInt(data)];
      await run(this.db, sql, params);
      return;
    }
    if (type === 'displayInfo') {
      const main = parseHumanNumber(data?.watchingCount);
      const sub = parseHumanNumber(data?.likeCount);
      const sql = `INSERT INTO live_states (live_id, report_time, state_type, metric_main, metric_sub, raw_data) VALUES (?, ?, ?, ?, ?, ?)`;
      const params = [toStr(liveId), Date.now(), type, main, sub, jsonOrNull(data)];
      await run(this.db, sql, params);
      return;
    }
    const sql = `INSERT INTO live_states (live_id, report_time, state_type, raw_data) VALUES (?, ?, ?, ?)`;
    const params = [toStr(liveId), Date.now(), type, jsonOrNull(data)];
    await run(this.db, sql, params);
  }
}

function toInt(v: any): number { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : 0; }
function toStr(v: any): string { return v == null ? '' : String(v); }
function jsonOrNull(v: any): string | null { try { if (v == null) return null; return JSON.stringify(v); } catch { return null; } }
function parseHumanNumber(v: any): number { if (v == null) return 0; const s = String(v).trim(); if (!s) return 0; const m = s.match(/^([0-9]+(?:\.[0-9]+)?)(\s*万)?$/); if (!m) { const n = Number(s); return Number.isFinite(n) ? Math.trunc(n) : 0; } const num = Number(m[1]); const hasWan = !!m[2]; return Math.trunc(num * (hasWan ? 10000 : 1)); }