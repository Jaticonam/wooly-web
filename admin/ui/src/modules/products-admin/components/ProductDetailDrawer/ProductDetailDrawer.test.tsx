import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ProductDetailDrawer from "./ProductDetailDrawer";
import type { Campaign, Product } from "@wooly/contracts/types/product";

const product: Product = {
  id: "technical-uuid", code: "CT-553", barcode: "00123", sunatCode: "10101501",
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
  gallery: "https://example.com/gallery.jpg|https://example.com/gallery-03.jpg",
  status: "publicado",
  campaigns: ["novio"],
  badges: ["Novedad"],
};

const campaigns: Campaign[] = [{
  id: "novio", name: "Día del Novio", icon: "heart",
  themeToken: "rose", colorClass: "rose",
  startDate: "2026-09-01", endDate: "2026-09-30",
  priority: 1, publicationStatus: "publicado",
  computedStatus: "activa",
}];

const renderDrawer = (item: Product = product) => render(
  <ProductDetailDrawer product={item} campaigns={campaigns} open onOpenChange={vi.fn()} />,
);

describe("ProductDetailDrawer", () => {
  it("conserva precios de BD de 1 a 100 unidades, sin inventar escalas", () => {
    renderDrawer();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: product.title })).toBeInTheDocument();
    expect(screen.getByText("Disponible · 24")).toBeInTheDocument();
    expect(screen.getByText("Desde 1 un.")).toBeInTheDocument();
    expect(screen.getByText("Desde 3 un.")).toBeInTheDocument();
    expect(screen.getByText("Desde 12 un.")).toBeInTheDocument();
    expect(screen.getByText("Desde 100 un.")).toBeInTheDocument();
    expect(screen.queryByText("Desde 50 un.")).not.toBeInTheDocument();
    expect(screen.getByText("Día del Novio")).toBeInTheDocument();
    expect(screen.getByText(product.description)).toBeInTheDocument();
    expect(screen.getByText("Galería registrada.")).toBeInTheDocument();
    expect(screen.getByText("Sin observaciones comerciales.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/por volumen/i)).not.toBeInTheDocument();
    expect(screen.getByText("S/ 4.10")).toBeInTheDocument();
  });

  it("presenta oferta por separado, sin reemplazar ni tachar precios de la BD", () => {
    const { container } = renderDrawer({ ...product, price_offer: 4.5 });
    expect(screen.getByText("Precio oferta")).toBeInTheDocument();
    expect(screen.getByText("S/ 4.50")).toBeInTheDocument();
    const rows = [...container.querySelectorAll(".product-detail-drawer__priceRow")];
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.textContent?.replace(/\s/g, " "))).toEqual([
      "Desde 1 un.S/ 5.50", "Desde 3 un.S/ 5.00",
      "Desde 12 un.S/ 4.70", "Desde 100 un.S/ 4.10",
    ]);
    expect(container.querySelector("del")).toBeNull();
  });

  it("muestra galería real, permite miniaturas y navegación", () => {
    renderDrawer();
    expect(screen.getByRole("button", { name: "Ver imagen principal" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Ver imagen 3" }));
    expect(screen.getByRole("img", { name: product.title })).toHaveAttribute("src", "https://example.com/gallery-03.jpg");
    fireEvent.click(screen.getByRole("button", { name: "Imagen anterior" }));
    expect(screen.getByRole("img", { name: product.title })).toHaveAttribute("src", "https://example.com/gallery.jpg");
  });

  it("solicita el cierre desde el botón de Sheet", () => {
    const onOpenChange = vi.fn();
    render(<ProductDetailDrawer product={product} campaigns={campaigns} open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("identifica imagen rota y conserva los datos comerciales", () => {
    renderDrawer();
    fireEvent.error(screen.getByRole("img", { name: product.title }));
    expect(screen.getByText("La imagen principal no está disponible.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: `Imagen no disponible para ${product.title}` })).toBeInTheDocument();
  });

  it("no inventa miniaturas, oferta ni precios no registrados", () => {
    renderDrawer({ ...product, gallery: "", price_offer: null, price_3: null, price_12: 0, price_100: null });
    expect(screen.queryByRole("button", { name: "Ver imagen principal" })).not.toBeInTheDocument();
    expect(screen.queryByText("Precio oferta")).not.toBeInTheDocument();
    expect(screen.queryByText("Desde 3 un.")).not.toBeInTheDocument();
    expect(screen.queryByText("Desde 12 un.")).not.toBeInTheDocument();
    expect(screen.queryByText("Desde 100 un.")).not.toBeInTheDocument();
  });
});
