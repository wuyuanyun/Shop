import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllProducts, createProduct } from "@/lib/db/products";
import { productSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const sort = searchParams.get("sort") ?? undefined;

  const products = await getAllProducts(search, sort);
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "请先登录" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_params", message: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const product = await createProduct({
    seller_id: user.id,
    ...parsed.data,
  });

  return NextResponse.json({ product }, { status: 201 });
}
