import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "../../types/product";

import {
  normalizeProductSheetStatus,
  resolveProductCommercialPolicy,
} from "./ProductCommercialPolicy";

import {
  resolveProductCommercialState,
} from "../../domain/commercialPolicy";

function createProduct(
  overrides: Partial<Product> = {},
): Product {
  return {
    id: "FLOR-001",
    title: "Rosa premium",
    description:
      "Producto de prueba para política comercial.",
    category: "flores",
    price_1: 10,
    stock: 20,
    img: "https://example.com/product.jpg",
    status: "publicado",
    campaigns: [],
    priority: 0,
    ...overrides,
  };
}

describe(
  "ProductCommercialPolicy",
  () => {
    it(
      "normaliza espacios y mayúsculas sin aceptar alias",
      () => {
        expect(
          normalizeProductSheetStatus(
            " Publicado ",
          ),
        ).toBe("publicado");

        expect(
          normalizeProductSheetStatus(
            "published",
          ),
        ).toBe("invalid");

        expect(
          normalizeProductSheetStatus(""),
        ).toBe("invalid");
      },
    );

    it(
      "permite comprar solamente un producto publicado con precio y stock",
      () => {
        const policy =
          resolveProductCommercialPolicy(
            createProduct(),
          );

        expect(
          policy.isPubliclyVisible,
        ).toBe(true);

        expect(
          policy.isPurchasable,
        ).toBe(true);

        expect(
          policy.canShowInventoryQuantity,
        ).toBe(true);

        expect(
          policy.canExportToTransactionalChannel,
        ).toBe(true);
      },
    );

    it(
      "muestra preventa únicamente para consulta",
      () => {
        const policy =
          resolveProductCommercialPolicy(
            createProduct({
              status: "preventa",
              price_1: 0,
              stock: null,
            }),
          );

        expect(
          policy.isPubliclyVisible,
        ).toBe(true);

        expect(
          policy.hasValidPublicationData,
        ).toBe(true);

        expect(
          policy.isConsultOnly,
        ).toBe(true);

        expect(
          policy.isPurchasable,
        ).toBe(false);

        expect(
          policy.canShowPricing,
        ).toBe(false);

        expect(
          policy.canShowInventoryQuantity,
        ).toBe(false);
      },
    );

    it(
      "bloquea una preventa sin descripción",
      () => {
        const policy =
          resolveProductCommercialPolicy(
            createProduct({
              status: "preventa",
              description: "",
              price_1: 0,
              stock: null,
            }),
          );

        expect(
          policy.hasValidPublicationData,
        ).toBe(false);

        expect(
          policy.issues,
        ).toContain("missing-description");
      },
    );

    it.each([
      0,
      25,
      null,
      undefined,
    ])(
      "considera agotado sin importar el stock %s",
      (stock) => {
        const policy =
          resolveProductCommercialPolicy(
            createProduct({
              status: "agotado",
              stock,
            }),
          );

        expect(
          policy.isPubliclyVisible,
        ).toBe(true);

        expect(
          policy.hasValidPublicationData,
        ).toBe(true);

        expect(
          policy.isConsultOnly,
        ).toBe(true);

        expect(
          policy.isPurchasable,
        ).toBe(false);

        expect(
          policy.canShowInventoryQuantity,
        ).toBe(false);

        expect(
          policy.issues,
        ).not.toContain(
          "stock-status-mismatch",
        );

        expect(
          policy.issues,
        ).not.toContain(
          "invalid-stock",
        );
      },
    );

    it(
      "bloquea publicado con stock cero",
      () => {
        const policy =
          resolveProductCommercialPolicy(
            createProduct({
              status: "publicado",
              stock: 0,
            }),
          );

        expect(
          policy.isPurchasable,
        ).toBe(false);

        expect(
          policy.hasValidPublicationData,
        ).toBe(false);

        expect(
          policy.issues,
        ).toContain(
          "stock-status-mismatch",
        );
      },
    );

    it.each([
      "borrador",
      "oculto",
      "",
      "pendiente",
    ])(
      "no publica el estado %s",
      (status) => {
        const policy =
          resolveProductCommercialPolicy(
            createProduct({
              status,
            }),
          );

        expect(
          policy.isPubliclyVisible,
        ).toBe(false);

        expect(
          policy.isPurchasable,
        ).toBe(false);
      },
    );

    it.each([
      ["publicado válido", {}],
      ["publicado stock 0", { stock: 0 }],
      ["publicado stock negativo", { stock: -1 }],
      ["publicado stock null", { stock: null }],
      [
        "publicado stock NaN",
        { stock: Number.NaN },
      ],
      [
        "publicado stock Infinity",
        {
          stock:
            Number.POSITIVE_INFINITY,
        },
      ],
      [
        "publicado sin precio",
        { price_1: 0 },
      ],
      [
        "publicado con oferta válida",
        { price_offer: 8 },
      ],
      [
        "publicado con oferta inválida",
        { price_offer: 12 },
      ],
      [
        "preventa sin precio",
        {
          status: "preventa",
          price_1: 0,
        },
      ],
      [
        "preventa con stock null",
        {
          status: "preventa",
          stock: null,
        },
      ],
      [
        "agotado con precio",
        { status: "agotado" },
      ],
      [
        "agotado con stock positivo",
        {
          status: "agotado",
          stock: 25,
        },
      ],
      [
        "agotado sin precio",
        {
          status: "agotado",
          price_1: 0,
        },
      ],
      ["oculto", { status: "oculto" }],
      [
        "borrador",
        { status: "borrador" },
      ],
      [
        "estado ausente",
        { status: undefined },
      ],
      [
        "estado desconocido",
        { status: "pendiente" },
      ],
    ])(
      "mantiene paridad canónica para %s",
      (_label, overrides) => {
        const product =
          createProduct(
            overrides,
          );

        const legacy =
          resolveProductCommercialPolicy(
            product,
          );

        const canonical =
          resolveProductCommercialState(
            product,
          );

        expect(
          legacy.isPubliclyVisible,
        ).toBe(
          canonical
            .isPubliclyVisible,
        );

        expect(
          legacy.isPurchasable,
        ).toBe(
          canonical
            .isPurchasable,
        );

        expect(
          legacy.canShowPricing,
        ).toBe(
          canonical
            .canShowPricing,
        );

        expect(
          legacy
            .canShowInventoryQuantity,
        ).toBe(
          canonical
            .canShowInventoryQuantity,
        );

        expect(
          legacy.issues,
        ).toEqual(
          canonical.issues,
        );
      },
    );
  },
);
