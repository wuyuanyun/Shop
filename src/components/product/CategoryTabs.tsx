import { CategoryTabsClient } from "./CategoryTabsClient";

const STATIC_CATEGORIES = [
  { id: 1, name: "数码", slug: "digital" },
  { id: 2, name: "日用", slug: "daily" },
  { id: 3, name: "家居", slug: "home" },
  { id: 4, name: "户外", slug: "outdoor" },
  { id: 5, name: "其他", slug: "other" },
];

export async function CategoryTabs({
  search,
  sort,
}: {
  search?: string;
  sort?: string;
}) {
  const all = { id: null as number | null, name: "全部", slug: "all" };
  return (
    <CategoryTabsClient
      categories={[all, ...STATIC_CATEGORIES]}
      search={search}
      sort={sort}
    />
  );
}
