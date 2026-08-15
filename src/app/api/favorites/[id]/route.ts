import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { removeFavorite } from "@/lib/db/favorites";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "请先登录" },
      { status: 401 }
    );
  }

  const { id } = await params;
  await removeFavorite(id, user.id);
  return NextResponse.json({ ok: true });
}
