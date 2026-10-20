import { Search } from "lucide-react";
import type { Product } from "@wooly/contracts/types/product";

interface SearchSuggestionsProps {
  value: string;
  hasValue: boolean;
  detectedCategory: string | null;
  suggestions: Product[];
  resultsCount: number;
  activeIndex: number;
  onCategoryClick: () => void;
  onProductHover: (index: number) => void;
  onProductClick: (product: Product) => void;
  onResultsHover: () => void;
  onResultsClick: () => void;
}

export function SearchSuggestions({
  value,
  hasValue,
  detectedCategory,
  suggestions,
  resultsCount,
  activeIndex,
  onCategoryClick,
  onProductHover,
  onProductClick,
  onResultsHover,
  onResultsClick,
}: SearchSuggestionsProps) {
  if (!detectedCategory && suggestions.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-[120] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      {detectedCategory && hasValue && (
        <button
          type="button"
          onClick={onCategoryClick}
          className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50"
        >
          <div>
            <p className="text-sm font-black text-slate-700">
              📂 Ver categoría {detectedCategory}
            </p>

            <p className="text-[11px] font-semibold text-slate-400">
              Coincide con tu búsqueda
            </p>
          </div>

          <Search className="h-4 w-4 shrink-0 text-slate-300" />
        </button>
      )}

      {suggestions.map((product, index) => (
        <button
          key={product.id}
          type="button"
          onMouseEnter={() => onProductHover(index)}
          onClick={() => onProductClick(product)}
          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
            activeIndex === index ? "bg-slate-100" : "hover:bg-slate-50"
          }`}
        >
          <img
            src={product.img}
            alt={product.title}
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 object-cover"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-700">
              {product.title}
            </p>

            <p className="truncate text-[11px] font-semibold text-slate-400">
              {product.category} · {product.id}
            </p>
          </div>

          <Search className="h-4 w-4 shrink-0 text-slate-300" />
        </button>
      ))}

      {hasValue && (
        <button
          type="button"
          onMouseEnter={onResultsHover}
          onClick={onResultsClick}
          className={`flex w-full items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-left transition ${
            activeIndex === suggestions.length
              ? "bg-[#e6f2f5]"
              : "bg-slate-50 hover:bg-slate-100"
          }`}
        >
          <div>
            <p className="text-sm font-black text-[#1d8299]">
              🔎 Ver {resultsCount} resultado{resultsCount !== 1 ? "s" : ""}
            </p>

            <p className="text-[11px] font-semibold text-slate-400">
              Explorar resultados para “{value}”
            </p>
          </div>

          <Search className="h-4 w-4 shrink-0 text-slate-300" />
        </button>
      )}
    </div>
  );
}
