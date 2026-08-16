import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "shopfree_session";
// 与 src/lib/auth.ts 保持一致：优先环境变量，回退默认值（生产必须配置）
const SIGNING_KEY = process.env.SESSION_SECRET || "sf_demo_local_key_2026";

// 需要登录才能访问的页面（前缀匹配）
const PROTECTED_PREFIXES = [
  "/profile",
  "/orders",
  "/favorites",
  "/chat",
  "/products/new",
];

/** 判断路径是否需要登录 */
function isProtected(pathname: string): boolean {
  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  // 商品编辑页 /products/[id]/edit 也需登录，但 /products 列表与详情页公开
  if (pathname.startsWith("/products/") && pathname.endsWith("/edit")) {
    return true;
  }
  return false;
}

/** 用 Web Crypto（Edge Runtime 可用）校验会话签名，返回 userId 或 null */
async function verifyToken(token: string): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiryStr, sig] = parts;
  const expiry = parseInt(expiryStr, 10);
  if (Number.isNaN(expiry) || Date.now() > expiry) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SIGNING_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const buf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${userId}.${expiry}`)
  );
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 ? userId : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = token ? await verifyToken(token) : null;
  if (userId) return NextResponse.next();

  // 未登录：跳转到登录页，并携带原目标便于登录后跳回
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
