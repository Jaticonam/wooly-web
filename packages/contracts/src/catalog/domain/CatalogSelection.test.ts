import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Campaign,
  Product,
} from "../../types/product";

import {
  resolveCatalogSelection,
} from "./CatalogSelection";

const categories = [
  {
    id: "todas",
    name: "Todas",
    icon: "🛍️",
  },
  {
    id: "flores",
    name: "Flores",
    icon: "🌸",
  },
  {
    id: "cajas",
    name: "Cajas",
    icon: "📦",
  },
] as const;

const campaigns: Campaign[] = [
  {
    id: "dia-madre",
    name: "Día de la Madre",
    icon: "🌷",
    color: "rosado",
    themeToken: "campaign.rosado",
    colorClass: "catalog-campaign-pink",
    startDate: "01/05/2026",
    endDate: "31/05/2026",
    priority: 100,
    publicationStatus: "publicado",
    computedStatus: "activa",
  },
  {
    id: "cyber",
    name: "Cyber Wooly",
    icon: "⚡",
    color: "negro",
    themeToken: "campaign.negro",
    colorClass: "catalog-campaign-dark",
    startDate: "01/07/2026",
    endDate: "31/07/2026",
    priority: 80,
    publicationStatus: "publicado",
    computedStatus: "activa",
  },
];

const createProduct = (
  overrides: Partial<Product>,
): Product => ({
  id: "PRODUCTO",
  title: "Producto Wooly",
  description: "Descripción",
  category: "flores",
  price_1: 10,
  stock: 20,
  img: "https://example.com/producto.jpg",
  status: "publicado",
  campaigns: [],
  priority: 0,
  ...overrides,
});

const products: Product[] = [
  createProduct({
    id: "FLOR-001",
    category: "flores",
    campaigns: ["dia-madre"],
    priority: 100,
  }),
  createProduct({
    id: "CAJA-001",
    category: "cajas",
    campaigns: ["dia-madre"],
    priority: 80,
  }),
  createProduct({
    id: "FLOR-002",
    category: "flores",
    campaigns: [],
    priority: 50,
  }),
  createProduct({
    id: "CAJA-002",
    category: "cajas",
    campaigns: ["cyber"],
    priority: 20,
  }),
  createProduct({
    id: "OCULTO-001",
    category: "flores",
    campaigns: ["dia-madre"],
    priority: 200,
    status: "oculto",
  }),
];

describe(
  "resolveCatalogSelection",
  () => {
    it(
      "devuelve el catálogo general sin productos ocultos",
      () => {
        const result =
          resolveCatalogSelection({
            products,
            categories,
            campaigns,
          });

        expect(result.segmentType)
          .toBe("general");

        expect(result.products.map(
          (product) => product.id,
        )).toEqual([
          "FLOR-001",
          "FLOR-002",
          "CAJA-001",
          "CAJA-002",
        ]);
      },
    );

    it.each([
      {
        label: "vencida",
        campaign: {
          ...campaigns[0],
          startDate: "01/01/2000",
          endDate: "31/12/2000",
          computedStatus: "finalizada" as const,
        },
      },
      {
        label: "no publicada",
        campaign: {
          ...campaigns[0],
          publicationStatus: "borrador",
          computedStatus: "borrador" as const,
        },
      },
    ])(
      "mantiene el producto publicado en el catálogo general aunque su campaña esté $label",
      ({ campaign }) => {
        const result =
          resolveCatalogSelection({
            products: [
              createProduct({
                id: "PUBLICO",
                campaigns: [
                  campaign.id,
                ],
              }),
            ],
            categories,
            campaigns: [
              campaign,
            ],
          });

        expect(
          result.products.map(
            (product) => product.id,
          ),
        ).toEqual([
          "PUBLICO",
        ]);
      },
    );

    it(
      "no eleva a público un producto oculto aunque su campaña esté activa",
      () => {
        const result =
          resolveCatalogSelection({
            products: [
              createProduct({
                id: "OCULTO",
                status: "oculto",
                campaigns: [
                  campaigns[0].id,
                ],
              }),
            ],
            categories,
            campaigns,
          });

        expect(result.products)
          .toHaveLength(0);
      },
    );

    it(
      "filtra únicamente por categoría",
      () => {
        const result =
          resolveCatalogSelection({
            products,
            categories,
            campaigns,
            categoryId: "flores",
          });

        expect(result.segmentType)
          .toBe("category");

        expect(result.productCount)
          .toBe(2);

        expect(result.products.map(
          (product) => product.id,
        )).toEqual([
          "FLOR-001",
          "FLOR-002",
        ]);
      },
    );

    it(
      "filtra únicamente por campaña",
      () => {
        const result =
          resolveCatalogSelection({
            products,
            categories,
            campaigns,
            campaignId: "dia-madre",
          });

        expect(result.segmentType)
          .toBe("campaign");

        expect(result.products.map(
          (product) => product.id,
        )).toEqual([
          "FLOR-001",
          "CAJA-001",
        ]);
      },
    );

    it(
      "combina categoría y campaña mediante intersección",
      () => {
        const result =
          resolveCatalogSelection({
            products,
            categories,
            campaigns,
            categoryId: "flores",
            campaignId: "dia-madre",
          });

        expect(result.segmentType)
          .toBe("combination");

        expect(result.isCombination)
          .toBe(true);

        expect(result.products.map(
          (product) => product.id,
        )).toEqual([
          "FLOR-001",
        ]);
      },
    );

    it(
      "normaliza mayúsculas y acentos",
      () => {
        const result =
          resolveCatalogSelection({
            products,
            categories,
            campaigns,
            categoryId: " FLÓRES ",
            campaignId: " DÍA-MADRE ",
          });

        expect(result.categoryId)
          .toBe("flores");

        expect(result.campaignId)
          .toBe("dia-madre");

        expect(result.productCount)
          .toBe(1);
      },
    );

    it(
      "interpreta todas como ausencia de filtro de categoría",
      () => {
        const result =
          resolveCatalogSelection({
            products,
            categories,
            campaigns,
            categoryId: "todas",
            campaignId: "dia-madre",
          });

        expect(result.hasCategory)
          .toBe(false);

        expect(result.hasCampaign)
          .toBe(true);

        expect(result.productCount)
          .toBe(2);
      },
    );

    it(
      "bloquea una categoría inexistente",
      () => {
        const result =
          resolveCatalogSelection({
            products,
            categories,
            campaigns,
            categoryId: "inexistente",
          });

        expect(result.isEmpty)
          .toBe(true);

        expect(result.warnings.map(
          (warning) => warning.code,
        )).toContain(
          "unknown-category",
        );
      },
    );

    it(
      "bloquea una campaña inexistente",
      () => {
        const result =
          resolveCatalogSelection({
            products,
            categories,
            campaigns,
            campaignId: "inexistente",
          });

        expect(result.isEmpty)
          .toBe(true);

        expect(result.warnings.map(
          (warning) => warning.code,
        )).toContain(
          "unknown-campaign",
        );
      },
    );

    it(
      "reporta una combinación válida sin productos",
      () => {
        const result =
          resolveCatalogSelection({
            products,
            categories,
            campaigns,
            categoryId: "flores",
            campaignId: "cyber",
          });

        expect(result.isEmpty)
          .toBe(true);

        expect(result.warnings.map(
          (warning) => warning.code,
        )).toContain(
          "empty-selection",
        );
      },
    );

    it(
      "ordena los productos por prioridad descendente",
      () => {
        const result =
          resolveCatalogSelection({
            products: [
              createProduct({
                id: "BAJA",
                priority: 10,
              }),
              createProduct({
                id: "ALTA",
                priority: 100,
              }),
              createProduct({
                id: "MEDIA",
                priority: 50,
              }),
            ],
            categories,
            campaigns,
            categoryId: "flores",
          });

        expect(result.products.map(
          (product) => product.id,
        )).toEqual([
          "ALTA",
          "MEDIA",
          "BAJA",
        ]);
      },
    );

    it(
      "agrupa el catálogo general según el orden oficial de categorías",
      () => {
        const result =
          resolveCatalogSelection({
            products: [
              createProduct({
                id: "CAJA-ALTA",
                category: "cajas",
                priority: 1000,
              }),
              createProduct({
                id: "FLOR-BAJA",
                category: "flores",
                priority: 1,
              }),
            ],
            categories,
            campaigns,
          });

        expect(result.products.map(
          (product) => product.id,
        )).toEqual([
          "FLOR-BAJA",
          "CAJA-ALTA",
        ]);
      },
    );

    it(
      "agrupa una campaña completa según el orden oficial de categorías",
      () => {
        const result =
          resolveCatalogSelection({
            products: [
              createProduct({
                id: "CAJA-DIA",
                category: "cajas",
                campaigns: ["dia-madre"],
                priority: 100,
              }),
              createProduct({
                id: "FLOR-DIA",
                category: "flores",
                campaigns: ["dia-madre"],
                priority: 10,
              }),
            ],
            categories,
            campaigns,
            campaignId: "dia-madre",
          });

        expect(result.products.map(
          (product) => product.id,
        )).toEqual([
          "FLOR-DIA",
          "CAJA-DIA",
        ]);
      },
    );

    it(
      "desempata productos por código ascendente",
      () => {
        const result =
          resolveCatalogSelection({
            products: [
              createProduct({
                id: "FLOR-010",
                category: "flores",
                priority: 50,
              }),
              createProduct({
                id: "FLOR-002",
                category: "flores",
                priority: 50,
              }),
            ],
            categories,
            campaigns,
            categoryId: "flores",
          });

        expect(result.products.map(
          (product) => product.id,
        )).toEqual([
          "FLOR-002",
          "FLOR-010",
        ]);
      },
    );
    it(
      "agrupa una campaña completa por categoría oficial",
      () => {
        const result =
          resolveCatalogSelection({
            products: [
              createProduct({
                id: "CAJA-ALTA",
                category: "cajas",
                campaigns: [
                  "dia-madre",
                ],
                priority: 100,
              }),
              createProduct({
                id: "FLOR-BAJA",
                category: "flores",
                campaigns: [
                  "dia-madre",
                ],
                priority: 10,
              }),
              createProduct({
                id: "CAJA-BAJA",
                category: "cajas",
                campaigns: [
                  "dia-madre",
                ],
                priority: 20,
              }),
              createProduct({
                id: "FLOR-ALTA",
                category: "flores",
                campaigns: [
                  "dia-madre",
                ],
                priority: 80,
              }),
            ],
            categories,
            campaigns,
            campaignId:
              "dia-madre",
          });

        expect(
          result.products.map(
            (product) =>
              product.id,
          ),
        ).toEqual([
          "FLOR-ALTA",
          "FLOR-BAJA",
          "CAJA-ALTA",
          "CAJA-BAJA",
        ]);
      },
    );

    it(
      "ordena una categoría específica solo por prioridad",
      () => {
        const result =
          resolveCatalogSelection({
            products: [
              createProduct({
                id: "FLOR-BAJA",
                category: "flores",
                priority: 10,
              }),
              createProduct({
                id: "FLOR-ALTA",
                category: "flores",
                priority: 100,
              }),
            ],
            categories,
            campaigns,
            categoryId:
              "flores",
          });

        expect(
          result.products.map(
            (product) =>
              product.id,
          ),
        ).toEqual([
          "FLOR-ALTA",
          "FLOR-BAJA",
        ]);
      },
    );
  },
);
