"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const statusLabel =
    product.status === "on_sale"
      ? { label: "在售", cls: "bg-brand/10 text-brand" }
      : { label: "已下架", cls: "bg-line text-muted" };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Link
        href={`/products/${product.id}`}
        className="block rounded-2xl bg-white border border-line/60 overflow-hidden transition-shadow duration-300 hover:shadow-card cursor-pointer"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] bg-mint/30 overflow-hidden">
          {product.image_url ? (
            <>
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted text-sm">暂无图片</span>
            </div>
          )}

          {/* Status / Favorite */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium",
                statusLabel.cls
              )}
            >
              {statusLabel.label}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl bg-white/80 glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer hover:bg-white hover:text-danger"
            aria-label="收藏"
          >
            <Heart size={15} />
          </button>
        </div>

        {/* Info */}
        <div className="p-3.5">
          <h3 className="text-sm font-semibold text-ink line-clamp-1 leading-snug">
            {product.title}
          </h3>
          <p className="text-[10px] text-muted mt-0.5 line-clamp-1 min-h-[16px]">
            {product.description || " "}
          </p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-brand text-base font-bold">
              ¥{product.price.toFixed(2)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
