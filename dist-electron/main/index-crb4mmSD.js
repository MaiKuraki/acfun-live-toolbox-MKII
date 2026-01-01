import * as kt from "sqlite3";
import { app as R, BrowserWindow as ne, Notification as lt, shell as Me, globalShortcut as ze, ipcMain as C, dialog as We, Tray as It, Menu as Tt, session as Ct } from "electron";
import * as I from "path";
import x, { join as Dt } from "path";
import * as _e from "os";
import { EventEmitter as ce } from "events";
import { createApi as Pt, ManagerType as xe } from "acfunlive-http-api";
import * as S from "fs";
import Se, { existsSync as Ve, readFileSync as Rt } from "fs";
import Mt from "electron-store";
import ve from "express";
import Nt from "cors";
import Lt from "helmet";
import ut from "compression";
import xt from "morgan";
import * as Ot from "http";
import { createServer as Ft } from "http";
import { WebSocketServer as Ut, WebSocket as Be } from "ws";
import * as ae from "crypto";
import { randomUUID as dt } from "crypto";
import { Worker as jt } from "node:worker_threads";
import { Worker as $t } from "worker_threads";
import { watch as pt } from "chokidar";
import * as ht from "net";
import * as Ht from "https";
import zt from "adm-zip";
import Wt from "tar";
import { v4 as Bt } from "uuid";
import qt from "archiver";
async function Vt(g) {
  await $(g, `
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
  `), await $(g, `
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
  `), await $(g, "CREATE INDEX IF NOT EXISTS idx_actions_live_type ON live_actions(live_id, action_type);"), await $(g, "CREATE INDEX IF NOT EXISTS idx_actions_user ON live_actions(user_id);"), await $(g, "CREATE INDEX IF NOT EXISTS idx_actions_liver ON live_actions(liver_id);"), await $(g, "CREATE INDEX IF NOT EXISTS idx_actions_liver_type ON live_actions(liver_id, action_type);"), await $(g, `
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
  `), await $(g, "CREATE INDEX IF NOT EXISTS idx_states_liver ON live_states(liver_id);"), await $(g, `
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
  `), await $(g, "CREATE INDEX IF NOT EXISTS idx_gifts_live ON live_gifts(live_id);"), await $(g, "CREATE INDEX IF NOT EXISTS idx_gifts_user ON live_gifts(user_id);"), await $(g, "CREATE INDEX IF NOT EXISTS idx_gifts_combo_id ON live_gifts(combo_id);");
  const e = async (t, s) => new Promise((r) => {
    g.all(`PRAGMA table_info(${t})`, [], (n, i) => {
      if (n) return r(!1);
      r(i.some((o) => String(o.name).toLowerCase() === s.toLowerCase()));
    });
  });
  await e("live_actions", "liver_id") || await $(g, "ALTER TABLE live_actions ADD COLUMN liver_id TEXT"), await e("live_states", "liver_id") || await $(g, "ALTER TABLE live_states ADD COLUMN liver_id TEXT"), await e("users", "raw_json") || await $(g, "ALTER TABLE users ADD COLUMN raw_json TEXT"), await e("live_actions", "product_name") && (await $(g, `
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
    `), await $(g, `
      INSERT INTO live_actions_new (id, live_id, liver_id, user_id, action_type, send_time, content, quantity, value_amount, extra_json)
      SELECT id, live_id, liver_id, user_id, action_type, send_time, content, quantity, value_amount, extra_json FROM live_actions;
    `), await $(g, "DROP TABLE live_actions;"), await $(g, "ALTER TABLE live_actions_new RENAME TO live_actions;"), await $(g, "CREATE INDEX IF NOT EXISTS idx_actions_live_type ON live_actions(live_id, action_type);"), await $(g, "CREATE INDEX IF NOT EXISTS idx_actions_user ON live_actions(user_id);"), await $(g, "CREATE INDEX IF NOT EXISTS idx_actions_liver ON live_actions(liver_id);"), await $(g, "CREATE INDEX IF NOT EXISTS idx_actions_liver_type ON live_actions(liver_id, action_type);")), await e("live_gifts", "extra_json") && (await $(g, `
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
    `), await $(g, `
      INSERT INTO live_gifts_new (id, action_id, live_id, liver_id, user_id, send_time, count, combo, value, combo_id, gift_id, gift_name, price, pay_wallet_type, can_combo, can_draw)
      SELECT id, action_id, live_id, liver_id, user_id, send_time, count, combo, value, combo_id, gift_id, gift_name, price, pay_wallet_type, can_combo, can_draw FROM live_gifts;
    `), await $(g, "DROP TABLE live_gifts;"), await $(g, "ALTER TABLE live_gifts_new RENAME TO live_gifts;"), await $(g, "CREATE INDEX IF NOT EXISTS idx_gifts_live ON live_gifts(live_id);"), await $(g, "CREATE INDEX IF NOT EXISTS idx_gifts_user ON live_gifts(user_id);"), await $(g, "CREATE INDEX IF NOT EXISTS idx_gifts_combo_id ON live_gifts(combo_id);")), await $(g, `
    UPDATE live_actions AS a
    SET liver_id = (
      SELECT rm.streamer_user_id FROM rooms_meta rm WHERE rm.live_id = a.live_id
    )
    WHERE liver_id IS NULL
  `), await $(g, `
    UPDATE live_states AS s
    SET liver_id = (
      SELECT rm.streamer_user_id FROM rooms_meta rm WHERE rm.live_id = s.live_id
    )
    WHERE liver_id IS NULL
  `);
}
function $(g, e, t = []) {
  return new Promise((s, r) => {
    g.run(e, t, (n) => n ? r(n) : s());
  });
}
class yt {
  db;
  constructor(e) {
    this.db = e;
  }
  async handleNormalized(e, t, s) {
    const r = String(t?.event_type || "").toLowerCase(), n = t?.raw || {}, i = !!(t?.isHistory || n?.raw?.isHistory), o = Xe(t?.raw ?? t) || null, a = o ? {
      userID: Number(o.userID ?? o.userId ?? t?.user_id ?? 0),
      nickname: String(o.nickname ?? o.name ?? t?.user_name ?? ""),
      avatar: String(o.avatar ?? ""),
      medal: {
        uperID: Number(o.medal?.uperID ?? 0),
        userID: Number(o.medal?.userID ?? 0),
        clubName: String(o.medal?.clubName ?? ""),
        level: Number(o.medal?.level ?? 0)
      },
      managerType: Number(o.managerType ?? 0)
    } : {
      userID: Number(t?.user_id || 0),
      nickname: String(t?.user_name || ""),
      avatar: "",
      medal: { uperID: 0, userID: 0, clubName: "", level: 0 },
      managerType: 0
    }, c = Number(
      n?.sendTime ?? n?.sendTimeMs ?? n?.danmuInfo?.sendTime ?? t?.ts ?? Date.now()
    );
    if (r === "danmaku" || r === "gift" || r === "like" || r === "enter" || r === "follow") {
      if (r === "danmaku" && i)
        return;
      const f = { actionType: r === "danmaku" ? "comment" : r === "gift" ? "gift" : r === "like" ? "like" : r === "enter" ? "enterRoom" : r === "follow" ? "followAuthor" : "comment", danmuInfo: { sendTime: c, userInfo: a } };
      r === "danmaku" && (f.content = G(n?.content ?? t?.content) || ""), r === "gift" && n && (f.count = K(n?.count), f.value = K(n?.value), f.giftDetail = n?.giftDetail || null), o && await this.upsertUser(a, o), await this.insertAction(e, String(s || ""), f);
      return;
    }
    if (r === "bananacount" || r === "displayinfo" || r === "topusers" || r === "recentcomment" || r === "redpacklist" || r === "chatcall" || r === "chataccept" || r === "chatready" || r === "chatend" || r === "kickedout" || r === "violationalert" || r === "managerstate" || r === "end") {
      const d = r === "bananacount" ? "bananaCount" : r === "displayinfo" ? "displayInfo" : r === "topusers" ? "topUsers" : r === "recentcomment" ? "recentComment" : r === "redpacklist" ? "redpackList" : r === "chatcall" ? "chatCall" : r === "chataccept" ? "chatAccept" : r === "chatready" ? "chatReady" : r === "chatend" ? "chatEnd" : r === "kickedout" ? "kickedOut" : r === "violationalert" ? "violationAlert" : r === "managerstate" ? "managerState" : "end", f = t?.raw?.data ?? t?.raw ?? t?.content ?? null;
      await this.insertState(e, String(s || ""), d, f);
      return;
    }
  }
  async handleEvent(e, t, s) {
    const r = !!(s?.isHistory || s?.raw?.isHistory || s?.danmuInfo?.isHistory);
    if (s && !s.actionType && !s.type && s.sendTime != null && s.userInfo) {
      if (r)
        return;
      const n = {
        actionType: "comment",
        danmuInfo: { sendTime: Number(s.sendTime), userInfo: s.userInfo },
        content: G(s.content)
      };
      await this.insertAction(e, t, n);
      return;
    }
    if (s && s.actionType) {
      if (String(s.actionType) === "comment" && r)
        return;
      const n = Xe(s);
      if (n) {
        const i = {
          userID: Number(n.userID ?? n.userId ?? 0),
          nickname: String(n.nickname ?? n.name ?? ""),
          avatar: String(n.avatar ?? ""),
          medal: {
            uperID: Number(n.medal?.uperID ?? 0),
            userID: Number(n.medal?.userID ?? 0),
            clubName: String(n.medal?.clubName ?? ""),
            level: Number(n.medal?.level ?? 0)
          },
          managerType: Number(n.managerType ?? 0)
        };
        await this.upsertUser(i, n);
      }
      await this.insertAction(e, t, s);
      return;
    }
    if (s && s.type) {
      if (s.type === "topUsers" && Array.isArray(s.data)) {
        for (const n of s.data) {
          const i = Xe(n);
          if (i) {
            const o = {
              userID: Number(i.userID ?? i.userId ?? 0),
              nickname: String(i.nickname ?? i.name ?? ""),
              avatar: String(i.avatar ?? ""),
              medal: {
                uperID: Number(i.medal?.uperID ?? 0),
                userID: Number(i.medal?.userID ?? 0),
                clubName: String(i.medal?.clubName ?? ""),
                level: Number(i.medal?.level ?? 0)
              },
              managerType: Number(i.managerType ?? 0)
            };
            await this.upsertUser(o, i);
          }
        }
        await this.insertState(e, t, "topUsers", s.data);
        return;
      }
      await this.insertState(e, t, String(s.type), s.data);
    }
  }
  async upsertUser(e, t) {
    const s = `
      INSERT INTO users (user_id, nickname, avatar, manager_type, medal_level, medal_club, updated_at, raw_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET nickname=excluded.nickname, avatar=excluded.avatar, manager_type=excluded.manager_type, medal_level=excluded.medal_level, medal_club=excluded.medal_club, updated_at=excluded.updated_at, raw_json=excluded.raw_json
    `, r = e.medal || {}, n = [
      K(e.userID),
      G(e.nickname),
      G(e.avatar),
      K(e.managerType),
      K(r.level),
      G(r.clubName),
      Date.now(),
      Oe(t ?? e)
    ];
    await $(this.db, s, n);
  }
  async insertAction(e, t, s) {
    const r = String(s.actionType || ""), n = K(s.danmuInfo?.sendTime), i = K(s.danmuInfo?.userInfo?.userID);
    let o = null, a = 0, c = 0, d = null;
    if (r === "comment")
      o = G(s.content) || null;
    else if (r === "gift") {
      a = K(s.count), c = K(s.value);
      const v = G(s.giftDetail?.giftName) || "", _ = String(c / 1e4), b = a > 0 ? String(a) : "1";
      o = `送出${v}${b}个价值${_}元`, d = s.giftDetail && s.giftDetail.pngPic ? G(s.giftDetail.pngPic) : null;
    } else r === "throwBanana" ? a = K(s.bananaCount) : r === "richText" ? d = Oe(s.segments) : r === "shareLive" ? d = JSON.stringify({ platform: K(s.sharePlatform) }) : r === "joinClub" && (d = Oe(s.fansInfo));
    const f = `
      INSERT OR IGNORE INTO live_actions (live_id, liver_id, user_id, action_type, send_time, content, quantity, value_amount, extra_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, w = [G(e), G(t), i, r, n, o, a, c, d];
    if (await new Promise((v, _) => {
      this.db.run(f, w, (b) => b ? _(b) : v());
    }), r === "gift") {
      const v = await new Promise((b, h) => {
        const u = "SELECT id FROM live_actions WHERE live_id = ? AND liver_id IS ? AND user_id = ? AND action_type = ? AND send_time = ? AND content IS ? LIMIT 1", l = [G(e), t == null ? null : G(t), i, r, n, o];
        this.db.get(u, l, (y, E) => y ? h(y) : b(E));
      }), _ = v?.id ? K(v.id) : 0;
      if (_ > 0) {
        const b = K(s.combo), h = G(s.comboID) || null, u = K(s.giftDetail?.giftID), l = G(s.giftDetail?.giftName) || null, y = K(s.giftDetail?.price), E = K(s.giftDetail?.payWalletType), p = K(s.giftDetail?.canCombo ? 1 : 0), A = K(s.giftDetail?.canDraw ? 1 : 0), T = `
          INSERT INTO live_gifts (action_id, live_id, liver_id, user_id, send_time, count, combo, value, combo_id, gift_id, gift_name, price, pay_wallet_type, can_combo, can_draw)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(action_id) DO UPDATE SET count=excluded.count, combo=excluded.combo, value=excluded.value, combo_id=excluded.combo_id, gift_id=excluded.gift_id, gift_name=excluded.gift_name, price=excluded.price, pay_wallet_type=excluded.pay_wallet_type, can_combo=excluded.can_combo, can_draw=excluded.can_draw
        `, k = [_, G(e), G(t), i, n, a, b, c, h, u, l, y, E, p, A];
        await new Promise((D, N) => {
          this.db.run(T, k, (H) => H ? N(H) : D());
        });
      }
    }
  }
  async insertState(e, t, s, r) {
    if (s === "topUsers")
      return;
    if (s === "bananaCount" || s === "displayInfo") {
      const o = Date.now(), a = o - 6e4, c = await new Promise((d, f) => {
        const w = "SELECT report_time FROM live_states WHERE live_id = ? AND state_type = ? ORDER BY report_time DESC LIMIT 1", v = [G(e), s];
        this.db.get(w, v, (_, b) => _ ? f(_) : d(b));
      });
      if (c && c.report_time && c.report_time > a)
        return;
      if (s === "bananaCount") {
        const d = "INSERT INTO live_states (live_id, liver_id, report_time, state_type, metric_main) VALUES (?, ?, ?, ?, ?)", f = [G(e), G(t), o, s, K(r)];
        await $(this.db, d, f);
        return;
      }
      if (s === "displayInfo") {
        const d = gt(r?.watchingCount), f = gt(r?.likeCount), w = "INSERT INTO live_states (live_id, liver_id, report_time, state_type, metric_main, metric_sub, raw_data) VALUES (?, ?, ?, ?, ?, ?, ?)", v = [G(e), G(t), o, s, d, f, Oe(r)];
        await $(this.db, w, v);
        return;
      }
    }
    const n = "INSERT INTO live_states (live_id, liver_id, report_time, state_type, raw_data) VALUES (?, ?, ?, ?, ?)", i = [G(e), G(t), Date.now(), s, Oe(r)];
    await $(this.db, n, i);
  }
}
function K(g) {
  const e = Number(g);
  return Number.isFinite(e) ? Math.trunc(e) : 0;
}
function G(g) {
  return g == null ? "" : String(g);
}
function Oe(g) {
  try {
    return g == null ? null : JSON.stringify(g);
  } catch {
    return null;
  }
}
function gt(g) {
  if (g == null) return 0;
  const e = String(g).trim();
  if (!e) return 0;
  const t = e.match(/^([0-9]+(?:\.[0-9]+)?)(\s*万)?$/);
  if (!t) {
    const n = Number(e);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }
  const s = Number(t[1]), r = !!t[2];
  return Math.trunc(s * (r ? 1e4 : 1));
}
function Xe(g, e = 8) {
  const t = [{ v: g, d: 0 }], s = /* @__PURE__ */ new WeakSet();
  for (; t.length > 0; ) {
    const { v: r, d: n } = t.pop();
    if (r == null || n > e) continue;
    if (typeof r === "object") {
      if (s.has(r)) continue;
      try {
        s.add(r);
      } catch {
      }
      if (Array.isArray(r))
        for (const o of r)
          o && typeof o == "object" && t.push({ v: o, d: n + 1 });
      else {
        if (Object.prototype.hasOwnProperty.call(r, "medal") && r.medal && typeof r.medal == "object")
          return r;
        for (const o of Object.keys(r)) {
          const a = r[o];
          a && typeof a == "object" && t.push({ v: a, d: n + 1 });
        }
      }
    }
  }
  return null;
}
class Gt {
  db = null;
  dbPath;
  constructor(e) {
    if (e)
      this.dbPath = e;
    else if (process.env.ACFUN_TEST_DB_PATH)
      this.dbPath = process.env.ACFUN_TEST_DB_PATH;
    else
      try {
        const t = R.getPath("userData");
        this.dbPath = I.join(t, "events.db");
      } catch (t) {
        console.warn("Failed to get userData path, using temp directory:", t), this.dbPath = I.join(_e.tmpdir(), "acfun-events.db");
      }
  }
  async initialize() {
    return new Promise((e, t) => {
      this.db = new kt.Database(this.dbPath, (s) => {
        s ? (console.error("Error opening database:", s.message), t(s)) : (console.info("[DB] path=" + String(this.dbPath)), this.applyPragma().then(() => this.createTables()).then(() => e()).catch(t));
      });
    });
  }
  async createTables() {
    return new Promise((e, t) => {
      if (!this.db) {
        t(new Error("Database not initialized"));
        return;
      }
      const s = "DROP TABLE IF EXISTS events;", r = `
        CREATE TABLE IF NOT EXISTS rooms_meta (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          live_id TEXT,
          room_id TEXT,
          streamer_name TEXT,
          streamer_user_id TEXT,
          title TEXT,
          cover_url TEXT,
          status TEXT,
          is_live INTEGER,
          viewer_count INTEGER,
          online_count INTEGER,
          like_count INTEGER,
          live_cover TEXT,
          category_id TEXT,
          category_name TEXT,
          sub_category_id TEXT,
          sub_category_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `, n = [
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_meta_live_id ON rooms_meta (live_id)",
        "CREATE INDEX IF NOT EXISTS idx_rooms_meta_streamer_name ON rooms_meta (streamer_name)",
        "CREATE INDEX IF NOT EXISTS idx_rooms_meta_created_at ON rooms_meta (created_at)",
        "CREATE INDEX IF NOT EXISTS idx_rooms_meta_live_created ON rooms_meta (live_id, created_at)"
      ], i = [];
      this.db.serialize(() => {
        this.db.run(s, () => {
          this.db.run(r, (o) => {
            if (o) {
              console.error("Error creating rooms_meta table:", o.message), t(o);
              return;
            }
            i.forEach((c) => {
              this.db.run(c, () => {
              });
            });
            let a = null;
            for (const c of n)
              this.db.run(c, (d) => {
                d && !a && (a = d);
              });
            a ? (console.error("Error creating indexes:", a), t(a)) : Vt(this.db).then(() => {
              console.log("Events table and indexes created/verified"), e();
            }).catch(t);
          });
        });
      });
    });
  }
  getDb() {
    if (!this.db)
      throw new Error("Database not initialized. Call initialize() first.");
    return this.db;
  }
  getPath() {
    return this.dbPath;
  }
  async close() {
    return new Promise((e, t) => {
      if (!this.db) {
        e();
        return;
      }
      this.db.close((s) => {
        s ? (console.error("Error closing database:", s.message), t(s)) : (console.log("Database connection closed"), this.db = null, e());
      });
    });
  }
  async applyPragma() {
    return new Promise((e) => {
      if (!this.db) {
        e();
        return;
      }
      try {
        this.db.run("PRAGMA journal_mode=WAL"), this.db.run("PRAGMA synchronous=NORMAL"), this.db.run("PRAGMA busy_timeout=3000"), this.db.run("PRAGMA temp_store=MEMORY"), this.db.run("PRAGMA journal_size_limit=10485760"), e();
      } catch {
        e();
      }
    });
  }
  async vacuum() {
    return new Promise((e, t) => {
      if (!this.db) {
        t(new Error("Database not initialized"));
        return;
      }
      this.db.run("VACUUM", (s) => {
        s ? (console.error("Error vacuuming database:", s.message), t(s)) : (console.log("Database vacuumed successfully"), e());
      });
    });
  }
}
class De {
  static instance = null;
  subscribers = /* @__PURE__ */ new Map();
  queues = /* @__PURE__ */ new Map();
  lastId = 0;
  // Default cap; per-kind caps are applied via getQueueLimit().
  maxQueueSizePerChannel = 1e3;
  persistDir;
  cleanupTimer;
  maxFileSizeBytes = 5 * 1024 * 1024;
  maxRotatedFilesPerChannel = 5;
  static getInstance() {
    return De.instance || (De.instance = new De()), De.instance;
  }
  constructor() {
    try {
      const e = R.getPath("userData");
      this.persistDir = I.join(e, "message-center");
    } catch {
      this.persistDir = I.join(process.cwd(), ".message-center");
    }
    if (!S.existsSync(this.persistDir))
      try {
        S.mkdirSync(this.persistDir, { recursive: !0 });
      } catch {
      }
    this.cleanupTimer = setInterval(() => this.cleanupExpired(), 1e4);
  }
  getQueueLimit(e, t) {
    const s = String(e || ""), r = String(t?.kind || "").trim().toLowerCase(), n = this.hasSubscribers(s);
    return r === "danmaku" ? n ? 200 : 60 : r === "room" || r === "lifecycle" ? 200 : r === "log" ? 500 : r === "heartbeat" ? 50 : r === "config" || r === "shortcut" || r === "readonly-store" || r === "renderer-store" ? 200 : r === "mainMessage" || r === "uiMessage" || r === "ui" ? 500 : s.includes(":overlay") ? n ? 200 : 60 : s.includes("system:logs") ? 500 : this.maxQueueSizePerChannel;
  }
  /** Publish a message to a channel */
  publish(e, t, s = {}) {
    const r = Date.now(), n = String(++this.lastId), i = s.ttlMs, o = {
      id: n,
      channel: e,
      payload: t,
      createdAt: r,
      ttlMs: i,
      expireAt: typeof i == "number" ? r + i : void 0,
      meta: s.meta || void 0
    }, a = this.queues.get(e) || [];
    a.push(o);
    const c = Math.max(0, Math.floor(this.getQueueLimit(e, o.meta)));
    c > 0 && a.length > c ? a.splice(0, a.length - c) : c === 0 && a.splice(0, a.length), this.queues.set(e, a);
    const d = this.subscribers.get(e);
    if (d && d.size > 0)
      for (const f of d)
        try {
          f(o);
        } catch {
        }
    if (s.persist) {
      const f = this.getChannelFile(e);
      try {
        this.ensureRotate(e, f), S.promises.appendFile(f, JSON.stringify(o) + `
`).catch(() => {
        });
      } catch {
      }
    }
    return o;
  }
  /** Subscribe to a channel; caller can optionally replay sinceId */
  subscribe(e, t, s) {
    let r = this.subscribers.get(e);
    if (r || (r = /* @__PURE__ */ new Set(), this.subscribers.set(e, r)), r.add(t), s) {
      const n = this.queues.get(e) || [], i = n.findIndex((a) => a.id === s), o = i >= 0 ? n.slice(i + 1) : n;
      for (const a of o)
        try {
          t(a);
        } catch {
        }
    }
    return () => {
      const n = this.subscribers.get(e);
      n && (n.delete(t), n.size === 0 && this.subscribers.delete(e));
    };
  }
  /** Get recent messages for a channel, optionally after an id */
  getRecent(e, t) {
    const s = this.queues.get(e) || [];
    if (!t) return s.slice();
    const r = s.findIndex((n) => n.id === t);
    return r >= 0 ? s.slice(r + 1) : s.slice();
  }
  hasSubscribers(e) {
    const t = this.subscribers.get(e);
    return !!t && t.size > 0;
  }
  /** Get snapshot stats for diagnostics (best-effort, may be approximate). */
  getStats(e) {
    const t = Math.max(
      0,
      Number(e?.sampleMessagesPerChannel ?? 6)
    ), s = /* @__PURE__ */ new Set();
    for (const a of this.queues.keys()) s.add(a);
    for (const a of this.subscribers.keys()) s.add(a);
    const r = [];
    let n = 0, i = 0, o = !0;
    for (const a of Array.from(s.values())) {
      const c = this.queues.get(a) || [], d = c.length;
      n += d;
      const f = d > 0 ? c[0] : void 0, w = d > 0 ? c[d - 1] : void 0;
      let v;
      if (t > 0 && d > 0)
        try {
          const _ = Math.min(t, d), b = Math.max(0, d - _);
          let h = 0;
          for (let l = b; l < d; l++) {
            const y = c[l], E = JSON.stringify(y?.payload ?? null);
            h += Buffer.byteLength(E, "utf8");
          }
          const u = h / _;
          v = Math.round(u * d), i += v;
        } catch {
          o = !1, v = void 0;
        }
      r.push({
        channel: a,
        hasSubscribers: this.hasSubscribers(a),
        queueLength: d,
        oldest: f ? { id: String(f.id), createdAt: Number(f.createdAt) } : void 0,
        newest: w ? { id: String(w.id), createdAt: Number(w.createdAt) } : void 0,
        approxQueueBytes: v
      });
    }
    return r.sort((a, c) => a.channel.localeCompare(c.channel)), {
      totals: {
        channelCount: r.length,
        queuedMessages: n,
        approxQueuedBytes: o ? i : void 0
      },
      channels: r
    };
  }
  /** For config introspection (diagnostics). */
  getConfigSnapshot() {
    return {
      maxQueueSizePerChannel: this.maxQueueSizePerChannel,
      maxFileSizeBytes: this.maxFileSizeBytes,
      maxRotatedFilesPerChannel: this.maxRotatedFilesPerChannel,
      persistDir: this.persistDir
    };
  }
  /** Append a heartbeat message (not persisted) */
  heartbeat(e) {
    return this.publish(e, { type: "heartbeat" }, { ttlMs: 3e4, persist: !1, meta: { kind: "heartbeat" } });
  }
  /** Periodic cleanup of expired messages per TTL */
  cleanupExpired() {
    const e = Date.now();
    for (const [t, s] of this.queues.entries()) {
      const r = s.filter((n) => !n.expireAt || n.expireAt > e);
      r.length !== s.length && this.queues.set(t, r);
    }
  }
  /** Resolve per-channel persistence file */
  getChannelFile(e) {
    const t = e.replace(/[^a-zA-Z0-9._-]/g, "_");
    return I.join(this.persistDir, `${t}.jsonl`);
  }
  ensureRotate(e, t) {
    try {
      const s = S.existsSync(t) ? S.statSync(t) : null;
      if (s && s.size >= this.maxFileSizeBytes) {
        const r = I.basename(t, ".jsonl"), n = I.dirname(t), i = Date.now(), o = I.join(n, `${r}.${i}.jsonl`);
        try {
          S.renameSync(t, o);
        } catch {
        }
        try {
          S.writeFileSync(t, "");
        } catch {
        }
        const a = `${r}.`, d = S.readdirSync(n).filter((f) => f.startsWith(a) && f.endsWith(".jsonl")).map((f) => ({ f, mtime: S.statSync(I.join(n, f)).mtimeMs })).sort((f, w) => w.mtime - f.mtime).slice(this.maxRotatedFilesPerChannel);
        for (const f of d)
          try {
            S.unlinkSync(I.join(n, f.f));
          } catch {
          }
      }
    } catch {
    }
  }
}
const ie = {
  getInstance: () => De.getInstance()
};
class Xt {
  logDir;
  maxFileSize = 10 * 1024 * 1024;
  // 10MB
  maxFiles = 5;
  recentLogs = [];
  maxRecentLogs = 1e3;
  currentLogFile;
  currentFileSize = 0;
  dataManager = ie.getInstance();
  // 敏感信息脱敏模式
  sensitivePatterns = [
    /token["\s]*[:=]["\s]*[^"\s,}]+/gi,
    /auth["\s]*[:=]["\s]*[^"\s,}]+/gi,
    /cookie["\s]*[:=]["\s]*[^"\s,}]+/gi,
    /password["\s]*[:=]["\s]*[^"\s,}]+/gi,
    /secret["\s]*[:=]["\s]*[^"\s,}]+/gi,
    /authorization["\s]*[:=]["\s]*[^"\s,}]+/gi,
    /bearer\s+[a-zA-Z0-9._-]+/gi,
    /acfun[_-]?token["\s]*[:=]["\s]*[^"\s,}]+/gi
  ];
  constructor() {
    this.logDir = I.join(R.getPath("userData"), "logs"), this.ensureLogDirectory(), this.currentLogFile = this.getCurrentLogFile(), this.initializeCurrentFileSize();
  }
  ensureLogDirectory() {
    S.existsSync(this.logDir) || S.mkdirSync(this.logDir, { recursive: !0 });
  }
  getCurrentLogFile() {
    const e = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    return I.join(this.logDir, `app-${e}.log`);
  }
  initializeCurrentFileSize() {
    try {
      if (S.existsSync(this.currentLogFile)) {
        const e = S.statSync(this.currentLogFile);
        this.currentFileSize = e.size;
      } else
        this.currentFileSize = 0;
    } catch {
      this.currentFileSize = 0;
    }
  }
  rotateLogFiles() {
    try {
      const e = S.readdirSync(this.logDir).filter((t) => t.startsWith("app-") && t.endsWith(".log")).map((t) => ({
        name: t,
        path: I.join(this.logDir, t),
        mtime: S.statSync(I.join(this.logDir, t)).mtime
      })).sort((t, s) => s.mtime.getTime() - t.mtime.getTime());
      e.length >= this.maxFiles && e.slice(this.maxFiles - 1).forEach((s) => {
        try {
          S.unlinkSync(s.path);
        } catch (r) {
          console.error(`Failed to delete old log file ${s.name}:`, r);
        }
      }), this.currentLogFile = this.getCurrentLogFile(), this.currentFileSize = 0;
    } catch (e) {
      console.error("Failed to rotate log files:", e);
    }
  }
  sanitizeMessage(e) {
    let t = e;
    return this.sensitivePatterns.forEach((s) => {
      t = t.replace(s, (r) => {
        const n = r.split(/[:=]/);
        return n.length >= 2 ? `${n[0]}:***REDACTED***` : "***REDACTED***";
      });
    }), t;
  }
  addLog(e, t, s, r) {
    const n = (/* @__PURE__ */ new Date()).toISOString(), i = this.sanitizeMessage(t), o = {
      timestamp: n,
      level: s,
      source: e,
      message: i,
      correlationId: r
    };
    this.recentLogs.push(o), this.recentLogs.length > this.maxRecentLogs && this.recentLogs.shift();
    const a = r ? ` [${r}]` : "", c = `[${n}] [${s.toUpperCase()}] [${e}]${a} ${i}
`;
    this.writeToFile(c);
    try {
      this.dataManager.publish("system:logs", o, { ttlMs: 300 * 1e3, persist: !1, meta: { kind: "system-log" } });
    } catch {
    }
  }
  writeToFile(e) {
    try {
      this.currentFileSize + Buffer.byteLength(e, "utf8") > this.maxFileSize && this.rotateLogFiles(), S.appendFileSync(this.currentLogFile, e, "utf8"), this.currentFileSize += Buffer.byteLength(e, "utf8");
    } catch (t) {
      console.error("Failed to write to log file:", t);
    }
  }
  getRecentLogs(e = 100) {
    return this.recentLogs.slice(-e);
  }
  getLogFiles() {
    try {
      return S.readdirSync(this.logDir).filter((e) => e.startsWith("app-") && e.endsWith(".log")).map((e) => I.join(this.logDir, e)).sort((e, t) => {
        const s = S.statSync(e);
        return S.statSync(t).mtime.getTime() - s.mtime.getTime();
      });
    } catch (e) {
      return console.error("Failed to get log files:", e), [];
    }
  }
}
let Ke = null;
function ye() {
  return Ke || (Ke = new Xt()), Ke;
}
class Ee {
  store;
  constructor() {
    this.store = new Mt();
  }
  get(e, t) {
    return this.store.get(e, t);
  }
  set(e, t) {
    this.store.set(e, t);
  }
  getAll() {
    const e = this.store.store;
    return e ? { ...e } : {};
  }
  setAll(e) {
    for (const [t, s] of Object.entries(e))
      this.store.set(t, s);
  }
  delete(e) {
    this.store.delete(e);
  }
}
class te extends ce {
  /** 单例实例 */
  static instance = null;
  /** 密钥文件存储路径 */
  secretsPath;
  /** 统一的 AcFun Live API 实例 */
  api;
  /** 令牌刷新定时器 */
  tokenRefreshTimer;
  /** 当前令牌信息 */
  tokenInfo = null;
  /** 日志管理器 */
  logManager;
  configManager;
  /** 是否正在刷新令牌 */
  isRefreshing = !1;
  /** 是否已初始化 */
  initialized = !1;
  /** 当前二维码登录会话状态 */
  qrSession = {
    active: !1,
    cancelled: !1,
    expireAt: void 0,
    sessionId: void 0
  };
  /**
   * 私有构造函数（单例模式）
   * @param customSecretsPath 自定义密钥文件路径（可选，主要用于测试）
   * @param apiConfig 自定义API配置（可选）
   */
  constructor(e, t) {
    super();
    const s = {
      timeout: 3e4,
      retryCount: 3,
      baseUrl: "https://api-new.acfunchina.com",
      headers: {
        "User-Agent": "AcFun-Live-Toolbox/2.0"
      },
      ...t
    };
    if (this.api = Pt(s), this.logManager = ye(), this.configManager = new Ee(), e)
      this.secretsPath = e;
    else
      try {
        this.secretsPath = x.join(R.getPath("userData"), "secrets.json");
      } catch {
        this.secretsPath = x.join(require("os").tmpdir(), "secrets.json");
      }
  }
  /**
   * 获取 TokenManager 单例实例
   * @param customSecretsPath 自定义密钥文件路径（仅在首次创建时有效）
   * @param apiConfig 自定义API配置（仅在首次创建时有效）
   * @returns TokenManager 实例
   */
  static getInstance(e, t) {
    return te.instance || (te.instance = new te(e, t)), te.instance;
  }
  /**
   * 初始化 TokenManager
   * 加载保存的令牌信息并启动刷新定时器
   */
  async initialize() {
    if (!this.initialized)
      try {
        await this.loadTokenInfo(), this.startTokenRefreshTimer(), this.initialized = !0, this.logManager.addLog("TokenManager", "Initialized successfully", "info");
      } catch (e) {
        throw this.logManager.addLog(
          "TokenManager",
          `Initialization failed: ${e instanceof Error ? e.message : String(e)}`,
          "error"
        ), e;
      }
  }
  /**
   * 获取统一的 API 实例
   * 这是整个应用程序获取 AcFunLiveApi 实例的唯一入口
   * @returns AcFunLiveApi 实例
   */
  getApiInstance() {
    return this.api;
  }
  /**
   * 检查是否已认证
   * @returns 是否已认证
   */
  isAuthenticated() {
    return !this.tokenInfo || this.tokenInfo.expiresAt && this.tokenInfo.expiresAt <= Date.now() ? !1 : this.tokenInfo.isValid !== !1;
  }
  /**
   * 获取当前令牌信息
   * @returns 当前令牌信息或 null
   */
  async getTokenInfo() {
    return this.tokenInfo || await this.loadTokenInfo(), this.tokenInfo;
  }
  /**
   * 使用二维码登录 - 获取二维码
   * @returns 登录结果
   */
  async loginWithQRCode() {
    try {
      const e = await this.api.auth.qrLogin();
      if (!e?.success || !e?.data) {
        const c = e?.error || "Failed to initiate QR login";
        return this.emit("loginFailed", { error: c }), { success: !1, error: c };
      }
      const t = e.data, s = t?.qrCode ?? t?.qrImage ?? t?.image ?? t?.qr, r = t?.expiresIn ?? t?.expireIn ?? t?.expire, n = t?.sessionId;
      let i;
      if (typeof s == "string")
        /^data:image\/(png|jpeg);base64,/i.test(s) ? i = s : i = `data:image/png;base64,${s}`;
      else if (s && Buffer.isBuffer(s))
        i = `data:image/png;base64,${s.toString("base64")}`;
      else if (typeof t?.qrCodeUrl == "string" && t.qrCodeUrl.length > 0)
        i = t.qrCodeUrl;
      else {
        const c = "Invalid QR code payload";
        return this.emit("loginFailed", { error: c }), { success: !1, error: c };
      }
      const o = typeof r == "number" && r > 0 ? r > 1e4 ? Math.floor(r / 1e3) : r : 300, a = { qrCodeDataUrl: i, expiresIn: o, sessionId: n };
      return this.qrSession = {
        active: !0,
        cancelled: !1,
        expireAt: typeof o == "number" ? Date.now() + o * 1e3 : void 0,
        sessionId: n
      }, this.emit("qrCodeReady", { qrCode: a }), { success: !0, qrCode: a };
    } catch (e) {
      const t = `QR login failed: ${e instanceof Error ? e.message : String(e)}`;
      return this.logManager.addLog("TokenManager", t, "error"), this.emit("loginFailed", { error: t }), { success: !1, error: t };
    }
  }
  /**
   * 检查二维码登录状态
   * @returns 登录状态检查结果
   */
  async checkQRLoginStatus() {
    try {
      if (this.qrSession.cancelled)
        return this.logManager.addLog("TokenManager", "QR login cancelled by user", "info"), this.qrSession.active = !1, { success: !1, error: "cancelled" };
      if (this.qrSession.expireAt && Date.now() >= this.qrSession.expireAt)
        return this.logManager.addLog("TokenManager", "QR login session expired", "info"), this.qrSession.active = !1, { success: !1, error: "expired" };
      const e = await (this.api.auth.checkQrLoginStatus?.(this.qrSession.sessionId) ?? this.api.auth.checkQrLoginStatus());
      if (e?.success && e?.data) {
        const s = e.data, r = s.tokenInfo || {}, n = {
          userID: r.userID || s.userId || "",
          securityKey: r.securityKey || "",
          serviceToken: r.serviceToken || (typeof s.token == "string" ? s.token : ""),
          deviceID: r.deviceID || r.deviceId || "",
          cookies: Array.isArray(r.cookies) ? r.cookies : [],
          expiresAt: s.expiresAt || Date.now() + 1440 * 60 * 1e3,
          isValid: !0
        };
        return await this.setTokenInfo(n), this.emit("loginSuccess", { tokenInfo: n }), this.logManager.addLog("TokenManager", "Login successful", "info"), this.qrSession.active = !1, { success: !0, tokenInfo: n };
      }
      return { success: !1, error: e?.error || "No token info received" };
    } catch (e) {
      const t = `Check QR login status failed: ${e instanceof Error ? e.message : String(e)}`;
      return this.logManager.addLog("TokenManager", t, "error"), { success: !1, error: t };
    }
  }
  /**
   * 完成二维码登录流程，返回当前令牌信息
   */
  async finalizeQrLogin() {
    try {
      const e = await this.getTokenInfo();
      return e && e.userID ? { success: !0, tokenInfo: e } : { success: !1, error: "not_authenticated" };
    } catch (e) {
      const t = `Finalize QR login failed: ${e instanceof Error ? e.message : String(e)}`;
      return this.logManager.addLog("TokenManager", t, "error"), { success: !1, error: t };
    }
  }
  /**
   * 取消当前二维码登录会话
   */
  cancelQrLogin() {
    return this.qrSession.cancelled = !0, this.qrSession.active = !1, this.emit("loginFailed", { error: "cancelled" }), { success: !0 };
  }
  /**
   * 刷新令牌
   * @returns 刷新结果
   */
  async refreshToken() {
    if (this.isRefreshing)
      return { success: !1, message: "Token refresh already in progress" };
    this.isRefreshing = !0;
    try {
      if (!this.tokenInfo)
        return {
          success: !1,
          qrCode: (await this.loginWithQRCode()).qrCode,
          message: "No existing token, please login again"
        };
      const e = this.api.auth.refreshToken;
      if (typeof e != "function")
        return {
          success: !1,
          qrCode: (await this.loginWithQRCode()).qrCode,
          message: "Token refresh unsupported, please login again"
        };
      const t = await e.call(this.api.auth);
      if (t?.success && t?.data) {
        const s = {
          ...this.tokenInfo,
          serviceToken: t.data.serviceToken || this.tokenInfo.serviceToken,
          expiresAt: t.data.expiresAt || Date.now() + 864e5,
          isValid: !0
        };
        return await this.setTokenInfo(s), this.logManager.addLog("TokenManager", "Token refreshed successfully", "info"), { success: !0, message: "Token refreshed successfully" };
      } else
        return {
          success: !1,
          qrCode: (await this.loginWithQRCode()).qrCode,
          message: "Token refresh failed, please login again"
        };
    } catch (e) {
      return this.logManager.addLog(
        "TokenManager",
        `Token refresh error: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      ), {
        success: !1,
        qrCode: (await this.loginWithQRCode()).qrCode,
        message: `Token refresh error: ${e instanceof Error ? e.message : String(e)}`
      };
    } finally {
      this.isRefreshing = !1;
    }
  }
  /**
   * 登出
   */
  async logout() {
    try {
      await this.clearTokenInfo(), this.tokenRefreshTimer && (clearTimeout(this.tokenRefreshTimer), this.tokenRefreshTimer = void 0), this.emit("logout"), this.logManager.addLog("TokenManager", "Logged out successfully", "info");
    } catch (e) {
      throw this.logManager.addLog(
        "TokenManager",
        `Logout error: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      ), e;
    }
  }
  /**
   * 设置令牌信息
   * @param tokenInfo 令牌信息
   */
  async setTokenInfo(e) {
    const t = this.isAuthenticated();
    this.tokenInfo = e, console.log("[TokenManager] setTokenInfo", {
      userID: e.userID,
      deviceID: e.deviceID,
      serviceTokenPresent: !!e.serviceToken,
      cookiesCount: Array.isArray(e.cookies) ? e.cookies.length : 0,
      cookieNames: Array.isArray(e.cookies) ? e.cookies.map((n) => n.name) : []
    }), !!this.configManager.get("auth.keepLogin", !0) && await this.saveTokenInfo(e);
    try {
      const n = e.deviceID && e.deviceID.length > 0 ? e.deviceID : Array.from({ length: 32 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(""), i = JSON.stringify({
        userID: e.userID,
        securityKey: e.securityKey,
        serviceToken: e.serviceToken,
        deviceID: n,
        cookies: Array.isArray(e.cookies) ? e.cookies : []
      });
      this.api.setAuthToken(i);
    } catch (n) {
      this.logManager.addLog(
        "TokenManager",
        `Failed to apply token to API instance: ${n instanceof Error ? n.message : String(n)}`,
        "error"
      );
    }
    this.startTokenRefreshTimer();
    const r = this.isAuthenticated();
    t !== r && this.emit("tokenStateChanged", { isAuthenticated: r, tokenInfo: e });
  }
  /**
   * 加载令牌信息
   */
  async loadTokenInfo() {
    try {
      if (!!!this.configManager.get("auth.keepLogin", !0)) return;
      if (Se.existsSync(this.secretsPath)) {
        const t = Se.readFileSync(this.secretsPath, "utf8"), s = JSON.parse(t);
        if (s && s.userID) {
          this.tokenInfo = { ...s, isValid: !0 }, this.logManager.addLog("TokenManager", "Token info loaded from file", "info");
          const r = this.tokenInfo;
          await this.setTokenInfo(r);
        }
      }
    } catch (e) {
      this.logManager.addLog(
        "TokenManager",
        `Failed to load token info: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      );
    }
  }
  /**
   * 保存令牌信息到文件
   * @param tokenInfo 令牌信息
   */
  async saveTokenInfo(e) {
    try {
      const t = x.dirname(this.secretsPath);
      Se.existsSync(t) || Se.mkdirSync(t, { recursive: !0 }), Se.writeFileSync(this.secretsPath, JSON.stringify(e, null, 2), "utf8"), this.logManager.addLog("TokenManager", "Token info saved to file", "info");
    } catch (t) {
      throw this.logManager.addLog(
        "TokenManager",
        `Failed to save token info: ${t instanceof Error ? t.message : String(t)}`,
        "error"
      ), t;
    }
  }
  /**
   * 清除令牌信息
   */
  async clearStoredTokenInfo() {
    try {
      Se.existsSync(this.secretsPath) && Se.unlinkSync(this.secretsPath);
    } catch (e) {
      this.logManager.addLog(
        "TokenManager",
        `Failed to clear token info file: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      );
    }
  }
  /**
   * 公开：清除令牌信息，并同步清理 API 认证
   */
  async clearTokenInfo() {
    const e = this.isAuthenticated();
    this.tokenInfo = null, await this.clearStoredTokenInfo();
    try {
      this.api.clearAuthToken();
    } catch (t) {
      this.logManager.addLog(
        "TokenManager",
        `Failed to clear token from API instance: ${t instanceof Error ? t.message : String(t)}`,
        "error"
      );
    }
    e && this.emit("tokenStateChanged", { isAuthenticated: !1 });
  }
  /**
   * 公开：更新令牌信息（用于外部代理或插件写入）
   */
  async updateTokenInfo(e) {
    try {
      const t = typeof e == "string" ? JSON.parse(e) : e;
      if (!t || typeof t != "object")
        throw new Error("Invalid token info");
      const s = {
        userID: t.userID || "",
        securityKey: t.securityKey || "",
        serviceToken: t.serviceToken || "",
        deviceID: t.deviceID || "",
        cookies: t.cookies || [],
        expiresAt: t.expiresAt || Date.now() + 1440 * 60 * 1e3,
        isValid: t.isValid !== !1
      };
      await this.setTokenInfo(s);
    } catch (t) {
      throw this.logManager.addLog(
        "TokenManager",
        `Failed to update token info: ${t instanceof Error ? t.message : String(t)}`,
        "error"
      ), t;
    }
  }
  /**
   * 公开：验证令牌有效性（包含基础字段与过期时间）
   */
  async validateToken(e) {
    const t = e || this.tokenInfo;
    return t ? !t.serviceToken || typeof t.serviceToken != "string" ? { isValid: !1, reason: "Missing serviceToken" } : t.expiresAt && t.expiresAt <= Date.now() ? { isValid: !1, reason: "Token expired" } : { isValid: t.isValid !== !1 } : { isValid: !1, reason: "No token" };
  }
  /**
   * 启动令牌刷新定时器
   */
  startTokenRefreshTimer() {
    if (this.tokenRefreshTimer && clearTimeout(this.tokenRefreshTimer), !this.tokenInfo || !this.tokenInfo.expiresAt)
      return;
    const e = Date.now(), t = this.tokenInfo.expiresAt, s = t - e;
    if (s <= 0) {
      this.emit("tokenExpired", { message: "Token has expired" }), this.refreshToken();
      return;
    }
    const r = Math.max(0, s - 300 * 1e3);
    r > 0 ? setTimeout(() => {
      this.emit("tokenExpiring", {
        message: "Token will expire soon",
        expiresAt: t,
        timeRemaining: Math.max(0, t - Date.now())
      });
    }, r) : this.emit("tokenExpiring", {
      message: "Token will expire soon",
      expiresAt: t,
      timeRemaining: s
    });
    const n = Math.max(0, s - 60 * 1e3);
    this.tokenRefreshTimer = setTimeout(() => {
      this.refreshToken();
    }, n);
  }
  /**
   * 销毁 TokenManager 实例
   */
  destroy() {
    this.tokenRefreshTimer && (clearTimeout(this.tokenRefreshTimer), this.tokenRefreshTimer = void 0), this.removeAllListeners(), this.initialized = !1, te.instance = null;
  }
  /**
   * 获取令牌剩余时间（毫秒）
   * @returns 剩余时间，如果没有令牌或已过期返回0
   */
  async getTokenRemainingTime() {
    return !this.tokenInfo || !this.tokenInfo.expiresAt ? 0 : Math.max(0, this.tokenInfo.expiresAt - Date.now());
  }
  /**
   * 检查令牌是否即将过期
   * @param thresholdMinutes 阈值分钟数，默认5分钟
   * @returns 是否即将过期
   */
  async isTokenExpiringSoon(e = 5) {
    const t = await this.getTokenRemainingTime();
    return t > 0 && t <= e * 60 * 1e3;
  }
}
const Kt = [
  "danmaku",
  "gift",
  "follow",
  "like",
  "enter",
  "system",
  "shareLive",
  "richText",
  "recentComment",
  "bananaCount",
  "displayInfo",
  "topUsers",
  "redpackList",
  "chatCall",
  "chatAccept",
  "chatReady",
  "chatEnd",
  "kickedOut",
  "violationAlert",
  "managerState",
  "end"
], Qt = [
  {
    name: "timestamp_valid",
    validate: (g) => {
      const e = Date.now(), t = Number(g.ts);
      return t > e - 1440 * 60 * 1e3 && t < e + 3600 * 1e3;
    },
    errorMessage: "Event timestamp is outside valid range"
  },
  {
    name: "room_id_valid",
    validate: (g) => typeof g.room_id == "string" && g.room_id.length > 0 && g.room_id.length <= 128,
    errorMessage: "Room ID is invalid or too long"
  },
  {
    name: "source_valid",
    validate: (g) => ["acfun", "bilibili", "douyu", "huya", "unknown"].includes(g.source),
    errorMessage: "Event source is not recognized"
  },
  {
    name: "user_info_consistent",
    validate: (g) => g.event_type === "system" ? !0 : !(g.user_id && !g.user_name),
    errorMessage: "User information is inconsistent"
  },
  {
    name: "content_appropriate",
    validate: (g) => g.content ? g.content.length > 1e3 ? !1 : !/(.)\1{20,}/.test(g.content) : !0,
    errorMessage: "Event content is inappropriate or too long"
  }
], wt = [];
function Jt(g) {
  const e = String(g || "").toLowerCase(), t = e === "comment" || e === "danmaku" ? "danmaku" : e === "gift" ? "gift" : e === "follow" ? "follow" : e === "like" ? "like" : e === "enter" ? "enter" : e === "bananacount" ? "bananaCount" : e === "displayinfo" ? "displayInfo" : e === "topusers" ? "topUsers" : e === "redpacklist" ? "redpackList" : e === "sharelive" ? "shareLive" : e === "richtext" ? "richText" : e === "recentcomment" ? "recentComment" : e === "chatcall" ? "chatCall" : e === "chataccept" ? "chatAccept" : e === "chatready" ? "chatReady" : e === "chatend" ? "chatEnd" : e === "kickedout" ? "kickedOut" : e === "violationalert" ? "violationAlert" : e === "managerstate" ? "managerState" : e === "end" ? "end" : "system";
  return Kt.includes(t) ? t : "system";
}
function Fe(g, e = 500) {
  if (g == null) return null;
  let t = String(g);
  return t = t.replace(/[\u0000-\u001F\u007F]/g, "").trim(), t ? (t.length > e && (t = t.slice(0, e)), t) : null;
}
function Yt(g, e = Qt) {
  const t = [];
  for (const s of e)
    try {
      s.validate(g) || t.push(`${s.name}: ${s.errorMessage}`);
    } catch (r) {
      t.push(`${s.name}: Validation rule failed with error: ${r}`);
    }
  return {
    isValid: t.length === 0,
    errors: t
  };
}
function Zt(g, e = wt) {
  return { passed: !0, failedFilters: [] };
}
function es(g) {
  let e = 100;
  g.room_id || (e -= 20), !g.user_id && g.event_type !== "system" && (e -= 15), !g.user_name && g.event_type !== "system" && (e -= 10), !g.content && g.event_type === "danmaku" && (e -= 25);
  const t = Date.now(), s = Math.abs(t - g.ts);
  if (s > 60 * 1e3 && (e -= 5), s > 300 * 1e3 && (e -= 10), g.content) {
    const r = g.content.length;
    r < 2 && (e -= 5), r > 200 && (e -= 5), /(.)\1{5,}/.test(g.content) && (e -= 10);
  }
  return g.raw || (e -= 5), Math.max(0, Math.min(100, e));
}
function vt(g) {
  const e = Number(g.ts ?? Date.now()), t = Number.isFinite(e) ? e : Date.now(), s = Number(g.received_at ?? Date.now()), r = Number.isFinite(s) ? s : Date.now(), n = {
    ts: t,
    received_at: r,
    room_id: Fe(g.room_id, 128) || String(g.room_id || ""),
    source: Fe(g.source, 64) || "unknown",
    event_type: Jt(g.event_type),
    user_id: Fe(g.user_id, 128),
    user_name: Fe(g.user_name, 128),
    content: Fe(g.content, 500),
    raw: g.raw ?? null
  }, i = Yt(n);
  return i.isValid || console.warn("[EventNormalizer] Event validation failed:", i.errors, n), n;
}
class St extends ce {
  /** 连接池配置 */
  config;
  /** 连接映射表 */
  connections = /* @__PURE__ */ new Map();
  /** 按类型分组的连接ID集合 */
  connectionsByType = /* @__PURE__ */ new Map();
  /** 健康检查定时器 */
  healthCheckTimer = null;
  /** 清理定时器 */
  cleanupTimer = null;
  /** 熔断器是否开启 */
  circuitBreakerOpen = !1;
  /** 熔断器开启时间 */
  circuitBreakerOpenTime = null;
  /** 连续失败次数 */
  consecutiveFailures = 0;
  /** 请求时间记录（用于计算平均响应时间） */
  requestTimes = [];
  /** 连接统计信息 */
  stats;
  /**
   * 构造函数
   * @param config 连接池配置（可选，使用默认配置）
   */
  constructor(e = {}) {
    super(), this.config = {
      maxConnections: 50,
      maxConnectionsPerType: 20,
      connectionTimeout: 3e4,
      idleTimeout: 3e5,
      // 5 minutes
      apiRetryCount: 3,
      enableHealthCheck: !0,
      healthCheckInterval: 6e4,
      // 1 minute
      enableCircuitBreaker: !0,
      circuitBreakerThreshold: 5,
      circuitBreakerResetTimeout: 6e4,
      ...e
    }, this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      connectionsByType: {},
      averageConnectionAge: 0,
      healthCheckFailures: 0,
      circuitBreakerOpen: !1,
      totalRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    }, this.initializeTimers();
  }
  /**
   * 初始化定时器
   * 设置健康检查和清理定时器
   * @private
   */
  initializeTimers() {
    this.config.enableHealthCheck && (this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval)), this.cleanupTimer = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.config.idleTimeout / 2);
  }
  /**
   * 获取连接（带熔断器支持）
   * 
   * 此方法是连接池的核心功能，负责：
   * 1. 检查熔断器状态
   * 2. 验证连接池限制
   * 3. 尝试复用现有连接
   * 4. 创建新连接（如果需要）
   * 
   * @param type 连接类型
   * @param options 连接选项
   * @returns Promise<PooledConnection> 池化连接实例
   * @throws {ConnectionError} 当连接获取失败时抛出
   */
  async acquire(e, t = {}) {
    if (this.isCircuitBreakerOpen())
      throw this.createConnectionError(
        "Circuit breaker is open, rejecting requests",
        "SERVER_ERROR",
        !1
      );
    const s = Date.now();
    try {
      if (this.connections.size >= this.config.maxConnections)
        throw new Error("Connection pool is full");
      if ((this.connectionsByType.get(e) || /* @__PURE__ */ new Set()).size >= this.config.maxConnectionsPerType)
        throw new Error(`Too many connections of type: ${e}`);
      const n = this.findReusableConnection(e, t.roomId);
      if (n)
        return n.lastUsed = Date.now(), n.isActive = !0, this.updateStats(s), n;
      const i = await this.createConnection(e, t.roomId);
      return this.updateStats(s), i;
    } catch (r) {
      throw this.handleConnectionError(r), r;
    }
  }
  /**
   * 检查熔断器是否开启
   */
  isCircuitBreakerOpen() {
    return this.config.enableCircuitBreaker && this.circuitBreakerOpen && this.circuitBreakerOpenTime ? Date.now() - this.circuitBreakerOpenTime.getTime() >= this.config.circuitBreakerResetTimeout ? (this.resetCircuitBreaker(), !1) : !0 : !1;
  }
  /**
   * 重置熔断器
   */
  resetCircuitBreaker() {
    this.circuitBreakerOpen = !1, this.circuitBreakerOpenTime = null, this.consecutiveFailures = 0, this.stats.circuitBreakerOpen = !1, console.log("[AcfunApiConnectionPool] Circuit breaker reset");
  }
  /**
   * 处理连接错误
   */
  handleConnectionError(e) {
    this.stats.failedRequests++, this.consecutiveFailures++, this.config.enableCircuitBreaker && this.consecutiveFailures >= this.config.circuitBreakerThreshold && this.openCircuitBreaker();
  }
  /**
   * 开启熔断器
   */
  openCircuitBreaker() {
    this.circuitBreakerOpen = !0, this.circuitBreakerOpenTime = /* @__PURE__ */ new Date(), this.stats.circuitBreakerOpen = !0, console.log("[AcfunApiConnectionPool] Circuit breaker opened due to consecutive failures");
  }
  /**
   * 创建连接错误
   */
  createConnectionError(e, t, s, r) {
    const n = new Error(e);
    return n.type = t, n.retryable = s, n.connectionId = r, n;
  }
  /**
   * 更新统计信息
   */
  updateStats(e) {
    this.stats.totalRequests++;
    const t = Date.now() - e;
    this.requestTimes.push(t), this.requestTimes.length > 100 && this.requestTimes.shift(), this.stats.averageResponseTime = this.requestTimes.reduce((s, r) => s + r, 0) / this.requestTimes.length, this.consecutiveFailures = 0;
  }
  /**
   * 释放连接
   */
  release(e) {
    const t = this.connections.get(e);
    return t ? (t.isActive = !1, t.lastUsed = Date.now(), this.emit("connection-released", t), !0) : !1;
  }
  /**
   * 销毁连接
   */
  destroy(e) {
    const t = this.connections.get(e);
    if (!t)
      return !1;
    const s = this.connectionsByType.get(t.type);
    if (s && s.delete(e), t.api && typeof t.api.destroy == "function")
      try {
        t.api.destroy();
      } catch (r) {
        console.warn("[ConnectionPool] Error destroying API instance:", r);
      }
    return this.connections.delete(e), this.emit("connection-destroyed", t), !0;
  }
  /**
   * 查找可复用的连接
   */
  findReusableConnection(e, t) {
    const s = this.connectionsByType.get(e);
    if (!s)
      return null;
    for (const r of s) {
      const n = this.connections.get(r);
      if (!(!n || n.isActive || e === "danmu" && n.roomId !== t || Date.now() - n.lastUsed > this.config.idleTimeout))
        return n;
    }
    return null;
  }
  /**
   * 创建新连接
   */
  async createConnection(e, t) {
    const s = `${e}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      const n = te.getInstance().getApiInstance(), i = {
        id: s,
        api: n,
        type: e,
        roomId: t,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isActive: !0,
        healthCheckCount: 0,
        isHealthy: !0,
        retryCount: 0
      };
      this.connections.set(s, i);
      let o = this.connectionsByType.get(e);
      return o || (o = /* @__PURE__ */ new Set(), this.connectionsByType.set(e, o)), o.add(s), this.emit("connection-created", i), i;
    } catch (r) {
      throw console.error(`[ConnectionPool] Failed to create ${e} connection:`, r), r;
    }
  }
  /**
   * 执行健康检查
   */
  async performHealthCheck() {
    const t = Array.from(this.connections.values()).map(async (s) => {
      try {
        const r = await this.checkConnectionHealth(s);
        s.isHealthy = r, s.healthCheckCount++, r ? s.retryCount = 0 : (this.stats.healthCheckFailures++, console.log(`[AcfunApiConnectionPool] Health check failed for connection ${s.id}`), s.retryCount < this.config.apiRetryCount ? (s.retryCount++, await this.recreateConnection(s)) : this.destroy(s.id));
      } catch (r) {
        console.error(`[AcfunApiConnectionPool] Health check error for connection ${s.id}:`, r), this.stats.healthCheckFailures++, s.isHealthy = !1, s.retryCount++, s.retryCount >= this.config.apiRetryCount && this.destroy(s.id);
      }
    });
    await Promise.allSettled(t);
  }
  /**
   * 检查单个连接的健康状态
   */
  async checkConnectionHealth(e) {
    try {
      const t = Date.now();
      if (await Promise.race([
        e.api.user.getUserInfo("123456"),
        // 使用一个测试用户ID
        new Promise(
          (o, a) => setTimeout(() => a(new Error("Health check timeout")), 5e3)
        )
      ]), Date.now() - t > 1e4)
        return !1;
      const r = Date.now() - e.createdAt, n = this.config.idleTimeout * 3;
      return r > n ? (console.log(`[AcfunApiConnectionPool] Connection ${e.id} is too old`), !1) : Date.now() - e.lastUsed > this.config.idleTimeout ? (console.log(`[AcfunApiConnectionPool] Connection ${e.id} has been idle too long`), !1) : !0;
    } catch (t) {
      return console.error(`[ConnectionPool] Health check failed for ${e.id}:`, t), !1;
    }
  }
  /**
   * 重新创建连接
   */
  async recreateConnection(e) {
    try {
      console.log(`[AcfunApiConnectionPool] Recreating connection ${e.id}`);
      const s = te.getInstance().getApiInstance();
      e.api = s, e.createdAt = Date.now(), e.isHealthy = !0, e.lastUsed = Date.now(), console.log(`[AcfunApiConnectionPool] Successfully recreated connection ${e.id}`);
    } catch (t) {
      throw console.error(`[AcfunApiConnectionPool] Failed to recreate connection ${e.id}:`, t), e.isHealthy = !1, t;
    }
  }
  /**
   * 清理空闲连接
   */
  cleanupIdleConnections() {
    const e = Date.now(), t = [];
    for (const s of this.connections.values()) {
      if (s.isActive)
        continue;
      e - s.lastUsed > this.config.idleTimeout && t.push(s.id);
    }
    for (const s of t)
      this.destroy(s);
    t.length > 0 && console.log(`[AcfunApiConnectionPool] Cleaned up ${t.length} idle connections`);
  }
  /**
   * 获取连接池统计信息
   */
  getStats() {
    const e = this.connections.size;
    let t = 0, s = 0, r = 0;
    const n = {}, i = Date.now();
    for (const o of this.connections.values())
      o.isActive && t++, s += i - o.createdAt, o.healthCheckCount > 1 && r++, n[o.type] = (n[o.type] || 0) + 1;
    return {
      totalConnections: e,
      activeConnections: t,
      idleConnections: e - t,
      connectionsByType: n,
      averageConnectionAge: e > 0 ? s / e : 0,
      healthCheckFailures: r,
      circuitBreakerOpen: this.circuitBreakerOpen,
      totalRequests: this.stats.totalRequests,
      failedRequests: this.stats.failedRequests,
      averageResponseTime: this.stats.averageResponseTime
    };
  }
  /**
   * 获取详细的性能指标
   */
  getPerformanceMetrics() {
    const e = this.getStats(), t = this.connections.size, s = Array.from(this.connections.values()).filter((n) => n.isHealthy).length, r = Array.from(this.connections.values()).reduce((n, i) => n + i.healthCheckCount, 0);
    return {
      connectionPool: e,
      performance: {
        requestsPerSecond: this.calculateRequestsPerSecond(),
        averageWaitTime: this.calculateAverageWaitTime(),
        connectionUtilization: t > 0 ? e.activeConnections / t : 0,
        errorRate: e.totalRequests > 0 ? e.failedRequests / e.totalRequests : 0,
        circuitBreakerStatus: {
          isOpen: this.circuitBreakerOpen,
          consecutiveFailures: this.consecutiveFailures,
          openTime: this.circuitBreakerOpenTime
        }
      },
      health: {
        healthyConnections: s,
        unhealthyConnections: t - s,
        totalHealthChecks: r,
        healthCheckFailureRate: r > 0 ? e.healthCheckFailures / r : 0
      }
    };
  }
  /**
   * 计算每秒请求数
   */
  calculateRequestsPerSecond() {
    return this.stats.totalRequests;
  }
  /**
   * 计算平均等待时间
   */
  calculateAverageWaitTime() {
    return this.stats.averageResponseTime;
  }
  /**
   * 启动性能监控
   */
  startPerformanceMonitoring(e, t = 3e4) {
    setInterval(() => {
      const s = this.getPerformanceMetrics();
      e(s);
    }, t);
  }
  /**
   * 获取指定类型的连接数量
   */
  getConnectionCount(e) {
    if (e) {
      const t = this.connectionsByType.get(e);
      return t ? t.size : 0;
    }
    return this.connections.size;
  }
  /**
   * 清理所有连接
   */
  cleanup() {
    this.healthCheckTimer && (clearInterval(this.healthCheckTimer), this.healthCheckTimer = null), this.cleanupTimer && (clearInterval(this.cleanupTimer), this.cleanupTimer = null);
    const e = Array.from(this.connections.keys());
    for (const t of e)
      this.destroy(t);
    this.connectionsByType.clear(), this.removeAllListeners();
  }
  /**
   * 更新配置
   */
  updateConfig(e) {
    this.config = { ...this.config, ...e }, this.cleanup(), this.initializeTimers();
  }
}
const Pe = new St();
class ts extends ce {
  recoveryConfigs = /* @__PURE__ */ new Map();
  retryAttempts = /* @__PURE__ */ new Map();
  errorHistory = /* @__PURE__ */ new Map();
  recoveryTimers = /* @__PURE__ */ new Map();
  constructor() {
    super(), this.initializeRecoveryConfigs();
  }
  initializeRecoveryConfigs() {
    const e = [
      ["network_error", {
        errorType: "network_error",
        strategy: "exponential_backoff",
        maxRetries: 5,
        baseDelay: 1e3,
        maxDelay: 3e4,
        timeoutMs: 1e4
      }],
      ["auth_error", {
        errorType: "auth_error",
        strategy: "no_retry",
        maxRetries: 0,
        baseDelay: 0,
        maxDelay: 0,
        timeoutMs: 5e3
      }],
      ["room_not_found", {
        errorType: "room_not_found",
        strategy: "linear_backoff",
        maxRetries: 3,
        baseDelay: 5e3,
        maxDelay: 15e3,
        timeoutMs: 8e3
      }],
      ["rate_limited", {
        errorType: "rate_limited",
        strategy: "exponential_backoff",
        maxRetries: 3,
        baseDelay: 1e4,
        maxDelay: 6e4,
        timeoutMs: 15e3
      }],
      ["server_error", {
        errorType: "server_error",
        strategy: "exponential_backoff",
        maxRetries: 4,
        baseDelay: 2e3,
        maxDelay: 2e4,
        timeoutMs: 12e3
      }],
      ["websocket_error", {
        errorType: "websocket_error",
        strategy: "reset_connection",
        maxRetries: 3,
        baseDelay: 1e3,
        maxDelay: 1e4,
        timeoutMs: 8e3
      }],
      ["timeout_error", {
        errorType: "timeout_error",
        strategy: "immediate_retry",
        maxRetries: 2,
        baseDelay: 500,
        maxDelay: 2e3,
        timeoutMs: 15e3
      }],
      ["unknown_error", {
        errorType: "unknown_error",
        strategy: "exponential_backoff",
        maxRetries: 2,
        baseDelay: 2e3,
        maxDelay: 1e4,
        timeoutMs: 1e4
      }]
    ];
    for (const [t, s] of e)
      this.recoveryConfigs.set(t, s);
  }
  /**
   * 处理连接错误并尝试恢复
   */
  async handleConnectionError(e, t, s) {
    const r = this.classifyError(t, s), n = {
      roomId: e,
      type: r,
      message: t.message,
      error: t,
      timestamp: Date.now(),
      context: s
    };
    this.recordError(n), this.emit("error", n);
    const i = this.recoveryConfigs.get(r);
    if (!i || i.strategy === "no_retry")
      return console.log(`[ConnectionErrorHandler] No recovery strategy for ${r} in room ${e}`), !1;
    const o = `${e}:${r}`, a = this.retryAttempts.get(o) || 0;
    if (a >= i.maxRetries)
      return console.log(`[ConnectionErrorHandler] Max retries exceeded for ${r} in room ${e}`), this.emit("max-retries-exceeded", e, r), this.retryAttempts.delete(o), !1;
    const c = this.calculateDelay(i, a);
    this.retryAttempts.set(o, a + 1), console.log(`[ConnectionErrorHandler] Scheduling recovery for ${r} in room ${e} (attempt ${a + 1}/${i.maxRetries}) after ${c}ms`), this.emit("recovery-attempt", e, a + 1, i.maxRetries);
    const d = this.recoveryTimers.get(o);
    return d && clearTimeout(d), new Promise((f) => {
      const w = setTimeout(() => {
        this.recoveryTimers.delete(o), f(!0);
      }, c);
      this.recoveryTimers.set(o, w);
    });
  }
  /**
   * 标记恢复成功
   */
  markRecoverySuccess(e, t) {
    const s = `${e}:${t}`, r = this.retryAttempts.get(s) || 0;
    this.retryAttempts.delete(s);
    const n = this.recoveryTimers.get(s);
    n && (clearTimeout(n), this.recoveryTimers.delete(s)), console.log(`[ConnectionErrorHandler] Recovery successful for room ${e} after ${r} attempts`), this.emit("recovery-success", e, r);
  }
  /**
   * 标记恢复失败
   */
  markRecoveryFailed(e, t) {
    const s = `${e}:${t.type}`;
    this.retryAttempts.delete(s);
    const r = this.recoveryTimers.get(s);
    r && (clearTimeout(r), this.recoveryTimers.delete(s)), console.log(`[ConnectionErrorHandler] Recovery failed for room ${e}: ${t.message}`), this.emit("recovery-failed", e, t);
  }
  /**
   * 分类错误类型
   */
  classifyError(e, t) {
    const s = e.message.toLowerCase();
    return s.includes("network") || s.includes("enotfound") || s.includes("econnrefused") || s.includes("timeout") ? "network_error" : s.includes("auth") || s.includes("unauthorized") || s.includes("forbidden") || s.includes("token") ? "auth_error" : s.includes("room not found") || s.includes("invalid room") || s.includes("404") ? "room_not_found" : s.includes("rate limit") || s.includes("too many requests") || s.includes("429") ? "rate_limited" : s.includes("server error") || s.includes("500") || s.includes("502") || s.includes("503") ? "server_error" : s.includes("websocket") || s.includes("ws") || t?.connectionType === "websocket" ? "websocket_error" : s.includes("timeout") || s.includes("timed out") ? "timeout_error" : "unknown_error";
  }
  /**
   * 计算延迟时间
   */
  calculateDelay(e, t) {
    switch (e.strategy) {
      case "immediate_retry":
        return 0;
      case "linear_backoff":
        return Math.min(e.baseDelay * (t + 1), e.maxDelay);
      case "exponential_backoff":
        return Math.min(e.baseDelay * Math.pow(2, t), e.maxDelay);
      case "reset_connection":
        return e.baseDelay;
      default:
        return e.baseDelay;
    }
  }
  /**
   * 记录错误历史
   */
  recordError(e) {
    const t = this.errorHistory.get(e.roomId) || [];
    t.push(e), t.length > 50 && t.splice(0, t.length - 50), this.errorHistory.set(e.roomId, t);
  }
  /**
   * 获取错误统计
   */
  getErrorStats(e) {
    if (e) {
      const r = this.errorHistory.get(e) || [], n = {};
      for (const i of r)
        n[i.type] = (n[i.type] || 0) + 1;
      return {
        roomId: e,
        totalErrors: r.length,
        errorsByType: n,
        lastError: r[r.length - 1]
      };
    }
    const t = {};
    let s = 0;
    for (const r of this.errorHistory.values()) {
      s += r.length;
      for (const n of r)
        t[n.type] = (t[n.type] || 0) + 1;
    }
    return {
      totalErrors: s,
      errorsByType: t,
      activeRetries: this.retryAttempts.size
    };
  }
  /**
   * 清理房间相关的错误处理状态
   */
  cleanup(e) {
    this.errorHistory.delete(e);
    const t = [];
    for (const s of this.retryAttempts.keys())
      s.startsWith(`${e}:`) && t.push(s);
    for (const s of t) {
      this.retryAttempts.delete(s);
      const r = this.recoveryTimers.get(s);
      r && (clearTimeout(r), this.recoveryTimers.delete(s));
    }
  }
  /**
   * 更新恢复配置
   */
  updateRecoveryConfig(e, t) {
    const s = this.recoveryConfigs.get(e);
    s && this.recoveryConfigs.set(e, { ...s, ...t });
  }
  /**
   * 销毁错误处理器
   */
  destroy() {
    for (const e of this.recoveryTimers.values())
      clearTimeout(e);
    this.recoveryTimers.clear(), this.retryAttempts.clear(), this.errorHistory.clear(), this.removeAllListeners();
  }
}
class ss extends ce {
  /** 适配器配置 */
  config;
  /** 当前连接状态 */
  connectionState = "DISCONNECTED";
  /** AcFun Live API 实例 */
  api = null;
  /** Token管理器 */
  tokenManager;
  /** 连接池管理器 */
  connectionPool;
  /** 连接错误处理器 */
  connectionErrorHandler;
  /** 重连定时器 */
  reconnectTimer = null;
  /** 心跳定时器 */
  heartbeatTimer = null;
  /** 重连尝试次数 */
  reconnectAttempts = 0;
  /** 是否正在连接中 */
  isConnecting = !1;
  /** 是否已销毁 */
  isdestroyed = !1;
  /** 弹幕会话ID */
  danmuSessionId = null;
  /** 当前直播场次ID */
  currentLiveId = null;
  currentStreamInfo = null;
  /** 消息处理器映射 */
  messageHandlers = /* @__PURE__ */ new Map();
  /**
   * 构造函数
   * @param config 适配器配置
   * @param connectionPool 连接池管理器（可选）
   */
  constructor(e = {}, t) {
    super(), this.config = {
      roomId: "",
      autoReconnect: !0,
      reconnectInterval: 5e3,
      maxReconnectAttempts: 10,
      connectionTimeout: 3e4,
      heartbeatInterval: 3e4,
      debug: !1,
      apiConfig: {
        timeout: 3e4,
        retryCount: 3,
        baseUrl: "https://api-new.acfunchina.com",
        headers: {
          "User-Agent": "AcFun-Live-Toolbox/2.0"
        }
      },
      ...e
    }, this.tokenManager = te.getInstance(), this.connectionPool = t || new St(), this.connectionErrorHandler = new ts(), this.api = this.tokenManager.getApiInstance(), this.setupEventListeners(), this.initializeMessageHandlers(), this.config.debug && console.log("[AcfunAdapter] Initialized with config:", this.config);
  }
  /**
   * 设置事件监听器
   * 配置各个组件之间的事件通信
   * @private
   */
  setupEventListeners() {
    this.tokenManager.on("loginSuccess", () => {
      this.emit("authenticated"), this.config.debug && console.log("[AcfunAdapter] Authentication successful");
    }), this.tokenManager.on("loginFailed", (e) => {
      this.emit("auth-failed", e), this.handleConnectionError(e);
    }), this.tokenManager.on("tokenExpiring", () => {
      this.config.debug && console.log("[AcfunAdapter] Token expiring, refreshing...");
    }), this.connectionErrorHandler.on("connectionLost", () => {
      this.setConnectionState(
        "DISCONNECTED"
        /* DISCONNECTED */
      ), this.config.autoReconnect && !this.isdestroyed && this.scheduleReconnect();
    }), this.connectionErrorHandler.on("connectionRecovered", () => {
      this.reconnectAttempts = 0, this.setConnectionState(
        "CONNECTED"
        /* CONNECTED */
      );
    });
  }
  /**
   * 初始化消息处理器
   * 设置不同类型消息的处理函数
   * @private
   */
  initializeMessageHandlers() {
    this.messageHandlers.set("danmu", (e) => {
      const t = {
        sendTime: e.timestamp || Date.now(),
        userInfo: {
          userID: Number(e.userId) || 0,
          nickname: e.nickname || "",
          avatar: e.avatar || "",
          medal: { uperID: 0, userID: Number(e.userId) || 0, clubName: "", level: 0 },
          managerType: xe.NotManager
        },
        type: "comment",
        roomId: this.config.roomId
      };
      this.emit("danmu", t);
    }), this.messageHandlers.set("gift", (e) => {
      const t = {
        sendTime: e.timestamp || Date.now(),
        userInfo: {
          userID: Number(e.userId) || 0,
          nickname: e.nickname || "",
          avatar: e.avatar || "",
          medal: { uperID: 0, userID: Number(e.userId) || 0, clubName: "", level: 0 },
          managerType: xe.NotManager
        },
        type: "gift",
        roomId: this.config.roomId
      };
      this.emit("gift", t);
    }), this.messageHandlers.set("like", (e) => {
      const t = {
        sendTime: e.timestamp || Date.now(),
        userInfo: {
          userID: Number(e.userId) || 0,
          nickname: e.nickname || "",
          avatar: e.avatar || "",
          medal: { uperID: 0, userID: Number(e.userId) || 0, clubName: "", level: 0 },
          managerType: xe.NotManager
        },
        type: "like",
        roomId: this.config.roomId
      };
      this.emit("like", t);
    }), this.messageHandlers.set("enter", (e) => {
      const t = {
        sendTime: e.timestamp || Date.now(),
        userInfo: {
          userID: Number(e.userId) || 0,
          nickname: e.nickname || "",
          avatar: e.avatar || "",
          medal: { uperID: 0, userID: Number(e.userId) || 0, clubName: "", level: 0 },
          managerType: xe.NotManager
        },
        type: "enter",
        roomId: this.config.roomId
      };
      this.emit("enter", t);
    }), this.messageHandlers.set("follow", (e) => {
      const t = {
        sendTime: e.timestamp || Date.now(),
        userInfo: {
          userID: Number(e.userId) || 0,
          nickname: e.nickname || "",
          avatar: e.avatar || "",
          medal: { uperID: 0, userID: Number(e.userId) || 0, clubName: "", level: 0 },
          managerType: xe.NotManager
        },
        type: "follow",
        roomId: this.config.roomId
      };
      this.emit("follow", t);
    });
  }
  /**
   * 连接到直播间
   * 
   * 此方法执行完整的连接流程：
   * 1. 验证配置和状态
   * 2. 确保用户已认证
   * 3. 从连接池获取 API 实例
   * 4. 启动弹幕服务
   * 5. 设置心跳机制
   * 
   * @returns Promise<void> 连接完成的 Promise
   * @throws {Error} 当连接失败时抛出错误
   */
  async connect() {
    if (this.isdestroyed)
      throw new Error("Adapter has been destroyed");
    if (this.isConnecting) {
      this.config.debug && console.log("[AcfunAdapter] Already connecting, skipping...");
      return;
    }
    if (this.connectionState === "CONNECTED") {
      this.config.debug && console.log("[AcfunAdapter] Already connected, skipping...");
      return;
    }
    if (!this.config.roomId)
      throw new Error("Room ID is required");
    this.isConnecting = !0, this.setConnectionState(
      "CONNECTING"
      /* CONNECTING */
    );
    try {
      await this.ensureAuthentication();
      const e = await this.connectionPool.acquire("danmu", {
        roomId: this.config.roomId
      });
      if (this.api = e.api, await this.startDanmuService(), this.startHeartbeat(), this.reconnectAttempts = 0, this.setConnectionState(
        "CONNECTED"
        /* CONNECTED */
      ), this.config.debug && console.log(`[AcfunAdapter] Successfully connected to room ${this.config.roomId}`), process.env.ACFRAME_DEBUG_LOGS === "1")
        try {
          console.log("[Adapter] connect ok roomId=" + String(this.config.roomId) + " state=CONNECTED");
        } catch {
        }
    } catch (e) {
      if (this.handleConnectionError(e), process.env.ACFRAME_DEBUG_LOGS === "1")
        try {
          console.log("[Adapter] connect fail roomId=" + String(this.config.roomId) + " err=" + String(e?.message || e));
        } catch {
        }
      throw e;
    } finally {
      this.isConnecting = !1;
    }
  }
  /**
   * 断开连接
   * 
   * 清理所有资源并断开与直播间的连接
   * 
   * @returns Promise<void> 断开完成的 Promise
   */
  async disconnect() {
    if (this.connectionState !== "DISCONNECTED") {
      if (this.setConnectionState(
        "DISCONNECTED"
        /* DISCONNECTED */
      ), this.clearTimers(), this.api) {
        try {
          await this.stopDanmuService();
        } catch (e) {
          console.warn("[AcfunAdapter] Error stopping danmu service:", e);
        }
        try {
          if (this.api?.danmu && typeof this.api.danmu.getSessionsByLiver == "function" && typeof this.api.danmu.stopSessions == "function") {
            const e = this.api.danmu.getSessionsByLiver(String(this.config.roomId)), t = e && e.success && Array.isArray(e.data) ? e.data.map((s) => s.sessionId).filter((s) => !!s) : [];
            t.length && await this.api.danmu.stopSessions(t);
          }
          if (this.api?.danmu && typeof this.api.danmu.cleanupFailedSessions == "function")
            try {
              this.api.danmu.cleanupFailedSessions();
            } catch {
            }
        } catch {
        }
      }
      this.api = null, this.danmuSessionId = null, this.config.debug && console.log("[AcfunAdapter] Disconnected successfully");
    }
  }
  /**
   * 重新连接
   * 
   * 断开当前连接并重新建立连接
   * 
   * @returns Promise<void> 重连完成的 Promise
   */
  async reconnect() {
    if (!this.isdestroyed) {
      this.setConnectionState(
        "RECONNECTING"
        /* RECONNECTING */
      ), this.reconnectAttempts++, this.emit("reconnect", this.reconnectAttempts), this.config.debug && console.log(`[AcfunAdapter] Reconnecting... (attempt ${this.reconnectAttempts})`);
      try {
        await this.disconnect(), await this.connect();
      } catch (e) {
        console.error("[AcfunAdapter] Reconnection failed:", e), this.reconnectAttempts < this.config.maxReconnectAttempts ? this.scheduleReconnect() : (console.error("[AcfunAdapter] Max reconnection attempts reached"), this.setConnectionState(
          "FAILED"
          /* FAILED */
        ), this.emit("error", new Error("Max reconnection attempts reached")));
      }
    }
  }
  /**
   * 销毁适配器
   * 
   * 清理所有资源并销毁适配器实例
   * 
   * @returns Promise<void> 销毁完成的 Promise
   */
  async destroy() {
    this.isdestroyed = !0, await this.disconnect(), this.clearTimers(), this.connectionErrorHandler.destroy(), this.removeAllListeners(), this.config.debug && console.log("[AcfunAdapter] Adapter destroyed");
  }
  // 私有辅助方法
  /**
   * 设置连接状态
   * @param newState 新的连接状态
   * @private
   */
  setConnectionState(e) {
    const t = this.connectionState;
    if (t !== e) {
      this.connectionState = e, this.emit("connection-state-changed", e, t);
      const s = this.mapConnectionStateToRoomStatus(e);
      this.safeEmit("statusChange", s);
    }
  }
  /**
   * 将内部连接状态映射为 RoomStatus（供 RoomManager 使用）
   */
  mapConnectionStateToRoomStatus(e) {
    switch (e) {
      case "CONNECTING":
        return "connecting";
      case "CONNECTED":
        return "open";
      case "RECONNECTING":
        return "reconnecting";
      case "FAILED":
        return "error";
      case "DISCONNECTED":
      default:
        return "closed";
    }
  }
  /**
   * 确保认证状态有效
   * @private
   */
  async ensureAuthentication() {
    try {
      if (this.tokenManager.isAuthenticated()) {
        await this.tokenManager.isTokenExpiringSoon() && this.config.debug && console.log("[AcfunAdapter] Token expiring soon; please re-login if needed."), await this.tokenManager.getTokenInfo();
        return;
      }
      this.config.debug && console.log("[AcfunAdapter] No authentication found, attempting to restore via TokenManager...");
      const t = await this.tokenManager.getTokenInfo();
      if ((await this.tokenManager.validateToken(t ?? void 0)).isValid && t?.serviceToken) {
        this.config.debug && console.log("[AcfunAdapter] Authentication restored via persisted token");
        return;
      }
      t && await this.tokenManager.logout(), this.config.debug && console.log("[AcfunAdapter] No valid authentication token available, proceeding anonymously");
    } catch (e) {
      this.config.debug && console.warn("[AcfunAdapter] Authentication check failed:", e);
    }
  }
  /**
   * 启动弹幕服务
   * @private
   */
  async startDanmuService() {
    if (!this.api)
      throw new Error("API instance not available");
    await this.tokenManager.getTokenInfo();
    for (let e = 0; e < 2; e++)
      try {
        if (this.api.danmu && typeof this.api.danmu.getSessionsByLiver == "function" && typeof this.api.danmu.stopSessions == "function") {
          const t = this.api.danmu.getSessionsByLiver(String(this.config.roomId)), s = t && t.success && Array.isArray(t.data) ? t.data.map((r) => r.sessionId).filter((r) => !!r) : [];
          s.length && await this.api.danmu.stopSessions(s);
        }
        if (this.api.danmu && typeof this.api.danmu.startDanmu == "function") {
          const t = await this.api.danmu.startDanmu(this.config.roomId, (s) => {
            try {
              const r = String(s && (s.type || s.action || s.messageType) || ""), n = Number(s?.timestamp || s?.sendTime || Date.now()), i = s?.userId ?? s?.userInfo?.userID ?? s?.user?.id ?? null, o = s?.username ?? s?.userInfo?.nickname ?? s?.user?.name ?? null, a = s?.content ?? s?.comment?.content ?? s?.message ?? s?.text ?? null;
            } catch {
            }
            this.handleDanmuEvent(s);
          });
          if (t.success && t.data) {
            this.danmuSessionId = t.data.sessionId;
            const s = t?.data?.StreamInfo ?? t?.data?.streamInfo ?? null;
            if (s) {
              const r = s?.liveID ?? s?.liveId ?? "";
              this.currentLiveId = r ? String(r) : this.currentLiveId, this.currentStreamInfo = s;
              try {
                this.emit("streamInfoReady");
              } catch {
              }
            }
            if (this.config.debug && console.log("[AcfunAdapter] Danmu service started with session ID:", this.danmuSessionId), process.env.ACFRAME_DEBUG_LOGS === "1")
              try {
                console.log("[Adapter] danmu start roomId=" + String(this.config.roomId) + " sessionId=" + String(this.danmuSessionId));
              } catch {
              }
            return;
          }
          throw new Error(t.error || "Failed to start danmu service");
        }
        throw new Error("DanmuService.startDanmu method not available");
      } catch (t) {
        const s = String(t && (t.message || t) || "");
        let r = null;
        try {
          const n = s.match(/活动会话[:：]\s*([\w-]+)/);
          n && n[1] && (r = n[1]);
        } catch {
        }
        if (r && this.api?.danmu && typeof this.api.danmu.stopDanmu == "function") {
          try {
            await this.api.danmu.stopDanmu(r);
          } catch {
          }
          if (e === 0)
            continue;
        }
        if (s.includes("获取直播 token 失败") && this.api?.danmu) {
          try {
            typeof this.api.danmu.cleanupFailedSessions == "function" && this.api.danmu.cleanupFailedSessions();
          } catch {
          }
          try {
            if (typeof this.api.danmu.getSessionsByLiver == "function" && typeof this.api.danmu.stopSessions == "function") {
              const n = this.api.danmu.getSessionsByLiver(String(this.config.roomId)), i = n && n.success && Array.isArray(n.data) ? n.data.map((o) => o.sessionId).filter((o) => !!o) : [];
              i.length && await this.api.danmu.stopSessions(i);
            }
          } catch {
          }
          if (e === 0)
            continue;
        }
        throw console.error("[AcfunAdapter] Failed to start danmu service:", t), t;
      }
  }
  /**
   * 停止弹幕服务
   * @private
   */
  async stopDanmuService() {
    if (this.api)
      try {
        if (this.api.danmu && typeof this.api.danmu.stopDanmu == "function" && this.danmuSessionId) {
          const e = await this.api.danmu.stopDanmu(this.danmuSessionId);
          e.success ? this.config.debug && console.log("[AcfunAdapter] Danmu service stopped for session:", this.danmuSessionId) : console.warn("[AcfunAdapter] Failed to stop danmu service:", e.error), this.danmuSessionId = null, this.currentLiveId = null;
        }
      } catch (e) {
        console.error("[AcfunAdapter] Failed to stop danmu service:", e);
      }
  }
  /**
   * 处理弹幕事件回调
   * @private
   */
  handleDanmuEvent(e) {
    if (!(!e || typeof e != "object"))
      try {
        if (e && e.danmuInfo) {
          this.processDanmuInfo(e.danmuInfo, e);
          return;
        }
        switch (e.type) {
          case "comment":
          case "danmu":
            this.handleDanmuMessage(e);
            break;
          case "gift":
            this.handleGiftMessage(e);
            break;
          case "like":
            this.handleLikeMessage(e);
            break;
          case "enter":
            this.handleEnterMessage(e);
            break;
          case "follow":
            this.handleFollowMessage(e);
            break;
          case "bananaCount": {
            const t = String(e?.data ?? e?.count ?? "");
            this.emitUnifiedEvent("bananaCount", { timestamp: Number(e?.timestamp || Date.now()), content: t, roomId: this.config.roomId, raw: e });
            break;
          }
          case "displayInfo": {
            const t = e?.data || {}, s = "watchingCount=" + String(t.watchingCount ?? "") + ", likeCount=" + String(t.likeCount ?? "") + ", likeDelta=" + String(t.likeDelta ?? "");
            this.emitUnifiedEvent("displayInfo", { timestamp: Number(e?.timestamp || Date.now()), content: s, roomId: this.config.roomId, raw: e });
            break;
          }
          case "topUsers": {
            const t = Array.isArray(e?.data) ? e.data : [], s = "count=" + String(t.length);
            this.emitUnifiedEvent("topUsers", { timestamp: Number(e?.timestamp || Date.now()), content: s, roomId: this.config.roomId, raw: e });
            break;
          }
          case "redpackList": {
            const t = Array.isArray(e?.data) ? e.data : [], s = "count=" + String(t.length);
            this.emitUnifiedEvent("redpackList", { timestamp: Number(e?.timestamp || Date.now()), content: s, roomId: this.config.roomId, raw: e });
            break;
          }
          case "chatCall": {
            this.emitUnifiedEvent("chatCall", { timestamp: Number(e?.timestamp || Date.now()), content: "chatCall", roomId: this.config.roomId, raw: e });
            break;
          }
          case "chatAccept": {
            this.emitUnifiedEvent("chatAccept", { timestamp: Number(e?.timestamp || Date.now()), content: "chatAccept", roomId: this.config.roomId, raw: e });
            break;
          }
          case "chatReady": {
            this.emitUnifiedEvent("chatReady", { timestamp: Number(e?.timestamp || Date.now()), content: "chatReady", roomId: this.config.roomId, raw: e });
            break;
          }
          case "chatEnd": {
            this.emitUnifiedEvent("chatEnd", { timestamp: Number(e?.timestamp || Date.now()), content: "chatEnd", roomId: this.config.roomId, raw: e });
            break;
          }
          case "kickedOut": {
            const t = String(e?.data ?? e?.reason ?? "");
            this.emitUnifiedEvent("kickedOut", { timestamp: Number(e?.timestamp || Date.now()), content: t, roomId: this.config.roomId, raw: e });
            break;
          }
          case "violationAlert": {
            const t = String(e?.data ?? e?.message ?? "");
            this.emitUnifiedEvent("violationAlert", { timestamp: Number(e?.timestamp || Date.now()), content: t, roomId: this.config.roomId, raw: e });
            break;
          }
          case "manager_state": {
            const t = String(e?.state);
            e.type = "managerState", this.emitUnifiedEvent("managerState", { timestamp: Number(e?.timestamp || Date.now()), content: t, roomId: this.config.roomId, raw: e });
            break;
          }
          case "end": {
            this.emitUnifiedEvent("end", { timestamp: Number(e?.timestamp || Date.now()), content: "live_ended", roomId: this.config.roomId, raw: e });
            break;
          }
          case "ZtLiveScActionSignal":
            this.handleActionSignal(e);
            break;
          case "error":
            this.handleConnectionError(new Error(e.message || "Danmu service error"));
            break;
          default:
            this.config.debug && console.log("[AcfunAdapter] Unknown danmu event type:", e.type, e);
            try {
              if (e && (e.signalType || Array.isArray(e?.payload) && e.payload[0]?.signalType)) {
                if (Array.isArray(e?.payload))
                  for (const r of e.payload)
                    this.handleActionSignal({ ...e, ...r, signalType: r?.signalType });
                else
                  this.handleActionSignal(e);
                break;
              }
              const t = (e?.content ?? e?.comment?.content ?? e?.message ?? e?.text) != null, s = (e?.userId ?? e?.userInfo?.userID ?? e?.user?.id) != null;
              if (t && s) {
                const r = Number(e?.timestamp || e?.sendTime || Date.now()), n = e?.userId ?? e?.userInfo?.userID ?? e?.user?.id, i = e?.username ?? e?.userInfo?.nickname ?? e?.user?.name, o = e?.content ?? e?.comment?.content ?? e?.message ?? e?.text;
                this.handleDanmuMessage({ timestamp: r, userId: n, userInfo: { userID: Number(n) || 0, nickname: String(i || "") }, content: o });
                break;
              }
            } catch (t) {
              console.warn("[Adapter] Fallback parse failed:", t);
            }
            break;
        }
      } catch (t) {
        console.error("[AcfunAdapter] Error handling danmu event:", t);
      }
  }
  processDanmuInfo(e, t) {
    try {
      const s = String(t?.type || t?.action || t?.messageType || t?.signalType || ""), r = String(e?.type || e?.signalType || s || ""), n = Number(e?.timestamp || t?.timestamp || Date.now()), i = (b, h) => ({ ...b || {}, ...h || {} });
      if (Array.isArray(e?.payload) && e.payload.length > 0) {
        for (const b of e.payload) {
          const h = i(b, t);
          this.handleActionSignal({ ...h, signalType: String(h?.signalType || r || s), parentType: s, timestamp: Number(h?.timestamp || n), raw: t || e });
        }
        return;
      }
      const o = i(e, t), a = o?.userId ?? o?.user?.id ?? o?.userInfo?.userID ?? null, c = o?.username ?? o?.user?.name ?? o?.userInfo?.nickname ?? null, d = o?.giftDetail?.name ?? o?.giftName ?? o?.gift?.name ?? null, f = o?.count ?? o?.giftDetail?.count ?? null, w = o?.likeCount ?? o?.likeDelta ?? o?.totalLike ?? null, v = o?.content ?? o?.comment?.content ?? o?.message ?? o?.text ?? null, _ = d ? String(d) + (f ? " x" + String(f) : "") + (o?.value ? " (value " + String(o.value) + ")" : "") : w != null ? "like " + String(w) : v;
      this.handleActionSignal({ ...o, signalType: r || s, parentType: s, timestamp: n, userId: a, userInfo: { userID: Number(a) || 0, nickname: String(c || "") }, content: _, raw: t || e });
    } catch (s) {
      console.error("[AcfunAdapter] Error processing danmuInfo:", s);
    }
  }
  handleActionSignal(e) {
    try {
      let t = String(e?.signalType || e?.data?.signalType || e?.payload?.signalType || "");
      const s = Number(e?.timestamp || e?.sendTime || Date.now()), r = e?.userId ?? e?.user?.id ?? e?.userInfo?.userID ?? e?.payload?.[0]?.userId ?? null, n = e?.username ?? e?.user?.name ?? e?.userInfo?.nickname ?? e?.payload?.[0]?.userName ?? null, i = e?.content ?? e?.comment?.content ?? e?.payload?.[0]?.comment?.content ?? e?.message ?? e?.text ?? null;
      console.info("[Adapter] ActionSignal type=" + t + " room=" + String(this.config.roomId) + " user=" + String(n || "") + "(" + String(r || "") + ') content="' + String(i || "") + '" ts=' + String(s));
      const o = String(e?.actionType || "").toLowerCase(), a = String(e?.type || "").toLowerCase();
      if (String(t || "").toLowerCase() || (o === "enterroom" || a.includes("enter") ? t = "enter" : (o === "followauthor" || a.includes("follow")) && (t = "follow")), !t)
        try {
          if (e?.comment || e?.content || e?.text) t = "comment";
          else if (e?.giftDetail || e?.giftId || e?.giftName || e?.gift) t = "gift";
          else if (typeof e?.likeCount == "number" || typeof e?.likeDelta == "number" || typeof e?.totalLike == "number") t = "like";
          else if ((e?.userId || e?.userInfo) && !e?.comment && !e?.gift && !e?.content) {
            const d = String(e?.parentType || "").toLowerCase();
            d.includes("enter") ? t = "enter" : d.includes("follow") ? t = "follow" : t = "like";
          }
        } catch {
        }
      if (String(t).toLowerCase().includes("comment")) {
        this.handleDanmuMessage({ timestamp: s, userId: r, userInfo: { userID: Number(r) || 0, nickname: String(n || "") }, content: i, raw: e });
        return;
      }
      if (String(t).toLowerCase().includes("gift")) {
        this.handleGiftMessage({ timestamp: s, userId: r, userInfo: { userID: Number(r) || 0, nickname: String(n || "") }, content: i, raw: e });
        return;
      }
      if (String(t).toLowerCase().includes("like")) {
        this.handleLikeMessage({ timestamp: s, userId: r, userInfo: { userID: Number(r) || 0, nickname: String(n || "") }, content: i, raw: e });
        return;
      }
      if (String(t).toLowerCase().includes("enter")) {
        this.handleEnterMessage({ timestamp: s, userId: r, userInfo: { userID: Number(r) || 0, nickname: String(n || "") }, content: i, raw: e });
        return;
      }
      if (String(t).toLowerCase().includes("follow")) {
        this.handleFollowMessage({ timestamp: s, userId: r, userInfo: { userID: Number(r) || 0, nickname: String(n || "") }, content: i, raw: e });
        return;
      }
      this.config.debug && console.info("[Adapter] ActionSignal unmapped type=" + t);
    } catch (t) {
      console.error("[AcfunAdapter] Error handling action signal:", t);
    }
  }
  /**
   * 安全地发射事件，捕获监听器中的错误
   * @private
   */
  safeEmit(e, ...t) {
    try {
      if (this.isdestroyed) {
        this.config.debug && console.warn(`[AcfunAdapter] Attempted to emit ${e} on destroyed adapter`);
        return;
      }
      if (this.listenerCount(e) === 0)
        return;
      const s = this.listeners(e);
      for (const r of s)
        try {
          typeof r == "function" && r.apply(this, t);
        } catch (n) {
          console.error(`[AcfunAdapter] Error in event listener for ${e}:`, n), e !== "error" && this.emit("error", n instanceof Error ? n : new Error(String(n)));
        }
    } catch (s) {
      console.error(`[AcfunAdapter] Critical error in safeEmit for ${e}:`, s);
    }
  }
  /**
   * 处理弹幕消息
   * @private
   */
  handleDanmuMessage(e) {
    try {
      const t = {
        ...e,
        type: "comment",
        roomId: this.config.roomId
      };
      this.safeEmit("danmu", t), this.emitUnifiedEvent("danmaku", t);
    } catch (t) {
      console.error("[AcfunAdapter] Error handling danmu message:", t), this.safeEmit("error", t instanceof Error ? t : new Error(String(t)));
    }
  }
  /**
   * 处理礼物消息
   * @private
   */
  handleGiftMessage(e) {
    try {
      const t = {
        ...e,
        type: "gift",
        roomId: this.config.roomId
      };
      this.safeEmit("gift", t), this.emitUnifiedEvent("gift", t);
    } catch (t) {
      console.error("[AcfunAdapter] Error handling gift message:", t), this.safeEmit("error", t instanceof Error ? t : new Error(String(t)));
    }
  }
  /**
   * 处理点赞消息
   * @private
   */
  handleLikeMessage(e) {
    try {
      const t = {
        ...e,
        type: "like",
        roomId: this.config.roomId
      };
      this.safeEmit("like", t), this.emitUnifiedEvent("like", t);
    } catch (t) {
      console.error("[AcfunAdapter] Error handling like message:", t), this.safeEmit("error", t instanceof Error ? t : new Error(String(t)));
    }
  }
  /**
   * 处理进入房间消息
   * @private
   */
  handleEnterMessage(e) {
    try {
      const t = {
        ...e,
        type: "enter",
        roomId: this.config.roomId
      };
      this.safeEmit("enter", t), this.emitUnifiedEvent("enter", t);
    } catch (t) {
      console.error("[AcfunAdapter] Error handling enter message:", t), this.safeEmit("error", t instanceof Error ? t : new Error(String(t)));
    }
  }
  /**
   * 处理关注消息
   * @private
   */
  handleFollowMessage(e) {
    try {
      const t = {
        ...e,
        type: "follow",
        roomId: this.config.roomId
      };
      this.safeEmit("follow", t), this.emitUnifiedEvent("follow", t);
    } catch (t) {
      console.error("[AcfunAdapter] Error handling follow message:", t), this.safeEmit("error", t instanceof Error ? t : new Error(String(t)));
    }
  }
  /**
   * 统一事件发射：将上游消息标准化为 NormalizedEvent 并通过 'event' 推送
   */
  emitUnifiedEvent(e, t) {
    try {
      const s = t?.raw ?? t, r = Number(t?.timestamp ?? t?.sendTime ?? Date.now()), n = t?.userId ?? t?.userInfo?.userID, i = t?.username ?? t?.userInfo?.nickname, o = t?.data?.content ?? t?.content ?? t?.text ?? null, a = t?.roomId ?? this.config.roomId, c = vt({
        ts: r,
        received_at: Date.now(),
        room_id: String(a || this.config.roomId),
        source: "acfun",
        event_type: e,
        user_id: n != null ? String(n) : null,
        user_name: i != null ? String(i) : null,
        content: o != null ? String(o) : null,
        raw: s
      });
      this.safeEmit("event", c), process.env.ACFRAME_DEBUG_LOGS;
    } catch (s) {
      this.config.debug && console.warn("[AcfunAdapter] Failed to normalize/emit unified event:", s);
    }
  }
  /**
   * 启动心跳机制
   * @private
   */
  startHeartbeat() {
    this.clearHeartbeat(), this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }
  /**
   * 发送心跳
   * @private
   */
  sendHeartbeat() {
    if (this.api && this.connectionState === "CONNECTED")
      try {
        if (this.api.danmu && this.danmuSessionId) {
          const e = this.api.danmu.getSessionHealth(this.danmuSessionId);
        }
      } catch (e) {
        this.config.debug && console.warn("[AcfunAdapter] Heartbeat/health check failed:", e), this.handleConnectionError(e);
      }
  }
  /**
   * 清理心跳定时器
   * @private
   */
  clearHeartbeat() {
    this.heartbeatTimer && (clearInterval(this.heartbeatTimer), this.heartbeatTimer = null);
  }
  /**
   * 处理连接错误
   * @param error 错误对象
   * @private
   */
  handleConnectionError(e) {
    if (console.error("[AcfunAdapter] Connection error:", e), this.emit("error", e), this.config.autoReconnect && !this.isDestroyed()) {
      let t = this.config.reconnectInterval;
      e && e.message && e.message.includes("Circuit breaker is open") && (console.log("[AcfunAdapter] Circuit breaker detected, increasing reconnection delay to 65s"), t = 65e3), this.scheduleReconnect(t);
    }
  }
  /**
   * 安排重连
   * @param delay 延迟时间（毫秒），如果不指定则使用配置的间隔
   * @private
   */
  scheduleReconnect(e) {
    if (this.isdestroyed || this.reconnectTimer)
      return;
    const t = e || this.config.reconnectInterval;
    this.config.debug && console.log(`[AcfunAdapter] Scheduling reconnection in ${t}ms`), this.reconnectTimer = setTimeout(() => {
      this.reconnect().catch((s) => {
        console.error("[AcfunAdapter] Scheduled reconnection failed:", s);
      });
    }, t);
  }
  /**
   * 清理所有定时器
   * @private
   */
  clearTimers() {
    this.reconnectTimer && (clearTimeout(this.reconnectTimer), this.reconnectTimer = null), this.clearHeartbeat();
  }
  // 公共访问器方法
  /**
   * 获取当前连接状态
   * @returns 当前连接状态
   */
  getConnectionState() {
    return this.connectionState;
  }
  /**
   * 获取适配器配置
   * @returns 适配器配置
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * 获取Token管理器实例
   * @returns Token管理器实例
   */
  getTokenManager() {
    return this.tokenManager;
  }
  /**
   * 获取连接池管理器实例
   * @returns 连接池管理器实例
   */
  getConnectionPool() {
    return this.connectionPool;
  }
  /**
   * 检查适配器是否已销毁
   * @returns 是否已销毁
   */
  isDestroyed() {
    return this.isdestroyed;
  }
  /** 获取当前直播场次ID */
  getCurrentLiveId() {
    return this.currentLiveId;
  }
  getCurrentStreamInfo() {
    return this.currentStreamInfo;
  }
}
const Qe = 10;
class rs extends ce {
  rooms = /* @__PURE__ */ new Map();
  databaseManager;
  danmuWriter;
  reconnectTimers = /* @__PURE__ */ new Map();
  // 标记正在移除的房间，避免触发自动重连
  removingRooms = /* @__PURE__ */ new Set();
  constructor(e, t) {
    super(), this.databaseManager = t, this.danmuWriter = new yt(this.databaseManager.getDb());
  }
  async addRoom(e) {
    if (this.rooms.size >= Qe)
      return console.warn(`[RoomManager] Maximum number of rooms (${Qe}) reached.`), this.emit("error", new Error(`Maximum number of rooms (${Qe}) reached`)), !1;
    if (this.rooms.has(e))
      return console.warn(`[RoomManager] Room ${e} is already being managed.`), !1;
    try {
      const t = new ss({
        roomId: e,
        autoReconnect: !1,
        // 由RoomManager统一管理重连
        reconnectInterval: 5e3,
        maxReconnectAttempts: 0,
        // 禁止适配器内部自动重连
        connectionTimeout: 3e4,
        heartbeatInterval: 3e4,
        debug: !1
      }), s = {
        roomId: e,
        adapter: t,
        status: "closed",
        eventCount: 0,
        reconnectAttempts: 0,
        priority: 0,
        label: ""
      };
      this.rooms.set(e, s), this.setupAdapterListeners(s), await t.connect();
      try {
        s.liveId = t.getCurrentLiveId() || void 0;
      } catch {
      }
      try {
        s.streamInfo = t.getCurrentStreamInfo() || void 0;
      } catch {
      }
      return console.log(`[RoomManager] Successfully added room ${e}`), this.emit("roomAdded", e), !0;
    } catch (t) {
      return console.error(`[RoomManager] Failed to add room ${e}:`, t), this.rooms.delete(e), this.emit("error", t), !1;
    }
  }
  async removeRoom(e) {
    const t = this.rooms.get(e);
    if (!t)
      return console.warn(`[RoomManager] Room ${e} not found.`), !1;
    try {
      this.removingRooms.add(e);
      const s = this.reconnectTimers.get(e);
      s && (clearTimeout(s), this.reconnectTimers.delete(e));
      try {
        t.adapter.removeAllListeners();
      } catch {
      }
      return await t.adapter.disconnect(), await t.adapter.destroy(), this.rooms.delete(e), console.log(`[RoomManager] Successfully removed room ${e}`), this.emit("roomRemoved", e), this.removingRooms.delete(e), !0;
    } catch (s) {
      return console.error(`[RoomManager] Failed to remove room ${e}:`, s), this.emit("error", s), this.removingRooms.delete(e), !1;
    }
  }
  getRoomInfo(e) {
    return this.rooms.get(e);
  }
  getAllRooms() {
    return Array.from(this.rooms.values());
  }
  getRoomCount() {
    return this.rooms.size;
  }
  getConnectedRoomCount() {
    return Array.from(this.rooms.values()).filter((e) => e.status === "open").length;
  }
  async reconnectRoom(e) {
    const t = this.rooms.get(e);
    if (!t)
      return console.warn(`[RoomManager] Room ${e} not found for reconnection.`), !1;
    try {
      return console.log(`[RoomManager] Manually reconnecting room ${e}`), await t.adapter.reconnect(), !0;
    } catch (s) {
      return console.error(`[RoomManager] Failed to manually reconnect room ${e}:`, s), !1;
    }
  }
  setRoomPriority(e, t) {
    const s = this.rooms.get(e);
    return s ? (s.priority = t, this.emit("roomPriorityChange", e, t), !0) : !1;
  }
  setRoomLabel(e, t) {
    const s = this.rooms.get(e);
    return s ? (s.label = t, this.emit("roomLabelChange", e, t), !0) : !1;
  }
  async disconnectAllRooms() {
    const e = Array.from(this.rooms.keys()).map(
      (t) => this.removeRoom(t)
    );
    await Promise.allSettled(e), console.log("[RoomManager] All rooms disconnected");
  }
  setupAdapterListeners(e) {
    const { adapter: t, roomId: s } = e;
    t.on("statusChange", (r) => {
      if (!(this.removingRooms.has(s) || !this.rooms.has(s))) {
        e.status = r, r === "open" ? (e.connectedAt = Date.now(), e.reconnectAttempts = 0, console.log(`[RoomManager] Room ${s} connected successfully`)) : (r === "error" || r === "closed") && this.handleRoomDisconnection(e);
        try {
          e.liveId = e.adapter.getCurrentLiveId() || e.liveId;
        } catch {
        }
        try {
          e.streamInfo = e.adapter.getCurrentStreamInfo() || e.streamInfo;
        } catch {
        }
        if (this.emit("roomStatusChange", s, r), process.env.ACFRAME_DEBUG_LOGS === "1")
          try {
            console.log("[Room] status roomId=" + String(s) + " status=" + String(r));
          } catch {
          }
      }
    });
    try {
      t.on("streamInfoReady", () => {
        try {
          e.streamInfo = e.adapter.getCurrentStreamInfo() || e.streamInfo;
        } catch {
        }
        try {
          e.liveId = e.adapter.getCurrentLiveId() || e.liveId;
        } catch {
        }
        this.emit("roomStatusChange", s, e.status);
      });
    } catch {
    }
    t.on("event", async (r) => {
      e.eventCount++, e.lastEventAt = Date.now();
      const n = vt({
        ...r,
        room_id: s,
        ts: r.ts || Date.now()
      });
      if (n.event_type === "end") {
        e.liveId = void 0;
        try {
          await e.adapter.disconnect();
        } catch {
        }
      }
      if (n.event_type === "managerState")
        try {
          const o = n?.raw, a = Number(o?.state ?? o?.data?.state ?? NaN);
          Number.isFinite(a) && (e.isManager = a, this.emit("roomStatusChange", s, e.status));
        } catch {
        }
      if (process.env.ACFRAME_DEBUG_LOGS === "1")
        try {
          console.log("[Room] enqueue roomId=" + String(s) + " type=" + String(n.event_type) + " ts=" + String(n.ts));
        } catch {
        }
      const i = e.liveId || e.adapter.getCurrentLiveId();
      if (i)
        try {
          this.danmuWriter.handleNormalized(String(i), n, s);
        } catch {
        }
      else {
        const o = String(n.event_type || "");
        if (o === "enter" || o === "follow")
          try {
            this.danmuWriter.handleNormalized(String(s), n, s);
          } catch {
          }
        else
          try {
            console.warn("[RoomManager] liveId not available, skip persist room=" + String(s));
          } catch {
          }
      }
      this.emit("event", n);
    }), t.on("error", (r) => {
      console.error(`[RoomManager] Error in room ${s}:`, r), e.lastError = r, this.emit("roomError", s, r);
    });
  }
  handleRoomDisconnection(e) {
    const { roomId: t } = e;
    if (this.removingRooms.has(t) || !this.rooms.has(t) || e.adapter.isDestroyed())
      return;
    const s = this.reconnectTimers.get(t);
    s && clearTimeout(s);
    const r = 1e3, n = 3e5, i = 10;
    if (e.reconnectAttempts >= i) {
      console.error(`[RoomManager] Room ${t} exceeded maximum reconnection attempts (${i})`), this.emit("roomReconnectFailed", t);
      return;
    }
    let o = Math.min(
      r * Math.pow(2, e.reconnectAttempts),
      n
    );
    e.lastError && e.lastError.message && e.lastError.message.includes("Circuit breaker is open") && (console.log(`[RoomManager] Circuit breaker detected for room ${t}, waiting for reset...`), o = Math.max(o, 65e3)), console.log(`[RoomManager] Scheduling reconnection for room ${t} in ${o}ms (attempt ${e.reconnectAttempts + 1})`);
    const a = setTimeout(async () => {
      e.reconnectAttempts++;
      try {
        console.log(`[RoomManager] Attempting to reconnect room ${t} (attempt ${e.reconnectAttempts})`), await e.adapter.reconnect();
      } catch (c) {
        console.error(`[RoomManager] Reconnection attempt ${e.reconnectAttempts} failed for room ${t}:`, c);
      }
      this.reconnectTimers.delete(t);
    }, o);
    this.reconnectTimers.set(t, a);
  }
  async shutdown() {
    console.log("[RoomManager] Shutting down...");
    for (const e of this.reconnectTimers.values())
      clearTimeout(e);
    this.reconnectTimers.clear(), await this.disconnectAllRooms(), this.removeAllListeners(), console.log("[RoomManager] Shutdown complete");
  }
}
const Ge = 15e3, ns = 3e4;
class is {
  wss = null;
  clients = /* @__PURE__ */ new Map();
  // 修改为Map以支持clientId
  pingInterval = null;
  // 添加生成客户端ID的方法
  generateClientId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  /**
   * 初始化 WebSocket 服务器
   */
  initialize(e) {
    this.wss = new Ut({ server: e }), this.wss.on("connection", (t, s) => {
      const r = this.generateClientId();
      console.log(`[WsHub] Client connected: ${r} from ${s.socket.remoteAddress}`), this.clients.set(r, t), this.sendToClientMsg(r, {
        type: "connected",
        clientId: r,
        timestamp: Date.now()
      }), t.on("message", (n) => {
        try {
          const i = JSON.parse(n.toString());
          this.handleClientMessage(r, i);
        } catch (i) {
          console.error(`[WsHub] Failed to parse message from client ${r}:`, i);
        }
      }), t.on("close", () => {
        console.log(`[WsHub] Client disconnected: ${r}`), this.clients.delete(r);
      }), t.on("error", (n) => {
        console.error(`[WsHub] WebSocket error for client ${r}:`, n), this.clients.delete(r);
      });
    }), this.startPingInterval(), console.log("[WsHub] WebSocket server initialized");
  }
  /**
   * 处理客户端消息
   */
  handleClientMessage(e, t) {
    console.log(`[WsHub] Received message from client ${e}:`, t);
  }
  /**
   * 处理内部消息
   */
  handleMessage(e, t) {
    switch (t.op) {
      case "ping":
        this.sendToClientMsgByWs(e, { op: "pong" });
        break;
      case "pong":
        break;
      default:
        console.warn("[WsHub] Unknown message type:", t.op);
    }
  }
  /**
   * 广播事件到所有连接的客户端
   */
  broadcastEvent(e) {
    const t = {
      op: "event",
      d: e
    };
    this.broadcast(t);
  }
  /**
   * 广播房间状态更新
   */
  broadcastRoomStatus(e, t) {
    const s = {
      op: "room_status",
      d: {
        room_id: e,
        status: t,
        timestamp: Date.now()
      }
    };
    this.broadcast(s);
  }
  /**
   * 广播高层活动事件（不含敏感信息）
   */
  broadcastActivity(e, t, s) {
    const r = {
      op: "activity",
      d: {
        type: e,
        payload: t,
        ts: s ?? Date.now()
      }
    };
    this.broadcast(r);
  }
  /**
   * 广播消息到所有客户端
   */
  broadcast(e) {
    const t = JSON.stringify(e), s = [];
    this.clients.forEach((r, n) => {
      if (r.readyState === Be.OPEN)
        try {
          r.send(t);
        } catch (i) {
          console.error(`[WsHub] Failed to send message to client ${n}:`, i), s.push(n);
        }
      else
        s.push(n);
    }), s.forEach((r) => {
      this.clients.delete(r);
    });
  }
  /**
   * 发送消息到指定客户端 (通过WebSocket对象)
   */
  sendToClientMsgByWs(e, t) {
    if (e.readyState === Be.OPEN)
      try {
        e.send(JSON.stringify(t));
      } catch (s) {
        console.error("[WsHub] Failed to send message to client:", s);
      }
  }
  /**
   * 发送消息到指定客户端 (通过clientId)
   */
  sendToClientMsg(e, t) {
    const s = this.clients.get(e);
    if (!s)
      return console.warn(`[WsHub] Attempted to send message to non-existent client: ${e}`), !1;
    if (s.readyState !== Be.OPEN)
      return console.warn(`[WsHub] Attempted to send message to closed connection: ${e}`), this.clients.delete(e), !1;
    try {
      return s.send(JSON.stringify(t)), !0;
    } catch (r) {
      return console.error(`[WsHub] Failed to send message to client ${e}:`, r), this.clients.delete(e), !1;
    }
  }
  /**
   * 启动心跳检测
   */
  startPingInterval() {
    this.pingInterval = setInterval(() => {
      const e = { op: "ping" };
      this.broadcast(e);
    }, ns);
  }
  /**
   * 获取连接数
   */
  getClientCount() {
    return this.clients.size;
  }
  /**
   * 关闭 WebSocket 服务器
   */
  close() {
    this.pingInterval && (clearInterval(this.pingInterval), this.pingInterval = null), this.clients.forEach((e) => {
      e.readyState === Be.OPEN && e.close();
    }), this.clients.clear(), this.wss && (this.wss.close(), this.wss = null), console.log("[WsHub] WebSocket server closed");
  }
}
class os {
  databaseManager;
  constructor(e) {
    this.databaseManager = e;
  }
  async queryEvents(e) {
    const { room_id: t, room_kw: s, from_ts: r, to_ts: n, from_date: i, to_date: o, type: a, types: c, user_id: d, user_kw: f, q: w, page: v = 1, pageSize: _ = 200, live_id: b } = e, h = (v - 1) * _, u = { comment: "danmaku", gift: "gift", like: "like", enterRoom: "enter", followAuthor: "follow" }, l = Array.isArray(c) && c.length > 0 ? c : a ? [a] : void 0, y = l ? l.filter((M) => ["danmaku", "gift", "like", "enter", "follow"].includes(M)) : void 0, E = [], p = [], A = await this.hasUsersNicknameColumn();
    if (t && (E.push("a.liver_id = ?"), p.push(t)), b && (E.push("a.live_id = ?"), p.push(b)), E.push("a.user_id IS NOT NULL AND CAST(a.user_id AS INTEGER) <> 0"), s && !t) {
      const M = await this.resolveRoomIdsByKeyword(s);
      if (M.length === 0) return { items: [], total: 0, page: v, pageSize: _, hasNext: !1 };
      E.push(`a.live_id IN (${M.map(() => "?").join(",")})`), p.push(...M);
    }
    if (!!!(i || o))
      r && (E.push("a.send_time >= ?"), p.push(r)), n && (E.push("a.send_time <= ?"), p.push(n));
    else {
      const M = [], J = [];
      i && (M.push("date(created_at) >= date(?)"), J.push(i)), o && (M.push("date(created_at) <= date(?)"), J.push(o)), t && (M.push("room_id = ?"), J.push(t));
      const ee = M.length ? `WHERE ${M.join(" AND ")}` : "", He = await this.executeQuery(
        `SELECT DISTINCT live_id FROM rooms_meta ${ee}`,
        J
      ), me = Array.from(new Set(He.map((ot) => String(ot.live_id)).filter(Boolean)));
      if (me.length === 0)
        return { items: [], total: 0, page: v, pageSize: _, hasNext: !1 };
      E.push(`a.live_id IN (${me.map(() => "?").join(",")})`), p.push(...me);
    }
    if (d && (E.push("a.user_id = ?"), p.push(d)), Array.isArray(e.user_ids) && e.user_ids.length > 0) {
      const M = e.user_ids.map((J) => String(J)).filter(Boolean);
      M.length > 0 && (E.push(`a.user_id IN (${M.map(() => "?").join(",")})`), p.push(...M));
    }
    const k = !!(f && f.trim().length > 0 && A);
    k && (E.push("u.nickname LIKE ?"), p.push(`%${f.trim()}%`));
    const D = !!(w && w.trim().length > 0);
    if (D) {
      const M = `%${w.trim()}%`;
      A ? (E.push('(COALESCE(u.nickname,"") LIKE ? OR COALESCE(a.content,"") LIKE ? OR COALESCE(a.extra_json,"") LIKE ?)'), p.push(M, M, M)) : (E.push('(COALESCE(a.content,"") LIKE ? OR COALESCE(a.extra_json,"") LIKE ?)'), p.push(M, M));
    }
    if (y && y.length > 0) {
      const M = y.map((J) => Object.keys(u).find((ee) => u[ee] === J)).filter(Boolean);
      M.length > 0 ? (E.push(`a.action_type IN (${M.map(() => "?").join(",")})`), p.push(...M)) : E.push("1=0");
    }
    const N = E.length > 0 ? `WHERE ${E.join(" AND ")}` : "", B = `
      ${`
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
        ${A ? "COALESCE(u.nickname, '')" : "COALESCE(json_extract(a.extra_json, '$.user.userName'), json_extract(a.extra_json, '$.user.nickname'), json_extract(a.extra_json, '$.user.name'), json_extract(a.extra_json, '$.userName'), json_extract(a.extra_json, '$.nickname'))"} AS user_name,
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
      ${N}
    `}
      ORDER BY ts DESC, _id DESC
      LIMIT ? OFFSET ?
    `, W = process.env.ACFRAME_DEBUG_LOGS === "1", V = Date.now(), X = await this.executeQuery(B, [...p, _, h]);
    if (W)
      try {
        console.log("[QueryService] events list ms=", Date.now() - V);
      } catch {
      }
    const L = `SELECT COUNT(1) AS c ${A && (k || D) ? "FROM live_actions a LEFT JOIN users u ON u.user_id = a.user_id" : "FROM live_actions a"} ${N}`, O = Date.now(), [F] = await this.executeQuery(L, p);
    if (W)
      try {
        console.log("[QueryService] events count ms=", Date.now() - O);
      } catch {
      }
    const U = F?.c || 0, j = h + _ < U;
    return { items: X.map((M) => {
      const J = M.raw ? ft(M.raw) : null;
      let ee = J && typeof J == "object" ? { ...J } : {};
      const He = M.user_avatar ? String(M.user_avatar) : "";
      let me = null;
      if (M.user_raw_json)
        try {
          const ue = JSON.parse(String(M.user_raw_json)), oe = ue?.userInfo?.medal || ue?.medal;
          oe && (me = { clubName: String(oe.clubName || ""), level: Number(oe.level || 0) });
        } catch {
        }
      if (!me) {
        const ue = Number(M.user_medal_level || 0), oe = String(M.user_medal_club || "");
        (ue || oe) && (me = { clubName: oe, level: ue });
      }
      const Te = { ...ee.userInfo || ee.user || {} };
      He && (Te.avatar = He), me && !Te.medal && (Te.medal = me), Object.keys(Te).length > 0 && (ee.userInfo ? ee.userInfo = Te : ee.user = Te);
      let at = M.content ? String(M.content) : null;
      if (M.event_type === "gift") {
        const ue = Number(M.gift_count || ee?.count) || 1, oe = String(M.gift_name || ee?.giftDetail?.giftName || "") || "";
        let Le = Number(M.gift_value);
        if (!Le || isNaN(Le)) {
          const ct = Number(ee?.giftDetail?.price || 0);
          Le = ct && ue ? ct * ue : Number(ee?.value || 0);
        }
        const Et = oe ? /香蕉|蕉|banana/i.test(oe) : !1;
        oe && (at = Et ? `送了${ue}个${oe}` : `送了${ue}个${oe}（价值${Le / 1e4}元）`), ee = { ...ee, gift: { count: ue, gift_name: oe, value: Number(Le || 0) } };
      }
      return {
        ts: Number(M.ts),
        received_at: Number(M.ts),
        room_id: String(M.room_id),
        live_id: M.live_id != null ? String(M.live_id) : void 0,
        source: String(M.source || "acfun"),
        event_type: M.event_type,
        user_id: M.user_id ? String(M.user_id) : null,
        user_name: M.user_name ? String(M.user_name) : null,
        content: at,
        raw: ee
      };
    }), total: U, page: v, pageSize: _, hasNext: j };
  }
  async deleteEvents(e) {
    const { room_id: t, room_kw: s, from_ts: r, to_ts: n, from_date: i, to_date: o, type: a, types: c, user_id: d, user_kw: f, q: w, live_id: v } = e, _ = { comment: "danmaku", gift: "gift", like: "like", enterRoom: "enter", followAuthor: "follow" }, b = Array.isArray(c) && c.length > 0 ? c : a ? [a] : void 0, h = b ? b.filter((D) => ["danmaku", "gift", "like", "enter", "follow"].includes(D)) : void 0, u = [], l = [], y = await this.hasUsersNicknameColumn();
    if (t && (u.push("a.liver_id = ?"), l.push(t)), v && (u.push("a.live_id = ?"), l.push(v)), u.push("a.user_id IS NOT NULL AND CAST(a.user_id AS INTEGER) <> 0"), s && !t) {
      const D = await this.resolveRoomIdsByKeyword(s);
      if (D.length === 0) return 0;
      u.push(`a.live_id IN (${D.map(() => "?").join(",")})`), l.push(...D);
    }
    if (!!!(i || o))
      r && (u.push("a.send_time >= ?"), l.push(r)), n && (u.push("a.send_time <= ?"), l.push(n));
    else {
      const D = [], N = [];
      i && (D.push("date(created_at) >= date(?)"), N.push(i)), o && (D.push("date(created_at) <= date(?)"), N.push(o)), t && (D.push("room_id = ?"), N.push(t));
      const H = D.length ? `WHERE ${D.join(" AND ")}` : "", B = await this.executeQuery(
        `SELECT DISTINCT live_id FROM rooms_meta ${H}`,
        N
      ), W = Array.from(new Set(B.map((V) => String(V.live_id)).filter(Boolean)));
      if (W.length === 0)
        return 0;
      u.push(`a.live_id IN (${W.map(() => "?").join(",")})`), l.push(...W);
    }
    if (d && (u.push("a.user_id = ?"), l.push(d)), Array.isArray(e.user_ids) && e.user_ids.length > 0) {
      const D = e.user_ids.map((N) => String(N)).filter(Boolean);
      D.length > 0 && (u.push(`a.user_id IN (${D.map(() => "?").join(",")})`), l.push(...D));
    }
    if (!!(f && f.trim().length > 0 && y) && (u.push("u.nickname LIKE ?"), l.push(`%${f.trim()}%`)), !!(w && w.trim().length > 0)) {
      const D = `%${w.trim()}%`;
      y ? (u.push('(COALESCE(u.nickname,"") LIKE ? OR COALESCE(a.content,"") LIKE ? OR COALESCE(a.extra_json,"") LIKE ?)'), l.push(D, D, D)) : (u.push('(COALESCE(a.content,"") LIKE ? OR COALESCE(a.extra_json,"") LIKE ?)'), l.push(D, D));
    }
    if (h && h.length > 0) {
      const D = h.map((N) => Object.keys(_).find((H) => _[H] === N)).filter(Boolean);
      D.length > 0 ? (u.push(`a.action_type IN (${D.map(() => "?").join(",")})`), l.push(...D)) : u.push("1=0");
    }
    const k = `
      DELETE FROM live_actions 
      WHERE id IN (
        SELECT a.id 
        FROM live_actions a 
        LEFT JOIN users u ON u.user_id = a.user_id 
        ${u.length > 0 ? `WHERE ${u.join(" AND ")}` : ""}
      )
    `;
    return new Promise((D, N) => {
      const H = this.databaseManager.getDb(), B = this.databaseManager;
      H.run(k, l, function(W) {
        if (W) {
          console.error("[QueryService] deleteEvents error:", W), N(W);
          return;
        }
        const V = typeof this.changes == "number" ? this.changes : 0;
        V > 0 && B.vacuum().catch((X) => {
          try {
            console.error("[QueryService] VACUUM after deleteEvents failed:", X);
          } catch {
          }
        }), D(V);
      });
    });
  }
  async hasUsersNicknameColumn() {
    try {
      if (!(await this.executeQuery("PRAGMA table_info(users)", [])).some((s) => String(s.name).toLowerCase() === "nickname")) return !1;
      try {
        return await this.executeQuery("SELECT nickname FROM users LIMIT 1", []), !0;
      } catch {
        return !1;
      }
    } catch {
      return !1;
    }
  }
  async executeQuery(e, t = []) {
    return new Promise((s, r) => {
      this.databaseManager.getDb().all(e, t, (i, o) => {
        if (i) {
          try {
            console.error("SQL ERROR:", i?.message || i), console.error("SQL:", e), console.error("PARAMS:", t);
          } catch {
          }
          r(i);
        } else
          s(o);
      });
    });
  }
  async getEventById(e) {
    const s = await this.executeQuery(`
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
    `, [e, e]);
    if (s.length === 0) return null;
    const r = s[0];
    return { ts: Number(r.ts), received_at: Number(r.ts), room_id: String(r.room_id), live_id: r.live_id != null ? String(r.live_id) : void 0, source: String(r.source || "acfun"), event_type: r.event_type, user_id: r.user_id ? String(r.user_id) : null, user_name: r.user_name ? String(r.user_name) : null, content: r.content ? String(r.content) : null, raw: r.raw ? ft(r.raw) : null };
  }
  async getEventStats(e) {
    const t = {};
    let s = 0, r = null, n = null;
    const i = e ? "WHERE a.liver_id = ?" : "", o = e ? [e] : [], a = await this.executeQuery(`SELECT a.action_type AS type, COUNT(1) AS cnt, MIN(a.send_time) AS earliest, MAX(a.send_time) AS latest FROM live_actions a ${i} GROUP BY a.action_type`, o);
    for (const w of a) {
      const v = w.type === "comment" ? "danmaku" : w.type === "enterRoom" ? "enter" : w.type === "followAuthor" ? "follow" : w.type;
      t[v] = (t[v] || 0) + w.cnt, s += w.cnt, r = r == null ? w.earliest : Math.min(r, w.earliest), n = n == null ? w.latest : Math.max(n, w.latest);
    }
    const c = e ? "WHERE s.liver_id = ?" : "", d = e ? [e] : [], f = await this.executeQuery(`SELECT s.state_type AS type, COUNT(1) AS cnt, MIN(s.report_time) AS earliest, MAX(s.report_time) AS latest FROM live_states s ${c} GROUP BY s.state_type`, d);
    for (const w of f)
      t[w.type] = (t[w.type] || 0) + w.cnt, s += w.cnt, r = r == null ? w.earliest : Math.min(r, w.earliest), n = n == null ? w.latest : Math.max(n, w.latest);
    return { total: s, byType: t, dateRange: { earliest: r, latest: n } };
  }
  // 根据主播用户名关键词解析 room_id 集合（使用 rooms_meta，必要时从 API 补充）
  async resolveRoomIdsByKeyword(e) {
    const t = e.trim();
    if (!t) return [];
    const s = `%${t}%`, n = (await this.executeQuery(
      "SELECT room_id FROM rooms_meta WHERE streamer_name LIKE ?",
      [s]
    )).map((f) => String(f.room_id));
    if (n.length > 0)
      return n;
    const o = (await this.executeQuery(
      `SELECT room_id FROM (
        SELECT DISTINCT live_id AS room_id FROM live_actions
        UNION
        SELECT DISTINCT live_id AS room_id FROM live_states
      )`,
      []
    )).map((f) => String(f.room_id));
    if (o.length === 0) return [];
    const c = te.getInstance().getApiInstance();
    for (const f of o)
      try {
        let w, v;
        try {
          const _ = await c.live.getUserLiveInfo(Number(f));
          if (_ && _.success) {
            const b = _.data?.profile || {};
            typeof b.userName == "string" && b.userName.trim().length > 0 && (w = String(b.userName)), b.userID != null && (v = String(b.userID));
          }
        } catch {
        }
        if (!w)
          try {
            const _ = await c.danmu.getLiveRoomInfo(f), b = _?.data?.owner || _?.owner || {}, h = b.userName || b.nickname || b.name;
            typeof h == "string" && h.trim().length > 0 && (w = String(h));
            const u = b.userID || b.uid || b.id;
            u != null && (v = String(u));
          } catch {
          }
        w && await this.executeRun(
          `INSERT INTO rooms_meta (live_id, room_id, streamer_name, streamer_user_id, updated_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(live_id) DO UPDATE SET streamer_name=excluded.streamer_name, streamer_user_id=excluded.streamer_user_id, room_id=excluded.room_id, updated_at=CURRENT_TIMESTAMP`,
          [f, v || null, w, v || null]
        );
      } catch {
      }
    return (await this.executeQuery(
      "SELECT room_id FROM rooms_meta WHERE streamer_name LIKE ?",
      [s]
    )).map((f) => String(f.room_id));
  }
  async executeRun(e, t = []) {
    return new Promise((s, r) => {
      this.databaseManager.getDb().run(e, t, (i) => {
        if (i) {
          try {
            console.error("SQL EXEC ERROR:", i?.message || i), console.error("SQL:", e), console.error("PARAMS:", t);
          } catch {
          }
          r(i);
        } else
          s();
      });
    });
  }
  async listRooms(e = 200) {
    const r = (await this.executeQuery(`
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
    `, [e])).map((i) => ({ roomId: String(i.room_id), streamerName: i.streamer_name || "" })), n = r.filter((i) => !i.streamerName || i.streamerName.trim().length === 0);
    if (n.length > 0) {
      const o = te.getInstance().getApiInstance(), a = process.env.ACFRAME_DEBUG_LOGS === "1";
      for (const c of n)
        try {
          let d, f;
          if (o) {
            try {
              const w = await o.live.getUserLiveInfo(Number(c.roomId));
              if (w && w.success) {
                const v = w.data?.profile || {};
                v.userName && (d = String(v.userName)), v.userID != null && (f = String(v.userID));
              }
            } catch {
            }
            if (!d)
              try {
                const w = await o.danmu.getLiveRoomInfo(c.roomId), v = w?.data?.owner || w?.owner || {}, _ = v.userName || v.nickname || v.name;
                typeof _ == "string" && _.trim().length > 0 && (d = String(_));
                const b = v.userID || v.uid || v.id;
                b != null && (f = String(b));
              } catch {
              }
          }
          d && (await this.executeRun(
            `INSERT INTO rooms_meta (live_id, room_id, streamer_name, streamer_user_id, created_at)
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(live_id) DO UPDATE SET streamer_name=excluded.streamer_name, streamer_user_id=excluded.streamer_user_id, room_id=excluded.room_id`,
            [c.roomId, f || null, d, f || null]
          ), c.streamerName = d);
        } catch (d) {
          if (a)
            try {
              console.warn("[QueryService] listRooms enrich failed", c.roomId, d);
            } catch {
            }
        }
    }
    return r;
  }
  async getDbInfo() {
    const e = await this.executeQuery("SELECT COUNT(*) AS total FROM live_actions", []), t = await this.executeQuery("SELECT COUNT(*) AS total FROM live_states", []), s = await this.executeQuery(
      `SELECT ts, room_id FROM (
        SELECT MAX(send_time) AS ts, live_id AS room_id FROM live_actions
        UNION ALL
        SELECT MAX(report_time) AS ts, live_id AS room_id FROM live_states
      ) ORDER BY ts DESC LIMIT 10`,
      []
    ), r = await this.executeQuery("SELECT COUNT(*) AS total FROM rooms_meta", []), n = s[0]?.ts ?? null, i = Array.from(new Set(s.map((o) => String(o.room_id))));
    return { eventsCount: (e[0]?.total || 0) + (t[0]?.total || 0), latestEventTs: n, latestRoomIds: i, roomsMetaCount: r[0]?.total || 0 };
  }
  async getEventsSample(e = 20) {
    return (await this.executeQuery(
      `SELECT id, room_id, type, ts FROM (
        SELECT a.id AS id, a.liver_id AS room_id, a.action_type AS type, a.send_time AS ts FROM live_actions a
        UNION ALL
        SELECT s.id AS id, s.liver_id AS room_id, s.state_type AS type, s.report_time AS ts FROM live_states s
      ) ORDER BY ts DESC, id DESC LIMIT ?`,
      [e]
    )).map((s) => ({ id: s.id, room_id: String(s.room_id), type: String(s.type), ts: Number(s.ts) }));
  }
  async listUsers(e = 200, t) {
    return await this.hasUsersNicknameColumn() ? t ? (await this.executeQuery(
      `SELECT DISTINCT CAST(u.user_id AS TEXT) AS user_id, COALESCE(u.nickname,'') AS nickname
           FROM users u
           WHERE EXISTS (SELECT 1 FROM live_actions a WHERE a.user_id = u.user_id AND a.liver_id = ?)
           ORDER BY nickname ASC
           LIMIT ?`,
      [t, e]
    )).map((i) => ({ id: String(i.user_id), name: i.nickname || String(i.user_id) })) : (await this.executeQuery(
      `SELECT CAST(user_id AS TEXT) AS user_id, COALESCE(nickname,'') AS nickname
         FROM users
         ORDER BY updated_at DESC
         LIMIT ?`,
      [e]
    )).map((n) => ({ id: String(n.user_id), name: n.nickname || String(n.user_id) })) : t ? (await this.executeQuery(
      `SELECT DISTINCT CAST(a.user_id AS TEXT) AS user_id, COALESCE(json_extract(a.extra_json, '$.user.userName'),'') AS name
           FROM live_actions a
           WHERE a.liver_id = ? AND a.user_id IS NOT NULL
           ORDER BY name ASC
           LIMIT ?`,
      [t, e]
    )).map((i) => ({ id: String(i.user_id), name: i.name || String(i.user_id) })) : (await this.executeQuery(
      `SELECT DISTINCT CAST(a.user_id AS TEXT) AS user_id, COALESCE(json_extract(a.extra_json, '$.user.userName'),'') AS name
         FROM live_actions a
         WHERE a.user_id IS NOT NULL
         ORDER BY name ASC
         LIMIT ?`,
      [e]
    )).map((n) => ({ id: String(n.user_id), name: n.name || String(n.user_id) }));
  }
  async searchUsers(e, t = 1, s = 20, r) {
    const i = `%${String(e || "").trim()}%`, o = (t - 1) * s;
    if (await this.hasUsersNicknameColumn()) {
      if (r) {
        const v = await this.executeQuery(
          `SELECT CAST(u.user_id AS TEXT) AS user_id, COALESCE(u.nickname,'') AS nickname
           FROM users u
           WHERE EXISTS (SELECT 1 FROM live_actions a WHERE a.user_id = u.user_id AND a.liver_id = ?)
             AND COALESCE(u.nickname,'') LIKE ?
           ORDER BY nickname ASC
           LIMIT ? OFFSET ?`,
          [r, i, s, o]
        ), b = (await this.executeQuery(
          "SELECT COUNT(1) AS c FROM users u WHERE EXISTS (SELECT 1 FROM live_actions a WHERE a.user_id = u.user_id AND a.liver_id = ?) AND COALESCE(u.nickname,'') LIKE ?",
          [r, i]
        ))[0]?.c || 0;
        return { items: v.map((u) => ({ id: String(u.user_id), name: u.nickname || String(u.user_id) })), total: b, page: t, pageSize: s, hasNext: o + s < b };
      }
      const c = await this.executeQuery(
        `SELECT CAST(user_id AS TEXT) AS user_id, COALESCE(nickname,'') AS nickname
         FROM users
         WHERE COALESCE(nickname,'') LIKE ?
         ORDER BY nickname ASC
         LIMIT ? OFFSET ?`,
        [i, s, o]
      ), f = (await this.executeQuery(
        "SELECT COUNT(1) AS c FROM users WHERE COALESCE(nickname,'') LIKE ?",
        [i]
      ))[0]?.c || 0;
      return { items: c.map((v) => ({ id: String(v.user_id), name: v.nickname || String(v.user_id) })), total: f, page: t, pageSize: s, hasNext: o + s < f };
    } else {
      if (r) {
        const v = await this.executeQuery(
          `SELECT DISTINCT CAST(a.user_id AS TEXT) AS user_id, COALESCE(json_extract(a.extra_json, '$.user.userName'),'') AS name
           FROM live_actions a
           WHERE a.liver_id = ? AND COALESCE(json_extract(a.extra_json, '$.user.userName'),'') LIKE ?
           ORDER BY name ASC
           LIMIT ? OFFSET ?`,
          [r, i, s, o]
        ), b = (await this.executeQuery(
          `SELECT COUNT(1) AS c FROM (
             SELECT DISTINCT a.user_id
             FROM live_actions a
             WHERE a.liver_id = ? AND COALESCE(json_extract(a.extra_json, '$.user.userName'),'') LIKE ?
           )`,
          [r, i]
        ))[0]?.c || 0;
        return { items: v.map((u) => ({ id: String(u.user_id), name: u.name || String(u.user_id) })), total: b, page: t, pageSize: s, hasNext: o + s < b };
      }
      const c = await this.executeQuery(
        `SELECT DISTINCT CAST(a.user_id AS TEXT) AS user_id, COALESCE(json_extract(a.extra_json, '$.user.userName'),'') AS name
         FROM live_actions a
         WHERE COALESCE(json_extract(a.extra_json, '$.user.userName'),'') LIKE ?
         ORDER BY name ASC
         LIMIT ? OFFSET ?`,
        [i, s, o]
      ), f = (await this.executeQuery(
        `SELECT COUNT(1) AS c FROM (
           SELECT DISTINCT a.user_id
           FROM live_actions a
           WHERE COALESCE(json_extract(a.extra_json, '$.user.userName'),'') LIKE ?
         )`,
        [i]
      ))[0]?.c || 0;
      return { items: c.map((v) => ({ id: String(v.user_id), name: v.name || String(v.user_id) })), total: f, page: t, pageSize: s, hasNext: o + s < f };
    }
  }
  async getEventDates(e) {
    const t = e ? "WHERE room_id = ?" : "", s = e ? [e] : [];
    return (await this.executeQuery(
      `SELECT strftime('%Y-%m-%d', created_at) AS d FROM rooms_meta ${t} GROUP BY d ORDER BY d DESC`,
      s
    )).map((n) => String(n.d || "")).filter(Boolean);
  }
}
function ft(g) {
  try {
    return JSON.parse(g);
  } catch {
    return null;
  }
}
class as {
  queryService;
  exportDir;
  constructor(e) {
    this.queryService = e;
    const t = R.getPath("userData");
    this.exportDir = I.join(t, "exports"), S.existsSync(this.exportDir) || S.mkdirSync(this.exportDir, { recursive: !0 });
  }
  async exportToCsv(e) {
    const {
      filename: t,
      includeRaw: s = !1,
      ...r
    } = e, n = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19), i = t || `events-${n}.csv`, o = I.join(this.exportDir, i), a = S.createWriteStream(o, { encoding: "utf8" });
    try {
      const c = [
        "ts",
        "received_at",
        "room_id",
        "source",
        "event_type",
        "user_id",
        "user_name",
        "content"
      ];
      s && c.push("raw"), a.write(c.join(",") + `
`);
      let d = 1, f = 0;
      const w = 1e3;
      for (; ; ) {
        const b = await this.queryService.queryEvents({
          ...r,
          page: d,
          pageSize: w
        });
        if (b.items.length === 0)
          break;
        for (const h of b.items) {
          const u = this.formatEventToCsvRow(h, s);
          a.write(u + `
`), f++;
        }
        if (!b.hasNext)
          break;
        d++;
      }
      await new Promise((b, h) => {
        a.end((u) => {
          u ? h(u) : b();
        });
      });
      const _ = S.statSync(o).size;
      return {
        filename: i,
        filepath: o,
        recordCount: f,
        fileSize: _
      };
    } catch (c) {
      throw S.existsSync(o) && S.unlinkSync(o), c;
    }
  }
  formatEventToCsvRow(e, t) {
    const s = [
      e.ts.toString(),
      (e.received_at || e.ts).toString(),
      this.escapeCsvValue(e.room_id),
      this.escapeCsvValue(e.source || "unknown"),
      this.escapeCsvValue(e.event_type),
      this.escapeCsvValue(e.user_id || ""),
      this.escapeCsvValue(e.user_name || ""),
      this.escapeCsvValue(e.content || "")
    ];
    if (t) {
      const r = e.raw ? JSON.stringify(e.raw) : "";
      s.push(this.escapeCsvValue(r));
    }
    return s.join(",");
  }
  escapeCsvValue(e) {
    return e ? e.includes(",") || e.includes('"') || e.includes(`
`) || e.includes("\r") ? `"${e.replace(/"/g, '""')}"` : e : "";
  }
  getExportDir() {
    return this.exportDir;
  }
  setExportDir(e) {
    this.exportDir = e, S.existsSync(this.exportDir) || S.mkdirSync(this.exportDir, { recursive: !0 });
  }
  async listExportFiles() {
    return S.existsSync(this.exportDir) ? S.readdirSync(this.exportDir).filter((r) => r.endsWith(".csv")).map((r) => {
      const n = I.join(this.exportDir, r), i = S.statSync(n);
      return {
        filename: r,
        filepath: n,
        size: i.size,
        createdAt: i.birthtime
      };
    }).sort((r, n) => n.createdAt.getTime() - r.createdAt.getTime()) : [];
  }
  async deleteExportFile(e) {
    const t = I.join(this.exportDir, e);
    if (!S.existsSync(t))
      return !1;
    try {
      return S.unlinkSync(t), !0;
    } catch (s) {
      return console.error("Error deleting export file:", s), !1;
    }
  }
}
let cs = class {
  records = /* @__PURE__ */ new Map();
  configs = /* @__PURE__ */ new Map();
  endpointConfigs = /* @__PURE__ */ new Map();
  defaultConfig = {
    requests: 100,
    windowMs: 60 * 1e3,
    // 1分钟
    skipSuccessfulRequests: !1,
    skipFailedRequests: !1
  };
  persistFile;
  constructor() {
    setInterval(() => this.cleanup(), 60 * 1e3);
    try {
      const t = require("electron")?.app?.getPath("userData"), s = require("path");
      this.persistFile = t ? s.join(t, "rate-limit.json") : void 0, this.loadFromFile();
    } catch {
    }
  }
  /**
   * 设置插件的速率限制配置
   */
  setConfig(e, t) {
    this.configs.set(e, t), this.saveToFile();
  }
  /**
   * 获取插件的速率限制配置
   */
  getConfig(e) {
    return this.configs.get(e) || this.defaultConfig;
  }
  setEndpointConfig(e, t, s) {
    const r = this.endpointConfigs.get(e) || /* @__PURE__ */ new Map();
    r.set(t, s), this.endpointConfigs.set(e, r), this.saveToFile();
  }
  getEndpointConfig(e, t) {
    const s = this.endpointConfigs.get(e);
    return s ? s.get(t) : void 0;
  }
  /**
   * 检查是否允许请求
   */
  checkLimit(e, t) {
    const s = t ? `${e}:${t}` : e, r = t && this.getEndpointConfig(e, t) || this.getConfig(e), n = Date.now();
    let i = this.records.get(s);
    i || (i = {
      requests: 0,
      windowStart: n,
      lastRequest: n
    }, this.records.set(s, i)), n - i.windowStart >= r.windowMs && (i.requests = 0, i.windowStart = n);
    const o = Math.max(0, r.requests - i.requests), a = i.windowStart + r.windowMs;
    return i.requests >= r.requests ? {
      allowed: !1,
      remaining: 0,
      resetTime: a,
      retryAfter: Math.ceil((a - n) / 1e3)
    } : (i.requests++, i.lastRequest = n, {
      allowed: !0,
      remaining: o - 1,
      resetTime: a
    });
  }
  /**
   * 记录请求结果（用于跳过成功/失败请求的配置）
   */
  recordRequest(e, t, s) {
    const r = t && this.getEndpointConfig(e, t) || this.getConfig(e);
    r.skipSuccessfulRequests && s && this.decrementCount(e, t), r.skipFailedRequests && !s && this.decrementCount(e, t);
  }
  /**
   * 减少请求计数
   */
  decrementCount(e, t) {
    const s = t ? `${e}:${t}` : e, r = this.records.get(s);
    r && r.requests > 0 && r.requests--;
  }
  /**
   * 获取插件的当前限制状态
   */
  getStatus(e) {
    const t = this.getConfig(e), s = this.records.get(e), r = Date.now();
    return s ? r - s.windowStart >= t.windowMs ? {
      requests: 0,
      remaining: t.requests,
      resetTime: r + t.windowMs,
      windowMs: t.windowMs
    } : {
      requests: s.requests,
      remaining: Math.max(0, t.requests - s.requests),
      resetTime: s.windowStart + t.windowMs,
      windowMs: t.windowMs
    } : {
      requests: 0,
      remaining: t.requests,
      resetTime: r + t.windowMs,
      windowMs: t.windowMs
    };
  }
  /**
   * 重置插件的速率限制
   */
  reset(e, t) {
    const s = t ? `${e}:${t}` : e;
    this.records.delete(s);
  }
  setDefaultConfig(e) {
    this.defaultConfig = { ...e }, this.saveToFile();
  }
  saveToFile() {
    if (this.persistFile)
      try {
        const e = {
          configs: Array.from(this.configs.entries()),
          endpointConfigs: Array.from(this.endpointConfigs.entries()).map(([t, s]) => [t, Array.from(s.entries())])
        };
        require("fs").writeFileSync(this.persistFile, JSON.stringify(e));
      } catch {
      }
  }
  loadFromFile() {
    if (this.persistFile)
      try {
        const e = require("fs").readFileSync(this.persistFile, "utf8"), t = JSON.parse(e);
        this.configs = new Map(t.configs || []), this.endpointConfigs = new Map((t.endpointConfigs || []).map((s) => [s[0], new Map(s[1] || [])]));
      } catch {
      }
  }
  /**
   * 清理过期记录
   */
  cleanup() {
    const e = Date.now(), t = [];
    for (const [s, r] of this.records.entries())
      e - r.lastRequest > this.defaultConfig.windowMs * 2 && t.push(s);
    t.forEach((s) => this.records.delete(s));
  }
  /**
   * 获取所有记录（用于调试）
   */
  getAllRecords() {
    return new Map(this.records);
  }
};
const qe = new cs();
class it {
  acfunApi;
  tokenManager;
  config;
  databaseManager;
  pluginManager;
  dataManager = ie.getInstance();
  roomManager;
  static STREAM_STATUS_TTL_MS = 3e3;
  streamStatusCache = /* @__PURE__ */ new Map();
  streamStatusInFlight = /* @__PURE__ */ new Map();
  constructor(e = {}, t, s) {
    this.config = {
      enableAuth: !0,
      enableRateLimit: !0,
      enableRetry: !0,
      allowedOrigins: ["http://localhost:*", "http://127.0.0.1:*"],
      ...e
    }, this.tokenManager = t || te.getInstance(), this.acfunApi = this.tokenManager.getApiInstance(), this.databaseManager = s, this.initializeAuthentication();
  }
  setPluginManager(e) {
    this.pluginManager = e;
  }
  setRoomManager(e) {
    this.roomManager = e;
  }
  broadcast(e, t, s) {
    try {
      const r = this.pluginManager;
      if (!r) return;
      const n = r.getInstalledPlugins().filter((i) => i.enabled);
      for (const i of n) {
        const o = `plugin:${i.id}:overlay`;
        this.dataManager.publish(o, { event: t, payload: s }, { ttlMs: 12e4, persist: !0, meta: { kind: e } });
      }
    } catch {
    }
  }
  /**
   * 初始化认证
   */
  async initializeAuthentication() {
    try {
      this.tokenManager.isAuthenticated() ? console.log("[AcfunApiProxy] Authentication initialized successfully") : console.log("[AcfunApiProxy] No valid authentication found");
    } catch (e) {
      console.warn("[AcfunApiProxy] Failed to initialize authentication:", e);
    }
  }
  /**
   * 创建Express路由处理器
   */
  createRoutes() {
    const e = ve.Router();
    return e.use((t, s, r) => {
      const n = t.get("Origin");
      if (this.isOriginAllowed(n) && (s.header("Access-Control-Allow-Origin", n), s.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"), s.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Plugin-ID"), s.header("Access-Control-Allow-Credentials", "true")), t.method === "OPTIONS")
        return s.sendStatus(200);
      r();
    }), this.config.enableRateLimit && e.use((t, s, r) => {
      const n = this.getClientId(t), i = `${t.method} ${t.path || ""}`, o = qe.checkLimit(n, i);
      if (!o.allowed)
        return s.status(429).json({ success: !1, error: "Rate limit exceeded", code: 429, retryAfter: o.retryAfter });
      t.__endpoint = i, r();
    }), this.config.enableAuth && e.use((t, s, r) => {
      const n = t.headers["x-plugin-id"] || t.query.pluginId || t.body?.pluginId;
      n && (t.pluginId = n), r();
    }), e.all("/*splat", async (t, s) => {
      try {
        const r = t.params.splat, n = Array.isArray(r) ? r.join("/") : r || "", i = await this.handleSpecificEndpoint(t, n);
        if (i) {
          try {
            qe.recordRequest(this.getClientId(t), t.__endpoint, !!i.success);
          } catch {
          }
          return s.status(i.code || (i.success ? 200 : 500)).json(i);
        }
        const o = { success: !1, error: `Unsupported API endpoint: ${t.method} /${n}`, code: 404 };
        try {
          qe.recordRequest(this.getClientId(t), t.__endpoint, !1);
        } catch {
        }
        s.status(o.code || (o.success ? 200 : 500)).json(o);
      } catch (r) {
        console.error("[AcfunApiProxy] Route error:", r);
        try {
          qe.recordRequest(this.getClientId(t), t.__endpoint, !1);
        } catch {
        }
        s.status(500).json({ success: !1, error: "Internal server error", code: 500 });
      }
    }), e;
  }
  /**
   * 处理特定的 API 端点
   */
  async handleSpecificEndpoint(e, t) {
    const s = e.method.toUpperCase(), r = t.split("/").filter(Boolean);
    return r[0] === "auth" ? await this.handleAuthEndpoints(s, r.slice(1), e) : r[0] === "danmu" ? await this.handleDanmuEndpoints(s, r.slice(1), e) : r[0] === "user" ? await this.handleUserEndpoints(s, r.slice(1), e) : r[0] === "live" ? await this.handleLiveEndpoints(s, r.slice(1), e) : r[0] === "gift" ? await this.handleGiftEndpoints(s, r.slice(1), e) : r[0] === "manager" ? await this.handleManagerEndpoints(s, r.slice(1), e) : r[0] === "room" ? await this.handleRoomEndpoints(s, r.slice(1), e) : r[0] === "badge" ? await this.handleBadgeEndpoints(s, r.slice(1), e) : r[0] === "preview" ? await this.handlePreviewEndpoints(s, r.slice(1), e) : r[0] === "replay" ? await this.handleReplayEndpoints(s, r.slice(1), e) : null;
  }
  /**
   * 处理本地房间管理相关端点
   */
  async handleRoomEndpoints(e, t, s) {
    try {
      if (!this.roomManager)
        return { success: !1, error: "RoomManager not initialized", code: 503 };
      switch (t[0]) {
        case "list":
          if (e === "GET")
            return { success: !0, data: this.roomManager.getAllRooms().map((i) => ({
              roomId: i.roomId,
              status: i.status,
              connectedAt: i.connectedAt,
              eventCount: i.eventCount,
              priority: i.priority,
              label: i.label,
              liveId: i.liveId,
              streamInfo: i.streamInfo,
              isManager: i.isManager,
              lastError: i.lastError?.message
            })), code: 200 };
          break;
        case "status":
          if (e === "GET") {
            const r = s.query.roomId;
            if (!r) return { success: !1, error: "roomId is required", code: 400 };
            const n = this.roomManager.getRoomInfo(r);
            return n ? { success: !0, data: {
              roomId: n.roomId,
              status: n.status,
              connectedAt: n.connectedAt,
              eventCount: n.eventCount,
              priority: n.priority,
              label: n.label,
              liveId: n.liveId,
              streamInfo: n.streamInfo,
              isManager: n.isManager,
              lastError: n.lastError?.message
            }, code: 200 } : { success: !1, error: `找不到房间id${r}的信息`, code: 404 };
          }
          break;
        case "add":
          if (e === "POST") {
            const { roomId: r } = s.body;
            if (!r) return { success: !1, error: "roomId is required", code: 400 };
            const n = String(r);
            if (this.roomManager.getRoomInfo(n))
              return { success: !1, error: `房间 ${n} 已在管理列表中`, code: 400 };
            const i = await this.roomManager.addRoom(n);
            return { success: i, code: i ? 200 : 400, error: i ? void 0 : `Failed to add room ${n}` };
          }
          break;
        case "remove":
          if (e === "POST") {
            const { roomId: r } = s.body;
            if (!r) return { success: !1, error: "roomId is required", code: 400 };
            const n = String(r);
            if (!this.roomManager.getRoomInfo(n))
              return { success: !1, error: `未找到房间 ${n}，无法移除`, code: 404 };
            const i = await this.roomManager.removeRoom(n);
            return { success: i, code: i ? 200 : 400, error: i ? void 0 : `Failed to remove room ${n}` };
          }
          break;
      }
      return { success: !1, error: `Unsupported room endpoint: ${e} /${t.join("/")}`, code: 404 };
    } catch (r) {
      return console.error("[AcfunApiProxy] Room endpoint error:", r), { success: !1, error: r.message || "Room endpoint error", code: 500 };
    }
  }
  /**
   * 处理认证相关端点
   */
  async handleAuthEndpoints(e, t, s) {
    try {
      switch (t[0]) {
        case "status":
          if (e === "GET") {
            const r = await this.tokenManager.validateToken();
            return {
              success: !0,
              data: {
                authenticated: !!r?.isValid,
                reason: r?.reason,
                timestamp: Date.now()
              },
              code: 200
            };
          }
          break;
        case "qr-login":
          if (e === "POST") {
            const r = await this.acfunApi.auth.qrLogin();
            return {
              success: r.success,
              data: r.data,
              error: r.error,
              code: r.success ? 200 : 400
            };
          }
          break;
        case "qr-status":
          if (e === "GET") {
            const r = await this.acfunApi.auth.checkQrLoginStatus();
            return {
              success: r.success,
              data: r.data,
              error: r.error,
              code: r.success ? 200 : 400
            };
          }
          break;
        case "token":
          if (e === "POST") {
            const { token: r } = s.body;
            return r ? (await this.tokenManager.updateTokenInfo(typeof r == "string" ? JSON.parse(r) : r), {
              success: !0,
              data: { message: "Token updated successfully" },
              code: 200
            }) : {
              success: !1,
              error: "Token is required",
              code: 400
            };
          } else if (e === "DELETE")
            return await this.tokenManager.clearTokenInfo(), {
              success: !0,
              data: { message: "Token cleared successfully" },
              code: 200
            };
          break;
      }
      return {
        success: !1,
        error: `Unsupported auth endpoint: ${e} /${t.join("/")}`,
        code: 404
      };
    } catch (r) {
      return console.error("[AcfunApiProxy] Auth endpoint error:", r), {
        success: !1,
        error: r.message || "Auth endpoint error",
        code: 500
      };
    }
  }
  /**
   * 处理弹幕相关端点
   */
  async handleDanmuEndpoints(e, t, s) {
    try {
      switch (t[0]) {
        case "connection-state":
          if (e === "GET") {
            const r = this.acfunApi.getHttpClient().getValidatedTokenInfo();
            if (!r.tokenInfo)
              return { success: !1, error: "未登录或token无效", code: 401 };
            const n = String(r.tokenInfo.userID || "");
            if (!n)
              return { success: !1, error: "无法解析用户ID", code: 400 };
            const i = this.roomManager, o = i ? i.getRoomInfo(n) : null, a = !!o && String(o.status) === "connected", c = a && i?.getAdapterSessionId ? String(i.getAdapterSessionId(n) || "") : void 0;
            return { success: !0, data: { connected: a, sessionId: c }, code: 200 };
          }
          break;
        case "start":
          if (e === "POST") {
            const { liverUID: r, callback: n } = s.body;
            if (!r)
              return {
                success: !1,
                error: "liverUID is required",
                code: 400
              };
            const i = this.databaseManager?.getDb(), o = i ? new yt(i) : null;
            let a = null, c = null;
            const d = (w) => {
              if (o)
                try {
                  if (!c && a && this.acfunApi?.danmu) {
                    const v = this.acfunApi.danmu.getSessionDetail(a);
                    v && v.success && v.data && (c = String(v.data.liveID || ""));
                  }
                  c && o.handleEvent(String(c), String(r), w).catch((v) => {
                    try {
                      console.warn("[AcfunApiProxy] persist error:", v);
                    } catch {
                    }
                  });
                } catch {
                }
              try {
                console.log("[AcfunApiProxy] Danmu event:", w);
              } catch {
              }
            }, f = await this.acfunApi.danmu.startDanmu(r, d);
            if (f && f.success) {
              try {
                if (a = String(f.data?.sessionId || ""), a && this.acfunApi?.danmu) {
                  const w = this.acfunApi.danmu.getSessionDetail(a);
                  w && w.success && w.data && (c = String(w.data.liveID || ""));
                }
              } catch {
              }
              this.broadcast("room", "danmu-start", { liverUID: r, ts: Date.now(), sessionId: f.data?.sessionId });
            }
            return {
              success: f.success,
              data: f.data,
              error: f.error,
              code: f.success ? 200 : 400
            };
          }
          break;
        case "stop":
          if (e === "POST") {
            const { sessionId: r } = s.body;
            if (!r)
              return {
                success: !1,
                error: "sessionId is required",
                code: 400
              };
            const n = await this.acfunApi.danmu.stopDanmu(r);
            return n && n.success && this.broadcast("room", "danmu-stop", { sessionId: r, ts: Date.now() }), {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "room-info":
          if (e === "GET") {
            const r = s.query.liverUID;
            if (!r)
              return {
                success: !1,
                error: "liverUID is required",
                code: 400
              };
            const n = await this.acfunApi.danmu.getLiveRoomInfo(r);
            try {
              if (n && n.success && this.databaseManager) {
                const o = this.databaseManager.getDb().prepare(`
                  INSERT INTO rooms_meta (
                    live_id,
                    room_id, streamer_name, streamer_user_id,
                    title, cover_url, status, is_live,
                    viewer_count, online_count, like_count, live_cover,
                    category_id, category_name, sub_category_id, sub_category_name,
                    created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                  ON CONFLICT(live_id) DO UPDATE SET
                    room_id=excluded.room_id,
                    streamer_name=excluded.streamer_name,
                    streamer_user_id=excluded.streamer_user_id,
                    title=excluded.title,
                    cover_url=excluded.cover_url,
                    status=excluded.status,
                    is_live=excluded.is_live,
                    viewer_count=excluded.viewer_count,
                    online_count=excluded.online_count,
                    like_count=excluded.like_count,
                    live_cover=excluded.live_cover,
                    category_id=excluded.category_id,
                    category_name=excluded.category_name,
                    sub_category_id=excluded.sub_category_id,
                    sub_category_name=excluded.sub_category_name
                `), a = n.data || {}, c = a.owner || {}, d = typeof a.title == "string" ? a.title : "", f = typeof a.coverUrl == "string" ? a.coverUrl : "", w = a.liveID ? "open" : "closed", v = a.liveID ? 1 : 0, _ = typeof a.viewerCount == "number" ? a.viewerCount : typeof a.onlineCount == "number" ? a.onlineCount : 0, b = typeof a.liveCover == "string" ? a.liveCover : null, h = a.categoryID ?? a.categoryId ?? null, u = a.categoryName ?? null, l = a.subCategoryID ?? a.subCategoryId ?? null, y = a.subCategoryName ?? null, E = typeof a.likeCount == "number" ? a.likeCount : 0;
                o.run(
                  String(a.liveID ? String(a.liveID) : String(r)),
                  String(r),
                  c.userName || c.nickname || c.name || "",
                  c.userID != null ? String(c.userID) : String(r),
                  d,
                  f,
                  w,
                  v,
                  _,
                  _,
                  E,
                  b,
                  h != null ? String(h) : "",
                  u != null ? String(u) : "",
                  l != null ? String(l) : "",
                  y != null ? String(y) : "",
                  (p) => {
                    try {
                      o.finalize();
                    } catch {
                    }
                    if (p)
                      try {
                        console.warn("[rooms_meta] upsert error via /api/acfun/danmu/room-info", p);
                      } catch {
                      }
                    else
                      try {
                        console.info("[rooms_meta] upsert route=/api/acfun/danmu/room-info room=" + String(r) + " status=" + String(w) + " isLive=" + String(v) + " viewer=" + String(_));
                      } catch {
                      }
                  }
                );
              }
            } catch {
            }
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "send":
          if (e === "POST") {
            const { liveId: r, content: n } = s.body, i = String(r || "").trim(), o = String(n || "").trim();
            if (!i)
              return { success: !1, error: "liveId is required", code: 400 };
            if (!o)
              return { success: !1, error: "content is required", code: 400 };
            const a = await this.tokenManager.validateToken();
            if (!a.isValid)
              return { success: !1, error: a.reason || "unauthorized", code: 401 };
            const c = await this.acfunApi.danmu.sendDanmu(i, o);
            return {
              success: c.success,
              data: c.data,
              error: c.error,
              code: c.success ? 200 : 400
            };
          }
          break;
      }
      return {
        success: !1,
        error: `Unsupported danmu endpoint: ${e} /${t.join("/")}`,
        code: 404
      };
    } catch (r) {
      return console.error("[AcfunApiProxy] Danmu endpoint error:", r), {
        success: !1,
        error: r.message || "Danmu endpoint error",
        code: 500
      };
    }
  }
  /**
   * 处理用户相关端点
   */
  async handleUserEndpoints(e, t, s) {
    try {
      switch (t[0]) {
        case "info":
          if (e === "GET") {
            const r = s.query.userId;
            if (console.log("[AcfunApiProxy] getUserInfo called with userId:", r), !r)
              return console.log("[AcfunApiProxy] userId is missing"), {
                success: !1,
                error: "userId is required",
                code: 400
              };
            await this.updateAuthentication(), console.log("[AcfunApiProxy] Authentication updated, isAuthenticated:", this.acfunApi.isAuthenticated?.()), console.log("[AcfunApiProxy] Calling acfunApi.user.getUserInfo with userId:", r);
            const n = await this.acfunApi.user.getUserInfo(r);
            return console.log("[AcfunApiProxy] getUserInfo result:", n), {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "wallet":
          if (e === "GET") {
            const r = await this.acfunApi.user.getWalletInfo();
            return {
              success: r.success,
              data: r.data,
              error: r.error,
              code: r.success ? 200 : 400
            };
          }
          break;
      }
      return {
        success: !1,
        error: `Unsupported user endpoint: ${e} /${t.join("/")}`,
        code: 404
      };
    } catch (r) {
      return console.error("[AcfunApiProxy] User endpoint error:", r), {
        success: !1,
        error: r.message || "User endpoint error",
        code: 500
      };
    }
  }
  /**
   * 处理直播相关端点
   */
  async handleLiveEndpoints(e, t, s) {
    try {
      switch (t[0]) {
        case "permission":
          if (e === "GET") {
            if (!this.acfunApi.getHttpClient().getValidatedTokenInfo().tokenInfo)
              return { success: !1, error: "未登录或token无效", code: 401 };
            const n = await this.acfunApi.live.checkLivePermission();
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "stream-url":
          if (e === "GET") {
            const r = s.query.liveId;
            if (!r)
              return {
                success: !1,
                error: "liveId is required",
                code: 400
              };
            const n = await this.acfunApi.live.getStreamUrl(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "stream-settings":
          if (e === "GET") {
            const r = await this.acfunApi.live.getStreamSettings();
            return {
              success: r.success,
              data: r.data,
              error: r.error,
              code: r.success ? 200 : 400
            };
          }
          break;
        case "stream-status":
          if (e === "GET")
            try {
              console.debug("[AcfunApiProxy][stream-status] incoming GET");
              const r = this.acfunApi.getHttpClient().getValidatedTokenInfo();
              if (!r.tokenInfo)
                return console.warn("[AcfunApiProxy][stream-status] token invalid"), {
                  success: !1,
                  error: "未登录或token无效",
                  code: 401
                };
              const n = Date.now(), i = String(s.query?.roomId || "").trim(), o = r?.tokenInfo?.userID ? String(r.tokenInfo.userID) : "", a = new URLSearchParams();
              try {
                const _ = Object.keys(s.query || {}).sort();
                for (const b of _) {
                  const h = s.query[b];
                  a.set(b, String(h));
                }
              } catch {
              }
              const c = `stream-status:${i || o}:${a.toString()}`, d = this.streamStatusCache.get(c);
              if (d && n - d.ts < it.STREAM_STATUS_TTL_MS)
                return { ...d.resp };
              const f = this.streamStatusInFlight.get(c);
              if (f)
                return { ...await f };
              try {
                const _ = Array.isArray(r.tokenInfo.cookies) ? r.tokenInfo.cookies.length : 0;
                console.debug("[AcfunApiProxy][stream-status] token ok", {
                  userID: r.tokenInfo.userID,
                  deviceID: r.tokenInfo.deviceID,
                  cookiesCount: _
                });
              } catch {
              }
              const w = (async () => {
                const _ = await this.acfunApi.live.getLiveStreamStatus(), b = _.error || "";
                if (!_.success) {
                  const h = (() => {
                    try {
                      const l = b.match(/\{[^]*\}/);
                      if (l && l[0]) return JSON.parse(l[0]);
                    } catch {
                    }
                    return null;
                  })();
                  if (b.includes("未开播") || h && (Number(h.result) === 380023 || String(h.error_msg || "").includes("未开播")))
                    return {
                      success: !0,
                      data: {
                        liveID: "",
                        streamName: "",
                        title: "",
                        liveCover: "",
                        liveStartTime: 0,
                        panoramic: !1,
                        bizUnit: "",
                        bizCustomData: "",
                        isLive: !1
                      },
                      error: void 0,
                      code: 200
                    };
                }
                return {
                  success: _.success,
                  data: _.data,
                  error: _.error,
                  code: 200
                };
              })();
              this.streamStatusInFlight.set(c, w);
              const v = await w;
              try {
                console.debug("[AcfunApiProxy][stream-status] upstream resp", {
                  success: v.success,
                  error: v.error,
                  data: v.data ? {
                    liveID: v.data.liveID,
                    streamName: v.data.streamName,
                    title: v.data.title
                  } : null
                });
              } catch {
              }
              if (!v.success && d) {
                this.streamStatusInFlight.delete(c);
                const _ = { ...d.resp };
                return _.meta = { ..._.meta || {}, stale: !0 }, { ..._ };
              }
              try {
                if (v && v.success && this.databaseManager) {
                  const _ = this.acfunApi.getHttpClient().getValidatedTokenInfo(), b = _?.tokenInfo?.userID ? String(_.tokenInfo.userID) : void 0;
                  if (b) {
                    const u = this.databaseManager.getDb().prepare(`
                    INSERT INTO rooms_meta (
                      live_id,
                      room_id, streamer_name, streamer_user_id,
                      title, cover_url, status, is_live,
                      viewer_count, online_count, like_count, live_cover,
                      category_id, category_name, sub_category_id, sub_category_name,
                      created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(live_id) DO UPDATE SET
                      room_id=excluded.room_id,
                      streamer_name=excluded.streamer_name,
                      streamer_user_id=excluded.streamer_user_id,
                      title=excluded.title,
                      cover_url=excluded.cover_url,
                      status=excluded.status,
                      is_live=excluded.is_live,
                      viewer_count=excluded.viewer_count,
                      online_count=excluded.online_count,
                      like_count=excluded.like_count,
                      live_cover=excluded.live_cover,
                      category_id=excluded.category_id,
                      category_name=excluded.category_name,
                      sub_category_id=excluded.sub_category_id,
                      sub_category_name=excluded.sub_category_name
                  `), l = v.data || {}, y = typeof l.liveID == "string" && l.liveID ? String(l.liveID) : void 0, E = y ? "open" : "closed", p = y ? 1 : 0;
                    y && u.run(
                      y,
                      b,
                      "",
                      b,
                      typeof l.title == "string" ? l.title : "",
                      null,
                      E,
                      p,
                      0,
                      0,
                      0,
                      "",
                      "",
                      "",
                      "",
                      (A) => {
                        try {
                          u.finalize();
                        } catch {
                        }
                        if (A)
                          try {
                            console.warn("[rooms_meta] upsert error via /api/acfun/live/stream-status", A);
                          } catch {
                          }
                        else
                          try {
                            console.info("[rooms_meta] upsert route=/api/acfun/live/stream-status room=" + String(b) + " status=" + String(E) + " isLive=" + String(p));
                          } catch {
                          }
                      }
                    );
                  }
                }
              } catch {
              }
              return v && v.success && this.streamStatusCache.set(c, { ts: Date.now(), resp: { ...v } }), this.streamStatusInFlight.delete(c), { ...v };
            } catch (r) {
              console.error("[AcfunApiProxy] Stream status error:", r);
              const n = this.streamStatusCache.get(
                (() => {
                  try {
                    const i = this.acfunApi.getHttpClient().getValidatedTokenInfo(), o = Date.now(), a = String(s.query?.roomId || "").trim(), c = i?.tokenInfo?.userID ? String(i.tokenInfo.userID) : "", d = new URLSearchParams(), f = Object.keys(s.query || {}).sort();
                    for (const v of f) {
                      const _ = s.query[v];
                      d.set(v, String(_));
                    }
                    return `stream-status:${a || c}:${d.toString()}`;
                  } catch {
                    return "";
                  }
                })()
              );
              if (n) {
                const i = { ...n.resp };
                return i.meta = { ...i.meta || {}, stale: !0 }, { ...i };
              }
              return {
                success: !1,
                error: r.message || "Failed to get stream status",
                code: 200
              };
            }
          break;
        case "transcode-info":
          if (e === "GET")
            try {
              if (!this.acfunApi.getHttpClient().getValidatedTokenInfo().tokenInfo)
                return {
                  success: !1,
                  error: "未登录或token无效",
                  code: 401
                };
              const n = String(s.query.streamName || "").trim();
              if (!n)
                return {
                  success: !1,
                  error: "streamName is required",
                  code: 400
                };
              const i = await this.acfunApi.live.getTranscodeInfo(n), o = i.error || "";
              return {
                success: i.success,
                data: i.data,
                error: i.error,
                code: i.success ? 200 : o.includes("cookies") || o.includes("token") ? 401 : 400
              };
            } catch (r) {
              return console.error("[AcfunApiProxy] Transcode info error:", r), {
                success: !1,
                error: r.message || "Failed to get transcode info",
                code: 400
              };
            }
          break;
        case "start":
          if (e === "POST") {
            const { title: r, coverFile: n, streamName: i, portrait: o, panoramic: a, categoryID: c, subCategoryID: d } = s.body;
            if (!r || !i || c === void 0 || d === void 0)
              return {
                success: !1,
                error: "title, streamName, categoryID, and subCategoryID are required",
                code: 400
              };
            try {
              const w = typeof n == "string" ? n.slice(0, 32) : "";
              if (console.log("[AcfunApiProxy][START] params:", {
                title: r,
                streamName: i,
                portrait: !!o,
                panoramic: !!a,
                categoryID: c,
                subCategoryID: d
              }), console.log("[AcfunApiProxy][START] coverFile meta:", {
                type: typeof n,
                length: typeof n == "string" ? n.length : 0,
                head: w,
                isDataUri: typeof n == "string" && /^data:image\//i.test(n),
                isHttp: typeof n == "string" && /^https?:\/\//i.test(n)
              }), typeof n == "string" && /^data:image\//i.test(n) && !/^data:image\/jpeg/i.test(n))
                return { success: !1, error: "仅支持JPG封面", code: 400 };
              if (typeof n == "string" && /^https?:\/\//i.test(n)) {
                const v = n.toLowerCase();
                if (!/\.jpe?g(\?.*)?$/.test(v)) return { success: !1, error: "仅支持JPG封面", code: 400 };
              }
            } catch {
            }
            const f = await this.acfunApi.live.startLiveStream(
              r,
              n || "",
              i,
              o || !1,
              a || !1,
              c,
              d
            );
            if (f && f.success) {
              const w = f.data?.liveID || "";
              this.broadcast("room", "live-start", { title: r, streamName: i, ts: Date.now(), liveId: w }), this.broadcast("renderer", "live-start", { liveId: w, roomId: "" });
            }
            return {
              success: f.success,
              data: f.data,
              error: f.error,
              code: f.success ? 200 : 400
            };
          }
          break;
        case "stop":
          if (e === "POST") {
            const { liveId: r } = s.body;
            if (!r)
              return {
                success: !1,
                error: "liveId is required",
                code: 400
              };
            const n = await this.acfunApi.live.stopLiveStream(r);
            return n && n.success && (this.broadcast("room", "live-stop", { liveId: r, ts: Date.now() }), this.broadcast("renderer", "live-stop", { liveId: r, roomId: "" })), {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "update":
          if (e === "PUT") {
            const { title: r, coverFile: n, liveId: i } = s.body;
            if (!r || !i)
              return {
                success: !1,
                error: "title and liveId are required",
                code: 400
              };
            if (typeof n == "string" && /^data:image\//i.test(n) && !/^data:image\/jpeg/i.test(n))
              return { success: !1, error: "仅支持JPG封面", code: 400 };
            if (typeof n == "string" && /^https?:\/\//i.test(n)) {
              const a = n.toLowerCase();
              if (!/\.jpe?g(\?.*)?$/.test(a)) return { success: !1, error: "仅支持JPG封面", code: 400 };
            }
            const o = await this.acfunApi.live.updateLiveRoom(r, n || "", i);
            return {
              success: o.success,
              data: o.data,
              error: o.error,
              code: o.success ? 200 : 400
            };
          }
          break;
        case "statistics":
          if (e === "GET") {
            const r = s.query.userId, n = parseInt(String(r || ""));
            if (!n || Number.isNaN(n))
              return {
                success: !1,
                error: "userId is required",
                code: 400
              };
            const i = await this.acfunApi.live.getUserLiveInfo(n);
            if (i && i.success && i.data) {
              const o = i.data;
              return { success: !0, data: {
                totalViewers: typeof o.onlineCount == "number" ? o.onlineCount : 0,
                peakViewers: 0,
                totalComments: 0,
                totalGifts: 0,
                totalLikes: typeof o.likeCount == "number" ? o.likeCount : 0,
                revenue: 0
              }, code: 200 };
            }
            return { success: !1, error: i?.error || "fetch_failed", code: 400 };
          }
          break;
        case "summary":
          if (e === "GET") {
            const r = s.query.liveId;
            if (!r)
              return {
                success: !1,
                error: "liveId is required",
                code: 400
              };
            const n = await this.acfunApi.live.getSummary(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "watching-list":
          if (e === "GET") {
            let r = String(s.query.liveId || "").trim();
            const n = s.query.userId, i = parseInt(String(n || ""));
            if (!r && i && !Number.isNaN(i)) {
              const a = await this.acfunApi.live.getUserLiveInfo(i);
              a && a.success && a.data && a.data.liveID && (r = String(a.data.liveID));
            }
            if (!r)
              return { success: !1, error: "liveId or userId is required", code: 400 };
            const o = await this.acfunApi.live.getWatchingList(r);
            return {
              success: o.success,
              data: o.data,
              error: o.error,
              code: o.success ? 200 : 400
            };
          }
          break;
        case "hot-lives":
          if (e === "GET") {
            const r = s.query.category, n = parseInt(s.query.page) || 1, i = parseInt(s.query.size) || 20, o = await this.acfunApi.live.getHotLives(r, n, i);
            return {
              success: o.success,
              data: o.data,
              error: o.error,
              code: o.success ? 200 : 400
            };
          }
          break;
        case "categories":
          if (e === "GET") {
            const r = await this.acfunApi.live.getLiveCategories();
            return {
              success: r.success,
              data: r.data,
              error: r.error,
              code: r.success ? 200 : 400
            };
          }
          break;
        case "user-info":
          if (e === "GET") {
            const r = parseInt(s.query.userID);
            if (!r)
              return {
                success: !1,
                error: "userID is required",
                code: 400
              };
            const n = await this.acfunApi.live.getUserLiveInfo(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "list":
          if (e === "GET") {
            const r = parseInt(s.query.page) || 1, n = parseInt(s.query.pageSize) || 20, i = await this.acfunApi.live.getLiveList(r, n);
            return {
              success: i.success,
              data: i.data,
              error: i.error,
              code: i.success ? 200 : 400
            };
          }
          break;
        case "channel-list":
          if (e === "GET")
            try {
              const r = s.query.filters;
              let n;
              if (r)
                try {
                  n = JSON.parse(r), Array.isArray(n) || (n = void 0);
                } catch {
                  n = void 0;
                }
              const i = s.query.count ? parseInt(s.query.count) : void 0, o = s.query.pcursor, a = {};
              n && (a.filters = n), i && !Number.isNaN(i) && (a.count = i), o && (a.pcursor = o);
              const c = await this.acfunApi.live.getChannelList(a);
              return {
                success: c.success,
                data: c.data,
                error: c.error,
                code: c.success ? 200 : 400
              };
            } catch (r) {
              return console.error("[AcfunApiProxy] Channel list error:", r), {
                success: !1,
                error: r.message || "Failed to get channel list",
                code: 400
              };
            }
          break;
        case "statistics-by-days":
          if (e === "GET") {
            const r = parseInt(s.query.days) || 7, n = await this.acfunApi.live.getLiveStatisticsByDays(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "clip-permission":
          if (e === "GET") {
            const r = await this.acfunApi.live.checkLiveClipPermission();
            return {
              success: r.success,
              data: r.data,
              error: r.error,
              code: r.success ? 200 : 400
            };
          } else if (e === "PUT") {
            const { canCut: r } = s.body;
            if (r === void 0)
              return {
                success: !1,
                error: "canCut is required",
                code: 400
              };
            const n = await this.acfunApi.live.setLiveClipPermission(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
      }
      return {
        success: !1,
        error: `Unsupported live endpoint: ${e} /${t.join("/")}`,
        code: 404
      };
    } catch (r) {
      return console.error("[AcfunApiProxy] Live endpoint error:", r), {
        success: !1,
        error: r.message || "Live endpoint error",
        code: 500
      };
    }
  }
  /**
   * 处理礼物相关端点
   */
  async handleGiftEndpoints(e, t, s) {
    try {
      switch (t[0]) {
        case "all":
          if (e === "GET") {
            const r = await this.acfunApi.gift.getAllGiftList();
            return {
              success: r.success,
              data: r.data,
              error: r.error,
              code: r.success ? 200 : 400
            };
          }
          break;
        case "live":
          if (e === "GET") {
            const r = s.query.liveID;
            if (!r)
              return {
                success: !1,
                error: "liveID is required",
                code: 400
              };
            const n = await this.acfunApi.gift.getLiveGiftList(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
      }
      return {
        success: !1,
        error: `Unsupported gift endpoint: ${e} /${t.join("/")}`,
        code: 404
      };
    } catch (r) {
      return console.error("[AcfunApiProxy] Gift endpoint error:", r), {
        success: !1,
        error: r.message || "Gift endpoint error",
        code: 500
      };
    }
  }
  /**
   * 处理房管相关端点
   */
  async handleManagerEndpoints(e, t, s) {
    try {
      switch (t[0]) {
        case "list":
          if (e === "GET") {
            const r = await this.acfunApi.manager.getManagerList();
            return {
              success: r.success,
              data: r.data,
              error: r.error,
              code: r.success ? 200 : 400
            };
          }
          break;
        case "add":
          if (e === "POST") {
            const { managerUID: r } = s.body;
            if (!r)
              return {
                success: !1,
                error: "managerUID is required",
                code: 400
              };
            const n = await this.acfunApi.manager.addManager(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "remove":
          if (e === "DELETE") {
            const { managerUID: r } = s.body;
            if (!r)
              return {
                success: !1,
                error: "managerUID is required",
                code: 400
              };
            const n = await this.acfunApi.manager.deleteManager(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "kick-records":
          if (e === "GET") {
            const r = s.query.liveId, n = parseInt(s.query.count) || 20, i = parseInt(s.query.page) || 1;
            if (!r)
              return {
                success: !1,
                error: "liveId is required",
                code: 400
              };
            const o = await this.acfunApi.manager.getAuthorKickRecords(r, n, i);
            return {
              success: o.success,
              data: o.data,
              error: o.error,
              code: o.success ? 200 : 400
            };
          }
          break;
        case "kick":
          if (e === "POST") {
            const { liveID: r, kickedUID: n, kickType: i } = s.body;
            if (!r || !n)
              return {
                success: !1,
                error: "liveID and kickedUID are required",
                code: 400
              };
            let o;
            return i === "manager" ? o = await this.acfunApi.manager.managerKick(r, n) : o = await this.acfunApi.manager.authorKick(r, n), {
              success: o.success,
              data: o.data,
              error: o.error,
              code: o.success ? 200 : 400
            };
          }
          break;
      }
      return {
        success: !1,
        error: `Unsupported manager endpoint: ${e} /${t.join("/")}`,
        code: 404
      };
    } catch (r) {
      return console.error("[AcfunApiProxy] Manager endpoint error:", r), {
        success: !1,
        error: r.message || "Manager endpoint error",
        code: 500
      };
    }
  }
  /**
   * 处理直播回放相关端点
   */
  async handleReplayEndpoints(e, t, s) {
    try {
      switch (t[0]) {
        case "info":
          if (e === "GET") {
            const r = s.query.liveId;
            if (!r)
              return {
                success: !1,
                error: "liveId is required",
                code: 400
              };
            const n = await this.acfunApi.replay.getLiveReplay(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
      }
      return {
        success: !1,
        error: `Unsupported replay endpoint: ${e} /${t.join("/")}`,
        code: 404
      };
    } catch (r) {
      return console.error("[AcfunApiProxy] Replay endpoint error:", r), {
        success: !1,
        error: r.message || "Replay endpoint error",
        code: 500
      };
    }
  }
  /**
   * 处理直播预告相关端点
   */
  async handlePreviewEndpoints(e, t, s) {
    try {
      switch (t[0]) {
        case "list":
          if (e === "GET") {
            const r = await this.acfunApi.livePreview.getLivePreviewList();
            return {
              success: r.success,
              data: r.data,
              error: r.error,
              code: r.success ? 200 : 400
            };
          }
          break;
      }
      return {
        success: !1,
        error: `Unsupported preview endpoint: ${e} /${t.join("/")}`,
        code: 404
      };
    } catch (r) {
      return console.error("[AcfunApiProxy] Preview endpoint error:", r), {
        success: !1,
        error: r.message || "Preview endpoint error",
        code: 500
      };
    }
  }
  /**
   * 处理徽章相关端点
   */
  async handleBadgeEndpoints(e, t, s) {
    try {
      switch (t[0]) {
        case "detail":
          if (e === "GET") {
            const r = parseInt(s.query.uperID);
            if (!r)
              return {
                success: !1,
                error: "uperID is required",
                code: 400
              };
            const n = await this.acfunApi.badge.getBadgeDetail(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "list":
          if (e === "GET") {
            const r = await this.acfunApi.badge.getBadgeList();
            return {
              success: r.success,
              data: r.data,
              error: r.error,
              code: r.success ? 200 : 400
            };
          }
          break;
        case "rank":
          if (e === "GET") {
            const r = parseInt(s.query.uperID);
            if (!r)
              return {
                success: !1,
                error: "uperID is required",
                code: 400
              };
            const n = await this.acfunApi.badge.getBadgeRank(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "worn":
          if (e === "GET") {
            const r = parseInt(s.query.userID);
            if (!r)
              return {
                success: !1,
                error: "userID is required",
                code: 400
              };
            const n = await this.acfunApi.badge.getWornBadge(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "wear":
          if (e === "POST") {
            const { uperID: r } = s.body;
            if (!r)
              return {
                success: !1,
                error: "uperID is required",
                code: 400
              };
            const n = await this.acfunApi.badge.wearBadge(r);
            return {
              success: n.success,
              data: n.data,
              error: n.error,
              code: n.success ? 200 : 400
            };
          }
          break;
        case "unwear":
          if (e === "POST") {
            const r = await this.acfunApi.badge.unwearBadge();
            return {
              success: r.success,
              data: r.data,
              error: r.error,
              code: r.success ? 200 : 400
            };
          }
          break;
      }
      return {
        success: !1,
        error: `Unsupported badge endpoint: ${e} /${t.join("/")}`,
        code: 404
      };
    } catch (r) {
      return console.error("[AcfunApiProxy] Badge endpoint error:", r), {
        success: !1,
        error: r.message || "Badge endpoint error",
        code: 500
      };
    }
  }
  /**
   * 检查来源是否被允许
   */
  isOriginAllowed(e) {
    return e ? this.config.allowedOrigins?.some((t) => {
      if (t.includes("*")) {
        const s = t.replace(/\*/g, ".*");
        return new RegExp(s).test(e);
      }
      return t === e;
    }) || !1 : !0;
  }
  /**
   * 获取客户端ID（用于速率限制）
   */
  getClientId(e) {
    const t = e.get("X-Plugin-ID"), s = e.ip || e.connection.remoteAddress || "unknown";
    return t ? `plugin:${t}` : `ip:${s}`;
  }
  /**
   * 更新认证信息
   */
  async updateAuthentication() {
    await this.initializeAuthentication();
  }
  /**
   * 获取API状态
   */
  getStatus() {
    return {
      authenticated: this.tokenManager.isAuthenticated(),
      apiReady: !0
    };
  }
  /**
   * 获取TokenManager实例
   */
  getTokenManager() {
    return this.tokenManager;
  }
  /**
   * 处理图片相关端点
   */
  /**
   * 处理EventSource相关端点
   */
}
function ls({ app: g, wsHub: e }) {
  g.get("/api/health", (t, s) => {
    s.json({
      status: "ok",
      timestamp: Date.now(),
      websocket_clients: e?.getClientCount() || 0
    });
  });
}
function us({ app: g, queryService: e, csvExporter: t }) {
  g.get(
    "/api/events",
    async (s, r, n) => {
      try {
        const i = s.query.type;
        let o;
        Array.isArray(i) ? o = i.map((w) => String(w)).filter(Boolean) : typeof i == "string" && i.trim().length > 0 && (o = i.split(",").map((w) => w.trim()).filter(Boolean));
        const a = s.query.user_ids, c = a ? a.split(",").map((w) => w.trim()).filter(Boolean) : void 0, d = {
          room_id: s.query.room_id,
          live_id: s.query.live_id,
          room_kw: s.query.room_kw,
          from_ts: s.query.from_ts ? parseInt(s.query.from_ts) : void 0,
          to_ts: s.query.to_ts ? parseInt(s.query.to_ts) : void 0,
          from_date: s.query.from_date ? String(s.query.from_date) : void 0,
          to_date: s.query.to_date ? String(s.query.to_date) : void 0,
          types: o,
          user_id: s.query.user_id,
          user_ids: c,
          user_kw: s.query.user_kw,
          q: s.query.q,
          page: s.query.page ? parseInt(s.query.page) : 1,
          pageSize: s.query.pageSize ? parseInt(s.query.pageSize) : 200
        };
        if (d.pageSize && (d.pageSize < 1 || d.pageSize > 1e3))
          return r.status(400).json({ error: "Invalid pageSize. Must be between 1 and 1000." });
        if (d.page && d.page < 1)
          return r.status(400).json({ error: "Invalid page. Must be >= 1." });
        const f = await e.queryEvents(d);
        if (process.env.ACFRAME_DEBUG_LOGS === "1")
          try {
            console.log(
              "[API] /api/events params room_id=" + String(d.room_id || "") + " live_id=" + String(d.live_id || "") + " page=" + String(d.page) + " pageSize=" + String(d.pageSize) + " type=" + String((o || []).join(",")) + " total=" + String(f.total) + " items=" + String(f.items.length)
            );
          } catch {
          }
        r.json(f);
      } catch (i) {
        n(i);
      }
    }
  ), g.delete(
    "/api/events",
    async (s, r, n) => {
      try {
        const i = s.query.type;
        let o;
        Array.isArray(i) ? o = i.map((w) => String(w)).filter(Boolean) : typeof i == "string" && i.trim().length > 0 && (o = i.split(",").map((w) => w.trim()).filter(Boolean));
        const a = s.query.user_ids, c = a ? a.split(",").map((w) => w.trim()).filter(Boolean) : void 0, d = {
          room_id: s.query.room_id,
          live_id: s.query.live_id,
          room_kw: s.query.room_kw,
          from_ts: s.query.from_ts ? parseInt(s.query.from_ts) : void 0,
          to_ts: s.query.to_ts ? parseInt(s.query.to_ts) : void 0,
          from_date: s.query.from_date ? String(s.query.from_date) : void 0,
          to_date: s.query.to_date ? String(s.query.to_date) : void 0,
          types: o,
          user_id: s.query.user_id,
          user_ids: c,
          user_kw: s.query.user_kw,
          q: s.query.q
        }, f = await e.deleteEvents(d);
        if (process.env.ACFRAME_DEBUG_LOGS === "1")
          try {
            console.log(
              "[API] DELETE /api/events params room_id=" + String(d.room_id || "") + " live_id=" + String(d.live_id || "") + " type=" + String((o || []).join(",")) + " deleted=" + String(f)
            );
          } catch {
          }
        r.json({ success: !0, deleted: f });
      } catch (i) {
        n(i);
      }
    }
  ), g.get(
    "/api/events/dates",
    async (s, r, n) => {
      try {
        const i = s.query.room_id || void 0, o = await e.getEventDates(i);
        return r.json({ dates: o });
      } catch (i) {
        n(i);
      }
    }
  ), g.get(
    "/api/users",
    async (s, r, n) => {
      try {
        const i = s.query.limit ? Math.max(1, Math.min(1e3, parseInt(String(s.query.limit)))) : 200, o = s.query.room_id || void 0, a = await e.listUsers(i, o);
        return r.json({ items: a, total: a.length });
      } catch (i) {
        n(i);
      }
    }
  ), g.get(
    "/api/users/search",
    async (s, r, n) => {
      try {
        const i = String(s.query.keyword || "").trim(), o = s.query.page ? Math.max(1, parseInt(String(s.query.page))) : 1, a = s.query.pageSize ? Math.max(1, Math.min(200, parseInt(String(s.query.pageSize)))) : 20, c = s.query.room_id || void 0, d = await e.searchUsers(i, o, a, c);
        return r.json(d);
      } catch (i) {
        n(i);
      }
    }
  ), g.get(
    "/api/stats/events",
    async (s, r, n) => {
      try {
        const i = s.query.room_id || void 0, o = await e.getEventStats(i);
        r.json({ success: !0, ...o });
      } catch (i) {
        n(i);
      }
    }
  ), g.get(
    "/api/events/rooms",
    async (s, r, n) => {
      try {
        const i = s.query.limit ? Math.max(1, Math.min(1e3, parseInt(String(s.query.limit)))) : 200, o = await e.listRooms(i);
        if (process.env.ACFRAME_DEBUG_LOGS === "1")
          try {
            console.log("[API] /api/events/rooms rooms=" + String(o.length));
          } catch {
          }
        r.json({ rooms: o });
      } catch (i) {
        n(i);
      }
    }
  ), g.get(
    "/api/export",
    async (s, r, n) => {
      try {
        const i = s.query.type;
        let o;
        Array.isArray(i) ? o = i.map((f) => String(f).trim()).filter(Boolean) : typeof i == "string" && i.trim().length > 0 && (o = i.split(",").map((f) => f.trim()).filter(Boolean));
        const a = {
          room_id: s.query.room_id,
          from_ts: s.query.from_ts ? parseInt(String(s.query.from_ts)) : void 0,
          to_ts: s.query.to_ts ? parseInt(String(s.query.to_ts)) : void 0,
          from_date: s.query.from_date ? String(s.query.from_date) : void 0,
          to_date: s.query.to_date ? String(s.query.to_date) : void 0,
          types: o,
          filename: s.query.filename,
          includeRaw: s.query.includeRaw === "true"
        }, c = await t.exportToCsv(a);
        r.setHeader("Content-Type", "text/csv; charset=utf-8"), r.setHeader("Content-Disposition", `attachment; filename="${c.filename}"`), r.setHeader("X-Record-Count", String(c.recordCount));
        const d = S.createReadStream(c.filepath, { encoding: "utf8" });
        d.on("error", (f) => n(f)), d.pipe(r);
      } catch (i) {
        n(i);
      }
    }
  ), g.post(
    "/api/export",
    async (s, r, n) => {
      try {
        const i = s.body?.type, o = s.body?.types;
        let a;
        Array.isArray(o) ? a = o.map((f) => String(f).trim()).filter(Boolean) : Array.isArray(i) ? a = i.map((f) => String(f).trim()).filter(Boolean) : typeof i == "string" && i.trim().length > 0 && (a = i.split(",").map((f) => f.trim()).filter(Boolean));
        const c = {
          room_id: s.body.room_id,
          from_ts: s.body.from_ts ? parseInt(String(s.body.from_ts)) : void 0,
          to_ts: s.body.to_ts ? parseInt(String(s.body.to_ts)) : void 0,
          from_date: s.body.from_date ? String(s.body.from_date) : void 0,
          to_date: s.body.to_date ? String(s.body.to_date) : void 0,
          types: a,
          filename: s.body.filename,
          includeRaw: !!s.body.includeRaw
        }, d = await t.exportToCsv(c);
        r.json({ success: !0, filename: d.filename, filepath: d.filepath, recordCount: d.recordCount, fileSize: d.fileSize });
      } catch (i) {
        n(i);
      }
    }
  );
}
const bt = {}, $r = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: bt
}, Symbol.toStringTag, { value: "Module" }));
function ds({ app: g, getPluginWindowManager: e, getWindowManager: t, getPluginManager: s, dataManager: r }) {
  const n = (o) => {
    const a = String(o.get("X-Plugin-ID") || "").trim(), { windowId: c, pluginId: d } = o.body || {}, f = String(c || d || a || "").trim();
    return f ? { pluginId: f } : { main: !0 };
  }, i = (o) => {
    const a = n(o), c = e?.(), d = t?.();
    return a.pluginId ? c?.getWindow(a.pluginId) || null : d?.getMainWindow() || null;
  };
  g.get("/api/system/memory", async (o, a) => {
    try {
      const c = (() => {
        try {
          const b = process.memoryUsage();
          return {
            rss: b.rss,
            heapUsed: b.heapUsed,
            heapTotal: b.heapTotal,
            external: b.external,
            arrayBuffers: b.arrayBuffers
          };
        } catch {
          return null;
        }
      })(), d = (() => {
        try {
          return {
            heapStatistics: (void 0)(),
            heapSpaceStatistics: void 0
          };
        } catch {
          return null;
        }
      })(), f = (() => {
        try {
          return {
            appMetrics: R.getAppMetrics(),
            appVersion: R.getVersion(),
            isPackaged: R.isPackaged
          };
        } catch {
          return null;
        }
      })(), w = await (async () => {
        try {
          const b = ne.getAllWindows(), h = [];
          for (const u of b)
            try {
              const l = u.webContents, y = typeof l.getProcessId == "function" ? l.getProcessId() : void 0, E = l.getOSProcessId ? l.getOSProcessId() : void 0;
              let p;
              try {
                typeof l.getProcessMemoryInfo == "function" && (p = await l.getProcessMemoryInfo());
              } catch {
              }
              h.push({
                browserWindowId: u.id,
                title: (() => {
                  try {
                    return u.getTitle();
                  } catch {
                    return "";
                  }
                })(),
                visible: (() => {
                  try {
                    return u.isVisible();
                  } catch {
                    return;
                  }
                })(),
                webContentsId: l.id,
                pid: y,
                osPid: E,
                processMemoryInfo: p
              });
            } catch {
            }
          return h;
        } catch {
          return [];
        }
      })(), v = (() => {
        try {
          const b = s?.(), h = b, u = {
            installedCount: Array.isArray(b?.getInstalledPlugins?.()) ? b.getInstalledPlugins().length : void 0,
            pluginStats: typeof b?.getPluginStats == "function" ? b.getPluginStats() : void 0
          };
          try {
            typeof h?.getMemoryPoolStats == "function" && (u.memoryPool = h.getMemoryPoolStats());
          } catch {
          }
          try {
            typeof h?.getPluginCacheStats == "function" && (u.cache = h.getPluginCacheStats());
          } catch {
          }
          try {
            typeof h?.getConnectionPoolStats == "function" && (u.connectionPool = h.getConnectionPoolStats());
          } catch {
          }
          try {
            const l = h?.processManager;
            l && typeof l.getProcessStats == "function" && (u.processes = l.getProcessStats());
          } catch {
          }
          try {
            const l = h?.processManager?.workerPool;
            l && typeof l.getWorkerStats == "function" && (u.workerPool = l.getWorkerStats());
          } catch {
          }
          return u;
        } catch {
          return null;
        }
      })(), _ = (() => {
        try {
          const b = r, h = typeof b?.getStats == "function" ? b.getStats({ sampleMessagesPerChannel: 6 }) : void 0, u = typeof b?.getConfigSnapshot == "function" ? b.getConfigSnapshot() : void 0;
          return { stats: h, config: u };
        } catch {
          return null;
        }
      })();
      return a.json({
        success: !0,
        data: {
          node: c,
          heap: d,
          electron: f,
          windows: w,
          plugins: v,
          messageCenter: _
        }
      });
    } catch (c) {
      return a.status(500).json({ success: !1, error: c?.message || "METRICS_FAILED" });
    }
  }), g.post("/api/popup", async (o, a) => {
    try {
      const { action: c, title: d, message: f, options: w } = o.body || {}, v = String(c || "").trim();
      if (!v) return a.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const _ = v === "toast" ? { action: "toast", payload: { message: f, options: w } } : v === "alert" ? { action: "alert", payload: { title: String(d || ""), message: f, options: w } } : v === "confirm" ? { action: "confirm", payload: { title: String(d || ""), message: f, options: w } } : v === "close" ? { action: "close", payload: { id: w?.id || void 0 } } : null;
      if (!_) return a.status(400).json({ success: !1, error: "UNSUPPORTED_ACTION" });
      let b = !1;
      const u = t?.()?.getMainWindow();
      if (u && !u.isDestroyed())
        try {
          u.webContents.send("renderer-global-popup", _), b = !0;
        } catch {
        }
      return b ? a.json({ success: !0 }) : a.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
    } catch (c) {
      return a.status(500).json({ success: !1, error: c?.message || "POPUP_FAILED" });
    }
  }), g.post("/api/system/notify-native", async (o, a) => {
    try {
      const { title: c, body: d, icon: f, urgency: w } = o.body || {}, v = String(c || "").trim(), _ = String(d || "").trim();
      if (!v && !_) return a.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      if (!lt.isSupported()) return a.status(501).json({ success: !1, error: "UNSUPPORTED_PLATFORM" });
      let b;
      if (f && typeof f == "string" && f.trim().length > 0)
        try {
          b = String(f);
        } catch {
        }
      const h = new lt({ title: v || "Notification", body: _, icon: b, urgency: w });
      try {
        h.show();
      } catch {
      }
      try {
        const u = i(o), l = v ? `${v}: ${_}` : _;
        u && !u.isDestroyed() && u.webContents.send("renderer-global-popup", { action: "toast", payload: { message: l, options: { durationMs: 3e3 } } });
      } catch {
      }
      return a.json({ success: !0 });
    } catch (c) {
      return a.status(500).json({ success: !1, error: c?.message || "NOTIFY_FAILED" });
    }
  }), g.post("/api/system/play-sound", async (o, a) => {
    try {
      const { src: c, options: d } = o.body || {}, f = String(c || "").trim();
      if (!f) return a.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const w = i(o);
      return w ? (w.webContents.send("renderer-global-play-sound", { src: f, options: d || {} }), a.json({ success: !0 })) : a.status(500).json({ success: !1, error: "WINDOW_NOT_FOUND" });
    } catch (c) {
      return console.error("Play sound error:", c), a.status(500).json({ success: !1, error: c?.message || "PLAY_SOUND_FAILED" });
    }
  }), g.post("/api/system/open-external", async (o, a) => {
    try {
      const { url: c } = o.body;
      if (!c) return a.status(400).json({ success: !1, error: "URL_REQUIRED" });
      await Me.openExternal(c), a.json({ success: !0 });
    } catch (c) {
      a.status(500).json({ success: !1, error: c?.message || "OPEN_EXTERNAL_FAILED" });
    }
  }), g.post("/api/system/show-item", async (o, a) => {
    try {
      const { path: c } = o.body;
      if (!c) return a.status(400).json({ success: !1, error: "PATH_REQUIRED" });
      const d = I.resolve(c);
      Me.showItemInFolder(d), a.json({ success: !0 });
    } catch (c) {
      a.status(500).json({ success: !1, error: c?.message || "SHOW_ITEM_FAILED" });
    }
  }), g.post("/api/system/open-path", async (o, a) => {
    try {
      const { path: c } = o.body;
      if (!c) return a.status(400).json({ success: !1, error: "PATH_REQUIRED" });
      const d = I.resolve(c), f = await Me.openPath(d);
      if (f) throw new Error(f);
      a.json({ success: !0 });
    } catch (c) {
      a.status(500).json({ success: !1, error: c?.message || "OPEN_PATH_FAILED" });
    }
  }), g.post("/api/system/exec", async (o, a) => {
    try {
      const c = String(o.get("X-Plugin-ID") || "").trim();
      if (!c) return a.status(400).json({ success: !1, error: "INVALID_PLUGIN" });
      try {
        let p = !1;
        const A = new Ee();
        p = p || !!A.get(`plugins.${c}.permissions.exec`, !1), process.env.NODE_ENV === "development" && (p = !0);
        try {
          const k = s?.()?.getPlugin(c), D = !!(k && k.manifest?.permissions && k.manifest.permissions.exec === !0);
          p = p || D;
        } catch {
        }
        if (!p) return a.status(403).json({ success: !1, error: "EXEC_NOT_AUTHORIZED" });
      } catch {
      }
      const { command: d, args: f, opts: w } = o.body || {}, v = String(d || "").trim();
      if (!v) return a.status(400).json({ success: !1, error: "INVALID_COMMAND" });
      const _ = Array.isArray(f) ? f.map((p) => String(p)) : [], h = require("child_process").spawn(v, _, {
        cwd: w && typeof w.cwd == "string" ? w.cwd : void 0,
        env: w && typeof w.env == "object" ? { ...process.env, ...w.env } : process.env,
        shell: !1,
        windowsHide: !0
      });
      let u = "", l = "";
      h.stdout?.on("data", (p) => {
        try {
          u += p.toString();
        } catch {
        }
      }), h.stderr?.on("data", (p) => {
        try {
          l += p.toString();
        } catch {
        }
      });
      const y = Math.max(0, Number(w?.timeoutMs || 3e4)), E = y > 0 ? setTimeout(() => {
        try {
          h.kill("SIGKILL");
        } catch {
        }
      }, y) : null;
      h.on("close", (p) => {
        try {
          E && clearTimeout(E);
        } catch {
        }
        return a.json({ success: !0, code: p, stdout: u, stderr: l });
      }), h.on("error", (p) => {
        try {
          E && clearTimeout(E);
        } catch {
        }
        return a.status(500).json({ success: !1, error: p?.message || "EXEC_ERROR" });
      });
    } catch (c) {
      return a.status(500).json({ success: !1, error: c?.message || "INTERNAL_ERROR" });
    }
  });
}
function hs({ app: g, getPluginWindowManager: e, getWindowManager: t }) {
  const s = (n) => {
    const i = String(n.get("X-Plugin-ID") || "").trim(), { windowId: o, pluginId: a } = n.body || {}, c = String(o || a || i || "").trim();
    return c ? { pluginId: c } : { main: !0 };
  }, r = (n) => {
    const i = s(n), o = e?.(), a = t?.();
    return i.pluginId ? o?.getWindow(i.pluginId) || null : a?.getMainWindow() || null;
  };
  g.post("/api/windows/minimize", (n, i) => {
    const o = r(n);
    if (o && !o.isDestroyed())
      return o.minimize(), i.json({ success: !0 });
    i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
  }), g.post("/api/windows/maximize", (n, i) => {
    const o = r(n);
    if (o && !o.isDestroyed())
      return o.isMaximized() ? o.unmaximize() : o.maximize(), i.json({ success: !0 });
    i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
  }), g.post("/api/windows/restore", (n, i) => {
    const o = r(n);
    if (o && !o.isDestroyed())
      return o.restore(), i.json({ success: !0 });
    i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
  }), g.get("/api/windows/size", (n, i) => {
    const o = r(n);
    if (o && !o.isDestroyed()) {
      const [a, c] = o.getSize();
      return i.json({ success: !0, width: a, height: c });
    }
    i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
  }), g.post("/api/windows/size", (n, i) => {
    const o = r(n);
    if (o && !o.isDestroyed()) {
      const { width: a, height: c } = n.body;
      return typeof a == "number" && typeof c == "number" ? (o.setSize(a, c), i.json({ success: !0 })) : i.status(400).json({ success: !1, error: "INVALID_SIZE" });
    }
    i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
  }), g.get("/api/windows/position", (n, i) => {
    const o = r(n);
    if (o && !o.isDestroyed()) {
      const [a, c] = o.getPosition();
      return i.json({ success: !0, x: a, y: c });
    }
    i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
  }), g.post("/api/windows/position", (n, i) => {
    const o = r(n);
    if (o && !o.isDestroyed()) {
      const { x: a, y: c } = n.body;
      return typeof a == "number" && typeof c == "number" ? (o.setPosition(a, c), i.json({ success: !0 })) : i.status(400).json({ success: !1, error: "INVALID_POSITION" });
    }
    i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
  }), g.post("/api/windows/opacity", (n, i) => {
    const o = r(n);
    if (o && !o.isDestroyed()) {
      const { opacity: a } = n.body;
      return typeof a == "number" ? (o.setOpacity(a), i.json({ success: !0 })) : i.status(400).json({ success: !1, error: "INVALID_OPACITY" });
    }
    i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
  }), g.post("/api/windows/top", (n, i) => {
    const o = r(n);
    if (o && !o.isDestroyed()) {
      const { flag: a } = n.body;
      return o.setAlwaysOnTop(!!a), i.json({ success: !0 });
    }
    i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
  }), g.post("/api/windows/resizable", (n, i) => {
    const o = r(n);
    if (o && !o.isDestroyed()) {
      const { flag: a } = n.body;
      return o.setResizable(!!a), i.json({ success: !0 });
    }
    i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
  }), g.post("/api/windows/ignore-mouse", (n, i) => {
    const o = r(n);
    if (o && !o.isDestroyed()) {
      const { ignore: a, options: c } = n.body;
      return o.setIgnoreMouseEvents(!!a, c), i.json({ success: !0 });
    }
    i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
  }), g.post("/api/windows/show", async (n, i) => {
    try {
      const o = s(n);
      if (o.pluginId) {
        const c = await e?.()?.focus(o.pluginId);
        return !!(c && c.success) ? i.json({ success: !0 }) : i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
      }
      const a = t?.()?.getMainWindow();
      if (a && !a.isDestroyed()) {
        try {
          a.show(), a.focus();
        } catch {
        }
        return i.json({ success: !0 });
      }
      return i.status(404).json({ success: !1, error: "MAIN_WINDOW_NOT_FOUND" });
    } catch (o) {
      return i.status(500).json({ success: !1, error: o?.message || "SHOW_FAILED" });
    }
  }), g.post("/api/windows/focus", async (n, i) => {
    try {
      const o = s(n);
      if (o.pluginId) {
        const c = await e?.()?.focus(o.pluginId);
        return !!(c && c.success) ? i.json({ success: !0 }) : i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
      }
      const a = t?.()?.getMainWindow();
      if (a && !a.isDestroyed()) {
        try {
          a.show(), a.focus();
        } catch {
        }
        return i.json({ success: !0 });
      }
      return i.status(404).json({ success: !1, error: "MAIN_WINDOW_NOT_FOUND" });
    } catch (o) {
      return i.status(500).json({ success: !1, error: o?.message || "FOCUS_FAILED" });
    }
  }), g.post("/api/windows/blur", async (n, i) => {
    try {
      const o = s(n);
      if (o.pluginId) {
        const c = e?.()?.getWindow(o.pluginId);
        return c && !c.isDestroyed() ? (c.blur(), i.json({ success: !0 })) : i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
      }
      const a = t?.()?.getMainWindow();
      if (a && !a.isDestroyed()) {
        try {
          a.blur();
        } catch {
        }
        return i.json({ success: !0 });
      }
      return i.status(404).json({ success: !1, error: "MAIN_WINDOW_NOT_FOUND" });
    } catch (o) {
      return i.status(500).json({ success: !1, error: o?.message || "BLUR_FAILED" });
    }
  }), g.post("/api/windows/hide", async (n, i) => {
    try {
      const o = s(n);
      if (o.pluginId) {
        const c = e?.()?.getWindow(o.pluginId);
        return c && !c.isDestroyed() ? (c.hide(), i.json({ success: !0 })) : i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
      }
      const a = t?.()?.getMainWindow();
      if (a && !a.isDestroyed()) {
        try {
          a.hide();
        } catch {
        }
        return i.json({ success: !0 });
      }
      return i.status(404).json({ success: !1, error: "MAIN_WINDOW_NOT_FOUND" });
    } catch (o) {
      return i.status(500).json({ success: !1, error: o?.message || "HIDE_FAILED" });
    }
  }), g.post("/api/windows/close", async (n, i) => {
    try {
      const { pluginId: o } = s(n);
      if (o) {
        const c = await e?.()?.close(o);
        return !!(c && c.success) ? i.json({ success: !0 }) : i.status(404).json({ success: !1, error: "WINDOW_NOT_FOUND" });
      }
      const a = t?.()?.getMainWindow();
      if (a && !a.isDestroyed()) {
        try {
          a.close();
        } catch {
        }
        return i.json({ success: !0 });
      }
      return i.status(404).json({ success: !1, error: "MAIN_WINDOW_NOT_FOUND" });
    } catch (o) {
      return i.status(500).json({ success: !1, error: o?.message || "CLOSE_FAILED" });
    }
  }), g.get("/api/windows/list", async (n, i) => {
    try {
      const o = await e?.()?.list(), a = t?.()?.getMainWindow(), c = a && !a.isDestroyed() ? { windowId: "main", visible: a.isVisible(), focused: a.isFocused() } : { windowId: "main", visible: !1, focused: !1 }, d = Array.isArray(o?.windows) ? o.windows.map((f) => ({ windowId: f.pluginId, visible: !!f.visible, focused: !!f.focused })) : [];
      return i.json({ success: !0, windows: [c, ...d] });
    } catch (o) {
      return i.status(500).json({ success: !1, error: o?.message || "LIST_FAILED" });
    }
  }), g.get("/api/windows/self", async (n, i) => {
    try {
      const a = String(n.get("X-Plugin-ID") || "").trim() || "main";
      return i.json({ success: !0, windowId: a });
    } catch (o) {
      return i.status(500).json({ success: !1, error: o?.message || "SELF_FAILED" });
    }
  });
}
function gs({ app: g }) {
  const e = (t) => {
    const s = String(t.get("X-Plugin-ID") || "").trim(), r = t.body || {}, n = String(t.query?.pluginId || t.query?.windowId || "").trim(), i = String(r.windowId || r.pluginId || n || s || "").trim();
    return i ? { pluginId: i } : { main: !0 };
  };
  g.post("/api/fs/read", async (t, s) => {
    try {
      const { path: r } = t.body || {};
      if (!r || typeof r != "string") return s.status(400).json({ success: !1, error: "INVALID_PATH" });
      const { pluginId: n } = e(t);
      if (!n) return s.status(403).json({ error: "PLUGIN_CONTEXT_REQUIRED" });
      const i = I.join(R.getPath("userData"), "plugin-data", n), o = I.resolve(i, r);
      if (!o.startsWith(i)) return s.status(403).json({ error: "PATH_TRAVERSAL" });
      if (!S.existsSync(o)) return s.status(404).json({ error: "FILE_NOT_FOUND" });
      const a = S.readFileSync(o, "utf-8");
      s.json({ success: !0, data: a });
    } catch (r) {
      s.status(500).json({ success: !1, error: r?.message });
    }
  }), g.post("/api/fs/write", async (t, s) => {
    try {
      const { path: r, content: n } = t.body || {};
      if (!r || typeof r != "string") return s.status(400).json({ success: !1, error: "INVALID_PATH" });
      if (typeof n != "string") return s.status(400).json({ success: !1, error: "INVALID_CONTENT" });
      const { pluginId: i } = e(t);
      if (!i) return s.status(403).json({ error: "PLUGIN_CONTEXT_REQUIRED" });
      const o = I.join(R.getPath("userData"), "plugin-data", i);
      S.existsSync(o) || S.mkdirSync(o, { recursive: !0 });
      const a = I.resolve(o, r);
      if (!a.startsWith(o)) return s.status(403).json({ error: "PATH_TRAVERSAL" });
      S.writeFileSync(a, n, "utf-8"), s.json({ success: !0 });
    } catch (r) {
      s.status(500).json({ success: !1, error: r?.message });
    }
  }), g.post("/api/fs/size", async (t, s) => {
    try {
      const { path: r } = t.body || {};
      if (!r || typeof r != "string") return s.status(400).json({ success: !1, error: "INVALID_PATH" });
      const { pluginId: n } = e(t);
      if (!n) return s.status(403).json({ error: "PLUGIN_CONTEXT_REQUIRED" });
      const i = I.join(R.getPath("userData"), "plugin-data", n), o = I.resolve(i, r);
      if (!o.startsWith(i)) return s.status(403).json({ error: "PATH_TRAVERSAL" });
      if (!S.existsSync(o)) return s.status(404).json({ error: "FILE_NOT_FOUND" });
      const a = (d) => {
        const f = S.statSync(d);
        if (f.isFile()) return f.size;
        if (f.isDirectory()) {
          let w = 0;
          for (const v of S.readdirSync(d)) {
            const _ = I.join(d, v);
            try {
              w += a(_);
            } catch {
            }
          }
          return w;
        }
        return 0;
      }, c = a(o);
      return s.json({ success: !0, size: c });
    } catch (r) {
      return s.status(500).json({ success: !1, error: r?.message || "SIZE_FAILED" });
    }
  }), g.post("/api/fs/remove", async (t, s) => {
    try {
      const { path: r } = t.body || {};
      if (!r || typeof r != "string") return s.status(400).json({ success: !1, error: "INVALID_PATH" });
      const { pluginId: n } = e(t);
      if (!n) return s.status(403).json({ error: "PLUGIN_CONTEXT_REQUIRED" });
      const i = I.join(R.getPath("userData"), "plugin-data", n), o = I.resolve(i, r);
      if (!o.startsWith(i)) return s.status(403).json({ error: "PATH_TRAVERSAL" });
      if (!S.existsSync(o)) return s.status(404).json({ error: "FILE_NOT_FOUND" });
      const a = (c) => {
        const d = S.statSync(c);
        if (d.isFile()) return S.unlinkSync(c);
        if (d.isDirectory()) {
          for (const f of S.readdirSync(c)) {
            const w = I.join(c, f);
            try {
              a(w);
            } catch {
            }
          }
          S.rmdirSync(c);
        }
      };
      return a(o), s.json({ success: !0 });
    } catch (r) {
      return s.status(500).json({ success: !1, error: r?.message || "REMOVE_FAILED" });
    }
  });
}
class se {
  static instance;
  mc = ie.getInstance();
  static getInstance() {
    return se.instance || (se.instance = new se()), se.instance;
  }
  markReady(e) {
  }
  queueOrPublish(e, t, s) {
    const r = String(e || "").trim();
    if (!r) return null;
    try {
      fetch("http://127.0.0.1:7242/ingest/52fa37f8-b908-44d5-87d2-c8f2861a8c45", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "settings-subscribe",
          hypothesisId: "C",
          location: "packages/main/src/server/SseQueueService.ts:19",
          message: "queueOrPublish called",
          data: { channel: r, meta: s?.meta, payloadSummary: typeof t == "object" ? Object.keys(t).slice(0, 5) : String(t) },
          timestamp: Date.now()
        })
      }).catch(() => {
      });
    } catch {
    }
    return this.mc.publish(r, t, s);
  }
}
const Ne = /* @__PURE__ */ new Map(), fs = (g, e) => {
  const t = Ne.get(g) || /* @__PURE__ */ new Set();
  t.add(e), Ne.set(g, t);
}, ms = (g, e) => {
  const t = Ne.get(g);
  t && (t.delete(e), t.size === 0 && Ne.delete(g));
}, Je = (g) => Array.from(Ne.get(g) || []), Ue = (g) => {
  const e = String(g.get("X-Plugin-ID") || "").trim(), t = g.body || {}, s = String(g.query?.pluginId || g.query?.windowId || "").trim();
  return String(t.windowId || t.pluginId || s || e || "").trim();
};
function ps({ app: g, getPluginWindowManager: e }) {
  g.post("/api/shortcut/register", (t, s) => {
    const { accelerator: r } = t.body, n = Ue(t);
    if (!n) return s.status(400).json({ error: "PLUGIN_CONTEXT_REQUIRED" });
    try {
      if (!ze.register(r, () => {
        e?.()?.send(n, "shortcut-triggered", { accelerator: r });
        try {
          const o = `plugin:${n}:overlay`;
          se.getInstance().queueOrPublish(
            o,
            { event: "shortcut", payload: { accelerator: r } },
            { ttlMs: 12e4, persist: !0, meta: { kind: "shortcut" } }
          );
        } catch {
        }
      })) return s.json({ success: !1, error: "REGISTER_FAILED" });
      fs(n, r), s.json({ success: !0 });
    } catch (i) {
      s.status(500).json({ success: !1, error: i.message });
    }
  }), g.post("/api/shortcut/unregister", (t, s) => {
    const { accelerator: r } = t.body;
    try {
      const n = Ue(t);
      n && ms(n, r), ze.unregister(r), s.json({ success: !0 });
    } catch (n) {
      s.status(500).json({ success: !1, error: n.message });
    }
  }), g.post("/api/shortcut/unregister-all", (t, s) => {
    try {
      const r = Ue(t);
      if (!r) return s.status(400).json({ success: !1, error: "PLUGIN_CONTEXT_REQUIRED" });
      const n = Je(r);
      for (const i of n)
        try {
          ze.unregister(i);
        } catch {
        }
      return Ne.delete(r), s.json({ success: !0, count: n.length });
    } catch (r) {
      return s.status(500).json({ success: !1, error: r.message });
    }
  }), g.post("/api/shortcut/is-registered", (t, s) => {
    const { accelerator: r } = t.body;
    try {
      const n = ze.isRegistered(r);
      s.json({ success: !0, registered: n });
    } catch (n) {
      s.status(500).json({ success: !1, error: n.message });
    }
  }), g.get("/api/shortcut/list", (t, s) => {
    try {
      const r = Ue(t);
      if (!r) return s.status(400).json({ success: !1, error: "PLUGIN_CONTEXT_REQUIRED" });
      const n = Je(r);
      return s.json({ success: !0, accelerators: n });
    } catch (r) {
      return s.status(500).json({ success: !1, error: r.message });
    }
  }), g.post("/api/shortcut/list", (t, s) => {
    try {
      const r = Ue(t);
      if (!r) return s.status(400).json({ success: !1, error: "PLUGIN_CONTEXT_REQUIRED" });
      const n = Je(r);
      return s.json({ success: !0, shortcuts: n });
    } catch (r) {
      return s.status(500).json({ success: !1, error: r.message });
    }
  });
}
var rt = /* @__PURE__ */ ((g) => (g[g.DEBUG = 0] = "DEBUG", g[g.INFO = 1] = "INFO", g[g.WARN = 2] = "WARN", g[g.ERROR = 3] = "ERROR", g))(rt || {});
class ys {
  logDir;
  logFile;
  maxLogSize = 10 * 1024 * 1024;
  // 10MB
  maxLogFiles = 5;
  constructor() {
    this.logDir = I.join(R.getPath("userData"), "logs"), this.logFile = I.join(this.logDir, "plugins.log"), this.ensureLogDirectory();
  }
  ensureLogDirectory() {
    S.existsSync(this.logDir) || S.mkdirSync(this.logDir, { recursive: !0 });
  }
  /**
   * 记录调试信息
   */
  debug(e, t, s) {
    this.log(0, e, t, void 0, s);
  }
  /**
   * 记录一般信息
   */
  info(e, t, s) {
    this.log(1, e, t, void 0, s);
  }
  /**
   * 记录警告信息
   */
  warn(e, t, s) {
    this.log(2, e, t, void 0, s);
  }
  /**
   * 记录错误信息
   */
  error(e, t, s, r) {
    this.log(3, e, t, s, r);
  }
  /**
   * 记录日志条目
   */
  log(e, t, s, r, n) {
    const i = {
      timestamp: Date.now(),
      level: e,
      pluginId: s,
      message: t,
      error: r,
      context: n
    }, o = this.formatLogEntry(i);
    try {
      this.rotateLogIfNeeded(), S.appendFileSync(this.logFile, o + `
`, "utf-8");
      const a = s ? `[Plugin ${s}]` : "[Plugin]";
      try {
        switch (e) {
          case 3:
            console.error(a, t);
            break;
          case 2:
            console.warn(a, t);
            break;
          case 0:
            console.debug(a, t);
            break;
          default:
            console.log(a, t);
        }
      } catch {
      }
    } catch (a) {
      console.error("Failed to write plugin log:", a);
    }
  }
  /**
   * 格式化日志条目
   */
  formatLogEntry(e) {
    const t = new Date(e.timestamp).toISOString(), s = rt[e.level], r = e.pluginId ? `[${e.pluginId}]` : "";
    let n = `${t} ${s} ${r} ${e.message}`;
    return e.error && (n += `
Error: ${e.error.message}`, e.error.stack && (n += `
Stack: ${e.error.stack}`)), e.context && (n += `
Context: ${JSON.stringify(e.context, null, 2)}`), n;
  }
  /**
   * 轮转日志文件
   */
  rotateLogIfNeeded() {
    if (!(!S.existsSync(this.logFile) || S.statSync(this.logFile).size < this.maxLogSize))
      try {
        for (let t = this.maxLogFiles - 1; t > 0; t--) {
          const s = `${this.logFile}.${t}`, r = `${this.logFile}.${t + 1}`;
          S.existsSync(s) && (t === this.maxLogFiles - 1 ? S.unlinkSync(s) : S.renameSync(s, r));
        }
        S.renameSync(this.logFile, `${this.logFile}.1`);
      } catch (t) {
        console.error("Failed to rotate plugin log:", t);
      }
  }
  /**
   * 获取最近的日志条目
   */
  getRecentLogs(e, t = 100) {
    try {
      if (!S.existsSync(this.logFile))
        return [];
      const r = S.readFileSync(this.logFile, "utf-8").split(`
`).filter((i) => i.trim()), n = [];
      for (const i of r.slice(-t * 2))
        try {
          const o = this.parseLogLine(i);
          o && (!e || o.pluginId === e) && n.push(o);
        } catch {
        }
      return n.slice(-t);
    } catch (s) {
      return console.error("Failed to read plugin logs:", s), [];
    }
  }
  /**
   * 解析日志行
   */
  parseLogLine(e) {
    const t = e.match(/^(\S+)\s+(\w+)\s+(?:\[([^\]]+)\])?\s+(.+)$/);
    if (!t)
      return null;
    const [, s, r, n, i] = t, o = rt[r];
    return o === void 0 ? null : {
      timestamp: new Date(s).getTime(),
      level: o,
      pluginId: n || void 0,
      message: i
    };
  }
  /**
   * 清理旧日志
   */
  cleanup() {
    try {
      const t = S.readdirSync(this.logDir).filter((s) => s.startsWith("plugins.log"));
      if (t.length > this.maxLogFiles) {
        const s = t.map((r) => ({
          name: r,
          path: I.join(this.logDir, r),
          mtime: S.statSync(I.join(this.logDir, r)).mtime
        })).sort((r, n) => n.mtime.getTime() - r.mtime.getTime());
        for (let r = this.maxLogFiles; r < s.length; r++)
          S.unlinkSync(s[r].path);
      }
    } catch (e) {
      console.error("Failed to cleanup plugin logs:", e);
    }
  }
}
const m = new ys();
function ws({ app: g, diagnosticsService: e }) {
  g.post("/api/logger", (t, s) => {
    try {
      const { level: r, message: n } = t.body, i = String(t.get("X-Plugin-ID") || "").trim(), o = i ? `Plugin:${i}` : "Plugin:Unknown", a = String(n || ""), c = ye();
      r === "error" ? c.addLog(o, a, "error") : r === "warn" ? c.addLog(o, a, "warn") : c.addLog(o, a, "info");
      const d = i || void 0;
      r === "error" ? m.error(a, d) : r === "warn" ? m.warn(a, d) : m.info(a, d), s.json({ success: !0 });
    } catch (r) {
      s.status(500).json({ success: !1, error: r?.message });
    }
  }), g.get(
    "/api/logs",
    (t, s, r) => {
      try {
        const n = t.query.level?.toLowerCase(), i = t.query.source, o = t.query.from_ts ? parseInt(String(t.query.from_ts)) : void 0, a = t.query.to_ts ? parseInt(String(t.query.to_ts)) : void 0, c = t.query.limit ? Math.min(1e3, Math.max(1, parseInt(String(t.query.limit)))) : 200;
        let d = e.getRecentLogs(c);
        n && (d = d.filter((f) => String(f.level).toLowerCase() === n)), i && (d = d.filter((f) => String(f.source || "").includes(i))), o && (d = d.filter((f) => new Date(String(f.timestamp)).getTime() >= o)), a && (d = d.filter((f) => new Date(String(f.timestamp)).getTime() <= a)), s.json({ success: !0, data: d });
      } catch (n) {
        r(n);
      }
    }
  ), g.post(
    "/api/logs/export",
    (t, s, r) => {
      try {
        const n = t.body?.from_ts ? parseInt(String(t.body.from_ts)) : void 0, i = t.body?.to_ts ? parseInt(String(t.body.to_ts)) : void 0, o = String(t.body?.level || "error").toLowerCase(), a = t.body?.source ? String(t.body.source) : void 0, c = t.body?.limit ? Math.min(5e3, Math.max(1, parseInt(String(t.body.limit)))) : 1e3;
        let d = e.getRecentLogs(c);
        d = d.filter((_) => String(_.level).toLowerCase() === o), a && (d = d.filter((_) => String(_.source || "").includes(a))), n && (d = d.filter((_) => new Date(String(_.timestamp)).getTime() >= n)), i && (d = d.filter((_) => new Date(String(_.timestamp)).getTime() <= i));
        const f = I.join(R.getPath("userData"), "logs-exports");
        try {
          S.existsSync(f) || S.mkdirSync(f, { recursive: !0 });
        } catch {
        }
        const w = `error-logs-${Date.now()}.json`, v = I.join(f, w);
        S.writeFileSync(v, JSON.stringify(d, null, 2), "utf-8"), s.json({ success: !0, filepath: v, count: d.length });
      } catch (n) {
        r(n);
      }
    }
  );
}
function vs({ app: g, consoleManager: e }) {
  g.get("/api/console/data", (t, s) => {
    try {
      const r = e.getCommands(), n = e.getActiveSessions();
      s.json({ success: !0, data: { commands: r, sessions: n } });
    } catch (r) {
      s.status(500).json({ success: !1, error: r.message });
    }
  }), g.post(
    "/api/console/sessions",
    async (t, s, r) => {
      try {
        const { name: n } = t.body, i = await e.createSession(n);
        s.json({ success: !0, session: i });
      } catch (n) {
        r(n);
      }
    }
  ), g.delete(
    "/api/console/sessions/:sessionId",
    async (t, s, r) => {
      try {
        const { sessionId: n } = t.params, i = await e.endSession(n);
        s.json({ success: i });
      } catch (n) {
        r(n);
      }
    }
  ), g.post(
    "/api/console/sessions/:sessionId/execute",
    async (t, s, r) => {
      try {
        const { sessionId: n } = t.params, { command: i } = t.body, o = await e.executeCommand(n, i);
        s.json({ success: !0, result: o });
      } catch (n) {
        r(n);
      }
    }
  ), g.get("/api/console/commands", (t, s) => {
    try {
      const r = e.getCommands();
      s.json({ success: !0, commands: r });
    } catch (r) {
      s.status(500).json({ success: !1, error: r.message });
    }
  }), g.get("/api/console/sessions", (t, s) => {
    try {
      const r = e.getActiveSessions();
      s.json({ success: !0, sessions: r });
    } catch (r) {
      s.status(500).json({ success: !1, error: r.message });
    }
  }), g.get("/api/console/sessions/:sessionId", (t, s) => {
    try {
      const { sessionId: r } = t.params, n = e.getSession(r);
      n ? s.json({ success: !0, session: n }) : s.status(404).json({ success: !1, error: "Session not found" });
    } catch (r) {
      s.status(500).json({ success: !1, error: r.message });
    }
  });
}
function Ss(g) {
  const e = ve.Router(), t = g.dataManager;
  return e.get("/:pluginId/config", (s, r) => {
    try {
      const n = String(s.params.pluginId || "").trim();
      if (!n) return r.status(400).json({ success: !1, error: "INVALID_PLUGIN_ID" });
      let i = null, o = null;
      try {
        const a = R.getPath("userData"), c = require("path").join(a, "config.json"), d = require("fs").readFileSync(c, "utf-8"), f = JSON.parse(d || "{}"), w = (f && typeof f == "object" ? f.plugins : null) || null, v = w && typeof w == "object" ? w[n] : null, _ = v && typeof v == "object" ? v.config : null;
        _ && typeof _ == "object" && (i = _);
      } catch {
      }
      try {
        o = new Ee().get(`plugins.${n}.config`, {}) || {};
      } catch {
      }
      !i || i && Object.keys(i).length === 0 ? i = o || {} : o && Object.keys(o).length > 0 && (i = { ...o, ...i }), r.json({ success: !0, data: i || {} });
    } catch (n) {
      r.status(500).json({ success: !1, error: n.message });
    }
  }), e.post("/:pluginId/config", (s, r) => {
    try {
      const n = String(s.params.pluginId || "").trim();
      if (!n) return r.status(400).json({ success: !1, error: "INVALID_PLUGIN_ID" });
      const i = s.body, o = new Ee(), c = { ...o.get(`plugins.${n}.config`, {}) || {}, ...i };
      o.set(`plugins.${n}.config`, c);
      const d = `plugin:${n}:overlay`;
      try {
        t.publish(d, { event: "config-changed", payload: c }, { ttlMs: 1e4, persist: !1, meta: { kind: "config" } });
      } catch {
      }
      r.json({ success: !0, data: c });
    } catch (n) {
      r.status(500).json({ success: !1, error: n.message });
    }
  }), e.delete("/:pluginId/config/:key", (s, r) => {
    try {
      const n = String(s.params.pluginId || "").trim(), i = String(s.params.key || "").trim();
      if (!n || !i) return r.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const o = new Ee(), a = o.get(`plugins.${n}.config`, {}) || {};
      Object.prototype.hasOwnProperty.call(a, i) && delete a[i], o.set(`plugins.${n}.config`, a);
      const c = `plugin:${n}:overlay`;
      try {
        t.publish(c, { event: "config-changed", payload: a }, { ttlMs: 1e4, persist: !1, meta: { kind: "config" } });
      } catch {
      }
      r.json({ success: !0, data: a });
    } catch (n) {
      r.status(500).json({ success: !1, error: n.message });
    }
  }), e.delete("/:pluginId/config", (s, r) => {
    try {
      const n = String(s.params.pluginId || "").trim(), i = String((s.body || {}).key || "").trim();
      if (!n || !i) return r.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const o = new Ee(), a = o.get(`plugins.${n}.config`, {}) || {};
      Object.prototype.hasOwnProperty.call(a, i) && delete a[i], o.set(`plugins.${n}.config`, a);
      const c = `plugin:${n}:overlay`;
      try {
        t.publish(c, { event: "config-changed", payload: a }, { ttlMs: 1e4, persist: !1, meta: { kind: "config" } });
      } catch {
      }
      r.json({ success: !0, data: a });
    } catch (n) {
      r.status(500).json({ success: !1, error: n.message });
    }
  }), e;
}
const bs = [
  "danmaku",
  "gift",
  "follow",
  "like",
  "enter",
  "system",
  "shareLive",
  "richText",
  "recentComment",
  "bananaCount",
  "displayInfo",
  "topUsers",
  "redpackList",
  "chatCall",
  "chatAccept",
  "chatReady",
  "chatEnd",
  "kickedOut",
  "violationAlert",
  "managerState",
  "end"
], Ye = new Set(bs.map((g) => g.toLowerCase())), Ze = [
  "user-login",
  "user-logout",
  "route-change",
  "live-start",
  "live-stop",
  "danmaku-collection-start",
  "danmaku-collection-stop",
  "config-updated",
  "plugin-enabled",
  "plugin-disabled",
  "plugin-uninstalled",
  "app-closing"
], je = ["mainMessage", "uiMessage", "message"];
class Re {
  static instance;
  subs = /* @__PURE__ */ new Map();
  static getInstance() {
    return Re.instance || (Re.instance = new Re()), Re.instance;
  }
  ensure(e, t) {
    const s = Date.now();
    let r = this.subs.get(e);
    r || (r = /* @__PURE__ */ new Map(), this.subs.set(e, r));
    let n = r.get(t);
    return n || (n = {
      kinds: /* @__PURE__ */ new Set(),
      storeKeys: /* @__PURE__ */ new Set(),
      danmakuRules: [],
      createdAt: s,
      updatedAt: s
    }, r.set(t, n)), n;
  }
  register(e, t, s) {
    const r = this.ensure(e, t);
    return this.applyUpdate(e, t, s || {}, !0), r;
  }
  unregister(e, t) {
    const s = this.subs.get(e);
    s && (s.delete(t), s.size === 0 && this.subs.delete(e));
  }
  get(e, t) {
    const s = this.subs.get(e);
    if (s)
      return s.get(t);
  }
  /**
   * Replace provided fields (kinds/storeKeys) with new sets.
   * If `skipEmptyReplace` is true, undefined fields are left untouched.
   */
  applyUpdate(e, t, s, r = !1) {
    const n = this.ensure(e, t), i = Date.now();
    return (s.kinds || !r) && (n.kinds = new Set(
      (s.kinds || []).map((o) => String(o || "").trim().toLowerCase()).filter(Boolean)
    )), (s.storeKeys || !r) && (n.storeKeys = new Set(
      (s.storeKeys || []).map((o) => String(o || "").trim()).filter(Boolean)
    )), n.updatedAt = i, n;
  }
  /**
   * 覆盖指定插件+客户端的 danmaku 规则。
   * - rules 中每个 roomId 会被写入一条记录
   * - types 为空数组：表示该房间不接收任何 danmaku
   * - types 包含 "*"：表示该房间接收所有类型
   */
  setDanmakuRules(e, t, s) {
    const r = this.ensure(e, t), n = Date.now(), i = /* @__PURE__ */ new Map();
    for (const o of s || []) {
      const a = String(o?.roomId || "").trim();
      if (!a) continue;
      const c = Array.isArray(o?.types) ? o.types : [], d = c.map((f) => String(f || "").trim()).filter((f) => f.length > 0 || c.length === 0);
      i.set(a, d);
    }
    return r.danmakuRules = Array.from(i.entries()).map(([o, a]) => ({ roomId: o, types: a })), r.updatedAt = n, r;
  }
  /**
   * 从指定客户端的 danmaku 规则中移除若干房间。
   */
  removeDanmakuRooms(e, t, s) {
    const r = this.ensure(e, t), n = Date.now(), i = s && s.length > 0 ? new Set(s.map((o) => String(o || "").trim()).filter(Boolean)) : null;
    return i ? r.danmakuRules = r.danmakuRules.filter((o) => !i.has(o.roomId)) : r.danmakuRules = [], r.updatedAt = n, r;
  }
  /**
   * Remove selected entries; if fields are omitted, clear them.
   */
  removeEntries(e, t, s) {
    const r = this.ensure(e, t), n = Date.now();
    return s.kinds && (s.kinds.length === 0 && r.kinds.clear(), s.kinds.forEach((i) => r.kinds.delete(String(i || "").trim().toLowerCase()))), s.storeKeys && (s.storeKeys.length === 0 && r.storeKeys.clear(), s.storeKeys.forEach((i) => r.storeKeys.delete(String(i || "").trim()))), r.updatedAt = n, r;
  }
  /**
   * Check whether an envelope with given kind should be delivered, considering room filters.
   */
  shouldDeliver(e, t, s) {
    const r = this.get(e, t);
    if (!r) return !1;
    const n = String(s.kind || "").trim().toLowerCase();
    if (!n) return !1;
    if (n === "store")
      return r.storeKeys.size > 0;
    if (n === "shortcut")
      return !0;
    if (r.kinds.size === 0) return !1;
    if (n === "danmaku") {
      const i = String(s.roomId || "").trim();
      if (!i) return !1;
      const o = r.danmakuRules.find((f) => f.roomId === i);
      if (!o) return !1;
      if (o.types.includes("*")) return !0;
      if (o.types.length === 0) return !1;
      const a = s.payload || {}, c = String(a && (a.type || a.event_type) || "").toLowerCase();
      return c ? o.types.map((f) => String(f || "").toLowerCase()).includes(c) : !1;
    }
    if (r.kinds.has(n)) return !0;
    if (n === "danmaku") {
      for (const i of r.kinds)
        if (i.startsWith("danmaku:")) {
          const o = i.split(":")[1];
          if (o && s.roomId === o) return !0;
        }
    }
    return !1;
  }
  /**
   * For store payload filtering.
   */
  filterStorePayload(e, t, s) {
    const r = this.get(e, t);
    if (!r || r.storeKeys.size === 0) return null;
    const n = r.storeKeys.has("*"), i = {};
    for (const o of Object.keys(s || {}))
      !n && !r.storeKeys.has(o) || o === "token" || o === "plugin" || (i[o] = s[o]);
    return Object.keys(i).length === 0 ? null : i;
  }
  /**
   * 检查指定插件是否有任何客户端订阅了指定的 kind
   */
  hasSubscription(e, t) {
    const s = this.subs.get(e);
    if (!s) return !1;
    const r = String(t || "").trim().toLowerCase();
    for (const n of s.values())
      if (n.kinds.has(r)) return !0;
    return !1;
  }
  /**
   * 清理指定插件的所有订阅（用于插件禁用/卸载时的主动清理）
   */
  clearPluginSubscriptions(e) {
    try {
      if (!this.subs.has(e)) return;
      this.subs.delete(e);
    } catch (t) {
      try {
        console.warn("[OverlaySubscriptionRegistry] clearPluginSubscriptions failed", e, t);
      } catch {
      }
    }
  }
}
const q = Re.getInstance();
function _s() {
  const g = ve.Router();
  return g.post("/:pluginId/subscribe/danmaku", (e, t) => {
    try {
      const s = String(e.params.pluginId || "").trim(), r = String(e.body?.clientId || "").trim();
      if (!s || !r) return t.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const n = Array.isArray(e.body?.rules) ? e.body.rules : [], i = [];
      for (const d of n) {
        const f = String(d?.roomId || "").trim();
        if (!f) continue;
        const w = Array.isArray(d?.types) ? d.types : [], v = w.length === 1 && w[0] === "*";
        if (w.includes("*") && !v)
          return t.status(400).json({ success: !1, error: "INVALID_TYPES", allowed: Array.from(Ye) });
        const _ = w.map((b) => String(b || "").trim()).filter(Boolean);
        if (!v && _.length > 0 && _.filter((h) => !Ye.has(h.toLowerCase())).length > 0)
          return t.status(400).json({ success: !1, error: "INVALID_TYPES", allowed: Array.from(Ye) });
        i.push({ roomId: f, types: v ? ["*"] : _ });
      }
      const o = Array.from(new Set(i.map((d) => d.roomId).filter(Boolean))), a = q.get(s, r), c = new Set(a?.kinds ?? []);
      o.length > 0 ? c.add("danmaku") : c.delete("danmaku"), q.applyUpdate(s, r, { kinds: Array.from(c) }, !0), q.setDanmakuRules(s, r, i), t.json({ success: !0, data: { clientId: r, rules: i } });
    } catch (s) {
      t.status(500).json({ success: !1, error: s.message });
    }
  }), g.post("/:pluginId/unsubscribe/danmaku", (e, t) => {
    try {
      const s = String(e.params.pluginId || "").trim(), r = String(e.body?.clientId || "").trim();
      if (!s || !r)
        return t.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const i = (Array.isArray(e.body?.roomIds) ? e.body.roomIds : []).map((d) => String(d || "").trim()).filter(Boolean), o = q.get(s, r);
      if (!o)
        return t.json({ success: !0, data: { clientId: r, roomIds: [] } });
      const a = q.removeDanmakuRooms(s, r, i), c = new Set(Array.from(o.kinds || []));
      a.danmakuRules.length === 0 ? c.delete("danmaku") : c.add("danmaku"), q.applyUpdate(s, r, { kinds: Array.from(c) }, !0), t.json({ success: !0, data: { clientId: r, roomIds: a.danmakuRules.map((d) => d.roomId) } });
    } catch (s) {
      t.status(500).json({ success: !1, error: s.message });
    }
  }), g.post("/:pluginId/subscribe/store", (e, t) => {
    try {
      const s = String(e.params.pluginId || "").trim(), r = String(e.body?.clientId || "").trim();
      if (!s || !r) return t.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const i = (Array.isArray(e.body?.keys) ? e.body.keys : []).map((c) => String(c || "").trim()).filter(Boolean), o = i.length === 1 && i[0] === "*";
      if (i.includes("*") && !o)
        return t.status(400).json({ success: !1, error: "INVALID_KEYS", allowed: ["*"] });
      q.applyUpdate(s, r, { storeKeys: i }, !0);
      const a = (e.body?.includeSnapshot, null);
      t.json({
        success: !0,
        data: {
          clientId: r,
          keys: Array.from(q.get(s, r)?.storeKeys || []),
          storeSnapshot: a
        }
      });
    } catch (s) {
      t.status(500).json({ success: !1, error: s.message });
    }
  }), g.post("/:pluginId/unsubscribe/store", (e, t) => {
    try {
      const s = String(e.params.pluginId || "").trim(), r = String(e.body?.clientId || "").trim();
      if (!s || !r)
        return t.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      q.applyUpdate(s, r, { storeKeys: [] }, !0), t.json({ success: !0, data: { clientId: r, keys: [] } });
    } catch (s) {
      t.status(500).json({ success: !1, error: s.message });
    }
  }), g.post("/:pluginId/subscribe/renderer", (e, t) => {
    try {
      const s = String(e.params.pluginId || "").trim(), r = String(e.body?.clientId || "").trim();
      if (!s || !r) return t.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const i = (Array.isArray(e.body?.events) ? e.body.events : []).map((f) => String(f || "").trim()).filter(Boolean), o = i.length === 1 && i[0] === "*";
      if (i.includes("*") && !o)
        return t.status(400).json({ success: !1, error: "INVALID_EVENTS", allowed: Ze });
      if (!o && i.length > 0 && i.filter((w) => !Ze.includes(w)).length > 0)
        return t.status(400).json({ success: !1, error: "INVALID_EVENTS", allowed: Ze });
      const a = q.get(s, r), c = new Set(a?.kinds ?? []);
      o || i.length > 0 ? c.add("renderer") : c.delete("renderer"), q.applyUpdate(s, r, { kinds: Array.from(c) }, !0), t.json({ success: !0, data: { clientId: r, events: i } });
    } catch (s) {
      t.status(500).json({ success: !1, error: s.message });
    }
  }), g.post("/:pluginId/unsubscribe/renderer", (e, t) => {
    try {
      const s = String(e.params.pluginId || "").trim(), r = String(e.body?.clientId || "").trim();
      if (!s || !r) return t.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const n = q.get(s, r), i = new Set(Array.from(n?.kinds || []));
      i.delete("renderer"), q.applyUpdate(s, r, { kinds: Array.from(i) }, !0), t.json({ success: !0, data: { clientId: r } });
    } catch (s) {
      t.status(500).json({ success: !1, error: s.message });
    }
  }), g.post("/:pluginId/subscribe/config", (e, t) => {
    try {
      const s = String(e.params.pluginId || "").trim(), r = String(e.body?.clientId || "").trim();
      if (!s || !r) return t.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const n = q.get(s, r), i = new Set(n?.kinds ?? []);
      i.add("config"), q.applyUpdate(s, r, { kinds: Array.from(i) }, !0), t.json({ success: !0, data: { clientId: r } });
    } catch (s) {
      t.status(500).json({ success: !1, error: s.message });
    }
  }), g.post("/:pluginId/unsubscribe/config", (e, t) => {
    try {
      const s = String(e.params.pluginId || "").trim(), r = String(e.body?.clientId || "").trim();
      if (!s || !r) return t.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const n = q.get(s, r), i = new Set(Array.from(n?.kinds || []));
      i.delete("config"), q.applyUpdate(s, r, { kinds: Array.from(i) }, !0), t.json({ success: !0, data: { clientId: r } });
    } catch (s) {
      t.status(500).json({ success: !1, error: s.message });
    }
  }), g.post("/:pluginId/subscribe/messages", (e, t) => {
    try {
      const s = String(e.params.pluginId || "").trim(), r = String(e.body?.clientId || "").trim();
      if (!s || !r) return t.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const i = (Array.isArray(e.body?.kinds) ? e.body.kinds : []).map((f) => String(f || "").trim()).filter(Boolean), o = i.length === 1 && i[0] === "*";
      if (i.includes("*") && !o)
        return t.status(400).json({ success: !1, error: "INVALID_KINDS", allowed: je });
      if (!o && i.length > 0 && i.filter((w) => !je.includes(w)).length > 0)
        return t.status(400).json({ success: !1, error: "INVALID_KINDS", allowed: je });
      const a = q.get(s, r), c = new Set(a?.kinds ?? []), d = new Set(je.map((f) => f.toLowerCase()));
      for (const f of Array.from(c))
        d.has(f.toLowerCase()) && c.delete(f);
      i.forEach((f) => c.add(f)), q.applyUpdate(s, r, { kinds: Array.from(c) }, !0), t.json({ success: !0, data: { clientId: r, kinds: i } });
    } catch (s) {
      t.status(500).json({ success: !1, error: s.message });
    }
  }), g.post("/:pluginId/unsubscribe/messages", (e, t) => {
    try {
      const s = String(e.params.pluginId || "").trim(), r = String(e.body?.clientId || "").trim();
      if (!s || !r) return t.status(400).json({ success: !1, error: "INVALID_PARAMS" });
      const i = (Array.isArray(e.body?.kinds) ? e.body.kinds : []).map((d) => String(d || "").trim()).filter(Boolean), o = q.get(s, r), a = new Set(Array.from(o?.kinds || [])), c = new Set(je.map((d) => d.toLowerCase()));
      if (i.length === 0)
        for (const d of Array.from(a))
          c.has(d.toLowerCase()) && a.delete(d);
      else
        i.forEach((d) => {
          const f = String(d || "").trim();
          c.has(f.toLowerCase()) && a.delete(f);
        });
      q.applyUpdate(s, r, { kinds: Array.from(a) }, !0), t.json({ success: !0, data: { clientId: r, kinds: Array.from(a) } });
    } catch (s) {
      t.status(500).json({ success: !1, error: s.message });
    }
  }), g;
}
function As(g) {
  const e = ve.Router(), t = g.getPluginManager;
  return e.post("/:pluginId/storage", async (s, r) => {
    try {
      const n = String(s.params.pluginId || "").trim();
      if (!n) return r.status(400).json({ success: !1, error: "INVALID_PLUGIN_ID" });
      const i = t?.();
      if (!i) return r.status(503).json({ success: !1, error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const o = i.getApi?.(n);
      return o ? (await o.pluginStorage.write(s.body), r.json({ success: !0 })) : r.status(503).json({ success: !1, error: "PLUGIN_API_NOT_AVAILABLE" });
    } catch (n) {
      return r.status(500).json({ success: !1, error: n?.message || "STORAGE_WRITE_FAILED" });
    }
  }), e.get("/:pluginId/storage", async (s, r) => {
    try {
      const n = String(s.params.pluginId || "").trim();
      if (!n) return r.status(400).json({ success: !1, error: "INVALID_PLUGIN_ID" });
      const i = t?.();
      if (!i) return r.status(503).json({ success: !1, error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const o = i.getApi?.(n);
      if (!o) return r.status(503).json({ success: !1, error: "PLUGIN_API_NOT_AVAILABLE" });
      const a = typeof s.query.q == "string" ? String(s.query.q) : void 0, c = s.query.size !== void 0 ? Number(s.query.size) : void 0, d = await o.pluginStorage.read(a, c);
      return r.json({ success: !0, data: d });
    } catch (n) {
      return r.status(500).json({ success: !1, error: n?.message || "STORAGE_READ_FAILED" });
    }
  }), e.get("/:pluginId/storage/size", async (s, r) => {
    try {
      const n = String(s.params.pluginId || "").trim();
      if (!n) return r.status(400).json({ success: !1, error: "INVALID_PLUGIN_ID" });
      const i = t?.();
      if (!i) return r.status(503).json({ success: !1, error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const o = i.getApi?.(n);
      if (!o) return r.status(503).json({ success: !1, error: "PLUGIN_API_NOT_AVAILABLE" });
      const a = await o.pluginStorage.size();
      return r.json({ success: !0, count: a });
    } catch (n) {
      return r.status(500).json({ success: !1, error: n?.message || "STORAGE_SIZE_FAILED" });
    }
  }), e.post("/:pluginId/storage/remove", async (s, r) => {
    try {
      const n = String(s.params.pluginId || "").trim(), i = Array.isArray((s.body || {}).ids) ? s.body.ids.map((d) => Number(d)).filter((d) => Number.isFinite(d)) : [];
      if (!n) return r.status(400).json({ success: !1, error: "INVALID_PLUGIN_ID" });
      if (i.length === 0) return r.status(400).json({ success: !1, error: "INVALID_IDS" });
      const o = t?.();
      if (!o) return r.status(503).json({ success: !1, error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const a = o.getApi?.(n);
      if (!a) return r.status(503).json({ success: !1, error: "PLUGIN_API_NOT_AVAILABLE" });
      const c = await a.pluginStorage.remove(i);
      return r.json({ success: !0, removed: c });
    } catch (n) {
      return r.status(500).json({ success: !1, error: n?.message || "STORAGE_REMOVE_FAILED" });
    }
  }), e;
}
class ke {
  static instance;
  static getInstance() {
    return ke.instance || (ke.instance = new ke()), ke.instance;
  }
  info(e, t = {}) {
    this.log("info", e, t);
  }
  warn(e, t = {}) {
    this.log("warn", e, t);
  }
  error(e, t = {}) {
    this.log("error", e, t);
  }
  respondJson(e, t, s, r, n = {}) {
    const i = n.traceId ?? dt(), o = {
      success: !1,
      error: s,
      message: r,
      traceId: i,
      meta: this.minifyMeta(n.meta)
    };
    e.status(t), e.setHeader("Content-Type", "application/json; charset=utf-8");
    try {
      e.json(o);
    } catch (a) {
      this.error("respond_json_failed", { ...n, status: t, error: a, traceId: i });
    }
    return this.log(t >= 500 ? "error" : "warn", "respond_error", {
      ...n,
      status: t,
      reason: s,
      traceId: i
    }), { traceId: i };
  }
  log(e, t, s) {
    const r = s.traceId ?? dt(), n = {
      event: t,
      traceId: r,
      pluginId: s.pluginId,
      type: s.type,
      channel: s.channel,
      clientId: s.clientId,
      status: s.status,
      reason: s.reason,
      meta: this.minifyMeta(s.meta)
    }, i = s.error, o = i?.message || i?.toString?.() || void 0, a = i?.stack, c = [`[SSE] ${t}`, n];
    o && c.push(o), a && c.push(a), console[e](...c);
  }
  minifyMeta(e) {
    if (!e || Object.keys(e).length === 0) return;
    const t = {};
    for (const [s, r] of Object.entries(e))
      t[s] = typeof r == "string" && r.length > 500 ? `${r.slice(0, 497)}...` : r;
    return t;
  }
}
class pe {
  static instance;
  // Map<pluginId, Map<type, Map<clientId, connection>>>
  connections = /* @__PURE__ */ new Map();
  sweeperStarted = !1;
  reporter = ke.getInstance();
  static getInstance() {
    return pe.instance || (pe.instance = new pe()), pe.instance;
  }
  /**
   * 注册 SSE 连接
   * @param pluginId 插件 ID（必填）
   * @param type 插件类型（必填）
   * @param clientId 客户端 ID
   * @param response Express Response 对象
   * @returns 是否注册成功
   */
  register(e, t, s, r) {
    if (!e || !t || !s)
      return !1;
    this.connections.has(e) || this.connections.set(e, /* @__PURE__ */ new Map());
    const n = this.connections.get(e);
    if (t === "window" && n.has("ui") || t === "ui" && n.has("window"))
      return !1;
    const i = Date.now(), o = {
      pluginId: e,
      type: t,
      clientId: s,
      response: r,
      connectedAt: i,
      lastActivityAt: i,
      lastHeartbeatAt: i,
      droppedSinceLastOk: 0
    };
    return n.has(t) || n.set(t, /* @__PURE__ */ new Map()), n.get(t).set(s, o), r.on("close", () => {
      this.unregister(e, t, s);
    }), !0;
  }
  /**
   * 注销 SSE 连接
   */
  unregister(e, t, s) {
    const r = this.connections.get(e);
    if (!r) return;
    const n = r.get(t);
    n && (n.delete(s), n.size === 0 && r.delete(t), r.size === 0 && this.connections.delete(e));
  }
  /**
   * 获取指定插件和类型的所有连接
   */
  getConnections(e, t) {
    const s = this.connections.get(e);
    if (!s) return [];
    const r = s.get(t);
    return r ? Array.from(r.values()) : [];
  }
  /**
   * 检查指定插件和类型是否有活跃连接
   */
  hasConnections(e, t) {
    return this.getConnections(e, t).length > 0;
  }
  getConnection(e, t, s) {
    return this.connections.get(e)?.get(t)?.get(s);
  }
  /**
   * 向指定插件和类型的所有连接发送消息（排除发送者）
   */
  markActivity(e, t, s) {
    const r = this.getConnection(e, t, s);
    if (!r) return;
    const n = Date.now();
    r.lastActivityAt = n;
  }
  markHeartbeat(e, t, s) {
    const r = this.getConnection(e, t, s);
    if (!r) return;
    const n = Date.now();
    r.lastHeartbeatAt = n, r.lastActivityAt = n;
  }
  recordDrop(e, t, s) {
    const r = this.getConnection(e, t, s);
    return r ? (r.droppedSinceLastOk += 1, r.droppedSinceLastOk) : 0;
  }
  resetDrop(e, t, s) {
    const r = this.getConnection(e, t, s);
    r && (r.droppedSinceLastOk = 0);
  }
  sendMessage(e, t, s, r, n) {
    const i = this.getConnections(e, t);
    let o = 0;
    for (const a of i)
      if (!(r && a.clientId === r))
        try {
          const c = String(s?.kind || "message").toLowerCase(), d = JSON.stringify(s);
          if (a.response.writableEnded || a.response.writableFinished || a.response.destroyed)
            throw new Error("response_closed");
          a.response.write(`event: ${c}
`), a.response.write(`data: ${d}

`), a.lastActivityAt = Date.now(), a.droppedSinceLastOk = 0, o++;
        } catch (c) {
          n && n(a, c), this.reporter.warn("send_failed", {
            pluginId: e,
            type: t,
            clientId: a.clientId,
            error: c
          }), this.unregister(e, t, a.clientId);
        }
    return o;
  }
  /**
   * 获取所有连接的统计信息
   */
  getStats() {
    const e = [];
    for (const [t, s] of this.connections.entries())
      for (const [r, n] of s.entries())
        e.push({
          pluginId: t,
          type: r,
          count: n.size
        });
    return e;
  }
  sweepIdleConnections(e) {
    const t = Date.now();
    let s = 0;
    for (const [r, n] of this.connections.entries())
      for (const [i, o] of n.entries())
        for (const [a, c] of o.entries()) {
          const d = c.response.writableEnded || c.response.writableFinished || c.response.destroyed || c.response.closed, f = t - c.lastHeartbeatAt > e;
          if (d || f) {
            this.reporter.warn("connection_cleanup", {
              pluginId: r,
              type: i,
              clientId: a,
              reason: d ? "socket_closed" : "heartbeat_timeout"
            });
            try {
              c.response.end();
            } catch {
            }
            this.unregister(r, i, a), s += 1;
          }
        }
    return { closed: s };
  }
  ensureSweeper(e) {
    this.sweeperStarted || (this.sweeperStarted = !0, setInterval(() => {
      try {
        const { closed: t } = this.sweepIdleConnections(e);
        t > 0 && this.reporter.warn("sse_sweep_closed", { reason: "idle_timeout", meta: { closed: t, idleMs: e } });
      } catch (t) {
        this.reporter.error("sse_sweep_failed", { error: t });
      }
    }, Math.max(1e3, Math.floor(e / 2))));
  }
  /**
   * 关闭并注销指定插件的所有 SSE 连接（主动清理）
   * @returns 关闭的连接数量
   */
  closePluginConnections(e) {
    const t = this.connections.get(e);
    if (!t) return 0;
    let s = 0;
    try {
      for (const [r, n] of t.entries())
        for (const [i, o] of Array.from(n.entries())) {
          try {
            try {
              o.response.end();
            } catch {
            }
          } catch {
          }
          try {
            this.unregister(e, r, i);
          } catch {
          }
          s += 1;
        }
      this.reporter.info("plugin_connections_closed", { pluginId: e, count: s });
    } catch (r) {
      this.reporter.warn("plugin_connections_close_failed", { pluginId: e, error: r });
    }
    return s;
  }
}
function Es() {
  const g = ve.Router();
  return g.post("/:pluginId/messages", async (e, t) => {
    try {
      const s = String(e.params.pluginId || "").trim(), r = e.body?.payload, n = String(e.headers["x-client-id"] || "").trim(), i = String(e.headers["x-plugin-type"] || "").trim().toLowerCase();
      if (!s)
        return t.status(400).json({ success: !1, error: "MISSING_PLUGIN_ID" });
      const o = pe.getInstance(), a = i === "main" ? "mainMessage" : "uiMessage", c = { ts: Date.now(), pluginId: s, kind: a, payload: r };
      let d = 0;
      if (i === "main") {
        const f = o.hasConnections(s, "ui"), w = o.hasConnections(s, "window");
        if (!f && !w)
          return t.status(404).json({ success: !1, error: "NO_WINDOW_UI_CONNECTION" });
        f && (d += o.sendMessage(s, "ui", c, n)), w && (d += o.sendMessage(s, "window", c, n));
      } else if (o.hasConnections(s, "main"))
        d = o.sendMessage(s, "main", c, n);
      else
        return t.status(404).json({ success: !1, error: "NO_MAIN_CONNECTION" });
      return d === 0 ? t.status(404).json({ success: !1, error: "NO_RECIPIENTS" }) : t.json({ success: !0, sent: d });
    } catch (s) {
      return t.status(500).json({ success: !1, error: s?.message || "INTERNAL_ERROR" });
    }
  }), g;
}
function ks({ app: g, getPluginManager: e, overlayManager: t, dataManager: s, config: r, pluginRoutes: n }) {
  try {
    g.use("/api/plugins", Ss({ dataManager: s })), g.use("/api/plugins", _s()), g.use("/api/plugins", As({ getPluginManager: e })), g.use("/api/plugins", Es());
  } catch (i) {
    console.error("[ApiServer] Failed to mount refactored plugin routers:", i);
  }
  g.get("/api/plugins", (i, o) => {
    try {
      const a = e?.();
      if (!a) return o.status(503).json({ success: !1, error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const c = a.getInstalledPlugins();
      o.json({ success: !0, plugins: c });
    } catch (a) {
      o.status(500).json({ success: !1, error: a.message });
    }
  }), g.get("/api/plugins/:pluginId/dev-config", async (i, o) => {
    try {
      const a = String(i.params.pluginId || "").trim();
      if (!a) return o.status(400).json({ success: !1, error: "invalid_plugin" });
      const c = e?.();
      if (!c || !c.getDevConfig) return o.status(503).json({ success: !1, error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const d = await c.getDevConfig(a);
      return o.json({ success: !0, data: d || null });
    } catch (a) {
      return o.status(500).json({ success: !1, error: a?.message || "INTERNAL_ERROR" });
    }
  }), g.all("/plugins/:id/*rest", (i, o, a) => {
    const c = i.params.id, d = i.params.rest, f = `/${Array.isArray(d) ? d.join("/") : d || ""}`, w = n.get(c) || [], v = i.method.toUpperCase(), _ = w.find((b) => b.method === v && f.startsWith(b.path));
    if (_) {
      try {
        _.handler(i, o, a);
      } catch (b) {
        console.error("[ApiServer] Plugin route handler error:", b), o.status(500).json({ error: "PLUGIN_HANDLER_ERROR" });
      }
      return;
    }
    try {
      o.setHeader("Access-Control-Allow-Credentials", "true"), o.setHeader("Access-Control-Allow-Origin", String(i.headers.origin || "*")), o.setHeader("Access-Control-Allow-Headers", "X-Requested-With,Content-Type"), o.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
      const b = e?.();
      if (!b) return o.status(404).json({ error: "PLUGIN_MANAGER_NOT_AVAILABLE" });
      const h = b.getPlugin(c);
      if (!h) return o.status(404).json({ error: "PLUGIN_NOT_FOUND", pluginId: c });
      const u = f.split("/").filter(Boolean), l = h.manifest && h.manifest.icon ? String(h.manifest.icon) : "icon.svg", y = h.status === "enabled" && h.enabled === !0, E = u.length === 1 && u[0] === l;
      if (!y && !E)
        return o.status(403).json({ error: "PLUGIN_DISABLED", pluginId: c, path: f });
      const p = require("fs"), A = require("path"), T = A.resolve(h.installPath);
      if (h.manifest && h.manifest.spa === !0) {
        const H = A.join(h.installPath, "index.html"), B = A.resolve(H);
        if (!B.startsWith(T)) return o.status(403).json({ error: "FORBIDDEN_PATH" });
        const W = (f || "/").replace(/^\//, "") || "index.html", V = A.join(h.installPath, W), X = A.resolve(V);
        return X.startsWith(T) && p.existsSync(X) ? o.sendFile(X) : p.existsSync(B) ? o.sendFile(B) : o.status(404).json({ error: "FILE_NOT_FOUND", path: f });
      }
      const k = u.join("/"), D = A.join(h.installPath, k), N = A.resolve(D);
      return N.startsWith(T) ? p.existsSync(N) ? o.sendFile(N) : o.status(404).json({ error: "FILE_NOT_FOUND", path: f }) : o.status(403).json({ error: "FORBIDDEN_PATH" });
    } catch (b) {
      return console.error("[ApiServer] Plugin static hosting error:", b), o.status(500).json({ error: "PLUGIN_STATIC_HOSTING_ERROR" });
    }
  }), g.get("/plugins/:pluginId/:type", (i, o, a) => {
    try {
      const c = String(i.params.pluginId || "").trim(), d = String(i.params.type || "").trim();
      if (!c || !d) return o.status(400).send("Bad Request");
      const f = e?.()?.getPlugin(c);
      if (!f) return o.status(404).send("Plugin Not Found");
      const w = f.manifest || {}, v = w[d] || {}, _ = w.spa ? "index.html" : v?.html || `${d}.html`, b = f.installPath, h = require("path").join(b, _);
      return require("fs").existsSync(h) ? o.sendFile(h) : o.status(404).send("File Not Found");
    } catch (c) {
      return a(c);
    }
  }), g.get("/plugins/:pluginId/:file.html", (i, o, a) => {
    try {
      const c = String(i.params.pluginId || "").trim(), d = String(i.params.file || "").trim();
      if (!c || !d) return o.status(400).send("Bad Request");
      const f = e?.()?.getPlugin(c);
      if (!f) return o.status(404).send("Plugin Not Found");
      const w = f.installPath, v = require("path").join(w, `${d}.html`);
      return require("fs").existsSync(v) ? o.sendFile(v) : o.status(404).send("File Not Found");
    } catch (c) {
      return a(c);
    }
  });
}
function Is({ app: g, acfunApiProxy: e }) {
  g.post("/api/proxy/request", async (t, s) => {
    try {
      const r = String(t.body?.method || "GET").toUpperCase(), n = String(t.body?.url || "").trim(), i = t.body?.headers || {}, o = t.body?.body;
      if (!/^https?:\/\//.test(n)) return s.status(400).json({ success: !1, error: "invalid_url" });
      const a = { method: r, headers: i };
      if (o != null) {
        const w = String(i["Content-Type"] || i["content-type"] || "");
        a.body = w.includes("application/json") && typeof o != "string" ? JSON.stringify(o) : o;
      }
      const c = await fetch(n, a), d = String(c.headers.get("content-type") || "");
      let f = null;
      try {
        d.includes("application/json") ? f = await c.json() : f = await c.text();
      } catch {
        f = await c.text().catch(() => null);
      }
      return s.status(200).json({ success: !0, status: c.status, contentType: d, data: f });
    } catch (r) {
      return s.status(500).json({ success: !1, error: r?.message || "INTERNAL_ERROR" });
    }
  }), g.use("/api/acfun", e.createRoutes());
}
class Ie {
  static instance = null;
  dataManager = ie.getInstance();
  overlaysByPlugin = /* @__PURE__ */ new Map();
  static getInstance() {
    return Ie.instance || (Ie.instance = new Ie()), Ie.instance;
  }
  constructor() {
  }
  /** Generate a safe channel name for plugin page status */
  statusChannel(e) {
    return `plugin:${e}:page-status`;
  }
  /** Ensure a plugin status container exists */
  ensurePlugin(e) {
    let t = this.overlaysByPlugin.get(e);
    return t || (t = { pluginId: e, clients: /* @__PURE__ */ new Map(), lastChange: Date.now() }, this.overlaysByPlugin.set(e, t)), t;
  }
  /** Mark overlay SSE client connected and publish status event */
  overlayClientConnected(e, t) {
    const s = this.ensurePlugin(e), r = Date.now();
    s.clients.set(t, { clientId: t, lastSeen: r }), s.lastChange = r;
    const n = { type: "overlay-connected", pluginId: e, clientId: t, ts: r };
    return this.dataManager.publish(this.statusChannel(e), n, { ttlMs: 120 * 1e3, persist: !1, meta: { kind: "status" } });
  }
  /** Append heartbeat for overlay SSE client */
  overlayClientHeartbeat(e, t) {
    const s = this.ensurePlugin(e), r = Date.now(), n = s.clients.get(t);
    n ? n.lastSeen = r : s.clients.set(t, { clientId: t, lastSeen: r }), s.lastChange = r;
    const i = { type: "overlay-heartbeat", pluginId: e, clientId: t, ts: r };
    return this.dataManager.publish(this.statusChannel(e), i, { ttlMs: 60 * 1e3, persist: !1, meta: { kind: "heartbeat" } });
  }
  /** Mark overlay SSE client disconnected and publish status event */
  overlayClientDisconnected(e, t) {
    const s = this.ensurePlugin(e), r = Date.now();
    s.clients.delete(t), s.lastChange = r;
    const n = { type: "overlay-disconnected", pluginId: e, clientId: t, ts: r };
    return this.dataManager.publish(this.statusChannel(e), n, { ttlMs: 120 * 1e3, persist: !1, meta: { kind: "status" } });
  }
  /** Read-only snapshot of current page status */
  querySnapshot(e) {
    const t = Date.now(), s = (r) => ({
      pluginId: r.pluginId,
      overlayClients: Array.from(r.clients.values()).map((n) => ({ clientId: n.clientId, lastSeen: n.lastSeen })),
      connectedCount: r.clients.size,
      lastChange: r.lastChange,
      ts: t
    });
    if (e) {
      const r = this.ensurePlugin(e);
      return s(r);
    }
    return { plugins: Array.from(this.overlaysByPlugin.values()).map(s), ts: t };
  }
}
function Ts({ app: g, diagnosticsService: e, dataManager: t, overlayManager: s, getPluginManager: r }) {
  const n = ke.getInstance(), i = pe.getInstance(), o = Ge * 3, a = 100;
  i.ensureSweeper(o);
  const c = (v, _, b, h, u) => n.respondJson(v, _, b, h, { meta: u, status: _ });
  g.get("/sse/system/logs", (v, _) => {
    _.setHeader("Content-Type", "text/event-stream"), _.setHeader("Cache-Control", "no-cache"), _.setHeader("Connection", "keep-alive"), _.setHeader("X-Accel-Buffering", "no");
    try {
      _.flushHeaders?.();
    } catch {
    }
    try {
      _.write(`:

`);
    } catch {
    }
    const b = "system:logs", h = (E) => {
      try {
        _.write(`event: log
`), _.write(`data: ${JSON.stringify(E)}

`);
      } catch {
      }
    };
    try {
      const E = e.getRecentLogs(200);
      _.write(`event: init
`), _.write(`data: ${JSON.stringify(E)}

`);
    } catch {
    }
    const u = t.subscribe(b, h, void 0), l = setInterval(() => {
      try {
        _.write(`event: heartbeat
`), _.write(`data: {"ts": ${Date.now()}}

`);
      } catch {
      }
    }, Ge), y = () => {
      try {
        u();
      } catch {
      }
      try {
        clearInterval(l);
      } catch {
      }
      try {
        _.end();
      } catch {
      }
    };
    v.on("close", y);
  }), g.get("/sse/plugins/:pluginId/:type", (v, _) => {
    const b = String(v.params.pluginId || "").trim(), h = String(v.params.type || "").trim().toLowerCase();
    if (!b)
      return c(_, 400, "MISSING_PLUGIN_ID", "pluginId is required");
    if (h !== "ui" && h !== "window" && h !== "overlay" && h !== "main")
      return c(_, 400, "INVALID_PLUGIN_TYPE", `invalid type: ${h} (must be ui, window, overlay, or main)`);
    const u = h;
    try {
      const P = r?.()?.getPlugin(b);
      if (!(P && P.status === "enabled" && P.enabled === !0))
        return c(_, 403, "PLUGIN_DISABLED", `plugin ${b} is disabled`);
    } catch (P) {
      n.warn("plugin_status_check_failed", { pluginId: b, type: u, error: P });
    }
    const l = v.headers["last-event-id"] || v.query.lastEventId || void 0, y = String(v.query.clientId || `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`);
    if (!i.register(b, u, y, _))
      return c(_, 409, "CONFLICT", "window and ui cannot coexist for the same plugin");
    q.register(b, y), _.setHeader("Content-Type", "text/event-stream"), _.setHeader("Cache-Control", "no-cache"), _.setHeader("Connection", "keep-alive"), _.setHeader("X-Accel-Buffering", "no"), _.setHeader("x-overlay-client-id", y);
    try {
      _.flushHeaders?.();
    } catch (P) {
      n.warn("sse_flush_failed", { pluginId: b, type: u, clientId: y, error: P });
    }
    try {
      _.write(`:

`);
    } catch (P) {
      n.warn("sse_preamble_failed", { pluginId: b, type: u, clientId: y, error: P });
    }
    const E = `plugin:${b}:overlay`, p = "renderer:readonly-store";
    if (E)
      try {
        se.getInstance().markReady(E);
      } catch (P) {
        n.warn("sse_mark_ready_failed", { pluginId: b, type: u, channel: E, error: P });
      }
    const A = Ie.getInstance();
    let T, k, D;
    const N = (P, L) => {
      if (!L) return;
      const O = L?.payload, U = [O?.room_id, O?.roomId, L?.room_id, L?.roomId].find((j) => j != null && String(j).trim().length > 0);
      if (U !== void 0)
        return String(U);
    }, H = (P) => {
      try {
        k?.();
      } catch {
      }
      try {
        D?.();
      } catch {
      }
      try {
        clearInterval(T);
      } catch {
      }
      try {
        _.end();
      } catch {
      }
      try {
        A.overlayClientDisconnected(b, y);
      } catch {
      }
      try {
        q.unregister(b, y);
      } catch {
      }
      try {
        i.unregister(b, u, y);
      } catch {
      }
      n.warn("sse_cleanup", { pluginId: b, type: u, clientId: y, reason: P });
    }, B = (P, L = !1) => {
      const O = String(P.kind || "unknown").toLowerCase();
      if (_.writableEnded || _.writableFinished || _.destroyed)
        return H("response_closed"), !1;
      if (!L && !(u !== "overlay" && O === "renderer" ? !0 : q.shouldDeliver(b, y, {
        kind: O,
        roomId: P.roomId,
        event: P.event,
        payload: P.payload
      })))
        return !1;
      if (_.writableNeedDrain) {
        const F = i.recordDrop(b, u, y);
        return n.warn("sse_backpressure_drop", { pluginId: b, type: u, clientId: y, channel: E, event: O, meta: { drops: F } }), F > a && (n.error("sse_backpressure_close", { pluginId: b, type: u, clientId: y, channel: E, event: O, meta: { drops: F } }), H("backpressure")), !1;
      }
      try {
        P?.id && _.write(`id: ${P.id}
`);
        try {
          fetch("http://127.0.0.1:7242/ingest/52fa37f8-b908-44d5-87d2-c8f2861a8c286", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: "debug-session",
              runId: "settings-subscribe",
              hypothesisId: "D",
              location: "packages/main/src/server/routes/sse.ts:201",
              message: "safeWrite sending event",
              data: { pluginId: b, type: u, clientId: y, eventKind: O, payloadSummary: P && P.payload ? Object.keys(P.payload || {}).slice(0, 5) : null },
              timestamp: Date.now()
            })
          }).catch(() => {
          });
        } catch {
        }
        return _.write(`event: ${O}
`), _.write(`data: ${JSON.stringify(P)}

`), i.resetDrop(b, u, y), i.markActivity(b, u, y), !0;
      } catch (F) {
        return n.error("sse_send_failed", { pluginId: b, type: u, clientId: y, channel: E, event: O, error: F }), H("send_failed"), !1;
      }
    }, W = (P, L = !1) => B(P, L);
    W({ ts: Date.now(), pluginId: b, kind: "client", payload: { clientId: y } }, !0);
    const V = (P) => {
      try {
        const L = String(P?.meta && P.meta.kind || "unknown").toLowerCase(), O = P?.payload, F = O?.senderClientId;
        if (F && String(F) === String(y))
          return;
        const U = typeof O?.event == "string" ? O.event : void 0, j = typeof O?.overlayId == "string" ? O.overlayId : void 0, z = N(L, O);
        let M;
        L === "renderer" && O && typeof O == "object" ? M = O.payload : M = O && Object.prototype.hasOwnProperty.call(O, "payload") ? O.payload : O?.payload || O, W({
          id: typeof P?.id == "string" ? P.id : void 0,
          ts: typeof P?.createdAt == "number" ? P.createdAt : Date.now(),
          pluginId: b,
          kind: L,
          event: U,
          overlayId: j,
          roomId: z,
          payload: M,
          meta: P?.meta
        });
      } catch (L) {
        n.error("[ApiServer] SSE(plugin overlay) send failed:", { pluginId: b, type: u, clientId: y, error: L });
      }
    }, X = (P) => {
      try {
        const L = P && P.payload || P, O = L && L.payload ? { ...L.payload || {} } : {}, F = q.filterStorePayload(b, y, O);
        if (!F) return;
        W({
          id: typeof P?.id == "string" ? P.id : void 0,
          ts: typeof P?.createdAt == "number" ? P.createdAt : Date.now(),
          pluginId: b,
          kind: "store",
          payload: F,
          meta: { kind: "store" }
        });
      } catch (L) {
        n.error("store_bridge_send_failed", { pluginId: b, type: u, clientId: y, error: L });
      }
    }, Y = () => {
      try {
        const P = q.get(b, y);
        if (!P || P.storeKeys.size === 0) return;
        const L = t.getRecent(p) || [], O = {};
        for (const U of L) {
          const j = U && (U.payload ?? U), z = j && (j.payload ?? j);
          if (!(!z || typeof z != "object" || Array.isArray(z)))
            for (const M of Object.keys(z)) {
              const J = z[M];
              J !== void 0 && (O[M] = J);
            }
        }
        "plugin" in O && delete O.plugin;
        const F = q.filterStorePayload(b, y, O);
        if (!F) return;
        W({
          ts: Date.now(),
          pluginId: b,
          kind: "store",
          payload: F,
          meta: { kind: "store" }
        });
      } catch (P) {
        n.warn("store_snapshot_send_failed", { pluginId: b, type: u, clientId: y, error: P });
      }
    };
    try {
      const P = s.getAllOverlays().filter((O) => O.pluginId === b);
      let L = P;
      try {
        const F = new (require("../../config/ConfigManager")).ConfigManager().get(`plugins.${b}.config`, {}) || {}, U = typeof F.uiBgColor == "string" ? F.uiBgColor : void 0;
        U && (L = P.map((j) => j?.style?.backgroundColor ? j : { ...j, style: { ...j.style || {}, backgroundColor: U } }));
      } catch {
      }
      W({
        ts: Date.now(),
        pluginId: b,
        kind: "init",
        payload: { overlays: L }
      }, !0);
    } catch {
    }
    if (u === "overlay") {
      try {
        let P = t.getRecent(E, l).filter((L) => {
          const O = String(L?.meta?.kind ?? "unknown").toLowerCase(), F = L?.payload, U = N(O, F);
          return q.shouldDeliver(b, y, {
            kind: O,
            roomId: U,
            event: typeof F?.event == "string" ? F.event : void 0,
            payload: F && (F.payload ?? F)
          });
        });
        if (!l) {
          const L = [], O = /* @__PURE__ */ new Set();
          for (let F = P.length - 1; F >= 0; F--) {
            const U = String(P[F]?.meta?.kind ?? "unknown").toLowerCase();
            O.has(U) || (O.add(U), L.push(P[F]));
          }
          P = L.reverse();
        }
        for (const L of P) V(L);
      } catch (P) {
        n.warn("replay_recent_failed", { pluginId: b, type: u, clientId: y, error: P });
      }
      Y(), k = t.subscribe(E, V, void 0), D = t.subscribe(p, X, void 0);
    } else {
      try {
        let P = (t.getRecent(E, l) || []).filter((L) => {
          const O = String(L?.meta?.kind ?? "unknown").toLowerCase(), F = L?.payload, U = N(O, F);
          return q.shouldDeliver(b, y, {
            kind: O,
            roomId: U,
            event: typeof F?.event == "string" ? F.event : void 0,
            payload: F && (F.payload ?? F)
          });
        });
        if (!l) {
          const L = [], O = /* @__PURE__ */ new Set();
          for (let F = P.length - 1; F >= 0; F--) {
            const U = P[F], j = String(U?.meta?.kind ?? "unknown").toLowerCase(), z = U?.payload?.event || U?.payload?.payload?.event, M = z ? `${j}:${z}` : j;
            O.has(M) || (O.add(M), L.push(U));
          }
          P = L.reverse();
        }
        for (const L of P) V(L);
      } catch (P) {
        n.warn("replay_renderer_failed", { pluginId: b, type: u, clientId: y, error: P });
      }
      k = t.subscribe(E, V, void 0), D = t.subscribe(p, X, void 0);
    }
    try {
      A.overlayClientConnected(b, y);
    } catch {
    }
    T = setInterval(() => {
      const P = Date.now();
      W({
        ts: P,
        pluginId: b,
        kind: "heartbeat",
        payload: { ts: P }
      }, !0), i.markHeartbeat(b, u, y);
      try {
        A.overlayClientHeartbeat(b, y);
      } catch {
      }
    }, Ge), v.on("close", () => H("client_close"));
  });
  const d = (v) => {
    try {
      const b = (v?.overlayId ? s.getOverlay(v.overlayId) : void 0)?.pluginId || "unknown", h = `plugin:${b}:overlay`;
      try {
        t.hasSubscribers(h) && n.info("publish_overlay_message", { pluginId: b, channel: h, meta: { overlayId: v?.overlayId, event: v?.event } });
      } catch (u) {
        n.warn("publish_overlay_message_detect_failed", { pluginId: b, channel: h, error: u });
      }
      try {
        se.getInstance().queueOrPublish(h, v, { ttlMs: 300 * 1e3, persist: !0, meta: { kind: "uiMessage" } });
      } catch (u) {
        n.warn("publish_overlay_message_failed", { pluginId: b, channel: h, error: u });
      }
    } catch (_) {
      n.error("publish_overlay_message_failed", { error: _ });
    }
  }, f = (v) => {
    try {
      if (!v || !v.id) return;
      const _ = v?.pluginId || "unknown", b = `plugin:${_}:overlay`;
      try {
        t.hasSubscribers(b) && n.info("publish_overlay_updated", { pluginId: _, channel: b, meta: { overlayId: v?.id } });
      } catch (h) {
        n.warn("publish_overlay_updated_detect_failed", { pluginId: _, channel: b, error: h });
      }
      try {
        se.getInstance().queueOrPublish(b, { overlayId: v.id, event: "overlay-updated", payload: v }, { ttlMs: 300 * 1e3, persist: !0, meta: { kind: "update" } });
      } catch (h) {
        n.warn("publish_overlay_updated_failed", { pluginId: _, channel: b, error: h });
      }
    } catch (_) {
      n.error("publish_overlay_updated_failed", { error: _ });
    }
  }, w = (v) => {
    try {
      const b = s.getOverlay(v)?.pluginId || "unknown", h = `plugin:${b}:overlay`;
      try {
        t.hasSubscribers(h) && n.info("publish_overlay_closed", { pluginId: b, channel: h, meta: { overlayId: v } });
      } catch (u) {
        n.warn("publish_overlay_closed_detect_failed", { pluginId: b, channel: h, error: u });
      }
      try {
        se.getInstance().queueOrPublish(h, { overlayId: v, event: "overlay-closed" }, { ttlMs: 60 * 1e3, persist: !0, meta: { kind: "closed" } });
      } catch (u) {
        n.warn("publish_overlay_closed_failed", { pluginId: b, channel: h, error: u });
      }
    } catch (_) {
      n.error("publish_overlay_closed_failed", { error: _ });
    }
  };
  s.on("overlay-message", d), s.on("overlay-updated", f), s.on("overlay-closed", w), g.post(
    "/api/plugins/:pluginId/overlay/messages",
    async (v, _) => {
      const b = String(v.params.pluginId || "").trim(), { overlayId: h, payload: u } = v.body || {}, l = String(v.headers["x-client-id"] || "").trim(), y = String(v.headers["x-plugin-type"] || "").trim().toLowerCase();
      if (!b)
        return c(_, 400, "MISSING_PLUGIN_ID", "pluginId is required");
      if (y === "overlay")
        return c(_, 403, "OVERLAY_CANNOT_SEND_MESSAGES", "overlay cannot send overlay messages");
      if (y !== "window" && y !== "ui" && y !== "main")
        return c(_, 403, "INVALID_SENDER_TYPE", "sender type must be window/ui/main");
      const E = pe.getInstance();
      if (!E.hasConnections(b, "overlay"))
        return c(_, 404, "NO_OVERLAY_CONNECTION", "overlay is not connected");
      if (l && !E.getConnection(b, y, l))
        return c(_, 403, "SENDER_NOT_CONNECTED", "sender clientId/type not connected", {
          pluginId: b,
          senderClientId: l,
          senderType: y
        });
      try {
        const p = y === "main" ? "mainMessage" : "uiMessage";
        if (!q.hasSubscription(b, p))
          return _.json({ success: !0, sent: 0, message: "NO_SUBSCRIPTIONS" });
        const T = {
          ts: Date.now(),
          pluginId: b,
          kind: p,
          overlayId: h ? String(h).trim() : void 0,
          payload: u
        }, k = `plugin:${b}:overlay`;
        try {
          se.getInstance().queueOrPublish(k, { ...T, senderClientId: l }, {
            ttlMs: 300 * 1e3,
            persist: !0,
            meta: { kind: p, senderClientId: l, overlayId: T.overlayId }
          });
        } catch (D) {
          return n.error("overlay_queue_failed", { pluginId: b, channel: k, error: D }), c(_, 500, "QUEUE_FAILED", "failed to enqueue overlay message");
        }
        return _.json({ success: !0, sent: 1, channel: k });
      } catch (p) {
        return n.error("overlay_message_failed", { pluginId: b, error: p }), c(_, 500, "SEND_FAILED", p?.message || "send overlay message failed");
      }
    }
  );
}
function Cs({ app: g, dataManager: e }) {
  g.post("/api/renderer/readonly-store", async (t, s) => {
    try {
      const { type: r, payload: n } = t.body || {}, i = String(r || "").trim();
      if (!i || i !== "readonly-store-init" && i !== "readonly-store-update")
        return s.status(400).json({ success: !1, error: "INVALID_EVENT" });
      const a = e.publish("renderer:readonly-store", { event: i, payload: n }, { ttlMs: 600 * 1e3, persist: !0, meta: { kind: "readonly-store" } });
      return s.json({ success: !0, id: a.id });
    } catch (r) {
      return s.status(500).json({ success: !1, error: r?.message || "ENQUEUE_FAILED" });
    }
  }), g.get("/api/renderer/readonly-store/list", (t, s) => {
    try {
      const n = e.getRecent("renderer:readonly-store") || [], i = /* @__PURE__ */ new Set();
      for (const o of n) {
        const a = o && (o.payload ?? o), c = a && (a.payload ?? a);
        if (!(!c || typeof c != "object" || Array.isArray(c)))
          for (const d of Object.keys(c)) i.add(d);
      }
      return s.json({ success: !0, keys: Array.from(i) });
    } catch (r) {
      return s.status(500).json({ success: !1, error: r?.message || "LIST_FAILED" });
    }
  }), g.post("/api/renderer/readonly-store/snapshot", (t, s) => {
    try {
      const r = (t.body || {}).keys;
      if (!Array.isArray(r) || r.length === 0) return s.status(400).json({ success: !1, error: "INVALID_KEYS" });
      const n = r.includes("*"), i = new Set(r.map((d) => String(d))), a = e.getRecent("renderer:readonly-store") || [], c = {};
      for (const d of a) {
        const f = d && (d.payload ?? d), w = f && (f.payload ?? f);
        if (!(!w || typeof w != "object" || Array.isArray(w)))
          for (const v of Object.keys(w)) {
            if (!n && !i.has(v) || n && (v === "token" || v === "plugin")) continue;
            const _ = w[v];
            _ !== void 0 && (c[v] = _);
          }
      }
      try {
        "plugin" in c && delete c.plugin;
      } catch {
      }
      return s.json({ success: !0, data: c });
    } catch (r) {
      return s.status(500).json({ success: !1, error: r?.message || "SNAPSHOT_FAILED" });
    }
  }), g.get("/sse/renderer/readonly-store/subscribe", (t, s) => {
    s.setHeader("Content-Type", "text/event-stream"), s.setHeader("Cache-Control", "no-cache"), s.setHeader("Connection", "keep-alive"), s.setHeader("X-Accel-Buffering", "no");
    try {
      s.flushHeaders?.();
    } catch {
    }
    try {
      s.write(`:

`);
    } catch {
    }
    const r = String(t.query.keys || "").trim();
    if (!r) {
      try {
        s.write(`event: error
`), s.write(`data: {"error":"INVALID_KEYS"}

`);
      } catch {
      }
      try {
        s.end();
      } catch {
      }
      return;
    }
    const n = r.split(",").map((v) => v.trim()).filter(Boolean), i = n.includes("*"), o = new Set(n), a = "renderer:readonly-store", c = (v) => {
      try {
        v && typeof v.id == "string" && s.write(`id: ${v.id}
`);
        const _ = v?.meta && v.meta.kind || "readonly-store", b = v && v.payload || v, h = String(b && b.event || "readonly-store-update"), u = b && b.payload ? { ...b.payload || {} } : {};
        try {
          u && typeof u == "object" && "plugin" in u && delete u.plugin;
        } catch {
        }
        const l = {};
        for (const y of Object.keys(u))
          !i && !o.has(y) || i && (y === "token" || y === "plugin") || (l[y] = u[y]);
        if (Object.keys(l).length === 0) return;
        s.write(`event: ${h}
`), s.write(`data: ${JSON.stringify(l)}

`);
      } catch (_) {
        console.warn("[ApiServer] SSE(renderer store) send failed:", _);
      }
    };
    try {
      const v = e.getRecent(a) || [], _ = {};
      for (const b of v) {
        const h = b && (b.payload ?? b), u = h && (h.payload ?? h);
        if (!(!u || typeof u != "object" || Array.isArray(u)))
          for (const l of Object.keys(u)) {
            const y = u[l];
            y !== void 0 && (!i && !o.has(l) || i && (l === "token" || l === "plugin") || (_[l] = y));
          }
      }
      "plugin" in _ && delete _.plugin, Object.keys(_).length > 0 && (s.write(`event: readonly-store-init
`), s.write(`data: ${JSON.stringify(_)}

`));
    } catch {
    }
    const d = e.subscribe(a, c, void 0), f = setInterval(() => {
      try {
        s.write(`event: heartbeat
`), s.write(`data: {"ts": ${Date.now()}}

`);
      } catch {
      }
    }, Ge), w = () => {
      try {
        d();
      } catch {
      }
      try {
        clearInterval(f);
      } catch {
      }
      try {
        s.end();
      } catch {
      }
    };
    t.on("close", w);
  });
}
function Ds({ app: g, wsHub: e }) {
  g.get("/", (t, s) => {
    s.json({
      name: "ACFun Live Toolbox API Server",
      status: "running",
      version: "1.0.0",
      websocket_clients: e?.getClientCount() || 0,
      websocket_endpoint: `ws://127.0.0.1:${t.socket?.localPort || 1299}`
    });
  }), g.get("/test-overlay.html", (t, s) => {
    const r = I.join(process.cwd(), "test-overlay.html");
    S.existsSync(r) ? s.sendFile(r) : s.status(404).send("Test overlay page not found");
  });
}
function Ps(g) {
  Ds(g), ls(g), us(g), vs(g), ws(g), ds(g), hs(g), gs(g), ps(g), ks(g), Is(g), Cs(g), Ts(g);
}
class Rs {
  app;
  server = null;
  lastStartError;
  wsHub;
  config;
  queryService;
  csvExporter;
  diagnosticsService;
  overlayManager;
  consoleManager;
  acfunApiProxy;
  pluginRoutes = /* @__PURE__ */ new Map();
  pluginManager;
  dataManager;
  windowManager;
  pluginWindowManager;
  connections = /* @__PURE__ */ new Set();
  routesInitialized = !1;
  constructor(e = { port: 1299 }, t, s, r, n) {
    this.config = {
      host: "127.0.0.1",
      enableCors: !0,
      enableHelmet: !0,
      enableCompression: !0,
      enableLogging: process.env.NODE_ENV === "development",
      ...e
    }, this.app = ve(), this.wsHub = new is(), this.queryService = new os(t), this.csvExporter = new as(this.queryService), this.diagnosticsService = s, this.overlayManager = r, this.consoleManager = n, this.acfunApiProxy = new it(
      {},
      te.getInstance(),
      t
    ), this.dataManager = ie.getInstance(), this.configureMiddleware(), this.configureErrorHandling();
  }
  /**
   * 注入 PluginManager 引用，用于统一静态托管插件页面。
   */
  setPluginManager(e) {
    this.pluginManager = e;
    try {
      this.acfunApiProxy.setPluginManager(e);
    } catch {
    }
  }
  setWindowManagers(e, t) {
    this.windowManager = e, this.pluginWindowManager = t;
  }
  setPort(e) {
    this.config.port = e;
  }
  /**
   * 配置中间件
   */
  configureMiddleware() {
    if (this.config.enableHelmet && this.app.use(
      Lt({
        contentSecurityPolicy: !1,
        crossOriginEmbedderPolicy: !1,
        frameguard: !1,
        crossOriginResourcePolicy: { policy: "cross-origin" }
      })
    ), this.config.enableCors && this.app.use(
      Nt({
        origin: !0,
        // 允许所有来源，适用于本地开发
        credentials: !0
      })
    ), this.config.enableCompression) {
      const e = (t, s) => {
        try {
          const r = s.getHeader("Content-Type");
          if (typeof r == "string" && r.indexOf("text/event-stream") >= 0 || Array.isArray(r) && r.some((i) => String(i).indexOf("text/event-stream") >= 0))
            return !1;
          const n = t.headers.accept;
          if (typeof n == "string" && n.indexOf("text/event-stream") >= 0)
            return !1;
        } catch {
        }
        return ut.filter(t, s);
      };
      this.app.use(ut({ filter: e }));
    }
    if (this.config.enableLogging) {
      const e = ye();
      this.app.use(
        xt("combined", {
          skip: (t, s) => {
            if (process.env.ACFRAME_DEBUG_LOGS === "1") return !1;
            const r = t.originalUrl || t.url || "";
            return !!(r.startsWith("/api/renderer/readonly-store") || r.indexOf("/renderer/readonly-store") >= 0 || (s.statusCode || 0) < 400 || String(t.headers["user-agent"] || "").includes("ACLiveFrame"));
          },
          stream: {
            write: (t) => {
              try {
                e.addLog("http", String(t || "").trim(), "info");
              } catch {
              }
            }
          }
        })
      );
    }
    this.app.use(ve.json({ limit: "20mb" })), this.app.use(ve.urlencoded({ extended: !0, limit: "20mb" })), this.app.disable("etag");
  }
  /**
   * 配置路由
   */
  configureRoutes() {
    const e = {
      app: this.app,
      config: this.config,
      wsHub: this.wsHub,
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
      getPluginManager: () => this.pluginManager
    };
    Ps(e), this.app.use((t, s) => {
      s.status(404).json({ error: "Not Found", path: t.originalUrl });
    });
  }
  setRoomManager(e) {
    try {
      this.acfunApiProxy.setRoomManager(e);
    } catch {
    }
  }
  /**
   * 配置错误处理
   */
  configureErrorHandling() {
    this.app.use(
      (e, t, s, r) => {
        console.error("[ApiServer] Error:", e), s.status(e.status || 500).json({
          success: !1,
          error: e.message || "Internal Server Error",
          ...process.env.NODE_ENV === "development" && { stack: e.stack }
        });
      }
    );
  }
  /**
   * 获取 WebSocket Hub 实例
   */
  getWsHub() {
    return this.wsHub;
  }
  /**
   * 获取 Express 应用实例
   */
  getApp() {
    return this.app;
  }
  getLastError() {
    return this.lastStartError;
  }
  /**
   * 由 PluginManager/ApiBridge 调用，为插件注册 HTTP 路由。
   * 路由仅在 `/plugins/:id/*` 作用域下可达。
   */
  registerPluginRoute(e, t, s) {
    if (!/^[a-zA-Z0-9_]+$/.test(e))
      throw new Error("INVALID_PLUGIN_ID");
    if (!/^[\/a-zA-Z0-9_\-]*$/.test(t.path))
      throw new Error("INVALID_ROUTE_PATH");
    const r = this.pluginRoutes.get(e) || [];
    r.push({ method: t.method, path: t.path || "/", handler: s }), this.pluginRoutes.set(e, r), console.log(
      `[ApiServer] Registered plugin route: [${t.method}] /plugins/${e}${t.path}`
    );
  }
  /**
   * 启动服务器
   */
  start() {
    return new Promise((e, t) => {
      try {
        this.routesInitialized || (this.configureRoutes(), this.routesInitialized = !0), this.server = Ft(this.app), console.log(
          `[ApiServer] HTTP server created, starting listen on ${this.config.host}:${this.config.port}`
        );
        try {
          this.server.on("connection", (s) => {
            try {
              this.connections.add(s), s.on("close", () => {
                try {
                  this.connections.delete(s);
                } catch {
                }
              });
            } catch {
            }
          });
        } catch {
        }
        this.server.listen(this.config.port, this.config.host, () => {
          console.log(
            `[ApiServer] HTTP server running at http://${this.config.host}:${this.config.port}`
          );
          try {
            this.wsHub.initialize(this.server), console.log("[ApiServer] WebSocket server started");
          } catch (s) {
            console.error("[ApiServer] WebSocket initialization failed:", s);
          }
          this.lastStartError = void 0, e();
        }), this.server.on("error", (s) => {
          console.error("[ApiServer] Server error:", s);
          try {
            this.lastStartError = String(s?.message || s);
          } catch {
          }
          t(s);
        });
      } catch (s) {
        console.error("[ApiServer] Start failed:", s);
        try {
          this.lastStartError = String(s?.message || s);
        } catch {
        }
        t(s);
      }
    });
  }
  /**
   * 停止服务器
   */
  stop() {
    return new Promise((e) => {
      if (console.log("[ApiServer] Shutting down server..."), this.wsHub.close(), this.server) {
        try {
          for (const r of Array.from(this.connections))
            try {
              r.destroy();
            } catch {
            }
          this.connections.clear();
        } catch {
        }
        let t = !1;
        const s = setTimeout(() => {
          if (!t) {
            t = !0;
            try {
              console.warn("[ApiServer] Server close timed out; proceeding");
            } catch {
            }
            try {
              this.server = null;
            } catch {
            }
            e();
          }
        }, 3e3);
        this.server.close(() => {
          if (!t) {
            t = !0;
            try {
              clearTimeout(s);
            } catch {
            }
            console.log("[ApiServer] Server closed"), this.server = null, e();
          }
        });
      } else
        e();
    });
  }
  /**
   * 获取服务器状态
   */
  isRunning() {
    return this.server !== null && this.server.listening;
  }
}
class Ms extends ce {
  constructor(e = {}) {
    super(), this.config = e, this.maxHistorySize = e.maxHistorySize || 100;
  }
  isRunning = !1;
  monitoringInterval = null;
  metricsHistory = [];
  maxHistorySize = 100;
  lastCpuUsage = null;
  startTime = /* @__PURE__ */ new Date();
  requestCount = 0;
  errorCount = 0;
  /**
   * 启动性能监控
   */
  start() {
    if (this.isRunning) {
      console.log("[PerformanceMonitor] Already running");
      return;
    }
    this.isRunning = !0, this.startTime = /* @__PURE__ */ new Date();
    const e = this.config.interval || 3e4;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, e), this.config.enableConnectionPoolMonitoring !== !1 && Pe.startPerformanceMonitoring((t) => {
      this.emit("connectionPoolMetrics", t);
    }), console.log(`[PerformanceMonitor] Started with ${e}ms interval`), this.emit("started");
  }
  /**
   * 停止性能监控
   */
  stop() {
    this.isRunning && (this.isRunning = !1, this.monitoringInterval && (clearInterval(this.monitoringInterval), this.monitoringInterval = null), console.log("[PerformanceMonitor] Stopped"), this.emit("stopped"));
  }
  /**
   * 收集性能指标
   */
  collectMetrics() {
    try {
      const e = Pe.getPerformanceMetrics(), t = {
        timestamp: /* @__PURE__ */ new Date(),
        connectionPool: {
          totalConnections: e.connectionPool.totalConnections,
          activeConnections: e.connectionPool.activeConnections,
          idleConnections: e.connectionPool.idleConnections,
          failedConnections: e.connectionPool.failedRequests,
          averageResponseTime: e.connectionPool.averageResponseTime,
          errorRate: e.performance.errorRate,
          circuitBreakerOpen: e.performance.circuitBreakerStatus.isOpen
        },
        system: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: this.getCpuUsage()
        },
        application: {
          uptime: Date.now() - this.startTime.getTime(),
          requestCount: this.requestCount,
          errorCount: this.errorCount
        }
      };
      this.metricsHistory.push(t), this.metricsHistory.length > this.maxHistorySize && this.metricsHistory.shift(), this.emit("metrics", t), this.checkAlerts(t);
    } catch (e) {
      console.error("[PerformanceMonitor] Error collecting metrics:", e), this.emit("error", e);
    }
  }
  /**
   * 获取CPU使用率
   */
  getCpuUsage() {
    try {
      const e = process.cpuUsage(this.lastCpuUsage || void 0);
      return this.lastCpuUsage = process.cpuUsage(), e;
    } catch (e) {
      return console.error("[PerformanceMonitor] Error getting CPU usage:", e), null;
    }
  }
  /**
   * 检查告警条件
   */
  checkAlerts(e) {
    const t = e.system.memoryUsage.heapUsed / 1024 / 1024;
    t > 500 && this.emit("alert", {
      type: "high_memory_usage",
      message: `High memory usage: ${t.toFixed(2)}MB`,
      metrics: e
    }), e.connectionPool.errorRate > 0.1 && this.emit("alert", {
      type: "high_error_rate",
      message: `High connection pool error rate: ${(e.connectionPool.errorRate * 100).toFixed(2)}%`,
      metrics: e
    }), e.connectionPool.circuitBreakerOpen && this.emit("alert", {
      type: "circuit_breaker_open",
      message: "Connection pool circuit breaker is open",
      metrics: e
    }), e.connectionPool.averageResponseTime > 5e3 && this.emit("alert", {
      type: "slow_response",
      message: `Slow average response time: ${e.connectionPool.averageResponseTime}ms`,
      metrics: e
    });
  }
  /**
   * 增加请求计数
   */
  incrementRequestCount() {
    this.requestCount++;
  }
  /**
   * 增加错误计数
   */
  incrementErrorCount() {
    this.errorCount++;
  }
  /**
   * 获取最新的性能指标
   */
  getLatestMetrics() {
    return this.metricsHistory.length > 0 ? this.metricsHistory[this.metricsHistory.length - 1] : null;
  }
  /**
   * 获取性能指标历史
   */
  getMetricsHistory(e) {
    return e && e < this.metricsHistory.length ? this.metricsHistory.slice(-e) : [...this.metricsHistory];
  }
  /**
   * 获取性能摘要
   */
  getPerformanceSummary() {
    const e = this.getLatestMetrics(), t = this.getMetricsHistory(), s = t.length > 0 ? t.reduce((i, o) => i + o.system.memoryUsage.heapUsed, 0) / t.length / 1024 / 1024 : 0, r = t.length > 0 ? t.reduce((i, o) => i + o.connectionPool.averageResponseTime, 0) / t.length : 0;
    let n = "unknown";
    return e && (e.connectionPool.circuitBreakerOpen ? n = "critical" : e.connectionPool.errorRate > 0.05 ? n = "warning" : n = "healthy"), {
      uptime: e ? e.application.uptime : 0,
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      averageMemoryUsage: s,
      averageResponseTime: r,
      connectionPoolHealth: n
    };
  }
  /**
   * 重置统计信息
   */
  reset() {
    this.metricsHistory = [], this.requestCount = 0, this.errorCount = 0, this.startTime = /* @__PURE__ */ new Date(), this.lastCpuUsage = null, console.log("[PerformanceMonitor] Statistics reset");
  }
  /**
   * 获取运行状态
   */
  isMonitoring() {
    return this.isRunning;
  }
}
const de = new Ms({
  interval: 3e4,
  // 30秒
  maxHistorySize: 100,
  enableConnectionPoolMonitoring: !0
}), Ns = {
  debug: !1,
  logLevel: "info",
  timeout: 3e4,
  apiConfig: {
    timeout: 3e4,
    retryCount: 3,
    // 使用API内置重试配置
    baseUrl: "https://api-new.acfunchina.com",
    headers: {
      "User-Agent": "AcFun-Live-Toolbox/2.0"
    }
  }
};
class Ls {
  pooledConnection = null;
  config;
  logCallback = null;
  logManager;
  isInitialized = !1;
  tokenManager;
  constructor(e = {}, t) {
    this.config = this.validateAndMergeConfig(e), this.logManager = ye(), this.tokenManager = t || te.getInstance();
  }
  /**
   * 验证和合并配置，确保符合acfunlive-http-api规范
   */
  validateAndMergeConfig(e) {
    const t = { ...Ns, ...e };
    return t.apiConfig && (t.apiConfig.timeout && (t.apiConfig.timeout < 1e3 || t.apiConfig.timeout > 12e4) && (this.log("Invalid timeout value, using default 30000ms", "error"), t.apiConfig.timeout = 3e4), t.apiConfig.retryCount && (t.apiConfig.retryCount < 0 || t.apiConfig.retryCount > 10) && (this.log("Invalid retryCount value, using default 3", "error"), t.apiConfig.retryCount = 3)), t;
  }
  // 设置日志回调函数
  setLogCallback(e) {
    this.logCallback = e;
  }
  // 获取当前状态
  getStatus() {
    return {
      running: this.isInitialized,
      initialized: this.isInitialized
    };
  }
  // 获取当前配置
  getConfig() {
    return { ...this.config };
  }
  // 更新配置
  updateConfig(e) {
    this.config = { ...this.config, ...e }, this.pooledConnection && (Pe.release(this.pooledConnection.id), this.pooledConnection = null), this.log("Configuration updated", "info");
  }
  // 初始化模块
  async initialize() {
    try {
      this.log("Initializing AcfunDanmuModule...", "info"), de.start(), de.on("alert", (e) => {
        this.log(`Performance alert: ${e.type} - ${e.message}`, "error");
      }), de.on("error", (e) => {
        this.log(`Performance monitor error: ${e instanceof Error ? e.message : String(e)}`, "error");
      }), this.isInitialized = !0, this.log("AcfunDanmuModule initialized successfully", "info");
    } catch (e) {
      throw this.log(`Failed to initialize AcfunDanmuModule: ${e instanceof Error ? e.message : String(e)}`, "error"), e;
    }
  }
  // 销毁模块
  async destroy() {
    try {
      this.log("Destroying AcfunDanmuModule...", "info"), de.stop(), this.pooledConnection && (Pe.destroy(this.pooledConnection.id), this.pooledConnection = null), this.isInitialized = !1, this.log("AcfunDanmuModule destroyed successfully", "info");
    } catch (e) {
      this.log(`Error destroying AcfunDanmuModule: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  }
  // 实现AppModule接口
  async enable({ app: e }) {
    this.setLogCallback((t, s) => {
      this.logManager.addLog("acfunDanmu", t, s);
    }), e.on("ready", () => {
      setTimeout(() => {
        this.initialize().catch((t) => {
          this.log(`Failed to initialize on app ready: ${t instanceof Error ? t.message : String(t)}`, "error");
        });
      }, 1e3);
    }), e.on("will-quit", () => {
      this.destroy().catch((t) => {
        console.error("Error destroying AcfunDanmuModule on quit:", t);
      });
    });
  }
  // 房管相关方法
  async getManagerList(e, t = 1, s = 20) {
    return this.callApiMethod(async (r) => r.manager.getManagerList(), "getManagerList");
  }
  async addManager(e, t) {
    return this.callApiMethod(async (s) => s.manager.addManager(t), "addManager");
  }
  async removeManager(e, t) {
    return this.callApiMethod(async (s) => s.manager.deleteManager(t), "removeManager");
  }
  async getKickRecord(e, t = 1, s = 20) {
    throw new Error("getKickRecord requires liveId parameter - use getAuthorKickRecords instead");
  }
  async managerKickUser(e, t, s = "", r = 3600) {
    throw new Error("managerKickUser requires liveId parameter - use managerKick instead");
  }
  async authorKickUser(e, t, s = "", r = 3600) {
    throw new Error("authorKickUser requires liveId parameter - use authorKick instead");
  }
  // 勋章相关方法
  async getMedalDetail(e, t) {
    return this.callApiMethod(async (s) => s.badge.getBadgeDetail(e), "getMedalDetail");
  }
  async getMedalList(e) {
    return this.callApiMethod(async (t) => t.badge.getBadgeList(), "getMedalList");
  }
  async getMedalRank(e, t, s = 1) {
    return this.callApiMethod(async (r) => r.badge.getBadgeRank(e), "getMedalRank");
  }
  async getUserWearingMedal(e) {
    return this.callApiMethod(async (t) => t.badge.getWornBadge(e), "getUserWearingMedal");
  }
  async wearMedal(e, t) {
    return this.callApiMethod(async (s) => s.badge.wearBadge(e), "wearMedal");
  }
  async unwearMedal(e) {
    return this.callApiMethod(async (t) => t.badge.unwearBadge(), "unwearMedal");
  }
  async loginWithQRCode() {
    return this.callApiMethod(async (e) => e.auth.qrLogin(), "loginWithQRCode");
  }
  async checkQRLoginStatus() {
    return this.callApiMethod(async (e) => e.auth.checkQrLoginStatus(), "checkQRLoginStatus");
  }
  // 观看列表相关方法
  async getWatchingList(e) {
    return this.callApiMethod(async (t) => t.live.getWatchingList(e.toString()), "getWatchingList");
  }
  // 榜单相关方法 - 暂时移除，因为 API 中不存在此方法
  // async getBillboard(): Promise<any> {
  //   return this.callApiMethod(async (api) => {
  //     return api.live.getBillboard();
  //   }, 'getBillboard');
  // }
  // 摘要相关方法
  async getSummary(e) {
    return this.callApiMethod(async (t) => t.live.getSummary(e), "getSummary");
  }
  // 幸运列表相关方法 - 暂时移除，因为 API 中不存在此方法
  // async getLuckList(): Promise<any> {
  //   return this.callApiMethod(async (api) => {
  //     return api.live.getLuckList();
  //   }, 'getLuckList');
  // }
  // 回放相关方法
  async getPlayback(e) {
    return this.callApiMethod(async (t) => t.replay.getLiveReplay(e), "getPlayback");
  }
  // 礼物相关方法
  async getAllGiftList() {
    return this.callApiMethod(async (e) => e.gift.getAllGiftList(), "getAllGiftList");
  }
  async getGiftList(e) {
    return this.callApiMethod(async (t) => t.gift.getLiveGiftList(e), "getGiftList");
  }
  // 钱包相关方法 - 暂时移除，因为 API 中不存在此方法
  // async getWalletBalance(): Promise<any> {
  //   return this.callApiMethod(async (api) => {
  //     return api.live.getWalletBalance();
  //   }, 'getWalletBalance');
  // }
  // 用户直播信息相关方法
  async getUserLiveInfo(e) {
    return this.callApiMethod(async (t) => t.live.getUserLiveInfo(e), "getUserLiveInfo");
  }
  // 直播列表相关方法
  async getAllLiveList() {
    return this.callApiMethod(async (e) => e.live.getLiveList(), "getAllLiveList");
  }
  // 获取直播列表（支持分类筛选）
  async getChannelList(e) {
    return this.callApiMethod(async (t) => t.live.getChannelList(e), "getChannelList");
  }
  // 直播数据相关方法
  async getLiveData(e = 7) {
    return this.callApiMethod(async (t) => t.live.getLiveStatisticsByDays(e), "getLiveData");
  }
  // 用户信息相关方法
  async getUserInfo(e) {
    return this.callApiMethod(async (t) => t.user.getUserInfo(e.toString()), "getUserInfo");
  }
  // 图片上传相关方法 - 暂时移除，因为 ImageService 不在 AcFunLiveApi 中
  // async uploadImage(imagePath: string): Promise<any> {
  //   return this.callApiMethod(async (api) => {
  //     return api.image.uploadImage(imagePath);
  //   }, 'uploadImage');
  // }
  // 日程相关方法 - 暂时移除，因为 API 中不存在此方法
  // async getScheduleList(): Promise<any> {
  //   return this.callApiMethod(async (api) => {
  //     return api.live.getScheduleList();
  //   }, 'getScheduleList');
  // }
  // 弹幕发送方法
  async sendDanmu(e, t) {
    try {
      const s = await this.callApiMethod(async (r) => r.danmu.sendDanmu(e.toString(), t), "sendDanmu");
      return {
        success: !0,
        message: "Danmu sent successfully"
      };
    } catch (s) {
      return {
        success: !1,
        message: s instanceof Error ? s.message : "Unknown error occurred"
      };
    }
  }
  // 获取直播状态 - 使用 getUserLiveInfo 替代
  async getLiveStatus(e) {
    const t = await this.callApiMethod(async (s) => s.live.getUserLiveInfo(e), "getLiveStatus");
    return {
      liveId: t.data?.profile?.userID || e,
      status: t.data?.liveID ? "online" : "offline",
      title: t.data?.title,
      viewerCount: t.data?.onlineCount,
      startTime: t.data?.liveStartTime ? new Date(t.data.liveStartTime) : void 0
    };
  }
  // 转码信息相关方法 - 需要 streamName 参数
  async getTranscodeInfo(e = "default") {
    return this.callApiMethod(async (t) => t.live.getTranscodeInfo(e), "getTranscodeInfo");
  }
  // 开始直播 - 使用 startLiveStream 替代
  async startLive(e, t, s) {
    return this.callApiMethod(async (r) => r.live.startLiveStream(t, s, "stream", !1, !1, e, 0), "startLive");
  }
  // 停止直播 - 使用 stopLiveStream 替代
  async stopLive(e) {
    return this.callApiMethod(async (t) => t.live.stopLiveStream(e), "stopLive");
  }
  async updateLiveInfo(e, t) {
    return this.callApiMethod(async (s) => s.live.updateLiveRoom(e, t, ""), "updateLiveInfo");
  }
  // 剪辑权限相关方法
  async checkCanCut(e) {
    return this.callApiMethod(async (t) => t.live.checkLiveClipPermission(), "checkCanCut");
  }
  async setCanCut(e, t) {
    return this.callApiMethod(async (s) => s.live.setLiveClipPermission(t), "setCanCut");
  }
  // 获取API实例（用于其他模块直接访问）
  async getApiInstance() {
    return this.pooledConnection || (this.pooledConnection = await Pe.acquire("auth")), this.pooledConnection.api;
  }
  // 性能监控相关方法
  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return de.getLatestMetrics();
  }
  /**
   * 获取性能摘要
   */
  getPerformanceSummary() {
    return de.getPerformanceSummary();
  }
  /**
   * 获取性能指标历史
   */
  getPerformanceHistory(e) {
    return de.getMetricsHistory(e);
  }
  /**
   * 重置性能统计
   */
  resetPerformanceStats() {
    de.reset();
  }
  /**
   * 检查性能监控状态
   */
  isPerformanceMonitoringActive() {
    return de.isMonitoring();
  }
  // 私有方法：统一的API调用包装器
  async callApiMethod(e, t) {
    de.incrementRequestCount();
    try {
      if (!this.isInitialized)
        throw new Error("AcfunDanmuModule is not initialized");
      this.pooledConnection || (this.pooledConnection = await Pe.acquire("live")), await this.ensureAuthentication(), this.log(`Calling API method: ${t}`, "debug");
      const s = await e(this.pooledConnection.api);
      return this.log(`API method ${t} completed successfully`, "debug"), s;
    } catch (s) {
      de.incrementErrorCount();
      const r = `API method ${t} failed: ${s instanceof Error ? s.message : String(s)}`;
      throw this.log(r, "error"), s;
    }
  }
  /**
   * 确保API连接已通过身份验证
   */
  async ensureAuthentication() {
    if (!this.pooledConnection)
      throw new Error("No pooled connection available");
    try {
      if (this.tokenManager.isAuthenticated())
        this.log("Authentication already established", "debug"), await this.tokenManager.isTokenExpiringSoon() && this.log("Token expiring soon; acfunlive-http-api requires manual re-login.", "info");
      else {
        this.log("No authentication found, attempting to load persisted token...", "info");
        const t = await this.tokenManager.getTokenInfo(), s = await this.tokenManager.validateToken(t ?? void 0);
        s.isValid ? this.log("Authentication restored via TokenManager", "info") : (t && (this.log(`Invalid token: ${s.reason || "Unknown reason"}. Clearing token.`, "info"), await this.tokenManager.logout()), this.log("No valid authentication token available, continuing with anonymous access", "info"));
      }
    } catch (e) {
      this.log(`Authentication check failed: ${e instanceof Error ? e.message : String(e)}`, "error");
    }
  }
  /**
   * 获取 TokenManager 实例
   */
  getTokenManager() {
    return this.tokenManager;
  }
  // 私有方法：日志记录
  log(e, t) {
    (this.config.logLevel === "debug" || t !== "debug") && (this.logCallback ? this.logCallback(e, t === "debug" ? "info" : t) : console.log(`[AcfunDanmuModule] ${e}`));
  }
}
let et = null;
function xs(g) {
  return et || (et = new Ls({}, g)), et;
}
const Ce = xs();
class Os extends ce {
  hooks = /* @__PURE__ */ new Map();
  executionHistory = /* @__PURE__ */ new Map();
  constructor() {
    super(), this.initializeDefaultHooks();
  }
  /**
   * 初始化默认钩子
   */
  initializeDefaultHooks() {
    [
      "afterLoaded",
      "beforeUnloaded",
      "onError",
      "onRecover"
    ].forEach((t) => {
      this.hooks.set(t, []);
    });
  }
  /**
   * 注册生命周期钩子
   */
  registerHook(e, t, s = {}) {
    const r = {
      id: s.id || `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hook: e,
      handler: t,
      priority: s.priority || 0,
      pluginId: s.pluginId,
      useSandbox: s.useSandbox ?? !!s.pluginId
    }, n = this.hooks.get(e) || [];
    return n.push(r), n.sort((i, o) => o.priority - i.priority), this.hooks.set(e, n), m.debug(`注册生命周期钩子: ${e} (ID: ${r.id})`), r.id;
  }
  /**
   * 取消注册生命周期钩子
   */
  unregisterHook(e) {
    let t = !1;
    for (const [s, r] of this.hooks.entries()) {
      const n = r.findIndex((i) => i.id === e);
      if (n !== -1) {
        r.splice(n, 1), this.hooks.set(s, r), t = !0, m.debug(`取消生命周期钩子: ${s} (ID: ${e})`);
        break;
      }
    }
    return t;
  }
  /**
   * 取消注册插件的所有钩子
   */
  unregisterPluginHooks(e) {
    let t = 0;
    for (const [s, r] of Array.from(this.hooks.entries())) {
      const n = r.length, i = r.filter((o) => o.pluginId !== e);
      this.hooks.set(s, i), t += n - i.length;
    }
    return t > 0 && m.debug(`取消注册插件 ${e} 的 ${t} 个生命周期钩子`), t;
  }
  /**
   * 执行生命周期钩子
   */
  async executeHook(e, t) {
    const s = {
      ...t,
      timestamp: Date.now()
    }, r = this.executionHistory.get(t.pluginId) || [];
    r.push(s), this.executionHistory.set(t.pluginId, r);
    const n = this.hooks.get(e) || [];
    m.debug(`执行生命周期钩子: ${e} (插件: ${t.pluginId}, 处理器数量: ${n.length})`), this.emit("hook.before", { hook: e, data: s });
    const i = [];
    for (const o of n)
      try {
        await o.handler(s), i.push({ id: o.id, success: !0 }), m.debug(`生命周期钩子执行成功: ${e} (ID: ${o.id})`);
      } catch (a) {
        const c = a instanceof Error ? a : new Error(String(a));
        i.push({ id: o.id, success: !1, error: c }), m.error(`生命周期钩子执行失败: ${e} (ID: ${o.id}) - ${c.message}`), this.emit("hook.error", { hook: e, hookId: o.id, data: s, error: c });
      }
    this.emit("hook.after", { hook: e, data: s, results: i });
  }
  /**
   * 获取插件的执行历史
   */
  getExecutionHistory(e) {
    return this.executionHistory.get(e) || [];
  }
  /**
   * 清理插件的执行历史
   */
  clearExecutionHistory(e) {
    this.executionHistory.delete(e);
  }
  /**
   * 获取已注册的钩子信息
   */
  getRegisteredHooks(e) {
    if (e)
      return [...this.hooks.get(e) || []];
    const t = [];
    for (const s of Array.from(this.hooks.values()))
      t.push(...s);
    return t;
  }
  /**
   * 获取钩子统计信息
   */
  getHookStats() {
    const e = {};
    for (const [t, s] of Array.from(this.hooks.entries()))
      e[t] = s.length;
    return e;
  }
  /**
   * 清理资源
   */
  cleanup() {
    this.hooks.clear(), this.executionHistory.clear(), this.removeAllListeners(), m.debug("插件生命周期管理器已清理");
  }
}
const ge = new Os();
class fe {
  listeners = {};
  on(e, t) {
    this.listeners[e] || (this.listeners[e] = []), this.listeners[e].push(t);
  }
  off(e, t) {
    this.listeners[e] && (this.listeners[e] = this.listeners[e].filter((s) => s !== t));
  }
  emit(e, t) {
    this.listeners[e] && this.listeners[e].forEach((s) => s(t));
  }
}
class Fs extends fe {
  config;
  memoryBlocks = /* @__PURE__ */ new Map();
  freeBlocks = /* @__PURE__ */ new Map();
  cleanupTimer;
  nextBlockId = 1;
  totalAllocatedBytes = 0;
  totalFreedBytes = 0;
  peakUsageBytes = 0;
  constructor(e = {}) {
    super(), this.config = {
      maxPoolSize: e.maxPoolSize || 64 * 1024 * 1024,
      defaultBlockSize: e.defaultBlockSize || 64 * 1024,
      minBlockSize: e.minBlockSize || 4 * 1024,
      maxBlockSize: e.maxBlockSize || 4 * 1024 * 1024,
      cleanupInterval: e.cleanupInterval || 3e4,
      memoryThreshold: e.memoryThreshold || 0.6
    }, this.startCleanupTimer(), m.info("MemoryPoolManager initialized", void 0, { config: this.config });
  }
  /**
   * 分配内存块
   */
  allocate(e, t) {
    if (e <= 0)
      throw new Error(`Invalid allocation size: ${e}. Size must be greater than 0.`);
    if (e < this.config.minBlockSize || e > this.config.maxBlockSize)
      return m.warn("Memory allocation size out of bounds", t, {
        size: e,
        minSize: this.config.minBlockSize,
        maxSize: this.config.maxBlockSize
      }), null;
    const s = this.getStats();
    if (s.usedSize + e > this.config.maxPoolSize * this.config.memoryThreshold) {
      this.emit("memory-threshold-exceeded", {
        usage: (s.usedSize + e) / this.config.maxPoolSize,
        threshold: this.config.memoryThreshold
      }), this.cleanup();
      const a = this.getStats();
      if (a.usedSize + e > this.config.maxPoolSize)
        return m.warn("Memory pool exhausted", t, {
          requestedSize: e,
          availableSize: this.config.maxPoolSize - a.usedSize
        }), null;
    }
    const r = this.findReusableBlock(e);
    if (r)
      return r.inUse = !0, r.lastUsed = Date.now(), r.pluginId = t, this.totalAllocatedBytes += r.size, this.updatePeakUsage(), this.emit("memory-allocated", {
        blockId: r.id,
        size: r.size,
        pluginId: t
      }), m.debug("Memory block reused", t, {
        blockId: r.id,
        size: r.size
      }), r.id;
    const n = `block_${this.nextBlockId++}`, i = Buffer.allocUnsafe(e), o = {
      id: n,
      buffer: i,
      size: e,
      inUse: !0,
      lastUsed: Date.now(),
      pluginId: t
    };
    return this.memoryBlocks.set(n, o), this.totalAllocatedBytes += e, this.updatePeakUsage(), this.emit("memory-allocated", { blockId: n, size: e, pluginId: t }), m.debug("New memory block allocated", t, { blockId: n, size: e }), n;
  }
  /**
   * 释放内存块
   */
  free(e, t) {
    const s = this.memoryBlocks.get(e);
    if (!s)
      return m.warn("Memory block not found", t, { blockId: e }), !1;
    if (!s.inUse)
      return m.warn("Attempting to free already freed memory block", t, { blockId: e }), !1;
    s.inUse = !1, s.lastUsed = Date.now(), s.pluginId = void 0, this.totalFreedBytes += s.size;
    const r = this.calculateFreeSize(), i = (this.freeBlocks.get(s.size) || /* @__PURE__ */ new Set()).size >= 10, o = r >= 32 * 1024 * 1024;
    return i || o ? this.memoryBlocks.delete(e) : (this.freeBlocks.has(s.size) || this.freeBlocks.set(s.size, /* @__PURE__ */ new Set()), this.freeBlocks.get(s.size).add(e)), this.emit("memory-freed", { blockId: e, size: s.size, pluginId: t }), m.debug("Memory block freed", t, { blockId: e, size: s.size }), !0;
  }
  /**
   * 获取内存块的Buffer对象
   */
  getBuffer(e) {
    const t = this.memoryBlocks.get(e);
    return !t || !t.inUse ? null : t.buffer;
  }
  /**
   * 更新峰值内存使用量
   */
  updatePeakUsage() {
    let e = 0;
    for (const t of this.memoryBlocks.values())
      t.inUse && (e += t.size);
    this.peakUsageBytes = Math.max(this.peakUsageBytes, e);
  }
  /**
   * 查找可重用的内存块
   */
  findReusableBlock(e) {
    const t = this.freeBlocks.get(e);
    if (t && t.size > 0) {
      const s = t.values().next().value;
      if (s) {
        t.delete(s), t.size === 0 && this.freeBlocks.delete(e);
        const r = this.memoryBlocks.get(s);
        if (r)
          return r;
      }
    }
    for (const [s, r] of this.freeBlocks)
      if (s >= e && s <= e * 2) {
        const n = r.values().next().value;
        if (n) {
          r.delete(n), r.size === 0 && this.freeBlocks.delete(s);
          const i = this.memoryBlocks.get(n);
          if (i)
            return i;
        }
      }
    return null;
  }
  /**
   * 清理未使用的内存块
   */
  cleanup() {
    const e = Date.now(), t = 90 * 1e3;
    let s = 0, r = 0;
    for (const [n, i] of this.memoryBlocks)
      if (!i.inUse && e - i.lastUsed > t) {
        const o = this.freeBlocks.get(i.size);
        o && (o.delete(n), o.size === 0 && this.freeBlocks.delete(i.size)), this.memoryBlocks.delete(n), s++, r += i.size, m.debug("Memory block cleaned up", void 0, { blockId: n, size: i.size });
      }
    s > 0 && (this.emit("memory-cleanup", { freedBlocks: s, freedSize: r }), m.info("Memory cleanup completed", void 0, { freedBlocks: s, freedSize: r }));
  }
  /**
   * 获取内存池统计信息
   */
  getStats() {
    let e = 0, t = 0, s = 0;
    for (const a of this.memoryBlocks.values())
      e += a.size, a.inUse && (t += a.size, s++);
    const r = e - t, i = this.memoryBlocks.size - s, o = i > 0 ? r / (i * this.config.defaultBlockSize) : 0;
    return {
      totalAllocated: this.totalAllocatedBytes,
      totalFreed: this.totalFreedBytes,
      activeBlocks: s,
      availableBlocks: i,
      fragmentationRatio: o,
      totalSize: e,
      usedSize: t,
      freeSize: r,
      peakUsage: this.peakUsageBytes
    };
  }
  calculateFreeSize() {
    let e = 0;
    for (const t of this.memoryBlocks.values())
      t.inUse || (e += t.size);
    return e;
  }
  /**
   * 释放插件的所有内存块
   */
  freePluginMemory(e) {
    let t = 0, s = 0;
    for (const [r, n] of this.memoryBlocks)
      n.pluginId === e && n.inUse && (n.inUse = !1, n.lastUsed = Date.now(), n.pluginId = void 0, this.freeBlocks.has(n.size) || this.freeBlocks.set(n.size, /* @__PURE__ */ new Set()), this.freeBlocks.get(n.size).add(r), t++, s += n.size, this.emit("memory-freed", { blockId: r, size: n.size, pluginId: e }));
    t > 0 && m.info("Plugin memory freed", e, { freedBlocks: t, freedSize: s });
  }
  /**
   * 启动清理定时器
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
  /**
   * 停止清理定时器
   */
  stopCleanupTimer() {
    this.cleanupTimer && (clearInterval(this.cleanupTimer), this.cleanupTimer = void 0);
  }
  /**
   * 销毁内存池
   */
  destroy() {
    this.stopCleanupTimer(), this.memoryBlocks.clear(), this.freeBlocks.clear(), m.info("MemoryPoolManager destroyed");
  }
}
const _t = new Fs();
class Us extends fe {
  config;
  cache = /* @__PURE__ */ new Map();
  accessOrder = [];
  // LRU tracking
  cleanupTimer;
  stats;
  constructor(e = {}) {
    super(), this.config = {
      maxCacheSize: e.maxCacheSize || 48 * 1024 * 1024,
      defaultTtl: e.defaultTtl || 900 * 1e3,
      cleanupInterval: e.cleanupInterval || 60 * 1e3,
      maxItems: e.maxItems || 4e3,
      enableLru: e.enableLru !== !1,
      enableCompression: e.enableCompression !== !1,
      maxSizePerPlugin: typeof e.maxSizePerPlugin == "number" ? e.maxSizePerPlugin : 12 * 1024 * 1024
    }, this.stats = {
      totalItems: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      expiredCount: 0,
      itemsByPlugin: {},
      sizeByPlugin: {}
    }, this.startCleanupTimer(), m.info("PluginCacheManager initialized", void 0, { config: this.config });
  }
  /**
   * 设置缓存项
   */
  set(e, t, s = {}) {
    try {
      const r = s.ttl || this.config.defaultTtl, n = Date.now(), i = n + r, o = JSON.stringify(t);
      let a = o, c = !1;
      if (s.compress || this.config.enableCompression || o.length > 8 * 1024)
        try {
          a = (void 0)(o).toString("base64"), c = !0;
        } catch {
          m.warn("Compression failed, using uncompressed value", s.pluginId, { key: e });
        }
      const d = Buffer.byteLength(a, "utf8"), f = ae.createHash("md5").update(a).digest("hex");
      this.stats.totalSize + d > this.config.maxCacheSize && this.evictItems(d);
      const w = s.pluginId;
      w && this.config.maxSizePerPlugin && (this.stats.sizeByPlugin[w] || 0) + d > this.config.maxSizePerPlugin && this.evictByPlugin(w, (this.stats.sizeByPlugin[w] || 0) + d - this.config.maxSizePerPlugin), this.cache.size >= this.config.maxItems && this.evictLeastRecentlyUsed(), this.cache.has(e) && this.delete(e);
      const v = {
        key: e,
        value: a,
        size: d,
        createdAt: n,
        expiresAt: i,
        lastAccessed: n,
        accessCount: 0,
        pluginId: s.pluginId,
        compressed: c,
        checksum: f
      };
      return this.cache.set(e, v), this.config.enableLru && this.updateAccessOrder(e), this.updateStatsOnSet(v), this.emit("cache-set", { key: e, size: d, pluginId: s.pluginId }), m.debug("Cache item set", s.pluginId, {
        key: e,
        size: d,
        ttl: r,
        compressed: c
      }), !0;
    } catch (r) {
      return m.error("Failed to set cache item", s.pluginId, r), !1;
    }
  }
  /**
   * 获取缓存项
   */
  get(e, t) {
    const s = this.cache.get(e);
    if (!s)
      return this.stats.missCount++, this.updateHitRate(), this.emit("cache-miss", { key: e, pluginId: t }), m.debug("Cache miss", t, { key: e }), null;
    if (Date.now() > s.expiresAt)
      return this.delete(e), this.stats.missCount++, this.stats.expiredCount++, this.updateHitRate(), this.emit("cache-miss", { key: e, pluginId: t }), m.debug("Cache item expired", t, { key: e }), null;
    s.lastAccessed = Date.now(), s.accessCount++, this.config.enableLru && this.updateAccessOrder(e);
    try {
      let r = s.value;
      s.compressed && (r = (void 0)(Buffer.from(r, "base64")).toString());
      const n = JSON.parse(r);
      return this.stats.hitCount++, this.updateHitRate(), this.emit("cache-hit", { key: e, pluginId: t }), m.debug("Cache hit", t, { key: e, accessCount: s.accessCount }), n;
    } catch (r) {
      return m.error("Failed to deserialize cache item", t, r), this.delete(e), this.stats.missCount++, this.updateHitRate(), null;
    }
  }
  /**
   * 删除缓存项
   */
  delete(e) {
    const t = this.cache.get(e);
    if (!t)
      return !1;
    if (this.cache.delete(e), this.config.enableLru) {
      const s = this.accessOrder.indexOf(e);
      s > -1 && this.accessOrder.splice(s, 1);
    }
    return this.updateStatsOnDelete(t), m.debug("Cache item deleted", t.pluginId, { key: e, size: t.size }), !0;
  }
  /**
   * 检查缓存项是否存在
   */
  has(e) {
    const t = this.cache.get(e);
    return t ? Date.now() > t.expiresAt ? (this.delete(e), !1) : !0 : !1;
  }
  /**
   * 清空缓存
   */
  clear(e) {
    let t = 0;
    if (e)
      for (const [s, r] of this.cache)
        r.pluginId === e && (this.delete(s), t++);
    else
      t = this.cache.size, this.cache.clear(), this.accessOrder = [], this.resetStats();
    return this.emit("cache-cleared", { pluginId: e, itemCount: t }), m.info("Cache cleared", e, { clearedCount: t }), t;
  }
  /**
   * 更新访问顺序 (LRU)
   */
  updateAccessOrder(e) {
    const t = this.accessOrder.indexOf(e);
    t > -1 && this.accessOrder.splice(t, 1), this.accessOrder.push(e);
  }
  /**
   * 淘汰最少使用的项
   */
  evictLeastRecentlyUsed() {
    if (!this.config.enableLru || this.accessOrder.length === 0) {
      const s = Array.from(this.cache.keys());
      if (s.length > 0) {
        const r = s[0], n = this.cache.get(r);
        this.delete(r), this.stats.evictionCount++, this.emit("cache-evicted", {
          key: r,
          reason: "lru",
          pluginId: n?.pluginId
        });
      }
      return;
    }
    const e = this.accessOrder[0], t = this.cache.get(e);
    this.delete(e), this.stats.evictionCount++, this.emit("cache-evicted", {
      key: e,
      reason: "lru",
      pluginId: t?.pluginId
    }), m.debug("Cache item evicted (LRU)", t?.pluginId, { key: e });
  }
  /**
   * 淘汰项目以释放空间
   */
  evictItems(e) {
    let t = 0;
    const s = [], r = Array.from(this.cache.entries()).sort(([, n], [, i]) => n.lastAccessed - i.lastAccessed);
    for (const [n, i] of r)
      if (s.push(n), t += i.size, t >= e)
        break;
    for (const n of s) {
      const i = this.cache.get(n);
      this.delete(n), this.stats.evictionCount++, this.emit("cache-evicted", {
        key: n,
        reason: "size",
        pluginId: i?.pluginId
      });
    }
    m.debug("Cache items evicted for size", void 0, {
      evictedCount: s.length,
      freedSize: t
    });
  }
  /**
   * 按插件维度淘汰缓存以满足配额
   */
  evictByPlugin(e, t) {
    let s = 0;
    const r = Array.from(this.cache.entries()).filter(([, n]) => n.pluginId === e).sort(([, n], [, i]) => n.lastAccessed - i.lastAccessed);
    for (const [n, i] of r)
      if (this.delete(n), this.stats.evictionCount++, this.emit("cache-evicted", { key: n, reason: "size", pluginId: e }), s += i.size, s >= t) break;
  }
  /**
   * 清理过期项
   */
  cleanupExpired() {
    const e = Date.now(), t = [];
    for (const [s, r] of this.cache)
      e > r.expiresAt && t.push(s);
    for (const s of t) {
      const r = this.cache.get(s);
      this.delete(s), this.stats.expiredCount++, this.emit("cache-evicted", {
        key: s,
        reason: "expired",
        pluginId: r?.pluginId
      });
    }
    return t.length > 0 && m.debug("Expired cache items cleaned up", void 0, {
      expiredCount: t.length
    }), t.length;
  }
  /**
   * 更新设置统计信息
   */
  updateStatsOnSet(e) {
    this.stats.totalItems++, this.stats.totalSize += e.size, e.pluginId && (this.stats.itemsByPlugin[e.pluginId] = (this.stats.itemsByPlugin[e.pluginId] || 0) + 1, this.stats.sizeByPlugin[e.pluginId] = (this.stats.sizeByPlugin[e.pluginId] || 0) + e.size);
  }
  /**
   * 更新删除统计信息
   */
  updateStatsOnDelete(e) {
    this.stats.totalItems--, this.stats.totalSize -= e.size, e.pluginId && (this.stats.itemsByPlugin[e.pluginId] = Math.max(0, (this.stats.itemsByPlugin[e.pluginId] || 0) - 1), this.stats.sizeByPlugin[e.pluginId] = Math.max(0, (this.stats.sizeByPlugin[e.pluginId] || 0) - e.size), this.stats.itemsByPlugin[e.pluginId] === 0 && (delete this.stats.itemsByPlugin[e.pluginId], delete this.stats.sizeByPlugin[e.pluginId]));
  }
  /**
   * 更新命中率
   */
  updateHitRate() {
    const e = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = e > 0 ? this.stats.hitCount / e : 0;
  }
  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      totalItems: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      expiredCount: 0,
      itemsByPlugin: {},
      sizeByPlugin: {}
    };
  }
  /**
   * 获取缓存统计信息
   */
  getStats() {
    return { ...this.stats };
  }
  /**
   * 获取缓存项信息
   */
  getItemInfo(e) {
    const t = this.cache.get(e);
    return t ? {
      key: t.key,
      size: t.size,
      createdAt: t.createdAt,
      expiresAt: t.expiresAt,
      lastAccessed: t.lastAccessed,
      accessCount: t.accessCount,
      pluginId: t.pluginId,
      compressed: t.compressed
    } : null;
  }
  /**
   * 启动清理定时器
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }
  /**
   * 停止清理定时器
   */
  stopCleanupTimer() {
    this.cleanupTimer && (clearInterval(this.cleanupTimer), this.cleanupTimer = void 0);
  }
  /**
   * 销毁缓存管理器
   */
  destroy() {
    this.stopCleanupTimer(), this.clear(), m.info("PluginCacheManager destroyed");
  }
}
const Ae = new Us();
function js(g, e, t, s, r, n, i, o, a, c, d) {
  console.log("[IPC] Initializing IPC handlers...");
  const f = ie.getInstance(), w = Ie.getInstance(), v = /* @__PURE__ */ new Map();
  C.handle("add-room", (h, u) => {
    console.log(`[IPC] Received request to add room: ${u}`), g.addRoom(u);
  }), C.handle("get-app-version", (h) => R.getVersion()), C.handle("login.qrStart", async () => {
    try {
      const h = await e.loginWithQRCode();
      if (h.success && h.qrCode) {
        const u = h.qrCode.expiresIn, l = typeof u == "number" ? Date.now() + u * 1e3 : void 0, y = h.qrCode.sessionId;
        return { qrCodeDataUrl: h.qrCode.qrCodeDataUrl, expiresIn: u, expireAt: l, sessionId: y };
      } else
        return { error: h.error || "获取二维码失败" };
    } catch (h) {
      return { error: h?.message || String(h) };
    }
  }), C.handle("login.qrCheck", async () => {
    try {
      const h = await e.checkQRLoginStatus();
      return h.success && h.tokenInfo ? { success: !0, tokenInfo: { userID: h.tokenInfo.userID } } : { success: !1, error: h.error || "unknown_error" };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("login.qrFinalize", async () => {
    try {
      const h = await e.finalizeQrLogin();
      return h.success && h.tokenInfo ? { success: !0, tokenInfo: { userID: h.tokenInfo.userID } } : { success: !1, error: h.error || "not_authenticated" };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("login.qrCancel", async () => {
    try {
      return e.cancelQrLogin();
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle(
    "login.logout",
    async () => (await e.logout(), { ok: !0 })
  ), C.handle("system.getSystemLog", async (h, u) => a.getRecentLogs(u)), C.handle("system.genDiagnosticZip", async () => c.generateDiagnosticPackage()), C.handle("system.getMemoryStats", async () => {
    try {
      const h = process.memoryUsage(), u = _t.getStats();
      return { success: !0, process: h, pool: u };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("system.getCacheStats", async () => {
    try {
      return { success: !0, cache: Ae.getStats() };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("system.showItemInFolder", async (h, u) => {
    try {
      if (!u || typeof u != "string")
        throw new Error("Invalid path");
      return Me.showItemInFolder(u), { success: !0 };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("system.openExternal", async (h, u) => {
    try {
      if (!u || typeof u != "string")
        throw new Error("Invalid url");
      return await Me.openExternal(u), { success: !0 };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("system.publishLog", async (h, u) => {
    try {
      const l = String(u?.source || "renderer"), y = String(u?.message || ""), E = u?.level || "info";
      return a.addLog(l, y, E, u?.correlationId), { success: !0 };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("monitoring.pageStatus.query", async (h, u) => {
    try {
      return { success: !0, data: w.querySnapshot(u) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("monitoring.pageStatus.listen", async (h, u) => {
    try {
      const l = String(u || "").trim();
      if (!l)
        return { success: !1, error: "invalid_plugin_id" };
      const y = h.sender.id;
      let E = v.get(y);
      E || (E = /* @__PURE__ */ new Map(), v.set(y, E));
      const p = E.get(l);
      if (p) {
        try {
          p();
        } catch {
        }
        E.delete(l);
      }
      const A = `plugin:${l}:page-status`, T = f.subscribe(A, (k) => {
        try {
          h.sender.send("monitoring.pageStatus.updated", { pluginId: l, record: k });
        } catch {
        }
      }, void 0);
      return E.set(l, T), { success: !0 };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("monitoring.pageStatus.unlisten", async (h, u) => {
    try {
      const l = String(u || "").trim();
      if (!l)
        return { success: !1, error: "invalid_plugin_id" };
      const y = h.sender.id, E = v.get(y), p = E?.get(l);
      if (p) {
        try {
          p();
        } catch {
        }
        E?.delete(l);
      }
      return { success: !0 };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("account.getUserInfo", async () => {
    try {
      const h = await e.getTokenInfo(), u = await e.validateToken(h || void 0);
      if (!u.isValid)
        return { success: !1, error: u.reason || "not_authenticated" };
      const l = String(h?.userID || "").trim();
      if (!l)
        return { success: !1, error: "no_user_id" };
      const E = await e.getApiInstance().user.getUserInfo(l);
      if (E?.success && E?.data) {
        const p = E.data, A = String(p?.userId ?? l), T = typeof p?.userName == "string" && p.userName.trim().length > 0 ? p.userName.trim() : `用户${A}`, k = (B) => {
          if (!B || typeof B != "string") return "";
          const W = String(B).trim().replace(/[`'\"]/g, "");
          return /^https?:\/\//i.test(W) ? W : "";
        }, D = k(p?.avatar), N = k(p?.avatarFrame);
        return { success: !0, data: {
          userId: A,
          userName: T,
          avatar: D,
          level: Number(p?.level ?? 0),
          fansCount: Number(p?.fansCount ?? 0),
          followCount: Number(p?.followCount ?? 0),
          signature: typeof p?.signature == "string" ? p.signature : void 0,
          isLive: !!p?.isLive,
          liveRoomId: typeof p?.liveRoomId < "u" ? String(p?.liveRoomId) : void 0,
          avatarFrame: N || void 0,
          contributeCount: typeof p?.contributeCount == "number" ? p.contributeCount : void 0,
          verifiedText: typeof p?.verifiedText == "string" ? p.verifiedText : void 0,
          isJoinUpCollege: !!p?.isJoinUpCollege,
          isFollowing: typeof p?.isFollowing == "boolean" ? p.isFollowing : void 0,
          isFollowed: typeof p?.isFollowed == "boolean" ? p.isFollowed : void 0,
          likeCount: typeof p?.likeCount == "number" ? p.likeCount : void 0
        } };
      }
      return { success: !1, error: E?.error || "fetch_failed" };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("account.tokenAvailable", async () => {
    try {
      const h = await e.getTokenInfo();
      if (!h)
        return { success: !0, data: { available: !1 } };
      const u = e.isAuthenticated(), l = h.expiresAt;
      return {
        success: !0,
        data: {
          available: u,
          expiresAt: l || void 0
        }
      };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("room.connect", async (h, u) => {
    try {
      const l = String(u || "").trim();
      return l ? g.getRoomCount() >= 3 ? { success: !1, code: "max_rooms_reached", error: "已达到最大房间数" } : g.getRoomInfo(l) ? { success: !1, code: "already_connected", error: "房间已连接" } : await g.addRoom(l) ? { success: !0 } : { success: !1, code: "connect_failed", error: "连接失败" } : { success: !1, code: "invalid_room_id", error: "房间ID无效" };
    } catch (l) {
      return { success: !1, code: "exception", error: l?.message || String(l) };
    }
  }), C.handle("room.disconnect", async (h, u) => {
    try {
      const l = String(u || "").trim();
      return l ? g.getRoomInfo(l) ? await g.removeRoom(l) ? { success: !0 } : { success: !1, code: "disconnect_failed", error: "断开失败" } : { success: !1, code: "not_found", error: "房间未连接" } : { success: !1, code: "invalid_room_id", error: "房间ID无效" };
    } catch (l) {
      return { success: !1, code: "exception", error: l?.message || String(l) };
    }
  }), C.handle("room.list", async () => {
    try {
      return { rooms: g.getAllRooms().map((u) => ({
        roomId: u.roomId,
        status: u.status,
        eventCount: u.eventCount,
        connectedAt: u.connectedAt ?? null,
        lastEventAt: u.lastEventAt ?? null,
        reconnectAttempts: u.reconnectAttempts
      })) };
    } catch (h) {
      return { error: h?.message || String(h) };
    }
  }), C.handle("room.status", async (h, u) => {
    try {
      const l = g.getRoomInfo(String(u));
      if (l)
        return {
          roomId: l.roomId,
          status: l.status,
          eventCount: l.eventCount,
          connectedAt: l.connectedAt ?? null,
          lastEventAt: l.lastEventAt ?? null,
          reconnectAttempts: l.reconnectAttempts
        };
      try {
        const E = d.getDb().prepare(
          "SELECT room_id, status, is_live, title, cover_url, like_count, viewer_count, live_id, created_at FROM rooms_meta WHERE room_id = ? ORDER BY created_at DESC LIMIT 1"
        ), p = E.get(String(u));
        try {
          E.finalize?.();
        } catch {
        }
        if (p)
          return {
            roomId: String(p.room_id),
            status: String(p.status || "closed"),
            eventCount: 0,
            connectedAt: null,
            lastEventAt: null,
            reconnectAttempts: 0,
            stale: !0
          };
      } catch {
      }
      return { error: "not_found", code: "not_found" };
    } catch (l) {
      try {
        const E = d.getDb().prepare(
          "SELECT room_id, status, is_live, title, cover_url, like_count, viewer_count, live_id, created_at FROM rooms_meta WHERE room_id = ? ORDER BY created_at DESC LIMIT 1"
        ), p = E.get(String(u));
        try {
          E.finalize?.();
        } catch {
        }
        if (p)
          return {
            roomId: String(p.room_id),
            status: String(p.status || "closed"),
            eventCount: 0,
            connectedAt: null,
            lastEventAt: null,
            reconnectAttempts: 0,
            stale: !0
          };
      } catch {
      }
      return { error: l?.message || String(l) };
    }
  }), C.handle("room.details", async (h, u) => {
    try {
      const l = String(u || "").trim();
      if (!l)
        return { success: !1, code: "invalid_room_id", error: "房间ID无效" };
      let y = {}, E = {}, p = !1, A, T = 0, k = 0, D, N, H;
      try {
        const U = await Ce.getUserLiveInfo(Number(l));
        U && U.success === !0 && (y = U.data || {}, E = y.profile || {}, p = !!y.liveID, A = y.liveID ? String(y.liveID) : void 0, T = typeof y.onlineCount == "number" ? y.onlineCount : T);
      } catch {
      }
      if (A)
        try {
          const U = await Ce.getSummary(A);
          if (U && U.success === !0) {
            const j = U.data || {};
            typeof j.viewerCount == "number" && (T = j.viewerCount), typeof j.likeCount == "number" && (k = j.likeCount);
          }
        } catch {
        }
      try {
        const j = await (await Ce.getApiInstance()).danmu?.getLiveRoomInfo?.(l);
        if (j && j.success === !0) {
          const z = j.data || {};
          typeof z?.owner?.username == "string" && z.owner.username.trim().length > 0 && (D = z.owner.username), typeof z.viewerCount == "number" && (T = z.viewerCount), typeof z.likeCount == "number" && (k = z.likeCount), typeof z.title == "string" && z.title.trim().length > 0 && (N = z.title), typeof z.owner?.avatar == "string" && z.owner.avatar.trim().length > 0 && (H = z.owner.avatar), !A && typeof z.liveID == "string" && z.liveID.trim().length > 0 && (A = z.liveID, p = !0);
        }
      } catch {
      }
      try {
        const j = await (await Ce.getApiInstance()).user?.getUserInfo?.(String(l));
        if (j && j.success === !0) {
          const z = j.data || {}, M = typeof z.userName == "string" ? z.userName.trim() : "", J = typeof z.avatar == "string" ? z.avatar.trim() : "";
          M.length > 0 && (D = M), J.length > 0 && (H = J), (!E || Object.keys(E).length === 0) && (E = z);
        }
      } catch {
      }
      const B = (U) => {
        if (!U || typeof U != "string") return "";
        const j = String(U).trim().replace(/[`'\"]/g, "");
        return /^https?:\/\//i.test(j) ? j : "";
      }, W = (() => {
        const U = B(y.liveCover);
        if (U) return U;
        const j = B(y.coverUrl);
        return j || B(H || E.avatar) || "";
      })(), V = p ? "open" : "closed", X = D || (typeof E.nickname == "string" ? E.nickname : typeof E.userName == "string" ? E.userName : `主播${l}`), Y = E.userID ? String(E.userID) : l, P = y?.categoryID ?? y?.categoryId ?? null, L = y?.categoryName ?? null, O = y?.subCategoryID ?? y?.subCategoryId ?? null, F = y?.subCategoryName ?? null;
      try {
        const j = d.getDb().prepare(`
          INSERT INTO rooms_meta (
            live_id,
            room_id, streamer_name, streamer_user_id,
            title, cover_url, status, is_live,
            viewer_count, online_count, like_count, live_cover,
            category_id, category_name, sub_category_id, sub_category_name,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(live_id) DO UPDATE SET
            room_id=excluded.room_id,
            streamer_name=excluded.streamer_name,
            streamer_user_id=excluded.streamer_user_id,
            title=excluded.title,
            cover_url=excluded.cover_url,
            status=excluded.status,
            is_live=excluded.is_live,
            viewer_count=excluded.viewer_count,
            online_count=excluded.online_count,
            like_count=excluded.like_count,
            live_cover=excluded.live_cover,
            category_id=excluded.category_id,
            category_name=excluded.category_name,
            sub_category_id=excluded.sub_category_id,
            sub_category_name=excluded.sub_category_name
        `);
        j.run(
          String(String(A || l)),
          l,
          X || null,
          Y || null,
          typeof y.title == "string" ? y.title : N || `直播间 ${l}`,
          W,
          V,
          p ? 1 : 0,
          typeof T == "number" ? T : 0,
          typeof T == "number" ? T : 0,
          typeof k == "number" ? k : 0,
          y?.liveCover || null,
          P != null ? String(P) : "",
          L != null ? String(L) : "",
          O != null ? String(O) : "",
          F != null ? String(F) : "",
          () => {
            try {
              j.finalize();
            } catch {
            }
          }
        );
      } catch {
      }
      return {
        success: !0,
        data: {
          roomId: l,
          liveId: A,
          title: typeof y.title == "string" ? y.title : N || `直播间 ${l}`,
          isLive: p,
          status: V,
          startTime: y.liveStartTime ? Number(new Date(y.liveStartTime)) : void 0,
          viewerCount: T,
          likeCount: k,
          coverUrl: W,
          streamer: {
            userId: Y,
            userName: X,
            avatar: H || (typeof E.avatar == "string" ? E.avatar : ""),
            level: typeof E.level == "number" ? E.level : 0
          }
        }
      };
    } catch (l) {
      try {
        const y = String(u || "").trim(), p = d.getDb().prepare(
          "SELECT room_id, live_id, title, cover_url, status, is_live, viewer_count, like_count, streamer_name, streamer_user_id, created_at FROM rooms_meta WHERE room_id = ? ORDER BY created_at DESC LIMIT 1"
        ), A = p.get(y);
        try {
          p.finalize?.();
        } catch {
        }
        if (A)
          return {
            success: !0,
            data: {
              roomId: String(A.room_id),
              liveId: A.live_id ? String(A.live_id) : void 0,
              title: typeof A.title == "string" && A.title ? A.title : `直播间 ${y}`,
              isLive: Number(A.is_live) === 1,
              status: String(A.status || (Number(A.is_live) === 1 ? "open" : "closed")),
              startTime: void 0,
              viewerCount: typeof A.viewer_count == "number" ? A.viewer_count : 0,
              likeCount: typeof A.like_count == "number" ? A.like_count : 0,
              coverUrl: typeof A.cover_url == "string" ? A.cover_url : "",
              streamer: {
                userId: A.streamer_user_id ? String(A.streamer_user_id) : String(A.room_id),
                userName: typeof A.streamer_name == "string" && A.streamer_name ? A.streamer_name : `主播${y}`,
                avatar: "",
                level: 0
              },
              stale: !0
            }
          };
      } catch {
      }
      return { success: !1, code: "exception", error: l?.message || String(l) };
    }
  }), C.handle("room.setPriority", async (h, u, l) => {
    try {
      const y = String(u || "").trim(), E = Number(l);
      return y ? Number.isFinite(E) ? g.setRoomPriority(y, E) ? { success: !0 } : { success: !1, code: "not_found", error: "房间未连接" } : { success: !1, code: "invalid_priority", error: "优先级无效" } : { success: !1, code: "invalid_room_id", error: "房间ID无效" };
    } catch (y) {
      return { success: !1, code: "exception", error: y?.message || String(y) };
    }
  }), C.handle("room.setLabel", async (h, u, l) => {
    try {
      const y = String(u || "").trim(), E = String(l || "").trim();
      return y ? g.setRoomLabel(y, E) ? { success: !0 } : { success: !1, code: "not_found", error: "房间未连接" } : { success: !1, code: "invalid_room_id", error: "房间ID无效" };
    } catch (y) {
      return { success: !1, code: "exception", error: y?.message || String(y) };
    }
  }), C.handle("live.getChannelList", async (h, u) => {
    try {
      const l = await Ce.getChannelList(u);
      return l && l.success === !0 ? { success: !0, data: l.data } : { success: !1, error: l?.error || "获取直播列表失败" };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.list", async () => {
    try {
      return { success: !0, data: await t.getInstalledPlugins() };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("plugin.install", async (h, u) => {
    try {
      return { success: !0, data: await t.installPlugin(u) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.uninstall", async (h, u) => {
    try {
      return await t.uninstallPlugin(u), { success: !0 };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.enable", async (h, u) => {
    try {
      return await t.enablePlugin(u), { success: !0 };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.disable", async (h, u) => {
    try {
      return await t.disablePlugin(u), { success: !0 };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.reload", async (h, u) => {
    try {
      return await t.reloadPlugin(u), { success: !0 };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.get", async (h, u) => {
    try {
      const l = await t.getPlugin(u);
      return l ? { success: !0, data: l } : { success: !1, error: "插件未找到" };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.openPluginsDir", async () => {
    try {
      const h = t.pluginsDir;
      return h && S.existsSync(h) ? (await Me.openPath(h), { success: !0 }) : { success: !1, error: "插件目录不存在" };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("plugin.window.open", async (h, u) => i.open(String(u))), C.handle("plugin.window.focus", async (h, u) => i.focus(String(u))), C.handle("plugin.window.close", async (h, u) => i.close(String(u))), C.handle("plugin.window.isOpen", async (h, u) => i.isOpen(String(u))), C.handle("plugin.window.list", async () => i.list()), C.handle("plugin.window.getMemoryStats", async () => {
    try {
      return { success: !0, ...await i.getMemoryStats() };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  });
  try {
    const h = (u, l) => {
      try {
        const y = n.getMainWindow();
        y && !y.isDestroyed() && y.webContents.send("plugin-status-changed", { event: u, ...l });
      } catch (y) {
        console.warn("[IPC] Failed to broadcast plugin status:", y);
      }
    };
    t.on?.("plugin.disabled", ({ id: u }) => {
      h("disabled", { id: u });
    }), t.on?.("plugin.uninstalled", ({ id: u }) => {
      h("uninstalled", { id: u });
    }), t.on?.("plugin.enabled", ({ id: u }) => {
      h("enabled", { id: u });
    }), t.on?.("plugin.installed", ({ plugin: u }) => {
      h("installed", { plugin: u });
    }), t.on?.("plugin.error", ({ id: u, error: l }) => {
      h("error", { id: u, error: l });
    });
  } catch {
  }
  C.handle("plugin.getConfig", async (h, u) => {
    try {
      const l = String(u || "").trim();
      return l ? { success: !0, data: o.get(`plugins.${l}.config`, {}) || {} } : { success: !1, error: "插件ID无效" };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.updateConfig", async (h, u, l) => {
    try {
      const y = String(u || "").trim();
      if (!y)
        return { success: !1, error: "插件ID无效" };
      if (!l || typeof l != "object")
        return { success: !1, error: "配置格式无效" };
      const p = { ...o.get(`plugins.${y}.config`, {}) || {}, ...l };
      o.set(`plugins.${y}.config`, p);
      try {
        const A = p && typeof p.uiBgColor == "string" ? p.uiBgColor : void 0;
        if (A) {
          const T = s.getAllOverlays().filter((k) => k.pluginId === y);
          await Promise.all(
            T.map((k) => s.updateOverlay(k.id, {
              style: { ...k.style || {}, backgroundColor: A }
            }))
          );
        }
      } catch (A) {
        console.warn("[IPC] plugin.updateConfig overlay sync failed:", A);
      }
      try {
        const A = `plugin:${y}:overlay`;
        f.publish(
          A,
          { event: "config-updated", payload: { config: p } },
          { ttlMs: 300 * 1e3, persist: !0, meta: { kind: "lifecycle" } }
        );
      } catch (A) {
        console.warn("[IPC] plugin.updateConfig lifecycle publish failed:", A);
      }
      try {
        i.send(y, "plugin-config-updated", { pluginId: y, config: p });
      } catch {
      }
      try {
        !!p.tickerEnabled ? startTicker(y, "Ticker: toast", { durationMs: 2500 }) : stopTicker(y);
      } catch {
      }
      try {
        const A = t.processManager, T = t.getPlugin?.(String(y));
        if (!A?.getProcessInfo?.(String(y)) && T && T.manifest && T.manifest.main && typeof T.manifest.main == "object" && typeof T.manifest.main.dir == "string" && typeof T.manifest.main.file == "string") {
          const D = process.env.NODE_ENV === "development" || !R.isPackaged, H = [
            x.join(process.cwd(), "buildResources", "plugins", String(T.id)),
            x.join(process.resourcesPath || process.cwd(), "plugins", String(T.id))
          ].find((Y) => {
            try {
              return S.existsSync(Y);
            } catch {
              return !1;
            }
          }), B = !!H && D && T.manifest?.test === !0, W = (Y, P) => {
            const L = P.file;
            if (x.isAbsolute(L))
              return L;
            if (!P.dir || P.dir.trim() === "")
              return x.join(Y, L);
            const O = x.join(Y, P.dir), F = x.normalize(P.dir), U = x.normalize(L);
            return U.startsWith(F + x.sep) || U === F ? x.join(Y, L) : x.join(O, L);
          }, V = B ? H : T.installPath, X = W(V, T.manifest.main);
          await A.startPluginProcess?.(String(y), X);
        }
        try {
          await A.executeInPlugin?.(String(y), "onConfigUpdated", [p]);
        } catch {
        }
      } catch {
      }
      return { success: !0 };
    } catch (y) {
      return { success: !1, error: y?.message || String(y) };
    }
  }), C.handle("plugin.stats", async () => {
    try {
      return { success: !0, data: await t.getPluginStats() };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("plugin.logs", async (h, u, l) => {
    try {
      return { success: !0, data: await t.getPluginLogs(u, l) };
    } catch (y) {
      return { success: !1, error: y?.message || String(y) };
    }
  }), C.handle("plugin.errorHistory", async (h, u) => {
    try {
      return { success: !0, data: await t.getPluginErrorHistory(u) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.errorStats", async () => {
    try {
      return { success: !0, data: await t.getPluginErrorStats() };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("plugin.lifecycle.emit", async (h, u, l, y) => {
    try {
      const E = await t.getPlugin(l);
      return await ge.executeHook(u, {
        pluginId: l,
        plugin: E || void 0,
        manifest: E?.manifest,
        context: {
          pageType: y && typeof y.pageType == "string" ? y.pageType : "ui",
          ...y
        }
      }), { success: !0 };
    } catch (E) {
      return { success: !1, error: E?.message || String(E) };
    }
  }), C.handle("plugin.recovery", async (h, u, l, y) => {
    try {
      return { success: !0, data: await t.executePluginRecovery(u, l, y) };
    } catch (E) {
      return { success: !1, error: E?.message || String(E) };
    }
  }), C.handle("plugin.execute", async (h, u, l, y) => {
    try {
      const E = t.processManager, p = t.getPlugin?.(String(u));
      if (!E?.getProcessInfo?.(String(u)) && p && p.manifest && p.manifest.main && typeof p.manifest.main == "object" && typeof p.manifest.main.dir == "string" && typeof p.manifest.main.file == "string") {
        const k = process.env.NODE_ENV === "development" || !R.isPackaged, N = [
          x.join(process.cwd(), "buildResources", "plugins", String(p.id)),
          x.join(process.resourcesPath || process.cwd(), "plugins", String(p.id))
        ].find((Y) => {
          try {
            return S.existsSync(Y);
          } catch {
            return !1;
          }
        }), H = !!N && k && p.manifest?.test === !0, B = (Y, P) => {
          const L = P.file;
          if (x.isAbsolute(L))
            return L;
          if (!P.dir || P.dir.trim() === "")
            return x.join(Y, L);
          const O = x.join(Y, P.dir), F = x.normalize(P.dir), U = x.normalize(L);
          return U.startsWith(F + x.sep) || U === F ? x.join(Y, L) : x.join(O, L);
        }, W = H ? N : p.installPath, V = B(W, p.manifest.main), X = o.get("server.port", parseInt(process.env.ACFRAME_API_PORT || "18299"));
        await E.startPluginProcess?.(String(u), V, { apiPort: X });
      }
      return { success: !0, data: await E.executeInPlugin?.(String(u), String(l), Array.isArray(y) ? y : []) };
    } catch (E) {
      return { success: !1, error: E?.message || String(E) };
    }
  }), C.handle("plugin.resetErrorCount", async (h, u, l) => {
    try {
      return t.resetPluginErrorCount(u, l), { success: !0 };
    } catch (y) {
      return { success: !1, error: y?.message || String(y) };
    }
  }), C.handle("plugin.selectFile", async () => {
    try {
      const h = await We.showOpenDialog({
        title: "选择插件文件",
        filters: [
          { name: "插件文件", extensions: ["zip", "tar", "gz", "tgz"] },
          { name: "所有文件", extensions: ["*"] }
        ],
        properties: ["openFile"]
      });
      return h.canceled || !h.filePaths.length ? { success: !1, canceled: !0 } : { success: !0, filePath: h.filePaths[0] };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("plugin.installFromFile", async (h, u) => {
    try {
      let l = u?.filePath;
      if (!l) {
        const p = await We.showOpenDialog({
          title: "选择要安装的插件文件",
          filters: [
            { name: "插件文件", extensions: ["zip", "tar", "gz", "tgz"] },
            { name: "所有文件", extensions: ["*"] }
          ],
          properties: ["openFile"]
        });
        if (p.canceled || !p.filePaths.length)
          return { success: !1, canceled: !0 };
        l = p.filePaths[0];
      }
      const y = {
        filePath: l,
        overwrite: u?.overwrite || !1,
        enable: u?.enable || !1,
        skipSignatureVerification: u?.skipSignatureVerification || !1,
        skipChecksumVerification: u?.skipChecksumVerification || !1,
        allowUnsafe: u?.allowUnsafe || !1,
        expectedChecksum: u?.expectedChecksum
      };
      return { success: !0, data: await t.installPlugin(y) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.validateFile", async (h, u) => {
    try {
      return { success: !0, data: await t.validatePluginFile(u) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("overlay.create", async (h, u) => {
    try {
      return await s.createOverlay(u);
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("overlay.update", async (h, u, l) => {
    try {
      return await s.updateOverlay(u, l);
    } catch (y) {
      return { success: !1, error: y?.message || String(y) };
    }
  }), C.handle("overlay.close", async (h, u) => {
    try {
      return await s.closeOverlay(u);
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("overlay.show", async (h, u) => {
    try {
      return await s.showOverlay(u);
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("overlay.hide", async (h, u) => {
    try {
      return await s.hideOverlay(u);
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("overlay.bringToFront", async (h, u) => {
    try {
      return await s.bringToFront(u);
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("overlay.list", async () => {
    try {
      return { success: !0, data: await s.listOverlays() };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("overlay.send", async (h, u, l, y) => {
    try {
      return await s.sendMessage(u, l, y);
    } catch (E) {
      return { success: !1, error: E?.message || String(E) };
    }
  }), C.handle("overlay.action", async (h, u, l, y) => {
    try {
      return await s.handleOverlayAction(u, l, y);
    } catch (E) {
      return { success: !1, error: E?.message || String(E) };
    }
  }), C.handle("console:createSession", async (h, u) => {
    try {
      const l = r.createSession(u.source, u.userId);
      return { success: !0, data: r.getSession(l) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("console:endSession", async (h, u) => {
    try {
      return r.endSession(u.sessionId), { success: !0 };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("console:executeCommand", async (h, u) => {
    try {
      return { success: !0, data: await r.executeCommand(u.sessionId, u.commandLine) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("console:getCommands", async () => {
    try {
      return { success: !0, data: r.getCommands().map((u) => ({
        name: String(u?.name || ""),
        description: String(u?.description || ""),
        usage: typeof u?.usage == "string" ? u.usage : "",
        category: String(u?.category || "system")
      })) };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("console:getSession", async (h, u) => {
    try {
      const l = r.getSession(u.sessionId);
      return l ? { success: !0, data: l } : { success: !1, error: "Session not found" };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("console:getActiveSessions", async () => {
    try {
      return { success: !0, data: r.getActiveSessions() };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("plugin.devtools.saveConfig", async (h, u) => {
    try {
      return { success: !0, data: await t.saveDevConfig(u) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.devtools.getConfig", async (h, u) => {
    try {
      return { success: !0, data: await t.getDevConfig(u) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.devtools.startDebug", async (h, u) => {
    try {
      return { success: !0, data: await t.startExternalDebug(u) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.devtools.stopDebug", async (h, u) => {
    try {
      return { success: !0, data: await t.stopExternalDebug(u) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.devtools.testConnection", async (h, u) => {
    try {
      return { success: !0, data: await t.testExternalConnection(u) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.devtools.getDebugStatus", async (h, u) => {
    try {
      return { success: !0, data: await t.getDebugStatus(u) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.devtools.enableHotReload", async (h, u) => {
    try {
      return { success: !0, data: await t.enableHotReload(u) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("plugin.devtools.disableHotReload", async (h, u) => {
    try {
      return { success: !0, data: await t.disableHotReload(u) };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("dialog.showOpenDialog", async (h, u) => {
    try {
      return await We.showOpenDialog(u);
    } catch (l) {
      return { canceled: !0, error: l?.message || String(l) };
    }
  }), C.handle("dialog.showSaveDialog", async (h, u) => {
    try {
      return await We.showSaveDialog(u);
    } catch (l) {
      return { canceled: !0, error: l?.message || String(l) };
    }
  }), C.handle("fs.exists", async (h, u) => {
    try {
      return S.existsSync(u);
    } catch {
      return !1;
    }
  }), C.handle("fs.readFile", async (h, u) => {
    try {
      return S.readFileSync(u, "utf8");
    } catch (l) {
      throw new Error(`Failed to read file: ${l?.message || String(l)}`);
    }
  }), C.handle("fs.writeFile", async (h, u, l) => {
    try {
      return S.writeFileSync(u, l, "utf8"), !0;
    } catch (y) {
      throw new Error(`Failed to write file: ${y?.message || String(y)}`);
    }
  }), C.handle("window.minimize", async (h) => {
    const u = ne.fromWebContents(h.sender);
    u && u.minimize();
  }), C.handle("window.close", async (h) => {
    const u = ne.fromWebContents(h.sender);
    u && u.close();
  }), C.handle("window.maximize", async (h) => {
    const u = ne.fromWebContents(h.sender);
    u && (u.isMaximized() ? u.restore() : u.maximize());
  }), C.handle("window.restore", async (h) => {
    const u = ne.fromWebContents(h.sender);
    u && u.restore();
  }), C.handle("window.openDevtools", async (h) => {
    const u = ne.fromWebContents(h.sender);
    if (u) {
      try {
        u.webContents.openDevTools({ mode: "detach" });
      } catch {
      }
      return { success: !0 };
    }
    return { success: !1, error: "window_not_found" };
  }), C.handle("system.getConfig", () => o.getAll()), C.handle("system.updateConfig", (h, u) => {
    try {
      if (typeof u != "object" || u === null)
        throw new Error("Invalid configuration format.");
      o.setAll(u);
      try {
        if (Object.prototype.hasOwnProperty.call(u, "auth.keepLogin") && !!!u["auth.keepLogin"])
          try {
            e.clearStoredTokenInfo?.();
          } catch {
          }
        if (Object.prototype.hasOwnProperty.call(u, "ui.minimizeToTray")) {
          const l = !!u["ui.minimizeToTray"];
          try {
            n.setMinimizeToTray(l);
          } catch {
          }
        }
        if (Object.prototype.hasOwnProperty.call(u, "app.autoStart")) {
          const l = !!u["app.autoStart"];
          try {
            R.setLoginItemSettings({ openAtLogin: l });
          } catch {
          }
        }
      } catch {
      }
      return { success: !0 };
    } catch (l) {
      return { success: !1, error: l.message };
    }
  }), C.handle("system.getUserDataDir", async () => {
    try {
      return { success: !0, path: R.getPath("userData") };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("system.getBuildInfo", async () => {
    try {
      let h = R.getVersion(), u = Date.now();
      const l = (y) => {
        try {
          if (!S.existsSync(y)) return !1;
          const E = S.readFileSync(y, "utf8"), p = JSON.parse(E);
          if (p && typeof p.version == "string" && p.version.trim().length > 0 && typeof p.name == "string" && p.name.trim().length > 0) {
            h = String(p.version).trim();
            const A = S.statSync(y);
            return u = A.mtimeMs || A.mtime.getTime(), !0;
          }
          return !1;
        } catch {
          return !1;
        }
      };
      try {
        let y = R.getAppPath();
        for (let E = 0; E < 5; E++) {
          const p = x.join(y, "package.json");
          if (l(p)) break;
          const A = x.dirname(y);
          if (!A || A === y) break;
          y = A;
        }
      } catch {
      }
      return (!h || h === R.getVersion()) && l(x.join(x.resolve(process.cwd()), "package.json")), { success: !0, version: h, buildTime: u };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("system.serverStatus", async () => {
    try {
      const h = t.apiServer, u = !!h && !!h.isRunning?.(), l = Number(o.get("server.port")), y = String(h?.getLastError?.() || "");
      let E;
      if (u && Number.isFinite(l) && l > 0 && l <= 65535)
        try {
          const p = new URL("/api/health", `http://127.0.0.1:${l}`), A = await fetch(p.toString(), { method: "GET" });
          A.ok && (E = (A.headers.get("content-type") || "").includes("application/json") ? await A.json() : await A.text());
        } catch {
        }
      return { success: !0, data: { running: u, port: l, error: y || void 0, health: E } };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("system.restartServer", async (h, u) => {
    try {
      const l = t.apiServer;
      if (!l) return { success: !1, error: "api_server_not_available" };
      const y = Number(o.get("server.port", 18299)), E = Number(u && typeof u.port == "number" ? u.port : y);
      if (Number.isFinite(E))
        try {
          l.setPort?.(E);
        } catch {
        }
      try {
        await l.stop?.();
      } catch {
      }
      try {
        if (await l.start?.(), Number.isFinite(E) && E !== y)
          try {
            o.set("server.port", E);
          } catch {
          }
        return { success: !0 };
      } catch (p) {
        return { success: !1, error: p?.message || String(p) };
      }
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  });
  const _ = () => {
    try {
      const h = process.env.ACFUN_TEST_DB_PATH;
      if (h && h.trim().length > 0) return h;
    } catch {
    }
    try {
      const h = o.get("database.path", "");
      if (h && h.trim().length > 0) return h;
    } catch {
    }
    try {
      return x.join(R.getPath("userData"), "events.db");
    } catch {
      return x.join(require("os").tmpdir(), "acfun-events.db");
    }
  };
  C.handle("db.getPath", async () => {
    try {
      return { success: !0, path: _() };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("db.setPath", async (h, u) => {
    try {
      if (!u || typeof u != "string") return { success: !1, error: "invalid_path" };
      const l = x.dirname(u);
      try {
        S.existsSync(l) || S.mkdirSync(l, { recursive: !0 });
      } catch {
      }
      return o.set("database.path", u), { success: !0 };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("system.getStorageStats", async () => {
    try {
      const h = R.getPath("userData"), u = _(), l = (k) => {
        try {
          const D = S.statSync(k);
          return D.isFile() ? D.size : 0;
        } catch {
          return 0;
        }
      }, y = (k) => {
        let D = 0;
        try {
          if (!S.existsSync(k)) return 0;
          const N = S.statSync(k);
          if (N.isFile()) return N.size;
          const H = S.readdirSync(k);
          for (const B of H) {
            if (B.startsWith(".") && (B.includes("cache") || B.includes("temp") || B.includes("backup"))) continue;
            const W = x.join(k, B);
            try {
              const V = S.statSync(W);
              D += V.isFile() ? V.size : y(W);
            } catch {
            }
          }
        } catch {
        }
        return D;
      }, E = l(u), p = l(x.join(h, "config.json")) + l(x.join(h, "secrets.json")), A = y(x.join(h, "plugins")), T = E + p + A;
      return { success: !0, dbBytes: E, configBytes: p, pluginsBytes: A, totalBytes: T };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("system.statPath", async (h, u) => {
    try {
      if (!u || typeof u != "string")
        return { success: !1, error: "invalid_path" };
      const l = S.statSync(u);
      return { success: !0, mtimeMs: l.mtimeMs || l.mtime.getTime() };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("system.getReadmeSummary", async () => {
    try {
      const h = x.resolve(process.cwd()), u = x.join(h, "README.md");
      if (!S.existsSync(u)) return { success: !1, error: "README_NOT_FOUND" };
      const l = S.readFileSync(u, "utf8");
      let y = "";
      try {
        const E = l.match(/<h3>([^<]+)<\/h3>/i), p = l.match(/<p>([^<]+)<\/p>/i), A = E ? E[1].trim() : "", T = p ? p[1].trim() : "";
        y = [A, T].filter(Boolean).join(" - ");
      } catch {
      }
      return y || (y = l.split(/\r?\n/).map((A) => A.trim()).filter(Boolean).find((A) => A && !A.startsWith("#") && !A.startsWith("[") && A.length > 0) || "" || "适用于ACFUN的开放式直播框架工具 - 一个功能强大、可扩展的 AcFun 直播工具框架，提供弹幕收集、数据分析、插件系统等功能"), { success: !0, summary: y };
    } catch (h) {
      return { success: !1, error: h?.message || String(h) };
    }
  }), C.handle("config.exportZip", async (h, u) => {
    try {
      let l = "";
      if (typeof u == "string" && u.trim().length > 0) {
        l = u.trim();
        const p = x.dirname(l);
        try {
          S.existsSync(p) || S.mkdirSync(p, { recursive: !0 });
        } catch {
        }
      } else {
        const p = x.join(R.getPath("userData"), "config-exports");
        try {
          S.existsSync(p) || S.mkdirSync(p, { recursive: !0 });
        } catch {
        }
        const A = `config-${Date.now()}.zip`;
        l = x.join(p, A);
      }
      const y = S.createWriteStream(l), E = (await import("archiver")).default("zip", { zlib: { level: 9 } });
      return await new Promise((p, A) => {
        y.on("close", () => p()), y.on("error", (N) => A(N)), E.on("error", (N) => A(N)), E.pipe(y);
        const T = R.getPath("userData"), k = x.join(T, "config.json"), D = x.join(T, "secrets.json");
        try {
          S.existsSync(k) && E.file(k, { name: "config.json" });
        } catch {
        }
        try {
          S.existsSync(D) && E.file(D, { name: "secrets.json" });
        } catch {
        }
        E.finalize();
      }), { success: !0, filepath: l };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("config.importZip", async (h, u) => {
    try {
      if (!u || typeof u != "string" || !S.existsSync(u))
        return { success: !1, error: "zip_not_found" };
      const l = await import("./unzip-DZXoPn-N.js").then((E) => E.u), y = R.getPath("userData");
      return await S.createReadStream(u).pipe(l.Extract({ path: y })).promise(), { success: !0 };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  });
  const b = /* @__PURE__ */ new Map();
  C.handle("popup.toast", async (h, u) => {
    try {
      let l = n.getMainWindow();
      if (!l || l.isDestroyed()) {
        const y = ne.fromWebContents(h.sender);
        l = ne.getAllWindows().find((E) => E && !E.isDestroyed() && E !== y) || null;
      }
      return l?.webContents.send("renderer-global-popup", { action: "toast", payload: u }), { success: !!l };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("popup.alert", async (h, u) => {
    try {
      let l = n.getMainWindow();
      if (!l || l.isDestroyed()) {
        const y = ne.fromWebContents(h.sender);
        l = ne.getAllWindows().find((E) => E && !E.isDestroyed() && E !== y) || null;
      }
      return l?.webContents.send("renderer-global-popup", { action: "alert", payload: u }), { success: !!l };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("popup.confirm", async (h, u) => {
    try {
      let l = n.getMainWindow();
      if (!l || l.isDestroyed()) {
        const A = ne.fromWebContents(h.sender);
        l = ne.getAllWindows().find((T) => T && !T.isDestroyed() && T !== A) || null;
      }
      if (!l) return { success: !1, error: "main_window_not_available" };
      const y = String(Date.now()) + "-" + Math.random().toString(16).slice(2), E = new Promise((A) => {
        b.set(y, A), setTimeout(() => {
          b.has(y) && (b.delete(y), A(!1));
        }, 3e4);
      });
      return l.webContents.send("renderer-global-popup", { action: "confirm", payload: u, requestId: y }), { success: !0, result: await E };
    } catch (l) {
      return { success: !1, error: l?.message || String(l) };
    }
  }), C.handle("popup.confirm.respond", async (h, u, l) => {
    try {
      const y = b.get(u);
      return y ? (b.delete(u), y(!!l), { success: !0 }) : { success: !1, error: "request_not_found" };
    } catch (y) {
      return { success: !1, error: y?.message || String(y) };
    }
  }), console.log("[IPC] All IPC handlers initialized successfully");
}
C.handle("config.setDir", async (g, e) => {
  try {
    const t = String(e || "").trim();
    if (!t) return { success: !1, error: "invalid_dir" };
    try {
      S.existsSync(t) || S.mkdirSync(t, { recursive: !0 });
    } catch {
    }
    configManager.set("config.dir", t);
    const s = R.getPath("userData"), r = x.join(s, "config.json"), n = x.join(s, "secrets.json");
    try {
      S.existsSync(r) && S.copyFileSync(r, x.join(t, "config.json"));
    } catch {
    }
    try {
      S.existsSync(n) && S.copyFileSync(n, x.join(t, "secrets.json"));
    } catch {
    }
    return { success: !0 };
  } catch (t) {
    return { success: !1, error: t?.message || String(t) };
  }
});
C.handle("system.setAutoStart", async (g, e) => {
  try {
    return R.setLoginItemSettings({ openAtLogin: !!e }), { success: !0 };
  } catch (t) {
    return { success: !1, error: t?.message || String(t) };
  }
});
C.handle("system.setMinimizeToTray", async (g, e) => {
  try {
    return windowManager.setMinimizeToTray(!!e), { success: !0 };
  } catch (t) {
    return { success: !1, error: t?.message || String(t) };
  }
});
async function $s(g, e) {
  try {
    const t = require.resolve(`${g}/package.json`), s = JSON.parse(await bt.readFile(t, "utf-8")), r = s.license || (Array.isArray(s.licenses) ? s.licenses[0]?.type : void 0);
    if (!r)
      throw new Error(`License field missing for '${g}'.`);
    if (!e.includes(r))
      throw new Error(
        `Invalid license for '${g}'. Expected one of '${e.join(", ")}' but found '${r}'. The application will not start.`
      );
    console.log(`[DependencyGuard] License check passed for '${g}' (license: ${r}).`);
  } catch (t) {
    throw console.error(`[DependencyGuard] Critical dependency check failed: ${t.message}`), t;
  }
}
async function Hs() {
  await $s("acfunlive-http-api", ["MIT", "Apache-2.0"]);
}
class zs {
  tray = null;
  enabled = !1;
  windowProvider;
  constructor(e) {
    this.windowProvider = e;
  }
  setEnabled(e) {
    if (this.enabled = !!e, this.enabled && !this.tray && this.createTray(), !this.enabled && this.tray) {
      try {
        this.tray.destroy();
      } catch {
      }
      this.tray = null;
    }
  }
  createTray() {
    if (this.tray) return;
    const e = this.getIconPath();
    this.tray = new It(e), this.tray.setToolTip("ACFUN直播框架");
    const t = Tt.buildFromTemplate([
      {
        label: "显示窗口",
        click: () => {
          const s = this.windowProvider();
          if (s)
            try {
              s.show(), s.focus();
            } catch {
            }
        }
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          try {
            R.quit();
          } catch {
          }
        }
      }
    ]);
    this.tray.setContextMenu(t), this.tray.on("click", () => {
      const s = this.windowProvider();
      if (s)
        try {
          s.isVisible() ? s.focus() : s.show();
        } catch {
        }
    });
  }
  bindWindowBehavior(e) {
    try {
      e.on("minimize", () => {
        if (this.enabled)
          try {
            e.hide();
          } catch {
          }
      }), e.on("close", (t) => {
        if (this.enabled)
          try {
            t?.preventDefault?.(), e.hide();
          } catch {
          }
      });
    } catch {
    }
  }
  getIconPath() {
    const e = x.join(process.cwd(), "buildResources", "icon.png");
    try {
      return process.env.VITE_DEV_SERVER_URL ? x.join(process.cwd(), "buildResources", "icon.png") : x.join(process.cwd(), "buildResources", "icon.png");
    } catch {
      return e;
    }
  }
}
const nt = process.env.VITE_DEV_SERVER_URL, Ws = () => {
  try {
    for (const e of process.argv)
      if (String(e).trim() === "--debug") return !0;
  } catch {
  }
  const g = String(process.env.ACFRAME_OPEN_DEVTOOLS || "").trim().toLowerCase();
  return g === "0" || g === "false" || g === "off" ? !1 : !!nt;
};
class Bs {
  mainWindow = null;
  trayManager;
  minimizeToTrayEnabled = !1;
  constructor() {
    this.trayManager = new zs(() => this.mainWindow);
  }
  createWindow() {
    if (this.mainWindow = new ne({
      show: !1,
      // Use 'ready-to-show' event to show the window
      width: 1024,
      height: 768,
      minWidth: 1024,
      minHeight: 768,
      maxWidth: 1024,
      maxHeight: 768,
      resizable: !1,
      frame: !1,
      webPreferences: {
        nodeIntegration: !1,
        contextIsolation: !0,
        sandbox: !1,
        // Sandbox is disabled for now, as per original config
        preload: x.join(__dirname, "../../preload/dist/exposed.mjs")
        // Path to the preload script (ESM)
      }
    }), this.mainWindow.webContents.session.webRequest.onHeadersReceived((e, t) => {
      const s = { ...e.responseHeaders };
      for (const r of Object.keys(s)) {
        const n = r.toLowerCase();
        (n === "content-security-policy" || n === "x-content-security-policy" || n === "x-webkit-csp") && delete s[r];
      }
      t({ responseHeaders: s });
    }), this.mainWindow.once("ready-to-show", () => {
      this.mainWindow?.show(), Ws() && this.mainWindow?.webContents.openDevTools({ mode: "detach" });
    }), nt)
      this.mainWindow.loadURL(nt);
    else {
      const e = R.isPackaged ? x.join(process.resourcesPath, "app", "packages", "renderer", "dist", "index.html") : x.join(R.getAppPath(), "packages", "renderer", "dist", "index.html");
      this.mainWindow.loadFile(e);
    }
    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });
    try {
      const e = ye();
      this.mainWindow.webContents.on("console-message", (t, s, r, n, i) => {
        try {
          const o = s === 2 ? "error" : s === 1 ? "warn" : "info";
          e.addLog("renderer", `[${i}:${n}] ${String(r)}`, o);
        } catch {
        }
      });
    } catch {
    }
    try {
      this.trayManager.bindWindowBehavior(this.mainWindow);
    } catch {
    }
  }
  getMainWindow() {
    return this.mainWindow;
  }
  setMinimizeToTray(e) {
    this.minimizeToTrayEnabled = e;
    try {
      this.trayManager.setEnabled(e);
    } catch {
    }
  }
  isMainWindow(e) {
    return !!e && e === this.mainWindow;
  }
  isMinimizeToTrayEnabled() {
    return this.minimizeToTrayEnabled;
  }
}
function qs() {
  R.requestSingleInstanceLock() || (R.quit(), process.exit(0));
}
function Vs() {
  R.disableHardwareAcceleration();
}
const Gs = [
  "@app/preload",
  "@app/electron-versions"
];
function Xs(g) {
  const e = Gs.filter((t) => {
    const s = Dt(g, "packages", t.replace("@app/", ""), "package.json");
    return !Ve(s);
  });
  if (e.length > 0)
    throw new Error(`Missing local workspace packages: ${e.join(", ")}`);
}
class Ks extends ce {
  config;
  requestHistory = [];
  burstRequestsUsed = 0;
  lastBurstReset = Date.now();
  isInCooldown = !1;
  cooldownEndTime = 0;
  constructor(e) {
    super(), this.config = {
      maxRequestsPerMinute: 30,
      maxRequestsPerHour: 1e3,
      maxRequestsPerDay: 1e4,
      burstLimit: 10,
      cooldownPeriod: 6e4,
      // 1分钟冷却期
      ...e
    }, this.startCleanupTimer();
  }
  /**
   * 检查是否可以发起请求
   */
  async canMakeRequest() {
    const e = Date.now();
    if (this.isInCooldown && e < this.cooldownEndTime)
      return {
        allowed: !1,
        reason: "In cooldown period",
        waitTime: this.cooldownEndTime - e
      };
    this.isInCooldown && e >= this.cooldownEndTime && (this.isInCooldown = !1, this.cooldownEndTime = 0), this.cleanupExpiredRequests();
    const t = this.getStatus();
    return t.requestsInLastMinute >= this.config.maxRequestsPerMinute ? (this.emit("rateLimitExceeded", {
      type: "minute",
      resetTime: t.quotaResetTime.minute
    }), {
      allowed: !1,
      reason: "Minute rate limit exceeded",
      waitTime: t.quotaResetTime.minute - e
    }) : t.requestsInLastHour >= this.config.maxRequestsPerHour ? (this.emit("rateLimitExceeded", {
      type: "hour",
      resetTime: t.quotaResetTime.hour
    }), {
      allowed: !1,
      reason: "Hour rate limit exceeded",
      waitTime: t.quotaResetTime.hour - e
    }) : t.requestsInLastDay >= this.config.maxRequestsPerDay ? (this.emit("rateLimitExceeded", {
      type: "day",
      resetTime: t.quotaResetTime.day
    }), {
      allowed: !1,
      reason: "Daily rate limit exceeded",
      waitTime: t.quotaResetTime.day - e
    }) : this.burstRequestsUsed >= this.config.burstLimit ? (this.emit("rateLimitExceeded", {
      type: "burst",
      resetTime: this.lastBurstReset + 6e4
    }), {
      allowed: !1,
      reason: "Burst limit exceeded",
      waitTime: this.lastBurstReset + 6e4 - e
    }) : (this.checkQuotaWarnings(t), { allowed: !0 });
  }
  /**
   * 记录一次 API 请求
   */
  recordRequest() {
    const e = Date.now();
    this.requestHistory.push(e), e - this.lastBurstReset > 6e4 ? (this.burstRequestsUsed = 1, this.lastBurstReset = e) : this.burstRequestsUsed++;
  }
  /**
   * 记录 API 错误并可能触发冷却期
   */
  recordError(e) {
    (e === 429 || e === 503) && this.startCooldown();
  }
  /**
   * 获取当前速率限制状态
   */
  getStatus() {
    const e = Date.now();
    this.cleanupExpiredRequests();
    const t = this.requestHistory.filter((a) => e - a < 6e4).length, s = this.requestHistory.filter((a) => e - a < 36e5).length, r = this.requestHistory.filter((a) => e - a < 864e5).length, n = Math.ceil(e / 6e4) * 6e4, i = Math.ceil(e / 36e5) * 36e5, o = Math.ceil(e / 864e5) * 864e5;
    return {
      requestsInLastMinute: t,
      requestsInLastHour: s,
      requestsInLastDay: r,
      burstRequestsUsed: this.burstRequestsUsed,
      isLimited: this.isInCooldown || t >= this.config.maxRequestsPerMinute || s >= this.config.maxRequestsPerHour || r >= this.config.maxRequestsPerDay || this.burstRequestsUsed >= this.config.burstLimit,
      nextAvailableTime: this.isInCooldown ? this.cooldownEndTime : void 0,
      quotaResetTime: {
        minute: n,
        hour: i,
        day: o
      }
    };
  }
  /**
   * 更新配置
   */
  updateConfig(e) {
    this.config = { ...this.config, ...e };
  }
  /**
   * 重置所有计数器
   */
  reset() {
    this.requestHistory = [], this.burstRequestsUsed = 0, this.lastBurstReset = Date.now(), this.isInCooldown = !1, this.cooldownEndTime = 0;
  }
  /**
   * 启动冷却期
   */
  startCooldown() {
    this.isInCooldown = !0, this.cooldownEndTime = Date.now() + this.config.cooldownPeriod, console.warn(`[RateLimitManager] Cooldown period started, will end at ${new Date(this.cooldownEndTime).toISOString()}`);
  }
  /**
   * 清理过期的请求记录
   */
  cleanupExpiredRequests() {
    const t = Date.now() - 864e5;
    this.requestHistory = this.requestHistory.filter((s) => s > t);
  }
  /**
   * 检查并发出配额警告
   */
  checkQuotaWarnings(e) {
    e.requestsInLastMinute >= this.config.maxRequestsPerMinute * 0.8 && this.emit("quotaWarning", {
      type: "minute",
      usage: e.requestsInLastMinute,
      limit: this.config.maxRequestsPerMinute
    }), e.requestsInLastHour >= this.config.maxRequestsPerHour * 0.8 && this.emit("quotaWarning", {
      type: "hour",
      usage: e.requestsInLastHour,
      limit: this.config.maxRequestsPerHour
    }), e.requestsInLastDay >= this.config.maxRequestsPerDay * 0.8 && this.emit("quotaWarning", {
      type: "day",
      usage: e.requestsInLastDay,
      limit: this.config.maxRequestsPerDay
    });
  }
  /**
   * 启动清理定时器
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupExpiredRequests();
      const e = Date.now();
      e - this.lastBurstReset > 6e4 && (this.burstRequestsUsed = 0, this.lastBurstReset = e);
    }, 300 * 1e3);
  }
}
const be = new Ks();
class Qs {
  pluginId;
  apiServer;
  roomManager;
  databaseManager;
  configManager;
  onPluginFault;
  acfunApi;
  tokenManager;
  dataManager;
  constructor(e) {
    this.pluginId = e.pluginId, this.apiServer = e.apiServer, this.roomManager = e.roomManager, this.databaseManager = e.databaseManager, this.configManager = e.configManager, this.onPluginFault = e.onPluginFault, this.tokenManager = e.tokenManager || te.getInstance(), this.dataManager = ie.getInstance(), this.acfunApi = this.tokenManager.getApiInstance(), this.initializeAuthentication();
  }
  /**
   * 初始化认证
   */
  async initializeAuthentication() {
    try {
      this.tokenManager.isAuthenticated() ? console.log(`[ApiBridge] Plugin ${this.pluginId} initialized with authenticated API instance`) : console.warn(`[ApiBridge] Plugin ${this.pluginId} initialized without authentication`);
    } catch (e) {
      console.warn("[ApiBridge] Failed to initialize authentication:", e);
    }
  }
  /**
   * 规范化钩子名称，支持别名映射
   */
  normalizeHookName(e) {
    return {
      // 别名 → 实际钩子（与现有生命周期类型保持一致）
      "plugin.beforeStart": "afterLoaded",
      "plugin.afterStart": "afterLoaded",
      "plugin.beforeClose": "beforeUnloaded",
      "plugin.afterClose": "beforeUnloaded",
      // 页面钩子直接透传（这些已在 LifecycleHook 中定义）
      beforeUiOpen: "beforeUiOpen",
      afterUiOpen: "afterUiOpen",
      uiClosed: "uiClosed",
      beforeWindowOpen: "beforeWindowOpen",
      afterWindowOpen: "afterWindowOpen",
      windowClosed: "windowClosed",
      beforeOverlayOpen: "beforeOverlayOpen",
      afterOverlayOpen: "afterOverlayOpen",
      overlayClosed: "overlayClosed"
    }[e] || e;
  }
  /**
   * 订阅标准化事件，可选过滤；返回取消订阅函数。
   */
  subscribeEvents(e, t) {
    let s = 0, r = Date.now(), n = [];
    const i = (o) => {
      try {
        if (t?.rate_limit) {
          const a = Date.now();
          if (t.rate_limit.max_events_per_second) {
            if (a - r >= 1e3 && (s = 0, r = a), s >= t.rate_limit.max_events_per_second) {
              console.warn(`[ApiBridge] Event rate limit exceeded for plugin ${this.pluginId}: ${s} events/second`), this.onPluginFault("event-rate-limit-exceeded");
              return;
            }
            s++;
          }
          if (t.rate_limit.max_events_per_minute) {
            if (n = n.filter((c) => a - c < 6e4), n.length >= t.rate_limit.max_events_per_minute) {
              console.warn(`[ApiBridge] Event rate limit exceeded for plugin ${this.pluginId}: ${n.length} events/minute`), this.onPluginFault("event-rate-limit-exceeded");
              return;
            }
            n.push(a);
          }
        }
        if (!this.validateEvent(o)) {
          console.warn(`[ApiBridge] Invalid event data received for plugin ${this.pluginId}:`, o), this.onPluginFault("invalid-event-data");
          return;
        }
        if (t?.room_id && o.room_id !== t.room_id || t?.type && o.event_type !== t.type || t?.user_id && o.user_id !== t.user_id || t?.min_quality_score && es(o) < t.min_quality_score)
          return;
        if (t?.custom_filters && t.custom_filters.length > 0) {
          const a = wt.filter(
            (d) => t.custom_filters.includes(d.name)
          );
          Zt(o, a).passed;
        }
        this.safePluginCallback(() => e(o));
      } catch (a) {
        console.error(`[ApiBridge] Error in event handler for plugin ${this.pluginId}:`, a), this.onPluginFault("event-handler-error");
      }
    };
    return this.roomManager.on("event", i), () => this.roomManager.off("event", i);
  }
  /**
   * 生命周期钩子 API 暴露给插件
   */
  lifecycle = {
    on: (e, t, s) => {
      const r = this.normalizeHookName(e);
      return ge.registerHook(r, async (n) => {
        n.pluginId && n.pluginId !== this.pluginId || await t(n);
      }, { priority: s?.priority, pluginId: this.pluginId });
    },
    off: (e) => ge.unregisterHook(e)
  };
  /**
   * 验证事件数据的完整性和有效性
   */
  validateEvent(e) {
    if (!e || typeof e != "object" || !e.event_type || typeof e.event_type != "string" || !e.ts || typeof e.ts != "number" || !e.room_id || typeof e.room_id != "string") return !1;
    const t = Date.now(), s = 1440 * 60 * 1e3;
    if (e.ts > t + 6e4 || e.ts < t - s)
      return !1;
    switch (e.event_type) {
      case "danmaku":
        return this.validateCommentEvent(e);
      case "gift":
        return this.validateGiftEvent(e);
      case "enter":
      case "follow":
      case "like":
        return this.validateUserEvent(e);
      default:
        return !0;
    }
  }
  /**
   * 验证评论事件
   */
  validateCommentEvent(e) {
    return !(!e.content || typeof e.content != "string" || !e.user_id || typeof e.user_id != "string" || !e.user_name || typeof e.user_name != "string" || e.content.length > 1e3);
  }
  /**
   * 验证礼物事件
   */
  validateGiftEvent(e) {
    return !(!e.user_id || typeof e.user_id != "string" || !e.user_name || typeof e.user_name != "string" || e.content && typeof e.content != "string");
  }
  /**
   * 验证用户事件
   */
  validateUserEvent(e) {
    return !(!e.user_id || typeof e.user_id != "string" || !e.user_name || typeof e.user_name != "string");
  }
  /**
   * 安全地调用插件回调函数
   */
  safePluginCallback(e) {
    try {
      setTimeout(e, 0);
    } catch (t) {
      console.error(`[ApiBridge] Plugin callback error for ${this.pluginId}:`, t), this.onPluginFault("callback-execution-error");
    }
  }
  sendRender(e, t) {
    try {
      const s = `plugin:${this.pluginId}:overlay`;
      se.getInstance().queueOrPublish(s, { event: String(e), payload: t }, { ttlMs: 120 * 1e3, persist: !1, meta: { kind: "mainMessage" } });
    } catch {
    }
  }
  // onMessage 已废除，请使用 onUiMessage 或 onMainMessage
  /**
   * 代表插件调用 AcFun API。使用 acfunlive-http-api 进行统一的 API 调用。
   */
  async callAcfun(e) {
    const t = await be.canMakeRequest();
    if (!t.allowed) {
      const s = new Error(`RATE_LIMIT_EXCEEDED: ${t.reason}`);
      throw s.waitTime = t.waitTime, this.onPluginFault("rate-limit-exceeded"), s;
    }
    await this.ensureValidAuthentication();
    try {
      be.recordRequest();
      const s = this.acfunApi.getHttpClient();
      let r;
      switch (e.method) {
        case "GET":
          r = await s.get(e.path);
          break;
        case "POST":
          r = await s.post(e.path, e.body);
          break;
        case "PUT":
          r = await s.put(e.path, e.body);
          break;
        case "DELETE":
          r = await s.delete(e.path);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${e.method}`);
      }
      if (!r.success) {
        const n = r.statusCode || (r.error?.includes("429") ? 429 : r.error?.includes("503") ? 503 : void 0);
        if (n && be.recordError(n), r.error && (r.error.includes("401") || r.error.includes("unauthorized"))) {
          console.warn("[ApiBridge] Authentication failed, clearing expired token"), await this.tokenManager.logout();
          const o = new Error("ACFUN_TOKEN_EXPIRED");
          throw this.onPluginFault("token-expired"), o;
        }
        const i = new Error(`ACFUN_API_ERROR: ${r.error || "Unknown error"}`);
        throw this.onPluginFault("acfun-api-error"), i;
      }
      return r.data;
    } catch (s) {
      if (s.message?.includes("503") || s.message?.includes("429")) {
        const n = s.message.includes("429") ? 429 : 503;
        be.recordError(n);
      }
      const r = new Error(`ACFUN_API_ERROR: ${s.message || "Unknown error"}`);
      throw this.onPluginFault("acfun-api-error"), r;
    }
  }
  /**
   * 确保认证状态有效
   */
  async ensureValidAuthentication() {
    try {
      if (!this.tokenManager.isAuthenticated()) {
        const t = new Error("ACFUN_NOT_LOGGED_IN");
        throw this.onPluginFault("missing-token"), t;
      }
      const e = await this.tokenManager.getTokenInfo();
      if ((!e || !e.isValid) && (console.warn("[ApiBridge] Token invalid or expired, attempting refresh"), !(await this.tokenManager.refreshToken()).success)) {
        const s = new Error("ACFUN_TOKEN_REFRESH_FAILED");
        throw this.onPluginFault("token-refresh-failed"), s;
      }
      console.log(`[ApiBridge] Authentication validated for plugin ${this.pluginId}`);
    } catch (e) {
      throw console.error("[ApiBridge] Authentication validation failed:", e), e;
    }
  }
  async invokeAcfun(e) {
    const t = await be.canMakeRequest();
    if (!t.allowed) {
      const r = new Error(`RATE_LIMIT_EXCEEDED: ${t.reason}`);
      throw r.waitTime = t.waitTime, this.onPluginFault("rate-limit-exceeded"), r;
    }
    await this.ensureValidAuthentication(), be.recordRequest();
    const s = await e();
    if (!s?.success) {
      const r = s?.error?.includes?.("429") ? 429 : s?.error?.includes?.("503") ? 503 : void 0;
      if (r && be.recordError(r), s?.error && (s.error.includes("401") || s.error.includes("unauthorized"))) {
        await this.tokenManager.logout();
        const i = new Error("ACFUN_TOKEN_EXPIRED");
        throw this.onPluginFault("token-expired"), i;
      }
      const n = new Error(`ACFUN_API_ERROR: ${s?.error || "Unknown error"}`);
      throw this.onPluginFault("acfun-api-error"), n;
    }
    return s?.data;
  }
  /**
   * 插件存储：写入统一的 plugin_storage 表。
   */
  async pluginStorageWrite(e) {
    await this.pluginStorage.write(e);
  }
  pluginStorage = {
    write: async (e) => {
      const t = this.databaseManager.getDb(), s = "plugin_storage";
      await new Promise((r, n) => {
        t.run(
          `CREATE TABLE IF NOT EXISTS ${s} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plugin_id TEXT NOT NULL,
            createTime INTEGER NOT NULL,
            data TEXT NOT NULL
          )`,
          (i) => i ? n(i) : r()
        );
      }), await new Promise((r, n) => {
        t.run(
          `INSERT INTO ${s} (plugin_id, createTime, data) VALUES (?, ?, ?)`,
          [this.pluginId, Date.now(), JSON.stringify(e ?? {})],
          (i) => i ? n(i) : r()
        );
      });
    },
    read: async (e, t) => {
      const s = this.databaseManager.getDb(), r = "plugin_storage", n = Math.max(0, Number(t ?? 100)), i = (e || "").trim(), o = ["plugin_id = ?"], a = [this.pluginId];
      i && (o.push("data LIKE ?"), a.push(`%${i.replace(/%/g, "")}%`));
      const c = `SELECT id, plugin_id, createTime, data FROM ${r} WHERE ${o.join(" AND ")} ORDER BY id DESC ${n > 0 ? "LIMIT " + n : ""}`;
      return (await new Promise((w, v) => {
        s.all(c, a, (_, b) => _ ? v(_) : w(b || []));
      })).map((w) => ({ id: Number(w.id), plugin_id: String(w.plugin_id), createTime: Number(w.createTime), data: f(w.data) }));
      function f(w) {
        try {
          return JSON.parse(String(w || "{}"));
        } catch {
          return {};
        }
      }
    },
    size: async () => {
      const e = this.databaseManager.getDb(), s = "SELECT COUNT(*) AS c FROM plugin_storage WHERE plugin_id = ?", r = await new Promise((n, i) => {
        e.get(s, [this.pluginId], (o, a) => o ? i(o) : n(a));
      });
      return Number(r && (r.c || r["COUNT(*)"]) || 0);
    },
    remove: async (e) => {
      const t = this.databaseManager.getDb(), s = "plugin_storage", r = Array.isArray(e) ? e.filter((c) => Number.isFinite(c)).map((c) => Number(c)) : [];
      if (r.length === 0) return 0;
      const n = r.map(() => "?").join(","), i = `DELETE FROM ${s} WHERE plugin_id = ? AND id IN (${n})`, o = [this.pluginId, ...r];
      return await new Promise((c, d) => {
        t.run(i, o, function(f) {
          f ? d(f) : c(Number(this?.changes ?? 0));
        });
      });
    }
  };
  /**
   * 路由注册：强制前缀 `/plugins/:id/*`，由主进程统一挂载。
   */
  registerHttpRoute(e, t) {
    this.apiServer.registerPluginRoute(this.pluginId, e, t);
  }
  /**
   * 认证API实现
   */
  auth = {
    isAuthenticated: () => this.tokenManager.isAuthenticated(),
    getTokenInfo: () => this.tokenManager.getTokenInfo(),
    refreshToken: async () => this.tokenManager.refreshToken()
  };
  acfun = {
    user: {
      getUserInfo: async (e) => this.invokeAcfun(() => this.acfunApi.user.getUserInfo(e)),
      getWalletInfo: async () => this.invokeAcfun(() => this.acfunApi.user.getWalletInfo())
    },
    danmu: {
      startDanmu: async (e, t) => {
        const s = this.databaseManager.getDb(), r = new (require("../persistence/DanmuSQLiteWriter")).DanmuSQLiteWriter(s);
        let n = null, i = null;
        const o = (c) => {
          try {
            if (!i && n && this.acfunApi?.danmu) {
              const d = this.acfunApi.danmu.getSessionDetail(n);
              d && d.success && d.data && (i = String(d.data.liveID || ""));
            }
            i && r.handleEvent(String(i), c);
          } catch {
          }
          try {
            typeof t == "function" && t(c);
          } catch {
          }
        }, a = await this.invokeAcfun(() => this.acfunApi.danmu.startDanmu(e, o));
        try {
          if (a && a.success && a.data && (n = String(a.data.sessionId || ""), n && this.acfunApi?.danmu)) {
            const c = this.acfunApi.danmu.getSessionDetail(n);
            c && c.success && c.data && (i = String(c.data.liveID || ""));
          }
        } catch {
        }
        return a;
      },
      stopDanmu: async (e) => this.invokeAcfun(() => this.acfunApi.danmu.stopDanmu(e)),
      getLiveRoomInfo: async (e) => this.invokeAcfun(() => this.acfunApi.danmu.getLiveRoomInfo(e))
    },
    live: {
      checkLivePermission: async () => this.invokeAcfun(() => this.acfunApi.live.checkLivePermission()),
      getStreamUrl: async (e) => this.invokeAcfun(() => this.acfunApi.live.getStreamUrl(e)),
      getStreamSettings: async () => this.invokeAcfun(() => this.acfunApi.live.getStreamSettings()),
      getLiveStreamStatus: async () => this.invokeAcfun(() => this.acfunApi.live.getLiveStreamStatus()),
      startLiveStream: async (e, t, s, r, n, i, o) => this.invokeAcfun(
        () => this.acfunApi.live.startLiveStream(
          e,
          t || "",
          s,
          !!r,
          !!n,
          i,
          o
        )
      ),
      stopLiveStream: async (e) => this.invokeAcfun(() => this.acfunApi.live.stopLiveStream(e)),
      updateLiveRoom: async (e, t, s) => this.invokeAcfun(() => this.acfunApi.live.updateLiveRoom(e, t || "", s)),
      getLiveStatistics: async (e) => this.invokeAcfun(() => this.acfunApi.live.getLiveStatistics(e)),
      getSummary: async (e) => this.invokeAcfun(() => this.acfunApi.live.getSummary(e)),
      getHotLives: async (e, t, s) => this.invokeAcfun(() => this.acfunApi.live.getHotLives(e, t || 1, s || 20)),
      getLiveCategories: async () => this.invokeAcfun(() => this.acfunApi.live.getLiveCategories()),
      getUserLiveInfo: async (e) => this.invokeAcfun(() => this.acfunApi.live.getUserLiveInfo(e)),
      checkLiveClipPermission: async () => this.invokeAcfun(() => this.acfunApi.live.checkLiveClipPermission()),
      setLiveClipPermission: async (e) => this.invokeAcfun(() => this.acfunApi.live.setLiveClipPermission(!!e))
    },
    gift: {
      getAllGiftList: async () => this.invokeAcfun(() => this.acfunApi.gift.getAllGiftList()),
      getLiveGiftList: async (e) => this.invokeAcfun(() => this.acfunApi.gift.getLiveGiftList(e))
    },
    manager: {
      getManagerList: async () => this.invokeAcfun(() => this.acfunApi.manager.getManagerList()),
      addManager: async (e) => this.invokeAcfun(() => this.acfunApi.manager.addManager(e)),
      deleteManager: async (e) => this.invokeAcfun(() => this.acfunApi.manager.deleteManager(e)),
      getAuthorKickRecords: async (e, t, s) => this.invokeAcfun(() => this.acfunApi.manager.getAuthorKickRecords(e, t || 20, s || 1)),
      authorKick: async (e, t) => this.invokeAcfun(() => this.acfunApi.manager.authorKick(e, t)),
      managerKick: async (e, t) => this.invokeAcfun(() => this.acfunApi.manager.managerKick(e, t))
    },
    replay: {
      getLiveReplay: async (e) => this.invokeAcfun(() => this.acfunApi.replay.getLiveReplay(e))
    },
    livePreview: {
      getLivePreviewList: async () => this.invokeAcfun(() => this.acfunApi.livePreview.getLivePreviewList())
    },
    badge: {
      getBadgeDetail: async (e) => this.invokeAcfun(() => this.acfunApi.badge.getBadgeDetail(e)),
      getBadgeList: async () => this.invokeAcfun(() => this.acfunApi.badge.getBadgeList()),
      getBadgeRank: async (e) => this.invokeAcfun(() => this.acfunApi.badge.getBadgeRank(e)),
      getWornBadge: async (e) => this.invokeAcfun(() => this.acfunApi.badge.getWornBadge(e)),
      wearBadge: async (e) => this.invokeAcfun(() => this.acfunApi.badge.wearBadge(e)),
      unwearBadge: async () => this.invokeAcfun(() => this.acfunApi.badge.unwearBadge())
    }
  };
}
class Js extends fe {
  config;
  workers = /* @__PURE__ */ new Map();
  pluginWorkers = /* @__PURE__ */ new Map();
  // pluginId -> workerIds
  idleWorkers = /* @__PURE__ */ new Set();
  cleanupInterval;
  constructor(e = {}) {
    super(), this.config = {
      maxWorkers: e.maxWorkers || 10,
      idleTimeout: e.idleTimeout || 3e5,
      // 5 minutes
      maxMemoryUsage: e.maxMemoryUsage || 100 * 1024 * 1024,
      // 100MB
      maxExecutionTime: e.maxExecutionTime || 3e4
      // 30 seconds
    }, this.setupCleanupInterval(), m.info("WorkerPoolManager initialized", void 0, { config: this.config });
  }
  setupCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleWorkers();
    }, 6e4);
  }
  cleanupIdleWorkers() {
    const e = Date.now(), t = [];
    for (const [s, r] of Array.from(this.workers.entries()))
      r.status === "idle" && e - r.lastUsed > this.config.idleTimeout && t.push(s);
    for (const s of t)
      this.terminateWorker(s, "idle_timeout");
    t.length > 0 && m.info("Cleaned up idle workers", void 0, {
      count: t.length,
      workerIds: t
    });
  }
  async createWorker(e, t, s) {
    if (this.workers.size >= this.config.maxWorkers)
      throw this.emit("pool.full", { requestedPluginId: e }), new Error(`Worker pool is full (max: ${this.config.maxWorkers})`);
    const r = ae.randomUUID(), n = () => {
      const a = "plugin-worker.cjs";
      return R.isPackaged ? I.join(process.resourcesPath, "app", "packages", "main", "dist", "worker", a) : I.join(R.getAppPath(), "packages", "main", "dist", "worker", a);
    }, i = [
      // Primary path using Electron standard API
      n(),
      // Fallback: try alternative extensions
      n().replace(".cjs", ".js"),
      // Source path for development runs
      I.resolve(process.cwd(), "packages", "main", "src", "plugins", "worker", "plugin-worker.js")
    ], o = i.find((a) => {
      try {
        return S.existsSync(a);
      } catch {
        return !1;
      }
    }) || i[0];
    try {
      const a = new $t(o, {
        workerData: {
          pluginId: e,
          pluginPath: t,
          workerId: r,
          config: {
            maxMemoryUsage: this.config.maxMemoryUsage,
            maxExecutionTime: this.config.maxExecutionTime
          },
          sandboxConfig: s || null
        }
      }), c = {
        workerId: r,
        pluginId: e,
        worker: a,
        status: "idle",
        createdAt: Date.now(),
        lastUsed: Date.now(),
        memoryUsage: 0,
        executionCount: 0
      };
      return this.setupWorkerEventHandlers(c), this.workers.set(r, c), this.idleWorkers.add(r), this.pluginWorkers.has(e) || this.pluginWorkers.set(e, /* @__PURE__ */ new Set()), this.pluginWorkers.get(e).add(r), this.emit("worker.created", { workerId: r, pluginId: e }), m.info("Worker created", e, { workerId: r, pluginId: e }), r;
    } catch (a) {
      throw m.error("Failed to create worker", e, a instanceof Error ? a : new Error(String(a)), {
        workerId: r,
        pluginId: e,
        error: a instanceof Error ? a.message : String(a)
      }), a;
    }
  }
  setupWorkerEventHandlers(e) {
    const { worker: t, workerId: s, pluginId: r } = e;
    t.on("message", (n) => {
      this.handleWorkerMessage(s, n);
    }), t.on("error", (n) => {
      m.error("Worker error", r, n, { workerId: s, pluginId: r, error: n.message }), this.updateWorkerStatus(s, "error"), this.emit("worker.error", { workerId: s, pluginId: r, error: n });
    }), t.on("exit", (n) => {
      m.info("Worker exited", r, { workerId: s, pluginId: r, code: n }), this.removeWorker(s);
    });
  }
  handleWorkerMessage(e, t) {
    const s = this.workers.get(e);
    if (s)
      switch (t.type) {
        case "plugin_log": {
          const r = String(t.level || "info").toLowerCase(), n = String(t.message || ""), i = s.pluginId;
          try {
            switch (r) {
              case "error":
                m.error(n, i);
                break;
              case "warn":
                m.warn(n, i);
                break;
              case "debug":
                m.debug(n, i);
                break;
              default:
                m.info(n, i);
                break;
            }
          } catch {
          }
          break;
        }
        case "status":
          this.updateWorkerStatus(e, t.status);
          break;
        case "memory_usage":
          s.memoryUsage = t.usage, t.usage > this.config.maxMemoryUsage && m.warn("Worker memory usage exceeded limit", s.pluginId, {
            workerId: e,
            pluginId: s.pluginId,
            usage: t.usage,
            limit: this.config.maxMemoryUsage
          });
          break;
        case "execution_complete":
          s.executionCount++, s.lastUsed = Date.now(), this.updateWorkerStatus(e, "idle");
          break;
      }
  }
  updateWorkerStatus(e, t) {
    const s = this.workers.get(e);
    if (!s) return;
    const r = s.status;
    s.status = t, t === "idle" && r !== "idle" ? (this.idleWorkers.add(e), this.emit("worker.idle", { workerId: e, pluginId: s.pluginId })) : t === "busy" && r === "idle" && (this.idleWorkers.delete(e), this.emit("worker.busy", { workerId: e, pluginId: s.pluginId }));
  }
  getAvailableWorker(e) {
    const t = this.pluginWorkers.get(e);
    if (!t) return null;
    const s = Array.from(t);
    for (const r of s) {
      const n = this.workers.get(r);
      if (n && n.status === "idle")
        return r;
    }
    return null;
  }
  async executeInWorker(e, t, s = [], r, n) {
    const i = this.workers.get(e);
    if (!i)
      throw new Error(`Worker ${e} not found`);
    if (i.status !== "idle")
      throw new Error(`Worker ${e} is not available (status: ${i.status})`);
    return this.updateWorkerStatus(e, "busy"), new Promise((o, a) => {
      const c = r || this.config.maxExecutionTime, d = setTimeout(() => {
        a(new Error(`Worker execution timeout (${c}ms)`)), this.terminateWorker(e, "execution_timeout");
      }, c), f = (w) => {
        w.type === "result" && (clearTimeout(d), i.worker.off("message", f), w.error ? a(new Error(w.error)) : o(w.result));
      };
      i.worker.on("message", f), i.worker.postMessage({
        type: "execute",
        method: t,
        args: s,
        optional: !!n
      });
    });
  }
  terminateWorker(e, t) {
    const s = this.workers.get(e);
    if (s) {
      try {
        s.worker.terminate();
      } catch (r) {
        m.error("Error terminating worker", e, r instanceof Error ? r : new Error(String(r)), {
          workerId: e,
          error: r instanceof Error ? r.message : String(r)
        });
      }
      this.removeWorker(e), this.emit("worker.terminated", {
        workerId: e,
        pluginId: s.pluginId,
        reason: t
      });
    }
  }
  removeWorker(e) {
    const t = this.workers.get(e);
    if (!t) return;
    this.workers.delete(e), this.idleWorkers.delete(e);
    const s = this.pluginWorkers.get(t.pluginId);
    s && (s.delete(e), s.size === 0 && this.pluginWorkers.delete(t.pluginId));
  }
  terminateAllWorkersForPlugin(e) {
    const t = this.pluginWorkers.get(e);
    if (!t) return;
    const s = Array.from(t);
    for (const r of s)
      this.terminateWorker(r, "plugin_disabled");
    m.info("Terminated all workers for plugin", e, {
      pluginId: e,
      count: s.length
    });
  }
  getWorkerStats() {
    const e = {
      total: this.workers.size,
      idle: 0,
      busy: 0,
      error: 0,
      byPlugin: {}
    }, t = Array.from(this.workers.values());
    for (const s of t) {
      switch (s.status) {
        case "idle":
          e.idle++;
          break;
        case "busy":
          e.busy++;
          break;
        case "error":
          e.error++;
          break;
      }
      e.byPlugin[s.pluginId] = (e.byPlugin[s.pluginId] || 0) + 1;
    }
    return e;
  }
  cleanup() {
    this.cleanupInterval && clearInterval(this.cleanupInterval);
    const e = Array.from(this.workers.keys());
    for (const t of e)
      this.terminateWorker(t, "cleanup");
    m.info("WorkerPoolManager cleanup completed", void 0, {
      totalWorkers: this.workers.size,
      activeWorkers: Array.from(this.workers.values()).filter((t) => t.status === "busy").length
    });
  }
}
class Ys extends fe {
  config;
  channels = /* @__PURE__ */ new Map();
  pendingMessages = /* @__PURE__ */ new Map();
  rateLimiters = /* @__PURE__ */ new Map();
  encryptionKey;
  signingKey;
  constructor(e = {}) {
    super(), this.config = {
      enableEncryption: e.enableEncryption || !1,
      enableSigning: e.enableSigning || !0,
      maxMessageSize: e.maxMessageSize || 1024 * 1024,
      // 1MB
      messageTimeout: e.messageTimeout || 3e4,
      // 30 seconds
      rateLimitPerSecond: e.rateLimitPerSecond || 100
    }, this.config.enableEncryption && (this.encryptionKey = ae.randomBytes(32)), this.config.enableSigning && (this.signingKey = ae.randomBytes(64)), m.info("SecureCommunicationChannel initialized", void 0, {
      config: this.config
    });
  }
  createChannel(e, t, s) {
    if (this.channels.has(e))
      throw new Error(`Channel ${e} already exists`);
    const r = {
      channelId: e,
      pluginId: t,
      worker: s,
      createdAt: Date.now(),
      messageCount: 0,
      lastActivity: Date.now()
    };
    this.channels.set(e, r), this.rateLimiters.set(e, new Zs(this.config.rateLimitPerSecond)), s.on("message", (n) => {
      this.handleWorkerMessage(e, n);
    }), s.on("error", (n) => {
      this.emit("channel.error", { channelId: e, error: n });
    }), m.info("Communication channel created", t, { channelId: e, pluginId: t });
  }
  removeChannel(e) {
    const t = this.channels.get(e);
    if (t) {
      for (const [s, r] of this.pendingMessages)
        r.channelId === e && (clearTimeout(r.timeoutId), this.pendingMessages.delete(s));
      this.channels.delete(e), this.rateLimiters.delete(e), m.info("Communication channel removed", t.pluginId, {
        channelId: e,
        pluginId: t.pluginId
      });
    }
  }
  async sendMessage(e, t, s, r = !1) {
    const n = this.channels.get(e);
    if (!n)
      throw new Error(`Channel ${e} not found`);
    const i = this.rateLimiters.get(e);
    if (i && !i.allowRequest())
      throw this.emit("rate.limit.exceeded", { channelId: e, pluginId: n.pluginId }), new Error(`Rate limit exceeded for channel ${e}`);
    const o = {
      id: ae.randomUUID(),
      type: t,
      payload: s,
      timestamp: Date.now()
    }, a = Buffer.byteLength(JSON.stringify(o));
    if (a > this.config.maxMessageSize)
      throw new Error(`Message size ${a} exceeds limit ${this.config.maxMessageSize}`);
    await this.secureMessage(o);
    try {
      if (n.worker.postMessage(o), n.messageCount++, n.lastActivity = Date.now(), this.emit("message.sent", { channelId: e, message: o }), r)
        return this.waitForResponse(e, o.id);
    } catch (c) {
      const d = `Failed to send message - channelId: ${e}, messageId: ${o.id}, error: ${c instanceof Error ? c.message : String(c)}`;
      throw m.error(d), c;
    }
  }
  async secureMessage(e) {
    this.config.enableEncryption && this.encryptionKey && (e.payload = await this.encryptPayload(e.payload), e.encrypted = !0), this.config.enableSigning && this.signingKey && (e.signature = this.signMessage(e));
  }
  async encryptPayload(e) {
    const t = ae.randomBytes(16), s = ae.createCipheriv("aes-256-cbc", this.encryptionKey, t);
    let r = s.update(JSON.stringify(e), "utf8", "hex");
    return r += s.final("hex"), t.toString("hex") + ":" + r;
  }
  async decryptPayload(e) {
    const [t, s] = e.split(":"), r = Buffer.from(t, "hex"), n = ae.createDecipheriv("aes-256-cbc", this.encryptionKey, r);
    let i = n.update(s, "hex", "utf8");
    return i += n.final("utf8"), JSON.parse(i);
  }
  signMessage(e) {
    const t = JSON.stringify({
      id: e.id,
      type: e.type,
      payload: e.payload,
      timestamp: e.timestamp
    });
    return ae.createHmac("sha256", this.signingKey).update(t).digest("hex");
  }
  verifySignature(e) {
    if (!e.signature || !this.signingKey) return !1;
    const t = this.signMessage({
      ...e,
      signature: void 0
    });
    return ae.timingSafeEqual(
      Buffer.from(e.signature, "hex"),
      Buffer.from(t, "hex")
    );
  }
  async handleWorkerMessage(e, t) {
    const s = this.channels.get(e);
    if (s)
      try {
        if (!t || typeof t != "object" || !("id" in t) || !("type" in t) || !("timestamp" in t))
          return;
        if (this.config.enableSigning && t.signature && !this.verifySignature(t))
          throw new Error("Message signature verification failed");
        t.encrypted && this.config.enableEncryption && (t.payload = await this.decryptPayload(t.payload)), s.lastActivity = Date.now(), this.emit("message.received", { channelId: e, message: t });
        const r = this.pendingMessages.get(t.id);
        r && (clearTimeout(r.timeoutId), this.pendingMessages.delete(t.id), r.resolve(t.payload));
      } catch (r) {
        m.error("Error handling worker message", void 0, r instanceof Error ? r : new Error(String(r)), {
          channelId: e,
          messageId: t.id,
          error: r instanceof Error ? r.message : String(r)
        }), this.emit("channel.error", {
          channelId: e,
          error: r instanceof Error ? r : new Error(String(r))
        });
      }
  }
  waitForResponse(e, t) {
    return new Promise((s, r) => {
      const n = setTimeout(() => {
        this.pendingMessages.delete(t), this.emit("message.timeout", { channelId: e, messageId: t }), r(new Error(`Message timeout: ${t}`));
      }, this.config.messageTimeout);
      this.pendingMessages.set(t, {
        channelId: e,
        messageId: t,
        resolve: s,
        reject: r,
        timeoutId: n,
        createdAt: Date.now()
      });
    });
  }
  getChannelStats(e) {
    const t = this.channels.get(e);
    if (!t) return null;
    const s = this.rateLimiters.get(e);
    return {
      channelId: e,
      pluginId: t.pluginId,
      messageCount: t.messageCount,
      lastActivity: t.lastActivity,
      uptime: Date.now() - t.createdAt,
      pendingMessages: Array.from(this.pendingMessages.values()).filter((r) => r.channelId === e).length,
      rateLimitRemaining: s ? s.getRemainingRequests() : 0
    };
  }
  getAllChannelStats() {
    return Array.from(this.channels.keys()).map((e) => this.getChannelStats(e)).filter((e) => e !== null);
  }
  cleanup() {
    for (const t of Array.from(this.pendingMessages.values()))
      clearTimeout(t.timeoutId);
    this.pendingMessages.clear();
    const e = Array.from(this.channels.keys());
    for (const t of e)
      this.removeChannel(t);
    m.info("SecureCommunicationChannel cleanup completed");
  }
}
class Zs {
  requests = [];
  maxRequests;
  constructor(e) {
    this.maxRequests = e;
  }
  allowRequest() {
    const e = Date.now(), t = e - 1e3;
    return this.requests = this.requests.filter((s) => s > t), this.requests.length >= this.maxRequests ? !1 : (this.requests.push(e), !0);
  }
  getRemainingRequests() {
    const t = Date.now() - 1e3, s = this.requests.filter((r) => r > t);
    return Math.max(0, this.maxRequests - s.length);
  }
}
var le = /* @__PURE__ */ ((g) => (g.LOAD_FAILED = "load_failed", g.INSTALL_FAILED = "install_failed", g.UNINSTALL_FAILED = "uninstall_failed", g.ENABLE_FAILED = "enable_failed", g.DISABLE_FAILED = "disable_failed", g.RUNTIME_ERROR = "runtime_error", g.DEPENDENCY_ERROR = "dependency_error", g.MANIFEST_ERROR = "manifest_error", g.PERMISSION_ERROR = "permission_error", g.NETWORK_ERROR = "network_error", g))(le || {}), $e = /* @__PURE__ */ ((g) => (g.RETRY = "retry", g.DISABLE = "disable", g.UNINSTALL = "uninstall", g.IGNORE = "ignore", g.REINSTALL = "reinstall", g))($e || {});
class er extends ce {
  errorHistory = /* @__PURE__ */ new Map();
  retryCount = /* @__PURE__ */ new Map();
  recoveryStrategies = /* @__PURE__ */ new Map();
  constructor() {
    super(), this.initializeRecoveryStrategies();
  }
  /**
   * 初始化恢复策略
   */
  initializeRecoveryStrategies() {
    const e = [
      ["load_failed", {
        errorType: "load_failed",
        maxRetries: 3,
        retryDelay: 1e3,
        autoRecovery: !0,
        fallbackAction: "disable"
        /* DISABLE */
      }],
      ["install_failed", {
        errorType: "install_failed",
        maxRetries: 2,
        retryDelay: 2e3,
        autoRecovery: !1,
        fallbackAction: "ignore"
        /* IGNORE */
      }],
      ["runtime_error", {
        errorType: "runtime_error",
        maxRetries: 1,
        retryDelay: 500,
        autoRecovery: !0,
        fallbackAction: "disable"
        /* DISABLE */
      }],
      ["dependency_error", {
        errorType: "dependency_error",
        maxRetries: 0,
        retryDelay: 0,
        autoRecovery: !1,
        fallbackAction: "disable"
        /* DISABLE */
      }],
      ["manifest_error", {
        errorType: "manifest_error",
        maxRetries: 0,
        retryDelay: 0,
        autoRecovery: !1,
        fallbackAction: "uninstall"
        /* UNINSTALL */
      }],
      ["permission_error", {
        errorType: "permission_error",
        maxRetries: 1,
        retryDelay: 1e3,
        autoRecovery: !1,
        fallbackAction: "disable"
        /* DISABLE */
      }],
      ["network_error", {
        errorType: "network_error",
        maxRetries: 3,
        retryDelay: 5e3,
        autoRecovery: !0,
        fallbackAction: "ignore"
        /* IGNORE */
      }]
    ];
    for (const [t, s] of e)
      this.recoveryStrategies.set(t, s);
  }
  /**
   * 处理插件错误
   */
  async handleError(e, t, s, r, n) {
    const i = {
      pluginId: e,
      type: t,
      message: s,
      error: r,
      timestamp: Date.now(),
      context: n,
      recoveryActions: this.getAvailableRecoveryActions(t)
    };
    return this.recordError(i), m.error(
      `Plugin error: ${s}`,
      e,
      r,
      { errorType: t, context: n }
    ), this.emit("plugin-error", i), await this.attemptRecovery(i);
  }
  /**
   * 记录错误
   */
  recordError(e) {
    this.errorHistory.has(e.pluginId) || this.errorHistory.set(e.pluginId, []);
    const t = this.errorHistory.get(e.pluginId);
    t.push(e), t.length > 50 && t.splice(0, t.length - 50);
  }
  /**
   * 尝试自动恢复
   */
  async attemptRecovery(e) {
    const t = this.recoveryStrategies.get(e.type);
    if (!t)
      return m.warn(`No recovery strategy for error type: ${e.type}`, e.pluginId), "ignore";
    const s = `${e.pluginId}:${e.type}`, r = this.retryCount.get(s) || 0;
    return t.autoRecovery && r < t.maxRetries ? (this.retryCount.set(s, r + 1), m.info(
      `Attempting auto-recovery for plugin (attempt ${r + 1}/${t.maxRetries})`,
      e.pluginId,
      { errorType: e.type, strategy: "retry" }
    ), t.retryDelay > 0 && await new Promise((n) => setTimeout(n, t.retryDelay)), this.emit("recovery-attempt", {
      pluginId: e.pluginId,
      action: "retry",
      attempt: r + 1,
      maxAttempts: t.maxRetries
    }), "retry") : (m.warn(
      `Auto-recovery failed or not available, executing fallback action: ${t.fallbackAction}`,
      e.pluginId,
      { errorType: e.type, retries: r }
    ), this.emit("recovery-fallback", {
      pluginId: e.pluginId,
      action: t.fallbackAction,
      reason: r >= t.maxRetries ? "max_retries_exceeded" : "auto_recovery_disabled"
    }), t.fallbackAction);
  }
  /**
   * 获取可用的恢复操作
   */
  getAvailableRecoveryActions(e) {
    const t = [
      "ignore"
      /* IGNORE */
    ];
    switch (e) {
      case "load_failed":
      case "runtime_error":
        return [
          ...t,
          "retry",
          "disable",
          "reinstall"
          /* REINSTALL */
        ];
      case "install_failed":
        return [
          ...t,
          "retry"
          /* RETRY */
        ];
      case "dependency_error":
        return [
          ...t,
          "disable",
          "uninstall"
          /* UNINSTALL */
        ];
      case "manifest_error":
        return [
          ...t,
          "uninstall"
          /* UNINSTALL */
        ];
      case "permission_error":
        return [
          ...t,
          "retry",
          "disable"
          /* DISABLE */
        ];
      case "network_error":
        return [
          ...t,
          "retry"
          /* RETRY */
        ];
      default:
        return t;
    }
  }
  /**
   * 手动执行恢复操作
   */
  async executeRecoveryAction(e, t, s) {
    try {
      return m.info(
        `Executing manual recovery action: ${t}`,
        e,
        s
      ), this.emit("recovery-execute", {
        pluginId: e,
        action: t,
        manual: !0,
        context: s
      }), !0;
    } catch (r) {
      return m.error(
        `Failed to execute recovery action: ${t}`,
        e,
        r,
        s
      ), !1;
    }
  }
  /**
   * 重置插件的重试计数
   */
  resetRetryCount(e, t) {
    if (t) {
      const s = `${e}:${t}`;
      this.retryCount.delete(s);
    } else
      for (const s of Array.from(this.retryCount.keys()))
        s.startsWith(`${e}:`) && this.retryCount.delete(s);
    m.info(
      "Reset retry count for plugin",
      e,
      { errorType: t || "all" }
    );
  }
  /**
   * 获取插件的错误历史
   */
  getErrorHistory(e) {
    return this.errorHistory.get(e) || [];
  }
  /**
   * 获取所有插件的错误统计
   */
  getErrorStats() {
    const e = {};
    for (const [t, s] of Array.from(this.errorHistory.entries())) {
      const r = {
        total: s.length,
        byType: {}
      };
      for (const n of s)
        r.byType[n.type] = (r.byType[n.type] || 0) + 1;
      e[t] = r;
    }
    return e;
  }
  /**
   * 清理旧的错误记录
   */
  cleanup(e = 10080 * 60 * 1e3) {
    const t = Date.now() - e;
    for (const [s, r] of Array.from(this.errorHistory.entries())) {
      const n = r.filter((i) => i.timestamp > t);
      n.length === 0 ? this.errorHistory.delete(s) : this.errorHistory.set(s, n);
    }
    m.info("Cleaned up old error records", void 0, { cutoffTime: t, maxAge: e });
  }
  /**
   * 更新恢复策略
   */
  updateRecoveryStrategy(e, t) {
    const s = this.recoveryStrategies.get(e);
    s && (this.recoveryStrategies.set(e, { ...s, ...t }), m.info(
      `Updated recovery strategy for error type: ${e}`,
      void 0,
      { strategy: t }
    ));
  }
}
const Q = new er();
class tr extends fe {
  config;
  workerPool;
  communicationChannel;
  processes = /* @__PURE__ */ new Map();
  recoveryAttempts = /* @__PURE__ */ new Map();
  maxRecoveryAttempts = 3;
  templates = /* @__PURE__ */ new Map();
  startLocks = /* @__PURE__ */ new Map();
  constructor(e = {}) {
    super(), this.config = {
      workerPool: e.workerPool || {},
      enableSandboxing: e.enableSandboxing !== !1,
      enableIsolation: e.enableIsolation !== !1,
      maxPluginInstances: e.maxPluginInstances || 50,
      processRecoveryEnabled: e.processRecoveryEnabled !== !1,
      runtimeMode: e.runtimeMode === "adaptive" ? "adaptive" : "eager",
      autoRestartOnDemand: e.autoRestartOnDemand === !0
    }, this.workerPool = new Js(this.config.workerPool), this.communicationChannel = new Ys({
      enableEncryption: !1,
      // 禁用加密，使用明文传输以便调试
      enableSigning: !0
    }), this.setupEventHandlers(), m.info("ProcessManager initialized", void 0, { config: this.config });
  }
  setupEventHandlers() {
    this.workerPool.on("worker.created", ({ workerId: e, pluginId: t }) => {
      this.updateProcessStatus(t, "running");
    }), this.workerPool.on("worker.terminated", ({ workerId: e, pluginId: t, reason: s }) => {
      this.handleWorkerTermination(t, s);
    }), this.workerPool.on("worker.error", ({ workerId: e, pluginId: t, error: s }) => {
      this.handleWorkerError(t, s);
    }), this.communicationChannel.on("channel.error", ({ channelId: e, error: t }) => {
      const s = this.findProcessByChannelId(e);
      s && this.handleProcessError(s.pluginId, t);
    });
  }
  async ensureRunning(e) {
    const t = this.processes.get(e);
    if (t) return t;
    if (this.config.runtimeMode !== "adaptive" || !this.config.autoRestartOnDemand)
      throw new Error(`Plugin process ${e} not found`);
    const s = this.templates.get(e);
    if (!s || !s.pluginPath)
      throw new Error(`Plugin process ${e} not found (no template for on-demand restart)`);
    const r = this.startLocks.get(e);
    if (r) return r;
    const n = this.startPluginProcess(
      e,
      s.pluginPath,
      { apiPort: s.apiPort },
      s.manifest
    ).finally(() => {
      try {
        this.startLocks.delete(e);
      } catch {
      }
    });
    return this.startLocks.set(e, n), n;
  }
  async startPluginProcess(e, t, s = {}, r) {
    if (this.processes.has(e))
      throw new Error(`Plugin process ${e} is already running`);
    if (this.processes.size >= this.config.maxPluginInstances)
      throw new Error(`Maximum plugin instances reached (${this.config.maxPluginInstances})`);
    try {
      try {
        this.templates.set(e, { pluginPath: t, apiPort: s?.apiPort, manifest: r });
      } catch {
      }
      const n = this.buildSandboxConfig(e, r, s?.apiPort), i = await this.workerPool.createWorker(e, t, n), o = `${e}-${i}`, a = {
        pluginId: e,
        workerId: i,
        channelId: o,
        pluginPath: t,
        status: "starting",
        startedAt: Date.now(),
        lastActivity: Date.now(),
        executionCount: 0,
        errorCount: 0
      };
      this.processes.set(e, a);
      const c = this.workerPool.workers.get(i);
      c && this.communicationChannel.createChannel(o, e, c.worker);
      try {
        console.log("[ProcessManager] starting plugin", { pluginId: e, pluginPath: t });
      } catch {
      }
      return a.status = "running", this.emit("process.started", { pluginId: e, processInfo: a }), m.info("Plugin process started", e, { workerId: i, channelId: o }), a;
    } catch (n) {
      throw this.processes.delete(e), m.error("Failed to start plugin process", e, n instanceof Error ? n : new Error(String(n))), n;
    }
  }
  buildSandboxConfig(e, t, s) {
    const r = [
      I.resolve(process.cwd(), "packages", "main"),
      I.resolve(process.cwd()),
      I.resolve(process.resourcesPath || process.cwd(), "app.asar"),
      I.resolve(process.resourcesPath || process.cwd(), "app")
    ], n = t?.main?.libs && Array.isArray(t.main.libs) ? t.main.libs : [];
    return {
      console: "redirect",
      require: {
        external: !0,
        builtin: ["path", "fs", "child_process", "crypto", "os", "events", "http", "https"],
        root: r
      },
      libs: n,
      sandbox: {
        pluginId: e,
        apiPort: s
      }
    };
  }
  async stopPluginProcess(e, t = "manual") {
    const s = this.processes.get(e);
    if (!s)
      throw new Error(`Plugin process ${e} not found`);
    try {
      s.status = "stopping";
      try {
        await this.executeInPlugin(e, "beforeUnloaded", [], 5e3, { optional: !0 });
      } catch {
      }
      try {
        const r = `plugin:${e}:overlay`;
        se.getInstance().queueOrPublish(r, { event: "plugin-before-unloaded", payload: { ts: Date.now() } }, { ttlMs: 120 * 1e3, persist: !0, meta: { kind: "lifecycle" } });
      } catch {
      }
      try {
        await this.executeInPlugin(e, "cleanup", [], 5e3);
      } catch (r) {
        m.warn("Plugin cleanup failed", e, r instanceof Error ? r : new Error(String(r)));
      }
      this.communicationChannel.removeChannel(s.channelId), this.workerPool.terminateWorker(s.workerId, t), s.status = "stopped", this.processes.delete(e), this.recoveryAttempts.delete(e), this.emit("process.stopped", { pluginId: e, reason: t }), m.info("Plugin process stopped", e, { reason: t });
    } catch (r) {
      throw m.error("Error stopping plugin process", e, r instanceof Error ? r : new Error(String(r))), r;
    }
  }
  async executeInPlugin(e, t, s = [], r, n) {
    const i = await this.ensureRunning(e);
    if (i.status !== "running") {
      const w = i.status === "starting" && t === "init", v = i.status === "stopping" && (t === "beforeUnloaded" || t === "cleanup");
      if (!w && !v)
        throw new Error(`Plugin process ${e} is not running (status: ${i.status})`);
    }
    let o = 0;
    const a = 8;
    let c = null;
    for (; o < a; )
      try {
        const w = await this.workerPool.executeInWorker(
          i.workerId,
          t,
          s,
          r,
          n && n.optional
        );
        return i.executionCount++, i.lastActivity = Date.now(), w;
      } catch (w) {
        const v = String(w?.message || w);
        if (c = w, n && n.optional && (v.toLowerCase().includes("method") && v.toLowerCase().includes("not") && v.toLowerCase().includes("found") || v.toLowerCase().includes("not found on plugin or sandbox")))
          return;
        if (v.includes("status: busy") || v.includes("not available")) {
          await new Promise((_) => setTimeout(_, 200 + o * 200)), o++;
          continue;
        }
        break;
      }
    const d = c instanceof Error ? c : new Error(String(c)), f = String(d.message || "error");
    if (!(n && n.optional && (f.toLowerCase().includes("method") && f.toLowerCase().includes("not") && f.toLowerCase().includes("found") || f.toLowerCase().includes("not found on plugin or sandbox"))))
      throw i.errorCount++, f.includes("status: busy") || f.includes("not available") ? m.warn("Plugin worker busy during execute", e, { method: t, attempts: a }) : (m.error("Plugin execution error", e, d, { method: t }), await Q.handleError(
        e,
        le.RUNTIME_ERROR,
        d.message,
        d,
        { method: t, args: s }
      )), d;
  }
  handleWorkerTermination(e, t) {
    if (this.processes.get(e)) {
      if (this.config.runtimeMode === "adaptive" && t === "idle_timeout") {
        this.processes.delete(e), this.emit("process.stopped", { pluginId: e, reason: t });
        return;
      }
      t !== "manual" && this.config.processRecoveryEnabled ? this.attemptProcessRecovery(e, t) : (this.processes.delete(e), this.emit("process.stopped", { pluginId: e, reason: t }));
    }
  }
  handleWorkerError(e, t) {
    const s = this.processes.get(e);
    s && (s.errorCount++, s.status = "error"), this.emit("process.error", { pluginId: e, error: t }), this.config.processRecoveryEnabled && this.attemptProcessRecovery(e, "worker_error");
  }
  handleProcessError(e, t) {
    m.error("Process error", e, t), this.emit("process.error", { pluginId: e, error: t });
  }
  async attemptProcessRecovery(e, t) {
    const s = this.recoveryAttempts.get(e) || 0;
    if (s >= this.maxRecoveryAttempts) {
      m.error("Max recovery attempts reached", e, new Error(`Max attempts: ${s}`)), this.processes.delete(e), this.recoveryAttempts.delete(e);
      return;
    }
    this.recoveryAttempts.set(e, s + 1);
    try {
      m.info("Attempting process recovery", e, { attempt: s + 1, reason: t });
      let r;
      const n = this.processes.get(e);
      if (n && (r = n.pluginPath, await this.stopPluginProcess(e, "recovery")), await new Promise((i) => setTimeout(i, 1e3 * (s + 1))), r) {
        const i = this.templates.get(e), o = i && typeof i.apiPort < "u" ? i.apiPort : void 0, a = i && i.manifest ? i.manifest : void 0;
        await this.startPluginProcess(e, r, { apiPort: o }, a), this.emit("process.recovered", { pluginId: e, attempt: s + 1 }), m.info("Process recovery successful", e, { attempt: s + 1 });
      } else
        throw new Error("Missing pluginPath for recovery");
    } catch (r) {
      m.error("Process recovery failed", e, r instanceof Error ? r : new Error(String(r)), { attempt: s + 1 });
    }
  }
  updateProcessStatus(e, t) {
    const s = this.processes.get(e);
    s && (s.status = t, s.lastActivity = Date.now());
  }
  findProcessByChannelId(e) {
    const t = Array.from(this.processes.values());
    for (const s of t)
      if (s.channelId === e)
        return s;
  }
  getProcessInfo(e) {
    return this.processes.get(e);
  }
  getAllProcesses() {
    return Array.from(this.processes.values());
  }
  getProcessStats() {
    const e = {
      total: this.processes.size,
      running: 0,
      stopped: 0,
      error: 0,
      workerStats: this.workerPool.getWorkerStats(),
      channelStats: this.communicationChannel.getAllChannelStats()
    }, t = Array.from(this.processes.values());
    for (const s of t)
      switch (s.status) {
        case "running":
          e.running++;
          break;
        case "stopped":
          e.stopped++;
          break;
        case "error":
          e.error++;
          break;
      }
    return e;
  }
  async restartPlugin(e) {
    const t = this.processes.get(e);
    if (!t)
      throw new Error(`Plugin process ${e} not found`);
    await this.stopPluginProcess(e, "restart"), await this.startPluginProcess(e, t.pluginPath);
  }
  cleanup() {
    const e = Array.from(this.processes.keys());
    for (const t of e)
      try {
        this.stopPluginProcess(t, "cleanup").catch(() => {
        });
      } catch {
      }
    this.workerPool.cleanup(), this.communicationChannel.cleanup(), m.info("ProcessManager cleanup completed");
  }
}
class sr extends ce {
  constructor(e, t = {}) {
    super(), this.pluginsDir = e, this.config = {
      autoCheck: !1,
      autoDownload: !1,
      autoInstall: !1,
      checkInterval: 1440 * 60 * 1e3,
      // 24小时
      backupBeforeUpdate: !0,
      rollbackOnFailure: !0,
      ...t
    }, this.backupDir = I.join(this.pluginsDir, ".backups"), this.ensureBackupDirectory(), this.config.autoCheck && this.startAutoCheck();
  }
  config;
  updateChecks = /* @__PURE__ */ new Map();
  backups = /* @__PURE__ */ new Map();
  updateQueue = /* @__PURE__ */ new Set();
  checkTimer;
  backupDir;
  /**
   * 确保备份目录存在
   */
  ensureBackupDirectory() {
    S.existsSync(this.backupDir) || S.mkdirSync(this.backupDir, { recursive: !0 });
  }
  /**
   * 开始自动检查更新
   */
  startAutoCheck() {
    this.checkTimer && clearInterval(this.checkTimer), this.checkTimer = setInterval(() => {
      this.checkAllUpdates().catch((e) => {
        m.error("自动检查更新失败");
      });
    }, this.config.checkInterval), m.info(`已启动自动更新检查，间隔: ${this.config.checkInterval}ms`);
  }
  /**
   * 停止自动检查更新
   */
  stopAutoCheck() {
    this.checkTimer && (clearInterval(this.checkTimer), this.checkTimer = void 0, m.info("已停止自动更新检查"));
  }
  /**
   * 检查单个插件的更新
   */
  async checkUpdate(e) {
    try {
      m.debug(`检查插件更新: ${e.id}`);
      const t = await this.performUpdateCheck(e);
      return this.updateChecks.set(e.id, t), t.hasUpdate && (this.emit("update.available", t), m.info(`发现插件更新: ${e.id} ${t.currentVersion} -> ${t.latestVersion}`)), t;
    } catch (t) {
      const s = t instanceof Error ? t : new Error(String(t));
      m.error(`检查插件更新失败: ${e.id}`);
      const r = {
        pluginId: e.id,
        currentVersion: e.version,
        latestVersion: e.version,
        hasUpdate: !1
      };
      return this.emit("update.check.error", { pluginId: e.id, error: s }), r;
    }
  }
  /**
   * 检查所有插件的更新
   */
  async checkAllUpdates(e) {
    e || (e = []);
    const t = [];
    for (const s of e)
      try {
        const r = await this.checkUpdate(s);
        t.push(r);
      } catch {
        m.error(`检查插件更新失败: ${s.id}`);
      }
    return this.emit("update.check.complete", t), t;
  }
  /**
   * 执行实际的更新检查
   */
  async performUpdateCheck(e) {
    return {
      pluginId: e.id,
      currentVersion: e.version,
      latestVersion: e.version,
      // 暂时设为相同版本
      hasUpdate: !1
    };
  }
  /**
   * 创建插件备份
   */
  async createBackup(e) {
    const t = Date.now(), s = `${e.id}_${e.version}_${t}`, r = I.join(this.backupDir, s);
    try {
      await this.copyDirectory(e.installPath, r);
      const n = await this.getDirectorySize(r), i = {
        pluginId: e.id,
        version: e.version,
        backupPath: r,
        timestamp: t,
        size: n
      }, o = this.backups.get(e.id) || [];
      return o.push(i), this.backups.set(e.id, o), await this.cleanupOldBackups(e.id, 5), m.info(`创建插件备份: ${e.id} -> ${r}`), this.emit("backup.created", i), i;
    } catch (n) {
      const i = n instanceof Error ? n : new Error(String(n));
      throw m.error(`创建插件备份失败: ${e.id}`), i;
    }
  }
  /**
   * 恢复插件备份
   */
  async restoreBackup(e, t) {
    const s = this.backups.get(e) || [];
    if (t || (t = s[s.length - 1]), !t)
      throw new Error(`没有找到插件 ${e} 的备份`);
    if (!S.existsSync(t.backupPath))
      throw new Error(`备份文件不存在: ${t.backupPath}`);
    try {
      const r = I.join(this.pluginsDir, e);
      S.existsSync(r) && S.rmSync(r, { recursive: !0, force: !0 }), await this.copyDirectory(t.backupPath, r), m.info(`恢复插件备份: ${e} <- ${t.backupPath}`), this.emit("backup.restored", { pluginId: e, backupInfo: t });
    } catch (r) {
      const n = r instanceof Error ? r : new Error(String(r));
      throw m.error(`恢复插件备份失败: ${e}`), n;
    }
  }
  /**
   * 更新插件
   */
  async updatePlugin(e, t) {
    if (this.updateQueue.has(e))
      throw new Error(`插件 ${e} 正在更新中`);
    this.updateQueue.add(e);
    try {
      const s = this.updateChecks.get(e);
      if (!s || !s.hasUpdate)
        throw new Error(`插件 ${e} 没有可用更新`);
      this.emit("update.start", { pluginId: e }), this.emitProgress(e, "downloading", 0, "开始下载更新");
      const r = await this.downloadUpdate(s, t);
      this.emitProgress(e, "downloading", 100, "下载完成"), this.config.backupBeforeUpdate && this.emitProgress(e, "installing", 10, "创建备份"), this.emitProgress(e, "installing", 50, "安装更新"), await this.installUpdate(e, r), this.emitProgress(e, "completing", 100, "更新完成"), this.emit("update.complete", { pluginId: e, result: s }), m.info(`插件更新完成: ${e} ${s.currentVersion} -> ${s.latestVersion}`);
    } catch (s) {
      const r = s instanceof Error ? s : new Error(String(s));
      if (m.error(`插件更新失败: ${e}`), this.config.rollbackOnFailure)
        try {
          await this.restoreBackup(e), m.info(`已回滚插件: ${e}`);
        } catch {
          m.error(`回滚插件失败: ${e}`);
        }
      throw this.emit("update.error", { pluginId: e, error: r }), r;
    } finally {
      this.updateQueue.delete(e);
    }
  }
  /**
   * 下载更新文件
   */
  async downloadUpdate(e, t) {
    const s = I.join(this.pluginsDir, ".temp", `${e.pluginId}_update.zip`), r = I.dirname(s);
    return S.existsSync(r) || S.mkdirSync(r, { recursive: !0 }), S.writeFileSync(s, ""), s;
  }
  /**
   * 安装更新
   */
  async installUpdate(e, t) {
    m.debug(`安装插件更新: ${e} from ${t}`);
  }
  /**
   * 发出进度事件
   */
  emitProgress(e, t, s, r) {
    const n = {
      pluginId: e,
      stage: t,
      progress: s,
      message: r
    };
    this.emit("update.progress", n);
  }
  /**
   * 复制目录
   */
  async copyDirectory(e, t) {
    await S.promises.mkdir(t, { recursive: !0 });
    const s = await S.promises.readdir(e, { withFileTypes: !0 });
    for (const r of s) {
      const n = I.join(e, r.name), i = I.join(t, r.name);
      r.isDirectory() ? await this.copyDirectory(n, i) : await S.promises.copyFile(n, i);
    }
  }
  /**
   * 获取目录大小
   */
  async getDirectorySize(e) {
    let t = 0;
    const s = await S.promises.readdir(e, { withFileTypes: !0 });
    for (const r of s) {
      const n = I.join(e, r.name);
      if (r.isDirectory())
        t += await this.getDirectorySize(n);
      else {
        const i = await S.promises.stat(n);
        t += i.size;
      }
    }
    return t;
  }
  /**
   * 清理旧备份
   */
  async cleanupOldBackups(e, t) {
    const s = this.backups.get(e) || [];
    if (s.length <= t)
      return;
    s.sort((n, i) => i.timestamp - n.timestamp);
    const r = s.slice(t);
    for (const n of r)
      try {
        S.existsSync(n.backupPath) && S.rmSync(n.backupPath, { recursive: !0, force: !0 });
        const i = s.indexOf(n);
        i !== -1 && s.splice(i, 1), m.debug(`删除旧备份: ${n.backupPath}`);
      } catch {
        m.error(`删除备份失败: ${n.backupPath}`);
      }
    this.backups.set(e, s);
  }
  /**
   * 获取插件的备份列表
   */
  getBackups(e) {
    return [...this.backups.get(e) || []];
  }
  /**
   * 获取更新检查结果
   */
  getUpdateCheck(e) {
    return this.updateChecks.get(e);
  }
  /**
   * 获取所有更新检查结果
   */
  getAllUpdateChecks() {
    return Array.from(this.updateChecks.values());
  }
  /**
   * 获取配置
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * 更新配置
   */
  updateConfig(e) {
    this.config = { ...this.config, ...e }, e.autoCheck !== void 0 && (e.autoCheck ? this.startAutoCheck() : this.stopAutoCheck());
  }
  /**
   * 清理资源
   */
  cleanup() {
    this.stopAutoCheck(), this.updateChecks.clear(), this.backups.clear(), this.updateQueue.clear(), this.removeAllListeners(), m.debug("插件更新管理器已清理");
  }
}
class rr extends ce {
  watchers = /* @__PURE__ */ new Map();
  reloadTimers = /* @__PURE__ */ new Map();
  reloadCounts = /* @__PURE__ */ new Map();
  // Polling related properties
  pollingIntervals = /* @__PURE__ */ new Map();
  fileHashes = /* @__PURE__ */ new Map();
  // pluginId -> filePath -> hash
  config;
  constructor(e = {}) {
    super(), this.config = {
      enabled: !0,
      watchPatterns: ["**/*.js", "**/*.ts", "**/*.json"],
      ignorePatterns: ["**/node_modules/**", "**/dist/**", "**/.git/**", "**/logs/**"],
      debounceMs: 1e3,
      maxRetries: 3,
      ...e
    }, m.info("Plugin hot reload manager initialized");
  }
  /**
   * 开始对指定文件进行轮询监控（替代文件系统事件监听）
   * @param pluginId 插件ID
   * @param filePaths 需要监控的文件列表（绝对路径）
   */
  startPolling(e, t) {
    if (!this.config.enabled)
      return m.debug("Hot reload disabled, skipping polling setup", e), !1;
    this.pollingIntervals.has(e) && this.stopPolling(e);
    const s = /* @__PURE__ */ new Map();
    for (const n of t)
      Ve(n) && s.set(n, this.calculateFileHash(n));
    this.fileHashes.set(e, s), m.info("Starting polling for plugin files", e, { files: t });
    const r = setInterval(() => {
      this.checkFilesForChanges(e, t);
    }, 1e3);
    return this.pollingIntervals.set(e, r), !0;
  }
  /**
   * 停止轮询
   */
  stopPolling(e) {
    const t = this.pollingIntervals.get(e);
    t && (clearInterval(t), this.pollingIntervals.delete(e), this.fileHashes.delete(e), m.info("Stopped polling for plugin", e));
  }
  calculateFileHash(e) {
    try {
      const t = Rt(e);
      return ae.createHash("md5").update(t).digest("hex");
    } catch {
      return "";
    }
  }
  checkFilesForChanges(e, t) {
    const s = this.fileHashes.get(e);
    if (!s) return;
    let r = !1, n = "";
    for (const i of t) {
      if (!Ve(i)) continue;
      const o = this.calculateFileHash(i), a = s.get(i) || "";
      if (o !== a) {
        m.info(`Polling detected file change: ${e} -> ${i}`, e), s.set(i, o), r = !0, n = i;
        break;
      }
    }
    if (r) {
      const i = {
        pluginId: e,
        filePath: n,
        changeType: "change",
        timestamp: Date.now()
      };
      this.triggerReload(e, i);
    }
  }
  /**
   * 开始监控插件目录
   */
  startWatching(e, t) {
    if (!this.config.enabled)
      return m.debug("Hot reload disabled, skipping watch setup", e), !1;
    if (this.watchers.has(e))
      return m.warn("Plugin already being watched", e), !1;
    if (!Ve(t))
      return m.error("Plugin path does not exist", e), !1;
    try {
      const s = pt(t, {
        // chokidar supports array patterns at runtime; typings may be narrower in some versions
        ignored: this.config.ignorePatterns,
        persistent: !0,
        ignoreInitial: !0,
        followSymlinks: !1,
        depth: 10
      });
      return s.on("add", (r) => this.handleFileChange(e, r, "add")), s.on("change", (r) => this.handleFileChange(e, r, "change")), s.on("unlink", (r) => this.handleFileChange(e, r, "unlink")), s.on("error", (r) => {
        m.error("File watcher error", e), this.emit("watch-error", { pluginId: e, error: r.message });
      }), this.watchers.set(e, s), this.reloadCounts.set(e, 0), m.info("Started watching plugin files", e, { path: t }), this.emit("watch-started", { pluginId: e, path: t }), !0;
    } catch {
      return m.error("Failed to start watching plugin files", e), !1;
    }
  }
  /**
   * 停止监控插件目录
   */
  stopWatching(e) {
    const t = this.watchers.get(e);
    if (!t)
      return !1;
    try {
      t.close(), this.watchers.delete(e);
      const s = this.reloadTimers.get(e);
      return s && (clearTimeout(s), this.reloadTimers.delete(e)), this.reloadCounts.delete(e), m.info("Stopped watching plugin files", e), this.emit("watch-stopped", { pluginId: e }), !0;
    } catch {
      return m.error("Failed to stop watching plugin files", e), !1;
    }
  }
  /**
   * 处理文件变化事件
   */
  handleFileChange(e, t, s) {
    if (m.debug("Raw file change detected", e, { filePath: t, changeType: s }), !this.shouldWatchFile(t))
      return;
    const r = {
      pluginId: e,
      filePath: t,
      changeType: s,
      timestamp: Date.now()
    };
    m.debug("File change detected", e), this.emit("file-changed", r);
    const n = this.reloadTimers.get(e);
    n && clearTimeout(n);
    const i = setTimeout(() => {
      this.triggerReload(e, r), this.reloadTimers.delete(e);
    }, this.config.debounceMs);
    this.reloadTimers.set(e, i);
  }
  /**
   * 触发插件重载
   */
  async triggerReload(e, t) {
    const s = Date.now(), r = this.reloadCounts.get(e) || 0;
    if (r >= this.config.maxRetries) {
      m.warn("Max reload retries exceeded", e), this.emit("reload-failed", {
        success: !1,
        pluginId: e,
        error: "Max retries exceeded",
        reloadTime: Date.now() - s
      });
      return;
    }
    try {
      m.info("Triggering plugin reload", e), this.emit("reload-requested", { pluginId: e, reloadEvent: t }), this.reloadCounts.set(e, r + 1), setTimeout(() => {
        this.reloadCounts.set(e, 0);
      }, 5e3);
      const n = {
        success: !0,
        pluginId: e,
        reloadTime: Date.now() - s
      };
      this.emit("reload-completed", n), m.info("Plugin reload completed", e);
    } catch (n) {
      const i = {
        success: !1,
        pluginId: e,
        error: n.message,
        reloadTime: Date.now() - s
      };
      this.emit("reload-failed", i), m.error("Plugin reload failed", e);
    }
  }
  /**
   * 检查文件是否应该被监控
   */
  shouldWatchFile(e) {
    const t = e.replace(/\\/g, "/").toLowerCase(), s = [".js", ".ts", ".json", ".html", ".css", ".vue", ".jsx", ".tsx"];
    return this.config.ignorePatterns.some((i) => {
      const o = i.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\/+/g, "/").toLowerCase();
      return !!(o && t.includes(o));
    }) ? !1 : s.some((i) => t.endsWith(i));
  }
  /**
   * 获取相对路径（用于日志显示）
   */
  getRelativePath(e) {
    try {
      const t = process.cwd();
      return e.startsWith(t) ? e.substring(t.length + 1) : e;
    } catch {
      return e;
    }
  }
  /**
   * 获取插件的监控状态
   */
  getWatchStatus(e) {
    return {
      isWatching: this.watchers.has(e),
      reloadCount: this.reloadCounts.get(e) || 0,
      lastReload: void 0
      // TODO: 实现最后重载时间跟踪
    };
  }
  /**
   * 获取所有监控的插件
   */
  getWatchedPlugins() {
    return Array.from(this.watchers.keys());
  }
  /**
   * 更新热重载配置
   */
  updateConfig(e) {
    this.config = { ...this.config, ...e }, m.info("Hot reload config updated", void 0, { config: this.config }), this.emit("config-updated", this.config);
  }
  /**
   * 手动触发插件重载
   */
  async manualReload(e) {
    const t = Date.now();
    try {
      m.info("Manual plugin reload triggered", e);
      const s = {
        pluginId: e,
        filePath: "manual",
        changeType: "change",
        timestamp: Date.now()
      };
      this.emit("reload-requested", { pluginId: e, reloadEvent: s });
      const r = {
        success: !0,
        pluginId: e,
        reloadTime: Date.now() - t
      };
      return this.emit("reload-completed", r), r;
    } catch (s) {
      const r = {
        success: !1,
        pluginId: e,
        error: s.message,
        reloadTime: Date.now() - t
      };
      return this.emit("reload-failed", r), r;
    }
  }
  /**
   * 清理所有监控器
   */
  cleanup() {
    m.info("Cleaning up hot reload manager");
    for (const e of Array.from(this.watchers.keys()))
      this.stopWatching(e);
    for (const e of Array.from(this.pollingIntervals.keys()))
      this.stopPolling(e);
    for (const e of Array.from(this.reloadTimers.values()))
      clearTimeout(e);
    this.reloadTimers.clear(), this.reloadCounts.clear(), m.info("Hot reload manager cleanup completed");
  }
}
const Z = new rr();
class nr extends ce {
  versionHistory = /* @__PURE__ */ new Map();
  versionCacheDir;
  versionsDir;
  pluginsDir;
  constructor(e) {
    super(), this.pluginsDir = e, this.versionsDir = I.join(e, ".versions"), this.versionCacheDir = I.join(e, ".version-cache"), this.ensureCacheDir(), this.loadVersionHistory();
  }
  /**
   * 确保版本缓存目录存在
   */
  ensureCacheDir() {
    S.existsSync(this.versionCacheDir) || S.mkdirSync(this.versionCacheDir, { recursive: !0 }), S.existsSync(this.versionsDir) || S.mkdirSync(this.versionsDir, { recursive: !0 });
  }
  /**
   * 加载版本历史记录
   */
  loadVersionHistory() {
    try {
      const e = I.join(this.versionCacheDir, "history.json");
      if (S.existsSync(e)) {
        const t = S.readFileSync(e, "utf-8"), s = JSON.parse(t);
        for (const [r, n] of Object.entries(s))
          this.versionHistory.set(r, n);
      }
    } catch (e) {
      m.error("Failed to load version history", void 0, e);
    }
  }
  /**
   * 保存版本历史记录
   */
  saveVersionHistory() {
    try {
      const e = I.join(this.versionCacheDir, "history.json"), t = Object.fromEntries(this.versionHistory);
      S.writeFileSync(e, JSON.stringify(t, null, 2));
    } catch (e) {
      m.error("Failed to save version history", void 0, e);
    }
  }
  /**
   * 注册插件版本
   */
  registerPluginVersion(e, t) {
    const s = {
      version: t.version,
      releaseDate: /* @__PURE__ */ new Date(),
      changelog: [],
      isPrerelease: this.isPrerelease(t.version),
      minimumSystemVersion: t.minAppVersion
    };
    let r = this.versionHistory.get(e);
    r || (r = {
      pluginId: e,
      versions: [],
      currentVersion: t.version,
      updateAvailable: !1
    }, this.versionHistory.set(e, r)), r.versions.find((i) => i.version === t.version) || (r.versions.push(s), r.versions.sort((i, o) => this.compareVersions(o.version, i.version))), r.currentVersion = t.version, this.saveVersionHistory(), m.info("Plugin version registered", e, {
      pluginId: e,
      version: t.version
    });
  }
  /**
   * 获取插件版本历史
   */
  getVersionHistory(e) {
    return this.versionHistory.get(e);
  }
  /**
   * 获取所有插件的版本信息
   */
  getAllVersionHistory() {
    return new Map(this.versionHistory);
  }
  /**
   * 检查版本更新
   */
  async checkForUpdates(e, t) {
    try {
      const s = this.versionHistory.get(e);
      if (!s)
        return null;
      if (t) {
        const r = await this.fetchRemoteVersions(e, t);
        if (r && r.length > 0) {
          const n = r[0];
          if (this.compareVersions(n.version, s.currentVersion) > 0)
            return s.latestVersion = n.version, s.updateAvailable = !0, this.saveVersionHistory(), this.emit("update-available", {
              pluginId: e,
              currentVersion: s.currentVersion,
              latestVersion: n.version,
              versionInfo: n
            }), n;
        }
      }
      return null;
    } catch (s) {
      return m.error("Failed to check for updates", e, s), null;
    }
  }
  /**
   * 从远程获取版本信息
   */
  async fetchRemoteVersions(e, t) {
    try {
      const s = await fetch(`${t}/plugins/${e}/versions`);
      if (s.ok)
        return (await s.json()).versions || [];
    } catch (s) {
      m.error("Failed to fetch remote versions", e, s);
    }
    return null;
  }
  /**
   * 比较版本号
   */
  compareVersions(e, t) {
    try {
      const s = this.parseVersion(e), r = this.parseVersion(t);
      for (let n = 0; n < Math.max(s.length, r.length); n++) {
        const i = s[n] || 0, o = r[n] || 0;
        if (i > o) return 1;
        if (i < o) return -1;
      }
      return 0;
    } catch (s) {
      return m.error("Version comparison failed:", void 0, s), 0;
    }
  }
  /**
   * 解析版本号
   */
  parseVersion(e) {
    return e.replace(/[^\d.]/g, "").split(".").map(Number);
  }
  /**
   * 检查是否为预发布版本
   */
  isPrerelease(e) {
    return /-(alpha|beta|rc|pre)/i.test(e);
  }
  /**
   * 检查版本约束
   */
  satisfiesConstraint(e, t) {
    try {
      const s = this.parseConstraint(t);
      if (!s) return !0;
      const r = this.compareVersions(e, s.version);
      switch (s.operator) {
        case "=":
          return r === 0;
        case ">":
          return r > 0;
        case ">=":
          return r >= 0;
        case "<":
          return r < 0;
        case "<=":
          return r <= 0;
        case "~":
          return this.satisfiesTildeRange(e, s.version);
        case "^":
          return this.satisfiesCaretRange(e, s.version);
        default:
          return !0;
      }
    } catch (s) {
      return m.error("Version constraint check failed:", void 0, s), !1;
    }
  }
  /**
   * 解析版本约束
   */
  parseConstraint(e) {
    const t = e.match(/^([=><~^]+)(.+)$/);
    return t ? {
      operator: t[1],
      version: t[2]
    } : { operator: "=", version: e };
  }
  /**
   * 检查波浪号范围 (~1.2.3 允许 >=1.2.3 <1.3.0)
   */
  satisfiesTildeRange(e, t) {
    const s = this.parseVersion(e), r = this.parseVersion(t);
    return s[0] !== r[0] || s[1] !== r[1] ? !1 : s[2] >= (r[2] || 0);
  }
  /**
   * 检查插入符号范围 (^1.2.3 允许 >=1.2.3 <2.0.0)
   */
  satisfiesCaretRange(e, t) {
    const s = this.parseVersion(e), r = this.parseVersion(t);
    return s[0] !== r[0] ? !1 : this.compareVersions(e, t) >= 0;
  }
  /**
   * 获取版本变更日志
   */
  getChangelog(e, t, s) {
    const r = this.versionHistory.get(e);
    if (!r) return [];
    let n = r.versions;
    return (t || s) && (n = n.filter((i) => !(t && this.compareVersions(i.version, t) <= 0 || s && this.compareVersions(i.version, s) > 0))), n.flatMap((i) => i.changelog);
  }
  /**
   * 回滚到指定版本
   */
  async rollbackToVersion(e, t) {
    try {
      const s = I.join(this.pluginsDir, e), r = I.join(this.versionsDir, e, t);
      if (!S.existsSync(r))
        throw new Error(`Backup version ${t} not found for plugin ${e}`);
      const n = I.join(this.versionsDir, e, `current_${Date.now()}`);
      return S.cpSync(s, n, { recursive: !0 }), S.rmSync(s, { recursive: !0, force: !0 }), S.cpSync(r, s, { recursive: !0 }), m.info(`Plugin ${e} rolled back to version ${t}`, e), !0;
    } catch (s) {
      return m.error(`Failed to rollback plugin ${e} to version ${t}:`, e, s), !1;
    }
  }
  /**
   * 清理旧版本数据
   */
  async cleanupOldVersions(e, t = 5) {
    try {
      const s = I.join(this.versionsDir, e);
      if (!S.existsSync(s))
        return;
      const r = S.readdirSync(s).filter((n) => S.statSync(I.join(s, n)).isDirectory()).sort((n, i) => this.compareVersions(i, n));
      if (r.length > t) {
        const n = r.slice(t);
        for (const i of n) {
          const o = I.join(s, i);
          S.rmSync(o, { recursive: !0, force: !0 }), m.info(`Removed old version ${i} for plugin ${e}`, e);
        }
      }
    } catch (s) {
      m.error(`Failed to cleanup old versions for plugin ${e}:`, e, s);
    }
  }
  /**
   * 清理所有数据
   */
  cleanup() {
    this.versionHistory.clear(), this.removeAllListeners();
  }
  getDirectorySize(e) {
    try {
      let t = 0;
      const s = S.readdirSync(e);
      for (const r of s) {
        const n = I.join(e, r), i = S.statSync(n);
        i.isDirectory() ? t += this.getDirectorySize(n) : t += i.size;
      }
      return t;
    } catch (t) {
      return m.error(`Failed to calculate directory size for ${e}:`, void 0, t), 0;
    }
  }
}
let tt = null;
function ir() {
  if (!tt) {
    const g = I.join(R.getPath("userData"), "plugins");
    tt = new nr(g);
  }
  return tt;
}
const we = new Proxy({}, {
  get(g, e) {
    const t = ir(), s = t[e];
    return typeof s == "function" ? s.bind(t) : s;
  }
});
class At extends fe {
  config;
  connections = /* @__PURE__ */ new Map();
  connectionsByTarget = /* @__PURE__ */ new Map();
  pendingRequests = /* @__PURE__ */ new Map();
  healthCheckTimer;
  nextConnectionId = 1;
  nextRequestId = 1;
  constructor(e = {}) {
    super(), this.config = {
      maxConnections: e.maxConnections || 100,
      connectionTimeout: e.connectionTimeout || 3e4,
      // 30 seconds
      idleTimeout: e.idleTimeout || 3e5,
      // 5 minutes
      maxRetries: e.maxRetries || 3,
      retryDelay: e.retryDelay || 1e3,
      // 1 second
      healthCheckInterval: e.healthCheckInterval || 6e4
      // 1 minute
    }, this.startHealthCheck(), m.info("PluginConnectionPoolManager initialized", void 0, { config: this.config });
  }
  /**
   * 获取连接
   */
  async getConnection(e, t, s, r) {
    return new Promise((n, i) => {
      const o = this.findAvailableConnection(e, t);
      if (o) {
        o.inUse = !0, o.lastUsed = Date.now(), o.pluginId = s, this.emit("connection-acquired", {
          connectionId: o.id,
          pluginId: s
        }), m.debug("Connection reused", s, {
          connectionId: o.id,
          type: e,
          target: t
        }), n(o);
        return;
      }
      if (this.connections.size >= this.config.maxConnections && (this.cleanupIdleConnections(), this.connections.size >= this.config.maxConnections)) {
        const a = `req_${this.nextRequestId++}`, c = {
          id: a,
          type: e,
          target: t,
          pluginId: s,
          options: r,
          resolve: n,
          reject: i,
          createdAt: Date.now()
        };
        this.pendingRequests.set(a, c), this.emit("pool-exhausted", {
          maxConnections: this.config.maxConnections,
          pendingRequests: this.pendingRequests.size
        }), m.warn("Connection pool exhausted, request queued", s, {
          requestId: a,
          type: e,
          target: t
        }), setTimeout(() => {
          this.pendingRequests.has(a) && (this.pendingRequests.delete(a), i(new Error("Connection request timeout")));
        }, this.config.connectionTimeout);
        return;
      }
      this.createConnection(e, t, s, r).then(n).catch(i);
    });
  }
  /**
   * 释放连接
   */
  releaseConnection(e, t) {
    const s = this.connections.get(e);
    return s ? s.inUse ? (s.inUse = !1, s.lastUsed = Date.now(), s.pluginId = void 0, this.emit("connection-released", { connectionId: e, pluginId: t }), m.debug("Connection released", t, { connectionId: e }), this.processPendingRequests(), !0) : (m.warn("Attempting to release already released connection", t, { connectionId: e }), !1) : (m.warn("Connection not found for release", t, { connectionId: e }), !1);
  }
  /**
   * 查找可用连接
   */
  findAvailableConnection(e, t) {
    const s = this.connectionsByTarget.get(t);
    if (!s)
      return null;
    for (const r of s) {
      const n = this.connections.get(r);
      if (n && !n.inUse && n.type === e && n.isHealthy)
        return n;
    }
    return null;
  }
  /**
   * 创建新连接
   */
  async createConnection(e, t, s, r) {
    const n = `conn_${this.nextConnectionId++}`;
    try {
      const i = {
        id: n,
        type: e,
        target: t,
        inUse: !0,
        lastUsed: Date.now(),
        createdAt: Date.now(),
        pluginId: s,
        retryCount: 0,
        isHealthy: !0
      };
      switch (e) {
        case "http":
          i.agent = new Ot.Agent({
            keepAlive: !0,
            timeout: this.config.connectionTimeout,
            ...r
          });
          break;
        case "https":
          i.agent = new Ht.Agent({
            keepAlive: !0,
            timeout: this.config.connectionTimeout,
            ...r
          });
          break;
        case "tcp":
          i.socket = await this.createTcpConnection(t, r);
          break;
        case "ipc":
          i.socket = await this.createIpcConnection(t, r);
          break;
        default:
          throw new Error(`Unsupported connection type: ${e}`);
      }
      return this.connections.set(n, i), this.connectionsByTarget.has(t) || this.connectionsByTarget.set(t, /* @__PURE__ */ new Set()), this.connectionsByTarget.get(t).add(n), this.emit("connection-created", { connectionId: n, type: e, target: t, pluginId: s }), m.debug("New connection created", s, { connectionId: n, type: e, target: t }), i;
    } catch (i) {
      throw this.emit("connection-failed", {
        target: t,
        error: i.message,
        pluginId: s
      }), m.error("Failed to create connection", s, i), i;
    }
  }
  /**
   * 创建TCP连接
   */
  async createTcpConnection(e, t) {
    return new Promise((s, r) => {
      const [n, i] = e.split(":"), o = parseInt(i, 10), a = new ht.Socket();
      a.setTimeout(this.config.connectionTimeout), a.on("connect", () => {
        a.setTimeout(0), s(a);
      }), a.on("error", (c) => {
        r(c);
      }), a.on("timeout", () => {
        a.destroy(), r(new Error("Connection timeout"));
      }), a.connect(o, n, t);
    });
  }
  /**
   * 创建IPC连接
   */
  async createIpcConnection(e, t) {
    return new Promise((s, r) => {
      const n = new ht.Socket();
      n.setTimeout(this.config.connectionTimeout), n.on("connect", () => {
        n.setTimeout(0), s(n);
      }), n.on("error", (i) => {
        r(i);
      }), n.on("timeout", () => {
        n.destroy(), r(new Error("IPC connection timeout"));
      }), n.connect(e, t);
    });
  }
  /**
   * 处理等待队列
   */
  processPendingRequests() {
    for (const [e, t] of this.pendingRequests) {
      const s = this.findAvailableConnection(t.type, t.target);
      if (s) {
        s.inUse = !0, s.lastUsed = Date.now(), s.pluginId = t.pluginId, this.pendingRequests.delete(e), this.emit("connection-acquired", {
          connectionId: s.id,
          pluginId: t.pluginId
        }), t.resolve(s);
        return;
      }
    }
  }
  /**
   * 清理空闲连接
   */
  cleanupIdleConnections() {
    const e = Date.now(), t = [];
    for (const [s, r] of this.connections)
      !r.inUse && e - r.lastUsed > this.config.idleTimeout && (this.closeConnection(s, "idle_timeout"), t.push(s));
    t.length > 0 && m.info("Idle connections cleaned up", void 0, {
      count: t.length
    });
  }
  /**
   * 关闭连接
   */
  closeConnection(e, t = "manual") {
    const s = this.connections.get(e);
    if (!s)
      return !1;
    s.socket && s.socket.destroy(), s.agent && s.agent.destroy(), this.connections.delete(e);
    const r = this.connectionsByTarget.get(s.target);
    return r && (r.delete(e), r.size === 0 && this.connectionsByTarget.delete(s.target)), this.emit("connection-closed", { connectionId: e, reason: t }), m.debug("Connection closed", s.pluginId, { connectionId: e, reason: t }), !0;
  }
  /**
   * 释放插件的所有连接
   */
  closePluginConnections(e) {
    const t = [];
    for (const [s, r] of this.connections)
      r.pluginId === e && (this.closeConnection(s, "plugin_cleanup"), t.push(s));
    t.length > 0 && m.info("Plugin connections closed", e, {
      count: t.length
    });
  }
  /**
   * 健康检查
   */
  async performHealthCheck() {
    const e = [];
    for (const [t, s] of this.connections)
      if (!s.inUse)
        try {
          s.socket && s.socket.destroyed && (s.isHealthy = !1, e.push(t));
        } catch {
          s.isHealthy = !1, e.push(t);
        }
    for (const t of e)
      this.closeConnection(t, "health_check_failed");
    e.length > 0 && m.info("Unhealthy connections removed", void 0, {
      count: e.length
    });
  }
  /**
   * 启动健康检查
   */
  startHealthCheck() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }
  /**
   * 停止健康检查
   */
  stopHealthCheck() {
    this.healthCheckTimer && (clearInterval(this.healthCheckTimer), this.healthCheckTimer = void 0);
  }
  /**
   * 获取连接池统计信息
   */
  getStats() {
    let e = 0;
    const t = {}, s = {};
    for (const r of this.connections.values())
      r.inUse && e++, t[r.type] = (t[r.type] || 0) + 1, r.pluginId && (s[r.pluginId] = (s[r.pluginId] || 0) + 1);
    return {
      totalConnections: this.connections.size,
      activeConnections: e,
      idleConnections: this.connections.size - e,
      pendingRequests: this.pendingRequests.size,
      failedConnections: 0,
      // TODO: 实现失败连接计数
      connectionsByType: t,
      connectionsByPlugin: s
    };
  }
  /**
   * 销毁连接池
   */
  destroy() {
    this.stopHealthCheck();
    for (const e of this.connections.keys())
      this.closeConnection(e, "pool_destroyed");
    for (const e of this.pendingRequests.values())
      e.reject(new Error("Connection pool destroyed"));
    this.pendingRequests.clear(), m.info("PluginConnectionPoolManager destroyed");
  }
}
const or = new At(), mt = (g, e) => {
  try {
    const t = process.env[g];
    if (t === void 0) return e;
    const s = Number(t);
    return Number.isFinite(s) ? Math.floor(s) : e;
  } catch {
    return e;
  }
};
class ar extends fe {
  config;
  metricsHistory = /* @__PURE__ */ new Map();
  operationTimers = /* @__PURE__ */ new Map();
  monitorTimer;
  lastCpuUsage = /* @__PURE__ */ new Map();
  pluginStartTimes = /* @__PURE__ */ new Map();
  lastCleanupLogTime = /* @__PURE__ */ new Map();
  maxEntries;
  constructor(e = {}) {
    super(), this.config = {
      // Defaults are tuned for lower memory footprint.
      // You can override via env:
      // - ACF_PERF_MONITOR_INTERVAL_MS (default 10000)
      // - ACF_PERF_RETENTION_MS (default 900000)
      monitorInterval: e.monitorInterval || mt("ACF_PERF_MONITOR_INTERVAL_MS", 1e4),
      // 10s
      dataRetentionTime: e.dataRetentionTime || mt("ACF_PERF_RETENTION_MS", 900 * 1e3),
      // 15min
      memoryWarningThreshold: e.memoryWarningThreshold || 100 * 1024 * 1024,
      // 100MB
      cpuWarningThreshold: e.cpuWarningThreshold || 80,
      // 80%
      enableDetailedMonitoring: e.enableDetailedMonitoring !== !1,
      enableProfiling: e.enableProfiling || !1,
      cleanupLogThrottleMs: typeof e.cleanupLogThrottleMs == "number" ? e.cleanupLogThrottleMs : 900 * 1e3,
      cleanupLogMinRemoved: typeof e.cleanupLogMinRemoved == "number" ? e.cleanupLogMinRemoved : 100
    }, this.maxEntries = Math.max(1, Math.ceil(this.config.dataRetentionTime / this.config.monitorInterval)), this.startMonitoring(), m.info("PluginPerformanceMonitor initialized", void 0, { config: this.config });
  }
  /**
   * 开始监控插件
   */
  startMonitoringPlugin(e) {
    this.pluginStartTimes.set(e, Date.now()), this.lastCpuUsage.set(e, process.cpuUsage()), this.metricsHistory.has(e) || this.metricsHistory.set(e, []), this.operationTimers.has(e) || this.operationTimers.set(e, /* @__PURE__ */ new Map()), m.debug("Started monitoring plugin", e);
  }
  /**
   * 停止监控插件
   */
  stopMonitoringPlugin(e) {
    this.pluginStartTimes.delete(e), this.lastCpuUsage.delete(e), this.operationTimers.delete(e), m.debug("Stopped monitoring plugin", e);
  }
  /**
   * 开始操作计时
   */
  startOperation(e, t) {
    const s = this.operationTimers.get(e);
    s && s.set(t, Date.now());
  }
  /**
   * 结束操作计时
   */
  endOperation(e, t) {
    const s = this.operationTimers.get(e);
    if (!s)
      return 0;
    const r = s.get(t);
    if (!r)
      return 0;
    const n = Date.now() - r;
    return s.delete(t), this.updateOperationStats(e, n), n;
  }
  /**
   * 记录网络请求
   */
  recordNetworkRequest(e, t, s, r = 0) {
    const n = this.metricsHistory.get(e);
    if (!n || n.length === 0)
      return;
    const i = n[n.length - 1];
    i.networkStats.requestCount++, i.networkStats.responseTime = (i.networkStats.responseTime + t) / 2, i.networkStats.bytesTransferred += r, s || i.networkStats.errorCount++;
  }
  /**
   * 收集性能指标
   */
  collectMetrics() {
    for (const e of this.pluginStartTimes.keys())
      try {
        const t = this.gatherPluginMetrics(e);
        t && (this.storeMetrics(e, t), this.checkPerformanceAlerts(t), this.emit("metrics-collected", { pluginId: e, metrics: t }));
      } catch (t) {
        m.error("Failed to collect metrics for plugin", e, t);
      }
    this.cleanupOldMetrics();
  }
  /**
   * 收集插件性能指标
   */
  gatherPluginMetrics(e) {
    const t = this.pluginStartTimes.get(e);
    if (!t)
      return null;
    const s = Date.now(), r = process.memoryUsage(), n = process.cpuUsage(this.lastCpuUsage.get(e));
    this.lastCpuUsage.set(e, process.cpuUsage());
    const i = this.getLastMetricsTime(e) || t, o = Math.max(1, s - i), a = (n.user + n.system) / 1e6 / (o / 1e3) * 100, c = this.measureEventLoopDelay(), d = this.getOperationStats(e), f = this.getNetworkStats(e);
    return {
      timestamp: s,
      pluginId: e,
      memoryUsage: {
        heapUsed: r.heapUsed,
        heapTotal: r.heapTotal,
        external: r.external,
        rss: r.rss
      },
      cpuUsage: {
        user: n.user,
        system: n.system,
        percent: Math.min(a, 100)
        // 限制在100%以内
      },
      executionTimes: d,
      networkStats: f,
      eventLoop: {
        delay: c,
        utilization: this.calculateEventLoopUtilization()
      }
    };
  }
  /**
   * 获取最后一次指标收集时间
   */
  getLastMetricsTime(e) {
    const t = this.metricsHistory.get(e);
    return !t || t.length === 0 ? null : t[t.length - 1].timestamp;
  }
  /**
   * 测量事件循环延迟
   */
  measureEventLoopDelay() {
    return 0;
  }
  /**
   * 计算事件循环利用率
   */
  calculateEventLoopUtilization() {
    return 0;
  }
  /**
   * 获取操作统计
   */
  getOperationStats(e) {
    const t = this.metricsHistory.get(e);
    return !t || t.length === 0 ? {
      initialization: Date.now() - (this.pluginStartTimes.get(e) || Date.now()),
      lastOperation: 0,
      averageOperation: 0,
      totalOperations: 0
    } : t[t.length - 1].executionTimes;
  }
  /**
   * 获取网络统计
   */
  getNetworkStats(e) {
    const t = this.metricsHistory.get(e);
    return !t || t.length === 0 ? {
      requestCount: 0,
      responseTime: 0,
      errorCount: 0,
      bytesTransferred: 0
    } : t[t.length - 1].networkStats;
  }
  /**
   * 更新操作统计
   */
  updateOperationStats(e, t) {
    const s = this.metricsHistory.get(e);
    if (!s || s.length === 0)
      return;
    const r = s[s.length - 1];
    r.executionTimes.lastOperation = t, r.executionTimes.totalOperations++;
    const n = r.executionTimes.averageOperation * (r.executionTimes.totalOperations - 1) + t;
    r.executionTimes.averageOperation = n / r.executionTimes.totalOperations;
  }
  /**
   * 存储性能指标
   */
  storeMetrics(e, t) {
    let s = this.metricsHistory.get(e);
    s || (s = [], this.metricsHistory.set(e, s)), s.push(t), s.length > this.maxEntries && s.splice(0, s.length - this.maxEntries);
  }
  /**
   * 检查性能警报
   */
  checkPerformanceAlerts(e) {
    (this.metricsHistory.get(e.pluginId) || []).length < 2 || (e.memoryUsage.heapUsed > this.config.memoryWarningThreshold && this.emitAlert({
      type: "memory",
      severity: e.memoryUsage.heapUsed > this.config.memoryWarningThreshold * 1.5 ? "critical" : "warning",
      pluginId: e.pluginId,
      message: `High memory usage: ${Math.round(e.memoryUsage.heapUsed / 1024 / 1024)}MB`,
      value: e.memoryUsage.heapUsed,
      threshold: this.config.memoryWarningThreshold,
      timestamp: e.timestamp
    }), e.cpuUsage.percent > this.config.cpuWarningThreshold && this.emitAlert({
      type: "cpu",
      severity: e.cpuUsage.percent > this.config.cpuWarningThreshold * 1.2 ? "critical" : "warning",
      pluginId: e.pluginId,
      message: `High CPU usage: ${Math.round(e.cpuUsage.percent)}%`,
      value: e.cpuUsage.percent,
      threshold: this.config.cpuWarningThreshold,
      timestamp: e.timestamp
    }), e.eventLoop.delay > 100 && this.emitAlert({
      type: "eventloop",
      severity: e.eventLoop.delay > 500 ? "critical" : "warning",
      pluginId: e.pluginId,
      message: `High event loop delay: ${Math.round(e.eventLoop.delay)}ms`,
      value: e.eventLoop.delay,
      threshold: 100,
      timestamp: e.timestamp
    }));
  }
  /**
   * 发出性能警报
   */
  emitAlert(e) {
    this.emit("performance-alert", e);
    const t = {
      alertType: e.type,
      value: e.value,
      threshold: e.threshold
    };
    e.severity === "critical" ? m.error(`Performance alert: ${e.message}`, e.pluginId, void 0, t) : m.warn(`Performance alert: ${e.message}`, e.pluginId, t);
  }
  /**
   * 清理过期指标数据
   */
  cleanupOldMetrics() {
    const e = Date.now() - this.config.dataRetentionTime;
    for (const [t, s] of this.metricsHistory) {
      let r = 0;
      for (; s.length > 0 && s[0].timestamp <= e; )
        s.shift(), r++;
      if (r > 0) {
        const n = Date.now(), i = this.config.cleanupLogThrottleMs || 0, o = this.config.cleanupLogMinRemoved || 0, a = this.lastCleanupLogTime.get(t) || 0;
        (r >= o || n - a >= i) && (this.lastCleanupLogTime.set(t, n), m.debug("Cleaned up old metrics", t, {
          removed: r,
          remaining: s.length
        }));
      }
    }
  }
  /**
   * 生成性能报告
   */
  generateReport(e, t) {
    const s = this.metricsHistory.get(e);
    if (!s || s.length === 0)
      return null;
    const r = Date.now(), n = t || {
      start: r - this.config.dataRetentionTime,
      // 默认使用当前保留窗口
      end: r
    }, i = s.filter(
      (f) => f.timestamp >= n.start && f.timestamp <= n.end
    );
    if (i.length === 0)
      return null;
    const o = this.calculateSummary(i), a = this.analyzeTrends(i), c = this.generateRecommendations(o, a), d = {
      pluginId: e,
      timeRange: n,
      summary: o,
      trends: a,
      recommendations: c
    };
    return this.emit("performance-report", { pluginId: e, report: d }), d;
  }
  /**
   * 计算汇总统计
   */
  calculateSummary(e) {
    const t = e.map((o) => o.memoryUsage.heapUsed), s = e.map((o) => o.cpuUsage.percent), r = e.map((o) => o.networkStats.responseTime).filter((o) => o > 0), n = e.reduce((o, a) => o + a.networkStats.requestCount, 0), i = e.reduce((o, a) => o + a.networkStats.errorCount, 0);
    return {
      averageMemory: t.reduce((o, a) => o + a, 0) / t.length,
      peakMemory: Math.max(...t),
      averageCpu: s.reduce((o, a) => o + a, 0) / s.length,
      peakCpu: Math.max(...s),
      totalOperations: e.reduce((o, a) => o + a.executionTimes.totalOperations, 0),
      averageResponseTime: r.length > 0 ? r.reduce((o, a) => o + a, 0) / r.length : 0,
      errorRate: n > 0 ? i / n : 0
    };
  }
  /**
   * 分析性能趋势
   */
  analyzeTrends(e) {
    if (e.length < 2)
      return {
        memoryTrend: "stable",
        cpuTrend: "stable",
        performanceTrend: "stable"
      };
    const t = Math.floor(e.length / 2), s = e.slice(0, t), r = e.slice(t), n = s.reduce((f, w) => f + w.memoryUsage.heapUsed, 0) / s.length, i = r.reduce((f, w) => f + w.memoryUsage.heapUsed, 0) / r.length, o = s.reduce((f, w) => f + w.cpuUsage.percent, 0) / s.length, a = r.reduce((f, w) => f + w.cpuUsage.percent, 0) / r.length, c = (i - n) / n, d = (a - o) / o;
    return {
      memoryTrend: Math.abs(c) < 0.1 ? "stable" : c > 0 ? "increasing" : "decreasing",
      cpuTrend: Math.abs(d) < 0.1 ? "stable" : d > 0 ? "increasing" : "decreasing",
      performanceTrend: c + d > 0.2 ? "degrading" : c + d < -0.2 ? "improving" : "stable"
    };
  }
  /**
   * 生成性能建议
   */
  generateRecommendations(e, t) {
    const s = [];
    return e.averageMemory > this.config.memoryWarningThreshold * 0.8 && s.push("考虑优化内存使用，检查是否存在内存泄漏"), e.averageCpu > this.config.cpuWarningThreshold * 0.8 && s.push("CPU使用率较高，考虑优化算法或使用异步处理"), e.errorRate > 0.05 && s.push("错误率较高，建议检查错误处理逻辑"), e.averageResponseTime > 1e3 && s.push("响应时间较长，考虑使用缓存或优化网络请求"), t.memoryTrend === "increasing" && s.push("内存使用呈上升趋势，建议监控内存泄漏"), t.cpuTrend === "increasing" && s.push("CPU使用呈上升趋势，建议优化计算密集型操作"), t.performanceTrend === "degrading" && s.push("整体性能呈下降趋势，建议进行全面性能优化"), s.length === 0 && s.push("性能表现良好，继续保持"), s;
  }
  /**
   * 获取插件性能指标
   */
  getMetrics(e, t) {
    const s = this.metricsHistory.get(e) || [];
    return t && t > 0 ? s.slice(-t) : [...s];
  }
  /**
   * 获取所有监控的插件
   */
  getMonitoredPlugins() {
    return Array.from(this.pluginStartTimes.keys());
  }
  /**
   * 开始监控
   */
  startMonitoring() {
    this.monitorTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.monitorInterval);
  }
  /**
   * 停止监控
   */
  stopMonitoring() {
    this.monitorTimer && (clearInterval(this.monitorTimer), this.monitorTimer = void 0);
  }
  /**
   * 销毁性能监控器
   */
  destroy() {
    this.stopMonitoring(), this.metricsHistory.clear(), this.operationTimers.clear(), this.pluginStartTimes.clear(), this.lastCpuUsage.clear(), m.info("PluginPerformanceMonitor destroyed");
  }
}
const re = new ar();
class cr extends fe {
  config;
  pluginStates = /* @__PURE__ */ new Map();
  loadQueue = [];
  activeLoads = /* @__PURE__ */ new Set();
  loadPromises = /* @__PURE__ */ new Map();
  accessPatterns = /* @__PURE__ */ new Map();
  suspendedPlugins = /* @__PURE__ */ new Set();
  constructor(e = {}) {
    super(), this.config = {
      preloadPriority: e.preloadPriority || [],
      lazyLoadDelay: e.lazyLoadDelay || 100,
      maxConcurrentLoads: e.maxConcurrentLoads || 3,
      enablePredictiveLoading: e.enablePredictiveLoading !== !1,
      memoryPressureThreshold: e.memoryPressureThreshold || 512 * 1024 * 1024,
      // 512MB
      enableProgressiveLoading: e.enableProgressiveLoading !== !1
    }, this.startMemoryMonitoring(), m.info("PluginLazyLoader initialized", void 0, { config: this.config });
  }
  /**
   * 注册插件用于懒加载
   */
  registerPlugin(e, t = [], s = 0) {
    const r = {
      pluginId: e,
      state: "unloaded",
      priority: s,
      dependencies: t,
      dependents: [],
      lastAccessed: 0,
      accessCount: 0,
      memoryUsage: 0
    };
    this.pluginStates.set(e, r), this.updateDependencyGraph(e, t), this.config.preloadPriority.includes(e) && this.queueLoad(e, 100, "preload"), m.debug("Plugin registered for lazy loading", e, {
      dependencies: t,
      priority: s
    });
  }
  /**
   * 请求加载插件
   */
  async loadPlugin(e, t = 0, s) {
    const r = this.pluginStates.get(e);
    if (!r)
      throw new Error(`Plugin ${e} not registered for lazy loading`);
    if (this.updateAccessPattern(e), r.state === "loaded") {
      r.lastAccessed = Date.now(), r.accessCount++;
      return;
    }
    if (r.state === "loading") {
      const i = this.loadPromises.get(e);
      if (i)
        return i;
    }
    this.isMemoryPressureHigh() && await this.handleMemoryPressure();
    const n = this.performLoad(e, t, s);
    this.loadPromises.set(e, n);
    try {
      await n;
    } finally {
      this.loadPromises.delete(e);
    }
  }
  /**
   * 执行插件加载
   */
  async performLoad(e, t, s) {
    const r = this.pluginStates.get(e);
    await this.loadDependencies(e), await this.waitForLoadSlot(), this.activeLoads.add(e), r.state = "loading", this.emit("plugin-load-started", { pluginId: e, priority: t });
    const n = Date.now();
    re.startOperation(e, "plugin-load");
    try {
      await this.doPluginLoad(e);
      const i = Date.now() - n;
      r.state = "loaded", r.loadTime = i, r.lastAccessed = Date.now(), r.accessCount++, re.endOperation(e, "plugin-load"), this.emit("plugin-load-completed", { pluginId: e, loadTime: i }), this.config.enablePredictiveLoading && this.triggerPredictiveLoading(e), m.info("Plugin loaded successfully", e, {
        loadTime: i,
        requester: s,
        priority: t
      });
    } catch (i) {
      throw r.state = "error", r.errorMessage = i.message, this.emit("plugin-load-failed", { pluginId: e, error: i }), m.error("Plugin load failed", e, i), i;
    } finally {
      this.activeLoads.delete(e), this.processLoadQueue();
    }
  }
  /**
   * 实际执行插件加载逻辑
   */
  async doPluginLoad(e) {
    await new Promise((s) => setTimeout(s, this.config.lazyLoadDelay));
    const t = this.pluginStates.get(e);
    t.memoryUsage = Math.random() * 50 * 1024 * 1024;
  }
  /**
   * 加载插件依赖
   */
  async loadDependencies(e) {
    const t = this.pluginStates.get(e);
    if (!t || t.dependencies.length === 0)
      return;
    const s = t.dependencies.map((r) => {
      const n = this.pluginStates.get(r);
      if (!n)
        throw new Error(`Dependency ${r} not found for plugin ${e}`);
      return n.state !== "loaded" ? this.loadPlugin(r, t.priority + 1, e) : Promise.resolve();
    });
    await Promise.all(s);
  }
  /**
   * 等待加载槽位
   */
  async waitForLoadSlot() {
    for (; this.activeLoads.size >= this.config.maxConcurrentLoads; )
      await new Promise((e) => setTimeout(e, 50));
  }
  /**
   * 队列加载请求
   */
  queueLoad(e, t, s, r) {
    const n = {
      pluginId: e,
      priority: t,
      requester: s,
      callback: r,
      timestamp: Date.now()
    }, i = this.loadQueue.findIndex((o) => o.priority < t);
    i === -1 ? this.loadQueue.push(n) : this.loadQueue.splice(i, 0, n), this.processLoadQueue();
  }
  /**
   * 处理加载队列
   */
  processLoadQueue() {
    for (; this.loadQueue.length > 0 && this.activeLoads.size < this.config.maxConcurrentLoads; ) {
      const e = this.loadQueue.shift();
      this.loadPlugin(e.pluginId, e.priority, e.requester).then(() => {
        e.callback && e.callback();
      }).catch((t) => {
        e.callback && e.callback(t);
      });
    }
  }
  /**
   * 更新依赖关系图
   */
  updateDependencyGraph(e, t) {
    for (const s of t) {
      const r = this.pluginStates.get(s);
      r && !r.dependents.includes(e) && r.dependents.push(e);
    }
  }
  /**
   * 更新访问模式
   */
  updateAccessPattern(e) {
    const t = Date.now();
    let s = this.accessPatterns.get(e);
    s || (s = [], this.accessPatterns.set(e, s)), s.push(t);
    const r = t - 36e5;
    this.accessPatterns.set(
      e,
      s.filter((n) => n > r)
    );
  }
  /**
   * 触发预测性加载
   */
  triggerPredictiveLoading(e) {
    const t = this.pluginStates.get(e);
    if (t) {
      for (const s of t.dependents) {
        const r = this.pluginStates.get(s);
        r && r.state === "unloaded" && setTimeout(() => {
          this.queueLoad(s, -1, "predictive");
        }, this.config.lazyLoadDelay * 2);
      }
      this.predictBasedOnAccessPattern(e);
    }
  }
  /**
   * 基于访问模式预测
   */
  predictBasedOnAccessPattern(e) {
    const t = this.accessPatterns.get(e);
    if (!t || t.length < 2) return;
    if (t.filter((r) => r > Date.now() - 3e5).length >= 3)
      for (const [r, n] of this.pluginStates)
        r !== e && n.state === "unloaded" && this.arePluginsRelated(e, r) && setTimeout(() => {
          this.queueLoad(r, -2, "pattern-prediction");
        }, this.config.lazyLoadDelay * 3);
  }
  /**
   * 检查插件是否相关
   */
  arePluginsRelated(e, t) {
    const s = this.pluginStates.get(e), r = this.pluginStates.get(t);
    return !s || !r ? !1 : s.dependencies.includes(t) || r.dependencies.includes(e) || s.dependencies.some((n) => r.dependencies.includes(n));
  }
  /**
   * 检查内存压力
   */
  isMemoryPressureHigh() {
    const e = process.memoryUsage();
    return e.heapUsed + e.external > this.config.memoryPressureThreshold;
  }
  /**
   * 处理内存压力
   */
  async handleMemoryPressure() {
    const e = process.memoryUsage(), t = e.heapUsed + e.external;
    this.emit("memory-pressure", {
      currentUsage: t,
      threshold: this.config.memoryPressureThreshold
    });
    const s = Array.from(this.pluginStates.values()).filter(
      (r) => r.state === "loaded" && r.priority < 0 && Date.now() - r.lastAccessed > 3e5
      // 5分钟未访问
    ).sort((r, n) => r.lastAccessed - n.lastAccessed);
    for (const r of s.slice(0, 3))
      await this.suspendPlugin(r.pluginId, "memory-pressure");
    m.warn("Memory pressure detected, suspended plugins", void 0, {
      currentUsage: t,
      threshold: this.config.memoryPressureThreshold,
      suspendedCount: s.length
    });
  }
  /**
   * 暂停插件
   */
  async suspendPlugin(e, t) {
    const s = this.pluginStates.get(e);
    if (!s || s.state !== "loaded")
      return;
    if (s.dependents.some((n) => {
      const i = this.pluginStates.get(n);
      return i && i.state === "loaded" && Date.now() - i.lastAccessed < 6e4;
    })) {
      m.debug("Cannot suspend plugin with active dependents", e);
      return;
    }
    s.state = "suspended", this.suspendedPlugins.add(e), this.emit("plugin-suspended", { pluginId: e, reason: t }), m.info("Plugin suspended", e, { reason: t });
  }
  /**
   * 恢复插件
   */
  async resumePlugin(e) {
    const t = this.pluginStates.get(e);
    !t || t.state !== "suspended" || (this.suspendedPlugins.delete(e), await this.loadPlugin(e, t.priority, "resume"), this.emit("plugin-resumed", { pluginId: e }), m.info("Plugin resumed", e));
  }
  /**
   * 卸载插件
   */
  async unloadPlugin(e) {
    const t = this.pluginStates.get(e);
    if (!t)
      return;
    const s = t.dependents.filter((r) => {
      const n = this.pluginStates.get(r);
      return n && (n.state === "loaded" || n.state === "loading");
    });
    if (s.length > 0)
      throw new Error(`Cannot unload plugin ${e}: has active dependents ${s.join(", ")}`);
    t.state = "unloaded", t.loadTime = void 0, t.errorMessage = void 0, t.memoryUsage = 0, this.suspendedPlugins.delete(e), m.info("Plugin unloaded", e);
  }
  /**
   * 获取插件状态
   */
  getPluginState(e) {
    return this.pluginStates.get(e) || null;
  }
  /**
   * 获取所有插件状态
   */
  getAllPluginStates() {
    return Array.from(this.pluginStates.values());
  }
  /**
   * 获取加载统计
   */
  getLoadStats() {
    const e = Array.from(this.pluginStates.values());
    return {
      totalPlugins: e.length,
      loadedPlugins: e.filter((t) => t.state === "loaded").length,
      suspendedPlugins: e.filter((t) => t.state === "suspended").length,
      failedPlugins: e.filter((t) => t.state === "error").length,
      queueLength: this.loadQueue.length,
      activeLoads: this.activeLoads.size
    };
  }
  /**
   * 开始内存监控
   */
  startMemoryMonitoring() {
    setInterval(() => {
      this.isMemoryPressureHigh() && this.handleMemoryPressure();
    }, 3e4);
  }
  /**
   * 销毁懒加载管理器
   */
  destroy() {
    for (const e of this.pluginStates.keys())
      try {
        this.unloadPlugin(e);
      } catch (t) {
        m.error("Error unloading plugin during destroy", e, t);
      }
    this.pluginStates.clear(), this.loadQueue = [], this.activeLoads.clear(), this.loadPromises.clear(), this.accessPatterns.clear(), this.suspendedPlugins.clear(), m.info("PluginLazyLoader destroyed");
  }
}
const he = new cr();
class lr {
  memoryPool;
  connectionPool;
  cache = Ae;
  lazyLoader = he;
  perf = re;
  updater;
  constructor(e) {
    this.memoryPool = e.memoryPool, this.connectionPool = e.connectionPool, this.updater = e.updater;
  }
}
class ur extends fe {
  apiServer;
  roomManager;
  databaseManager;
  configManager;
  processManager;
  pluginUpdater;
  memoryPoolManager;
  connectionPoolManager;
  coordinator;
  tokenManager;
  plugins = /* @__PURE__ */ new Map();
  pluginsDir;
  hotReloadWatchers = /* @__PURE__ */ new Map();
  dataManager = ie.getInstance();
  pendingInitAfterLoaded = /* @__PURE__ */ new Set();
  constructor(e) {
    super(), this.apiServer = e.apiServer, this.roomManager = e.roomManager, this.databaseManager = e.databaseManager, this.configManager = e.configManager, this.tokenManager = e.tokenManager;
    let t = "eager";
    try {
      const r = this.configManager.get("plugins.runtime.mode", "eager");
      String(r || "").trim().toLowerCase() === "adaptive" && (t = "adaptive");
    } catch {
    }
    const s = { ...e.processManagerConfig || {}, runtimeMode: t, autoRestartOnDemand: t === "adaptive" };
    this.processManager = new tr(s), this.pluginsDir = I.join(R.getPath("userData"), "plugins"), this.pluginUpdater = new sr(this.pluginsDir, {
      autoCheck: !1,
      autoDownload: !1,
      autoInstall: !1,
      checkInterval: 1440 * 60 * 1e3,
      // 24小时
      backupBeforeUpdate: !0,
      rollbackOnFailure: !0
    }), this.memoryPoolManager = _t, this.connectionPoolManager = new At(), this.coordinator = new lr({
      memoryPool: this.memoryPoolManager,
      connectionPool: this.connectionPoolManager,
      updater: this.pluginUpdater
    }), this.ensurePluginsDirectory(), this.setupErrorHandling(), this.setupProcessManagerEvents(), this.setupLifecycleEvents(), this.setupHotReloadEvents(), this.setupPerformanceOptimizations();
  }
  setupProcessManagerEvents() {
    this.processManager.on("process.started", ({ pluginId: e, processInfo: t }) => {
      const s = this.plugins.get(e);
      s && (s.status = "enabled", m.info("Plugin process started successfully", e));
      try {
        re.startMonitoringPlugin(e);
      } catch {
      }
      try {
        this.processManager.executeInPlugin(e, "afterloaded", [], void 0, { optional: !0 });
      } catch {
      }
      try {
        const r = `plugin:${e}:overlay`;
        se.getInstance().queueOrPublish(r, { event: "plugin-after-loaded", payload: { ts: Date.now() } }, { ttlMs: 120 * 1e3, persist: !0, meta: { kind: "lifecycle" } });
      } catch {
      }
    }), this.processManager.on("process.stopped", ({ pluginId: e, reason: t }) => {
      const s = this.plugins.get(e);
      if (s) {
        if (t === "manual")
          s.status = "disabled";
        else if (t === "idle_timeout") {
          s.status = s.enabled ? "enabled" : "disabled";
          try {
            re.stopMonitoringPlugin(e);
          } catch {
          }
        } else
          s.status = "error";
        m.info("Plugin process stopped", e);
      }
    }), this.processManager.on("process.error", async ({ pluginId: e, error: t }) => {
      const s = this.plugins.get(e);
      s && (s.status = "error", s.lastError = t.message, this.emit("plugin.error", { id: e, error: t.message }), await Q.handleError(
        e,
        le.RUNTIME_ERROR,
        t.message,
        t,
        { context: "process_manager" }
      ));
    }), this.processManager.on("process.recovered", ({ pluginId: e, attempt: t }) => {
      const s = this.plugins.get(e);
      s && (s.status = "enabled", s.lastError = void 0, m.info("Plugin process recovered successfully", e));
    });
  }
  setupLifecycleEvents() {
    ge.registerHook("onError", async (e) => {
      m.error("Plugin error occurred", e.pluginId), e.error && await Q.handleError(
        e.pluginId,
        le.RUNTIME_ERROR,
        e.error.message,
        e.error,
        e.context
      );
      try {
        await this.processManager.executeInPlugin(e.pluginId, "onError", [e.error, e.context]);
      } catch {
      }
      try {
        const t = `plugin:${e.pluginId}:overlay`;
        se.getInstance().queueOrPublish(t, { event: "plugin-error", payload: { message: e.error?.message, context: e.context } }, { ttlMs: 120 * 1e3, persist: !0, meta: { kind: "lifecycle" } });
      } catch {
      }
    }), this.pluginUpdater.on("update.available", ({ pluginId: e }) => {
      m.info("Plugin update available", e);
    }), this.pluginUpdater.on("update.progress", ({ pluginId: e, progress: t, message: s }) => {
      this.emit("plugin.install.progress", { id: e, progress: t, message: s });
    }), this.pluginUpdater.on("update.completed", ({ pluginId: e }) => {
      m.info("Plugin update completed", e), this.loadInstalledPlugins();
    }), this.pluginUpdater.on("update.failed", async ({ pluginId: e, error: t }) => {
      m.error("Plugin update failed", e, t), await Q.handleError(e, le.RUNTIME_ERROR, t.message, t);
    });
  }
  setupErrorHandling() {
    const e = ie.getInstance();
    Q.on("plugin-error", (t) => {
      try {
        const s = { level: "error", source: "plugin", pluginId: String(t?.pluginId || ""), message: String(t?.message || ""), timestamp: Date.now() };
        e.publish("system:logs", s, { ttlMs: 600 * 1e3, persist: !0, meta: { kind: "log" } });
      } catch {
      }
      try {
        const s = String(t?.pluginId || ""), r = String(t?.message || ""), n = t?.error;
        n && n.stack ? console.error("[PluginError]", s, r, `
`, n.stack) : console.error("[PluginError]", s, r);
      } catch {
      }
    }), Q.on("recovery-execute", async (t) => {
      const { pluginId: s, action: r } = t;
      try {
        switch (r) {
          case $e.DISABLE:
            await this.disablePlugin(s);
            break;
          case $e.UNINSTALL:
            await this.uninstallPlugin(s);
            break;
          case $e.RETRY:
            break;
          case $e.REINSTALL:
            m.warn("Reinstall requested for plugin but no source file available", s);
            break;
        }
      } catch (n) {
        m.error(`Failed to execute recovery action: ${r}`, s, n);
      }
    });
  }
  setupHotReloadEvents() {
    Z.on("reload-requested", async ({ pluginId: e }) => {
      m.info("Hot reload requested", e);
      try {
        await this.reloadPlugin(e);
      } catch (t) {
        m.error("Hot reload failed", e, t), await Q.handleError(e, le.RUNTIME_ERROR, t.message, t, {
          context: "hot_reload"
        });
      }
    }), Z.on("reload-completed", ({ pluginId: e }) => {
      m.info("Hot reload completed successfully", e);
    }), Z.on("reload-failed", ({ pluginId: e, error: t }) => {
      m.error("Hot reload failed", e, new Error(t || "Unknown error"));
    }), Z.on("watch-error", ({ pluginId: e, error: t }) => {
      m.error("File watch error", e);
    });
  }
  setupPerformanceOptimizations() {
    const e = /* @__PURE__ */ new Map();
    re.on("performance-alert", (t) => {
      if (m.warn(`Performance alert for plugin ${t.pluginId}`, t.pluginId, {
        alertType: t.type,
        severity: t.severity,
        message: t.message,
        value: t.value,
        threshold: t.threshold
      }), t.severity === "critical") {
        const s = (e.get(t.pluginId) || 0) + 1;
        e.set(t.pluginId, s), s >= 2 && (this.suspendPlugin(t.pluginId, `Performance issue: ${t.message}`), e.set(t.pluginId, 0));
      } else
        e.set(t.pluginId, 0);
    }), Ae.on("cache-evicted", ({ key: t, reason: s, pluginId: r }) => {
      m.debug("Cache item evicted", r, { key: t, reason: s });
    }), he.on("plugin-load-failed", ({ pluginId: t, error: s }) => {
      m.error("Lazy load failed", t, s);
      const r = this.plugins.get(t);
      r && (r.status = "error", r.lastError = s.message);
    }), he.on("memory-pressure", ({ currentUsage: t, threshold: s }) => {
      m.warn("Memory pressure detected", void 0, {
        currentUsage: Math.round(t / 1024 / 1024) + "MB",
        threshold: Math.round(s / 1024 / 1024) + "MB"
      });
    });
    try {
      setInterval(() => {
        try {
          const t = process.memoryUsage(), s = this.memoryPoolManager.getStats(), r = Ae.getStats();
          m.info("Memory stats", void 0, {
            process: {
              rss: t.rss,
              heapUsed: t.heapUsed,
              heapTotal: t.heapTotal,
              external: t.external
            },
            pool: s,
            cache: r
          });
        } catch {
        }
      }, 3e4);
    } catch {
    }
    m.info("Performance optimizations initialized");
  }
  ensurePluginsDirectory() {
    S.existsSync(this.pluginsDir) || S.mkdirSync(this.pluginsDir, { recursive: !0 });
  }
  loadInstalledPlugins() {
    m.info("Loading installed plugins"), this.plugins.clear();
    try {
      const e = S.readdirSync(this.pluginsDir, { withFileTypes: !0 }).filter((t) => t.isDirectory()).map((t) => t.name);
      m.info(`Found ${e.length} plugin directories`);
      for (const t of e)
        try {
          const s = I.join(this.pluginsDir, t), r = I.join(s, "manifest.json");
          if (S.existsSync(r)) {
            let n;
            try {
              n = JSON.parse(S.readFileSync(r, "utf-8"));
            } catch (c) {
              throw c instanceof Error ? c : new Error(String(c));
            }
            const i = `plugins.${t}`, o = this.configManager.get(i, { enabled: !1, installedAt: Date.now() }), a = {
              id: t,
              name: n.name,
              version: n.version,
              description: n.description,
              author: n.author,
              enabled: o.enabled,
              status: o.enabled ? "enabled" : "disabled",
              installPath: s,
              manifest: n,
              installedAt: o.installedAt || Date.now()
            };
            this.plugins.set(t, a), m.info(`Loaded plugin: ${n.name} v${n.version}`, t);
          } else
            m.warn("Plugin directory missing manifest.json", t, { pluginPath: s });
        } catch (s) {
          const r = `Failed to load plugin: ${s instanceof Error ? s.message : "Unknown error"}`;
          m.error(r, t), Q.handleError(
            t,
            le.LOAD_FAILED,
            r,
            s,
            { pluginPath: I.join(this.pluginsDir, t) }
          );
          const n = {
            id: t,
            name: t,
            version: "0.0.0",
            enabled: !1,
            status: "error",
            installPath: I.join(this.pluginsDir, t),
            manifest: {
              id: t,
              name: t,
              version: "0.0.0",
              main: {
                dir: "dist",
                file: "index.js"
              }
            },
            installedAt: Date.now(),
            lastError: r
          };
          this.plugins.set(t, n);
        }
      try {
        const t = I.join(this.pluginsDir, ".devtools", "config.json"), s = S.existsSync(t) ? JSON.parse(S.readFileSync(t, "utf-8")) : {};
        if (s && typeof s == "object") {
          for (const [r, n] of Object.entries(s))
            if (!this.plugins.has(r))
              try {
                const i = String(n?.manifestPath || "").trim(), o = String(n?.nodePath || "").trim();
                if (!i || !o) continue;
                const a = S.readFileSync(i, "utf-8"), c = JSON.parse(a), d = `plugins.${c.id}`, f = this.configManager.get(d, { enabled: !1 });
                let w = o;
                try {
                  S.existsSync(o) && S.statSync(o).isFile() && (w = I.dirname(o));
                } catch {
                }
                const v = {
                  id: c.id,
                  name: c.name,
                  version: c.version,
                  description: c.description,
                  author: c.author,
                  enabled: f.enabled,
                  status: f.enabled ? "enabled" : "disabled",
                  installPath: w,
                  manifest: c,
                  installedAt: Date.now()
                };
                this.plugins.set(r, v), m.info(`Loaded dev plugin entry: ${c.name} v${c.version}`, r);
              } catch (i) {
                m.warn("Failed to load dev plugin entry", r, i);
              }
        }
      } catch (t) {
        m.warn("Failed to merge dev plugin entries", void 0, t);
      }
      m.info(`Successfully loaded ${this.plugins.size} plugins`);
    } catch (e) {
      const t = `Failed to load installed plugins: ${e instanceof Error ? e.message : "Unknown error"}`;
      m.error(t, void 0, e), Q.handleError(
        "system",
        le.LOAD_FAILED,
        t,
        e,
        { pluginsDir: this.pluginsDir }
      );
    }
  }
  /**
   * 获取所有已安装的插件信息
   */
  getInstalledPlugins() {
    for (const e of this.plugins.values())
      (!e.installPath || !S.existsSync(e.installPath)) && (e.enabled && (e.enabled = !1), e.status = "error", e.lastError = "插件安装目录不存在或已被删除");
    return Array.from(this.plugins.values());
  }
  /**
   * 获取指定插件信息
   */
  getPlugin(e) {
    return this.plugins.get(e);
  }
  /**
   * 验证插件文件
   */
  async validatePluginFile(e) {
    let t;
    try {
      if (!S.existsSync(e))
        throw new Error("插件文件不存在");
      return t = I.join(this.pluginsDir, ".temp", ae.randomUUID()), await this.extractPlugin(e, t), await this.validatePluginManifest(t);
    } finally {
      t && S.existsSync(t) && S.rmSync(t, { recursive: !0, force: !0 });
    }
  }
  /**
   * 安装插件
   */
  async installPlugin(e) {
    const { filePath: t, overwrite: s = !1, enable: r = !1 } = e;
    let n, i = "unknown", o;
    m.info("Starting plugin installation", void 0, { filePath: t, overwrite: s, enable: r }), this.emit("plugin.install.progress", { id: "temp", progress: 0, message: "开始安装插件..." });
    try {
      if (!S.existsSync(t))
        throw new Error("插件文件不存在");
      if (n = I.join(this.pluginsDir, ".temp", ae.randomUUID()), await this.extractPlugin(t, n), this.emit("plugin.install.progress", { id: "temp", progress: 30, message: "解压插件文件..." }), o = await this.validatePluginManifest(n), i = o.id, m.info(`Installing plugin: ${o.name} v${o.version}`, i), this.emit("plugin.install.progress", { id: o.id, progress: 50, message: "验证插件清单..." }), this.plugins.has(o.id) && !s)
        throw new Error(`插件 ${o.id} 已存在，请选择覆盖安装`);
      this.emit("plugin.install.progress", { id: o.id, progress: 70, message: "准备安装插件..." });
      const a = I.join(this.pluginsDir, o.id);
      S.existsSync(a) && S.rmSync(a, { recursive: !0, force: !0 }), S.renameSync(n, a), n = void 0, this.emit("plugin.install.progress", { id: o.id, progress: 90, message: "安装插件文件..." });
      const c = {
        id: o.id,
        name: o.name,
        version: o.version,
        description: o.description,
        author: o.author,
        enabled: r,
        status: r ? "enabled" : "disabled",
        installPath: a,
        manifest: o,
        installedAt: Date.now()
      }, d = `plugins.${o.id}`;
      return this.configManager.set(d, {
        enabled: r,
        installedAt: c.installedAt
      }), this.plugins.set(o.id, c), we.registerPluginVersion(o.id, o), Q.resetRetryCount(o.id), m.info(`Successfully installed plugin: ${o.name} v${o.version}`, i), this.emit("plugin.install.progress", { id: o.id, progress: 100, message: "安装完成" }), this.emit("plugin.installed", { plugin: c }), c;
    } catch (a) {
      const c = a instanceof Error ? a.message : "未知错误";
      if (o && await ge.executeHook("onError", {
        pluginId: o.id,
        error: a,
        context: { phase: "install", filePath: t, overwrite: s, enable: r }
      }), m.error(`Failed to install plugin: ${c}`, i, a, { filePath: t }), await Q.handleError(
        i,
        le.INSTALL_FAILED,
        c,
        a,
        { filePath: t, overwrite: s, enable: r }
      ), n && S.existsSync(n))
        try {
          S.rmSync(n, { recursive: !0, force: !0 });
        } catch (d) {
          m.warn(`Failed to cleanup temp directory: ${n}`, i, d);
        }
      throw this.emit("plugin.error", { id: i, error: c }), a;
    }
  }
  /**
   * 重新加载插件（更新清单并重启）
   */
  async reloadPlugin(e) {
    const t = this.plugins.get(e);
    if (!t)
      throw new Error(`插件 ${e} 不存在`);
    m.info("Reloading plugin...", e);
    try {
      await this.reloadPluginInfo(e), t.enabled && (await this.disablePlugin(e), await new Promise((s) => setTimeout(s, 100)), await this.enablePlugin(e)), m.info("Plugin reloaded successfully", e);
    } catch (s) {
      throw m.error("Failed to reload plugin", e, s), s;
    }
  }
  /**
   * 卸载插件
   */
  async uninstallPlugin(e) {
    const t = this.plugins.get(e), s = await this.removeDevConfig(e);
    if (!t) {
      if (s) {
        this.emit("plugin.uninstalled", { id: e });
        return;
      }
      const r = I.join(this.pluginsDir, e);
      try {
        S.existsSync(r) && S.rmSync(r, { recursive: !0, force: !0 });
      } catch (o) {
        if (m.warn("卸载缺失插件时删除目录失败", e, o), S.existsSync(r))
          throw o;
      }
      const n = `plugins.${e}`;
      this.configManager.delete(n);
      try {
        Z.stopWatching(e);
      } catch {
      }
      try {
        Z.stopPolling(e);
      } catch {
      }
      const i = this.hotReloadWatchers.get(e);
      if (i) {
        try {
          i.close();
        } catch {
        }
        this.hotReloadWatchers.delete(e);
      }
      this.emit("plugin.uninstalled", { id: e });
      return;
    }
    try {
      t.enabled && await this.disablePlugin(e);
      const r = t.installPath.toLowerCase().startsWith(this.pluginsDir.toLowerCase());
      if (!s && r) {
        if (S.existsSync(t.installPath))
          try {
            S.rmSync(t.installPath, { recursive: !0, force: !0 });
          } catch (o) {
            throw m.warn("删除插件目录失败", e, o), o;
          }
      } else
        m.info("跳过删除插件文件（测试/外部插件）", e, { path: t.installPath });
      const n = `plugins.${e}`;
      this.configManager.delete(n), this.plugins.delete(e);
      try {
        Z.stopWatching(e);
      } catch {
      }
      try {
        Z.stopPolling(e);
      } catch {
      }
      const i = this.hotReloadWatchers.get(e);
      if (i) {
        try {
          i.close();
        } catch {
        }
        this.hotReloadWatchers.delete(e);
      }
      this.emit("plugin.uninstalled", { id: e });
    } catch (r) {
      await ge.executeHook("onError", {
        pluginId: e,
        error: r,
        context: { phase: "uninstall", action: "uninstall" }
      });
      const n = r instanceof Error ? r.message : "未知错误";
      throw this.emit("plugin.error", { id: e, error: n }), r;
    }
  }
  /**
   * 启用插件
   */
  async enablePlugin(e) {
    const t = this.plugins.get(e);
    if (!t)
      throw new Error(`插件 ${e} 不存在`);
    if (this.processManager.getProcessInfo(e)) {
      re.startMonitoringPlugin(e), he.registerPlugin(
        e,
        t.manifest.permissions || [],
        0
      ), t.enabled = !0, t.status = "enabled", t.lastError = void 0;
      const r = `plugins.${e}`, n = this.configManager.get(r, {}) || {};
      this.configManager.set(r, { ...n, enabled: !0, installedAt: t.installedAt }), m.info("启用跳过：检测到插件进程已存在，直接标记为启用", e);
      return;
    }
    try {
      t.status = "loading", re.startMonitoringPlugin(e), he.registerPlugin(
        e,
        t.manifest.permissions || [],
        0
        // normal priority
      );
      const r = t.manifest.main && typeof t.manifest.main == "object" && typeof t.manifest.main.dir == "string" && typeof t.manifest.main.file == "string" && t.manifest.main.file.trim() !== "", n = !!(t.manifest.ui || t.manifest.window || t.manifest.overlay);
      if (!r && n) {
        t.enabled = !0, t.status = "enabled", t.lastError = void 0;
        {
          const c = `plugins.${e}`, d = this.configManager.get(c, {}) || {};
          this.configManager.set(c, { ...d, enabled: !0, installedAt: t.installedAt });
        }
        const a = await this.getDevConfig(e) !== null;
        if (process.env.NODE_ENV === "development" || a)
          try {
            await this.enableHotReload(e), m.info("Hot reload enabled for static plugin", e, { pluginId: e });
          } catch (c) {
            m.warn("Failed to enable hot reload for static plugin", e, {
              pluginId: e,
              error: c
            });
          }
        this.emit("plugin.enabled", { id: e }), m.info("Enabled static-hosted plugin without process", e, { pluginId: e });
        return;
      }
      if (!t.manifest.main)
        throw new Error("插件清单文件缺少 main 字段");
      const i = this.resolveMainPath(t.installPath, t.manifest.main);
      if (!S.existsSync(i))
        throw new Error(`插件主入口文件不存在: ${i}`);
      {
        const a = this.configManager.get("server.port", parseInt(process.env.ACFRAME_API_PORT || "18299"));
        await this.processManager.startPluginProcess(e, i, { apiPort: a }, t.manifest);
      }
      t.enabled = !0, t.status = "enabled", t.lastError = void 0;
      {
        const a = `plugins.${e}`, c = this.configManager.get(a, {}) || {};
        this.configManager.set(a, { ...c, enabled: !0, installedAt: t.installedAt });
      }
      const o = t.manifest.test === !0 || await this.getDevConfig(e) !== null;
      if (process.env.NODE_ENV === "development" || o)
        try {
          await this.enableHotReload(e), m.info("Hot reload enabled for plugin", e, { pluginId: e });
        } catch (a) {
          m.warn("Failed to enable hot reload for plugin", e, {
            pluginId: e,
            error: a
          });
        }
      this.emit("plugin.enabled", { id: e }), m.info("Plugin enabled successfully", e, { pluginId: e });
    } catch (r) {
      throw t.status = "error", t.lastError = r instanceof Error ? r.message : "未知错误", re.stopMonitoringPlugin(e), await ge.executeHook("onError", {
        pluginId: e,
        error: r,
        context: { phase: "enable", action: "enable" }
      }), this.emit("plugin.error", { id: e, error: t.lastError }), await Q.handleError(
        e,
        le.ENABLE_FAILED,
        r instanceof Error ? r.message : String(r),
        r instanceof Error ? r : new Error(String(r)),
        { context: "enable_plugin" }
      ), r;
    }
  }
  /**
   * 禁用插件
   */
  async disablePlugin(e) {
    const t = this.plugins.get(e);
    if (!t)
      throw new Error(`插件 ${e} 不存在`);
    if (!t.enabled) {
      if (this.processManager.getProcessInfo(e)) {
        try {
          await this.processManager.stopPluginProcess(e), m.info(`残留插件进程已停止: ${e}`);
        } catch (r) {
          const n = r instanceof Error ? r.message : "未知进程错误";
          m.warn(`停止残留插件进程时出错: ${e} - ${n}`), await Q.handleError(e, le.RUNTIME_ERROR, n, new Error(n));
        }
        re.stopMonitoringPlugin(e), await he.unloadPlugin(e), this.clearPluginCache(e);
      }
      t.status = "disabled", t.lastError = void 0;
      {
        const r = `plugins.${e}`, n = this.configManager.get(r, {}) || {};
        this.configManager.set(r, { ...n, enabled: !1, installedAt: t.installedAt });
      }
      return;
    }
    try {
      if (this.processManager.getProcessInfo(e))
        try {
          await this.processManager.stopPluginProcess(e), m.info(`插件进程已停止: ${e}`);
        } catch (i) {
          const o = i instanceof Error ? i.message : "未知进程错误";
          m.warn(`停止插件进程时出错: ${e} - ${o}`), await Q.handleError(e, le.RUNTIME_ERROR, o, new Error(o));
        }
      else
        m.info(`插件进程不存在，跳过停止步骤: ${e}`);
      re.stopMonitoringPlugin(e), await he.unloadPlugin(e), this.clearPluginCache(e), t.enabled = !1, t.status = "disabled", t.lastError = void 0;
      const r = `plugins.${e}`, n = this.configManager.get(r, {}) || {};
      this.configManager.set(r, { ...n, enabled: !1, installedAt: t.installedAt });
      try {
        this.disableHotReload(e), m.info("Hot reload disabled for plugin", e, { pluginId: e });
      } catch (i) {
        m.warn("Failed to disable hot reload for plugin", e, {
          pluginId: e,
          error: i
        });
      }
      this.emit("plugin.disabled", { id: e });
    } catch (s) {
      await ge.executeHook("onError", {
        pluginId: e,
        error: s,
        context: { phase: "disable", action: "disable" }
      });
      const r = s instanceof Error ? s.message : "未知错误";
      throw this.emit("plugin.error", { id: e, error: r }), s;
    }
  }
  async extractPlugin(e, t) {
    await S.promises.mkdir(t, { recursive: !0 });
    const s = I.extname(e).toLowerCase();
    if (s === ".zip")
      new zt(e).extractAllTo(t, !0);
    else if (s === ".tar" || s === ".gz")
      await Wt.extract({
        file: e,
        cwd: t
      });
    else
      throw new Error(`不支持的插件文件格式: ${s}`);
  }
  /**
   * 解析主文件路径，避免重复拼接
   */
  resolveMainPath(e, t) {
    const s = t.file;
    if (I.isAbsolute(s))
      return s;
    if (!t.dir || t.dir.trim() === "")
      return I.join(e, s);
    const r = I.join(e, t.dir), n = I.normalize(t.dir), i = I.normalize(s);
    return i.startsWith(n + I.sep) || i === n ? I.join(e, s) : I.join(r, s);
  }
  /**
   * 解析库文件路径，避免重复拼接
   */
  resolveLibPath(e, t, s) {
    if (I.isAbsolute(s))
      return s;
    if (t === e)
      return I.join(e, s);
    const r = I.normalize(t), n = I.normalize(s);
    return n.startsWith(r + I.sep) || n === r ? I.join(e, s) : I.join(t, s);
  }
  async validatePluginManifest(e) {
    const t = I.join(e, "manifest.json");
    if (!S.existsSync(t))
      throw new Error("插件清单文件 manifest.json 不存在");
    try {
      const s = S.readFileSync(t, "utf-8"), r = JSON.parse(s);
      if (!r.id || !r.name || !r.version)
        throw new Error("插件清单文件缺少必需字段 (id, name, version)");
      const n = r.main && typeof r.main == "object" && typeof r.main.dir == "string" && typeof r.main.file == "string" && r.main.file.trim() !== "", i = !!(r.ui || r.window || r.overlay);
      if (!n && !i)
        throw new Error("插件清单文件缺少入口: 需要 main 或至少一个 ui/window/overlay");
      if (r.main) {
        if (typeof r.main != "object" || !r.main.dir || !r.main.file)
          throw new Error("main 字段必须是包含 dir 和 file 的对象");
        if (typeof r.main.dir != "string" || typeof r.main.file != "string")
          throw new Error("main.dir 和 main.file 必须是字符串");
        if (r.main.libs !== void 0 && !Array.isArray(r.main.libs))
          throw new Error("main.libs 必须是字符串数组");
      }
      if (!/^\d+\.\d+\.\d+$/.test(r.version))
        throw new Error("插件版本格式错误，应为 x.y.z 格式");
      if (!/^[a-z0-9-_]+$/.test(r.id))
        throw new Error("插件 ID 格式错误，只能包含小写字母、数字、连字符和下划线");
      if (r.spa !== void 0 && typeof r.spa != "boolean")
        throw new Error("manifest.spa 必须为布尔值");
      if (r.icon !== void 0) {
        const d = String(r.icon || "").trim();
        if (!d)
          throw new Error("icon 字段不能为空字符串");
        if (d.includes("/") || d.includes("\\"))
          throw new Error("icon 必须位于插件根目录，禁止使用子目录路径");
        const f = I.extname(d).toLowerCase();
        if (![".png", ".jpg", ".jpeg", ".ico", ".svg"].includes(f))
          throw new Error("icon 文件扩展名不被支持");
        const v = I.join(e, d);
        if (!S.existsSync(v))
          throw new Error(`icon 文件不存在: ${d}`);
      }
      if (n && r.main) {
        const d = this.resolveMainPath(e, r.main);
        if (!S.existsSync(d))
          throw new Error(`插件主文件不存在: ${d}`);
      }
      if (r.main && r.main.libs !== void 0 && Array.isArray(r.main.libs)) {
        const d = I.join(e, r.main.dir);
        for (const f of r.main.libs) {
          if (typeof f != "string")
            throw new Error("main.libs 数组中的每个元素必须是字符串");
          const w = this.resolveLibPath(e, d, f);
          if (!S.existsSync(w))
            throw new Error(`库文件不存在: ${f} (解析为 ${w})`);
        }
      }
      if (r.libs !== void 0) {
        if (!Array.isArray(r.libs))
          throw new Error("libs 必须为字符串数组（已废弃，请使用 main.libs）");
        for (const d of r.libs) {
          if (typeof d != "string" || !d.trim())
            throw new Error("libs 项必须为非空字符串（已废弃，请使用 main.libs）");
          const f = I.join(e, d);
          if (!S.existsSync(f))
            throw new Error(`libs 文件不存在: ${d}`);
        }
      }
      if (r.ui?.wujie) {
        const d = r.ui.wujie;
        if (typeof d.url != "string" || !d.url.trim())
          throw new Error("ui.wujie.url 必须为非空字符串");
        if (d.spa !== void 0 && typeof d.spa != "boolean")
          throw new Error("ui.wujie.spa 必须为布尔值");
        if (d.route !== void 0 && typeof d.route != "string")
          throw new Error("ui.wujie.route 必须为字符串");
        d.spa && (d.route === void 0 || d.route === "") && (d.route = "/");
      }
      if (r.overlay?.wujie) {
        const d = r.overlay.wujie;
        if (typeof d.url != "string" || !d.url.trim())
          throw new Error("overlay.wujie.url 必须为非空字符串");
        if (d.spa !== void 0 && typeof d.spa != "boolean")
          throw new Error("overlay.wujie.spa 必须为布尔值");
        if (d.route !== void 0 && typeof d.route != "string")
          throw new Error("overlay.wujie.route 必须为字符串");
        d.spa && (d.route === void 0 || d.route === "") && (d.route = "/");
      }
      const c = (d, f) => {
        if (f) {
          if (Object.prototype.hasOwnProperty.call(f, "spa"))
            throw new Error(`${d}.spa 已移至顶层 manifest.spa，请删除该字段`);
          if (f.route !== void 0 && typeof f.route != "string")
            throw new Error(`${d}.route 必须为字符串`);
          if (f.html !== void 0 && typeof f.html != "string")
            throw new Error(`${d}.html 必须为字符串`);
          r.spa && (f.route === void 0 || f.route === "") && (f.route = "/");
        }
      };
      return c("ui", r.ui), c("overlay", r.overlay), c("window", r.window), r;
    } catch (s) {
      throw s instanceof SyntaxError ? new Error("插件清单文件格式错误") : s;
    }
  }
  /**
   * 为指定插件返回受控 API（带上下文）。
   */
  getApi(e) {
    return new Qs({
      pluginId: e,
      apiServer: this.apiServer,
      roomManager: this.roomManager,
      databaseManager: this.databaseManager,
      configManager: this.configManager,
      tokenManager: this.tokenManager,
      onPluginFault: (t) => this.emit("plugin.suspended", { id: e, reason: t })
    });
  }
  // 弹窗能力已移除：不再暴露 PopupManager 或相关事件。
  /**
   * 供内部或测试用的路由注册代理（统一走 ApiServer）。
   */
  registerHttpRoute(e, t, s) {
    this.apiServer.registerPluginRoute(e, t, s);
  }
  /**
   * 暂停插件（当插件出现错误或违规时）
   */
  suspendPlugin(e, t) {
    const s = this.plugins.get(e);
    if (!s)
      return;
    s.enabled = !1, s.status = "error", s.lastError = t;
    const r = `plugins.${e}`;
    this.configManager.set(r, {
      enabled: !1,
      installedAt: s.installedAt
    }), this.emit("plugin.suspended", { id: e, reason: t });
  }
  /**
   * 获取插件状态统计
   */
  getPluginStats() {
    const e = Array.from(this.plugins.values());
    return {
      total: e.length,
      enabled: e.filter((t) => t.status === "enabled").length,
      disabled: e.filter((t) => t.status === "disabled").length,
      error: e.filter((t) => t.status === "error").length
    };
  }
  async handlePluginMessage(e, t, s) {
    try {
      if (q.hasSubscription(e, "mainMessage"))
        try {
          const n = `plugin:${e}:overlay`;
          se.getInstance().queueOrPublish(n, { event: String(t), payload: s }, { ttlMs: 120 * 1e3, persist: !1, meta: { kind: "mainMessage" } });
        } catch {
        }
    } catch {
    }
  }
  /**
   * 获取插件日志
   */
  getPluginLogs(e, t = 100) {
    return m.getRecentLogs(e, t);
  }
  /**
   * 获取插件错误历史
   */
  getPluginErrorHistory(e) {
    return Q.getErrorHistory(e);
  }
  /**
   * 获取所有插件的错误统计
   */
  getPluginErrorStats() {
    return Q.getErrorStats();
  }
  /**
   * 手动执行插件恢复操作
   */
  async executePluginRecovery(e, t, s) {
    return Q.executeRecoveryAction(e, t, s);
  }
  /**
   * 重置插件错误计数
   */
  resetPluginErrorCount(e, t) {
    Q.resetRetryCount(e, t);
  }
  /**
   * 清理插件缓存和临时文件
   */
  cleanup() {
    this.processManager.cleanup();
    for (const [t, s] of this.hotReloadWatchers)
      try {
        s.close();
      } catch (r) {
        m.error(`Failed to close watcher for plugin ${t}:`, r.message);
      }
    this.hotReloadWatchers.clear(), Z.cleanup();
    try {
      typeof re.destroy == "function" && re.destroy(), typeof this.memoryPoolManager.cleanup == "function" && this.memoryPoolManager.cleanup(), typeof this.connectionPoolManager.destroy == "function" && this.connectionPoolManager.destroy();
    } catch (t) {
      m.error("Failed to cleanup performance optimization components:", void 0, t);
    }
    const e = I.join(this.pluginsDir, ".temp");
    S.existsSync(e) && S.rmSync(e, { recursive: !0, force: !0 }), m.cleanup?.(), Q.cleanup?.();
  }
  /**
   * 检查插件更新
   */
  async checkPluginUpdate(e) {
    const t = this.plugins.get(e);
    if (!t)
      throw new Error(`插件 ${e} 不存在`);
    return await this.pluginUpdater.checkUpdate(t);
  }
  /**
   * 更新插件
   */
  async updatePlugin(e, t) {
    const s = this.plugins.get(e);
    if (!s)
      throw new Error(`插件 ${e} 不存在`);
    const r = s.enabled;
    r && await this.disablePlugin(e);
    try {
      await this.pluginUpdater.updatePlugin(e, t), await this.loadInstalledPlugins(), r && await this.enablePlugin(e);
    } catch (n) {
      try {
        await this.rollbackPluginUpdate(e), r && await this.enablePlugin(e);
      } catch (i) {
        m.error("插件更新回滚失败", e, i instanceof Error ? i : new Error(String(i)), { pluginId: e, error: i });
      }
      throw n;
    }
  }
  /**
   * 回滚插件更新
   */
  async rollbackPluginUpdate(e) {
    const t = this.plugins.get(e);
    if (!t)
      throw new Error(`Plugin ${e} not found`);
    const s = t.enabled;
    try {
      const r = I.join(this.pluginsDir, `${e}_backup`);
      if (!S.existsSync(r))
        throw new Error(`No backup found for plugin ${e}`);
      await this.disablePlugin(e);
      const n = I.join(this.pluginsDir, e);
      S.rmSync(n, { recursive: !0, force: !0 }), S.cpSync(r, n, { recursive: !0 });
      try {
        this.loadInstalledPlugins();
      } catch {
      }
      return s && await this.enablePlugin(e), m.info(`Plugin ${e} rolled back successfully`), !0;
    } catch (r) {
      if (m.error(`Failed to rollback plugin version: ${r.message}`), s)
        try {
          await this.enablePlugin(e);
        } catch (n) {
          m.error(`Failed to re-enable plugin after rollback failure: ${n.message}`);
        }
      return !1;
    }
  }
  /**
   * 启用插件热重载
   */
  async enableHotReload(e) {
    const t = this.plugins.get(e);
    if (!t)
      throw new Error(`插件 ${e} 不存在`);
    try {
      const s = await this.getDevConfig(e);
      if (t.manifest.test === !0 || !!s) {
        let o = "", a = "";
        s && (s.manifestPath && typeof s.manifestPath == "string" && (o = s.manifestPath), s.nodePath && s.nodePath), o || (o = I.join(t.installPath, "manifest.json"));
        try {
          if (S.existsSync(o)) {
            const d = S.readFileSync(o, "utf-8"), f = JSON.parse(d);
            if (f.main && typeof f.main == "object" && f.main.dir && f.main.file) {
              const w = I.dirname(o);
              a = ((_, b) => {
                const h = b.file;
                if (I.isAbsolute(h))
                  return h;
                if (!b.dir || b.dir.trim() === "")
                  return I.join(_, h);
                const u = I.join(_, b.dir), l = I.normalize(b.dir), y = I.normalize(h);
                return y.startsWith(l + I.sep) || y === l ? I.join(_, h) : I.join(u, h);
              })(w, f.main);
            }
          }
        } catch {
          m.warn(`Failed to read manifest for hot reload path resolution: ${e}`, e);
        }
        const c = [];
        if (o && S.existsSync(o) && c.push(o), a && S.existsSync(a) && c.push(a), c.length > 0) {
          m.info(`Enabling polling hot reload for test plugin ${e}`, e, { files: c });
          const d = Z.startPolling(e, c);
          return d && (t.hotReloadEnabled = !0), d;
        } else
          m.warn(`No valid files found to poll for test plugin ${e}`, e);
      }
      let n = t.installPath;
      if (!S.existsSync(n))
        return m.warn(`Hot reload path does not exist for plugin ${e}`, e, { path: n }), !1;
      m.info(`Enabling standard hot reload for plugin ${e}`, e, { watchPath: n });
      const i = Z.startWatching(e, n);
      return i && (t.hotReloadEnabled = !0), i;
    } catch (s) {
      return m.error(`Failed to enable hot reload for plugin ${e}`, e, s), !1;
    }
  }
  /**
   * 禁用插件热重载
   */
  disableHotReload(e) {
    const t = this.plugins.get(e);
    if (!t)
      return !1;
    try {
      t.hotReloadEnabled = !1;
      const s = this.hotReloadWatchers.get(e);
      if (s) {
        try {
          s.close();
        } catch {
        }
        this.hotReloadWatchers.delete(e);
      }
      try {
        Z.stopWatching(e);
      } catch {
      }
      try {
        Z.stopPolling(e);
      } catch {
      }
      return m.info(`Hot reload disabled for plugin ${e}`), !0;
    } catch (s) {
      return m.error(`Failed to disable hot reload for plugin ${e}:`, s.message), !1;
    }
  }
  /**
   * 手动触发插件热重载
   */
  async manualHotReload(e) {
    const t = this.plugins.get(e);
    if (!t)
      throw new Error(`插件 ${e} 不存在`);
    try {
      t.hotReloadEnabled = !0;
      const s = I.join(this.pluginsDir, e), r = pt(s, {
        ignored: /(^|[\/\\])\../,
        // 忽略隐藏文件
        persistent: !0,
        ignoreInitial: !0
      });
      r.on("change", async (n) => {
        if (t.hotReloadEnabled) {
          m.info(`Plugin ${e} file changed: ${n}`);
          try {
            await Z.manualReload(e);
          } catch (i) {
            m.error(`Hot reload failed for plugin ${e}:`, i.message);
          }
        }
      }), this.hotReloadWatchers.set(e, r), m.info(`Hot reload enabled for plugin ${e}`);
    } catch (s) {
      throw m.error(`Failed to enable hot reload for plugin ${e}:`, s.message), s;
    }
  }
  /**
   * 获取插件热重载状态
   */
  getHotReloadStatus(e) {
    return Z.getWatchStatus(e);
  }
  /**
   * 获取所有启用热重载的插件
   */
  getHotReloadPlugins() {
    return Z.getWatchedPlugins();
  }
  /**
   * 更新热重载配置
   */
  updateHotReloadConfig(e) {
    Z.updateConfig(e);
  }
  /**
   * 获取插件版本历史
   */
  getPluginVersionHistory(e) {
    return we.getVersionHistory(e);
  }
  /**
   * 检查插件更新
   */
  async checkPluginUpdates(e, t) {
    return await we.checkForUpdates(e, t);
  }
  /**
   * 获取版本变更日志
   */
  getPluginChangelog(e, t, s) {
    return we.getChangelog(e, t, s);
  }
  /**
   * 回滚插件到指定版本
   */
  async rollbackPluginVersion(e, t) {
    const s = this.plugins.get(e);
    if (!s)
      throw new Error(`插件 ${e} 不存在`);
    const r = s.enabled;
    try {
      r && await this.disablePlugin(e);
      const n = await we.rollbackToVersion(e, t);
      return n && (s.version = t, r && await this.enablePlugin(e), m.info(`Plugin ${e} rolled back to version ${t}`)), n;
    } catch (n) {
      return m.error(`Failed to rollback plugin version: ${n.message}`), !1;
    }
  }
  /**
   * 比较版本号
   */
  compareVersions(e, t) {
    return we.compareVersions(e, t);
  }
  /**
   * 检查版本约束
   */
  satisfiesVersionConstraint(e, t) {
    return we.satisfiesConstraint(e, t);
  }
  /**
   * 清理旧版本数据
   */
  cleanupOldVersions(e, t = 10) {
    we.cleanupOldVersions(e, t);
  }
  /**
   * 重新加载插件信息（不重启插件）
   */
  async reloadPluginInfo(e) {
    const t = this.plugins.get(e);
    if (t)
      try {
        const s = I.join(t.installPath, "manifest.json");
        if (S.existsSync(s)) {
          const r = S.readFileSync(s, "utf-8"), n = JSON.parse(r);
          t.name = n.name, t.version = n.version, t.description = n.description, t.author = n.author, t.manifest = n, m.info("Plugin info reloaded", e, {
            name: n.name,
            version: n.version
          });
        }
      } catch (s) {
        m.error("Failed to reload plugin info", e, s);
      }
  }
  // --- Development Tools ---
  /**
   * 保存开发工具配置
   */
  async saveDevConfig(e) {
    try {
      const t = I.join(this.pluginsDir, ".devtools", "config.json"), s = I.dirname(t);
      S.existsSync(s) || S.mkdirSync(s, { recursive: !0 });
      let r = {};
      S.existsSync(t) && (r = JSON.parse(S.readFileSync(t, "utf-8")));
      const n = { ...r, [e.pluginId]: e };
      return S.writeFileSync(t, JSON.stringify(n, null, 2)), m.info(`Development config saved for plugin: ${e.pluginId}`, e.pluginId), await this.loadInstalledPlugins(), !0;
    } catch (t) {
      return m.error(`Failed to save dev config: ${t}`, e.pluginId), !1;
    }
  }
  /**
   * 获取开发工具配置
   */
  async getDevConfig(e) {
    try {
      const t = I.join(this.pluginsDir, ".devtools", "config.json");
      if (!S.existsSync(t))
        return e ? null : {};
      const s = JSON.parse(S.readFileSync(t, "utf-8"));
      return e ? s[e] || null : s;
    } catch (t) {
      return m.error(`Failed to get dev config: ${t}`, e), e ? null : {};
    }
  }
  /**
   * 移除开发工具配置
   */
  async removeDevConfig(e) {
    try {
      const t = I.join(this.pluginsDir, ".devtools", "config.json");
      if (!S.existsSync(t))
        return !1;
      const s = JSON.parse(S.readFileSync(t, "utf-8"));
      return e in s ? (delete s[e], S.writeFileSync(t, JSON.stringify(s, null, 2)), m.info(`Removed dev config for plugin: ${e}`), !0) : !1;
    } catch (t) {
      return m.error(`Failed to remove dev config: ${t}`, e), !1;
    }
  }
  /**
   * 启动外部项目调试
   */
  async startExternalDebug(e) {
    try {
      const { pluginId: t, projectUrl: s, nodePath: r, autoConnect: n } = e;
      await this.saveDevConfig(e);
      const i = await this.testExternalConnection(e);
      if (!i.success)
        throw new Error(`无法连接到外部项目: ${i.error}`);
      return n && this.enableHotReload(t), m.info(`External debug started for plugin: ${t}`, t), {
        success: !0,
        status: "connected",
        projectUrl: s,
        nodePath: r,
        hotReloadEnabled: n
      };
    } catch (t) {
      return m.error(`Failed to start external debug: ${t}`, e.pluginId), {
        success: !1,
        error: t instanceof Error ? t.message : String(t)
      };
    }
  }
  /**
   * 停止外部项目调试
   */
  async stopExternalDebug(e) {
    try {
      this.disableHotReload(e);
      const t = await this.getDevConfig(e);
      return t && (t.debugActive = !1, await this.saveDevConfig(t)), m.info(`External debug stopped for plugin: ${e}`, e), {
        success: !0,
        status: "disconnected"
      };
    } catch (t) {
      return m.error(`Failed to stop external debug: ${t}`, e), {
        success: !1,
        error: t instanceof Error ? t.message : String(t)
      };
    }
  }
  /**
   * 测试外部项目连接
   */
  async testExternalConnection(e) {
    try {
      const { projectUrl: t, nodePath: s, manifestPath: r } = e;
      if (t)
        try {
          const i = await fetch(t, {
            method: "HEAD",
            signal: AbortSignal.timeout(5e3)
          });
          if (!i.ok)
            throw new Error(`HTTP ${i.status}: ${i.statusText}`);
        } catch (i) {
          return {
            success: !1,
            error: `无法连接到项目URL: ${i instanceof Error ? i.message : String(i)}`
          };
        }
      let n = !1;
      if (s) {
        if (!S.existsSync(s))
          return {
            success: !1,
            error: `代码路径不存在: ${s}`
          };
        if (S.statSync(s).isFile())
          n = !0;
        else {
          const o = I.join(s, "package.json"), a = I.join(s, "index.js"), c = I.join(s, "index.ts");
          if (!S.existsSync(o) && !S.existsSync(a) && !S.existsSync(c))
            return {
              success: !1,
              error: "Node.js路径中未找到有效的项目文件 (package.json, index.js, index.ts)"
            };
        }
      }
      if (r) {
        if (!S.existsSync(r))
          return { success: !1, error: `manifest文件不存在: ${r}` };
        let i = "";
        try {
          i = S.readFileSync(r, "utf-8");
        } catch (w) {
          return { success: !1, error: `读取manifest失败: ${w?.message || String(w)}` };
        }
        let o;
        try {
          o = JSON.parse(i);
        } catch (w) {
          return { success: !1, error: `manifest格式非法: ${w?.message || String(w)}` };
        }
        const a = typeof o?.id == "string" && o.id.trim().length > 0, c = typeof o?.name == "string" && o.name.trim().length > 0, d = typeof o?.version == "string" && o.version.trim().length > 0, f = o?.main && typeof o.main == "object" && typeof o.main.dir == "string" && typeof o.main.file == "string" && o.main.dir.trim().length > 0 && o.main.file.trim().length > 0;
        if (!a || !c || !d)
          return { success: !1, error: "manifest缺少必填字段(id/name/version)" };
        if (f)
          try {
            const w = String(o.id);
            let v = "";
            if (s && n ? v = s : v = I.join(String(s || I.dirname(r)), String(o.main)), !S.existsSync(v))
              return { success: !1, error: `主入口文件不存在: ${v}` };
            const _ = this.configManager.get("server.port", parseInt(process.env.ACFRAME_API_PORT || "18299"));
            try {
              await this.processManager.startPluginProcess(w, v, { apiPort: _ }, o);
              try {
                await this.processManager.executeInPlugin(w, "init", [], 3e3, { optional: !0 });
              } catch (b) {
                const h = b && b.message ? b.message : String(b);
                if (h && h.toLowerCase().includes("not running")) throw b;
              }
            } catch (b) {
              return { success: !1, error: `主入口加载失败: ${b?.message || String(b)}` };
            } finally {
              try {
                await this.processManager.stopPluginProcess(w, "manual");
              } catch {
              }
            }
          } catch (w) {
            return { success: !1, error: `主入口校验失败: ${w?.message || String(w)}` };
          }
      }
      return {
        success: !0,
        message: "测试加载成功",
        projectUrl: t || null,
        nodePath: s || null
      };
    } catch (t) {
      return {
        success: !1,
        error: t instanceof Error ? t.message : String(t)
      };
    }
  }
  /**
   * 获取调试状态
   */
  async getDebugStatus(e) {
    try {
      const t = await this.getDevConfig(e), s = this.getHotReloadStatus(e);
      return {
        success: !0,
        pluginId: e,
        config: t || null,
        hotReloadEnabled: s?.enabled || !1,
        debugActive: t?.debugActive || !1,
        lastConnection: t?.lastConnection || null
      };
    } catch (t) {
      return {
        success: !1,
        error: t instanceof Error ? t.message : String(t)
      };
    }
  }
  /**
   * 获取插件性能指标
   */
  getPluginPerformanceMetrics(e) {
    return re.getMetrics(e);
  }
  /**
   * 获取插件缓存统计
   */
  getPluginCacheStats(e) {
    return Ae.getStats();
  }
  /**
   * 获取插件懒加载状态
   */
  getPluginLazyLoadStatus(e) {
    return he.getPluginState(e);
  }
  /**
   * 获取内存池统计
   */
  getMemoryPoolStats() {
    return this.memoryPoolManager.getStats();
  }
  /**
   * 获取连接池统计
   */
  getConnectionPoolStats() {
    return this.connectionPoolManager.getStats();
  }
  /**
   * 生成性能报告
   */
  async generatePerformanceReport(e) {
    return re.generateReport(e || "");
  }
  /**
   * 清理插件缓存
   */
  clearPluginCache(e) {
    e ? Ae.clear(e) : Ae.clear();
  }
  /**
   * 预加载插件
   */
  async preloadPlugin(e) {
    await he.loadPlugin(e);
  }
  /**
   * 暂停插件懒加载
   */
  suspendPluginLazyLoad(e) {
    he.suspendPlugin(e, "Manual suspension");
  }
  /**
   * 恢复插件懒加载
   */
  resumePluginLazyLoad(e) {
    he.resumePlugin(e);
  }
}
class dr extends ce {
  overlays = /* @__PURE__ */ new Map();
  baseZIndex = 2e3;
  zIndexCounter = 0;
  constructor() {
    super(), this.setMaxListeners(100);
  }
  /**
   * 创建新的overlay
   */
  async createOverlay(e) {
    try {
      if (console.log("[OverlayManager#createOverlay] called with options:", {
        pluginId: e.pluginId,
        type: e.type,
        id: e.id,
        style: e.style,
        position: e.position,
        size: e.size
      }), e.pluginId) {
        const n = e.type || "default", i = Array.from(this.overlays.values()).find(
          (o) => o.pluginId === e.pluginId && o.type === n
        );
        if (i)
          return console.log("[OverlayManager#createOverlay] singleton hit, return existing overlayId:", i.id), { success: !0, overlayId: i.id };
      }
      const t = e.id || Bt();
      if (this.overlays.has(t))
        return {
          success: !1,
          error: `Overlay with ID '${t}' already exists`
        };
      try {
        if (e.pluginId) {
          await ge.executeHook("beforeOverlayOpen", {
            pluginId: e.pluginId,
            context: { pageType: "overlay", overlayId: t, route: e?.type === "html" ? "overlay.html" : void 0 }
          });
          try {
            const n = `plugin:${e.pluginId}:overlay`;
            require("../persistence/DataManager").DataManager.getInstance().publish(n, { overlayId: t, event: "before-overlay-open", payload: { options: e } }, { ttlMs: 120 * 1e3, persist: !0, meta: { kind: "lifecycle" } });
          } catch {
          }
        }
      } catch (n) {
        m.warn(
          "[OverlayManager] beforeOverlayOpen hook error",
          n instanceof Error ? n.message : String(n)
        );
      }
      const s = Date.now(), r = {
        ...e,
        id: t,
        visible: !0,
        createdAt: s,
        updatedAt: s,
        zIndex: this.baseZIndex + ++this.zIndexCounter
      };
      this.overlays.set(t, r), console.log("[OverlayManager#createOverlay] overlay created:", {
        overlayId: t,
        pluginId: r.pluginId,
        type: r.type,
        visible: r.visible,
        style: r.style,
        zIndex: r.zIndex
      }), this.emit("overlay-created", r);
      try {
        if (r.pluginId) {
          await ge.executeHook("afterOverlayOpen", {
            pluginId: r.pluginId,
            context: { pageType: "overlay", overlayId: t }
          });
          try {
            const n = `plugin:${r.pluginId}:overlay`;
            require("../persistence/DataManager").DataManager.getInstance().publish(n, { overlayId: t, event: "after-overlay-open", payload: { overlay: r } }, { ttlMs: 120 * 1e3, persist: !0, meta: { kind: "lifecycle" } });
          } catch {
          }
        }
      } catch (n) {
        m.warn(
          "[OverlayManager] afterOverlayOpen hook error",
          n instanceof Error ? n.message : String(n)
        );
      }
      return {
        success: !0,
        overlayId: t
      };
    } catch (t) {
      return console.error("[OverlayManager#createOverlay] failed:", t instanceof Error ? t.message : t), {
        success: !1,
        error: t instanceof Error ? t.message : "Unknown error occurred"
      };
    }
  }
  /**
   * 更新overlay
   */
  async updateOverlay(e, t) {
    try {
      console.log("[OverlayManager#updateOverlay] called:", { overlayId: e, updates: t });
      const s = this.overlays.get(e);
      if (!s)
        return console.warn("[OverlayManager#updateOverlay] not found:", e), {
          success: !1,
          error: `Overlay with ID '${e}' not found`
        };
      const r = {
        ...s,
        ...t,
        id: e,
        // 确保ID不被覆盖
        updatedAt: Date.now()
      };
      return this.overlays.set(e, r), console.log("[OverlayManager#updateOverlay] emitting overlay-updated:", {
        overlayId: e,
        pluginId: r.pluginId,
        type: r.type,
        visible: r.visible,
        style: r.style,
        updatedAt: r.updatedAt
      }), this.emit("overlay-updated", r), { success: !0 };
    } catch (s) {
      return console.error("[OverlayManager#updateOverlay] failed:", s instanceof Error ? s.message : s), {
        success: !1,
        error: s instanceof Error ? s.message : "Unknown error occurred"
      };
    }
  }
  /**
   * 关闭overlay
   */
  async closeOverlay(e) {
    try {
      console.log("[OverlayManager#closeOverlay] called:", { overlayId: e });
      const t = this.overlays.get(e);
      if (!t)
        return console.warn("[OverlayManager#closeOverlay] not found:", e), {
          success: !1,
          error: `Overlay with ID '${e}' not found`
        };
      this.overlays.delete(e), console.log("[OverlayManager#closeOverlay] emitting overlay-closed:", { overlayId: e }), this.emit("overlay-closed", e);
      try {
        if (t.pluginId) {
          await ge.executeHook("overlayClosed", {
            pluginId: t.pluginId,
            context: { pageType: "overlay", overlayId: e }
          });
          try {
            const s = `plugin:${t.pluginId}:overlay`;
            require("../persistence/DataManager").DataManager.getInstance().publish(s, { overlayId: e, event: "overlay-closed", payload: {} }, { ttlMs: 60 * 1e3, persist: !0, meta: { kind: "lifecycle" } });
          } catch {
          }
        }
      } catch (s) {
        m.warn(
          "[OverlayManager] overlayClosed hook error",
          s instanceof Error ? s.message : String(s)
        );
      }
      return { success: !0 };
    } catch (t) {
      return console.error("[OverlayManager#closeOverlay] failed:", t instanceof Error ? t.message : t), {
        success: !1,
        error: t instanceof Error ? t.message : "Unknown error occurred"
      };
    }
  }
  /**
   * 显示overlay
   */
  async showOverlay(e) {
    return console.log("[OverlayManager#showOverlay] called:", { overlayId: e }), this.updateOverlay(e, { visible: !0 });
  }
  /**
   * 隐藏overlay
   */
  async hideOverlay(e) {
    return console.log("[OverlayManager#hideOverlay] called:", { overlayId: e }), this.updateOverlay(e, { visible: !1 });
  }
  /**
   * 将overlay置于顶层
   */
  async bringToFront(e) {
    try {
      console.log("[OverlayManager#bringToFront] called:", { overlayId: e });
      const t = this.overlays.get(e);
      if (!t)
        return console.warn("[OverlayManager#bringToFront] not found:", e), {
          success: !1,
          error: `Overlay with ID '${e}' not found`
        };
      const s = this.baseZIndex + ++this.zIndexCounter;
      return this.updateOverlay(e, {
        style: {
          ...t.style || {},
          zIndex: s
        }
      });
    } catch (t) {
      return console.error("[OverlayManager#bringToFront] failed:", t instanceof Error ? t.message : t), {
        success: !1,
        error: t instanceof Error ? t.message : "Unknown error occurred"
      };
    }
  }
  /**
   * 获取overlay列表
   */
  async listOverlays() {
    const e = Array.from(this.overlays.values()).map((t) => ({
      id: t.id,
      type: t.type,
      visible: t.visible,
      createdAt: t.createdAt,
      pluginId: t.pluginId,
      roomId: t.roomId
    }));
    return console.log("[OverlayManager#listOverlays] overlays:", e), { overlays: e };
  }
  /**
   * 发送消息到指定 overlay（UI/Window -> Overlay）
   */
  async sendMessage(e, t, s) {
    try {
      console.log("[OverlayManager#sendMessage] called:", { overlayId: e, event: t, hasPayload: s !== void 0 });
      const r = this.overlays.get(e);
      if (!r)
        return console.warn("[OverlayManager#sendMessage] not found:", e), {
          success: !1,
          error: `Overlay with ID '${e}' not found`
        };
      const n = { overlayId: e, event: t, payload: s };
      console.log("[OverlayManager#sendMessage] emitting overlay-message:", n), this.emit("overlay-message", n);
      try {
        const i = { ...r, updatedAt: Date.now() };
        this.overlays.set(e, i), console.log("[OverlayManager#sendMessage] emitting overlay-updated due to message:", { overlayId: e, updatedAt: i.updatedAt }), this.emit("overlay-updated", i);
      } catch {
      }
      return { success: !0 };
    } catch (r) {
      return console.error("[OverlayManager#sendMessage] failed:", r instanceof Error ? r.message : r), {
        success: !1,
        error: r instanceof Error ? r.message : "Unknown error occurred"
      };
    }
  }
  /**
   * 处理overlay动作
   */
  async handleOverlayAction(e, t, s) {
    try {
      console.log("[OverlayManager#handleOverlayAction] called:", { overlayId: e, action: t, data: s });
      const r = this.overlays.get(e);
      if (!r)
        return console.warn("[OverlayManager#handleOverlayAction] not found:", e), {
          success: !1,
          error: `Overlay with ID '${e}' not found`
        };
      this.emit("overlay-action", {
        overlayId: e,
        action: t,
        data: s,
        overlay: r
      }), console.log("[OverlayManager#handleOverlayAction] emitted overlay-action:", { overlayId: e, action: t });
      const n = String(t || "").toLowerCase();
      if (n === "update") {
        console.log("[OverlayManager#handleOverlayAction] normalized to update, applying updates");
        const i = s && typeof s == "object" ? s : {};
        return await this.updateOverlay(e, i);
      }
      if (n === "close")
        return console.log("[OverlayManager#handleOverlayAction] normalized to close"), await this.closeOverlay(e);
      if (n === "show")
        return console.log("[OverlayManager#handleOverlayAction] normalized to show"), await this.showOverlay(e);
      if (n === "hide")
        return console.log("[OverlayManager#handleOverlayAction] normalized to hide"), await this.hideOverlay(e);
      if (n === "bringtofront" || n === "front" || n === "top")
        return console.log("[OverlayManager#handleOverlayAction] normalized to bringToFront"), await this.bringToFront(e);
      try {
        const i = { ...r, updatedAt: Date.now() };
        this.overlays.set(e, i), console.log("[OverlayManager#handleOverlayAction] unknown action, emitting overlay-updated:", { overlayId: e, updatedAt: i.updatedAt }), this.emit("overlay-updated", i);
      } catch {
      }
      return { success: !0 };
    } catch (r) {
      return console.error("[OverlayManager#handleOverlayAction] failed:", r instanceof Error ? r.message : r), {
        success: !1,
        error: r instanceof Error ? r.message : "Unknown error occurred"
      };
    }
  }
  /**
   * 获取overlay详情
   */
  getOverlay(e) {
    return this.overlays.get(e);
  }
  /**
   * 获取所有overlay
   */
  getAllOverlays() {
    return Array.from(this.overlays.values());
  }
  /**
   * 清除所有overlay
   */
  clearAllOverlays() {
    const e = Array.from(this.overlays.keys());
    this.overlays.clear(), e.forEach((t) => {
      this.emit("overlay-closed", t);
    });
  }
  /**
   * 根据插件ID清除overlay
   */
  clearOverlaysByPlugin(e) {
    Array.from(this.overlays.values()).filter((s) => s.pluginId === e).forEach((s) => {
      this.overlays.delete(s.id), this.emit("overlay-closed", s.id);
    });
  }
  /**
   * 根据房间ID清除overlay
   */
  clearOverlaysByRoom(e) {
    Array.from(this.overlays.values()).filter((s) => s.roomId === e).forEach((s) => {
      this.overlays.delete(s.id), this.emit("overlay-closed", s.id);
    });
  }
  /**
   * 获取统计信息
   */
  getStats() {
    const e = Array.from(this.overlays.values());
    return {
      total: e.length,
      visible: e.filter((t) => t.visible).length,
      hidden: e.filter((t) => !t.visible).length,
      byType: e.reduce((t, s) => (t[s.type] = (t[s.type] || 0) + 1, t), {}),
      byPlugin: e.reduce((t, s) => (s.pluginId && (t[s.pluginId] = (t[s.pluginId] || 0) + 1), t), {})
    };
  }
  /**
   * 验证overlay数据
   */
  validateOverlay(e) {
    return e && typeof e == "object" && typeof e.id == "string" && typeof e.type == "string" && typeof e.visible == "boolean" && typeof e.createdAt == "number" && typeof e.updatedAt == "number" && typeof e.zIndex == "number";
  }
  /**
   * 销毁管理器
   */
  destroy() {
    this.clearAllOverlays(), this.removeAllListeners();
  }
  /**
   * 加载overlays
   */
  async loadOverlays() {
    try {
      const e = I.join(R.getPath("userData"), "overlays");
      S.existsSync(e) || (S.mkdirSync(e, { recursive: !0 }), m.info("Created overlays directory:", e));
      const t = S.readdirSync(e);
      for (const s of t)
        if (s.endsWith(".json"))
          try {
            const r = I.join(e, s), n = S.readFileSync(r, "utf-8"), i = JSON.parse(n);
            this.validateOverlay(i) ? (this.overlays.set(i.id, i), m.info("Loaded overlay:", i.id)) : m.warn("Invalid overlay file:", s);
          } catch (r) {
            m.error("Failed to load overlay file:", s, r);
          }
      m.info("Overlays loaded:", this.overlays.size.toString());
    } catch (e) {
      m.error("Failed to load overlays:", e);
    }
  }
}
const st = process.env.VITE_DEV_SERVER_URL;
class hr {
  windows = /* @__PURE__ */ new Map();
  windowActivity = /* @__PURE__ */ new Map();
  // Track last activity time (for statistics only)
  configManager;
  pluginManager;
  sharedSession;
  constructor(e) {
    this.configManager = e, this.sharedSession = Ct.fromPartition("persist:plugin-windows-shared", { cache: !0 });
    try {
      this.sharedSession.webRequest.onHeadersReceived((t, s) => {
        try {
          const r = { ...t.responseHeaders };
          for (const n of Object.keys(r)) {
            const i = n.toLowerCase();
            (i === "content-security-policy" || i === "x-content-security-policy" || i === "x-webkit-csp") && delete r[n];
          }
          s({ responseHeaders: r });
        } catch {
          try {
            s({ responseHeaders: t.responseHeaders });
          } catch {
          }
        }
      });
    } catch {
    }
  }
  setPluginManager(e) {
    this.pluginManager = e;
  }
  getWindow(e) {
    const t = this.windows.get(e);
    if (t && !t.isDestroyed()) return t;
  }
  async open(e) {
    try {
      const t = this.windows.get(e);
      if (t && !t.isDestroyed())
        return t.show(), t.focus(), { success: !0 };
      let s = 800, r = 600, n = 480, i = 360, o = !0, a = !1, c = !1, d = !1;
      if (this.pluginManager) {
        const h = this.pluginManager.getPlugin(e);
        if (h?.manifest?.window) {
          const u = h.manifest.window;
          typeof u.width == "number" && (s = u.width), typeof u.height == "number" && (r = u.height), typeof u.minWidth == "number" && (n = u.minWidth), typeof u.minHeight == "number" && (i = u.minHeight), typeof u.resizable == "boolean" && (o = u.resizable), typeof u.frame == "boolean" && (a = u.frame), typeof u.transparent == "boolean" && (c = u.transparent), typeof u.alwaysOnTop == "boolean" && (d = u.alwaysOnTop);
        }
      }
      const f = new ne({
        show: !1,
        width: s,
        height: r,
        minWidth: n,
        minHeight: i,
        frame: a,
        resizable: o,
        transparent: c,
        alwaysOnTop: d,
        webPreferences: {
          nodeIntegration: !1,
          contextIsolation: !0,
          sandbox: !1,
          preload: x.join(__dirname, "../../preload/dist/exposed.mjs"),
          // Memory optimization options
          partition: "persist:plugin-windows-shared",
          // Share session across plugin windows
          backgroundThrottling: !0,
          // Throttle background tabs/windows
          enableWebSQL: !1,
          // Disable deprecated WebSQL
          v8CacheOptions: "code",
          // Optimize V8 code caching
          // Disable unnecessary features to reduce memory
          spellcheck: !1,
          enableBlinkFeatures: void 0,
          disableBlinkFeatures: "Auxclick"
          // Disable auxclick to reduce event overhead
        }
      }), w = () => {
        this.windowActivity.set(e, Date.now());
      };
      f.once("ready-to-show", () => {
        try {
          f.show();
        } catch {
        }
        w();
        try {
          for (const h of process.argv)
            if (String(h).trim() === "--debug") {
              try {
                f.webContents.openDevTools({ mode: "detach" });
              } catch {
              }
              return;
            }
        } catch {
        }
        if (st)
          try {
            f.webContents.openDevTools({ mode: "detach" });
          } catch {
          }
      }), f.on("focus", w), f.on("show", w), f.webContents.on("did-navigate", w), f.webContents.on("did-navigate-in-page", w);
      const v = `#/plugins/${encodeURIComponent(e)}/window`, _ = (() => {
        try {
          if (this.configManager) {
            const h = Number(this.configManager.get("server.port"));
            if (Number.isFinite(h) && h > 0 && h <= 65535) return h;
          }
        } catch {
        }
      })(), b = _ ? `?apiPort=${_}` : "";
      if (st)
        await f.loadURL(`${st}${b}${v}`);
      else {
        const h = R.isPackaged ? x.join(process.resourcesPath, "app", "packages", "renderer", "dist", "index.html") : x.join(R.getAppPath(), "packages", "renderer", "dist", "index.html");
        await f.loadFile(h, { hash: v.replace(/^#/, ""), search: b });
      }
      f.on("closed", () => {
        this.windows.delete(e), this.windowActivity.delete(e);
      });
      try {
        const h = ye();
        f.webContents.on("console-message", (u, l, y, E, p) => {
          try {
            const A = String(y), T = String(p);
            if (!!(A.includes("[obs-assistant]") || T.includes("devtools://devtools") && (A.includes("Autofill.enable") || A.includes("Autofill.setAddresses")))) return;
            const D = l === 2 ? "error" : l === 1 ? "warn" : "info";
            h.addLog("renderer", `[${T}:${E}] ${A}`, D);
          } catch {
          }
        });
      } catch {
      }
      return this.windows.set(e, f), { success: !0 };
    } catch (t) {
      return { success: !1, error: String(t?.message || t) };
    }
  }
  async focus(e) {
    const t = this.windows.get(e);
    if (!t || t.isDestroyed())
      return { success: !1, error: "Window not found" };
    try {
      return t.show(), t.focus(), { success: !0 };
    } catch (s) {
      return { success: !1, error: String(s?.message || s) };
    }
  }
  async close(e) {
    const t = this.windows.get(e);
    if (!t || t.isDestroyed())
      return { success: !1, error: "Window not found" };
    try {
      return t.close(), { success: !0 };
    } catch (s) {
      return { success: !1, error: String(s?.message || s) };
    }
  }
  async isOpen(e) {
    const t = this.windows.get(e);
    return { success: !0, open: !!t && !t.isDestroyed() };
  }
  async list() {
    try {
      return { success: !0, windows: Array.from(this.windows.entries()).map(([t, s]) => ({
        pluginId: t,
        visible: !!s && !s.isDestroyed() && s.isVisible(),
        focused: !!s && !s.isDestroyed() && s.isFocused()
      })) };
    } catch (e) {
      return { success: !1, error: String(e?.message || e) };
    }
  }
  send(e, t, s) {
    const r = this.windows.get(e);
    if (!r || r.isDestroyed()) return !1;
    try {
      return r.webContents.send(t, s), this.windowActivity.set(e, Date.now()), !0;
    } catch {
      return !1;
    }
  }
  /**
   * Get memory usage statistics for all plugin windows
   */
  async getMemoryStats() {
    const e = [];
    let t = 0;
    for (const [s, r] of this.windows.entries())
      if (r && !r.isDestroyed())
        try {
          const n = r.webContents.getProcessMemoryInfo;
          if (typeof n == "function") {
            const i = await n();
            if (i) {
              const a = (i.privateBytes || i.private || 0) / 1024 / 1024;
              e.push({ pluginId: s, memoryMB: a }), t += a;
            }
          }
        } catch {
        }
    return {
      windowCount: e.length,
      totalMemoryMB: t,
      windows: e
    };
  }
  /**
   * Cleanup: Close all windows and clear resources
   */
  destroy() {
    for (const [e, t] of this.windows.entries())
      try {
        t && !t.isDestroyed() && t.close();
      } catch {
      }
    this.windows.clear(), this.windowActivity.clear();
  }
}
class gr {
  constructor(e, t) {
    this.databaseManager = e, this.configManager = t, this.outputDir = I.join(R.getPath("userData"), "diagnostics"), this.ensureOutputDirectory();
  }
  logManager = ye();
  outputDir;
  ensureOutputDirectory() {
    S.existsSync(this.outputDir) || S.mkdirSync(this.outputDir, { recursive: !0 });
  }
  collectSystemInfo() {
    const e = this.getPackageInfo();
    return {
      platform: _e.platform(),
      arch: _e.arch(),
      nodeVersion: process.version,
      electronVersion: process.versions.electron || "unknown",
      appVersion: e?.version || "unknown",
      totalMemory: _e.totalmem(),
      freeMemory: _e.freemem(),
      cpuCount: _e.cpus().length,
      uptime: _e.uptime(),
      userDataPath: R.getPath("userData"),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  getPackageInfo() {
    try {
      const e = I.join(__dirname, "../../package.json");
      if (S.existsSync(e))
        return JSON.parse(S.readFileSync(e, "utf8"));
    } catch (e) {
      this.logManager.addLog("diagnostics", `Failed to read package.json: ${e}`, "warn");
    }
    return null;
  }
  collectPluginInfo() {
    try {
      const e = I.join(R.getPath("userData"), "plugins");
      if (!S.existsSync(e))
        return [];
      const t = [], s = S.readdirSync(e, { withFileTypes: !0 }).filter((r) => r.isDirectory()).map((r) => r.name);
      for (const r of s)
        try {
          const n = I.join(e, r, "manifest.json");
          if (S.existsSync(n)) {
            const i = JSON.parse(S.readFileSync(n, "utf8"));
            t.push({
              id: r,
              name: i.name || r,
              version: i.version || "unknown",
              enabled: i.enabled !== !1,
              status: "unknown"
              // TODO: 从PluginManager获取实际状态
            });
          }
        } catch (n) {
          this.logManager.addLog("diagnostics", `Failed to read plugin manifest for ${r}: ${n}`, "warn");
        }
      return t;
    } catch (e) {
      return this.logManager.addLog("diagnostics", `Failed to collect plugin info: ${e}`, "error"), [];
    }
  }
  async collectDatabaseSchema() {
    try {
      const e = this.databaseManager.getDb();
      return (await new Promise((s, r) => {
        e.all(`
          SELECT name, type, sql 
          FROM sqlite_master 
          WHERE type IN ('table', 'index', 'view')
          ORDER BY type, name
        `, (n, i) => {
          n ? r(n) : s(i);
        });
      })).map((s) => ({
        name: s.name,
        type: s.type,
        sql: s.sql
      }));
    } catch (e) {
      return this.logManager.addLog("diagnostics", `Failed to collect database schema: ${e}`, "error"), [];
    }
  }
  sanitizeConfig(e) {
    if (!e) return {};
    const t = JSON.parse(JSON.stringify(e)), s = (r) => {
      if (typeof r != "object" || r === null)
        return r;
      if (Array.isArray(r))
        return r.map(s);
      const n = {};
      for (const [i, o] of Object.entries(r)) {
        const a = i.toLowerCase();
        a.includes("token") || a.includes("secret") || a.includes("password") || a.includes("auth") || a.includes("cookie") ? n[i] = "***REDACTED***" : n[i] = s(o);
      }
      return n;
    };
    return s(t);
  }
  /**
   * 获取最近的日志条目
   */
  getRecentLogs(e = 100, t) {
    const s = this.logManager.getRecentLogs(e);
    return t ? s.filter((r) => r.level === t) : s;
  }
  /**
   * 生成诊断包
   */
  async generateDiagnosticPackage() {
    const t = `diagnostic-package-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.zip`, s = I.join(this.outputDir, t);
    try {
      this.logManager.addLog("diagnostics", "Starting diagnostic package generation", "info");
      const r = {
        systemInfo: this.collectSystemInfo(),
        plugins: this.collectPluginInfo(),
        recentLogs: this.logManager.getRecentLogs(500),
        // 最近500条日志
        databaseSchema: await this.collectDatabaseSchema(),
        configSample: this.sanitizeConfig(this.configManager.getAll()),
        packageInfo: this.getPackageInfo()
      }, n = S.createWriteStream(s), i = qt("zip", { zlib: { level: 9 } });
      return new Promise((o, a) => {
        n.on("close", () => {
          this.logManager.addLog("diagnostics", `Diagnostic package created: ${s} (${i.pointer()} bytes)`, "info"), o(s);
        }), i.on("error", (d) => {
          this.logManager.addLog("diagnostics", `Failed to create diagnostic package: ${d.message}`, "error"), a(d);
        }), i.pipe(n), i.append(JSON.stringify(r, null, 2), { name: "diagnostic-data.json" }), this.logManager.getLogFiles().forEach((d, f) => {
          if (S.existsSync(d)) {
            const w = I.basename(d);
            i.file(d, { name: `logs/${w}` });
          }
        }), i.append(JSON.stringify(r.systemInfo, null, 2), { name: "system-info.json" }), i.append(JSON.stringify(r.plugins, null, 2), { name: "plugins.json" }), i.append(JSON.stringify(r.databaseSchema, null, 2), { name: "database-schema.json" }), i.append(JSON.stringify(r.configSample, null, 2), { name: "config-sanitized.json" }), i.finalize();
      });
    } catch (r) {
      throw this.logManager.addLog("diagnostics", `Failed to generate diagnostic package: ${r}`, "error"), r;
    }
  }
  async cleanupOldPackages(e = 10080 * 60 * 1e3) {
    try {
      const t = S.readdirSync(this.outputDir), s = Date.now();
      for (const r of t)
        if (r.startsWith("diagnostic-package-") && r.endsWith(".zip")) {
          const n = I.join(this.outputDir, r), i = S.statSync(n);
          s - i.mtime.getTime() > e && (S.unlinkSync(n), this.logManager.addLog("diagnostics", `Cleaned up old diagnostic package: ${r}`, "info"));
        }
    } catch (t) {
      this.logManager.addLog("diagnostics", `Failed to cleanup old packages: ${t}`, "warn");
    }
  }
}
class fr extends fe {
  commands = /* @__PURE__ */ new Map();
  sessions = /* @__PURE__ */ new Map();
  roomManager;
  pluginManager;
  databaseManager;
  configManager;
  historyFile;
  constructor(e) {
    super(), this.roomManager = e.roomManager, this.pluginManager = e.pluginManager, this.databaseManager = e.databaseManager, this.configManager = e.configManager, this.historyFile = I.join(R.getPath("userData"), "console-history.json"), this.registerBuiltinCommands(), this.loadHistory();
  }
  /**
   * 注册内置命令
   */
  registerBuiltinCommands() {
    this.registerCommand({
      name: "help",
      description: "显示可用命令列表",
      usage: "help [command]",
      category: "system",
      handler: this.handleHelpCommand.bind(this)
    }), this.registerCommand({
      name: "status",
      description: "显示系统状态",
      usage: "status",
      category: "system",
      handler: this.handleStatusCommand.bind(this)
    }), this.registerCommand({
      name: "config",
      description: "配置管理",
      usage: "config <get|set|list> [key] [value]",
      category: "system",
      handler: this.handleConfigCommand.bind(this)
    }), this.registerCommand({
      name: "rooms",
      description: "房间管理",
      usage: "rooms <list|connect|disconnect> [roomId]",
      category: "room",
      handler: this.handleRoomsCommand.bind(this)
    }), this.registerCommand({
      name: "plugins",
      description: "插件管理",
      usage: "plugins <list|enable|disable|install|uninstall> [pluginId] [path]",
      category: "plugin",
      handler: this.handlePluginsCommand.bind(this)
    }), this.registerCommand({
      name: "logs",
      description: "查看日志",
      usage: "logs [pluginId] [limit]",
      category: "debug",
      handler: this.handleLogsCommand.bind(this)
    }), this.registerCommand({
      name: "clear",
      description: "清空控制台",
      usage: "clear",
      category: "system",
      handler: this.handleClearCommand.bind(this)
    });
  }
  listRooms() {
    return this.roomManager.getAllRooms();
  }
  async connectRoom(e) {
    return await this.roomManager.addRoom(e);
  }
  async disconnectRoom(e) {
    return await this.roomManager.removeRoom(e);
  }
  /**
   * 注册命令
   */
  registerCommand(e) {
    this.commands.set(e.name, e), m.debug("Console command registered", void 0, { name: e.name });
  }
  /**
   * 取消注册命令
   */
  unregisterCommand(e) {
    this.commands.delete(e), m.debug("Console command unregistered", void 0, { name: e });
  }
  /**
   * 创建控制台会话
   */
  createSession(e, t) {
    const s = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, r = {
      id: s,
      userId: t,
      startTime: Date.now(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      source: e === "local" ? "user" : "room",
      commands: []
    };
    return this.sessions.set(s, r), this.emit("session.created", { session: r }), s;
  }
  /**
   * 结束控制台会话
   */
  endSession(e) {
    this.sessions.get(e) && (this.sessions.delete(e), this.emit("session.ended", { sessionId: e }), m.info("Console session ended", void 0, { sessionId: e }));
  }
  /**
   * 执行命令
   */
  async executeCommand(e, t) {
    const s = this.sessions.get(e);
    if (!s)
      return {
        success: !1,
        message: "Invalid session",
        error: "Session not found"
      };
    s.lastActivity = Date.now();
    const r = t.trim().split(/\s+/), n = r[0], i = r.slice(1);
    if (!n)
      return {
        success: !1,
        message: "No command specified",
        error: "Empty command"
      };
    const o = this.commands.get(n);
    if (!o)
      return {
        success: !1,
        message: `Unknown command: ${n}`,
        error: "Command not found"
      };
    const a = {
      userId: s.userId,
      sessionId: e,
      timestamp: Date.now(),
      source: s.source === "user" ? "local" : "remote"
    }, c = Date.now();
    let d;
    try {
      d = await o.handler(i, a);
    } catch (v) {
      d = {
        success: !1,
        message: "Command execution failed",
        error: v instanceof Error ? v.message : String(v)
      };
    }
    const f = Date.now() - c, w = {
      command: n,
      args: i,
      timestamp: c,
      result: d,
      executionTime: f
    };
    return s.commands.push(w), s.commands.length > 100 && s.commands.shift(), this.emit("command.executed", { session: e, command: n, result: d }), this.saveHistory(), d;
  }
  /**
   * 获取会话信息
   */
  getSession(e) {
    return this.sessions.get(e);
  }
  /**
   * 获取所有活跃会话
   */
  getActiveSessions() {
    return Array.from(this.sessions.values());
  }
  /**
   * 获取可用命令列表
   */
  getCommands() {
    return Array.from(this.commands.values());
  }
  // 命令处理器实现
  async handleHelpCommand(e, t) {
    if (e.length > 0) {
      const i = e[0], o = this.commands.get(i);
      return o ? {
        success: !0,
        message: `${o.name}: ${o.description}
Usage: ${o.usage}`,
        data: o
      } : {
        success: !1,
        message: `Command '${i}' not found`,
        error: "Command not found"
      };
    }
    const s = ["system", "room", "plugin", "debug"], r = {};
    for (const i of s)
      r[i] = Array.from(this.commands.values()).filter((o) => o.category === i);
    let n = `Available commands:

`;
    for (const i of s)
      if (r[i].length > 0) {
        n += `${i.toUpperCase()}:
`;
        for (const o of r[i])
          n += `  ${o.name.padEnd(12)} - ${o.description}
`;
        n += `
`;
      }
    return n += 'Use "help <command>" for detailed usage information.', {
      success: !0,
      message: n,
      data: r
    };
  }
  async handleStatusCommand(e, t) {
    const s = this.roomManager.getAllRooms();
    this.pluginManager.getInstalledPlugins();
    const r = this.pluginManager.getPluginStats();
    return {
      success: !0,
      message: "System status retrieved",
      data: {
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        },
        rooms: {
          total: s.length,
          connected: s.filter((i) => i.status === "open").length,
          list: s.map((i) => ({
            id: i.roomId,
            name: i.label || `Room ${i.roomId}`,
            status: i.status,
            eventCount: i.eventCount
          }))
        },
        plugins: {
          total: r.total,
          enabled: r.enabled,
          disabled: r.disabled,
          error: r.error
        },
        sessions: {
          active: this.sessions.size,
          list: Array.from(this.sessions.values()).map((i) => ({
            id: i.id,
            source: i.source,
            startTime: i.startTime,
            commandCount: i.commands.length
          }))
        }
      }
    };
  }
  async handleConfigCommand(e, t) {
    if (e.length === 0)
      return {
        success: !1,
        message: "Usage: config <get|set|list> [key] [value]",
        error: "Missing arguments"
      };
    const s = e[0];
    switch (s) {
      case "list":
        return {
          success: !0,
          message: "Configuration listed",
          data: this.configManager.getAll()
        };
      case "get":
        if (e.length < 2)
          return {
            success: !1,
            message: "Usage: config get <key>",
            error: "Missing key"
          };
        const n = this.configManager.get(e[1]);
        return {
          success: !0,
          message: `${e[1]} = ${JSON.stringify(n)}`,
          data: { key: e[1], value: n }
        };
      case "set":
        if (e.length < 3)
          return {
            success: !1,
            message: "Usage: config set <key> <value>",
            error: "Missing key or value"
          };
        try {
          const i = JSON.parse(e[2]);
          return this.configManager.set(e[1], i), {
            success: !0,
            message: `Configuration updated: ${e[1]} = ${JSON.stringify(i)}`,
            data: { key: e[1], value: i }
          };
        } catch {
          return this.configManager.set(e[1], e[2]), {
            success: !0,
            message: `Configuration updated: ${e[1]} = "${e[2]}"`,
            data: { key: e[1], value: e[2] }
          };
        }
      default:
        return {
          success: !1,
          message: `Unknown config action: ${s}`,
          error: "Invalid action"
        };
    }
  }
  async handleRoomsCommand(e, t) {
    if (e.length === 0)
      return {
        success: !1,
        message: "Usage: rooms <list|connect|disconnect> [roomId]",
        error: "Missing arguments"
      };
    const s = e[0];
    switch (s) {
      case "list":
        const r = this.roomManager.getAllRooms();
        return {
          success: !0,
          message: `Found ${r.length} rooms`,
          data: r
        };
      case "connect":
        if (e.length < 2)
          return {
            success: !1,
            message: "Usage: rooms connect <roomId>",
            error: "Missing roomId"
          };
        try {
          return await this.roomManager.addRoom(e[1]), {
            success: !0,
            message: `Connected to room ${e[1]}`,
            data: { roomId: e[1] }
          };
        } catch (n) {
          return {
            success: !1,
            message: `Failed to connect to room ${e[1]}`,
            error: n instanceof Error ? n.message : String(n)
          };
        }
      case "disconnect":
        if (e.length < 2)
          return {
            success: !1,
            message: "Usage: rooms disconnect <roomId>",
            error: "Missing roomId"
          };
        try {
          return await this.roomManager.removeRoom(e[1]), {
            success: !0,
            message: `Disconnected from room ${e[1]}`,
            data: { roomId: e[1] }
          };
        } catch (n) {
          return {
            success: !1,
            message: `Failed to disconnect from room ${e[1]}`,
            error: n instanceof Error ? n.message : String(n)
          };
        }
      default:
        return {
          success: !1,
          message: `Unknown rooms action: ${s}`,
          error: "Invalid action"
        };
    }
  }
  async handlePluginsCommand(e, t) {
    if (e.length === 0)
      return {
        success: !1,
        message: "Usage: plugins <list|enable|disable|install|uninstall> [pluginId] [path]",
        error: "Missing arguments"
      };
    const s = e[0];
    switch (s) {
      case "list":
        const r = this.pluginManager.getInstalledPlugins();
        return {
          success: !0,
          message: `Found ${r.length} plugins`,
          data: r
        };
      case "enable":
        if (e.length < 2)
          return {
            success: !1,
            message: "Usage: plugins enable <pluginId>",
            error: "Missing pluginId"
          };
        try {
          return await this.pluginManager.enablePlugin(e[1]), {
            success: !0,
            message: `Plugin ${e[1]} enabled`,
            data: { pluginId: e[1] }
          };
        } catch (n) {
          return {
            success: !1,
            message: `Failed to enable plugin ${e[1]}`,
            error: n instanceof Error ? n.message : String(n)
          };
        }
      case "disable":
        if (e.length < 2)
          return {
            success: !1,
            message: "Usage: plugins disable <pluginId>",
            error: "Missing pluginId"
          };
        try {
          return await this.pluginManager.disablePlugin(e[1]), {
            success: !0,
            message: `Plugin ${e[1]} disabled`,
            data: { pluginId: e[1] }
          };
        } catch (n) {
          return {
            success: !1,
            message: `Failed to disable plugin ${e[1]}`,
            error: n instanceof Error ? n.message : String(n)
          };
        }
      case "install":
        if (e.length < 2)
          return {
            success: !1,
            message: "Usage: plugins install <path>",
            error: "Missing path"
          };
        try {
          const n = await this.pluginManager.installPlugin({ filePath: e[1] });
          return {
            success: !0,
            message: `Plugin ${n.id} installed successfully`,
            data: n
          };
        } catch (n) {
          return {
            success: !1,
            message: `Failed to install plugin from ${e[1]}`,
            error: n instanceof Error ? n.message : String(n)
          };
        }
      case "uninstall":
        if (e.length < 2)
          return {
            success: !1,
            message: "Usage: plugins uninstall <pluginId>",
            error: "Missing pluginId"
          };
        try {
          return await this.pluginManager.uninstallPlugin(e[1]), {
            success: !0,
            message: `Plugin ${e[1]} uninstalled`,
            data: { pluginId: e[1] }
          };
        } catch (n) {
          return {
            success: !1,
            message: `Failed to uninstall plugin ${e[1]}`,
            error: n instanceof Error ? n.message : String(n)
          };
        }
      default:
        return {
          success: !1,
          message: `Unknown plugins action: ${s}`,
          error: "Invalid action"
        };
    }
  }
  async handleLogsCommand(e, t) {
    const s = e[0], r = e[1] ? parseInt(e[1]) : 50, n = this.pluginManager.getPluginLogs(s, r);
    return {
      success: !0,
      message: `Retrieved ${n.length} log entries`,
      data: n
    };
  }
  async handleClearCommand(e, t) {
    return {
      success: !0,
      message: "Console cleared",
      data: { action: "clear" }
    };
  }
  /**
   * 加载历史记录
   */
  loadHistory() {
    try {
      if (S.existsSync(this.historyFile)) {
        const e = S.readFileSync(this.historyFile, "utf8"), t = JSON.parse(e);
        m.debug("Console history loaded");
      }
    } catch (e) {
      m.warn("Failed to load console history", void 0, { error: e });
    }
  }
  /**
   * 保存历史记录
   */
  saveHistory() {
    try {
      const e = {
        sessions: Array.from(this.sessions.values()).map((t) => ({
          ...t,
          commands: t.commands.slice(-20)
          // 只保存最近20条命令
        })),
        timestamp: Date.now()
      };
      S.writeFileSync(this.historyFile, JSON.stringify(e, null, 2));
    } catch (e) {
      m.warn("Failed to save console history", void 0, { error: e });
    }
  }
  /**
   * 清理过期会话
   */
  cleanupSessions() {
    const e = Date.now(), t = 1800 * 1e3, s = [];
    for (const [r, n] of Array.from(this.sessions.entries()))
      e - n.lastActivity > t && s.push(r);
    for (const r of s)
      this.endSession(r);
  }
  /**
   * 清理资源
   */
  cleanup() {
    this.saveHistory(), this.sessions.clear(), this.commands.clear(), m.info("Console manager cleaned up");
  }
}
async function mr() {
  try {
    if (R.isPackaged || process.env.NODE_ENV === "production") return;
    const g = await import("./index-CGfKkGC6.js").then((s) => s.i), e = g?.default?.default ?? g?.default ?? g, t = g?.VUEJS_DEVTOOLS ?? g?.default?.VUEJS_DEVTOOLS;
    await e(t).then((s) => {
      try {
        console.info(`[DevTools] Added Extension: ${s}`);
      } catch {
      }
    }).catch((s) => {
      try {
        console.warn("[DevTools] Vue Devtools install failed:", s);
      } catch {
      }
    });
  } catch {
  }
}
try {
  R.commandLine.appendSwitch("disable-logging"), R.commandLine.appendSwitch("log-level", "disable"), R.commandLine.appendSwitch("v", "0");
} catch {
}
const pr = () => {
  try {
    const g = R.getPath("userData"), e = x.join(g, "config.json");
    if (S.existsSync(e)) {
      const t = S.readFileSync(e, "utf8"), r = JSON.parse(t || "{}")["config.dir"];
      if (typeof r == "string" && r.trim().length > 0 && r !== g)
        try {
          R.setPath("userData", r);
        } catch {
        }
    }
  } catch {
  }
};
async function yr() {
  try {
    if (process.platform === "win32") {
      const p = "acfun.live.toolbox";
      try {
        R.setAppUserModelId(p);
      } catch {
      }
      try {
        console.log("[Main] AppUserModelId set to", p);
      } catch {
      }
    }
  } catch {
  }
  pr();
  const g = () => {
    const p = x.join("dist-electron", "worker", "worker.js");
    return R.isPackaged ? x.join(R.getAppPath(), p) : x.join(process.cwd(), p);
  }, e = () => {
    const p = g(), A = new URL(`file://${p.replace(/\\/g, "/")}`), T = new jt(A, {
      type: "module",
      workerData: { hello: "world" }
    });
    T.on("message", (k) => console.log("[worker msg]", k)), T.on("error", (k) => console.error("[worker error]", k)), T.on("exit", (k) => console.log("[worker exit]", k));
  };
  try {
    const p = ye(), A = { log: console.log, warn: console.warn, error: console.error, debug: console.debug, info: console.info };
    setTimeout(() => {
      console.log = (...T) => {
        try {
          const k = T.map((N) => String(N)).join(" ");
          if (!!(k.startsWith("[StateSignal]") || k.startsWith("[WebSocket]") || k.startsWith("[Command]") || k.startsWith("[AcfunApiProxy]") || k.includes("devtools://devtools") && (k.includes("Autofill.enable") || k.includes("Autofill.setAddresses"))))
            return;
          k.includes("Database connected at:") || p.addLog("main", k, "info");
        } catch {
        }
        try {
          A.log.apply(console, T);
        } catch {
        }
      }, console.info = (...T) => {
        try {
          const k = T.map((N) => String(N)).join(" ");
          if (!!(k.startsWith("[StateSignal]") || k.startsWith("[WebSocket]") || k.startsWith("[Command]") || k.startsWith("[AcfunApiProxy]") || k.includes("devtools://devtools") && (k.includes("Autofill.enable") || k.includes("Autofill.setAddresses"))))
            return;
          k.includes("Database connected at:") || p.addLog("main", k, "info");
        } catch {
        }
        try {
          A.info.apply(console, T);
        } catch {
        }
      }, console.warn = (...T) => {
        try {
          const k = T.map((N) => String(N)).join(" ");
          if (!!(k.startsWith("[StateSignal]") || k.startsWith("[WebSocket]") || k.startsWith("[Command]") || k.startsWith("[AcfunApiProxy]") || k.includes("devtools://devtools") && (k.includes("Autofill.enable") || k.includes("Autofill.setAddresses"))))
            return;
          k.includes("Database connected at:") || p.addLog("main", k, "warn");
        } catch {
        }
        try {
          A.warn.apply(console, T);
        } catch {
        }
      }, console.error = (...T) => {
        try {
          const k = T.map((N) => String(N)).join(" ");
          if (!!(k.startsWith("[StateSignal]") || k.startsWith("[WebSocket]") || k.startsWith("[Command]") || k.startsWith("[AcfunApiProxy]") || k.includes("devtools://devtools") && (k.includes("Autofill.enable") || k.includes("Autofill.setAddresses"))))
            return;
          k.includes("Database connected at:") || p.addLog("main", k, "error");
        } catch {
        }
        try {
          A.error.apply(console, T);
        } catch {
        }
      }, console.debug = (...T) => {
        try {
          const k = T.map((N) => String(N)).join(" ");
          if (!!(k.startsWith("[StateSignal]") || k.startsWith("[WebSocket]") || k.startsWith("[Command]") || k.startsWith("[AcfunApiProxy]") || k.includes("devtools://devtools") && (k.includes("Autofill.enable") || k.includes("Autofill.setAddresses"))))
            return;
          k.includes("Database connected at:") || p.addLog("main", k, "debug");
        } catch {
        }
        try {
          A.debug.apply(console, T);
        } catch {
        }
      };
    }, 1e3);
  } catch {
  }
  try {
    R.isPackaged || Xs(x.resolve(__dirname, "../../.."));
  } catch (p) {
    console.error("[Main] Workspace package check failed:", p), R.quit();
    return;
  }
  qs(), Vs();
  try {
    await Hs();
  } catch {
    R.quit();
    return;
  }
  console.log("[Main] Initializing services...");
  const t = new Gt();
  await t.initialize();
  const s = ye(), r = new rs(null, t), n = new Ee(), i = new gr(t, n), o = new dr(), a = n.get("server.port", parseInt(process.env.ACFRAME_API_PORT || "18299")), c = te.getInstance();
  await c.initialize();
  const d = new ur({
    apiServer: null,
    // 临时设置，稍后更新
    roomManager: r,
    databaseManager: t,
    configManager: n,
    tokenManager: c
  }), f = new fr({
    roomManager: r,
    pluginManager: d,
    databaseManager: t,
    configManager: n
  }), w = new Rs({ port: a }, t, i, o, f);
  w.setRoomManager(r), d.apiServer = w, w.setPluginManager(d);
  const v = new Bs(), _ = new hr(n);
  _.setPluginManager(d), w.setWindowManagers(v, _);
  try {
    await w.start();
  } catch (p) {
    try {
      console.error("[Main] API server start failed:", p?.message || String(p));
    } catch {
    }
  }
  try {
    const p = R.getPath("userData"), A = x.join(p, "config.json");
    console.info("[Main] userData path=", p);
    try {
      if (S.existsSync(A)) {
        const T = S.readFileSync(A, "utf-8"), k = JSON.parse(T || "{}");
        console.info("[Main] config.json keys=", Object.keys(k));
      } else
        console.info("[Main] config.json not found at userData path");
    } catch {
    }
  } catch {
  }
  console.info("[Main] Server ready → loading plugins");
  try {
    const p = n.get("plugins", {});
    console.info("[Main] Persisted plugins config snapshot=", p);
  } catch {
  }
  try {
    d.loadInstalledPlugins();
  } catch (p) {
    console.warn("[Main] Failed to load plugins after server ready:", p instanceof Error ? p.message : String(p));
  }
  try {
    const p = d.getInstalledPlugins().filter((A) => A.enabled);
    for (const A of p)
      try {
        await d.enablePlugin(A.id);
      } catch (T) {
        console.error("[Main] Failed to enable plugin on server ready:", A.id, T);
      }
  } catch (p) {
    console.warn("[Main] Plugin enable on server ready encountered an issue:", p instanceof Error ? p.message : String(p));
  }
  js(
    r,
    c,
    d,
    o,
    f,
    v,
    _,
    n,
    s,
    i,
    t
  );
  const b = w.getWsHub();
  r.on("event", (p) => {
    try {
      b.broadcastEvent(p);
    } catch (A) {
      console.error("[Main] Failed to broadcast event via WsHub:", A);
    }
    try {
      v.getMainWindow()?.webContents.send("room.event", { event_type: p.event_type, room_id: p.room_id, ts: p.ts, raw: p.raw });
    } catch {
    }
    try {
      const A = ie.getInstance(), T = d.getInstalledPlugins().filter((k) => k.enabled);
      for (const k of T) {
        const D = `plugin:${k.id}:overlay`;
        A.publish(D, { event: "normalized-event", payload: p }, { ttlMs: 120 * 1e3, persist: !0, meta: { kind: "danmaku" } });
      }
    } catch {
    }
  }), r.on("roomStatusChange", (p, A) => {
    try {
      b.broadcastRoomStatus(p, A);
    } catch (T) {
      console.error("[Main] Failed to broadcast room status via WsHub:", T);
    }
    try {
      const T = v.getMainWindow(), k = r.getRoomInfo(String(p)), D = k?.liveId ?? k?.adapter?.getCurrentLiveId() ?? null, N = D ? String(D) : "", H = k?.streamInfo ?? k?.adapter?.getCurrentStreamInfo() ?? null, B = { roomId: p, status: A, liveId: N, streamInfo: H, isManager: k?.isManager };
      T?.webContents.send("room.status", B);
    } catch {
    }
    try {
      const T = ie.getInstance(), k = d.getInstalledPlugins().filter((V) => V.enabled), D = r.getRoomInfo(String(p)), N = D?.liveId ?? D?.adapter?.getCurrentLiveId() ?? null, H = N ? String(N) : "", B = D?.streamInfo ?? D?.adapter?.getCurrentStreamInfo() ?? null, W = { roomId: p, status: A, liveId: H, streamInfo: B };
      for (const V of k) {
        const X = `plugin:${V.id}:overlay`;
        T.publish(X, { event: "room-status-change", payload: W }, { ttlMs: 120 * 1e3, persist: !0, meta: { kind: "room" } });
      }
    } catch {
    }
  }), r.on("roomAdded", (p) => {
    try {
      b.broadcastRoomStatus(p, "connecting");
    } catch (A) {
      console.error("[Main] Failed to broadcast room added via WsHub:", A);
    }
    try {
      const A = ie.getInstance(), T = d.getInstalledPlugins().filter((D) => D.enabled), k = { roomId: p, ts: Date.now() };
      for (const D of T) {
        const N = `plugin:${D.id}:overlay`;
        A.publish(N, { event: "room-added", payload: k }, { ttlMs: 120 * 1e3, persist: !0, meta: { kind: "room" } });
      }
    } catch {
    }
  }), r.on("roomRemoved", (p) => {
    try {
      b.broadcastRoomStatus(p, "closed");
    } catch (A) {
      console.error("[Main] Failed to broadcast room removed via WsHub:", A);
    }
    try {
      const A = ie.getInstance(), T = d.getInstalledPlugins().filter((D) => D.enabled), k = { roomId: p, ts: Date.now() };
      for (const D of T) {
        const N = `plugin:${D.id}:overlay`;
        A.publish(N, { event: "room-removed", payload: k }, { ttlMs: 120 * 1e3, persist: !0, meta: { kind: "room" } });
      }
    } catch {
    }
  }), await R.whenReady(), console.log("[Main] App is ready."), e();
  try {
    await Ce.initialize(), console.log("[Main] AcfunDanmuModule initialized.");
  } catch (p) {
    console.error("[Main] Failed to initialize AcfunDanmuModule:", p);
  }
  try {
    const p = String(process.env.ACFRAME_INSTALL_VUE_DEVTOOLS || "").trim().toLowerCase();
    (p === "1" || p === "true" || p === "on" ? !0 : p === "0" || p === "false" || p === "off" ? !1 : !R.isPackaged) && await mr();
  } catch {
  }
  v.createWindow();
  try {
    const p = !!n.get("ui.minimizeToTray", !1);
    v.setMinimizeToTray(p);
  } catch {
  }
  R.on("activate", () => {
    ne.getAllWindows().length === 0 && v.createWindow();
  });
  const h = ie.getInstance(), u = "renderer:readonly-store", l = (p, A, T = !1) => {
    try {
      const k = T ? d.getInstalledPlugins() : d.getInstalledPlugins().filter((D) => D.enabled);
      for (const D of k) {
        const N = `plugin:${D.id}:overlay`;
        h.publish(N, { event: p, payload: A }, { ttlMs: 120 * 1e3, persist: !0, meta: { kind: "renderer" } });
      }
    } catch (k) {
      console.error("[Main] Failed to publish renderer event:", k);
    }
  };
  c.on("loginSuccess", (p) => {
    try {
      const A = p.tokenInfo;
      l("user-login", {
        userId: A?.userID || ""
        //  userInfo 
      });
    } catch (A) {
      console.error("[Main] Failed to handle loginSuccess event:", A);
    }
  }), c.on("logout", () => {
    try {
      l("user-logout", {});
    } catch (p) {
      console.error("[Main] Failed to handle logout event:", p);
    }
  });
  try {
    h.subscribe(u, (p) => {
      try {
        const A = p?.payload, T = A?.payload || A;
        if (T && T.ui) {
          const k = T.ui;
          (k.routePath !== void 0 || k.pageName !== void 0) && l("route-change", {
            routePath: k.routePath || "",
            pageName: k.pageName || "",
            pageTitle: k.pageTitle || ""
          });
        }
      } catch {
      }
    });
  } catch (p) {
    console.warn("[Main] Failed to subscribe to readonly-store for route changes:", p);
  }
  r.on("roomStatusChange", (p, A) => {
    try {
      A === "open" ? l("danmaku-collection-start", { roomId: p }) : (A === "closed" || A === "error" || A === "disconnected") && l("danmaku-collection-stop", { roomId: p });
    } catch (T) {
      console.error("[Main] Failed to handle roomStatusChange for renderer events:", T);
    }
  }), r.on("roomRemoved", (p) => {
    try {
      l("danmaku-collection-stop", { roomId: p });
    } catch (A) {
      console.error("[Main] Failed to handle roomRemoved for renderer events:", A);
    }
  });
  const y = n.set.bind(n), E = n.setAll.bind(n);
  n.set = function(p, A) {
    y(p, A);
    try {
      l("config-updated", { key: p, value: A });
    } catch (T) {
      console.error("[Main] Failed to publish config-updated event:", T);
    }
  }, n.setAll = function(p) {
    const A = [];
    for (const [T, k] of Object.entries(p)) {
      const D = n.get(T), N = JSON.stringify(D), H = JSON.stringify(k);
      N !== H && A.push({ key: T, value: k });
    }
    E(p);
    try {
      for (const { key: T, value: k } of A)
        l("config-updated", { key: T, value: k });
    } catch (T) {
      console.error("[Main] Failed to publish config-updated events:", T);
    }
  }, d.on("plugin.enabled", ({ id: p }) => {
    try {
      l("plugin-enabled", { pluginId: p }, !0);
    } catch (A) {
      console.error("[Main] Failed to handle plugin.enabled for renderer events:", A);
    }
  }), d.on("plugin.disabled", ({ id: p }) => {
    try {
      l("plugin-disabled", { pluginId: p }, !0);
    } catch (A) {
      console.error("[Main] Failed to handle plugin.disabled for renderer events:", A);
    }
    try {
      try {
        _.close(p).catch(() => {
        });
      } catch {
      }
    } catch {
    }
    try {
      try {
        or.closePluginConnections(p);
      } catch {
      }
    } catch {
    }
    try {
      try {
        pe.getInstance().closePluginConnections(p);
      } catch {
      }
    } catch {
    }
    try {
      try {
        q.clearPluginSubscriptions(p);
      } catch {
      }
    } catch {
    }
  }), d.on("plugin.uninstalled", ({ id: p }) => {
    try {
      l("plugin-uninstalled", { pluginId: p }, !0);
    } catch (A) {
      console.error("[Main] Failed to handle plugin.uninstalled for renderer events:", A);
    }
  }), R.on("before-quit", () => {
    try {
      l("app-closing", {});
    } catch (p) {
      console.error("[Main] Failed to handle before-quit for renderer events:", p);
    }
    try {
      _.destroy();
    } catch (p) {
      console.error("[Main] Failed to destroy plugin windows:", p);
    }
  });
}
R.on("window-all-closed", () => {
  process.platform !== "darwin" && !windowManager.isMinimizeToTrayEnabled() && R.quit();
});
yr().catch((g) => {
  console.error("[Main] Unhandled error in main process:", g), R.quit();
});
export {
  $r as _
};
