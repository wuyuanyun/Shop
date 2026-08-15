import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getProductById } from "@/lib/db/products";
import { ProductForm } from "@/components/product/ProductForm";
import { Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const product = await getProductById(id);
  if (!product) notFound();
  if (product.seller_id !== profile.id) redirect(`/products/${id}`);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-brand/10 grid place-items-center">
          <Pencil size={20} className="text-brand" />
        </div>
        <h1 className="text-xl font-bold text-ink">编辑商品</h1>
      </div>
      <ProductForm
        id={id}
        initial={{
          title: product.title,
          description: product.description,
          price: product.price,
          image_url: product.image_url,
        }}
      />
    </div>
  );
}
