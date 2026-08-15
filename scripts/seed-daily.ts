/**
 * 补充日用品 —— 便宜商品
 * 运行: npx tsx scripts/seed-daily.ts
 */
import initSqlJs, { type Database } from "sql.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "shopfree.db");
const SYSTEM_SELLER_ID = "00000000-0000-0000-0000-000000000001";

function uuid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }
function pic(seed: string) { return `https://picsum.photos/seed/${seed}/600/600`; }

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

const products = [
  { title: "纯棉毛巾 2条装 柔软吸水", description: "100%新疆长绒棉，活性印染不掉色，蓬松柔软。70x34cm 加大尺寸，2条装独立包装。", price: 29.9, image_url: pic("towel-set") },
  { title: "草莓味牙膏 120g", description: "含氟防蛀配方，清新草莓味，有效去除牙菌斑。120g大容量，全家适用。", price: 12.9, image_url: pic("toothpaste") },
  { title: "多肉植物盆栽 随机3盆", description: "精选多肉组合，好养易活，带土带盆发货。适合桌面、阳台装饰。", price: 19.9, image_url: pic("succulent") },
  { title: "3M 防尘口罩 50只装", description: "KN95级过滤效率≥95%，四层防护结构，亲肤内层透气舒适。独立包装。", price: 35.0, image_url: pic("face-mask") },
  { title: "Type-C 数据线 1米 快充", description: "支持100W超级快充，480Mbps数据传输。编织线身防缠绕。", price: 9.9, image_url: pic("type-c-cable") },
  { title: "可折叠收纳箱 45L", description: "45L大容量，加厚PP材质坚固耐用。折叠后仅6cm厚，带盖防尘。", price: 26.8, image_url: pic("storage-box") },
  { title: "毛绒趴趴狗抱枕 30cm", description: "超软水晶绒面料，环保PP棉填充，手感柔软回弹好。可当靠垫或午睡枕。", price: 22.0, image_url: pic("plush-pillow") },
  { title: "桌面手机支架 可折叠", description: "铝合金材质稳固不晃动，6档角度调节，兼容4-10寸设备。", price: 15.5, image_url: pic("phone-stand") },
  { title: "复古马克杯 350ml 大肚杯", description: "陶瓷材质，复古做旧风格，350ml容量。微波炉洗碗机可用。", price: 18.8, image_url: pic("mug-cup") },
  { title: "透明亚克力化妆品收纳盒", description: "高清通透亚克力材质，防尘防水，三层分区设计。", price: 32.0, image_url: pic("acrylic-organizer") },
  { title: "不锈钢保温杯 500ml", description: "316不锈钢内胆，12小时保温8小时保冷。食品级硅胶密封圈。", price: 39.0, image_url: pic("thermos") },
  { title: "增高鞋垫 隐形透气 3cm", description: "PU发泡材质柔软回弹，蜂窝透气孔设计。3cm增高仅约60g。", price: 11.8, image_url: pic("insole") },
  { title: "桌面迷你小风扇 USB充电", description: "三档风力调节，超静音<30dB。2000mAh电池续航8小时。", price: 25.0, image_url: pic("mini-fan") },
  { title: "垃圾袋 加厚抽绳 100只", description: "45x50cm加厚PE材质，承重8kg不漏水。抽绳设计一提即收。", price: 14.9, image_url: pic("trash-bags") },
  { title: "洗碗海绵 魔力擦 20片装", description: "双面设计：百洁布面+海绵面。纳米去污技术，物理去污无刮痕。", price: 8.9, image_url: pic("sponge") },
  { title: "自动开合油壶 500ml", description: "重力感应自动开盖，单手倒油不脏手。500ml容量玻璃瓶身。", price: 19.9, image_url: pic("oil-pot") },
  { title: "隔热防烫手套 一对装", description: "加厚棉质面料，硅胶防滑点设计，耐热200℃。长款护腕设计。", price: 16.0, image_url: pic("oven-gloves") },
  { title: "卡通硅胶杯垫 6个装", description: "食品级硅胶材质，耐高温防滑。可爱卡通造型直径10cm。", price: 13.5, image_url: pic("coasters") },
  { title: "湿厕纸 家庭装 80抽", description: "纯水配方无酒精香精，可冲散木浆材质不堵马桶。EDI纯水7重净化。", price: 17.9, image_url: pic("wet-wipes") },
  { title: "手提帆布袋 文艺简约", description: "16安加密帆布，厚实耐用承重5kg。35x40cm大容量，内袋设计。", price: 21.0, image_url: pic("canvas-bag") },
];

async function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const wasmPath = path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm");
  const SQL = await initSqlJs({ locateFile: () => wasmPath });

  const db = new SQL.Database(fs.readFileSync(DB_PATH));

  // 确保系统卖家存在
  const existing = queryOne<{ id: string }>(db, "SELECT id FROM profiles WHERE id = ?", [SYSTEM_SELLER_ID]);
  if (!existing) {
    run(db, "INSERT INTO profiles (id, username, avatar_url, balance, created_at) VALUES (?, ?, ?, ?, ?)", [SYSTEM_SELLER_ID, "官方商城", pic("official-shop"), 0, now()]);
  }

  // 插入商品
  let inserted = 0;
  const stmt = db.prepare("INSERT INTO products (id, title, description, price, image_url, seller_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'on_sale', ?)");
  for (const p of products) {
    stmt.bind([uuid(), p.title, p.description, p.price, p.image_url, SYSTEM_SELLER_ID, now()]);
    stmt.step();
    stmt.reset();
    inserted++;
  }
  stmt.free();

  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log(`✅ 成功追加 ${inserted} 件日用品`);
}

main().catch(err => { console.error("❌ 失败:", err instanceof Error ? err.message : String(err)); process.exit(1); });
