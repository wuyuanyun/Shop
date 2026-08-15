import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addFavorite, getUserFavoritesList } from "@/lib/db/favorites";
import { favoriteSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "请先登录" },
      { status: 401 }
    );
  }

  const parsed = favoriteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_params", message: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const favorite = await addFavorite(user.id, parsed.data.product_id);
  return NextResponse.json({ favorite }, { status: 201 });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "请先登录" },
      { status: 401 }
    );
  }

  const favorites = await getUserFavoritesList(user.id);
  return NextResponse.json({ favorites });
}
