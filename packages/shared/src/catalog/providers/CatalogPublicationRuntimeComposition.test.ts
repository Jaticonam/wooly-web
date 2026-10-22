import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  CatalogPublicationProvider,
} from "./CatalogPublicationProvider";

import {
  createCatalogPublicationRuntimeComposition,
} from "./CatalogPublicationRuntimeComposition";

import {
  woolyApplicationConfig,
  type ApplicationConfig,
} from "../../config/application";

function createConfig(
  apiBaseUrl:
    string | null,
): ApplicationConfig {
  return {
    ...woolyApplicationConfig,

    catalogPublication: {
      apiBaseUrl,
    },
  };
}

function createProvider():
  CatalogPublicationProvider {
  return {
    source:
      "test-publication-provider",

    publish:
      vi.fn(
        async () => {
          throw new Error(
            "publish no se usa en estos tests.",
          );
        },
      ),

    getByPublicId:
      vi.fn(
        async () =>
          null,
      ),
  };
}

describe(
  "CatalogPublicationRuntimeComposition",
  () => {
    it(
      "mantiene provider null cuando no hay endpoint configurado",
      () => {
        const factory =
          vi.fn(
            () =>
              createProvider(),
          );

        const result =
          createCatalogPublicationRuntimeComposition(
            createConfig(
              null,
            ),
            "production",
            {
              createHttpCatalogPublicationProvider:
                factory,
            },
          );

        expect(
          result.configured,
        ).toBe(false);

        expect(
          result.provider,
        ).toBeNull();

        expect(
          factory,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "crea provider HTTP una sola vez para HTTPS productivo",
      () => {
        const provider =
          createProvider();

        const factory =
          vi.fn(
            () =>
              provider,
          );

        const result =
          createCatalogPublicationRuntimeComposition(
            createConfig(
              "https://api.example.com/catalog-publications",
            ),
            "production",
            {
              createHttpCatalogPublicationProvider:
                factory,
            },
          );

        expect(
          result.configured,
        ).toBe(true);

        expect(
          result.provider,
        ).toBe(provider);

        expect(
          factory,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          factory,
        ).toHaveBeenCalledWith({
          baseUrl:
            "https://api.example.com/catalog-publications",

          allowInsecureHttp:
            false,
        });
      },
    );

    it(
      "propaga la base Admin de publicación cuando se configura",
      () => {
        const factory =
          vi.fn(
            () =>
              createProvider(),
          );

        createCatalogPublicationRuntimeComposition(
          createConfig(
            "https://core.example/public/catalog/publications",
          ),
          "production",
          {
            publishBaseUrl:
              "/jung-core",

            createHttpCatalogPublicationProvider:
              factory,
          },
        );

        expect(
          factory,
        ).toHaveBeenCalledWith({
          baseUrl:
            "https://core.example/public/catalog/publications",

          publishBaseUrl:
            "/jung-core",

          allowInsecureHttp:
            false,
        });
      },
    );

    it(
      "habilita HTTP inseguro solo para runtime no productivo",
      () => {
        const factory =
          vi.fn(
            () =>
              createProvider(),
          );

        createCatalogPublicationRuntimeComposition(
          createConfig(
            "http://localhost:3000/catalog-publications",
          ),
          "development",
          {
            createHttpCatalogPublicationProvider:
              factory,
          },
        );

        expect(
          factory,
        ).toHaveBeenCalledWith({
          baseUrl:
            "http://localhost:3000/catalog-publications",

          allowInsecureHttp:
            true,
        });
      },
    );

    it(
      "no marca HTTPS como inseguro en development",
      () => {
        const factory =
          vi.fn(
            () =>
              createProvider(),
          );

        createCatalogPublicationRuntimeComposition(
          createConfig(
            "https://api.example.com/catalog-publications",
          ),
          "development",
          {
            createHttpCatalogPublicationProvider:
              factory,
          },
        );

        expect(
          factory,
        ).toHaveBeenCalledWith({
          baseUrl:
            "https://api.example.com/catalog-publications",

          allowInsecureHttp:
            false,
        });
      },
    );

    it(
      "falla cerrado si hay endpoint pero no existe factory HTTP",
      () => {
        expect(
          () =>
            createCatalogPublicationRuntimeComposition(
              createConfig(
                "https://api.example.com/catalog-publications",
              ),
              "production",
            ),
        ).toThrow(
          /createHttpCatalogPublicationProvider/,
        );
      },
    );
  },
);
