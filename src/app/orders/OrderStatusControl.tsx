"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function OrderStatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const next = status === "pending" ? "shipping" : "delivered";
  const label = status === "pending" ? "发货" : "标记签收";

  const advance = async () => {
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  };

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={advance}
      disabled={loading || status === "delivered"}
    >
      {loading ? "…" : label}
    </Button>
  );
}
