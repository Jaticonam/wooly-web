import type { Category } from "@/shared/types/product";
import "./HeaderCategoryFilter.css";

interface Props {
  categories: Category[];
  active: string;
  counts?: Record<string, number>;
  onSelect: (id: string) => void;
}

export function HeaderCategoryFilter({
  categories,
  active,
  counts = {},
  onSelect,
}: Props) {
  const hasCounts = Object.keys(counts).length > 0;

  const visible = hasCounts
    ? categories.filter((c) => c.id === "todas" || (counts[c.id] ?? 0) > 0)
    : categories;

  return (
    <div className="header-category-filter">
      {visible.map((category) => {
        const isActive = active === category.id;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={`header-category-chip ${isActive ? "active" : ""}`}
            aria-pressed={isActive}
          >
            <span className="header-category-name">{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}
