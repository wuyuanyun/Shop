import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendMessage, getConversation } from "@/lib/db/messages";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const receiverId = searchParams.get("receiver_id");

    if (!receiverId) {
      return NextResponse.json(
        { error: "请指定 receiver_id 参数" },
        { status: 400 }
      );
    }

    const messages = await getConversation(user.id, receiverId);
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("Messages GET error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await req.json();
    const { receiver_id, content, product_id } = body;

    if (!receiver_id || !content?.trim()) {
      return NextResponse.json(
        { error: "缺少 receiver_id 或 content" },
        { status: 400 }
      );
    }

    if (receiver_id === user.id) {
      return NextResponse.json(
        { error: "不能给自己发消息" },
        { status: 400 }
      );
    }

    const message = await sendMessage({
      sender_id: user.id,
      receiver_id,
      content: content.trim(),
      product_id: product_id ?? null,
    });

    return NextResponse.json({ message });
  } catch (err) {
    console.error("Messages POST error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
