import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation";
import { findProfileByEmail, createProfile } from "@/lib/db/profiles";
import { hashPassword, setSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_params", message: parsed.error.issues[0]?.message || "参数错误" },
        { status: 400 }
      );
    }

    const { email, password, username } = parsed.data;

    const existing = await findProfileByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "duplicate", message: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    const user = await createProfile(username, email, hashPassword(password));
    await setSession(user.id);

    return NextResponse.json({ user: { id: user.id, email: user.email, username: user.username } });
  } catch (err) {
    console.error("Register error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "server_error", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
