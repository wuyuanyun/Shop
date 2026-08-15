/**
 * 种子数据脚本 —— 批量导入基础商品
 * 运行: npx tsx scripts/seed.ts
 */
import initSqlJs, { type Database } from "sql.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "shopfree.db");

// 固定系统卖家 ID
const SYSTEM_SELLER_ID = "00000000-0000-0000-0000-000000000001";

function uuid() {
  return crypto.randomUUID();
}
function now() {
  return new Date().toISOString();
}
function pic(seed: string) {
  return `https://picsum.photos/seed/${seed}/600/600`;
}

// ====== 工具函数 ======
function queryOne<T>(db: Database, sql: string, params: unknown[] = []): T | null {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const row = stmt.step() ? (stmt.getAsObject() as T) : null;
  stmt.free();
  return row;
}

function run(db: Database, sql: string, params: unknown[] = []): void {
  db.run(sql, params);
}

// ====== 商品数据 ======
const products = [
  { title: "Apple iPhone 15 Pro 256GB", description: "全新正品 Apple iPhone 15 Pro，A17 Pro 芯片，钛金属设计，4800万像素主摄系统。256GB 大容量存储，原深感摄像头支持面容 ID。", price: 8999, image_url: pic("iphone15pro") },
  { title: "MacBook Air 15英寸 M3 芯片", description: "搭载 M3 芯片的 MacBook Air 15英寸，8核 CPU 10核 GPU，8GB 统一内存，256GB SSD。超薄设计，18小时续航。", price: 10499, image_url: pic("macbook-air") },
  { title: "AirPods Pro 第二代 (USB-C)", description: "Apple AirPods Pro 第二代，自适应音频功能，主动降噪效果提升2倍，通透模式，USB-C 充电盒。", price: 1799, image_url: pic("airpods-pro") },
  { title: "iPad Air 11英寸 M2 芯片", description: "全新 iPad Air 11英寸，M2 芯片强力驱动，Liquid Retina 显示屏，支持 Apple Pencil Pro 和妙控键盘。", price: 4799, image_url: pic("ipad-air") },
  { title: "Sony WH-1000XM5 无线降噪耳机", description: "业界领先的降噪技术，30小时续航，快充3分钟播放3小时。轻量化设计仅250g，佩戴舒适。", price: 2499, image_url: pic("sony-headphones") },
  { title: "Samsung Galaxy S24 Ultra 512GB", description: "Galaxy AI 智能手机，钛金属框架，2亿像素摄像头，S Pen 内置。骁龙8 Gen 3 芯片，5000mAh 大电池。", price: 9699, image_url: pic("galaxy-s24") },
  { title: "Anker Prime 20000mAh 充电宝", description: "20000mAh 大容量，支持双向 100W 快充，可同时充3台设备，支持笔记本充电。智能温控系统。", price: 399, image_url: pic("powerbank") },
  { title: "Kindle Paperwhite 第11代 16GB", description: "6.8英寸无眩光显示屏，可调节暖光，防水设计(IPX8)，续航长达10周。", price: 1199, image_url: pic("kindle") },
  { title: "机械师 K500 机械键盘", description: "94键紧凑布局，热插拔轴座，RGB 音乐律动灯效，三模连接（蓝牙/2.4G/有线）。", price: 349, image_url: pic("mech-keyboard") },
  { title: "罗技 MX Master 3S 无线鼠标", description: "8K DPI 光学传感器，MagSpeed 电磁滚轮每秒滚动1000行，USB-C 快充，支持3台设备无缝切换。", price: 699, image_url: pic("mx-master") },
  { title: "戴尔 UltraSharp U2723QE 4K 显示器", description: "27英寸 4K 分辨率，IPS Black 技术2000:1对比度，USB-C 90W 供电，内置 KVM 切换器。", price: 4299, image_url: pic("dell-monitor") },
  { title: "小米手环 8 Pro", description: "1.74英寸 AMOLED 大屏，150+运动模式，独立 GNSS 定位，14天超长续航。", price: 349, image_url: pic("mi-band") },
  { title: "西部数据 2TB 移动硬盘", description: "2TB 大容量存储，USB 3.0 高速传输，即插即用无需额外电源。", price: 449, image_url: pic("wd-hdd") },
  { title: "华为 Watch GT 4 智能手表", description: "1.43英寸 AMOLED 彩屏，14天强劲续航，TruSeen 5.5+ 心率监测，100+运动模式。", price: 1488, image_url: pic("huawei-watch") },
  { title: "蝉翼超轻笔记本支架", description: "全铝合金材质，镂空散热设计，7档角度可调，折叠后厚度仅2cm。承重10kg。", price: 129, image_url: pic("laptop-stand") },
  { title: "UGREEN Type-C 11合1 扩展坞", description: "11合1多功能扩展坞，HDMI 4K@60Hz、千兆网口、SD/TF读卡器、100W PD快充。", price: 259, image_url: pic("usb-hub") },
  { title: "山姆逊 2L 家用空气炸锅", description: "2L 黄金容量，360° 热风循环，无油健康炸。8大智能菜单，触控操作，不粘涂层。", price: 329, image_url: pic("airfryer") },
  { title: "露营折叠椅 承重150kg", description: "加厚钢管支架，600D牛津布面，一秒折叠收纳，带杯架扶手设计。", price: 139, image_url: pic("camp-chair") },
  { title: "无印良品 超声波香薰机", description: "超声波雾化技术，静音运行≤25dB，3档定时，自动断电保护。温馨暖光。", price: 249, image_url: pic("diffuser") },
  { title: "网易严选 人体工学椅", description: "腰靠4向调节，头枕2D调节，4D扶手，135°大角度后仰。SGS认证气压棒。", price: 1699, image_url: pic("office-chair") },
];

async function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const wasmPath = path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm");
  const SQL = await initSqlJs({ locateFile: () => wasmPath });

  let db: Database;
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  run(db, "PRAGMA foreign_keys=ON");
  run(db, "PRAGMA journal_mode=OFF");

  // 建表
  run(db, `CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, username TEXT NOT NULL, avatar_url TEXT, balance REAL NOT NULL DEFAULT 100, created_at TEXT NOT NULL)`);
  run(db, `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, price REAL NOT NULL, image_url TEXT, seller_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'on_sale', created_at TEXT NOT NULL)`);
  run(db, `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, buyer_id TEXT NOT NULL, seller_id TEXT NOT NULL, amount REAL NOT NULL, status TEXT NOT NULL DEFAULT 'pending', logistics_info TEXT, created_at TEXT NOT NULL)`);
  run(db, `CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, product_id TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(user_id, product_id))`);
  run(db, `CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL, content TEXT NOT NULL, product_id TEXT, created_at TEXT NOT NULL)`);
  run(db, `CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE)`);

  // 创建系统卖家
  const existing = queryOne<{ id: string }>(db, "SELECT id FROM profiles WHERE id = ?", [SYSTEM_SELLER_ID]);
  if (!existing) {
    run(db, "INSERT INTO profiles (id, username, avatar_url, balance, created_at) VALUES (?, ?, ?, ?, ?)", [SYSTEM_SELLER_ID, "官方商城", pic("official-shop"), 0, now()]);
    console.log("✅ 创建系统卖家：官方商城");
  } else {
    console.log("ℹ️  系统卖家已存在");
  }

  // 插入商品
  let inserted = 0;
  const insertStmt = db.prepare("INSERT INTO products (id, title, description, price, image_url, seller_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'on_sale', ?)");
  for (const p of products) {
    insertStmt.bind([uuid(), p.title, p.description, p.price, p.image_url, SYSTEM_SELLER_ID, now()]);
    insertStmt.step();
    insertStmt.reset();
    inserted++;
  }
  insertStmt.free();

  // 持久化
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log(`✅ 成功导入 ${inserted} 件商品`);
  console.log(`📦 数据库位置: ${DB_PATH}`);
}

main().catch((err) => { console.error("❌ 导入失败:", err instanceof Error ? err.message : String(err)); process.exit(1); });
