import { CategoryTabs } from "@/components/product/CategoryTabs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getAllProducts } from "@/lib/db/products";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>;
}) {
  const { search, sort } = await searchParams;
  const products = await getAllProducts(search, sort);

  return (
    <div className="space-y-4">
      <CategoryTabs sort={sort} search={search} />
      <ProductGrid products={products} />
    </div>
  );
}
