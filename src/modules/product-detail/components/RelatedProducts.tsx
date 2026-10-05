import type {
  Product,
} from "@/shared/types/product";

import type {
  CartItem,
} from "@/modules/cart/types";

import {
  ProductCard,
} from "@/modules/catalog/components/ProductCard";

interface RelatedProductsProps {
  products:
    Product[];
  cart?:
    CartItem[];
  currentProductId?:
    string;
  onAddToCart:
    (
      product:
        Product,
    ) => void;
  onImageClick:
    (
      product:
        Product,
    ) => void;
}

export function RelatedProducts({
  products,
  cart = [],
  currentProductId,
  onAddToCart,
  onImageClick,
}: RelatedProductsProps) {
  const visibleProducts =
    currentProductId
      ? products.filter(
          (product) =>
            product.id !==
            currentProductId,
        )
      : products;

  if (
    !visibleProducts.length
  ) {
    return null;
  }

  return (
    <section
      className="mt-8 min-w-0 border-t border-slate-200/80 pt-5 md:mt-10 md:pt-6"
      aria-labelledby="related-products-title"
    >
      <div className="mb-2.5 flex min-w-0 items-center justify-between gap-3 md:mb-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#1d8299] sm:text-[10px]">
            Sigue explorando
          </p>

          <h3
            id="related-products-title"
            className="mt-0.5 min-w-0 text-[14px] font-black tracking-[-0.015em] text-foreground sm:text-[15px] md:text-[17px]"
          >
            También te puede interesar
          </h3>
        </div>

        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-500 md:text-[10px]">
          {visibleProducts.length}{" "}
          {visibleProducts.length ===
          1
            ? "producto"
            : "productos"}
        </span>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-x-1.5 gap-y-2 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {visibleProducts.map(
          (
            product,
          ) => (
            <div
              key={
                product.id
              }
              className="min-w-0"
            >
              <ProductCard
                product={
                  product
                }
                cart={
                  cart
                }
                onAddToCart={
                  onAddToCart
                }
                onImageClick={() =>
                  onImageClick(
                    product,
                  )
                }
              />
            </div>
          ),
        )}
      </div>
    </section>
  );
}
