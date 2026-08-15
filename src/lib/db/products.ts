import { queryOne, queryAll, execute, uuid, now } from "./sqlite";
import type { Product } from "@/lib/types";

export async function getAllProducts(
  search?: string,
  sort?: string
): Promise<Product[]> {
  let sql = "SELECT * FROM products WHERE 1=1";
  const params: unknown[] = [];

  if (search && search.trim()) {
    sql += " AND title LIKE ?";
    params.push(`%${search.trim()}%`);
  }

  if (sort === "price_asc") {
    sql += " ORDER BY price ASC";
  } else if (sort === "price_desc") {
    sql += " ORDER BY price DESC";
  } else {
    sql += " ORDER BY created_at DESC";
  }

  return queryAll<Product>(sql, params);
}

export async function getProductById(id: string): Promise<Product | null> {
  return queryOne<Product>("SELECT * FROM products WHERE id = ?", [id]);
}

export async function createProduct(data: {
  seller_id: string;
  title: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
}): Promise<Product> {
  const id = uuid();
  await execute(
    `INSERT INTO products (id, seller_id, title, description, price, image_url, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'on_sale', ?)`,
    [
      id,
      data.seller_id,
      data.title,
      data.description ?? null,
      data.price,
      data.image_url ?? null,
      now(),
    ]
  );
  return (await getProductById(id))!;
}

export async function updateProduct(
  id: string,
  sellerId: string,
  data: Partial<Pick<Product, "title" | "description" | "price" | "image_url" | "status">>
): Promise<Product | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      sets.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (sets.length === 0) return getProductById(id);

  params.push(id, sellerId);
  await execute(
    `UPDATE products SET ${sets.join(", ")} WHERE id = ? AND seller_id = ?`,
    params
  );
  return getProductById(id);
}

export async function deleteProduct(
  id: string,
  sellerId: string
): Promise<boolean> {
  // 检查是否有订单关联（内联查询，避免循环依赖）
  const row = await queryOne<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM orders WHERE product_id = ?",
    [id]
  );
  if (row && row.cnt > 0) return false;

  await execute("DELETE FROM products WHERE id = ? AND seller_id = ?", [id, sellerId]);
  return true;
}

export async function countProductsBySeller(sellerId: string): Promise<number> {
  const row = await queryOne<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM products WHERE seller_id = ?",
    [sellerId]
  );
  return row?.cnt ?? 0;
}
