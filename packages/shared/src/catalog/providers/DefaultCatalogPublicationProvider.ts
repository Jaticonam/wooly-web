import {
  HttpCatalogPublicationProvider,
} from "../integrations/publication/HttpCatalogPublicationProvider";

import {
  getApplicationConfig,
  type ApplicationRuntimeMode,
} from "../../config/application";

import {
  createCatalogPublicationRuntimeComposition,
} from "./CatalogPublicationRuntimeComposition";

const runtimeMode:
  ApplicationRuntimeMode =
    import.meta.env.PROD
      ? "production"
      : "development";

export const catalogPublicationRuntimeComposition =
  createCatalogPublicationRuntimeComposition(
    getApplicationConfig(),
    runtimeMode,
    {
      publishBaseUrl:
        String(
          import.meta.env
            .VITE_JUNG_CORE_ADMIN_BASE_URL ??
            "",
        ).trim() ||
        "/jung-core",

      createHttpCatalogPublicationProvider:
        (
          options,
        ) =>
          new HttpCatalogPublicationProvider(
            options,
          ),
    },
  );

export const catalogPublicationProvider =
  catalogPublicationRuntimeComposition
    .provider;
