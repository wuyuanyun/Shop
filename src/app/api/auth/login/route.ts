import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { findProfileByEmail } from "@/lib/db/profiles";
import { hashPassword, verifyPassword, setSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_params", message: parsed.error.issues[0]?.message || "参数错误" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // 特殊处理：第一次启动时没有用户，允许任意邮箱+密码注册
    const user = await findProfileByEmail(email);
    if (!user) {
      // 自动注册（Demo 友好）
      const { createProfile } = await import("@/lib/db/profiles");
      const newUser = await createProfile(
        email.split("@")[0],
        email,
        hashPassword(password)
      );
      await setSession(newUser.id);
      return NextResponse.json({ user: { id: newUser.id, email: newUser.email } });
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: "auth_error", message: "该账号数据异常，请重新注册" },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: "auth_error", message: "密码错误" },
        { status: 401 }
      );
    }

    await setSession(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("Login error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "server_error", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
