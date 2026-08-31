import {
  useMemo,
  useState,
} from "react";

import {
  createEmptyCatalogComposition,
  type CatalogComposition,
  type CatalogCompositionMode,
} from "@/modules/catalog/domain/CatalogComposition";

import {
  resolveCatalogComposition,
} from "@/modules/catalog/domain/CatalogCompositionResolver";

import {
  filterActiveCampaigns,
} from "@/modules/catalog/domain/CampaignRules";

import {
  CATEGORY_CONFIG,
} from "@/modules/catalog/config/categories";

import type {
  Campaign,
  Product,
} from "@/shared/types/product";

import CatalogHybridAdjuster, { type CatalogHybridAction } from "@/modules/catalog-tools/components/CatalogHybridAdjuster/CatalogHybridAdjuster";

import CatalogManualSelector from "@/modules/catalog-tools/components/CatalogManualSelector/CatalogManualSelector";
import CatalogProductExplorer from "@/modules/catalog-tools/components/CatalogProductExplorer/CatalogProductExplorer";

import CatalogCompositionPreview from "@/modules/catalog-tools/components/CatalogCompositionPreview/CatalogCompositionPreview";

import {
  createDefaultCatalogPublicationIdentity,
  type CatalogPublicationIdentity,
} from "@/modules/catalog/domain/CatalogPublicationIdentity";

import CatalogDraftManager from "@/modules/catalog-tools/components/CatalogDraftManager/CatalogDraftManager";
import CatalogPublishCheckout from "@/modules/catalog-tools/components/CatalogPublishCheckout/CatalogPublishCheckout";
import CatalogPosSummary from "@/modules/catalog-tools/components/CatalogPosSummary/CatalogPosSummary";

import AdminModal from "@/modules/admin/components/AdminModal/AdminModal";

import "./CatalogCompositionPanel.css";

interface CatalogCompositionPanelProps {
  products: readonly Product[];
  campaigns: readonly Campaign[];
  isReady: boolean;
  onOpenCatalogSync?: () => void;
}

interface ModeOption {
  id: CatalogCompositionMode;
  label: string;
  description: string;
  status: string;
}

const MODE_OPTIONS: readonly ModeOption[] = [
  {
    id: "automatic",
    label: "Catálogo",
    description:
      "Selecciona categorías y campañas para construir la base de tu catálogo.",
    status: "Disponible",
  },
  {
    id: "hybrid",
    label: "Personalizado",
    description:
      "Parte de tu catálogo y agrega o retira productos según lo que necesita tu cliente.",
    status: "Recomendado",
  },
  {
    id: "manual",
    label: "Catálogo a medida",
    description:
      "Selecciona producto por producto para crear una propuesta específica.",
    status: "Disponible",
  },
];
const MODE_TABS: readonly {
  id: CatalogCompositionMode;
  label: string;
}[] = [
  {
    id: "automatic",
    label: "Catálogo",
  },
  {
    id: "hybrid",
    label: "Personalizado",
  },
];
const SELECTABLE_CATEGORIES =
  CATEGORY_CONFIG.filter(
    (category) =>
      category.id !== "todas",
  );

const toggleValue = (
  values: readonly string[],
  value: string,
) =>
  values.includes(value)
    ? values.filter(
        (item) =>
          item !== value,
      )
    : [
        ...values,
        value,
      ];

const normalizeCatalogSearchValue = (
  value: unknown,
) =>
  String(
    value ?? "",
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );

export default function CatalogCompositionPanel({
  products,
  campaigns,
  isReady,
  onOpenCatalogSync,
}: CatalogCompositionPanelProps) {
  const [
    catalogSearchQuery,
    setCatalogSearchQuery,
  ] = useState("");

  const [
    isCatalogDetailsOpen,
    setIsCatalogDetailsOpen,
  ] = useState(
    false,
  );

  const [
    isDraftManagerOpen,
    setIsDraftManagerOpen,
  ] = useState(
    false,
  );

  const [
    publicationIdentity,
    setPublicationIdentity,
  ] = useState<CatalogPublicationIdentity>(
    () =>
      createDefaultCatalogPublicationIdentity(),
  );

const [
    composition,
    setComposition,
  ] = useState<CatalogComposition>(
    () =>
      createEmptyCatalogComposition(
        "automatic",
      ),
  );

  const activeCampaigns =
    useMemo(
      () =>
        filterActiveCampaigns(
          [...campaigns],
        ),
      [campaigns],
    );

  const resolution =
    useMemo(
      () =>
        resolveCatalogComposition({
          products,
          composition,
        }),
      [
        products,
        composition,
      ],
    );

  const normalizedCatalogSearch =
    normalizeCatalogSearchValue(
      catalogSearchQuery,
    );

  const catalogExplorerProducts =
    normalizedCatalogSearch
      ? resolution.products.filter(
          (product) =>
            normalizeCatalogSearchValue(
              [
                product.id,
                product.title,
                product.description,
                product.category,
              ].join(" "),
            ).includes(
              normalizedCatalogSearch,
            ),
        )
      : resolution.products;

  const categoryOptions =
    useMemo(
      () =>
        SELECTABLE_CATEGORIES.map(
          (category) => {
            const optionComposition:
              CatalogComposition = {
                ...composition,

                mode:
                  "automatic",

                filters: {
                  ...composition.filters,

                  categoryIds: [
                    category.id,
                  ],
                },
              };

            const optionResolution =
              resolveCatalogComposition({
                products,

                composition:
                  optionComposition,
              });

            return {
              id:
                category.id,

              label:
                category.name,

              icon:
                category.icon,

              count:
                optionResolution
                  .productIds
                  .length,
            };
          },
        ),
      [
        products,
        composition,
      ],
    );

  const campaignOptions =
    useMemo(
      () =>
        activeCampaigns
          .map(
            (campaign) => {
              const optionComposition:
                CatalogComposition = {
                  ...composition,

                  mode:
                    "automatic",

                  filters: {
                    ...composition.filters,

                    campaignIds: [
                      campaign.id,
                    ],
                  },
                };

              const optionResolution =
                resolveCatalogComposition({
                  products,

                  composition:
                    optionComposition,
                });

              return {
                id:
                  campaign.id,

                label:
                  campaign.name,

                icon:
                  campaign.icon,

                count:
                  optionResolution
                    .productIds
                    .length,
              };
            },
          )
          .filter(
            (campaign) =>
              campaign.count > 0,
          ),
      [
        products,
        composition,
        activeCampaigns,
      ],
    );

  const categoryById =
    useMemo(
      () =>
        new Map(
          CATEGORY_CONFIG.map(
            (category) => [
              category.id,
              category,
            ],
          ),
        ),
      [],
    );

  const campaignById =
    useMemo(
      () =>
        new Map(
          activeCampaigns.map(
            (campaign) => [
              campaign.id,
              campaign,
            ],
          ),
        ),
      [activeCampaigns],
    );

  const selectedCategoryLabels =
    composition.filters
      .categoryIds
      .map(
        (categoryId) =>
          categoryById.get(
            categoryId as typeof CATEGORY_CONFIG[number]["id"],
          )?.name ??
          categoryId,
      );

  const selectedCampaignLabels =
    composition.filters
      .campaignIds
      .map(
        (campaignId) =>
          campaignById.get(
            campaignId,
          )?.name ??
          campaignId,
      );

  const filtersEnabled =
    composition.mode !==
    "manual";

  const selectedMode =
    MODE_OPTIONS.find(
      (mode) =>
        mode.id ===
        composition.mode,
    ) ??
    MODE_OPTIONS[0];

  const categorySummary =
    selectedCategoryLabels.length > 0
      ? selectedCategoryLabels.join(
          ", ",
        )
      : "Todas las categorías";

  const campaignSummary =
    selectedCampaignLabels.length > 0
      ? selectedCampaignLabels.join(
          ", ",
        )
      : "Sin campaña específica";

const changeMode =
    (
      mode: CatalogCompositionMode,
    ) => {
      setComposition(
        (current) => ({
          ...current,
          mode,
        }),
      );
    };

  const toggleCategory =
    (
      categoryId: string,
    ) => {
      if (!filtersEnabled) {
        return;
      }

      setComposition(
        (current) => ({
          ...current,

          filters: {
            ...current.filters,

            categoryIds:
              toggleValue(
                current.filters
                  .categoryIds,
                categoryId,
              ),
          },
        }),
      );
    };

  const toggleCampaign =
    (
      campaignId: string,
    ) => {
      if (!filtersEnabled) {
        return;
      }

      setComposition(
        (current) => ({
          ...current,

          filters: {
            ...current.filters,

            campaignIds:
              toggleValue(
                current.filters
                  .campaignIds,
                campaignId,
              ),
          },
        }),
      );
    };

  const applyHybridProductAction =
    (
      productId: string,
      action: CatalogHybridAction,
    ) => {
      setComposition(
        (current) => {
          let includedProductIds =
            [
              ...current.overrides
                .includedProductIds,
            ];

          let excludedProductIds =
            [
              ...current.overrides
                .excludedProductIds,
            ];

          if (action === "include") {
            if (
              !includedProductIds.includes(
                productId,
              )
            ) {
              includedProductIds.push(
                productId,
              );
            }

            excludedProductIds =
              excludedProductIds.filter(
                (currentId) =>
                  currentId !==
                  productId,
              );
          }

          if (
            action ===
            "remove-included"
          ) {
            includedProductIds =
              includedProductIds.filter(
                (currentId) =>
                  currentId !==
                  productId,
              );
          }

          if (action === "exclude") {
            if (
              !excludedProductIds.includes(
                productId,
              )
            ) {
              excludedProductIds.push(
                productId,
              );
            }

            includedProductIds =
              includedProductIds.filter(
                (currentId) =>
                  currentId !==
                  productId,
              );
          }

          if (action === "restore") {
            excludedProductIds =
              excludedProductIds.filter(
                (currentId) =>
                  currentId !==
                  productId,
              );
          }

          return {
            ...current,

            overrides: {
              ...current.overrides,
              includedProductIds,
              excludedProductIds,
            },
          };
        },
      );
    };
  const toggleManualProduct =
    (
      productId: string,
    ) => {
      setComposition(
        (current) => {
          const isIncluded =
            current.overrides
              .includedProductIds
              .includes(
                productId,
              );

          return {
            ...current,

            overrides: {
              ...current.overrides,

              includedProductIds:
                isIncluded
                  ? current.overrides
                      .includedProductIds
                      .filter(
                        (currentId) =>
                          currentId !==
                          productId,
                      )
                  : [
                      ...current.overrides
                        .includedProductIds,
                      productId,
                    ],

              excludedProductIds:
                current.overrides
                  .excludedProductIds
                  .filter(
                    (currentId) =>
                      currentId !==
                      productId,
                  ),
            },
          };
        },
      );
    };
  const resetComposition =
    () => {
      setComposition(
        (current) =>
          createEmptyCatalogComposition(
            current.mode,
          ),
      );

      setPublicationIdentity(
        createDefaultCatalogPublicationIdentity(),
      );
    };

  return (
    <section className="catalog-composition-panel">
      {/* ADMIN 1.0 - A5-E CATALOGO PERSONALIZADO */}
      <header className="catalog-composition-panel__commandBar">
  <div className="catalog-composition-panel__commandModeGroup">
    

    <div
      className="catalog-composition-panel__commandModes"
      role="group"
      aria-label="Flujo de catálogo"
    >
      {MODE_TABS.map(
        (mode) => {
          const isActive =
            composition.mode ===
            mode.id;

          return (
            <button
              type="button"
              key={
                mode.id
              }
              className={
                isActive
                  ? "is-active"
                  : ""
              }
              aria-pressed={
                isActive
              }
              onClick={() =>
                changeMode(
                  mode.id,
                )
              }
            >
              {mode.label}
            </button>
          );
        },
      )}
    </div>
  </div>

  <div className="catalog-composition-panel__commandActions">
    

        
    <button
      type="button"
      className="is-utility"
      onClick={() =>
        setIsDraftManagerOpen(
          true,
        )
      }
    >
      Mis catálogos
    </button>

{onOpenCatalogSync ? (
      <button
        type="button"
        className="is-utility"
        onClick={
          onOpenCatalogSync
        }
      >
        Google Sheets
      </button>
    ) : null}

    <button
      type="button"
      className="is-danger"
      onClick={
        resetComposition
      }
    >
      Limpiar
    </button>
  </div>
</header>

      <AdminModal
        open={
          isDraftManagerOpen
        }
        size="large"
        title="Mis catálogos"
        description="Guarda, abre, duplica o archiva tus borradores comerciales."
        onClose={() =>
          setIsDraftManagerOpen(
            false,
          )
        }
      >
        <CatalogDraftManager
          composition={
            composition
          }
          publicationIdentity={
            publicationIdentity
          }
          onPublicationIdentityChange={
            setPublicationIdentity
          }
          onLoadComposition={(nextComposition) => {
            setComposition(
              nextComposition,
            );

            setIsDraftManagerOpen(
              false,
            );
          }}
          onNewComposition={() => {
            setComposition(
              createEmptyCatalogComposition(
                "automatic",
              ),
            );

            setIsDraftManagerOpen(
              false,
            );
          }}
        />
      </AdminModal>

      <AdminModal
        open={
          isCatalogDetailsOpen
        }
        size="large"
        title="Publicar catálogo"
        description="Revisa la presentación y confirma cómo llegará el catálogo a tu cliente."
        onClose={() =>
          setIsCatalogDetailsOpen(
            false,
          )
        }
      >
        <CatalogPublishCheckout
          composition={
            composition
          }
          resolution={
            resolution
          }
          publicationIdentity={
            publicationIdentity
          }
          onPublicationIdentityChange={
            setPublicationIdentity
          }
          modeLabel={
            selectedMode.label
          }
          categorySummary={
            categorySummary
          }
          campaignSummary={
            campaignSummary
          }
        />
      </AdminModal>
      {!isReady ? (
        <div className="catalog-composition-panel__notice">
          Esperando que termine de cargar el catálogo
          completo y el registro de campañas.
        </div>
      ) : null}
            <div className="catalog-composition-panel__posWorkspace">
        <div className="catalog-composition-panel__posMain">
{composition.mode ===
      "hybrid" ? (
        <CatalogHybridAdjuster
          products={
            products
          }
          automaticProductIds={
            resolution
              .automaticProductIds
          }
          includedProductIds={
            composition.overrides
              .includedProductIds
          }
          excludedProductIds={
            composition.overrides
              .excludedProductIds
          }
          isReady={
            isReady
          }
          onProductAction={
            applyHybridProductAction
          }
        />
      ) : null}
      {composition.mode ===
      "manual" ? (
        <CatalogManualSelector
          products={
            products
          }
          includedProductIds={
            composition.overrides
              .includedProductIds
          }
          isReady={
            isReady
          }
          onToggleProduct={
            toggleManualProduct
          }
        />
      ) : null}

      {composition.mode === "automatic" ? (
        <section className="catalog-composition-panel__catalogWorkspace">
          <div className="catalog-composition-panel__catalogSearch">
            <label>
              <span>
                Buscar producto
              </span>

              <input
                type="search"
                value={
                  catalogSearchQuery
                }
                placeholder="Buscar código, nombre, descripción o categoría..."
                disabled={
                  !isReady
                }
                aria-label="Buscar producto en catálogo"
                onChange={(event) =>
                  setCatalogSearchQuery(
                    event.target.value,
                  )
                }
              />
            </label>

            {catalogSearchQuery ? (
              <button
                type="button"
                onClick={() =>
                  setCatalogSearchQuery(
                    "",
                  )
                }
              >
                Borrar búsqueda
              </button>
            ) : null}
          </div>

          <div
            className="catalog-composition-panel__catalogFilters"
            aria-label="Filtros del catálogo"
          >
            <div className="catalog-composition-panel__catalogFilterGroup is-categories">
              <div className="catalog-composition-panel__catalogFilterHeading">
                <span className="catalog-composition-panel__catalogFilterLabel">
                  Categorías
                </span>

                <small>
                  Explora por familia de producto
                </small>
              </div>

              <div className="catalog-composition-panel__catalogFilterOptions">
                {categoryOptions.map(
                  (category) => {
                    const isActive =
                      composition.filters
                        .categoryIds
                        .includes(
                          category.id,
                        );

                    const isDisabled =
                      !isReady ||
                      !filtersEnabled ||
                      category.count === 0;

                    return (
                      <button
                        type="button"
                        key={
                          category.id
                        }
                        disabled={
                          isDisabled
                        }
                        aria-pressed={
                          isActive
                        }
                        className={
                          isActive
                            ? "is-active"
                            : ""
                        }
                        onClick={() =>
                          toggleCategory(
                            category.id,
                          )
                        }
                      >
                        <span aria-hidden="true">
                          {category.icon}
                        </span>

                        <strong>
                          {category.label}
                        </strong>

                        <small>
                          {category.count}
                        </small>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="catalog-composition-panel__catalogFilterGroup is-campaigns">
              <div className="catalog-composition-panel__catalogFilterHeading">
                <span className="catalog-composition-panel__catalogFilterLabel">
                  Campañas
                </span>

                <small>
                  Oportunidades comerciales activas
                </small>
              </div>

              {campaignOptions.length >
              0 ? (
                <div className="catalog-composition-panel__catalogFilterOptions">
                  {campaignOptions.map(
                    (campaign) => {
                      const isActive =
                        composition.filters
                          .campaignIds
                          .includes(
                            campaign.id,
                          );

                      return (
                        <button
                          type="button"
                          key={
                            campaign.id
                          }
                          disabled={
                            !isReady ||
                            !filtersEnabled
                          }
                          aria-pressed={
                            isActive
                          }
                          className={
                            isActive
                              ? "is-active"
                              : ""
                          }
                          onClick={() =>
                            toggleCampaign(
                              campaign.id,
                            )
                          }
                        >
                          <span aria-hidden="true">
                            {campaign.icon ||
                              "●"}
                          </span>

                          <strong>
                            {campaign.label}
                          </strong>

                          <small>
                            {campaign.count}
                          </small>
                        </button>
                      );
                    },
                  )}
                </div>
              ) : (
                <span className="catalog-composition-panel__catalogFilterEmpty">
                  Sin campañas activas
                </span>
              )}
            </div>
          </div>

          <CatalogProductExplorer
            items={
              catalogExplorerProducts.map(
                (product) => ({
                  product,
                  stateLabel:
                    "En catálogo",
                  stateTone:
                    "available" as const,
                }),
              )
            }
            isReady={
              isReady
            }
            presentation="commercial"
      emptyMessage="No hay productos para los filtros seleccionados."
          />
        </section>
      ) : null}

              </div>

        <CatalogPosSummary
          mode={
            composition.mode
          }
          modeLabel={
            selectedMode.label
          }
          products={
            products
          }
          isReady={
            isReady
          }
          automaticProductIds={
            resolution
              .automaticProductIds
          }
          includedProductIds={
            composition
              .overrides
              .includedProductIds
          }
          excludedProductIds={
            composition
              .overrides
              .excludedProductIds
          }
          resolvedProductIds={
            resolution
              .productIds
          }
          selectedCategoryLabels={
            selectedCategoryLabels
          }
          selectedCampaignLabels={
            selectedCampaignLabels
          }
          onPublish={() =>
            setIsCatalogDetailsOpen(
              true,
            )
          }
          onRemoveManual={
            toggleManualProduct
          }
          onRemoveIncluded={
            (productId) =>
              applyHybridProductAction(
                productId,
                "remove-included",
              )
          }
          onRestoreExcluded={
            (productId) =>
              applyHybridProductAction(
                productId,
                "restore",
              )
          }
        />
      </div>
<CatalogCompositionPreview
        products={
          resolution.products
        }
        isReady={
          isReady
        }
      />
    </section>
  );
}
