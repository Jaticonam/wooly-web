import type {
  CatalogSourceMode,
} from "../../config/application/CatalogSourceMode";

import type {
  CatalogProvider,
} from "./CatalogProvider";

import {
  shouldUseCatalogFallback,
} from "./CatalogFallbackPolicy";

import {
  FallbackCatalogProvider,
} from "./FallbackCatalogProvider";

export interface CatalogProviderDependencies {
  googleSheets:
    CatalogProvider;

  contractFixture:
    CatalogProvider;

  jungCore:
    CatalogProvider;
}

export type CatalogFallbackSourceMode =
  "google-sheets";

export interface CatalogProviderFallbackOptions {
  readonly enabled:
    boolean;

  readonly source?:
    CatalogFallbackSourceMode;
}

export interface CatalogProviderFactoryOptions {
  readonly fallback?:
    CatalogProviderFallbackOptions;
}

export function resolveCatalogSourceMode(
  value:
    unknown,
): CatalogSourceMode {
  if (
    value ===
      "contract-fixture"
  ) {
    return "contract-fixture";
  }

  if (
    value ===
      "jung-core"
  ) {
    return "jung-core";
  }

  return "google-sheets";
}

function selectCatalogProvider(
  mode:
    CatalogSourceMode,

  dependencies:
    CatalogProviderDependencies,
): CatalogProvider {
  if (
    mode ===
      "contract-fixture"
  ) {
    return dependencies
      .contractFixture;
  }

  if (
    mode ===
      "jung-core"
  ) {
    return dependencies
      .jungCore;
  }

  return dependencies
    .googleSheets;
}

export function createCatalogProvider(
  value:
    unknown,

  dependencies:
    CatalogProviderDependencies,

  options:
    CatalogProviderFactoryOptions = {},
): CatalogProvider {
  const mode =
    resolveCatalogSourceMode(
      value,
    );

  const primary =
    selectCatalogProvider(
      mode,
      dependencies,
    );

  const fallbackOptions =
    options.fallback;

  if (
    !fallbackOptions
      ?.enabled ||
    mode !==
      "jung-core"
  ) {
    return primary;
  }

  const fallbackSource =
    fallbackOptions.source ??
    "google-sheets";

  const fallback =
    fallbackSource ===
      "google-sheets"
      ? dependencies
          .googleSheets
      : null;

  if (
    !fallback ||
    fallback === primary
  ) {
    return primary;
  }

  return new FallbackCatalogProvider(
    primary,
    fallback,

    {
      shouldFallback:
        shouldUseCatalogFallback,
    },
  );
}