import {
  useMemo,
  useState,
} from "react";

import AdminModal from "@/modules/admin/components/AdminModal/AdminModal";
import AdminShell from "@/modules/admin/components/AdminShell/AdminShell";
import CatalogSyncPanel from "@/modules/catalog-tools/components/CatalogSyncPanel/CatalogSyncPanel";
import {
  useCatalogCampaigns,
} from "@/modules/catalog/hooks/useCatalogCampaigns";
import {
  useCatalogData,
} from "@/modules/catalog/hooks/useCatalogData";
import ProductsToolbar from "@/modules/products-admin/components/ProductsToolbar/ProductsToolbar";
import ProductAdminExplorer from "@/modules/products-admin/components/ProductAdminExplorer/ProductAdminExplorer";
import ProductDetailDrawer from "@/modules/products-admin/components/ProductDetailDrawer/ProductDetailDrawer";
import type {
  Product,
} from "@/shared/types/product";
import {
  EMPTY_PRODUCT_ADMIN_FILTERS,
  filterAdminProducts,
  hasActiveProductAdminFilters,
  type ProductAdminFilterState,
} from "@/modules/products-admin/domain/ProductAdminFilters";
import {
  summarizeProductAdminOperations,
} from "@/modules/products-admin/domain/ProductAdminOperationalState";
import type {
  ProductAdminViewMode,
} from "@/modules/products-admin/domain/ProductAdminViewMode";

import "./ProductsAdminPage.css";

export default function ProductsAdminPage() {
  const [
    isCatalogSyncOpen,
    setIsCatalogSyncOpen,
  ] = useState(false);
  const [filters, setFilters] = useState<ProductAdminFilterState>(
    EMPTY_PRODUCT_ADMIN_FILTERS,
  );
  const [viewMode, setViewMode] = useState<ProductAdminViewMode>(
    "grid",
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    data: products,
    isLoading,
    isFullCatalogLoaded,
  } = useCatalogData("todas");

  const {
    campaigns,
    isLoading: isCampaignRegistryLoading,
  } = useCatalogCampaigns({
    includeInactive: true,
  });

  const isReady =
    isFullCatalogLoaded &&
    !isCampaignRegistryLoading;

  const filteredProducts = useMemo(
    () => filterAdminProducts(products, filters),
    [products, filters],
  );
  const operationalSummary = useMemo(
    () => summarizeProductAdminOperations(filteredProducts),
    [filteredProducts],
  );

  return (
    <AdminShell
      title="Productos"
      subtitle="Inventario comercial"
    >
      <main className="products-admin-page">
        <AdminModal
          open={isCatalogSyncOpen}
          size="large"
          title="Google Sheets"
          description="Revisa el estado del catálogo y actualiza los datos cuando sea necesario."
          onClose={() => setIsCatalogSyncOpen(false)}
        >
          <CatalogSyncPanel
            currentProductCount={products.length}
            campaignCount={campaigns.length}
            isReady={isReady}
            initiallyExpanded
          />
        </AdminModal>

        <header className="products-admin-page__header">
          <div>
            <span>Productos</span>
            <h1>Inventario comercial</h1>
            <p>
              Encuentra y revisa productos sin mezclar composición ni publicación de catálogos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCatalogSyncOpen(true)}
          >
            Google Sheets
          </button>
        </header>

        <ProductsToolbar
          filters={filters}
          campaigns={campaigns}
          resultCount={filteredProducts.length}
          visibleCount={operationalSummary.visible}
          sellableCount={operationalSummary.sellable}
          viewMode={viewMode}
          hasActiveFilters={hasActiveProductAdminFilters(filters)}
          onFiltersChange={setFilters}
          onViewModeChange={setViewMode}
          onClear={() => setFilters(EMPTY_PRODUCT_ADMIN_FILTERS)}
        />

        <ProductAdminExplorer
          products={filteredProducts}
          campaigns={campaigns}
          isReady={isReady}
          viewMode={viewMode}
          onSelectProduct={setSelectedProduct}
        />

        <ProductDetailDrawer
          product={selectedProduct}
          campaigns={campaigns}
          open={selectedProduct !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProduct(null);
            }
          }}
        />

        {!isReady ? (
          <p className="products-admin-page__loading" role="status">
            {isLoading || isCampaignRegistryLoading
              ? "Cargando productos y campañas oficiales..."
              : "El inventario todavía está consolidando sus categorías."}
          </p>
        ) : null}
      </main>
    </AdminShell>
  );
}
