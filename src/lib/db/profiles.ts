import { queryOne, execute, uuid, now } from "./sqlite";
import type { Profile } from "@/lib/types";

export async function getProfile(id: string): Promise<Profile | null> {
  return queryOne<Profile>("SELECT * FROM profiles WHERE id = ?", [id]);
}

/** 根据邮箱查找用户 */
export async function findProfileByEmail(email: string): Promise<Profile | null> {
  return queryOne<Profile>("SELECT * FROM profiles WHERE email = ?", [email]);
}

/** 创建新用户（注册） */
export async function createProfile(
  username: string,
  email: string,
  passwordHash: string
): Promise<Profile> {
  const id = uuid();
  await execute(
    "INSERT INTO profiles (id, username, email, password_hash, avatar_url, balance, created_at) VALUES (?, ?, ?, ?, NULL, 100, ?)",
    [id, username, email, passwordHash, now()]
  );
  return (await getProfile(id))!;
}

/** 确保用户有本地 profile（向后兼容旧数据） */
export async function ensureProfile(
  id: string,
  username: string,
  avatar_url?: string | null
): Promise<Profile> {
  const existing = await getProfile(id);
  if (existing) return existing;

  await execute(
    "INSERT INTO profiles (id, username, avatar_url, balance, created_at) VALUES (?, ?, ?, 100, ?)",
    [id, username, avatar_url ?? null, now()]
  );
  return (await getProfile(id))!;
}

export async function updateBalance(
  id: string,
  delta: number
): Promise<Profile | null> {
  await execute("UPDATE profiles SET balance = balance + ? WHERE id = ?", [delta, id]);
  return getProfile(id);
}

export async function getSellerProfile(id: string): Promise<{
  username: string;
  avatar_url: string | null;
} | null> {
  return queryOne<{ username: string; avatar_url: string | null }>(
    "SELECT username, avatar_url FROM profiles WHERE id = ?",
    [id]
  );
}
