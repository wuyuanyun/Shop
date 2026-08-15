-- ============================================================
-- ShopFree 虚拟购物平台 - 数据库全量 DDL
-- 用途：在 Supabase 的 SQL Editor 中一次性执行本文件即可完成建表。
-- 前置：Supabase 项目已创建（PostgreSQL）。执行后请在
--        Authentication -> Providers -> Email 中关闭 "Confirm email"
--        以便演示环境注册后即可直接登录。
-- ============================================================

-- 1. 用户资料表（关联 Supabase 原生 auth.users）
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  avatar_url text,
  balance integer not null default 100,
  created_at timestamptz default now()
);

-- 2. 商品表
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  price integer not null check (price > 0),
  image_url text,
  status text not null default 'on_sale' check (status in ('on_sale', 'sold_out')),
  created_at timestamptz default now()
);

-- 3. 订单表
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'shipping', 'delivered')),
  logistics_info text,
  created_at timestamptz default now()
);

-- 4. 收藏表
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

-- 5. 聊天消息表（后续接入 Realtime）
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  product_id uuid references public.products (id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================================
-- 索引（优化列表与关联查询）
-- ============================================================
create index if not exists idx_products_seller on public.products (seller_id);
create index if not exists idx_products_status on public.products (status);
create index if not exists idx_products_created on public.products (created_at desc);
create index if not exists idx_orders_buyer on public.orders (buyer_id);
create index if not exists idx_orders_seller on public.orders (seller_id);
create index if not exists idx_orders_product on public.orders (product_id);
create index if not exists idx_favorites_user on public.favorites (user_id);
create index if not exists idx_messages_sender on public.messages (sender_id);
create index if not exists idx_messages_receiver on public.messages (receiver_id);

-- ============================================================
-- 行级安全（RLS）
-- ============================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.favorites enable row level security;
alter table public.messages enable row level security;

-- profiles：公开可读（用于展示卖家信息），仅本人可更新
create policy "profiles_select_public" on public.profiles
  for select using (true);
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- products：公开可浏览；写操作仅本人
create policy "products_select_public" on public.products
  for select using (true);
create policy "products_insert_self" on public.products
  for insert with check (auth.uid() = seller_id);
create policy "products_update_self" on public.products
  for update using (auth.uid() = seller_id) with check (auth.uid() = seller_id);
create policy "products_delete_self" on public.products
  for delete using (auth.uid() = seller_id);

-- orders：仅买卖双方可见；仅卖家可更新物流状态；禁止直接插入/删除（下单走 RPC）
create policy "orders_select_parties" on public.orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "orders_update_seller" on public.orders
  for update using (auth.uid() = seller_id) with check (auth.uid() = seller_id);
create policy "orders_insert_deny" on public.orders
  for insert with check (false);
create policy "orders_delete_deny" on public.orders
  for delete using (false);

-- favorites：仅本人可见/增/删
create policy "favorites_select_self" on public.favorites
  for select using (auth.uid() = user_id);
create policy "favorites_insert_self" on public.favorites
  for insert with check (auth.uid() = user_id);
create policy "favorites_delete_self" on public.favorites
  for delete using (auth.uid() = user_id);

-- messages：仅收发双方可见，仅发送方可插入
create policy "messages_select_parties" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "messages_insert_self" on public.messages
  for insert with check (auth.uid() = sender_id);

-- ============================================================
-- 触发器：注册即自动建资料并发放初始余额 100
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url, balance)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    null,
    100
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RPC：create_order —— 原子化下单（防超卖、扣余额、置售罄）
-- 由后端 /api/orders 调用，前端不直接访问数据库。
-- ============================================================
create or replace function public.create_order(p_product_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid := auth.uid();
  v_product products%rowtype;
  v_order orders%rowtype;
begin
  if v_buyer is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  -- 行锁，防止并发超卖
  select * into v_product from products where id = p_product_id for update;

  if not found then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;
  if v_product.status <> 'on_sale' then
    raise exception 'PRODUCT_SOLD_OUT';
  end if;
  if v_product.seller_id = v_buyer then
    raise exception 'CANNOT_BUY_OWN';
  end if;
  if (select balance from profiles where id = v_buyer) < v_product.price then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  -- 扣减买家余额、商品置售罄、生成订单（同一事务）
  update profiles set balance = balance - v_product.price where id = v_buyer;
  update products set status = 'sold_out' where id = p_product_id;

  insert into orders (product_id, buyer_id, seller_id, amount, status)
  values (p_product_id, v_buyer, v_product.seller_id, v_product.price, 'pending')
  returning * into v_order;

  return row_to_json(v_order);
end;
$$;
