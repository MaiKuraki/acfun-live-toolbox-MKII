**目标**
- 基于 acfunlive-http-api 的回调事件，新增三张表 `users`、`live_actions`、`live_states` 并实现严格去重与高效写入。
- 提供 TypeScript 写入模块，按给定 DML 规则完成用户 upsert、行为事件插入、状态事件插入及特殊事件处理。

**集成点**
- 在 `packages/main/src/persistence/DatabaseManager.ts:46` 的建表流程后调用新增 Schema 初始化函数。
- 在 `packages/main/src/server/AcfunApiProxy.ts:314` 的弹幕回调处，将事件传入新写入模块，并使用 `liverUID` 作为 `live_id`。
- 复用现有 `sqlite3` 连接，保持与 `events`、`rooms_meta` 并存。

**数据库与写入代码**
```ts
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

function run(db: sqlite3.Database, sql: string, params: any[] = []): Promise<void> { return new Promise((resolve, reject) => { db.run(sql, params, (err) => err ? reject(err) : resolve()); }); }

export class DanmuSQLiteWriter {
  private db: sqlite3.Database;
  constructor(db: sqlite3.Database) { this.db = db; }
  async handleEvent(liveId: string, evt: any): Promise<void> {
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
function parseHumanNumber(v: any): number { if (v == null) return 0; const s = String(v).trim(); if (!s) return 0; const m = s.match(/^([0-9]+(?:\\.[0-9]+)?)(\\s*万)?$/); if (!m) { const n = Number(s); return Number.isFinite(n) ? Math.trunc(n) : 0; } const num = Number(m[1]); const hasWan = !!m[2]; return Math.trunc(num * (hasWan ? 10000 : 1)); }
```

**数据映射要点**
- 用户 upsert：提取 `userInfo` 全量字段，`updated_at` 为当前时间戳。
- 行为事件：按表格规则映射 `quantity`、`value_amount`、`product_name`、`extra_json`，`send_time`=`danmuInfo.sendTime`，`user_id`=`danmuInfo.userInfo.userID`，`INSERT OR IGNORE` 使用唯一索引去重。
- 特殊事件：`recentComment` 转换为 `comment` 插入；`topUsers` 逐个 upsert 用户，并将整组 `data` 存入 `live_states.raw_data`。
- 状态事件：`bananaCount` 和 `displayInfo` 按指定字段落库，其他 `type` 全量 `JSON` 进入 `raw_data`。

**应用与验证**
- 在 `DatabaseManager` 初始化后调用 `createDanmuSchema(db)`。
- 在 `AcfunApiProxy` 的弹幕启动端点，将 `danmuCallback` 改为调用 `writer.handleEvent(liverUID, event)`，`writer` 由 `new DanmuSQLiteWriter(databaseManager.getDb())` 构造。
- 沿用现有 WAL 与索引策略，批量写入时可在上层外包事务以获得吞吐。

请确认后我将按以上方案在主进程中落地，完成 Schema 初始化与写入链路改造，并在对应文件位置实现集成。