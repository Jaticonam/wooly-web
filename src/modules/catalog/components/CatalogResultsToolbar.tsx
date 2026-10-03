import { ChevronDown, SlidersHorizontal } from "lucide-react";

import type { CatalogSortMode } from "@/modules/catalog/domain/CatalogResultsSort";

import "./CatalogResultsToolbar.css";

interface CatalogResultsToolbarProps {
  title?: string;
  count: number;
  compact?: boolean;
  filterCount?: number;
  sortMode: CatalogSortMode;
  onSortChange: (mode: CatalogSortMode) => void;
  onOpenFilters: () => void;
}

export function CatalogResultsToolbar({
  title = "",
  count,
  compact = false,
  filterCount = 0,
  sortMode,
  onSortChange,
  onOpenFilters,
}: CatalogResultsToolbarProps) {
  return (
    <section
      className={[
        "catalogResultsToolbar",
        compact ? "catalogResultsToolbarCompact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Controles de resultados del catálogo"
    >
      <div className="catalogResultsToolbarCopy">
        {title && <h1>{title}</h1>}

        <span>
          {count} {count === 1 ? "producto" : "productos"}
        </span>
      </div>

      <div className="catalogResultsToolbarActions">
        <button
          type="button"
          className="catalogResultsFilterButton"
          onClick={onOpenFilters}
        >
          <SlidersHorizontal aria-hidden="true" />
          <span>Filtros</span>

          {filterCount > 0 && (
            <strong aria-label={`${filterCount} filtros activos`}>
              {filterCount}
            </strong>
          )}
        </button>

        <label className="catalogResultsSort">
          <span className="sr-only">Ordenar productos</span>

          <select
            value={sortMode}
            onChange={(event) =>
              onSortChange(event.target.value as CatalogSortMode)
            }
            aria-label="Ordenar productos"
          >
            <option value="featured">Destacados</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name-asc">Nombre: A–Z</option>
          </select>

          <ChevronDown aria-hidden="true" />
        </label>
      </div>
    </section>
  );
}
