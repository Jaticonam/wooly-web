import { useEffect, useMemo, useRef, useState } from "react";

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

import { useNavigate } from "react-router-dom";

import AdminShell from "@/modules/admin/components/AdminShell/AdminShell";

import { useAdminAuth } from "@/modules/admin-auth/context/AdminAuthContext";
import {
  loadAdminProductPublicationReadiness,
  publishAdminProduct,
  type AdminPublicationConfirmations,
  type AdminPublicationReadiness,
} from "@/modules/admin-auth/services/AdminAuthClient";
import { publicationErrorMessage } from "../../domain/PublicationFeedback";
import ProductPublicationDialog from "../ProductPublicationDialog/ProductPublicationDialog";
import BulkProductPublicationDialog from "../BulkProductPublicationDialog/BulkProductPublicationDialog";
import { getCampaignComputedStatus } from "@/modules/catalog/domain/CampaignRules";

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
  resolveProductAdminOperationalState,
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

import type { ProductAdminViewMode } from "@/modules/products-admin/domain/ProductAdminViewMode";

import type { Campaign, Product } from "@/shared/types/product";

import { createCatalogWorkspaceHandoff } from "@/modules/catalog-tools/domain/CatalogWorkspaceHandoff";

import CreateProductPanel from "../CreateProductPanel/CreateProductPanel";

import "./ProductsAdminPage.css";
import "./ProductExplorerVisualV2.css";

function normalizedStatus(product: Product): string {
  return String(product.status ?? "")
    .trim()
    .toLowerCase();
}

export default function ProductsAdminPage() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshing = useRef(false);


  const [filters, setFilters] = useState<ProductAdminFilterState>(EMPTY_PRODUCT_ADMIN_FILTERS);

  const [viewMode, setViewMode] = useState<ProductAdminViewMode>("grid");

  const [density, setDensity] = useState<ProductAdminDensity>("comfortable");

  const [columns, setColumns] = useState<ProductAdminColumnVisibility>(
    DEFAULT_PRODUCT_ADMIN_COLUMNS,
  );

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [selectedProductIds, setSelectedProductIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const {
    data: products,
    isLoading,
    isFullCatalogLoaded,
    error,
    categories,
    reload,
  } = useAdminProducts();

  const auth = useAdminAuth();
  const brandId = auth.configuration?.brandId;
  const canPublish =
    !!brandId &&
    !!auth.session?.accesses.some(
      (access) => access.brand.id === brandId && ["OWNER", "ADMIN"].includes(access.role),
    );
  const campaigns = useMemo<Campaign[]>(
    () =>
      (auth.configuration?.campaigns ?? []).map((campaign) => {
        const dates = {
          startDate: campaign.startsAt ?? "",
          endDate: campaign.endsAt ?? "",
          publicationStatus:
            campaign.publicationStatus.toUpperCase() === "PUBLISHED"
              ? "publicado"
              : campaign.publicationStatus.toUpperCase() === "DRAFT"
                ? "borrador"
                : "oculto",
        };
        return {
          id: campaign.id,
          name: campaign.name,
          icon: campaign.icon ?? "",
          color: campaign.color ?? "",
          themeToken: campaign.themeToken ?? "",
          colorClass: "",
          priority: campaign.priority,
          ...dates,
          computedStatus: getCampaignComputedStatus(dates),
        };
      }),
    [auth.configuration?.campaigns],
  );
  const [publishingProductId, setPublishingProductId] = useState<string | null>(null);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const publishing = useRef(false);
  const [publishError, setPublishError] = useState("");
  const [publishSuccess, setPublishSuccess] = useState("");
  const [publicationReview, setPublicationReview] = useState<{
    product: Product;
    readiness: AdminPublicationReadiness;
  } | null>(null);
  const [publicationSubmitting, setPublicationSubmitting] = useState(false);

  const closePublicationReview = () => {
    if (publicationSubmitting) return;
    setPublicationReview(null);
    setPublishingProductId(null);
    publishing.current = false;
  };

  const publishProduct = async (product: Product) => {
    if (!canPublish || !brandId || publishing.current || normalizedStatus(product) === "publicado")
      return;

    publishing.current = true;
    setPublishingProductId(product.id);
    setPublishError("");
    setPublishSuccess("");

    try {
      const response = await loadAdminProductPublicationReadiness(brandId, product.id);
      if (!response.success || response.data.productId !== product.id) {
        throw new Error("No se pudo verificar la publicación del producto.");
      }

      setPublicationReview({
        product,
        readiness: response.data,
      });
    } catch (error) {
      setPublishError(
        publicationErrorMessage(error),
      );
      publishing.current = false;
      setPublishingProductId(null);
    }
  };

  const confirmPublication = async (confirmations: AdminPublicationConfirmations) => {
    if (!publicationReview || !brandId || publicationSubmitting || !canPublish) return;

    setPublicationSubmitting(true);
    setPublishError("");

    try {
      const { product, readiness } = publicationReview;
      if (readiness.blockers.length > 0) return;

      const response = await publishAdminProduct(brandId, product.id, confirmations);
      if (!response.success) throw new Error(response.message);
      const published = response.data;
      if (!published || typeof published !== "object" ||
          !("id" in published) || published.id !== product.id ||
          !("status" in published) || published.status !== "PUBLISHED") {
        throw new Error("CORE no confirmó el estado publicado. Actualiza el listado antes de reintentar.");
      }

      setPublishSuccess(`${product.title}: publicación confirmada por JUNG CORE.`);
      setPublicationReview(null);
      try {
        await reload();
      } catch {
        setPublishError("CORE confirmó la publicación, pero no se pudo actualizar el listado. Pulsa CORE para volver a cargarlo.");
      }
    } catch (error) {
      setPublishError(
        publicationErrorMessage(error),
      );
    } finally {
      setPublicationSubmitting(false);
      publishing.current = false;
      setPublishingProductId(null);
    }
  };

  useEffect(() => {
    setSelectedProduct((current) =>
      current ? (products.find((product) => product.id === current.id) ?? current) : null,
    );
  }, [products]);

  const isReady = isFullCatalogLoaded;

  const filteredProducts = useMemo(
    () => filterAdminProducts(products, filters),
    [products, filters],
  );

  const visibleProductIds = useMemo(
    () => filteredProducts.map((product) => product.id),
    [filteredProducts],
  );

  const allVisibleSelected = useMemo(
    () => areAllVisibleProductsSelected(selectedProductIds, visibleProductIds),
    [selectedProductIds, visibleProductIds],
  );

  const operationalSummary = useMemo(
    () => summarizeProductAdminOperations(filteredProducts),
    [filteredProducts],
  );

  const summary = useMemo(() => {
    const published = products.filter(
      (product) => normalizedStatus(product) === "publicado",
    ).length;

    const preparing = products.filter((product) => normalizedStatus(product) === "borrador").length;

    const outOfStock = products.filter(
      (product) => resolveProductAdminOperationalState(product).inventoryState === "out",
    ).length;

    return {
      total: products.length,
      published,
      preparing,
      outOfStock,
    };
  }, [products]);

  const toggleProductSelection = (product: Product) => {
    setSelectedProductIds((current) => toggleProductAdminSelection(current, product.id));
  };

  const toggleVisibleSelection = () => {
    setSelectedProductIds((current) =>
      toggleVisibleProductAdminSelection(current, visibleProductIds),
    );
  };

  const clearSelection = () => {
    setSelectedProductIds(new Set<string>());
  };

  const toggleColumn = (column: ProductAdminOptionalColumnKey) => {
    setColumns((current) => ({
      ...current,
      [column]: !current[column],
    }));
  };

  const publishSelectedProducts = () => {
    if (!canPublish || !brandId || publishing.current || publicationReview) return;
    if (selectedProductIds.size === 0) return;
    setBulkPublishing(true);
  };
  const prepareCatalog = () => {
    if (selectedProductIds.size === 0) {
      return;
    }

    navigate("/admin/catalogos", {
      state: createCatalogWorkspaceHandoff([...selectedProductIds]),
    });
  };
  return (
    <AdminShell title="Productos">
      <main className="products-admin-page">
        <header className="products-admin-page__hero">
          <div className="products-admin-page__heroCopy">
            <div className="products-admin-page__eyebrow">
              <span>PRODUCT EXPLORER</span>


            </div>

            <div className="products-admin-page__titleRow">
              <h1>Productos</h1>
              <small className="products-admin-page__coreBadge">
                Productos desde JUNG CORE
              </small>
            </div>

            <p>
              Explora y selecciona productos para preparar catálogos y futuras salidas comerciales.
            </p>
          </div>

          {import.meta.env.VITE_ENABLE_PRODUCT_CREATION === "true" ? <CreateProductPanel /> : null}

          <div className="products-admin-page__syncActions" aria-label="Sincronización temporal">
            <button
              className="products-admin-page__syncButton"
              type="button"
              disabled={isRefreshing}
              onClick={async () => {
                if (refreshing.current) return;
                refreshing.current = true;
                setIsRefreshing(true);
                try {
                  await reload();
                  setPublishError("");
                } catch {
                  setPublishError("No se pudo actualizar el listado desde CORE. Inténtalo de nuevo.");
                } finally {
                  refreshing.current = false;
                  setIsRefreshing(false);
                }
              }}
            >
              <RefreshCw size={15} strokeWidth={1.9} aria-hidden="true" />
              {isRefreshing ? "Actualizando…" : "CORE"}
            </button>

          </div>
        </header>



        <section className="products-admin-page__metrics" aria-label="Resumen de productos">
          <article className="products-admin-page__metric is-total">
            <div className="products-admin-page__metricIcon" aria-hidden="true">
              <Boxes size={18} strokeWidth={1.9} />
            </div>

            <div>
              <span>Total</span>

              <strong>{summary.total}</strong>
              <small className="products-admin-page__metricDetail">Productos registrados</small>
            </div>
          </article>

          <article className="products-admin-page__metric">
            <div className="products-admin-page__metricIcon is-positive" aria-hidden="true">
              <PackageCheck size={18} strokeWidth={1.9} />
            </div>

            <div>
              <span>Publicados</span>

              <strong>{summary.published}</strong>
              <small className="products-admin-page__metricDetail">{summary.total > 0 ? Math.round((summary.published / summary.total) * 100) : 0}% del total</small>
            </div>
          </article>

          <article className="products-admin-page__metric">
            <div className="products-admin-page__metricIcon is-warning" aria-hidden="true">
              <PackageOpen size={18} strokeWidth={1.9} />
            </div>

            <div>
              <span>En preparación</span>

              <strong>{summary.preparing}</strong>
              <small className="products-admin-page__metricDetail">{summary.total > 0 ? Math.round((summary.preparing / summary.total) * 100) : 0}% del total</small>
            </div>
          </article>

          <article className="products-admin-page__metric">
            <div className="products-admin-page__metricIcon is-danger" aria-hidden="true">
              <PackageX size={18} strokeWidth={1.9} />
            </div>

            <div>
              <span>Sin stock</span>

              <strong>{summary.outOfStock}</strong>
              <small className="products-admin-page__metricDetail">{summary.total > 0 ? Math.round((summary.outOfStock / summary.total) * 100) : 0}% del total</small>
            </div>
          </article>
        </section>

        <ProductsToolbar
          categories={categories}
          filters={filters}
          campaigns={campaigns}
          resultCount={filteredProducts.length}
          visibleCount={operationalSummary.visible}
          sellableCount={operationalSummary.sellable}
          viewMode={viewMode}
          density={density}
          columns={columns}
          hasActiveFilters={hasActiveProductAdminFilters(filters)}
          onFiltersChange={setFilters}
          onViewModeChange={setViewMode}
          onDensityChange={setDensity}
          onToggleColumn={toggleColumn}
          onClear={() => setFilters(EMPTY_PRODUCT_ADMIN_FILTERS)}
        />

        <div className="products-admin-page__resultsHeader">
          <div>
            <strong>Productos</strong>

            <span>
              {filteredProducts.length} de {products.length}
            </span>
          </div>
        </div>

        <section className="products-admin-page__selectionBar" aria-label="Selección comercial">
          <div className="products-admin-page__selectionSummary">
            <strong>{selectedProductIds.size} seleccionados</strong>

            <span>La selección alimentará Catálogos y futuras salidas comerciales.</span>
          </div>

          <div className="products-admin-page__selectionActions">
            <button
              type="button"
              onClick={toggleVisibleSelection}
              disabled={visibleProductIds.length === 0}
            >
              {allVisibleSelected ? "Deseleccionar visibles" : "Seleccionar visibles"}
            </button>

            <button
              className="is-primary"
              type="button"
              disabled={selectedProductIds.size === 0}
              onClick={prepareCatalog}
            >
              <FileStack size={14} strokeWidth={1.9} aria-hidden="true" />
              Preparar catálogo
            </button>
            <button
              className="is-primary"
              type="button"
              disabled={!canPublish || selectedProductIds.size === 0 ||
                bulkPublishing || !!publishingProductId}
              onClick={() => void publishSelectedProducts()}
            >
              <PackageCheck size={14} strokeWidth={1.9} aria-hidden="true" />
              {bulkPublishing ? "Publicando…" : "Publicar seleccionados"}
            </button>

            <button
              className="is-commercial"
              type="button"
              disabled
              title="Cotizaciones todavía no forman parte del módulo Wooly Admin V2."
            >
              <ReceiptText size={14} strokeWidth={1.9} aria-hidden="true" />
              Cotizar selección
            </button>

            {selectedProductIds.size > 0 ? (
              <button className="is-clear" type="button" onClick={clearSelection}>
                <X size={13} strokeWidth={2} aria-hidden="true" />
                Limpiar
              </button>
            ) : null}
          </div>
        </section>

        {publishSuccess && <p role="status">{publishSuccess}</p>}
        {!publicationReview && publishError && <p role="alert">{publishError}</p>}
        <ProductAdminExplorer
          products={filteredProducts}
          campaigns={campaigns}
          isReady={isReady}
          viewMode={viewMode}
          density={density}
          columns={columns}
          selectedProductIds={selectedProductIds}
          onSelectProduct={setSelectedProduct}
          onPublishProduct={canPublish ? publishProduct : undefined}
          publishingProductId={publishingProductId}
          onToggleProductSelection={toggleProductSelection}
        />

        {publicationReview ? (
          <ProductPublicationDialog
            open
            productName={publicationReview.product.title}
            readiness={publicationReview.readiness}
            submitting={publicationSubmitting}
            error={publishError}
            onClose={closePublicationReview}
            onConfirm={confirmPublication}
          />
        ) : null}
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

        {error ? <p role="alert">{error.message}</p> : null}
        {!isReady ? (
          <p className="products-admin-page__loading" role="status">
            {isLoading
              ? "Cargando productos y campañas oficiales..."
              : "El inventario todavía está consolidando sus categorías."}
          </p>
        ) : null}
      </main>
        <BulkProductPublicationDialog
          open={bulkPublishing}
          brandId={brandId}
          products={products.filter(
            (product) =>
              selectedProductIds.has(product.id) &&
              !["publicado", "published"].includes(normalizedStatus(product))
          )}
          onClose={() => setBulkPublishing(false)}
          onPublished={async (ids) => {
            const done = new Set(ids);
            setSelectedProductIds((current) =>
              new Set([...current].filter((id) => !done.has(id)))
            );
            await reload();
          }}
        />
    </AdminShell>
  );
}
