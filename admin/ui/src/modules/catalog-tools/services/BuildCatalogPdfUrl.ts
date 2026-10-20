import {
  CATALOG_PDF_LINK_VERSION,
  CATALOG_PDF_LINK_VERSION_V2,
} from "@wooly/contracts/catalog-tools/services/CatalogPdfLinkContract";

import {
  buildCatalogPdfPublicUrl,
  getApplicationConfig,
} from "@wooly/shared/config/application";

export interface BuildCatalogPdfPathV1Params {
  version?:
    "1";

  categoryId?:
    string;

  campaignId?:
    string;

  categoryIds?:
    never;

  campaignIds?:
    never;

  publicId?:
    never;
}

export interface BuildCatalogPdfPathV2Params {
  version:
    "2";

  categoryIds?:
    readonly string[];

  campaignIds?:
    readonly string[];

  categoryId?:
    never;

  campaignId?:
    never;

  publicId?:
    never;
}

export interface BuildCatalogPdfPathPublicIdParams {
  publicId:
    string;

  version?:
    never;

  categoryId?:
    never;

  campaignId?:
    never;

  categoryIds?:
    never;

  campaignIds?:
    never;
}

export type BuildCatalogPdfPathParams =
  | BuildCatalogPdfPathV1Params
  | BuildCatalogPdfPathV2Params
  | BuildCatalogPdfPathPublicIdParams;

export type BuildCatalogPdfUrlParams =
  BuildCatalogPdfPathParams & {
    origin?:
      string;
  };

const cleanValue = (
  value?:
    string |
    null,
) =>
  String(
    value ||
    "",
  )
    .trim()
    .toLowerCase();

const cleanPublicId = (
  value?:
    string |
    null,
) =>
  String(
    value ??
    "",
  ).trim();

const normalizeValues = (
  values:
    readonly string[] |
    undefined,
) =>
  Array.from(
    new Set(
      (
        values ??
        []
      )
        .map(
          cleanValue,
        )
        .filter(
          Boolean,
        ),
    ),
  )
    .sort();

const serializeValues = (
  values:
    readonly string[],
) =>
  values
    .map(
      (value) =>
        encodeURIComponent(
          value,
        ),
    )
    .join(",");

export const buildCatalogPdfPath = (
  params:
    BuildCatalogPdfPathParams,
) => {
  const route =
    getApplicationConfig()
      .routes
      .catalogPdf;

  if (
    params.publicId !==
    undefined
  ) {
    const publicId =
      cleanPublicId(
        params.publicId,
      );

    if (!publicId) {
      throw new Error(
        "No se puede construir un enlace PDF sin Public ID.",
      );
    }

    return `${route}?id=${encodeURIComponent(
      publicId,
    )}`;
  }

  if (
    params.version ===
    CATALOG_PDF_LINK_VERSION_V2
  ) {
    const categoryIds =
      normalizeValues(
        params.categoryIds,
      );

    const campaignIds =
      normalizeValues(
        params.campaignIds,
      );

    const query:
      string[] =
      [
        `v=${CATALOG_PDF_LINK_VERSION_V2}`,
      ];

    if (
      categoryIds.length >
      0
    ) {
      query.push(
        `cats=${serializeValues(
          categoryIds,
        )}`,
      );
    }

    if (
      campaignIds.length >
      0
    ) {
      query.push(
        `cpgs=${serializeValues(
          campaignIds,
        )}`,
      );
    }

    return `${route}?${query.join(
      "&",
    )}`;
  }

  const categoryId =
    cleanValue(
      params.categoryId,
    );

  const campaignId =
    cleanValue(
      params.campaignId,
    );

  const query:
    string[] =
    [
      `v=${CATALOG_PDF_LINK_VERSION}`,
    ];

  if (
    categoryId &&
    categoryId !==
      "todas"
  ) {
    query.push(
      `cat=${encodeURIComponent(
        categoryId,
      )}`,
    );
  }

  if (
    campaignId
  ) {
    query.push(
      `cpg=${encodeURIComponent(
        campaignId,
      )}`,
    );
  }

  return `${route}?${query.join(
    "&",
  )}`;
};

export const buildCatalogPdfUrl = ({
  origin,
  ...params
}: BuildCatalogPdfUrlParams) => {
  const path =
    buildCatalogPdfPath(
      params,
    );

  if (!origin) {
    return path;
  }

  const config =
    getApplicationConfig();

  return (
    buildCatalogPdfPublicUrl({
      ...config,

      publicSite: {
        ...config.publicSite,

        origin:
          String(
            origin,
          ).replace(
            /\/+$/,
            "",
          ),
      },
    }) +
    path.slice(
      config.routes
        .catalogPdf
        .length,
    )
  );
};
