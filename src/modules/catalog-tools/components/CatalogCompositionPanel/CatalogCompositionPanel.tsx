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
import CatalogWorkflowHeader, {
  type CatalogWorkflowStage,
} from "@/modules/catalog-tools/components/CatalogWorkflowHeader/CatalogWorkflowHeader";
import CatalogCompositionModePicker from "@/modules/catalog-tools/components/CatalogCompositionModePicker/CatalogCompositionModePicker";
import {
  CATALOG_COMPOSITION_MODE_OPTIONS,
} from "@/modules/catalog-tools/domain/CatalogCompositionModeOptions";

import AdminModal from "@/modules/admin/components/AdminModal/AdminModal";

import "./CatalogCompositionPanel.css";

interface CatalogCompositionPanelProps {
  products: readonly Product[];
  campaigns: readonly Campaign[];
  isReady: boolean;
  onOpenCatalogSync?: () => void;
}

type CatalogPanelStage =
  | "explorer"
  | "workspace";
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
    panelStage,
    setPanelStage,
  ] = useState<CatalogPanelStage>(
    "explorer",
  );

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

  const selectedMode =
    CATALOG_COMPOSITION_MODE_OPTIONS.find(
      (mode) =>
        mode.id ===
        composition.mode,
    ) ??
    CATALOG_COMPOSITION_MODE_OPTIONS[0];

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

  const activeFilterCount =
    composition.filters.categoryIds
      .length +
    composition.filters.campaignIds
      .length;

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

      setPanelStage(
        "explorer",
      );
    };

  const workflowStage: CatalogWorkflowStage =
    panelStage === "explorer" ? "select" : "review";

  const handleWorkflowStageChange = (
    stage: CatalogWorkflowStage,
  ) => {
    setIsCatalogDetailsOpen(false);
    setPanelStage(stage === "select" ? "explorer" : "workspace");
  };

  return (
    <section className="catalog-composition-panel">
      <CatalogWorkflowHeader
        stage={workflowStage}
        isGenerateOpen={isCatalogDetailsOpen}
        canGenerate={isReady && resolution.productIds.length > 0}
        showCatalogSync={Boolean(onOpenCatalogSync)}
        onStageChange={handleWorkflowStageChange}
        onOpenGenerate={() => {
          setPanelStage("workspace");
          setIsCatalogDetailsOpen(true);
        }}
        onOpenDrafts={() => setIsDraftManagerOpen(true)}
        onOpenCatalogSync={() => onOpenCatalogSync?.()}
        onReset={resetComposition}
      />

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
        title="Generar catálogo"
        description="Genera el PDF mayorista y utiliza las salidas que ya están disponibles."
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

      {panelStage === "workspace" ? (
        <section className="catalog-composition-panel__workspaceIntro">
          <header>
            <div>
              <span>Revisión</span>
              <h2>Revisa tu catálogo</h2>
              <p>
                Comprueba la composición final antes de generar la salida comercial.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setPanelStage("explorer")
              }
            >
              ← Volver a seleccionar
            </button>
          </header>
        </section>
      ) : null}

      <div
        className={[
          "catalog-composition-panel__posWorkspace",
          panelStage === "explorer"
            ? "is-explorer"
            : "is-composition",
        ].join(" ")}
      >
        <div className="catalog-composition-panel__posMain">

      {panelStage === "explorer" ? (
        <section className="catalog-composition-panel__catalogWorkspace">
          <header className="catalog-composition-panel__explorerHead">
            <div>
              <span className="catalog-composition-panel__explorerEyebrow">
                Selección
              </span>

              <h2>
                Selecciona los productos
              </h2>

              <p>
                Elige un modo de composición y define qué productos formarán el catálogo.
              </p>
            </div>

          </header>

          <CatalogCompositionModePicker
            value={composition.mode}
            onChange={changeMode}
          />

          {composition.mode !== "manual" ? (
          <div
            className="catalog-composition-panel__explorerToolbar"
            aria-label="Buscar y filtrar productos"
          >
            {composition.mode === "automatic" ? (
            <label className="catalog-composition-panel__searchField">
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                value={catalogSearchQuery}
                placeholder="Buscar por código, nombre o descripción..."
                disabled={!isReady}
                aria-label="Buscar producto en catálogo"
                onChange={(event) =>
                  setCatalogSearchQuery(
                    event.target.value,
                  )
                }
              />
            </label>
            ) : null}

            <details className="catalog-composition-panel__filterMenu">
              <summary>
                Categorías
                {composition.filters.categoryIds.length > 0 ? (
                  <span>
                    {composition.filters.categoryIds.length}
                  </span>
                ) : null}
              </summary>

              <div className="catalog-composition-panel__filterPopover">
                <div className="catalog-composition-panel__filterPopoverHead">
                  <strong>Categorías</strong>
                  <small>Selección múltiple</small>
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
            </details>

            <details className="catalog-composition-panel__filterMenu">
              <summary>
                Campañas
                {composition.filters.campaignIds.length > 0 ? (
                  <span>
                    {composition.filters.campaignIds.length}
                  </span>
                ) : null}
              </summary>

              <div className="catalog-composition-panel__filterPopover">
                <div className="catalog-composition-panel__filterPopoverHead">
                  <strong>Campañas activas</strong>
                  <small>Oportunidades comerciales</small>
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
                            !isReady
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
            </details>

            {(composition.mode === "automatic" && catalogSearchQuery) ||
            activeFilterCount > 0 ? (
              <button
                type="button"
                className="catalog-composition-panel__clearExplorer"
                onClick={() => {
                  setCatalogSearchQuery("");

                  setComposition(
                    (current) => ({
                      ...current,
                      filters: {
                        ...current.filters,
                        categoryIds: [],
                        campaignIds: [],
                      },
                    }),
                  );
                }}
              >
                Limpiar filtros
              </button>
            ) : null}
          </div>
          ) : null}

          {composition.mode === "automatic" ? (
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
          ) : null}

          {composition.mode === "hybrid" ? (
            <CatalogHybridAdjuster
              products={products}
              automaticProductIds={resolution.automaticProductIds}
              includedProductIds={composition.overrides.includedProductIds}
              excludedProductIds={composition.overrides.excludedProductIds}
              isReady={isReady}
              onProductAction={applyHybridProductAction}
            />
          ) : null}

          {composition.mode === "manual" ? (
            <CatalogManualSelector
              products={products}
              includedProductIds={composition.overrides.includedProductIds}
              isReady={isReady}
              onToggleProduct={toggleManualProduct}
            />
          ) : null}

          <footer className="catalog-composition-panel__explorerNext">
            <div>
              <span>Resultado actual</span>
              <strong>
                {resolution.productIds.length} productos seleccionados
              </strong>
            </div>

            <button
              type="button"
              disabled={
                !isReady ||
                resolution.productIds.length === 0
              }
              onClick={() =>
                setPanelStage("workspace")
              }
            >
              Revisar catálogo →
            </button>
          </footer>
        </section>
      ) : null}

      {panelStage === "workspace" ? (
        <CatalogCompositionPreview
          products={resolution.products}
          isReady={isReady}
        />
      ) : null}

              </div>

        {panelStage === "workspace" ? (
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
        ) : null}
      </div>
    </section>
  );
}
