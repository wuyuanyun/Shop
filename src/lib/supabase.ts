import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * 服务端 Supabase 客户端。
 * 使用可公开的 publishable key（受 RLS 约束），仅用于图片上传到 product-images 桶。
 * 不做认证，persistSession 关闭以避免在服务端存储会话。
 */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("缺少 Supabase 配置：请检查 .env.local 中的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export const IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
