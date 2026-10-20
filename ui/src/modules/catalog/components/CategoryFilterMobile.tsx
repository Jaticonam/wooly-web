import type { Category } from "@wooly/contracts/types/product";
import "@/styles/catalog/category-filter-mobile.css";

interface Props {
  allCategory?: Category;
  scrollableCategories: Category[];
  counts?: Record<string, number>;
  active: string;
  onSelect: (id: string) => void;
}

export function CategoryFilterMobile({
  allCategory,
  scrollableCategories,
  counts = {},
  active,
  onSelect,
}: Props) {
  const items = allCategory
    ? [allCategory, ...scrollableCategories]
    : scrollableCategories;

  return (
    <div className="md:hidden pb-1">
      <div className="category-mobile-grid">
        {items.map((c) => {
          const count = counts[c.id] ?? 0;
          const isActive = active === c.id;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={`category-mobile-card ${isActive ? "category-mobile-card-active" : ""}`}
            >
              <span className="category-mobile-icon">{c.icon}</span>
              <span className="category-mobile-name">{c.name}</span>
              <span className="category-mobile-count">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
