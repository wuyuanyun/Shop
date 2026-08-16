# ShopFree · 虚拟购物平台

基于 **Next.js 15 (App Router) + TypeScript + Tailwind CSS + SQLite (sql.js) + Supabase Storage** 的轻量化虚拟购物平台。所有交易使用虚拟币，无真实资金。内置 AI 购物助手，支持 Function Calling 智能下单。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 App Router + React 19 |
| 语言 | TypeScript 5.7 (strict) |
| 样式 | Tailwind CSS 3.4 + tailwindcss-animate |
| 业务数据库 | SQLite WASM (`sql.js`) — 零依赖，本地文件 `data/shopfree.db` |
| 图片存储 | Supabase Storage — 公开桶 `product-images`，publishable key + RLS 策略 |
| 认证 | 自建 Cookie + HMAC Session + PBKDF2 密码哈希 |
| AI | 通义千问 (DashScope) qwen-plus，Function Calling 多轮工具调用 |
| 动画 | framer-motion 12 |
| 图标 | lucide-react |
| 校验 | Zod |

> **数据分层说明**：业务数据（用户 / 商品 / 订单 / 收藏 / 消息）仍存储在本地 SQLite (sql.js)；**仅商品图片**托管在 Supabase Storage，两者相互独立。

## 功能总览

- **用户系统**：注册 / 登录（支持自动注册）/ 个人中心 / 余额管理
- **商品市场**：分类浏览 / 关键词搜索 / 排序 / 发布 / 编辑 / 删除
- **图片上传**：商品图片本地上传至 Supabase Storage（JPG / PNG / WebP / GIF，≤5MB），自动生成公开 URL，支持预览与更换
- **交易系统**：数据库事务下单（扣余额 → 加余额 → 生成订单 → 置售罄，防超卖）
- **订单管理**：我买的 / 我卖的双视角，卖家可更新物流状态
- **收藏系统**：收藏 / 取消收藏 / 收藏列表
- **AI 助手**：通义千问智能对话，支持搜索商品 / 查余额 / 直接下单 / 查看详情 / 列出商品
- **站内聊天**：用户间 1v1 对话，支持按商品发起聊天

## 本地启动

```bash
npm install
cp .env.local.example .env.local   # 填入 DASHSCOPE_API_KEY 与 Supabase 配置
npx tsx scripts/seed.ts            # 初始化数据库并写入种子数据
npm run dev                        # http://localhost:3000
```

> 说明：种子脚本使用 `npx tsx` 直接执行（`package.json` 未内置 `seed` 命令）；如需每日用品种子数据可运行 `npx tsx scripts/seed-daily.ts`。

第一次启动后，登录页支持自动注册：输入任意邮箱 + 密码，系统会自动创建账号并赠送 100 虚拟币。

## 环境变量

```env
# 通义千问 API Key（AI 助手，必填）
DASHSCOPE_API_KEY=sk-your-dashscope-api-key

# Supabase Storage（商品图片上传，publishable key 可公开）
# 在 Supabase 控制台 → Project Settings → API 中查看
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

# 会话签名密钥（可选，不填则使用默认值）
# SESSION_SECRET=your-random-secret
```

> ⚠️ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 是**可公开**的 publishable key（受 RLS 约束），可安全写在前端代码；**切勿**使用 `service_role` key（拥有绕过 RLS 的超级权限，仅可放在 `.env.local` 且勿提交 git）。

## 数据库

### 业务数据（SQLite）

| 表 | 说明 | 核心字段 |
|----|------|----------|
| `profiles` | 用户 | username, email, balance (默认100), avatar_url |
| `products` | 商品 | title, description, price, status (on_sale/sold_out), seller_id |
| `orders` | 订单 | product_id, buyer_id, seller_id, amount, status (pending/shipping/delivered) |
| `favorites` | 收藏 | user_id, product_id (UNIQUE) |
| `messages` | 消息 | sender_id, receiver_id, content, product_id |

### 数据库层封装

`src/lib/db/sqlite.ts` 提供简洁的查询接口：

```typescript
await queryOne<T>(sql, params)   // 查询单行
await queryAll<T>(sql, params)   // 查询多行
await execute(sql, params)       // 执行写操作
await saveDb()                   // 持久化到文件
```

### 图片存储（Supabase Storage）

商品图片托管在 Supabase Storage 公开桶 `product-images` 中，与 sql.js 业务数据分离：

- 上传入口：`src/app/api/upload/route.ts`（服务端中转：登录校验 → 类型 / 大小校验 → 上传 → 返回公开 URL）
- 客户端：`src/lib/supabase.ts`（publishable key + RLS，不保存会话）
- 存储路径：`{userId}/{时间戳}-{随机}.{ext}`
- 首次使用需在 Supabase 控制台 **SQL Editor** 执行建桶与 RLS 策略：

```sql
-- 1. 创建公开图片桶（已存在则跳过）
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 2. 允许公开上传图片到该桶（RLS 限定：仅图片类型）
create policy "allow public image uploads to product-images"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'product-images'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
);
```

### 种子数据

- `scripts/seed.ts` — 20 件数码类商品（iPhone、MacBook、AirPods 等）
- `scripts/seed-daily.ts` — 20 件日用品（毛巾、牙膏、多肉、数据线等）

运行 `npx tsx scripts/seed.ts` 会导入全部 20 件数码商品并创建"官方商城"卖家；两个脚本都执行则共 40 件商品。

## 目录结构

```
src/
├── app/                           # Next.js App Router 页面 & API
│   ├── page.tsx                   # 首页 · 搜索 + Hero + 分类Tab + 商品网格
│   ├── login/page.tsx             # 登录
│   ├── register/page.tsx          # 注册
│   ├── profile/page.tsx           # 个人中心 · 头像/余额/统计/快捷入口
│   ├── products/
│   │   ├── page.tsx               # 商品列表 · 搜索+排序+分类
│   │   ├── new/page.tsx           # 发布商品
│   │   └── [id]/
│   │       ├── page.tsx           # 商品详情 · 大图/信息/卖家/购买
│   │       ├── PurchaseBar.tsx    # 底部购买栏 · 购买/收藏
│   │       └── edit/page.tsx      # 编辑商品
│   ├── orders/
│   │   ├── page.tsx               # 订单中心 · 我买的/我卖的
│   │   └── OrderStatusControl.tsx # 卖家发货/标记签收
│   ├── favorites/page.tsx         # 我的收藏
│   ├── chat/page.tsx              # AI 助手 + 站内聊天
│   └── api/                       # REST API 路由
│       ├── auth/                   # login / register / logout / profile
│       ├── products/               # CRUD + [id]/status
│       ├── orders/                 # 下单 + 列表 + [id]/status
│       ├── favorites/              # 收藏 + [id]
│       ├── messages/               # 发送 + 对话 + conversations
│       ├── chat/                   # AI 对话 (通义千问 Function Calling)
│       └── upload/                 # 图片上传 (Supabase Storage)
│
├── components/
│   ├── auth/         AuthForm / LogoutButton
│   ├── layout/       AppShell / BottomNav / TopSearchBar
│   ├── product/      ProductCard / ProductGrid / ProductForm / CategoryTabs
│   └── ui/           Badge / Button / Card / Modal
│
└── lib/
    ├── auth.ts       认证：Cookie 会话 + PBKDF2 密码 + HMAC 签名
    ├── supabase.ts   Supabase 客户端（publishable key + RLS）
    ├── types.ts      类型定义 (Profile / Product / Order / Favorite / Message)
    ├── utils.ts      工具函数 (cn / formatPrice / formatTime)
    ├── validation.ts Zod 校验 (product / login / register / order / favorite)
    └── db/
        ├── sqlite.ts     SQLite WASM 核心 · queryOne / queryAll / execute
        ├── profiles.ts   用户模型
        ├── products.ts   商品模型
        ├── orders.ts     订单模型 · 事务下单
        ├── messages.ts   消息模型
        └── favorites.ts  收藏模型
```

## 核心设计

### 下单事务

```typescript
// src/lib/db/orders.ts
db.run("BEGIN TRANSACTION");
// 1. 扣减买家余额
// 2. 增加卖家余额
// 3. 创建订单记录
// 4. 更新商品状态为 sold_out
db.run("COMMIT");
await saveDb();
```

### AI 助手 (Function Calling)

`src/app/api/chat/route.ts` 集成通义千问 qwen-plus 模型，支持 5 种工具调用：

| 工具 | 功能 |
|------|------|
| `searchProducts` | 按关键词搜索商品 |
| `checkBalance` | 查询用户余额 |
| `createOrder` | 直接下单购买 |
| `getProductDetail` | 查看商品详情 |
| `listAllProducts` | 列出在售商品 |

AI 最多进行 3 轮 Function Calling 迭代，下单无需二次确认。

### 认证方案

自建 Cookie + HMAC Session 方案，7 天过期，PBKDF2 密码哈希。登录支持自动注册——已部署种子数据后可立即使用。

## 一键启动

```bash
npm install         # 安装依赖
npx tsx scripts/seed.ts   # 初始化数据库 + 种子数据
npm run dev         # 启动开发服务器 → http://localhost:3000
npm run build       # 生产构建
npm start           # 生产启动
```

## 后续计划

- [x] 商品图片本地上传（已接入 Supabase Storage）
- [ ] 业务数据迁移至 Supabase PostgreSQL（当前仅图片存储使用 Supabase）
- [ ] 接入 Supabase Realtime 实现即时通讯
- [ ] 图片删除与定期清理（当前仅实现上传）
- [ ] 用户头像上传
- [ ] 订单评价系统
