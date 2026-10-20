import type {
  CatalogComposition,
} from "./CatalogComposition";

export type CatalogPublicationCoverStrategy =
  | "auto"
  | "custom";

export interface CatalogPublicationIdentity {
  title: string;

  description: string;

  cover: {
    strategy:
      CatalogPublicationCoverStrategy;

    customImageUrl:
      string;
  };
}

export interface ResolvedCatalogPublicationCover {
  imagePath: string;

  source:
    | "custom"
    | "campaign"
    | "default";

  sourceId?:
    string;
}

const DEFAULT_COVER =
  "/og/og-catalogo.jpg";

const CAMPAIGN_COVERS:
  Readonly<Record<string, string>> =
{
  "dia-madre":
    "/og/campanias/dia-madre.jpg",

  "dia-mujer":
    "/og/campanias/dia-mujer.jpg",

  "dia-padre":
    "/og/campanias/dia-padre.jpg",

  "flores-amarillas":
    "/og/campanias/flores-amarillas.jpg",

  graduados:
    "/og/campanias/graduados.jpg",

  hotwheels:
    "/og/campanias/hotwheels.jpg",

  "san-valentin":
    "/og/campanias/san-valentin.jpg",

  "vuelta-clases":
    "/og/campanias/vuelta-clases.jpg",
};

const clean =
  (
    value:
      string | undefined | null,
  ) =>
    String(
      value ?? "",
    ).trim();

export function createDefaultCatalogPublicationIdentity(
  title:
    string = "",
): CatalogPublicationIdentity {
  return {
    title:
      clean(
        title,
      ),

    description:
      "",

    cover: {
      strategy:
        "auto",

      customImageUrl:
        "",
    },
  };
}

export function cloneCatalogPublicationIdentity(
  identity:
    CatalogPublicationIdentity,
): CatalogPublicationIdentity {
  return {
    title:
      identity.title,

    description:
      identity.description,

    cover: {
      strategy:
        identity.cover.strategy,

      customImageUrl:
        identity.cover
          .customImageUrl,
    },
  };
}

export function sanitizeCatalogPublicationIdentity(
  value:
    unknown,
): CatalogPublicationIdentity | null {
  if (
    typeof value !==
      "object" ||
    value === null ||
    Array.isArray(
      value,
    )
  ) {
    return null;
  }

  const candidate =
    value as Record<
      string,
      unknown
    >;

  if (
    typeof candidate.title !==
      "string" ||
    typeof candidate.description !==
      "string"
  ) {
    return null;
  }

  if (
    typeof candidate.cover !==
      "object" ||
    candidate.cover ===
      null ||
    Array.isArray(
      candidate.cover,
    )
  ) {
    return null;
  }

  const cover =
    candidate.cover as Record<
      string,
      unknown
    >;

  if (
    cover.strategy !==
      "auto" &&
    cover.strategy !==
      "custom"
  ) {
    return null;
  }

  if (
    typeof cover.customImageUrl !==
      "string"
  ) {
    return null;
  }

  return {
    title:
      candidate.title.trim(),

    description:
      candidate.description.trim(),

    cover: {
      strategy:
        cover.strategy,

      customImageUrl:
        cover.customImageUrl.trim(),
    },
  };
}

export function resolveCatalogPublicationCover(
  identity:
    CatalogPublicationIdentity,

  composition:
    CatalogComposition,
): ResolvedCatalogPublicationCover {
  const customImageUrl =
    identity.cover
      .customImageUrl
      .trim();

  if (
    identity.cover.strategy ===
      "custom" &&
    customImageUrl
  ) {
    return {
      imagePath:
        customImageUrl,

      source:
        "custom",
    };
  }

  for (
    const campaignId
    of composition
      .filters
      .campaignIds
  ) {
    const imagePath =
      CAMPAIGN_COVERS[
        campaignId
      ];

    if (imagePath) {
      return {
        imagePath,

        source:
          "campaign",

        sourceId:
          campaignId,
      };
    }
  }

  return {
    imagePath:
      DEFAULT_COVER,

    source:
      "default",
  };
}

export function prepareCatalogPublicationIdentity(
  identity:
    CatalogPublicationIdentity,

  fallbackTitle:
    string,
): CatalogPublicationIdentity {
  const title =
    identity.title.trim() ||
    fallbackTitle.trim();

  return {
    title,

    description:
      identity.description
        .trim(),

    cover: {
      strategy:
        identity.cover
          .strategy,

      customImageUrl:
        identity.cover
          .customImageUrl
          .trim(),
    },
  };
}