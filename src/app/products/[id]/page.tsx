import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getProductById } from "@/lib/db/products";
import { getSellerProfile } from "@/lib/db/profiles";
import { getFavorite } from "@/lib/db/favorites";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { PRODUCT_STATUS_LABEL } from "@/lib/types";
import { PurchaseBar } from "./PurchaseBar";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const seller = await getSellerProfile(product.seller_id);
  const profile = await getCurrentProfile();

  let favId: string | undefined;
  let favorited = false;
  if (profile) {
    const fav = await getFavorite(profile.id, id);
    if (fav) {
      favId = fav.id;
      favorited = true;
    }
  }
  const isOwner = profile?.id === product.seller_id;

  return (
    <div className="space-y-5 pb-28">
      {/* Hero Image */}
      <div className="-mx-4 aspect-[4/3] bg-line overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            width={800}
            height={600}
            className="w-full h-full object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted/40 bg-mint/20">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-mint/50 mx-auto mb-2 grid place-items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-brand/30">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
              <p className="text-xs">暂无图片</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-line/50 overflow-hidden">
        <div className="p-5">
          {/* Title & Status */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-xl font-bold text-ink leading-snug text-balance">
              {product.title}
            </h1>
            <Badge tone={product.status === "on_sale" ? "mint" : "muted"} dot>
              {PRODUCT_STATUS_LABEL[product.status]}
            </Badge>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-brand">
              ¥{formatPrice(product.price)}
            </span>
            <span className="text-xs text-muted">虚拟币</span>
          </div>

          {/* Divider */}
          <div className="border-t border-line/50 -mx-5" />

          {/* Description */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              商品描述
            </p>
            <p className="text-sm text-ink/80 leading-relaxed">
              {product.description || "暂无描述"}
            </p>
          </div>
        </div>

        {/* Seller Card */}
        <div className="border-t border-line/50 bg-mint/20 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white ring-2 ring-brand/10 overflow-hidden shrink-0">
            {seller?.avatar_url ? (
              <img
                src={seller.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-brand text-sm font-bold">
                卖
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted uppercase tracking-wide">
              卖家
            </p>
            <p className="text-sm font-semibold text-ink truncate">
              {seller?.username || "未知用户"}
            </p>
          </div>
          {isOwner && (
            <a
              href={`/products/${product.id}/edit`}
              className="text-xs font-medium text-brand hover:text-brand-dark px-3 py-1.5 rounded-lg bg-white/80 border border-brand/15 hover:bg-white transition-colors cursor-pointer shrink-0"
            >
              编辑商品
            </a>
          )}
        </div>
      </div>

      <PurchaseBar
        productId={product.id}
        isOnSale={product.status === "on_sale"}
        isOwner={isOwner}
        isLoggedIn={!!profile}
        initialFavorited={favorited}
        initialFavoriteId={favId}
      />
    </div>
  );
}
