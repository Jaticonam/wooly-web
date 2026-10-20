import type { Category } from "@wooly/contracts/types/product";
import "@/styles/catalog/category-filter.css";

interface CategoryFilterDesktopProps {
  categories: Category[];
  active: string;
  counts?: Record<string, number>;
  onSelect: (id: string) => void;
}

export function CategoryFilterDesktop({
  categories,
  active,
  counts = {},
  onSelect,
}: CategoryFilterDesktopProps) {
  return (
    <div className="hidden gap-3 pb-6 md:grid md:grid-cols-5 xl:grid-cols-6">
      {categories.map((category, index) => {
        const count = counts[category.id] ?? 0;
        const isActive = active === category.id;

        return (
          <button
            key={`${category.id}-${index}`}
            type="button"
            onClick={() => onSelect(category.id)}
            title={category.name}
            aria-pressed={isActive}
            className={`category-card ${isActive ? "category-card-active" : ""}`}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
            <span className="category-count">{count} productos</span>
          </button>
        );
      })}
    </div>
  );
}
