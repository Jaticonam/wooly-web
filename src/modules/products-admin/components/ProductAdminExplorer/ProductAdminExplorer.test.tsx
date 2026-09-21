import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";
import ProductAdminExplorer from "./ProductAdminExplorer";

const product: Product = {
  id: "CT-553",
  title: "Ramo Minirosas Premium",
  description: "Ramo decorativo.",
  category: "flores",
  price_1: 5.5,
  stock: 24,
  img: "",
  status: "publicado",
};

describe("ProductAdminExplorer", () => {
  it.each(["grid", "list"] as const)(
    "selecciona el producto desde la vista %s",
    (viewMode) => {
      const onSelectProduct = vi.fn();
      render(
        <ProductAdminExplorer
          products={[product]}
          campaigns={[]}
          viewMode={viewMode}
          isReady
          onSelectProduct={onSelectProduct}
        />,
      );

      fireEvent.click(screen.getByRole("button", {
        name: `Ver detalle de ${product.title}`,
      }));
      expect(onSelectProduct).toHaveBeenCalledWith(product);
    },
  );
});
