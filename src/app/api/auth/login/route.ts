import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { findProfileByEmail } from "@/lib/db/profiles";
import { verifyPassword, setSession } from "@/lib/auth";

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

    const { email, password, remember } = parsed.data;

    const user = await findProfileByEmail(email);
    if (!user) {
      // 邮箱不存在：明确提示先注册，不再自动建号
      return NextResponse.json(
        { error: "not_found", message: "该邮箱未注册，请先注册" },
        { status: 401 }
      );
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

    await setSession(user.id, remember);
    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err) {
    console.error("Login error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "server_error", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
