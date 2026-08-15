import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/db/orders";
import { orderStatusSchema } from "@/lib/validation";

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

  const parsed = orderStatusSchema.safeParse(
    await req.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_params", message: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const { id } = await params;
  const order = await updateOrderStatus(id, user.id, parsed.data.status);

  if (!order) {
    return NextResponse.json(
      { error: "forbidden", message: "无权操作该订单" },
      { status: 403 }
    );
  }
  return NextResponse.json({ order });
}
