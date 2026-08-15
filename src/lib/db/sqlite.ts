/**
 * 数据库核心层 —— 基于 sql.js (SQLite WASM)
 *
 * 封装策略：
 * - queryOne<T>()   → 查询单行，未找到返回 null
 * - queryAll<T>()   → 查询多行，返回数组
 * - execute()       → 执行写操作（INSERT/UPDATE/DELETE），自动持久化
 * - getDb()         → 获取底层数据库实例（事务等复杂场景用）
 *
 * 后续若要切换到 PostgreSQL，只需改写本文件的底层实现，
 * 上层 5 个 model 模块（profiles/products/orders/messages/favorites）无需修改。
 */

import path from "path";
import fs from "fs";
import crypto from "crypto";

/* ------------------------------------------------------------------ */
/*  sql.js 初始化                                                      */
/* ------------------------------------------------------------------ */

// webpackIgnore 让 Next.js 把 sql.js 当作外部原生模块，不打包进 bundle
const initSqlJsModule = import(/* webpackIgnore: true */ "sql.js");

interface SqlJsDatabase {
  run(sql: string, params?: unknown[]): void;
  exec(sql: string): void;
  prepare(sql: string): SqlJsStatement;
  export(): Uint8Array;
  close(): void;
}

interface SqlJsStatement {
  bind(params?: unknown[]): boolean;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  free(): boolean;
}

interface SqlJsStatic {
  Database: new (data?: ArrayLike<number> | Buffer | null) => SqlJsDatabase;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "shopfree.db");

let db: SqlJsDatabase | null = null;
let initPromise: Promise<SqlJsDatabase> | null = null;

async function initDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  if (!initPromise) {
    initPromise = (async () => {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const wasmPath = path.join(
        process.cwd(),
        "node_modules",
        "sql.js",
        "dist",
        "sql-wasm.wasm"
      );

      const sqlModule = await initSqlJsModule;
      const initSqlJs = sqlModule.default;
      const SQL: SqlJsStatic = await initSqlJs({
        locateFile: () => wasmPath,
      });

      if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
      } else {
        db = new SQL.Database();
      }

      db.run("PRAGMA journal_mode=OFF");
      db.run("PRAGMA foreign_keys=ON");
      createTables(db);
      saveDbInternal(db);

      return db;
    })();
  }

  return initPromise;
}

function saveDbInternal(database: SqlJsDatabase) {
  const data = database.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/* ------------------------------------------------------------------ */
/*  建表                                                                */
/* ------------------------------------------------------------------ */

function createTables(database: SqlJsDatabase) {
  database.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT,
      password_hash TEXT,
      avatar_url TEXT,
      balance REAL NOT NULL DEFAULT 100,
      created_at TEXT NOT NULL
    )
  `);

  // 兼容旧表：补缺少列
  try {
    database.run("ALTER TABLE profiles ADD COLUMN email TEXT");
  } catch { /* 列已存在 */ }
  try {
    database.run("ALTER TABLE profiles ADD COLUMN password_hash TEXT");
  } catch { /* 列已存在 */ }

  database.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      seller_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'on_sale',
      created_at TEXT NOT NULL,
      FOREIGN KEY (seller_id) REFERENCES profiles(id)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      logistics_info TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (buyer_id) REFERENCES profiles(id),
      FOREIGN KEY (seller_id) REFERENCES profiles(id)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES profiles(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      content TEXT NOT NULL,
      product_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (sender_id) REFERENCES profiles(id),
      FOREIGN KEY (receiver_id) REFERENCES profiles(id)
    )
  `);

  // 兼容旧 messages 表：补充 product_id 列
  try {
    database.run("ALTER TABLE messages ADD COLUMN product_id TEXT");
  } catch { /* 列已存在 */ }
}

/* ------------------------------------------------------------------ */
/*  公开 API                                                           */
/* ------------------------------------------------------------------ */

/** 获取底层 sql.js Database 实例（供复杂查询/事务使用） */
export async function getDb(): Promise<SqlJsDatabase> {
  return initDb();
}

/** 持久化到磁盘（写操作后自动调用，也可手动调用） */
export async function saveDb(): Promise<void> {
  if (db) saveDbInternal(db);
}

/** 查询单行 → 未找到返回 null */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const database = await getDb();
  const stmt = database.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const row = stmt.step() ? (stmt.getAsObject() as T) : null;
  stmt.free();
  return row;
}

/** 查询多行 → 返回数组（可能为空） */
export async function queryAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const database = await getDb();
  const stmt = database.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

/** 执行写操作 → INSERT / UPDATE / DELETE，自动持久化 */
export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<void> {
  const database = await getDb();
  database.run(sql, params);
  saveDbInternal(database);
}

/** 生成 UUID v4 */
export function uuid(): string {
  return crypto.randomUUID();
}

/** 当前 ISO 时间字符串 */
export function now(): string {
  return new Date().toISOString();
}

/** 关闭数据库（测试/清理用） */
export function closeDb() {
  if (db) {
    db.close();
    db = null;
    initPromise = null;
  }
}
