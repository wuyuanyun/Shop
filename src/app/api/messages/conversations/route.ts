import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getConversations } from "@/lib/db/messages";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const conversations = await getConversations(user.id);
    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("Conversations GET error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
