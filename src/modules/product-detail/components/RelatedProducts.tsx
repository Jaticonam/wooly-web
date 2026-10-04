import type { Product } from "@/shared/types/product";
import type { CartItem } from "@/modules/cart/types";
import { ProductCard } from "@/modules/catalog/components/ProductCard";

interface RelatedProductsProps {
  products: Product[];
  cart?: CartItem[];
  onAddToCart: (product: Product) => void;
  onImageClick: (product: Product) => void;
}

export function RelatedProducts({
  products,
  cart = [],
  onAddToCart,
  onImageClick,
}: RelatedProductsProps) {
  if (!products.length) return null;

  return (
    <section
      className="mt-10 min-w-0 md:mt-14"
      aria-labelledby="related-products-title"
    >
      <div className="mb-2.5 flex min-w-0 items-end justify-between gap-3 md:mb-3">
        <h3
          id="related-products-title"
          className="min-w-0 text-[14px] font-black tracking-[-0.015em] text-foreground sm:text-[15px] md:text-[17px]"
        >
          Productos que complementan tu compra
        </h3>

        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-500 md:text-[10px]">
          {products.length}{" "}
          {products.length === 1
            ? "producto"
            : "productos"}
        </span>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-x-1.5 gap-y-2 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-0"
          >
            <ProductCard
              product={product}
              cart={cart}
              onAddToCart={onAddToCart}
              onImageClick={() =>
                onImageClick(
                  product,
                )
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
