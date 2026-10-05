import type {
  Product,
} from "@/shared/types/product";

import type {
  CartItem,
} from "@/modules/cart/types";

import {
  CatalogProductGrid,
} from "@/modules/catalog/components/CatalogProductGrid";

interface CategoryGridProps {
  products:
    Product[];
  cart:
    CartItem[];
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

export function CategoryGrid({
  products,
  cart,
  onAddToCart,
  onImageClick,
}: CategoryGridProps) {
  return (
    <CatalogProductGrid
      products={
        products
      }
      cart={
        cart
      }
      onAddToCart={
        onAddToCart
      }
      onImageClick={
        onImageClick
      }
    />
  );
}
