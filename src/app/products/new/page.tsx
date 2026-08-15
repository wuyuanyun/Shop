import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { ProductForm } from "@/components/product/ProductForm";
import { PackagePlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-brand/10 grid place-items-center">
          <PackagePlus size={20} className="text-brand" />
        </div>
        <h1 className="text-xl font-bold text-ink">发布新商品</h1>
      </div>
      <ProductForm />
    </div>
  );
}
