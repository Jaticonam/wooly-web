import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  resolveCatalogSelection,
  type CatalogSelectionResult,
} from "@wooly/contracts/catalog/domain/CatalogSelection";

import {
  useCatalogCampaigns,
} from "@wooly/shared/catalog/hooks/useCatalogCampaigns";

import {
  useCatalogData,
} from "@wooly/shared/catalog/hooks/useCatalogData";

import {
  parseCatalogPdfLink,
} from "@wooly/contracts/catalog-tools/services/CatalogPdfLinkContract";

import type {
  CatalogPublicationProvider,
} from "@wooly/shared/catalog/providers/CatalogPublicationProvider";

import {
  CATEGORY_CONFIG,
} from "@wooly/shared/catalog";

import {
  mapProductsToPdfProducts,
} from "@wooly/shared/catalog-export/mappers/PdfProductMapper";

import {
  buildPdfCategorySections,
} from "@wooly/shared/catalog-export/services/BuildPdfCategorySections";

import {
  buildCatalogPdfV2Copy,
  resolveCatalogPdfV2Selection,
} from "../services/CatalogPdfV2Selection";

import {
  resolveCatalogPublicPublicationSelection,
} from "@wooly/shared/catalog-export/services/CatalogPublicPublicationSelection";

import {
  useCatalogPublicPublication,
} from "./useCatalogPublicPublication";

const INVALID_PDF_LINK =
  "__invalid_pdf_link__";

const formatDate = (
  date: Date,
  includeTime = false,
) =>
  new Intl.DateTimeFormat(
    "es-PE",
    {
      day:
        "2-digit",
      month:
        "2-digit",
      year:
        "numeric",

      ...(includeTime
        ? {
            hour:
              "2-digit",
            minute:
              "2-digit",
          }
        : {}),
    },
  ).format(
    date,
  );

const addDays = (
  date: Date,
  days: number,
) => {
  const nextDate =
    new Date(
      date,
    );

  nextDate.setDate(
    nextDate.getDate() +
      days,
  );

  return nextDate;
};

export const buildCatalogPdfCopy = (
  selection:
    CatalogSelectionResult,
) => {
  if (
    selection.isCombination
  ) {
    return {
      title:
        `Catálogo Mayorista · ${selection.categoryLabel} + ${selection.campaignLabel}`,

      subtitle:
        `Selección comercial de ${selection.categoryLabel} para la campaña ${selection.campaignLabel}. Precios y productos sujetos a disponibilidad.`,

      segmentLabel:
        `${selection.categoryLabel} · ${selection.campaignLabel}`,

      segmentType:
        "combination" as const,
    };
  }

  if (
    selection.hasCampaign
  ) {
    return {
      title:
        `Catálogo Mayorista · ${selection.campaignLabel}`,

      subtitle:
        `Productos seleccionados para la campaña ${selection.campaignLabel}. Precios y productos sujetos a disponibilidad.`,

      segmentLabel:
        selection.campaignLabel,

      segmentType:
        "campaign" as const,
    };
  }

  if (
    selection.hasCategory
  ) {
    return {
      title:
        `Catálogo Mayorista · ${selection.categoryLabel}`,

      subtitle:
        `Selección comercial de productos de la categoría ${selection.categoryLabel} para pedidos mayoristas.`,

      segmentLabel:
        selection.categoryLabel,

      segmentType:
        "category" as const,
    };
  }

  return {
    title:
      "Catálogo Mayorista",

    subtitle:
      "Productos seleccionados para emprendedores, tiendas y ventas por campaña.",

    segmentLabel:
      "General",

    segmentType:
      "general" as const,
  };
};

export const buildCatalogPdfDates = (
  generatedDate: Date,
  validityDays: number,
) => ({
  generatedAt:
    formatDate(
      generatedDate,
      true,
    ),

  validUntil:
    formatDate(
      addDays(
        generatedDate,
        validityDays,
      ),
    ),
});

export const useCatalogPdfPageModel = (
  validityDays: number,

  publicationProvider:
    CatalogPublicationProvider | null = null,
) => {
  const [
    searchParams,
  ] =
    useSearchParams();

  const linkContract =
    useMemo(
      () =>
        parseCatalogPdfLink(
          searchParams,
        ),
      [
        searchParams,
      ],
    );

  const isV2 =
    linkContract.ok &&
    linkContract.contract.version ===
      "2";

  const v2Contract =
    isV2 &&
    linkContract.ok &&
    linkContract.contract.version ===
      "2"
      ? linkContract.contract
      : null;

  /**
   * A8-G1:
   *
   * El contrato reconoce Public ID antes de que exista
   * todavía un provider público real.
   *
   * Este guard evita que ?id=... pueda degradarse
   * accidentalmente al catálogo general V1.
   */
  const publicId =
    linkContract.ok
      ? linkContract
          .contract
          .publicId ?? ""
      : "";

  const isPublicId =
    Boolean(
      publicId,
    );

  const publicPublication =
    useCatalogPublicPublication(
      publicId,
      publicationProvider,
    );

  const publicResource =
    publicPublication
      .publication;

  const categoryId =
    linkContract.ok &&
    linkContract.contract.version ===
      "1"
      ? linkContract
          .contract
          .categoryId ??
        ""
      : linkContract.ok
        ? ""
        : INVALID_PDF_LINK;

  const campaignId =
    linkContract.ok &&
    linkContract.contract.version ===
      "1"
      ? linkContract
          .contract
          .campaignId ??
        ""
      : linkContract.ok
        ? ""
        : INVALID_PDF_LINK;

  const {
    data,
    isLoading,
    isFullCatalogLoaded,
  } =
    useCatalogData(
      "todas",
    );

  const {
    campaigns,
    isLoading:
      isCampaignRegistryLoading,
  } =
    useCatalogCampaigns({
      includeInactive:
        true,
    });

  const generatedDate =
    useMemo(
      () =>
        new Date(),
      [],
    );

  const dates =
    useMemo(
      () =>
        isPublicId &&
        publicResource
          ? {
              generatedAt:
                formatDate(
                  new Date(
                    publicResource
                      .publication
                      .publishedAt,
                  ),
                  true,
                ),

              validUntil:
                formatDate(
                  new Date(
                    publicResource
                      .publication
                      .validUntil,
                  ),
                ),
            }
          : buildCatalogPdfDates(
              generatedDate,
              validityDays,
            ),
      [
        generatedDate,
        isPublicId,
        publicResource,
        validityDays,
      ],
    );

  const v1Selection =
    useMemo(
      () =>
        resolveCatalogSelection({
          products:
            data,

          categories:
            CATEGORY_CONFIG,

          campaigns,

          categoryId,
          campaignId,
        }),
      [
        data,
        campaigns,
        categoryId,
        campaignId,
      ],
    );

  const v2Selection =
    useMemo(
      () =>
        v2Contract
          ? resolveCatalogPdfV2Selection({
              products:
                data,

              categories:
                CATEGORY_CONFIG,

              campaigns,

              contract:
                v2Contract,
            })
          : null,
      [
        data,
        campaigns,
        v2Contract,
      ],
    );

  const publicHasCampaign =
    Boolean(
      publicResource
        ?.composition
        .filters
        .campaignIds
        .length,
    );

  const publicCatalogIsReady =
    isPublicId &&
    publicPublication.status ===
      "ready" &&
    Boolean(
      publicResource,
    ) &&
    isFullCatalogLoaded &&
    (
      !publicHasCampaign ||
      !isCampaignRegistryLoading
    );

  const publicSelection =
    useMemo(
      () => {
        if (
          !publicCatalogIsReady ||
          !publicResource
        ) {
          return null;
        }

        return resolveCatalogPublicPublicationSelection({
          publication:
            publicResource,

          products:
            data,

          campaigns,
        });
      },
      [
        campaigns,
        data,
        publicCatalogIsReady,
        publicResource,
      ],
    );

  const copy =
    useMemo(
      () =>
        isPublicId &&
        publicResource
          ? {
              title:
                publicResource
                  .publicationIdentity
                  .title,

              subtitle:
                publicResource
                  .publicationIdentity
                  .description,

              segmentLabel:
                "Personalizado",

              segmentType:
                "general" as const,
            }
          : v2Selection
            ? buildCatalogPdfV2Copy(
                v2Selection,
              )
            : buildCatalogPdfCopy(
                v1Selection,
              ),
      [
        isPublicId,
        publicResource,
        v1Selection,
        v2Selection,
      ],
    );

  const products =
    useMemo(
      () =>
        mapProductsToPdfProducts(
          isPublicId
            ? (
                publicSelection
                  ?.products ??
                []
              )
            : v2Selection
              ? v2Selection.products
              : v1Selection.products,
        ),
      [
        isPublicId,
        publicSelection,
        v1Selection,
        v2Selection,
      ],
    );

  const categorySections =
    useMemo(
      () =>
        buildPdfCategorySections(
          products,
        ),
      [
        products,
      ],
    );

  const v2HasCampaign =
    Boolean(
      v2Contract
        ?.campaignIds
        .length,
    );

  const selectionIsReady =
    isPublicId
      ? publicCatalogIsReady
      : (
          isFullCatalogLoaded &&
          (
            isV2
              ? (
                  !v2HasCampaign ||
                  !isCampaignRegistryLoading
                )
              : (
                  !campaignId ||
                  !isCampaignRegistryLoading
                )
          )
        );

  const hasProducts =
    products.length >
    0;

  return {
    ...dates,

    copy,
    products,
    categorySections,
    selectionIsReady,
    hasProducts,

    isPublicId,

    publicPublicationStatus:
      publicPublication.status,

    publicPublication:
      publicPublication.publication,

    showCategorySections:
      isPublicId
        ? (
            publicSelection
              ?.showCategorySections ??
            false
          )
        : v2Selection
          ? v2Selection
              .showCategorySections
          : !v1Selection
              .hasCategory,

    showLoadingState:
      !hasProducts &&
      (
        isPublicId
          ? (
              publicPublication
                .status ===
                "ready" &&
              !selectionIsReady
            )
          : (
              isLoading ||
              !selectionIsReady
            )
      ),

    showEmptyState:
      !hasProducts &&
      (
        isPublicId
          ? (
              publicPublication
                .status ===
                "ready" &&
              selectionIsReady
            )
          : (
              !isLoading &&
              selectionIsReady
            )
      ),
  };
};
