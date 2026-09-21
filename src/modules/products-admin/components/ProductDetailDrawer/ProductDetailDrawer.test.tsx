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

import ProductDetailDrawer from "./ProductDetailDrawer";
import type {
  Campaign,
  Product,
} from "@/shared/types/product";

const product: Product = {
  id: "CT-553",
  title: "Ramo Minirosas Premium",
  description: "Ramo decorativo de seis tallos.",
  category: "flores",
  price_1: 5.5,
  price_3: 5,
  price_12: 4.7,
  price_50: null,
  price_100: 4.1,
  stock: 24,
  img: "https://example.com/product.jpg",
  gallery: "https://example.com/gallery.jpg",
  status: "publicado",
  campaigns: ["novio"],
  badges: ["Novedad"],
};

const campaigns: Campaign[] = [{
  id: "novio",
  name: "Día del Novio",
  icon: "heart",
  themeToken: "rose",
  colorClass: "rose",
  startDate: "2026-09-01",
  endDate: "2026-09-30",
  priority: 1,
  publicationStatus: "publicado",
  computedStatus: "activa",
}];

describe("ProductDetailDrawer", () => {
  it("muestra el detalle comercial completo sin una acción de edición", () => {
    render(
      <ProductDetailDrawer
        product={product}
        campaigns={campaigns}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: product.title })).toBeInTheDocument();
    expect(screen.getByText("Disponible · 24")).toBeInTheDocument();
    expect(screen.getByText("Desde 100 un.")).toBeInTheDocument();
    expect(screen.getByText("S/ 4.10")).toBeInTheDocument();
    expect(screen.queryByText("Desde 50 un.")).not.toBeInTheDocument();
    expect(screen.getByText("Día del Novio")).toBeInTheDocument();
    expect(screen.getByText(product.description)).toBeInTheDocument();
    expect(screen.getByText("Galería registrada.")).toBeInTheDocument();
    expect(screen.getByText("Sin observaciones comerciales.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
  });

  it("solicita el cierre desde el control accesible del drawer", () => {
    const onOpenChange = vi.fn();
    render(
      <ProductDetailDrawer
        product={product}
        campaigns={campaigns}
        open
        onOpenChange={onOpenChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("distingue una imagen rota de una URL registrada", () => {
    render(
      <ProductDetailDrawer
        product={product}
        campaigns={campaigns}
        open
        onOpenChange={vi.fn()}
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: product.title }));

    expect(screen.getByText("La imagen principal no está disponible."))
      .toBeInTheDocument();
    expect(screen.getByText("Imagen no disponible")).toBeInTheDocument();
  });
});
