import { cookies } from "next/headers";
import crypto from "crypto";
import type { Profile } from "@/lib/types";
import { getProfile, ensureProfile } from "@/lib/db/profiles";

const SESSION_COOKIE = "shopfree_session";

// 会话签名密钥：优先读取环境变量；未配置时回退到内置默认值并给出警告。
// 生产环境必须通过 .env.local 配置强随机 SESSION_SECRET，否则会话可被伪造。
const SIGNING_KEY = process.env.SESSION_SECRET || "sf_demo_local_key_2026";
if (!process.env.SESSION_SECRET && process.env.NODE_ENV !== "production") {
  console.warn(
    "[auth] 未配置 SESSION_SECRET，正在使用内置默认密钥，会话签名可被伪造。请在 .env.local 中配置强随机 SESSION_SECRET。"
  );
}

/** PBKDF2 哈希密码 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/** 验证密码 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
}

const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 天

/** 创建签名 Cookie 值: userId.expiry.signature */
function signToken(userId: string, maxAgeSeconds: number): string {
  const expiry = Date.now() + maxAgeSeconds * 1000;
  const payload = `${userId}.${expiry}`;
  const sig = crypto.createHmac("sha256", SIGNING_KEY).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/** 验证并解出 userId，无效返回 null */
function verifyToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiryStr, sig] = parts;
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) return null;
  const payload = `${userId}.${expiry}`;
  const expected = crypto.createHmac("sha256", SIGNING_KEY).update(payload).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return userId;
}

/** 设置登录 Cookie；remember=false 时仅保留 1 天，降低账号风险 */
export async function setSession(userId: string, remember = true) {
  const maxAge = remember ? SESSION_MAX_AGE : 24 * 60 * 60;
  const token = signToken(userId, maxAge);
  const ck = await cookies();
  ck.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

/** 清除登录 Cookie */
export async function clearSession() {
  const ck = await cookies();
  ck.delete(SESSION_COOKIE);
}

/** 获取当前登录用户 ID（不查 profile） */
export async function getCurrentUserId(): Promise<string | null> {
  const ck = await cookies();
  const token = ck.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** 获取当前登录用户（返回兼容旧签名的 user 对象） */
export async function getCurrentUser(): Promise<{ id: string; email?: string } | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const profile = await getProfile(userId);
  return { id: userId, email: profile?.email ?? undefined };
}

/** 获取当前用户完整 profile */
export async function getCurrentProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // 兼容旧数据用户（没有 email/password_hash 的记录）
  return ensureProfile(userId, "用户");
}
