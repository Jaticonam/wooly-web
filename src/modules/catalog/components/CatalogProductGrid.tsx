import type {
  CartItem,
} from "@/modules/cart/types";

import {
  ProductCard,
} from "@/modules/catalog/components/ProductCard";

import type {
  Product,
} from "@/shared/types/product";

interface CatalogProductGridProps {
  products:
    readonly Product[];
  cart:
    CartItem[];
  imagePriorityIds?:
    ReadonlySet<string>;
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

export function CatalogProductGrid({
  products,
  cart,
  imagePriorityIds,
  onAddToCart,
  onImageClick,
}: CatalogProductGridProps) {
  return (
    <div
      data-catalog-product-grid
      className="grid min-w-0 grid-cols-2 gap-x-1.5 gap-y-2 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
    >
      {products.map(
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
              imagePriority={
                imagePriorityIds
                  ?.has(
                    product.id,
                  ) ??
                false
              }
              onAddToCart={
                onAddToCart
              }
              onImageClick={
                onImageClick
              }
            />
          </div>
        ),
      )}
    </div>
  );
}
