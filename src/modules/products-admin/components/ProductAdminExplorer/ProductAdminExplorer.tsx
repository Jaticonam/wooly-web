import type {
  ProductAdminColumnVisibility,
  ProductAdminDensity,
} from "@/modules/products-admin/domain/ProductAdminDisplay";

import type { ProductAdminViewMode } from "@/modules/products-admin/domain/ProductAdminViewMode";

import type { Campaign, Product } from "@/shared/types/product";

import ProductAdminCard from "@/modules/products-admin/components/ProductAdminCard/ProductAdminCard";
import ProductAdminRow from "@/modules/products-admin/components/ProductAdminRow/ProductAdminRow";
import ProductAdminTable from "@/modules/products-admin/components/ProductAdminTable/ProductAdminTable";

import "./ProductAdminExplorer.css";

const EMPTY_SELECTED_PRODUCT_IDS: ReadonlySet<string> = new Set<string>();

interface ProductAdminExplorerProps {
  products: readonly Product[];
  campaigns: readonly Campaign[];
  viewMode: ProductAdminViewMode;
  density?: ProductAdminDensity;
  columns?: ProductAdminColumnVisibility;
  isReady: boolean;
  onSelectProduct: (product: Product) => void;
  onPublishProduct?: ((product: Product) => void) | undefined;
  publishingProductId?: string | null | undefined;
  selectedProductIds?: ReadonlySet<string>;
  onToggleProductSelection?: ((product: Product) => void) | undefined;
}

const DEFAULT_COLUMNS: ProductAdminColumnVisibility = {
  image: true,
  status: true,
  price: true,
  stock: true,
  category: true,
  priority: true,
};

export default function ProductAdminExplorer({
  products,
  campaigns,
  viewMode,
  density = "comfortable",
  columns = DEFAULT_COLUMNS,
  isReady,
  onSelectProduct,
  onPublishProduct,
  publishingProductId,
  selectedProductIds = EMPTY_SELECTED_PRODUCT_IDS,
  onToggleProductSelection,
}: ProductAdminExplorerProps) {
  const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

  if (!isReady) {
    return <div className="product-admin-explorer__empty">Cargando productos…</div>;
  }

  if (products.length === 0) {
    return (
      <div className="product-admin-explorer__empty">
        No hay productos para los filtros seleccionados.
      </div>
    );
  }

  if (viewMode === "table") {
    return (
      <ProductAdminTable
        products={products}
        selectedProductIds={selectedProductIds}
        columns={columns}
        density={density}
        onSelectProduct={onSelectProduct}
        onPublishProduct={onPublishProduct}
        publishingProductId={publishingProductId}
        onToggleProductSelection={onToggleProductSelection ?? (() => undefined)}
      />
    );
  }

  if (viewMode === "grid") {
    return (
      <section
        className={`product-admin-explorer__grid is-${density}`}
        aria-label="Cuadrícula de productos"
      >
        {products.map((product) => (
          <ProductAdminCard
            key={product.id}
            product={product}
            campaignsById={campaignsById}
            isSelected={selectedProductIds.has(product.id)}
            onSelect={() => onSelectProduct(product)}
            onToggleSelection={
              onToggleProductSelection ? () => onToggleProductSelection(product) : undefined
            }
          />
        ))}
      </section>
    );
  }

  return (
    <section
      className={`product-admin-explorer__list is-${density}`}
      aria-label="Lista de productos"
    >
      <header>
        <span aria-hidden="true" />
        <span>Producto</span>
        <span>Categoría</span>
        <span>Estado</span>
        <span>Precio</span>
        <span>Stock</span>
        <span>Acciones</span>
      </header>

      {products.map((product) => (
        <ProductAdminRow
          key={product.id}
          product={product}
          isSelected={selectedProductIds.has(product.id)}
          onSelect={() => onSelectProduct(product)}
          onPublish={onPublishProduct ? () => onPublishProduct(product) : undefined}
          publishing={publishingProductId === product.id}
          publishDisabled={!!publishingProductId}
          onToggleSelection={
            onToggleProductSelection ? () => onToggleProductSelection(product) : undefined
          }
        />
      ))}
    </section>
  );
}
