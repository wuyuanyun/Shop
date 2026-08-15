import { queryOne, queryAll, execute, uuid, now } from "./sqlite";
import type { Favorite, Product } from "@/lib/types";

export async function addFavorite(
  userId: string,
  productId: string
): Promise<Favorite | null> {
  // 检查是否已存在
  const existing = await getFavorite(userId, productId);
  if (existing) return existing;

  const id = uuid();
  try {
    await execute(
      "INSERT INTO favorites (id, user_id, product_id, created_at) VALUES (?, ?, ?, ?)",
      [id, userId, productId, now()]
    );
  } catch {
    // UNIQUE constraint violation - already favorited
    return await getFavorite(userId, productId);
  }

  return { id, user_id: userId, product_id: productId, created_at: new Date().toISOString() };
}

export async function removeFavorite(
  id: string,
  userId: string
): Promise<boolean> {
  await execute("DELETE FROM favorites WHERE id = ? AND user_id = ?", [id, userId]);
  return true;
}

export async function getFavorite(
  userId: string,
  productId: string
): Promise<Favorite | null> {
  return queryOne<Favorite>(
    "SELECT * FROM favorites WHERE user_id = ? AND product_id = ?",
    [userId, productId]
  );
}

export async function getUserFavorites(userId: string): Promise<Product[]> {
  return queryAll<Product>(
    `SELECT p.* FROM favorites f
     JOIN products p ON f.product_id = p.id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId]
  );
}

export async function getUserFavoritesList(
  userId: string
): Promise<Favorite[]> {
  return queryAll<Favorite>(
    "SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );
}
