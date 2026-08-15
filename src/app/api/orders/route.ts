import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createOrder, getOrders } from "@/lib/db/orders";
import { orderSchema } from "@/lib/validation";

const RPC_ERRORS: Record<string, string> = {
  UNAUTHENTICATED: "请先登录",
  PRODUCT_NOT_FOUND: "商品不存在",
  PRODUCT_SOLD_OUT: "商品已售罄",
  CANNOT_BUY_OWN: "不能购买自己的商品",
  INSUFFICIENT_BALANCE: "虚拟余额不足",
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "请先登录" },
      { status: 401 }
    );
  }

  const parsed = orderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_params", message: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const result = await createOrder(parsed.data.product_id, user.id);

  if ("error" in result) {
    const message = RPC_ERRORS[result.error] || "下单失败，请稍后重试";
    return NextResponse.json(
      { error: "order_failed", message },
      { status: 400 }
    );
  }

  return NextResponse.json({ order: { id: result.order_id } }, { status: 201 });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "请先登录" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") === "sell" ? "sell" : "buy";

  const orders = await getOrders(user.id, role);
  return NextResponse.json({ orders });
}
