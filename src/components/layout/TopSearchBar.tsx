"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Plus, Leaf, User, MessageCircle } from "lucide-react";
import type { Profile } from "@/lib/types";

export function TopSearchBar({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("search", q.trim());
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 flex justify-center">
      <div className="w-full h-full glass bg-white/70 border-b border-white/40 shadow-sm">
        <div className="max-w-[1200px] mx-auto h-full px-4 flex items-center gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="text-brand shrink-0 hover:scale-105 transition-transform duration-200"
            aria-label="首页"
          >
            <div className="w-9 h-9 rounded-xl bg-mint/70 flex items-center justify-center">
              <Leaf size={20} />
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={onSearch} className="flex-1 max-w-sm">
            <div className="flex items-center gap-2 bg-white/60 ring-1 ring-brand/10 rounded-xl px-3.5 h-9 transition-all duration-200 focus-within:ring-brand/30 focus-within:bg-white/90">
              <Search size={15} className="text-muted shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索商品..."
                className="bg-transparent outline-none w-full text-sm placeholder:text-muted/70"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Link
              href="/chat"
              className="w-9 h-9 grid place-items-center rounded-xl hover:bg-mint/70 text-ink/60 hover:text-brand transition-all duration-200 cursor-pointer"
              aria-label="聊天"
            >
              <MessageCircle size={18} />
            </Link>
            <Link
              href="/products/new"
              className="w-9 h-9 grid place-items-center rounded-xl hover:bg-mint/70 text-brand transition-all duration-200 cursor-pointer"
              aria-label="发布商品"
            >
              <Plus size={20} />
            </Link>
            <Link
              href={profile ? "/profile" : "/login"}
              className="w-9 h-9 grid place-items-center rounded-xl hover:bg-mint/70 transition-all duration-200 cursor-pointer overflow-hidden"
              aria-label="个人中心"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-brand/20"
                />
              ) : (
                <User size={18} className="text-ink/70" />
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
