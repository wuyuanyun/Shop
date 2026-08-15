import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { countProductsBySeller } from "@/lib/db/products";
import { countOrdersByBuyer } from "@/lib/db/orders";
import { formatPrice } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Package, Heart, Receipt, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [selling, bought] = await Promise.all([
    countProductsBySeller(profile.id),
    countOrdersByBuyer(profile.id),
  ]);

  return (
    <div className="space-y-5">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-line/50 overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-20 bg-gradient-to-r from-mint via-mint/70 to-brand/10" />
        <div className="px-5 pb-5 -mt-8">
          <div className="w-16 h-16 rounded-2xl bg-white ring-4 ring-white shadow-sm overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-mint grid place-items-center text-brand text-xl font-bold">
                {profile.username?.[0] || "我"}
              </div>
            )}
          </div>
          <h1 className="text-lg font-bold text-ink mt-2">
            {profile.username}
          </h1>

          {/* Balance */}
          <div className="flex items-center gap-2 mt-3 px-4 py-3 bg-mint/30 rounded-xl">
            <Wallet size={18} className="text-brand" />
            <span className="text-sm text-muted">余额</span>
            <span className="text-lg font-bold text-brand ml-auto">
              ¥{formatPrice(profile.balance)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-line/50 p-4 text-center">
          <p className="text-2xl font-bold text-ink">{selling || 0}</p>
          <p className="text-xs text-muted mt-1">我发布的</p>
        </div>
        <div className="bg-white rounded-2xl border border-line/50 p-4 text-center">
          <p className="text-2xl font-bold text-ink">{bought || 0}</p>
          <p className="text-xs text-muted mt-1">我购买的</p>
        </div>
      </div>

      {/* Menu */}
      <div className="bg-white rounded-2xl border border-line/50 overflow-hidden divide-y divide-line/50">
        <Link
          href="/products/new"
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-mint/30 transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-brand/10 grid place-items-center">
            <Package size={16} className="text-brand" />
          </div>
          <span className="text-sm font-medium text-ink flex-1">发布商品</span>
          <span className="text-muted text-xs">→</span>
        </Link>
        <Link
          href="/orders"
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-mint/30 transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-brand/10 grid place-items-center">
            <Receipt size={16} className="text-brand" />
          </div>
          <span className="text-sm font-medium text-ink flex-1">我的订单</span>
          <span className="text-muted text-xs">→</span>
        </Link>
        <Link
          href="/favorites"
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-mint/30 transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-brand/10 grid place-items-center">
            <Heart size={16} className="text-brand" />
          </div>
          <span className="text-sm font-medium text-ink flex-1">我的收藏</span>
          <span className="text-muted text-xs">→</span>
        </Link>
      </div>

      <LogoutButton />
    </div>
  );
}
