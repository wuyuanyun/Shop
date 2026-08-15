import { getDb, queryOne, queryAll, execute, uuid, now, saveDb } from "./sqlite";
import type { Order } from "@/lib/types";
import { getProductById } from "./products";

export async function createOrder(
  productId: string,
  buyerId: string
): Promise<{ order_id: string } | { error: string }> {
  const db = await getDb();

  // 1. 查询商品
  const product = await getProductById(productId);
  if (!product) return { error: "PRODUCT_NOT_FOUND" };
  if (product.status !== "on_sale") return { error: "PRODUCT_SOLD_OUT" };
  if (product.seller_id === buyerId) return { error: "CANNOT_BUY_OWN" };

  // 2. 查询买家余额
  const buyer = await queryOne<{ balance: number }>(
    "SELECT balance FROM profiles WHERE id = ?",
    [buyerId]
  );
  if (!buyer) return { error: "UNAUTHENTICATED" };
  if (buyer.balance < product.price) return { error: "INSUFFICIENT_BALANCE" };

  // 3. 执行事务
  try {
    db.run("BEGIN TRANSACTION");

    db.run("UPDATE profiles SET balance = balance - ? WHERE id = ?", [
      product.price,
      buyerId,
    ]);
    db.run("UPDATE profiles SET balance = balance + ? WHERE id = ?", [
      product.price,
      product.seller_id,
    ]);

    const orderId = uuid();
    db.run(
      `INSERT INTO orders (id, product_id, buyer_id, seller_id, amount, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [orderId, productId, buyerId, product.seller_id, product.price, now()]
    );

    db.run("UPDATE products SET status = 'sold_out' WHERE id = ?", [productId]);

    db.run("COMMIT");
    await saveDb();
    return { order_id: orderId };
  } catch (err) {
    try { db.run("ROLLBACK"); } catch { /* ignore */ }
    console.error("createOrder transaction failed:", err);
    return { error: "ORDER_FAILED" };
  }
}

export async function getOrders(
  userId: string,
  role: "buy" | "sell"
): Promise<
  (Order & { product: { title: string; image_url: string | null; price: number } | null })[]
> {
  const field = role === "buy" ? "buyer_id" : "seller_id";

  const rows = await queryAll<{
    id: string;
    product_id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
    status: string;
    logistics_info: string | null;
    created_at: string;
    product_title: string | null;
    product_image_url: string | null;
    product_price: number | null;
  }>(
    `SELECT o.*, p.title as product_title, p.image_url as product_image_url, p.price as product_price
     FROM orders o
     LEFT JOIN products p ON o.product_id = p.id
     WHERE o.${field} = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    product_id: row.product_id,
    buyer_id: row.buyer_id,
    seller_id: row.seller_id,
    amount: row.amount,
    status: row.status as Order["status"],
    logistics_info: row.logistics_info,
    created_at: row.created_at,
    product: row.product_title
      ? {
          title: row.product_title,
          image_url: row.product_image_url,
          price: row.product_price as number,
        }
      : null,
  }));
}

export async function updateOrderStatus(
  id: string,
  sellerId: string,
  status: string
): Promise<Order | null> {
  await execute("UPDATE orders SET status = ? WHERE id = ? AND seller_id = ?", [
    status,
    id,
    sellerId,
  ]);
  return queryOne<Order>("SELECT * FROM orders WHERE id = ?", [id]);
}

export async function countOrdersByBuyer(buyerId: string): Promise<number> {
  const row = await queryOne<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM orders WHERE buyer_id = ?",
    [buyerId]
  );
  return row?.cnt ?? 0;
}
