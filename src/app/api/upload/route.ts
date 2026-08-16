import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getSupabase,
  IMAGE_BUCKET,
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from "@/lib/supabase";
import { randomUUID } from "node:crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "请先登录" },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid_params", message: "请求格式错误" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "invalid_params", message: "缺少图片文件" },
      { status: 400 }
    );
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error: "invalid_type",
        message: "仅支持 JPG / PNG / WebP / GIF 格式图片",
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "too_large", message: "图片不能超过 5MB" },
      { status: 400 }
    );
  }

  // 用 MIME 映射扩展名，避免依赖用户文件名
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const path = `${user.id}/${Date.now()}-${randomUUID().slice(0, 8)}.${extMap[file.type]}`;

  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error || !data) {
    return NextResponse.json(
      {
        error: "upload_failed",
        message: "上传失败：" + (error?.message ?? "未知错误"),
      },
      { status: 500 }
    );
  }

  const { data: pub } = supabase.storage
    .from(IMAGE_BUCKET)
    .getPublicUrl(data.path);

  return NextResponse.json({ url: pub.publicUrl });
}
