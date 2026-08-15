"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function PurchaseBar({
  productId,
  isOnSale,
  isOwner,
  isLoggedIn,
  initialFavorited,
  initialFavoriteId,
}: {
  productId: string;
  isOnSale: boolean;
  isOwner: boolean;
  isLoggedIn: boolean;
  initialFavorited: boolean;
  initialFavoriteId?: string;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [favId, setFavId] = useState(initialFavoriteId);
  const [loading, setLoading] = useState(false);

  const toggleFav = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (favorited && favId) {
      await fetch(`/api/favorites/${favId}`, { method: "DELETE" });
      setFavorited(false);
      setFavId(undefined);
    } else {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFavorited(true);
        setFavId(data?.favorite?.id);
      }
    }
  };

  const buy = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      alert(data.message || "下单失败");
      return;
    }
    router.push("/orders");
  };

  return (
    <div className="fixed bottom-16 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md bg-white/85 glass border border-white/40 rounded-2xl shadow-nav px-4 py-3 flex items-center gap-3 pointer-events-auto"
      >
        {/* Favorite button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={toggleFav}
          className={cn(
            "w-11 h-11 rounded-xl grid place-items-center border transition-all duration-200 cursor-pointer shrink-0",
            favorited
              ? "bg-brand/10 text-danger border-danger/25"
              : "bg-white/60 text-muted border-line/60 hover:bg-mint/30"
          )}
          aria-label="收藏"
        >
          <Heart
            size={20}
            fill={favorited ? "#D9534F" : "none"}
            className={cn(
              "transition-transform duration-200",
              favorited && "scale-110"
            )}
          />
        </motion.button>

        {/* Buy button */}
        {isOnSale && !isOwner ? (
          <Button
            size="lg"
            className="flex-1 shadow-sm shadow-brand/25"
            onClick={buy}
            disabled={loading}
          >
            <ShoppingCart size={18} />
            {loading ? "下单中…" : "立即购买"}
          </Button>
        ) : isOwner ? (
          <Button size="lg" className="flex-1" variant="secondary" disabled>
            这是你的商品
          </Button>
        ) : (
          <Button size="lg" className="flex-1" variant="secondary" disabled>
            已售罄
          </Button>
        )}
      </motion.div>
    </div>
  );
}
