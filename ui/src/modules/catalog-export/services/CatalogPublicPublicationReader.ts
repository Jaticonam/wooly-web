import {
  sanitizeCatalogPublicPublication,
  type CatalogPublicPublication,
} from "@wooly/contracts/catalog/domain/CatalogPublicPublication";

import {
  isCatalogPublicationExpired,
} from "@wooly/contracts/catalog/domain/CatalogPublication";

import type {
  CatalogPublicationProvider,
} from "@wooly/shared/catalog/providers/CatalogPublicationProvider";

export type CatalogPublicPublicationReaderStatus =
  | "idle"
  | "unavailable"
  | "loading"
  | "ready"
  | "not-found"
  | "expired"
  | "error";

export interface CatalogPublicPublicationReaderResult {
  status:
    CatalogPublicPublicationReaderStatus;

  publication:
    CatalogPublicPublication | null;
}

export interface ReadCatalogPublicPublicationInput {
  publicId:
    string;

  provider:
    CatalogPublicationProvider | null;

  now?:
    Date;
}

const createResult = (
  status:
    CatalogPublicPublicationReaderStatus,

  publication:
    CatalogPublicPublication | null = null,
): CatalogPublicPublicationReaderResult => ({
  status,
  publication,
});

export function createCatalogPublicPublicationReaderInitialState(
  publicId:
    string,

  provider:
    CatalogPublicationProvider | null,
): CatalogPublicPublicationReaderResult {
  const normalizedPublicId =
    String(
      publicId ?? "",
    ).trim();

  if (!normalizedPublicId) {
    return createResult(
      "idle",
    );
  }

  if (!provider) {
    return createResult(
      "unavailable",
    );
  }

  return createResult(
    "loading",
  );
}

export async function readCatalogPublicPublication(
  input:
    ReadCatalogPublicPublicationInput,
): Promise<CatalogPublicPublicationReaderResult> {
  const publicId =
    String(
      input.publicId ?? "",
    ).trim();

  if (!publicId) {
    return createResult(
      "idle",
    );
  }

  const provider =
    input.provider;

  if (!provider) {
    return createResult(
      "unavailable",
    );
  }

  try {
    const rawPublication =
      await provider.getByPublicId(
        publicId,
      );

    if (
      rawPublication ===
      null
    ) {
      return createResult(
        "not-found",
      );
    }

    const publication =
      sanitizeCatalogPublicPublication(
        rawPublication,
      );

    if (!publication) {
      return createResult(
        "error",
      );
    }

    if (
      publication.publicId !==
      publicId
    ) {
      return createResult(
        "error",
      );
    }

    if (
      isCatalogPublicationExpired(
        publication.publication,
        input.now ??
          new Date(),
      )
    ) {
      return createResult(
        "expired",
      );
    }

    return createResult(
      "ready",
      publication,
    );
  } catch {
    return createResult(
      "error",
    );
  }
}
