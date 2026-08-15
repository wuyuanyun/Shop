import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// 简单中间件：仅在所有请求中附加 cookies 支持（本地 Auth 的需要）
export async function middleware(request: NextRequest) {
  // 本地认证通过 cookies 工作，此处无需额外处理
  // 但保留占位以便未来扩展（如路由保护）
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
