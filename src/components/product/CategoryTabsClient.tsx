"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Category {
  id: number | null;
  name: string;
  slug: string;
}

export function CategoryTabsClient({
  categories,
}: {
  categories: Category[];
  search?: string;
  sort?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category");
  const activeId = currentCategory ? Number(currentCategory) : null;
  const search = searchParams.get("search") || undefined;
  const sort = searchParams.get("sort") || undefined;

  const navigate = (id: number | null) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    if (id !== null) params.set("category", String(id));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-2">
      {categories.map((c) => {
        const isActive = c.id === activeId;
        return (
          <button
            key={c.id ?? "all"}
            onClick={() => navigate(c.id)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium rounded-xl cursor-pointer whitespace-nowrap transition-colors duration-200",
              isActive ? "text-brand" : "text-muted hover:text-ink/70"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="category-pill"
                className="absolute inset-0 rounded-xl bg-mint/80"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}
