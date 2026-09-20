import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";

import {
  toWoolyCommercialComposition,
} from "./WoolyCommercialCompositionAdapter";

const products: Product[] = [
  {
    id: "FLOR-001",
    title: "Rosa preservada",
    description: "Rosa para arreglos",
    category: "flores",
    price_1: 12,
    price_3: 10,
    stock: 8,
    img: "https://media.example/FLOR-001_01.jpg",
    gallery: "https://media.example/FLOR-001_02.jpg|https://media.example/FLOR-001_03.jpg",
    status: "publicado",
    campaigns: ["dia-madre"],
  },
  {
    id: "PELU-001",
    title: "Oso clásico",
    description: "Peluche clásico",
    category: "peluches",
    price_1: 25,
    price_offer: 20,
    stock: 0,
    img: "/products/PELU-001.jpg",
    status: "agotado",
  },
];

describe("WoolyCommercialCompositionAdapter", () => {
  it("proyecta Wooly al contrato neutral sin perder orden ni precios B2B", () => {
    const composition = toWoolyCommercialComposition(products, {
      compositionId: "wooly-catalog-2026-09",
      version: 1,
      title: "Catálogo septiembre",
      createdAt: "2026-09-20T15:00:00.000Z",
      productUrl: (product) => `/catalogo/producto/${product.id}`,
    });

    expect(composition.contractVersion).toBe("commercial-composition.v1");
    expect(composition.appId).toBe("wooly");
    expect(composition.items.map((item) => item.productId)).toEqual([
      "FLOR-001",
      "PELU-001",
    ]);
    expect(composition.sections).toEqual([
      {
        sectionId: "flores",
        title: "flores",
        description: null,
        itemIds: ["FLOR-001"],
      },
      {
        sectionId: "peluches",
        title: "peluches",
        description: null,
        itemIds: ["PELU-001"],
      },
    ]);
    expect(composition.items[0]).toMatchObject({
      price: 12,
      currency: "PEN",
      availability: "in_stock",
      attributes: {
        price_3: 10,
        campaignIds: ["dia-madre"],
      },
      media: {
        primaryImage: "https://media.example/FLOR-001_01.jpg",
        gallery: [
          "https://media.example/FLOR-001_02.jpg",
          "https://media.example/FLOR-001_03.jpg",
        ],
      },
    });
    expect(composition.items[1]).toMatchObject({
      price: 20,
      availability: "out_of_stock",
    });
  });
});
