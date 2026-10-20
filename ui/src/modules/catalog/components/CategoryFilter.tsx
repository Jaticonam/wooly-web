import type { Category } from "@wooly/contracts/types/product";
import { CategoryFilterDesktop } from "@/modules/catalog/components/CategoryFilterDesktop";
import { CategoryFilterMobile } from "@/modules/catalog/components/CategoryFilterMobile";

interface CategoryFilterProps {
  categories: Category[];
  active: string;
  counts?: Record<string, number>;
  onSelect: (id: string) => void;
}

export function CategoryFilter({
  categories,
  active,
  counts = {},
  onSelect,
}: CategoryFilterProps) {
  const allCategory = categories.find((c) => c.id === "all") ?? categories[0];
  const scrollableCategories = categories.filter(
    (c) => c.id !== allCategory?.id,
  );

  return (
    <div className="w-full">
      <div className="category-filter-head">
        <h2 className="category-filter-title">Categorías</h2>
      </div>

      <CategoryFilterDesktop
        categories={categories}
        active={active}
        counts={counts}
        onSelect={onSelect}
      />

      <CategoryFilterMobile
        allCategory={allCategory}
        scrollableCategories={scrollableCategories}
        active={active}
        counts={counts}
        onSelect={onSelect}
      />
    </div>
  );
}
