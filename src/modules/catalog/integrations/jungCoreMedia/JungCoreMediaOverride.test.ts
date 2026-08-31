import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";

import {
  applyCoreMediaAssets,
} from "./JungCoreMediaOverride";


function product(
  id: string,
  img: string,
  gallery = "",
): Product {
  return {
    id,

    title:
      id,

    description:
      "Producto",

    category:
      "flores",

    price_1:
      10,

    price_3:
      null,

    price_12:
      null,

    price_50:
      null,

    price_100:
      null,

    price_offer:
      null,

    stock:
      1,

    img,

    gallery,

    badges:
      [],

    campaigns:
      [],

    priority:
      0,

    status:
      "publicado",
  };
}


describe(
  "applyCoreMediaAssets",
  () => {

    it(
      "sobrescribe media por SKU y respeta primary/position",
      () => {

        const products = [
          product(
            "SKU-1",
            "sheet-main.jpg",
            "sheet-gallery.jpg",
          ),
        ];


        const result =
          applyCoreMediaAssets(
            products,
            [
              {
                sku:
                  "SKU-1",

                url:
                  "core-02.jpg",

                position:
                  2,

                isPrimary:
                  false,
              },

              {
                sku:
                  "SKU-1",

                url:
                  "core-01.jpg",

                position:
                  1,

                isPrimary:
                  true,
              },

              {
                sku:
                  "SKU-1",

                url:
                  "core-03.jpg",

                position:
                  3,

                isPrimary:
                  false,
              },
            ],
          );


        expect(
          result[0].img,
        ).toBe(
          "core-01.jpg",
        );


        expect(
          result[0].gallery,
        ).toBe(
          "core-02.jpg|core-03.jpg",
        );
      },
    );


    it(
      "proyecta Asset Manifest 1.0 y conserva la autoridad comercial de Sheets",
      () => {

        const products = [
          product(
            "CT-554",
            "sheet-main.jpg",
            "sheet-gallery.jpg",
          ),
        ];


        const result =
          applyCoreMediaAssets(
            products,
            {
              success:
                true,

              version:
                "1.0",

              total:
                3,

              assets: [
                {
                  mediaCode:
                    "WOOLY:CT-554:03",

                  publicUrl:
                    "https://media.jungnegocios.com/wooly/products/CT-554_03.jpg",

                  status:
                    "ACTIVE",

                  products: [
                    {
                      role:
                        "GALLERY",

                      position:
                        3,

                      isPrimary:
                        false,

                      product: {
                        sku:
                          "CT-554",

                        status:
                          "ACTIVE",
                      },
                    },
                  ],
                },

                {
                  mediaCode:
                    "WOOLY:CT-554:01",

                  publicUrl:
                    "https://media.jungnegocios.com/wooly/products/CT-554.jpg",

                  status:
                    "ACTIVE",

                  products: [
                    {
                      role:
                        "PRIMARY",

                      position:
                        1,

                      isPrimary:
                        true,

                      product: {
                        sku:
                          "CT-554",

                        status:
                          "ACTIVE",
                      },
                    },
                  ],
                },

                {
                  mediaCode:
                    "WOOLY:CT-554:02",

                  publicUrl:
                    "https://media.jungnegocios.com/wooly/products/CT-554_02.jpg",

                  status:
                    "ACTIVE",

                  products: [
                    {
                      role:
                        "GALLERY",

                      position:
                        2,

                      isPrimary:
                        false,

                      product: {
                        sku:
                          "CT-554",

                        status:
                          "ACTIVE",
                      },
                    },
                  ],
                },
              ],
            },
          );


        expect(
          result,
        ).toHaveLength(
          1,
        );


        expect(
          result[0].id,
        ).toBe(
          products[0].id,
        );


        expect(
          result[0].title,
        ).toBe(
          products[0].title,
        );


        expect(
          result[0].price_1,
        ).toBe(
          products[0].price_1,
        );


        expect(
          result[0].stock,
        ).toBe(
          products[0].stock,
        );


        expect(
          result[0].img,
        ).toBe(
          "https://media.jungnegocios.com/wooly/products/CT-554.jpg",
        );


        expect(
          result[0].gallery,
        ).toBe(
          "https://media.jungnegocios.com/wooly/products/CT-554_02.jpg|" +
          "https://media.jungnegocios.com/wooly/products/CT-554_03.jpg",
        );
      },
    );


    it(
      "conserva Sheets cuando Core no tiene el SKU",
      () => {

        const products = [
          product(
            "SKU-1",
            "sheet-main.jpg",
            "sheet-gallery.jpg",
          ),
        ];


        const result =
          applyCoreMediaAssets(
            products,
            {
              success:
                true,

              version:
                "1.0",

              assets: [
                {
                  publicUrl:
                    "otro.jpg",

                  status:
                    "ACTIVE",

                  products: [
                    {
                      position:
                        1,

                      isPrimary:
                        true,

                      product: {
                        sku:
                          "OTRO-SKU",

                        status:
                          "ACTIVE",
                      },
                    },
                  ],
                },
              ],
            },
          );


        expect(
          result,
        ).toEqual(
          products,
        );
      },
    );


    it(
      "ignora assets o productos inactivos del Manifest",
      () => {

        const products = [
          product(
            "SKU-1",
            "sheet-main.jpg",
            "sheet-gallery.jpg",
          ),
        ];


        const result =
          applyCoreMediaAssets(
            products,
            {
              assets: [
                {
                  publicUrl:
                    "inactive-asset.jpg",

                  status:
                    "INACTIVE",

                  products: [
                    {
                      position:
                        1,

                      isPrimary:
                        true,

                      product: {
                        sku:
                          "SKU-1",

                        status:
                          "ACTIVE",
                      },
                    },
                  ],
                },

                {
                  publicUrl:
                    "inactive-product.jpg",

                  status:
                    "ACTIVE",

                  products: [
                    {
                      position:
                        1,

                      isPrimary:
                        true,

                      product: {
                        sku:
                          "SKU-1",

                        status:
                          "INACTIVE",
                      },
                    },
                  ],
                },
              ],
            },
          );


        expect(
          result,
        ).toEqual(
          products,
        );
      },
    );


    it(
      "ignora assets sin URL válida",
      () => {

        const products = [
          product(
            "SKU-1",
            "sheet-main.jpg",
          ),
        ];


        const result =
          applyCoreMediaAssets(
            products,
            [
              {
                sku:
                  "SKU-1",

                url:
                  "",

                position:
                  1,

                isPrimary:
                  true,
              },
            ],
          );


        expect(
          result,
        ).toEqual(
          products,
        );
      },
    );


    it(
      "elimina URLs duplicadas",
      () => {

        const products = [
          product(
            "SKU-1",
            "sheet.jpg",
          ),
        ];


        const result =
          applyCoreMediaAssets(
            products,
            [
              {
                sku:
                  "SKU-1",

                url:
                  "core.jpg",

                position:
                  1,

                isPrimary:
                  true,
              },

              {
                sku:
                  "SKU-1",

                url:
                  "core.jpg",

                position:
                  2,

                isPrimary:
                  false,
              },
            ],
          );


        expect(
          result[0].img,
        ).toBe(
          "core.jpg",
        );


        expect(
          result[0].gallery,
        ).toBe(
          "",
        );
      },
    );


    it(
      "acepta el envelope público por SKU como compatibilidad",
      () => {

        const products = [
          product(
            "SKU-1",
            "sheet.jpg",
          ),
        ];


        const result =
          applyCoreMediaAssets(
            products,
            {
              success:
                true,

              data: {
                sku:
                  "SKU-1",

                mediaAssets: [
                  {
                    url:
                      "core-02.jpg",

                    position:
                      2,

                    isPrimary:
                      false,
                  },

                  {
                    url:
                      "core-01.jpg",

                    position:
                      1,

                    isPrimary:
                      true,
                  },
                ],
              },
            },
          );


        expect(
          result[0].img,
        ).toBe(
          "core-01.jpg",
        );


        expect(
          result[0].gallery,
        ).toBe(
          "core-02.jpg",
        );
      },
    );
  },
);