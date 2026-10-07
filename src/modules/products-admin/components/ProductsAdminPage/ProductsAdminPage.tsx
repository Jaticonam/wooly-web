import {
  useMemo,
  useState,
} from "react";

import {
  Boxes,
  FileStack,
  PackageCheck,
  PackageOpen,
  PackageX,
  ReceiptText,
  RefreshCw,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AdminModal from "@/modules/admin/components/AdminModal/AdminModal";
import AdminShell from "@/modules/admin/components/AdminShell/AdminShell";

import SheetsMasterPanel from "../SheetsMasterPanel/SheetsMasterPanel";

import {
  useCatalogCampaigns,
} from "@/modules/catalog/hooks/useCatalogCampaigns";

import { useAdminProducts } from "../../hooks/useAdminProducts";

import ProductAdminExplorer from "@/modules/products-admin/components/ProductAdminExplorer/ProductAdminExplorer";
import ProductDetailDrawer from "@/modules/products-admin/components/ProductDetailDrawer/ProductDetailDrawer";
import ProductsToolbar from "@/modules/products-admin/components/ProductsToolbar/ProductsToolbar";

import {
  EMPTY_PRODUCT_ADMIN_FILTERS,
  filterAdminProducts,
  hasActiveProductAdminFilters,
  type ProductAdminFilterState,
} from "@/modules/products-admin/domain/ProductAdminFilters";

import {
  summarizeProductAdminOperations,
} from "@/modules/products-admin/domain/ProductAdminOperationalState";

import {
  areAllVisibleProductsSelected,
  toggleProductAdminSelection,
  toggleVisibleProductAdminSelection,
} from "@/modules/products-admin/domain/ProductAdminSelection";

import {
  DEFAULT_PRODUCT_ADMIN_COLUMNS,
  type ProductAdminColumnVisibility,
  type ProductAdminDensity,
  type ProductAdminOptionalColumnKey,
} from "@/modules/products-admin/domain/ProductAdminDisplay";

import type {
  ProductAdminViewMode,
} from "@/modules/products-admin/domain/ProductAdminViewMode";

import type {
  Product,
} from "@/shared/types/product";

import {
  createCatalogWorkspaceHandoff,
} from "@/modules/catalog-tools/domain/CatalogWorkspaceHandoff";

import CreateProductPanel from "../CreateProductPanel/CreateProductPanel";

import "./ProductsAdminPage.css";

function normalizedStatus(
  product: Product,
): string {
  return String(
    product.status ?? "",
  )
    .trim()
    .toLowerCase();
}

function numericStock(
  product: Product,
): number | null {
  const value = Number(
    product.stock,
  );

  return Number.isFinite(
    value,
  )
    ? value
    : null;
}

export default function ProductsAdminPage() {
    const navigate =
    useNavigate();
const [
    isCatalogSyncOpen,
    setIsCatalogSyncOpen,
  ] = useState(false);

  const [
    filters,
    setFilters,
  ] = useState<ProductAdminFilterState>(
    EMPTY_PRODUCT_ADMIN_FILTERS,
  );

  const [
    viewMode,
    setViewMode,
  ] = useState<ProductAdminViewMode>(
    "grid",
  );

  const [
    density,
    setDensity,
  ] = useState<ProductAdminDensity>(
    "comfortable",
  );

  const [
    columns,
    setColumns,
  ] = useState<ProductAdminColumnVisibility>(
    DEFAULT_PRODUCT_ADMIN_COLUMNS,
  );

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState<Product | null>(
    null,
  );

  const [
    selectedProductIds,
    setSelectedProductIds,
  ] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const {
    data: products,
    isLoading,
    isFullCatalogLoaded,
    error, categories, reload,
  } = useAdminProducts();

  const {
    campaigns,
    isLoading:
      isCampaignRegistryLoading,
  } = useCatalogCampaigns({
    includeInactive: true,
  });

  const isReady = isFullCatalogLoaded;

  const filteredProducts =
    useMemo(
      () =>
        filterAdminProducts(
          products,
          filters,
        ),
      [
        products,
        filters,
      ],
    );

  const visibleProductIds =
    useMemo(
      () =>
        filteredProducts.map(
          (product) =>
            product.id,
        ),
      [
        filteredProducts,
      ],
    );

  const allVisibleSelected =
    useMemo(
      () =>
        areAllVisibleProductsSelected(
          selectedProductIds,
          visibleProductIds,
        ),
      [
        selectedProductIds,
        visibleProductIds,
      ],
    );

  const operationalSummary =
    useMemo(
      () =>
        summarizeProductAdminOperations(
          filteredProducts,
        ),
      [
        filteredProducts,
      ],
    );

  const summary =
    useMemo(
      () => {
        const published =
          products.filter(
            (product) =>
              normalizedStatus(
                product,
              ) ===
              "publicado",
          ).length;

        const preparing =
          products.filter(
            (product) =>
              normalizedStatus(
                product,
              ) ===
              "borrador",
          ).length;

        const outOfStock =
          products.filter(
            (product) => {
              const status =
                normalizedStatus(
                  product,
                );

              const stock =
                numericStock(
                  product,
                );

              return (
                status === "agotado" ||
                stock === 0
              );
            },
          ).length;

        return {
          total:
            products.length,
          published,
          preparing,
          outOfStock,
        };
      },
      [
        products,
      ],
    );

  const toggleProductSelection = (
    product: Product,
  ) => {
    setSelectedProductIds(
      (current) =>
        toggleProductAdminSelection(
          current,
          product.id,
        ),
    );
  };

  const toggleVisibleSelection =
    () => {
      setSelectedProductIds(
        (current) =>
          toggleVisibleProductAdminSelection(
            current,
            visibleProductIds,
          ),
      );
    };

  const clearSelection =
    () => {
      setSelectedProductIds(
        new Set<string>(),
      );
    };

  const toggleColumn = (
    column:
      ProductAdminOptionalColumnKey,
  ) => {
    setColumns(
      (current) => ({
        ...current,
        [column]:
          !current[column],
      }),
    );
  };


  const prepareCatalog = () => {
    if (
      selectedProductIds.size ===
      0
    ) {
      return;
    }

    navigate(
      "/admin/catalogos",
      {
        state:
          createCatalogWorkspaceHandoff(
            [
              ...selectedProductIds,
            ],
          ),
      },
    );
  };return (
    <AdminShell title="Productos">
      <main className="products-admin-page">
        <AdminModal
          open={
            isCatalogSyncOpen
          }
          size="large"
          title="Google Sheets"
          description="Revisa el estado del catálogo y actualiza los datos cuando sea necesario."
          onClose={() =>
            setIsCatalogSyncOpen(
              false,
            )
          }
        >
          <SheetsMasterPanel onSynced={reload} />
        </AdminModal>

        <header className="products-admin-page__hero">
          <div className="products-admin-page__heroCopy">
            <div className="products-admin-page__eyebrow">
              <span>
                PRODUCT EXPLORER
              </span>

              <small>
                Productos y sincronización
              </small>
            </div>

            <h1>
              Productos
            </h1>

            <p>
              Explora y selecciona productos para preparar catálogos y futuras salidas comerciales.
            </p>
          </div>

          {import.meta.env.VITE_ENABLE_PRODUCT_CREATION === "true" ? <CreateProductPanel /> : null}

          <button
            className="products-admin-page__syncButton"
            type="button"
            onClick={() =>
              setIsCatalogSyncOpen(
                true,
              )
            }
          >
            <RefreshCw
              size={15}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            Actualizar datos
          </button>
        </header>

        <section
          className="products-admin-page__metrics"
          aria-label="Resumen de productos"
        >
          <article className="products-admin-page__metric is-total">
            <div
              className="products-admin-page__metricIcon"
              aria-hidden="true"
            >
              <Boxes
                size={18}
                strokeWidth={1.9}
              />
            </div>

            <div>
              <span>
                Total
              </span>

              <strong>
                {summary.total}
              </strong>
            </div>
          </article>

          <article className="products-admin-page__metric">
            <div
              className="products-admin-page__metricIcon is-positive"
              aria-hidden="true"
            >
              <PackageCheck
                size={18}
                strokeWidth={1.9}
              />
            </div>

            <div>
              <span>
                Publicados
              </span>

              <strong>
                {summary.published}
              </strong>
            </div>
          </article>

          <article className="products-admin-page__metric">
            <div
              className="products-admin-page__metricIcon is-warning"
              aria-hidden="true"
            >
              <PackageOpen
                size={18}
                strokeWidth={1.9}
              />
            </div>

            <div>
              <span>
                En preparación
              </span>

              <strong>
                {summary.preparing}
              </strong>
            </div>
          </article>

          <article className="products-admin-page__metric">
            <div
              className="products-admin-page__metricIcon is-danger"
              aria-hidden="true"
            >
              <PackageX
                size={18}
                strokeWidth={1.9}
              />
            </div>

            <div>
              <span>
                Sin stock
              </span>

              <strong>
                {summary.outOfStock}
              </strong>
            </div>
          </article>
        </section>

        <ProductsToolbar
          categories={categories}
          filters={
            filters
          }
          campaigns={
            campaigns
          }
          resultCount={
            filteredProducts.length
          }
          visibleCount={
            operationalSummary.visible
          }
          sellableCount={
            operationalSummary.sellable
          }
          viewMode={
            viewMode
          }
          density={
            density
          }
          columns={
            columns
          }
          hasActiveFilters={
            hasActiveProductAdminFilters(
              filters,
            )
          }
          onFiltersChange={
            setFilters
          }
          onViewModeChange={
            setViewMode
          }
          onDensityChange={
            setDensity
          }
          onToggleColumn={
            toggleColumn
          }
          onClear={() =>
            setFilters(
              EMPTY_PRODUCT_ADMIN_FILTERS,
            )
          }
        />

        <div className="products-admin-page__resultsHeader">
          <div>
            <strong>
              Productos
            </strong>

            <span>
              {filteredProducts.length} de {products.length}
            </span>
          </div>
        </div>

        <section
          className="products-admin-page__selectionBar"
          aria-label="Selección comercial"
        >
          <div className="products-admin-page__selectionSummary">
            <strong>
              {selectedProductIds.size} seleccionados
            </strong>

            <span>
              La selección alimentará Catálogos y futuras salidas comerciales.
            </span>
          </div>

          <div className="products-admin-page__selectionActions">
            <button
              type="button"
              onClick={
                toggleVisibleSelection
              }
              disabled={
                visibleProductIds.length === 0
              }
            >
              {allVisibleSelected
                ? "Deseleccionar visibles"
                : "Seleccionar visibles"}
            </button>

            <button
              className="is-primary"
              type="button"
              disabled={
                selectedProductIds.size === 0
              }
              onClick={
                prepareCatalog
              }
            >
              <FileStack
                size={14}
                strokeWidth={1.9}
                aria-hidden="true"
              />
              Preparar catálogo
            </button>

            <button
              className="is-commercial"
              type="button"
              disabled
              title="Cotizaciones todavía no forman parte del módulo Wooly Admin V2."
            >
              <ReceiptText
                size={14}
                strokeWidth={1.9}
                aria-hidden="true"
              />
              Cotizar selección
            </button>

            {selectedProductIds.size > 0 ? (
              <button
                className="is-clear"
                type="button"
                onClick={
                  clearSelection
                }
              >
                <X
                  size={13}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                Limpiar
              </button>
            ) : null}
          </div>
        </section>

        <ProductAdminExplorer
          products={
            filteredProducts
          }
          campaigns={
            campaigns
          }
          isReady={
            isReady
          }
          viewMode={
            viewMode
          }
          density={
            density
          }
          columns={
            columns
          }
          selectedProductIds={
            selectedProductIds
          }
          onSelectProduct={
            setSelectedProduct
          }
          onToggleProductSelection={
            toggleProductSelection
          }
        />

        <ProductDetailDrawer
          product={
            selectedProduct
          }
          campaigns={
            campaigns
          }
          open={
            selectedProduct !== null
          }
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProduct(
                null,
              );
            }
          }}
        />

        {error ? <p role="alert">{error.message}</p> : null}
        {!isReady ? (
          <p
            className="products-admin-page__loading"
            role="status"
          >
            {
              isLoading ||
              isCampaignRegistryLoading
                ? "Cargando productos y campañas oficiales..."
                : "El inventario todavía está consolidando sus categorías."
            }
          </p>
        ) : null}
      </main>
    </AdminShell>
  );
}
