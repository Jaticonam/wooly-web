import type { Product } from "@/shared/types/product";

import {
  requestJson,
} from "@/shared/infrastructure/http";


interface CoreMediaAsset {
  readonly sku?: unknown;

  readonly url?: unknown;

  readonly position?: unknown;

  readonly isPrimary?: unknown;
}


const SOURCE =
  "JUNG CORE media assets";


const DEFAULT_CORE_URL =
  "http://localhost:3000/assets/manifest";


function cleanText(
  value: unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}


function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}


function normalizePosition(
  value: unknown,
): number {
  const position =
    Number(value);

  return Number.isFinite(position)
    ? position
    : Number.MAX_SAFE_INTEGER;
}


function isActiveOrUnspecified(
  value: unknown,
): boolean {
  const status =
    cleanText(value)
      .toUpperCase();

  return (
    status.length === 0 ||
    status === "ACTIVE"
  );
}


function projectFlatAsset(
  value: unknown,
): CoreMediaAsset[] {
  if (!isRecord(value)) {
    return [];
  }

  const directSku =
    cleanText(
      value.sku,
    );

  const directUrl =
    cleanText(
      value.url,
    );


  /*
   * Compatibilidad con la proyección plana
   * histórica:
   *
   * {
   *   sku,
   *   url,
   *   position,
   *   isPrimary
   * }
   */
  if (
    directSku.length > 0 ||
    directUrl.length > 0
  ) {
    return [
      {
        sku:
          value.sku,

        url:
          value.url,

        position:
          value.position,

        isPrimary:
          value.isPrimary,
      },
    ];
  }


  /*
   * Asset Manifest 1.0:
   *
   * asset.publicUrl
   * asset.status
   * asset.products[]
   *   relation.position
   *   relation.isPrimary
   *   relation.product.sku
   *   relation.product.status
   */
  const publicUrl =
    cleanText(
      value.publicUrl,
    );


  if (
    publicUrl.length === 0 ||
    !isActiveOrUnspecified(
      value.status,
    ) ||
    !Array.isArray(
      value.products,
    )
  ) {
    return [];
  }


  return value.products
    .flatMap(
      (
        relation,
      ): CoreMediaAsset[] => {

        if (
          !isRecord(
            relation,
          ) ||
          !isRecord(
            relation.product,
          )
        ) {
          return [];
        }


        const sku =
          cleanText(
            relation
              .product
              .sku,
          );


        if (
          sku.length === 0 ||
          !isActiveOrUnspecified(
            relation
              .product
              .status,
          )
        ) {
          return [];
        }


        return [
          {
            sku,

            url:
              publicUrl,

            position:
              relation.position,

            isPrimary:
              relation.isPrimary,
          },
        ];
      },
    );
}


function projectPublicSkuPayload(
  payload: Record<string, unknown>,
): CoreMediaAsset[] {
  if (!isRecord(payload.data)) {
    return [];
  }


  const sku =
    cleanText(
      payload.data.sku,
    );


  if (
    sku.length === 0 ||
    !Array.isArray(
      payload
        .data
        .mediaAssets,
    )
  ) {
    return [];
  }


  return payload
    .data
    .mediaAssets
    .flatMap(
      (
        item,
      ): CoreMediaAsset[] => {

        if (!isRecord(item)) {
          return [];
        }


        const url =
          cleanText(
            item.url,
          );


        if (url.length === 0) {
          return [];
        }


        return [
          {
            sku,

            url,

            position:
              item.position,

            isPrimary:
              item.isPrimary,
          },
        ];
      },
    );
}


function extractAssets(
  payload: unknown,
): CoreMediaAsset[] {
  if (Array.isArray(payload)) {
    return payload.flatMap(
      projectFlatAsset,
    );
  }


  if (!isRecord(payload)) {
    return [];
  }


  const publicProjection =
    projectPublicSkuPayload(
      payload,
    );


  if (
    publicProjection.length > 0
  ) {
    return publicProjection;
  }


  for (
    const candidate
    of [
      payload.assets,
      payload.items,
      payload.data,
    ]
  ) {
    if (Array.isArray(candidate)) {
      return candidate.flatMap(
        projectFlatAsset,
      );
    }
  }


  return [];
}


function resolveCoreUrl(): string {
  const configured =
    cleanText(
      import.meta.env
        .VITE_JUNG_CORE_ASSETS_URL,
    );


  return (
    configured ||
    DEFAULT_CORE_URL
  );
}


function mediaForSku(
  assets: readonly CoreMediaAsset[],
  sku: string,
): string[] {
  const normalizedSku =
    cleanText(
      sku,
    ).toLowerCase();


  return assets
    .filter(
      (asset) =>
        cleanText(
          asset.sku,
        ).toLowerCase() ===
        normalizedSku,
    )
    .filter(
      (asset) =>
        Boolean(
          cleanText(
            asset.url,
          ),
        ),
    )
    .sort(
      (
        left,
        right,
      ) => {

        const primaryDelta =
          Number(
            Boolean(
              right.isPrimary,
            ),
          ) -
          Number(
            Boolean(
              left.isPrimary,
            ),
          );


        if (
          primaryDelta !== 0
        ) {
          return primaryDelta;
        }


        return (
          normalizePosition(
            left.position,
          ) -
          normalizePosition(
            right.position,
          )
        );
      },
    )
    .map(
      (asset) =>
        cleanText(
          asset.url,
        ),
    )
    .filter(
      (
        url,
        index,
        urls,
      ) =>
        urls.indexOf(url) ===
        index,
    );
}


export function applyCoreMediaAssets(
  products: readonly Product[],
  payload: unknown,
): Product[] {
  const assets =
    extractAssets(
      payload,
    );


  if (
    assets.length === 0
  ) {
    return [
      ...products,
    ];
  }


  return products.map(
    (product) => {

      const media =
        mediaForSku(
          assets,
          product.id,
        );


      if (
        media.length === 0
      ) {
        return product;
      }


      return {
        ...product,

        img:
          media[0],

        gallery:
          media
            .slice(1)
            .join("|"),
      };
    },
  );
}


export async function overrideProductsWithCoreMedia(
  products: readonly Product[],
): Promise<Product[]> {
  if (
    products.length === 0
  ) {
    return [];
  }


  try {

    const result =
      await requestJson<unknown>(
        resolveCoreUrl(),
        {
          source:
            SOURCE,

          timeoutMs:
            2_000,
        },
      );


    if (
      result.ok === false
    ) {
      console.warn(
        `[JUNG CORE media] ${result.error.code}: ` +
        `${result.error.message} ` +
        "Se conserva media de Google Sheets.",
      );

      return [
        ...products,
      ];
    }


    return applyCoreMediaAssets(
      products,
      result.data,
    );
  }
  catch (
    cause: unknown
  ) {

    console.warn(
      "[JUNG CORE media] Error inesperado. " +
      "Se conserva media de Google Sheets.",
      cause,
    );


    return [
      ...products,
    ];
  }
}