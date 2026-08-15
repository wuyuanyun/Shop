import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProductById, updateProduct, deleteProduct } from "@/lib/db/products";
import { productSchema } from "@/lib/validation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return NextResponse.json(
      { error: "not_found", message: "商品不存在" },
      { status: 404 }
    );
  }
  return NextResponse.json({ product });
}

export async function PUT(
  req: Request,
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
  const parsed = productSchema
    .partial()
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_params", message: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const product = await updateProduct(id, user.id, parsed.data);
  if (!product) {
    return NextResponse.json(
      { error: "forbidden", message: "无权编辑该商品" },
      { status: 403 }
    );
  }
  return NextResponse.json({ product });
}

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
  const ok = await deleteProduct(id, user.id);

  if (!ok) {
    return NextResponse.json(
      { error: "has_orders", message: "商品已有订单，无法删除" },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
