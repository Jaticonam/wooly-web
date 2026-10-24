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
  Campaign,
  Product,
} from "@wooly/contracts/types/product";
import ProductAdminCard from "./ProductAdminCard";

const product: Product = {
  id: "technical-uuid", code: "CT-554",
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

    expect(screen.getByText("CT-554")).toBeInTheDocument();
    expect(screen.queryByText("technical-uuid")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ramo premium" }))
      .toBeInTheDocument();
    expect(screen.getByText("Mayor (3u)")).toBeInTheDocument();
    expect(screen.getByText("Docena (12u)")).toBeInTheDocument();
    expect(screen.queryByText(/por volumen/i)).not.toBeInTheDocument();
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

it.each([null, 0, -1, NaN, Infinity, 10, 12])("rejects invalid or non-discount offer %s", (price_offer) => {
  render(<ProductAdminCard product={{...product, price_offer}} campaignsById={campaigns} onSelect={() => undefined} />);
  expect(screen.queryByText("Oferta")).not.toBeInTheDocument();
  expect(screen.getByText("Precio unitario")).toBeInTheDocument();
});
it("shows a valid offer, original price and both wholesale tiers", () => {
  const {container}=render(<ProductAdminCard product={{...product, price_offer: 6}} campaignsById={campaigns} onSelect={() => undefined} />);
  expect(screen.getByText("Oferta")).toBeInTheDocument();
  expect(container.querySelector('del')).toHaveTextContent(/10\.00/);
  expect(screen.getByText(/6\.00/)).toBeInTheDocument();
  expect(screen.getByText("Mayor (3u)")).toBeInTheDocument();
  expect(screen.getByText("Docena (12u)")).toBeInTheDocument();
});
it("handles blank images and recovers when the image changes", () => {
  const props={campaignsById: campaigns, onSelect: () => undefined};
  const {rerender}=render(<ProductAdminCard {...props} product={{...product,img:" "}} />);
  expect(screen.getByRole("img",{name:"Imagen no disponible para Ramo premium"})).toBeInTheDocument();
  rerender(<ProductAdminCard {...props} product={product} />);
  fireEvent.error(screen.getByRole("img",{name:product.title}));
  rerender(<ProductAdminCard {...props} product={{...product,img:"/replacement.jpg"}} />);
  expect(screen.getByRole("img",{name:product.title})).toHaveAttribute("src","/replacement.jpg");
});
it.each(["publicado", " Publicado "])("does not offer publication for %s", (status) => {
  render(<ProductAdminCard product={{...product,status}} campaignsById={campaigns} onSelect={vi.fn()} onPublish={vi.fn()} />);
  expect(screen.getByText("Publicado")).toBeInTheDocument();
  expect(screen.queryByRole("button",{name:/Publicar/})).not.toBeInTheDocument();
});
it("keeps detail and multiselection independent and requires an authorized callback", () => {
  const select=vi.fn(), toggle=vi.fn();
  render(<ProductAdminCard product={{...product,status:"borrador"}} campaignsById={campaigns} onSelect={select} onToggleSelection={toggle} isSelected />);
  expect(screen.queryByRole("button",{name:/Publicar/})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/Quitar/}));
  expect(toggle).toHaveBeenCalledTimes(1);
  expect(select).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"Ver detalle"}));
  expect(select).toHaveBeenCalledTimes(1);
});
it.each([["agotado",0,"Agotado"],["publicado",0,"Stock inconsistente"],["publicado",3,"Stock bajo · 3"]] as const)("preserves stock policy for %s/%s", (status,stock,label) => {
  const {container}=render(<ProductAdminCard product={{...product,status,stock}} campaignsById={campaigns} onSelect={() => undefined} />);
  expect(container.querySelector('.product-admin-card__stock')).toHaveTextContent(label);
});

it("omits missing price tiers rather than inventing volume prices", () => {
  render(<ProductAdminCard product={{...product,price_3:0,price_12:0}} campaignsById={campaigns} onSelect={() => undefined} />);
  expect(screen.queryByText("Mayor (3u)")).not.toBeInTheDocument();
  expect(screen.queryByText("Docena (12u)")).not.toBeInTheDocument();
  expect(screen.queryByText(/por volumen/i)).not.toBeInTheDocument();
});

it("places the inventory chip alongside code and category", () => {
  const { container } = render(
    <ProductAdminCard product={product} campaignsById={campaigns} onSelect={() => undefined} />,
  );
  const identity = container.querySelector(".product-admin-card__identity");
  expect(identity).toContainElement(screen.getByText("CT-554"));
  expect(identity).toContainElement(screen.getByText("flores"));
  expect(identity).toContainElement(screen.getByText("Disponible · 20"));
  expect(container.querySelector(".product-admin-card__pricing .product-admin-card__stock")).toBeNull();
});
