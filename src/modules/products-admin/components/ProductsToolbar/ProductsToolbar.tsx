import {
  Columns3,
  LayoutGrid,
  ListFilter,
  Rows3,
  Search,
  Table2,
} from "lucide-react";

import type {
  Campaign,
} from "@/shared/types/product";

import {
  CATEGORY_CONFIG,
} from "@/modules/catalog/config/categories";

import type {
  ProductAdminFilterState,
} from "@/modules/products-admin/domain/ProductAdminFilters";

import {
  PRODUCT_ADMIN_COLUMN_OPTIONS,
  type ProductAdminColumnVisibility,
  type ProductAdminDensity,
  type ProductAdminOptionalColumnKey,
} from "@/modules/products-admin/domain/ProductAdminDisplay";

import type {
  ProductAdminViewMode,
} from "@/modules/products-admin/domain/ProductAdminViewMode";

import "./ProductsToolbar.css";

interface ProductsToolbarProps {
  filters: ProductAdminFilterState;
  categories?: readonly { id: string; name: string }[];
  campaigns: readonly Campaign[];
  resultCount: number;
  visibleCount: number;
  sellableCount: number;
  viewMode: ProductAdminViewMode;
  density: ProductAdminDensity;
  columns: ProductAdminColumnVisibility;
  hasActiveFilters: boolean;
  onFiltersChange: (
    filters: ProductAdminFilterState,
  ) => void;
  onViewModeChange: (
    viewMode: ProductAdminViewMode,
  ) => void;
  onDensityChange: (
    density: ProductAdminDensity,
  ) => void;
  onToggleColumn: (
    column: ProductAdminOptionalColumnKey,
  ) => void;
  onClear: () => void;
}

export default function ProductsToolbar({
  filters,
  categories = CATEGORY_CONFIG,
  campaigns,
  resultCount,
  visibleCount,
  sellableCount,
  viewMode,
  density,
  columns,
  hasActiveFilters,
  onFiltersChange,
  onViewModeChange,
  onDensityChange,
  onToggleColumn,
  onClear,
}: ProductsToolbarProps) {
  const update =
    <Key extends keyof ProductAdminFilterState>(
      key: Key,
      value: ProductAdminFilterState[Key],
    ) =>
      onFiltersChange({
        ...filters,
        [key]: value,
      });

  return (
    <section
      className={
        viewMode === "table"
          ? "products-toolbar is-table-view"
          : "products-toolbar"
      }
      aria-label="Buscar y filtrar productos"
    >
      <label className="products-toolbar__field products-toolbar__search">
        <span className="products-toolbar__label">
          Buscar productos
        </span>

        <div className="products-toolbar__inputWrap">
          <span
            className="products-toolbar__searchIcon"
            aria-hidden="true"
          >
            <Search
              size={15}
              strokeWidth={1.9}
            />
          </span>

          <input
            type="search"
            value={filters.search}
            placeholder="Código, nombre, descripción o badge"
            aria-label="Buscar productos"
            onChange={(event) =>
              update(
                "search",
                event.target.value,
              )
            }
          />
        </div>
      </label>

      <label className="products-toolbar__field">
        <span className="products-toolbar__label">
          Estado
        </span>

        <select
          aria-label="Filtrar por estado"
          value={filters.status}
          onChange={(event) =>
            update(
              "status",
              event.target.value as ProductAdminFilterState["status"],
            )
          }
        >
          <option value="all">
            Todos los estados
          </option>

          <option value="publicado">
            Publicado
          </option>

          <option value="preventa">
            Preventa
          </option>

          <option value="agotado">
            Agotado
          </option>

          <option value="oculto">
            Oculto
          </option>

          <option value="borrador">
            Borrador
          </option>

          <option value="invalid">
            Dato inválido
          </option>
        </select>
      </label>

      <label className="products-toolbar__field">
        <span className="products-toolbar__label">
          Categoría
        </span>

        <select
          aria-label="Filtrar por categoría"
          value={filters.categoryId}
          onChange={(event) =>
            update(
              "categoryId",
              event.target.value,
            )
          }
        >
          <option value="">
            Todas las categorías
          </option>

          {categories
            .filter(
              (category) =>
                category.id !== "todas",
            )
            .map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
        </select>
      </label>

      <div className="products-toolbar__field products-toolbar__viewField">
        <span className="products-toolbar__label">
          Vista
        </span>

        <div
          className="products-toolbar__view"
          role="group"
          aria-label="Vista de productos"
        >
          <button
            type="button"
            className={
              viewMode === "grid"
                ? "is-active"
                : ""
            }
            aria-pressed={
              viewMode === "grid"
            }
            onClick={() =>
              onViewModeChange("grid")
            }
          >
            <LayoutGrid
              size={14}
              strokeWidth={1.9}
              aria-hidden="true"
            />
            Tarjetas
          </button>

          <button
            type="button"
            className={
              viewMode === "list"
                ? "is-active"
                : ""
            }
            aria-pressed={
              viewMode === "list"
            }
            onClick={() =>
              onViewModeChange("list")
            }
          >
            <Rows3
              size={14}
              strokeWidth={1.9}
              aria-hidden="true"
            />
            Filas
          </button>

          <button
            type="button"
            className={
              viewMode === "table"
                ? "is-active"
                : ""
            }
            aria-pressed={
              viewMode === "table"
            }
            onClick={() =>
              onViewModeChange("table")
            }
          >
            <Table2
              size={14}
              strokeWidth={1.9}
              aria-hidden="true"
            />
            Tabla
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <>
          <label className="products-toolbar__field products-toolbar__density">
            <span className="products-toolbar__label">
              Densidad
            </span>

            <select
              aria-label="Densidad de productos"
              value={density}
              onChange={(event) =>
                onDensityChange(
                  event.target.value as ProductAdminDensity,
                )
              }
            >
              <option value="comfortable">
                Cómoda
              </option>

              <option value="compact">
                Compacta
              </option>
            </select>
          </label>

          <div className="products-toolbar__field products-toolbar__columnsField">
            <span className="products-toolbar__label">
              Columnas
            </span>

            <details className="products-toolbar__columns">
              <summary>
                <Columns3
                  size={14}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
                Columnas
              </summary>

              <div className="products-toolbar__columnsMenu">
                {PRODUCT_ADMIN_COLUMN_OPTIONS.map(
                  (option) => (
                    <label key={option.key}>
                      <input
                        type="checkbox"
                        checked={
                          columns[option.key]
                        }
                        onChange={() =>
                          onToggleColumn(
                            option.key,
                          )
                        }
                      />

                      <span>
                        {option.label}
                      </span>
                    </label>
                  ),
                )}
              </div>
            </details>
          </div>
        </>
      ) : null}

      <details className="products-toolbar__more">
        <summary>
          <ListFilter
            size={13}
            strokeWidth={1.9}
            aria-hidden="true"
          />
          Más filtros
        </summary>

        <div className="products-toolbar__morePanel">
          <label>
            <span>Campaña</span>

            <select
              aria-label="Filtrar por campaña"
              value={filters.campaignId}
              onChange={(event) =>
                update(
                  "campaignId",
                  event.target.value,
                )
              }
            >
              <option value="">
                Todas las campañas
              </option>

              {campaigns.map(
                (campaign) => (
                  <option
                    key={campaign.id}
                    value={campaign.id}
                  >
                    {campaign.name}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>Stock</span>

            <select
              aria-label="Filtrar por stock"
              value={filters.stock}
              onChange={(event) =>
                update(
                  "stock",
                  event.target.value as ProductAdminFilterState["stock"],
                )
              }
            >
              <option value="all">
                Todo el stock
              </option>

              <option value="available">
                Disponible
              </option>

              <option value="low">
                Stock bajo
              </option>

              <option value="out">
                Agotado
              </option>

              <option value="inconsistent">
                Inconsistente
              </option>
            </select>
          </label>
        </div>
      </details>

      <footer className="products-toolbar__footer">
        <div
          className="products-toolbar__metrics"
          aria-label="Resumen de resultados"
        >
          <strong>
            {resultCount} resultados
          </strong>

          <span>
            {sellableCount} vendibles
          </span>

          <span>
            {visibleCount} visibles
          </span>
        </div>

        {hasActiveFilters ? (
          <button
            className="products-toolbar__clear"
            type="button"
            onClick={onClear}
          >
            Limpiar filtros
          </button>
        ) : null}
      </footer>
    </section>
  );
}
