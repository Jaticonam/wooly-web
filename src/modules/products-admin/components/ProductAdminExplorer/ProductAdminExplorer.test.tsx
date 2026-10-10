import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Product } from "@/shared/types/product";
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
  it.each(["grid", "list"] as const)("selecciona el producto desde la vista %s", (viewMode) => {
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

    fireEvent.click(
      screen.getByRole("button", {
        name: viewMode === "grid" ? `Ver detalle de ${product.title}` : `Abrir ${product.title}`,
      }),
    );
    expect(onSelectProduct).toHaveBeenCalledWith(product);
  });
});

it("keeps row opening explicit, selection independent and commercial columns ordered", () => {
  const select = vi.fn(),
    toggle = vi.fn();
  const { container } = render(
    <ProductAdminExplorer
      products={[product]}
      campaigns={[]}
      viewMode="list"
      isReady
      onSelectProduct={select}
      onToggleProductSelection={toggle}
    />,
  );
  expect(
    Array.from(container.querySelectorAll("section > header span")).map((x) => x.textContent),
  ).toEqual(["", "Producto", "Categoría", "Estado", "Precio", "Stock", "Acciones"]);
  expect(container.querySelector(".product-admin-row__open")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Seleccionar " + product.title }));
  expect(toggle).toHaveBeenCalledWith(product);
  expect(select).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText(product.title));
  expect(select).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Abrir " + product.title }));
  expect(select).toHaveBeenCalledWith(product);
});
it("orders optional table columns and always exposes Abrir under Acciones", () => {
  const select = vi.fn();
  const props = {
    products: [product],
    campaigns: [],
    viewMode: "table" as const,
    isReady: true,
    onSelectProduct: select,
  };
  const { rerender } = render(<ProductAdminExplorer {...props} />);
  expect(screen.getAllByRole("columnheader").map((x) => x.textContent)).toEqual([
    "",
    "Código",
    "Producto",
    "Imagen",
    "Categoría",
    "Estado",
    "Precio",
    "Stock",
    "Prioridad",
    "Acciones",
  ]);
  expect(screen.queryByText("Ficha")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Abrir " + product.title }));
  expect(select).toHaveBeenCalledWith(product);
  rerender(
    <ProductAdminExplorer
      {...props}
      columns={{
        image: false,
        category: false,
        status: false,
        price: false,
        stock: false,
        priority: false,
      }}
    />,
  );
  expect(screen.getAllByRole("columnheader").map((x) => x.textContent)).toEqual([
    "",
    "Código",
    "Producto",
    "Acciones",
  ]);
  expect(screen.getByText("Abrir")).toBeInTheDocument();
});
