import { CategoryTabs } from "@/components/product/CategoryTabs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getAllProducts } from "@/lib/db/products";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>;
}) {
  const { search, sort } = await searchParams;
  const products = await getAllProducts(search, sort);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="-mx-4 mb-1">
        <div className="bg-gradient-to-br from-mint via-mint/70 to-mint/40 px-4 py-8">
          <div className="max-w-[1200px] mx-auto">
            <p className="text-xs font-semibold text-brand/70 uppercase tracking-wider mb-1">
              ShopFree
            </p>
            <h1 className="text-2xl font-bold text-ink leading-tight">
              发现虚拟好物
            </h1>
            <p className="text-sm text-ink/60 mt-1.5 max-w-md">
              用 100 虚拟币开启轻量化交易之旅，买你想买，卖你想卖
            </p>
            <div className="flex gap-2 mt-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 text-xs text-brand font-medium ring-1 ring-brand/10">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                已上架 {products.length} 件商品
              </div>
            </div>
          </div>
        </div>
      </section>

      <CategoryTabs sort={sort} search={search} />
      <ProductGrid products={products} />
    </div>
  );
}
