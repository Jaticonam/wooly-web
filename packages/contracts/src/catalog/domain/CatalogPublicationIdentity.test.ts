import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createDefaultCatalogPublicationIdentity,
  resolveCatalogPublicationCover,
  sanitizeCatalogPublicationIdentity,
} from "./CatalogPublicationIdentity";

import {
  createEmptyCatalogComposition,
} from "./CatalogComposition";

describe(
  "CatalogPublicationIdentity",
  () => {
    it(
      "usa portada personalizada cuando existe",
      () => {
        const identity =
          createDefaultCatalogPublicationIdentity(
            "Cliente",
          );

        identity.cover = {
          strategy:
            "custom",

          customImageUrl:
            "https://example.com/cover.jpg",
        };

        expect(
          resolveCatalogPublicationCover(
            identity,
            createEmptyCatalogComposition(),
          ),
        ).toEqual({
          imagePath:
            "https://example.com/cover.jpg",

          source:
            "custom",
        });
      },
    );

    it(
      "usa imagen de campaña cuando existe",
      () => {
        const composition =
          createEmptyCatalogComposition();

        composition.filters = {
          ...composition.filters,

          categoryIds: [
            "flores",
          ],

          campaignIds: [
            "san-valentin",
          ],
        };

        expect(
          resolveCatalogPublicationCover(
            createDefaultCatalogPublicationIdentity(),
            composition,
          ),
        ).toMatchObject({
          imagePath:
            "/og/campanias/san-valentin.jpg",

          source:
            "campaign",

          sourceId:
            "san-valentin",
        });
      },
    );

    it(
      "no usa categoría como fallback de catálogo personalizado",
      () => {
        const composition =
          createEmptyCatalogComposition();

        composition.filters = {
          ...composition.filters,

          categoryIds: [
            "peluches",
          ],

          campaignIds:
            [],
        };

        expect(
          resolveCatalogPublicationCover(
            createDefaultCatalogPublicationIdentity(),
            composition,
          ),
        ).toEqual({
          imagePath:
            "/og/og-catalogo.jpg",

          source:
            "default",
        });
      },
    );

    it(
      "usa Wooly principal si la campaña no tiene imagen conocida",
      () => {
        const composition =
          createEmptyCatalogComposition();

        composition.filters = {
          ...composition.filters,

          campaignIds: [
            "navidad",
          ],
        };

        expect(
          resolveCatalogPublicationCover(
            createDefaultCatalogPublicationIdentity(),
            composition,
          ),
        ).toEqual({
          imagePath:
            "/og/og-catalogo.jpg",

          source:
            "default",
        });
      },
    );

    it(
      "rechaza identidad estructuralmente inválida",
      () => {
        expect(
          sanitizeCatalogPublicationIdentity({
            title:
              "Catálogo",

            description:
              "Prueba",

            cover: {
              strategy:
                "otro",

              customImageUrl:
                "",
            },
          }),
        ).toBeNull();
      },
    );
  },
);