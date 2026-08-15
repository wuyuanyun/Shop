"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ShoppingBag, Receipt, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "首页", icon: Home },
  { href: "/products", label: "商品", icon: ShoppingBag },
  { href: "/orders", label: "订单", icon: Receipt },
  { href: "/favorites", label: "收藏", icon: Heart },
  { href: "/profile", label: "我的", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-3 inset-x-0 z-40 flex justify-center px-4">
      <div className="w-full max-w-md bg-white/80 glass border border-white/40 rounded-2xl shadow-nav px-2 py-1.5">
        <div className="grid grid-cols-5">
          {items.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] cursor-pointer transition-colors duration-200 rounded-xl",
                  active ? "text-brand" : "text-muted hover:text-ink/70"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-1 rounded-xl bg-mint/70"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={20} className="relative z-10" />
                <span className="relative z-10 font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
