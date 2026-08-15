import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getUserFavorites } from "@/lib/db/favorites";
import { ProductGrid } from "@/components/product/ProductGrid";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const products = await getUserFavorites(profile.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-ink">我的收藏</h1>
        {products.length > 0 && (
          <span className="text-xs text-muted font-medium">
            {products.length} 件商品
          </span>
        )}
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
