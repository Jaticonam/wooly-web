import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
} from "vitest";
import type {
  Campaign,
  Product,
} from "@/shared/types/product";
import ProductAdminCard from "./ProductAdminCard";

const product: Product = {
  id: "FL-001",
  title: "Ramo premium",
  description: "Producto",
  category: "flores",
  price_1: 10,
  price_3: 9,
  price_12: 8,
  price_50: 7,
  stock: 20,
  img: "/ramo.jpg",
  status: "publicado",
  campaigns: ["c1", "c2", "c3"],
};

const campaigns = new Map<string, Campaign>([
  ["c1", { id: "c1", name: "Campaña uno" } as Campaign],
  ["c2", { id: "c2", name: "Campaña dos" } as Campaign],
  ["c3", { id: "c3", name: "Campaña tres" } as Campaign],
]);

describe("ProductAdminCard", () => {
  it("prioriza producto, precio y stock sin desplegar todas las escalas", () => {
    render(
      <ProductAdminCard
        product={product}
        campaignsById={campaigns}
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByRole("heading", { name: "Ramo premium" }))
      .toBeInTheDocument();
    expect(screen.getByText(/Desde.*7\.00.*por volumen/))
      .toBeInTheDocument();
    expect(screen.getByText("Disponible · 20"))
      .toBeInTheDocument();
    expect(screen.getByText("+1"))
      .toBeInTheDocument();
  });

  it("muestra fallback si la imagen falla", () => {
    render(
      <ProductAdminCard
        product={product}
        campaignsById={campaigns}
        onSelect={() => undefined}
      />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Ramo premium" }));
    expect(screen.getByRole("img", {
      name: "Imagen no disponible para Ramo premium",
    })).toBeInTheDocument();
  });
});
