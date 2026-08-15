"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const ORDER_STATUS = {
  pending: { label: "待处理", icon: Clock, tone: "accent" as const },
  shipping: { label: "运送中", icon: Truck, tone: "brand" as const },
  delivered: { label: "已签收", icon: CheckCircle, tone: "mint" as const },
};

export default function OrdersPage() {
  const [role, setRole] = useState<"buy" | "sell">("buy");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders?role=${role}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [role]);

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ink">订单中心</h1>
      </div>

      {/* Role Tabs */}
      <div className="flex bg-white/80 rounded-2xl border border-line/50 p-1">
        {[
          { value: "buy", label: "我买的" },
          { value: "sell", label: "我卖的" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setRole(value as "buy" | "sell")}
            className={cn(
              "relative flex-1 py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-colors duration-200",
              role === value ? "text-brand" : "text-muted hover:text-ink/70"
            )}
          >
            {role === value && (
              <motion.div
                layoutId="order-role"
                className="absolute inset-0 rounded-xl bg-mint/80"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-line/50 p-5 space-y-3"
            >
              <div className="w-2/3 h-4 skeleton rounded-md" />
              <div className="w-1/3 h-3 skeleton rounded-md" />
              <div className="w-1/4 h-3 skeleton rounded-md" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-muted"
        >
          <div className="w-16 h-16 rounded-2xl bg-mint/50 flex items-center justify-center mb-4">
            <Package size={28} className="text-brand/40" />
          </div>
          <p className="text-sm font-medium">暂无订单</p>
          <p className="text-xs mt-1">
            {role === "buy" ? "去逛逛商品吧" : "还没有人购买你的商品"}
          </p>
        </motion.div>
      )}

      {/* Orders List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={role}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="space-y-3"
        >
          {orders.map((o) => {
            const s = ORDER_STATUS[o.status as keyof typeof ORDER_STATUS] ?? ORDER_STATUS.pending;
            const Icon = s.icon;
            return (
              <div
                key={o.id}
                className="rounded-2xl bg-white border border-line/50 overflow-hidden hover:shadow-card transition-shadow duration-300"
              >
                <Link href={`/products/${o.product_id}`} className="block p-4 cursor-pointer">
                  {/* Header: product name + status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-ink line-clamp-1 flex-1 min-w-0">
                      {o.product?.title || "商品已删除"}
                    </h3>
                    <Badge tone={s.tone} dot>
                      <Icon size={12} className="-ml-0.5" />
                      <span>{s.label}</span>
                    </Badge>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-sm font-bold text-ink">
                      ¥{o.amount?.toFixed(2)}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[11px] text-muted">
                    <span>{new Date(o.created_at).toLocaleDateString()}</span>
                    {o.logistics_info && (
                      <span className="truncate max-w-[180px]">
                        {o.logistics_info}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
