import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Campaign,
  Product,
} from "@wooly/contracts/types/product";

import {
  mixStrategicCatalogProducts,
} from "./StrategicCatalogMixer";

const createCampaign = (
  id:
    string,

  priority:
    number,
): Campaign => ({
  id,

  name:
    id,

  icon:
    "🏷️",

  themeToken:
    "campaign.default",

  colorClass:
    "",

  startDate:
    "2026-01-01",

  endDate:
    "2026-12-31",

  priority,

  publicationStatus:
    "publicado",

  computedStatus:
    "activa",
});

const createProduct = (
  id:
    string,

  category:
    string,

  campaigns:
    string[],

  priority:
    number,
): Product => ({
  id,

  title:
    id,

  description:
    "Producto de prueba",

  category,

  campaigns,

  priority,

  price_1:
    10,

  stock:
    10,

  status:
    "publicado",

  img:
    "https://example.com/product.jpg",
});

const campaigns:
  Campaign[] =
  [
    createCampaign(
      "campania-alta",
      100,
    ),

    createCampaign(
      "campania-baja",
      50,
    ),
  ];

const ids = (
  products:
    readonly Product[],
) =>
  products.map(
    (product) =>
      product.id,
  );

describe(
  "StrategicCatalogMixer",
  () => {
    it(
      "con cero o una campaña conserva exactamente el orden recibido",
      () => {
        const products =
          [
            createProduct(
              "P-03",
              "flores",
              [
                "campania-alta",
              ],
              30,
            ),

            createProduct(
              "P-01",
              "flores",
              [
                "campania-alta",
              ],
              100,
            ),

            createProduct(
              "P-02",
              "flores",
              [
                "campania-baja",
              ],
              80,
            ),
          ];

        expect(
          ids(
            mixStrategicCatalogProducts({
              products,
              campaigns,

              selectedCampaignIds:
                [],
            }),
          ),
        ).toEqual(
          ids(
            products,
          ),
        );

        expect(
          ids(
            mixStrategicCatalogProducts({
              products,
              campaigns,

              selectedCampaignIds: [
                "campania-alta",
              ],
            }),
          ),
        ).toEqual(
          ids(
            products,
          ),
        );
      },
    );

    it(
      "mezcla round-robin usando prioridad de campaña y prioridad de producto",
      () => {
        const products =
          [
            createProduct(
              "L-02",
              "flores",
              [
                "campania-baja",
              ],
              80,
            ),

            createProduct(
              "H-03",
              "flores",
              [
                "campania-alta",
              ],
              30,
            ),

            createProduct(
              "H-01",
              "flores",
              [
                "campania-alta",
              ],
              100,
            ),

            createProduct(
              "L-01",
              "flores",
              [
                "campania-baja",
              ],
              90,
            ),

            createProduct(
              "H-02",
              "flores",
              [
                "campania-alta",
              ],
              70,
            ),
          ];

        expect(
          ids(
            mixStrategicCatalogProducts({
              products,
              campaigns,

              /**
               * El orden técnico solicitado es inverso.
               * campaign.priority debe seguir mandando.
               */
              selectedCampaignIds: [
                "campania-baja",
                "campania-alta",
              ],
            }),
          ),
        ).toEqual([
          "H-01",
          "L-01",
          "H-02",
          "L-02",
          "H-03",
        ]);
      },
    );

    it(
      "asigna un producto multicampaña a la campaña seleccionada de mayor prioridad y no lo duplica",
      () => {
        const products =
          [
            createProduct(
              "MULTI",
              "flores",
              [
                "campania-baja",
                "campania-alta",
              ],
              95,
            ),

            createProduct(
              "HIGH",
              "flores",
              [
                "campania-alta",
              ],
              90,
            ),

            createProduct(
              "LOW",
              "flores",
              [
                "campania-baja",
              ],
              100,
            ),
          ];

        const result =
          mixStrategicCatalogProducts({
            products,
            campaigns,

            selectedCampaignIds: [
              "campania-alta",
              "campania-baja",
            ],
          });

        expect(
          ids(
            result,
          ),
        ).toEqual([
          "MULTI",
          "LOW",
          "HIGH",
        ]);

        expect(
          result.filter(
            (product) =>
              product.id ===
              "MULTI",
          ),
        ).toHaveLength(
          1,
        );

        expect(
          result,
        ).toHaveLength(
          products.length,
        );
      },
    );

    it(
      "mezcla cada categoría de forma independiente sin mover los slots de categoría",
      () => {
        const products =
          [
            createProduct(
              "F-LOW",
              "flores",
              [
                "campania-baja",
              ],
              10,
            ),

            createProduct(
              "P-LOW",
              "peluches",
              [
                "campania-baja",
              ],
              10,
            ),

            createProduct(
              "F-HIGH",
              "flores",
              [
                "campania-alta",
              ],
              100,
            ),

            createProduct(
              "P-HIGH",
              "peluches",
              [
                "campania-alta",
              ],
              100,
            ),
          ];

        const result =
          mixStrategicCatalogProducts({
            products,
            campaigns,

            selectedCampaignIds: [
              "campania-baja",
              "campania-alta",
            ],
          });

        expect(
          ids(
            result,
          ),
        ).toEqual([
          "F-HIGH",
          "P-HIGH",
          "F-LOW",
          "P-LOW",
        ]);

        expect(
          result.map(
            (product) =>
              product.category,
          ),
        ).toEqual(
          products.map(
            (product) =>
              product.category,
          ),
        );
      },
    );

    it(
      "preserva defensivamente productos sin campaña seleccionada",
      () => {
        const products =
          [
            createProduct(
              "UNASSIGNED",
              "flores",
              [
                "otra-campania",
              ],
              200,
            ),

            createProduct(
              "HIGH",
              "flores",
              [
                "campania-alta",
              ],
              50,
            ),
          ];

        const result =
          mixStrategicCatalogProducts({
            products,
            campaigns,

            selectedCampaignIds: [
              "campania-alta",
              "campania-baja",
            ],
          });

        expect(
          ids(
            result,
          ),
        ).toEqual([
          "HIGH",
          "UNASSIGNED",
        ]);

        expect(
          [...ids(result)].sort(),
        ).toEqual(
          [...ids(products)].sort(),
        );
      },
    );

    it(
      "resuelve empates de prioridad por ID",
      () => {
        const products =
          [
            createProduct(
              "H-20",
              "flores",
              [
                "campania-alta",
              ],
              100,
            ),

            createProduct(
              "H-10",
              "flores",
              [
                "campania-alta",
              ],
              100,
            ),

            createProduct(
              "L-10",
              "flores",
              [
                "campania-baja",
              ],
              100,
            ),
          ];

        expect(
          ids(
            mixStrategicCatalogProducts({
              products,
              campaigns,

              selectedCampaignIds: [
                "campania-alta",
                "campania-baja",
              ],
            }),
          ),
        ).toEqual([
          "H-10",
          "L-10",
          "H-20",
        ]);
      },
    );

    it(
      "es determinista y conserva exactamente el conjunto de productos",
      () => {
        const products =
          [
            createProduct(
              "A-2",
              "flores",
              [
                "campania-alta",
              ],
              60,
            ),

            createProduct(
              "B-1",
              "flores",
              [
                "campania-baja",
              ],
              90,
            ),

            createProduct(
              "A-1",
              "flores",
              [
                "campania-alta",
              ],
              100,
            ),

            createProduct(
              "B-2",
              "flores",
              [
                "campania-baja",
              ],
              50,
            ),
          ];

        const input = {
          products,
          campaigns,

          selectedCampaignIds: [
            "campania-baja",
            "campania-alta",
          ],
        };

        const first =
          mixStrategicCatalogProducts(
            input,
          );

        const second =
          mixStrategicCatalogProducts(
            input,
          );

        expect(
          ids(
            first,
          ),
        ).toEqual(
          ids(
            second,
          ),
        );

        expect(
          [...ids(first)].sort(),
        ).toEqual(
          [...ids(products)].sort(),
        );

        expect(
          new Set(
            ids(
              first,
            ),
          ).size,
        ).toBe(
          products.length,
        );
      },
    );
  },
);
