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
      updated_at INTEGER,
      raw_json TEXT
    );
  `);
  await run(db, `
    CREATE TABLE IF NOT EXISTS live_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      live_id TEXT NOT NULL,
      liver_id TEXT,
      user_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      send_time INTEGER NOT NULL,
      content TEXT,
      quantity INTEGER DEFAULT 0,
      value_amount INTEGER DEFAULT 0,
      extra_json TEXT,
      CONSTRAINT uniq_action UNIQUE (live_id, user_id, action_type, send_time, content)
    );
  `);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_actions_live_type ON live_actions(live_id, action_type);`);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_actions_user ON live_actions(user_id);`);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_actions_liver ON live_actions(liver_id);`);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_actions_liver_type ON live_actions(liver_id, action_type);`);
  await run(db, `
    CREATE TABLE IF NOT EXISTS live_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      live_id TEXT NOT NULL,
      liver_id TEXT,
      report_time INTEGER NOT NULL,
      state_type TEXT NOT NULL,
      metric_main INTEGER,
      metric_sub INTEGER,
      raw_data TEXT
    );
  `);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_states_liver ON live_states(liver_id);`);

  await run(db, `
    CREATE TABLE IF NOT EXISTS live_gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_id INTEGER NOT NULL,
      live_id TEXT NOT NULL,
      liver_id TEXT,
      user_id INTEGER NOT NULL,
      send_time INTEGER NOT NULL,
      count INTEGER DEFAULT 0,
      combo INTEGER DEFAULT 0,
      value INTEGER DEFAULT 0,
      combo_id TEXT,
      gift_id INTEGER,
      gift_name TEXT,
      price INTEGER,
      pay_wallet_type INTEGER,
      can_combo INTEGER,
      can_draw INTEGER,
      CONSTRAINT uniq_gift_action UNIQUE (action_id)
    );
  `);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_gifts_live ON live_gifts(live_id);`);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_gifts_user ON live_gifts(user_id);`);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_gifts_combo_id ON live_gifts(combo_id);`);

  const hasColumn = async (table: string, column: string): Promise<boolean> => {
    return new Promise((resolve) => {
      db.all(`PRAGMA table_info(${table})`, [], (err, rows: any[]) => {
        if (err) return resolve(false);
        resolve(rows.some(r => String(r.name).toLowerCase() === column.toLowerCase()));
      });
    });
  };

  if (!(await hasColumn('live_actions', 'liver_id'))) {
    await run(db, `ALTER TABLE live_actions ADD COLUMN liver_id TEXT`);
  }
  if (!(await hasColumn('live_states', 'liver_id'))) {
    await run(db, `ALTER TABLE live_states ADD COLUMN liver_id TEXT`);
  }

  if (!(await hasColumn('users', 'raw_json'))) {
    await run(db, `ALTER TABLE users ADD COLUMN raw_json TEXT`);
  }

  if (await hasColumn('live_actions', 'product_name')) {
    await run(db, `
      CREATE TABLE IF NOT EXISTS live_actions_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        live_id TEXT NOT NULL,
        liver_id TEXT,
        user_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        send_time INTEGER NOT NULL,
        content TEXT,
        quantity INTEGER DEFAULT 0,
        value_amount INTEGER DEFAULT 0,
        extra_json TEXT,
        CONSTRAINT uniq_action UNIQUE (live_id, user_id, action_type, send_time, content)
      );
    `);
    await run(db, `
      INSERT INTO live_actions_new (id, live_id, liver_id, user_id, action_type, send_time, content, quantity, value_amount, extra_json)
      SELECT id, live_id, liver_id, user_id, action_type, send_time, content, quantity, value_amount, extra_json FROM live_actions;
    `);
    await run(db, `DROP TABLE live_actions;`);
    await run(db, `ALTER TABLE live_actions_new RENAME TO live_actions;`);
    await run(db, `CREATE INDEX IF NOT EXISTS idx_actions_live_type ON live_actions(live_id, action_type);`);
    await run(db, `CREATE INDEX IF NOT EXISTS idx_actions_user ON live_actions(user_id);`);
    await run(db, `CREATE INDEX IF NOT EXISTS idx_actions_liver ON live_actions(liver_id);`);
    await run(db, `CREATE INDEX IF NOT EXISTS idx_actions_liver_type ON live_actions(liver_id, action_type);`);
  }

  if (await hasColumn('live_gifts', 'extra_json')) {
    await run(db, `
      CREATE TABLE IF NOT EXISTS live_gifts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action_id INTEGER NOT NULL,
        live_id TEXT NOT NULL,
        liver_id TEXT,
        user_id INTEGER NOT NULL,
        send_time INTEGER NOT NULL,
        count INTEGER DEFAULT 0,
        combo INTEGER DEFAULT 0,
        value INTEGER DEFAULT 0,
        combo_id TEXT,
        gift_id INTEGER,
        gift_name TEXT,
        price INTEGER,
        pay_wallet_type INTEGER,
        can_combo INTEGER,
        can_draw INTEGER,
        CONSTRAINT uniq_gift_action UNIQUE (action_id)
      );
    `);
    await run(db, `
      INSERT INTO live_gifts_new (id, action_id, live_id, liver_id, user_id, send_time, count, combo, value, combo_id, gift_id, gift_name, price, pay_wallet_type, can_combo, can_draw)
      SELECT id, action_id, live_id, liver_id, user_id, send_time, count, combo, value, combo_id, gift_id, gift_name, price, pay_wallet_type, can_combo, can_draw FROM live_gifts;
    `);
    await run(db, `DROP TABLE live_gifts;`);
    await run(db, `ALTER TABLE live_gifts_new RENAME TO live_gifts;`);
    await run(db, `CREATE INDEX IF NOT EXISTS idx_gifts_live ON live_gifts(live_id);`);
    await run(db, `CREATE INDEX IF NOT EXISTS idx_gifts_user ON live_gifts(user_id);`);
    await run(db, `CREATE INDEX IF NOT EXISTS idx_gifts_combo_id ON live_gifts(combo_id);`);
  }

  await run(db, `
    UPDATE live_actions AS a
    SET liver_id = (
      SELECT rm.streamer_user_id FROM rooms_meta rm WHERE rm.live_id = a.live_id
    )
    WHERE liver_id IS NULL
  `);
  await run(db, `
    UPDATE live_states AS s
    SET liver_id = (
      SELECT rm.streamer_user_id FROM rooms_meta rm WHERE rm.live_id = s.live_id
    )
    WHERE liver_id IS NULL
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
  async handleNormalized(liveId: string, event: any, liverId?: string): Promise<void> {
    console.log(`[DANMU-DB] DanmuSQLiteWriter.handleNormalized - 开始处理标准化事件，类型: ${event?.event_type}, 直播ID: ${liveId}`);
    const t = String(event?.event_type || '').toLowerCase();
    const rawObj: any = event?.raw || {};
    const isHistory = !!(event?.isHistory || rawObj?.raw?.isHistory);
    const rawUser = findUserWithMedal(event?.raw ?? event) || null;
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
      console.log(`[DANMU-DB] DanmuSQLiteWriter.handleNormalized - 处理用户行为事件: ${t}, 直播ID: ${liveId}`);
      if (t === 'danmaku' && isHistory) {
        console.log(`[DANMU-DB] DanmuSQLiteWriter.handleNormalized - 跳过历史弹幕消息`);
        return;
      }
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
      if (rawUser) {
        console.log(`[DANMU-DB] DanmuSQLiteWriter.handleNormalized - 更新用户信息`);
        await this.upsertUser(userInfo, rawUser);
      }
      console.log(`[DANMU-DB] DanmuSQLiteWriter.handleNormalized - 插入动作记录`);
      await this.insertAction(liveId, String(liverId || ''), obj);
      console.log(`[DANMU-DB] DanmuSQLiteWriter.handleNormalized - 用户行为事件处理完成`);
      return;
    }

    if (t === 'bananacount' || t === 'displayinfo' || t === 'topusers' || t === 'recentcomment' || t === 'redpacklist' || t === 'chatcall' || t === 'chataccept' || t === 'chatready' || t === 'chatend' || t === 'kickedout' || t === 'violationalert' || t === 'managerstate' || t === 'end') {
      console.log(`[DANMU-DB] DanmuSQLiteWriter.handleNormalized - 处理状态事件: ${t}, 直播ID: ${liveId}`);
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
      console.log(`[DANMU-DB] DanmuSQLiteWriter.handleNormalized - 插入状态记录`);
      await this.insertState(liveId, String(liverId || ''), canon, data);
      console.log(`[DANMU-DB] DanmuSQLiteWriter.handleNormalized - 状态事件处理完成`);
      return;
    }
  }
  async handleEvent(liveId: string, liverId: string, evt: any): Promise<void> {
    const isHistory = !!(evt?.isHistory || evt?.raw?.isHistory || evt?.danmuInfo?.isHistory);
    if (evt && !evt.actionType && !evt.type && evt.sendTime != null && evt.userInfo) {
      if (isHistory) { return; }
      const asComment = {
        actionType: 'comment',
        danmuInfo: { sendTime: Number(evt.sendTime), userInfo: evt.userInfo },
        content: toStr(evt.content)
      };
      await this.insertAction(liveId, liverId, asComment);
      return;
    }
    if (evt && evt.actionType) {
      if (String(evt.actionType) === 'comment' && isHistory) { return; }
      const rawUi = findUserWithMedal(evt);
      if (rawUi) {
        const ui = {
          userID: Number(rawUi.userID ?? rawUi.userId ?? 0),
          nickname: String(rawUi.nickname ?? rawUi.name ?? ''),
          avatar: String(rawUi.avatar ?? ''),
          medal: {
            uperID: Number(rawUi.medal?.uperID ?? 0),
            userID: Number(rawUi.medal?.userID ?? 0),
            clubName: String(rawUi.medal?.clubName ?? ''),
            level: Number(rawUi.medal?.level ?? 0)
          },
          managerType: Number(rawUi.managerType ?? 0)
        };
        await this.upsertUser(ui, rawUi);
      }
      await this.insertAction(liveId, liverId, evt);
      return;
    }
    if (evt && evt.type) {
      if (evt.type === 'topUsers' && Array.isArray(evt.data)) {
        for (const it of evt.data) {
          const rawUi = findUserWithMedal(it);
          if (rawUi) {
            const ui = {
              userID: Number(rawUi.userID ?? rawUi.userId ?? 0),
              nickname: String(rawUi.nickname ?? rawUi.name ?? ''),
              avatar: String(rawUi.avatar ?? ''),
              medal: {
                uperID: Number(rawUi.medal?.uperID ?? 0),
                userID: Number(rawUi.medal?.userID ?? 0),
                clubName: String(rawUi.medal?.clubName ?? ''),
                level: Number(rawUi.medal?.level ?? 0)
              },
              managerType: Number(rawUi.managerType ?? 0)
            };
            await this.upsertUser(ui, rawUi);
          }
        }
        await this.insertState(liveId, liverId, 'topUsers', evt.data);
        return;
      }
      await this.insertState(liveId, liverId, String(evt.type), evt.data);
    }
  }
  async upsertUser(userInfo: any, rawUser?: any): Promise<void> {
    const sql = `
      INSERT INTO users (user_id, nickname, avatar, manager_type, medal_level, medal_club, updated_at, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET nickname=excluded.nickname, avatar=excluded.avatar, manager_type=excluded.manager_type, medal_level=excluded.medal_level, medal_club=excluded.medal_club, updated_at=excluded.updated_at, raw_json=excluded.raw_json
    `;
    const medal = userInfo.medal || {};
    const params = [
      toInt(userInfo.userID),
      toStr(userInfo.nickname),
      toStr(userInfo.avatar),
      toInt(userInfo.managerType),
      toInt(medal.level),
      toStr(medal.clubName),
      Date.now(),
      jsonOrNull(rawUser ?? userInfo)
    ];
    await run(this.db, sql, params);
  }
  async insertAction(liveId: string, liverId: string, evt: any): Promise<void> {
    console.log(`[DANMU-DB] DanmuSQLiteWriter.insertAction - 开始插入动作，类型: ${evt.actionType}, 直播ID: ${liveId}`);
    const actionType = String(evt.actionType || '');
    const sendTime = toInt(evt.danmuInfo?.sendTime);
    const userId = toInt(evt.danmuInfo?.userInfo?.userID);
    let content: string | null = null;
    let quantity = 0;
    let value = 0;
    let extra: string | null = null;
    if (actionType === 'comment') {
      content = toStr(evt.content) || null;
    } else if (actionType === 'gift') {
      quantity = toInt(evt.count);
      value = toInt(evt.value);
      const giftName = toStr(evt.giftDetail?.giftName) || '';
      const yuan = String(value / 10000);
      const cntLabel = quantity > 0 ? String(quantity) : '1';
      content = `送出${giftName}${cntLabel}个价值${yuan}元`;
      extra = (evt.giftDetail && evt.giftDetail.pngPic) ? toStr(evt.giftDetail.pngPic) : null;
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
      INSERT OR IGNORE INTO live_actions (live_id, liver_id, user_id, action_type, send_time, content, quantity, value_amount, extra_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [toStr(liveId), toStr(liverId), userId, actionType, sendTime, content, quantity, value, extra];
    console.log(`[DANMU-DB] DanmuSQLiteWriter.insertAction - 执行SQL插入动作记录`);
    await new Promise<void>((resolve, reject) => { this.db.run(sql, params, (err) => err ? reject(err) : resolve()); });
    console.log(`[DANMU-DB] DanmuSQLiteWriter.insertAction - 动作记录插入完成`);

    if (actionType === 'gift') {
      const row: any = await new Promise((resolve, reject) => {
        const q = `SELECT id FROM live_actions WHERE live_id = ? AND liver_id IS ? AND user_id = ? AND action_type = ? AND send_time = ? AND content IS ? LIMIT 1`;
        const qp = [toStr(liveId), liverId == null ? null : toStr(liverId), userId, actionType, sendTime, content];
        this.db.get(q, qp, (err, r) => err ? reject(err) : resolve(r));
      });
      const actionId = row?.id ? toInt(row.id) : 0;
      if (actionId > 0) {
        const combo = toInt(evt.combo);
        const comboId = toStr(evt.comboID) || null;
        const giftId = toInt(evt.giftDetail?.giftID);
        const giftName = toStr(evt.giftDetail?.giftName) || null;
        const price = toInt(evt.giftDetail?.price);
        const payWalletType = toInt(evt.giftDetail?.payWalletType);
        const canCombo = toInt(evt.giftDetail?.canCombo ? 1 : 0);
        const canDraw = toInt(evt.giftDetail?.canDraw ? 1 : 0);
        const gsql = `
          INSERT INTO live_gifts (action_id, live_id, liver_id, user_id, send_time, count, combo, value, combo_id, gift_id, gift_name, price, pay_wallet_type, can_combo, can_draw)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(action_id) DO UPDATE SET count=excluded.count, combo=excluded.combo, value=excluded.value, combo_id=excluded.combo_id, gift_id=excluded.gift_id, gift_name=excluded.gift_name, price=excluded.price, pay_wallet_type=excluded.pay_wallet_type, can_combo=excluded.can_combo, can_draw=excluded.can_draw
        `;
        const gp = [actionId, toStr(liveId), toStr(liverId), userId, sendTime, quantity, combo, value, comboId, giftId, giftName, price, payWalletType, canCombo, canDraw];
        await new Promise<void>((resolve, reject) => { this.db.run(gsql, gp, (err) => err ? reject(err) : resolve()); });
      }
    }
  }
  async insertState(liveId: string, liverId: string, type: string, data: any): Promise<void> {
    // 不保存 topUsers
    if (type === 'topUsers') {
      return;
    }

    // 对于 bananaCount 和 displayInfo，每分钟只保存一次
    if (type === 'bananaCount' || type === 'displayInfo') {
      const now = Date.now();
      const oneMinuteAgo = now - 60000; // 1分钟 = 60000毫秒
      
      // 查询该 live_id 和 state_type 的最后一条记录时间
      const lastRecord: any = await new Promise((resolve, reject) => {
        const querySql = `SELECT report_time FROM live_states WHERE live_id = ? AND state_type = ? ORDER BY report_time DESC LIMIT 1`;
        const queryParams = [toStr(liveId), type];
        this.db.get(querySql, queryParams, (err, row) => err ? reject(err) : resolve(row));
      });

      // 如果存在最后一条记录，且距离现在不足1分钟，则跳过保存
      if (lastRecord && lastRecord.report_time && lastRecord.report_time > oneMinuteAgo) {
        return;
      }

      if (type === 'bananaCount') {
        const sql = `INSERT INTO live_states (live_id, liver_id, report_time, state_type, metric_main) VALUES (?, ?, ?, ?, ?)`;
        const params = [toStr(liveId), toStr(liverId), now, type, toInt(data)];
        await run(this.db, sql, params);
        return;
      }
      if (type === 'displayInfo') {
        const main = parseHumanNumber(data?.watchingCount);
        const sub = parseHumanNumber(data?.likeCount);
        const sql = `INSERT INTO live_states (live_id, liver_id, report_time, state_type, metric_main, metric_sub, raw_data) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [toStr(liveId), toStr(liverId), now, type, main, sub, jsonOrNull(data)];
        await run(this.db, sql, params);
        return;
      }
    }

    const sql = `INSERT INTO live_states (live_id, liver_id, report_time, state_type, raw_data) VALUES (?, ?, ?, ?, ?)`;
    const params = [toStr(liveId), toStr(liverId), Date.now(), type, jsonOrNull(data)];
    await run(this.db, sql, params);
  }
}

function toInt(v: any): number { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : 0; }
function toStr(v: any): string { return v == null ? '' : String(v); }
function jsonOrNull(v: any): string | null { try { if (v == null) return null; return JSON.stringify(v); } catch { return null; } }
function parseHumanNumber(v: any): number { if (v == null) return 0; const s = String(v).trim(); if (!s) return 0; const m = s.match(/^([0-9]+(?:\.[0-9]+)?)(\s*万)?$/); if (!m) { const n = Number(s); return Number.isFinite(n) ? Math.trunc(n) : 0; } const num = Number(m[1]); const hasWan = !!m[2]; return Math.trunc(num * (hasWan ? 10000 : 1)); }

function findUserWithMedal(root: any, maxDepth: number = 8): any | null {
  const stack: Array<{ v: any; d: number }> = [{ v: root, d: 0 }];
  const visited = new WeakSet<object>();
  while (stack.length > 0) {
    const { v, d } = stack.pop() as { v: any; d: number };
    if (v == null) continue;
    if (d > maxDepth) continue;
    const t = typeof v;
    if (t === 'object') {
      if (visited.has(v)) continue;
      try { visited.add(v); } catch {}
      if (!Array.isArray(v)) {
        if (Object.prototype.hasOwnProperty.call(v, 'medal') && v.medal && typeof v.medal === 'object') {
          return v;
        }
        for (const k of Object.keys(v)) { const child = v[k]; if (child && (typeof child === 'object')) stack.push({ v: child, d: d + 1 }); }
      } else {
        for (const child of v) { if (child && (typeof child === 'object')) stack.push({ v: child, d: d + 1 }); }
      }
    }
  }
  return null;
}
