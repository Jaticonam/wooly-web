import type {
  ProductAdminViewMode,
} from "@/modules/products-admin/domain/ProductAdminViewMode";
import type {
  Campaign,
  Product,
} from "@/shared/types/product";
import ProductAdminCard from "@/modules/products-admin/components/ProductAdminCard/ProductAdminCard";
import ProductAdminRow from "@/modules/products-admin/components/ProductAdminRow/ProductAdminRow";

import "./ProductAdminExplorer.css";

interface ProductAdminExplorerProps {
  products: readonly Product[];
  campaigns: readonly Campaign[];
  viewMode: ProductAdminViewMode;
  isReady: boolean;
  onSelectProduct: (product: Product) => void;
}

export default function ProductAdminExplorer({
  products,
  campaigns,
  viewMode,
  isReady,
  onSelectProduct,
}: ProductAdminExplorerProps) {
  const campaignsById = new Map(
    campaigns.map((campaign) => [campaign.id, campaign]),
  );

  if (!isReady) {
    return <div className="product-admin-explorer__empty">Cargando productos…</div>;
  }

  if (products.length === 0) {
    return <div className="product-admin-explorer__empty">No hay productos para los filtros seleccionados.</div>;
  }

  return viewMode === "grid" ? (
    <section className="product-admin-explorer__grid" aria-label="Cuadrícula de productos">
      {products.map((product) => (
        <ProductAdminCard
          key={product.id}
          product={product}
          campaignsById={campaignsById}
          onSelect={() => onSelectProduct(product)}
        />
      ))}
    </section>
  ) : (
    <section className="product-admin-explorer__list" aria-label="Lista de productos">
      <header>
        <span>Producto</span>
        <span>Precio</span>
        <span>Stock</span>
        <span>Categoría</span>
        <span>Estado</span>
      </header>
      {products.map((product) => (
        <ProductAdminRow
          key={product.id}
          product={product}
          onSelect={() => onSelectProduct(product)}
        />
      ))}
    </section>
  );
}
