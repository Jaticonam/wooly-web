import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";

import {
  EMPTY_PRODUCT_ADMIN_FILTERS,
  filterAdminProducts,
} from "./ProductAdminFilters";

const products: Product[] = [
  {
    id: "FL-001",
    title: "Ramo corazón",
    description: "Flores rojas",
    category: "flores",
    price_1: 10,
    stock: 12,
    img: "/flor.jpg",
    status: "PUBLICADO",
    campaigns: ["san-valentin"],
  },
  {
    id: "CJ-002",
    title: "Caja premium",
    description: "Caja rígida",
    category: "cajas",
    price_1: 5,
    stock: 3,
    img: "/caja.jpg",
    status: "publicado",
    campaigns: ["dia-novia"],
  },
  {
    id: "PL-003",
    title: "Peluche oso",
    description: "Preventa",
    category: "peluches",
    price_1: 20,
    stock: 0,
    img: "/oso.jpg",
    status: "preventa",
  },
];

describe("ProductAdminFilters", () => {
  it("busca sin depender de tildes ni mayúsculas", () => {
    expect(filterAdminProducts(products, {
      ...EMPTY_PRODUCT_ADMIN_FILTERS,
      search: "CORAZON",
    }).map((product) => product.id)).toEqual(["FL-001"]);
  });

  it("combina categoría, campaña, stock y estado", () => {
    expect(filterAdminProducts(products, {
      search: "",
      categoryId: "cajas",
      campaignId: "dia-novia",
      stock: "low",
      status: "publicado",
    }).map((product) => product.id)).toEqual(["CJ-002"]);
  });

  it("consume el estado normalizado por la política comercial", () => {
    expect(filterAdminProducts(products, {
      ...EMPTY_PRODUCT_ADMIN_FILTERS,
      status: "publicado",
    }).map((product) => product.id)).toEqual(["FL-001", "CJ-002"]);
  });
});
