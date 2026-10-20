import type {
  ApplicationConfig,
  ApplicationRuntimeMode,
} from "../../config/application";

import type {
  CatalogPublicationProvider,
} from "./CatalogPublicationProvider";

export interface HttpCatalogPublicationProviderFactoryOptions {
  readonly baseUrl:
    string;

  readonly allowInsecureHttp:
    boolean;
}

export type HttpCatalogPublicationProviderFactory =
  (
    options:
      HttpCatalogPublicationProviderFactoryOptions,
  ) => CatalogPublicationProvider;

export interface CatalogPublicationRuntimeCompositionDependencies {
  readonly createHttpCatalogPublicationProvider?:
    HttpCatalogPublicationProviderFactory;
}

export interface CatalogPublicationRuntimeComposition {
  readonly configured:
    boolean;

  readonly provider:
    CatalogPublicationProvider | null;
}

class CatalogPublicationRuntimeDependencyUnavailableError
  extends Error {
  readonly code =
    "CONFIGURATION_ERROR" as const;

  constructor(
    dependency:
      string,
  ) {
    super(
      `La dependencia runtime ${dependency} no esta disponible.`,
    );

    this.name =
      "CatalogPublicationRuntimeDependencyUnavailableError";
  }
}

export function createCatalogPublicationRuntimeComposition(
  config:
    ApplicationConfig,

  mode:
    ApplicationRuntimeMode,

  dependencies:
    CatalogPublicationRuntimeCompositionDependencies = {},
): CatalogPublicationRuntimeComposition {
  const apiBaseUrl =
    config.catalogPublication
      .apiBaseUrl;

  if (!apiBaseUrl) {
    return {
      configured: false,
      provider: null,
    };
  }

  const createHttpProvider =
    dependencies
      .createHttpCatalogPublicationProvider;

  if (!createHttpProvider) {
    throw new CatalogPublicationRuntimeDependencyUnavailableError(
      "createHttpCatalogPublicationProvider",
    );
  }

  const protocol =
    new URL(
      apiBaseUrl,
    ).protocol;

  const allowInsecureHttp =
    mode !== "production" &&
    protocol === "http:";

  return {
    configured: true,

    provider:
      createHttpProvider({
        baseUrl:
          apiBaseUrl,

        allowInsecureHttp,
      }),
  };
}
