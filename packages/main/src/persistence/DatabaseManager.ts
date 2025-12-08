import * as sqlite3 from 'sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { createDanmuSchema } from './DanmuSQLiteWriter';

export class DatabaseManager {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(customDbPath?: string) {
    if (customDbPath) {
      this.dbPath = customDbPath;
    } else if (process.env.ACFUN_TEST_DB_PATH) {
      // 测试环境使用环境变量指定的路径
      this.dbPath = process.env.ACFUN_TEST_DB_PATH;
    } else {
      try {
        // 将数据库文件存储在用户数据目录中
        const userDataPath = app.getPath('userData');
        this.dbPath = path.join(userDataPath, 'events.db');
      } catch (error) {
        // 如果 app.getPath 失败（比如在测试环境中），使用临时目录
        console.warn('Failed to get userData path, using temp directory:', error);
        this.dbPath = path.join(os.tmpdir(), 'acfun-events.db');
      }
    }
  }

  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err: Error | null) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.info('[DB] path=' + String(this.dbPath));
          this.applyPragma()
            .then(() => this.createTables())
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const dropLegacyEventsSql = `DROP TABLE IF EXISTS events;`;

      // 房间元数据：用于根据主播用户名关键词解析 room_kw 到 room_id 集合
      const createRoomsMetaTableSql = `
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
      `;

      const createIndexesSql = [
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_meta_live_id ON rooms_meta (live_id)',
        'CREATE INDEX IF NOT EXISTS idx_rooms_meta_streamer_name ON rooms_meta (streamer_name)',
        'CREATE INDEX IF NOT EXISTS idx_rooms_meta_created_at ON rooms_meta (created_at)',
        'CREATE INDEX IF NOT EXISTS idx_rooms_meta_live_created ON rooms_meta (live_id, created_at)'
      ];

      const migrationSql: string[] = [];

      this.db.serialize(() => {
        this.db!.run(dropLegacyEventsSql, () => {
          this.db!.run(createRoomsMetaTableSql, (roomsErr: Error | null) => {
            if (roomsErr) {
              console.error('Error creating rooms_meta table:', roomsErr.message);
              reject(roomsErr);
              return;
            }

          migrationSql.forEach(sql => {
            this.db!.run(sql, () => {});
          });

          let indexCreationError: Error | null = null;
          for (const stmt of createIndexesSql) {
            this.db!.run(stmt, (idxErr: Error | null) => {
              if (idxErr && !indexCreationError) {
                indexCreationError = idxErr;
              }
            });
          }

          if (indexCreationError) {
            console.error('Error creating indexes:', indexCreationError);
            reject(indexCreationError);
          } else {
            createDanmuSchema(this.db!)
              .then(() => {
                console.log('Events table and indexes created/verified');
                resolve();
              })
              .catch(reject);
          }
          });
        });
      });
    });
  }

  public getDb(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  public getPath(): string {
    return this.dbPath;
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err: Error | null) => {
        if (err) {
          console.error('Error closing database:', err.message);
          reject(err);
        } else {
          console.log('Database connection closed');
          this.db = null;
          resolve();
        }
      });
    });
  }

  private async applyPragma(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }
      try {
        this.db.run('PRAGMA journal_mode=WAL');
        this.db.run('PRAGMA synchronous=NORMAL');
        this.db.run('PRAGMA busy_timeout=3000');
        this.db.run('PRAGMA temp_store=MEMORY');
        this.db.run('PRAGMA journal_size_limit=10485760');
        resolve();
      } catch (_) {
        resolve();
      }
    });
  }

  public async vacuum(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run('VACUUM', (err: Error | null) => {
        if (err) {
          console.error('Error vacuuming database:', err.message);
          reject(err);
        } else {
          console.log('Database vacuumed successfully');
          resolve();
        }
      });
    });
  }
}
