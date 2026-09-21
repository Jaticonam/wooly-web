import type {
  Campaign,
} from "@/shared/types/product";
import {
  CATEGORY_CONFIG,
} from "@/modules/catalog/config/categories";
import type {
  ProductAdminViewMode,
} from "@/modules/products-admin/domain/ProductAdminViewMode";
import type {
  ProductAdminFilterState,
} from "@/modules/products-admin/domain/ProductAdminFilters";

import "./ProductsToolbar.css";

interface ProductsToolbarProps {
  filters: ProductAdminFilterState;
  campaigns: readonly Campaign[];
  resultCount: number;
  visibleCount: number;
  sellableCount: number;
  viewMode: ProductAdminViewMode;
  hasActiveFilters: boolean;
  onFiltersChange: (filters: ProductAdminFilterState) => void;
  onViewModeChange: (viewMode: ProductAdminViewMode) => void;
  onClear: () => void;
}

export default function ProductsToolbar({
  filters,
  campaigns,
  resultCount,
  visibleCount,
  sellableCount,
  viewMode,
  hasActiveFilters,
  onFiltersChange,
  onViewModeChange,
  onClear,
}: ProductsToolbarProps) {
  const countLabel = (count: number, singular: string, plural: string) =>
    `${count} ${count === 1 ? singular : plural}`;
  const update = <Key extends keyof ProductAdminFilterState>(
    key: Key,
    value: ProductAdminFilterState[Key],
  ) => onFiltersChange({
    ...filters,
    [key]: value,
  });

  return (
    <section className="products-toolbar" aria-label="Buscar y filtrar productos">
      <label className="products-toolbar__search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          value={filters.search}
          placeholder="Buscar por código, nombre o descripción…"
          aria-label="Buscar productos"
          onChange={(event) => update("search", event.target.value)}
        />
      </label>

      <div className="products-toolbar__filters">
        <select
          aria-label="Filtrar por categoría"
          value={filters.categoryId}
          onChange={(event) => update("categoryId", event.target.value)}
        >
          <option value="">Categoría</option>
          {CATEGORY_CONFIG.filter((category) => category.id !== "todas")
            .map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
        </select>

        <select
          aria-label="Filtrar por campaña"
          value={filters.campaignId}
          onChange={(event) => update("campaignId", event.target.value)}
        >
          <option value="">Campaña</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
          ))}
        </select>

        <select
          aria-label="Filtrar por stock"
          value={filters.stock}
          onChange={(event) => update(
            "stock",
            event.target.value as ProductAdminFilterState["stock"],
          )}
        >
          <option value="all">Stock</option>
          <option value="available">Disponible</option>
          <option value="low">Stock bajo</option>
          <option value="out">Agotado</option>
          <option value="inconsistent">Inconsistente</option>
        </select>

        <select
          aria-label="Filtrar por estado"
          value={filters.status}
          onChange={(event) => update(
            "status",
            event.target.value as ProductAdminFilterState["status"],
          )}
        >
          <option value="all">Estado</option>
          <option value="publicado">Publicado</option>
          <option value="preventa">Preventa</option>
          <option value="agotado">Agotado</option>
          <option value="oculto">Oculto</option>
          <option value="borrador">Borrador</option>
          <option value="invalid">Dato inválido</option>
        </select>
      </div>

      <footer className="products-toolbar__footer">
        <div className="products-toolbar__metrics" aria-label="Resumen de resultados">
          <strong>{countLabel(resultCount, "resultado", "resultados")}</strong>
          <span>{countLabel(sellableCount, "vendible", "vendibles")}</span>
          <span>{countLabel(visibleCount, "visible", "visibles")}</span>
        </div>

        <div className="products-toolbar__actions">
          {hasActiveFilters ? (
            <button type="button" className="is-clear" onClick={onClear}>
              Limpiar filtros
            </button>
          ) : null}

          <div role="group" aria-label="Vista de productos">
            <button
              type="button"
              className={viewMode === "grid" ? "is-active" : ""}
              aria-pressed={viewMode === "grid"}
              onClick={() => onViewModeChange("grid")}
            >
              ▦ <span>Cuadrícula</span>
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "is-active" : ""}
              aria-pressed={viewMode === "list"}
              onClick={() => onViewModeChange("list")}
            >
              ☰ <span>Lista</span>
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}
