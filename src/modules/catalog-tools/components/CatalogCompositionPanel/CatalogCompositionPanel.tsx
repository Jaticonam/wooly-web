import {
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Database,
  FolderOpen,
  Megaphone,
  Plus,
  Tag,
} from "lucide-react";

import type {
  CatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import {
  createCatalogContentSourcesComposition,
  setCatalogContentCampaignIds,
  setCatalogContentCategoryIds,
  setCatalogContentProductOverrides,
  usesCatalogContentSources,
} from "@/modules/catalog-tools/domain/CatalogContentSources";

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


import CatalogCompositionPreview from "@/modules/catalog-tools/components/CatalogCompositionPreview/CatalogCompositionPreview";

import {
  createDefaultCatalogPublicationIdentity,
  type CatalogPublicationIdentity,
} from "@/modules/catalog/domain/CatalogPublicationIdentity";

import CatalogDraftManager from "@/modules/catalog-tools/components/CatalogDraftManager/CatalogDraftManager";
import CatalogPublishCheckout from "@/modules/catalog-tools/components/CatalogPublishCheckout/CatalogPublishCheckout";

import CatalogCompositionBoard from "@/modules/catalog-tools/components/CatalogCompositionBoard/CatalogCompositionBoard";

import AdminModal from "@/modules/admin/components/AdminModal/AdminModal";

import "./CatalogCompositionPanel.css";
import "./CatalogWorkspaceFoundation.css";

interface CatalogCompositionPanelProps {
  initialProductIds?:
    readonly string[];
  products: readonly Product[];
  campaigns: readonly Campaign[];
  isReady: boolean;
  onBackToProducts?: () => void;
  onOpenCatalogSync?: () => void;
}

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

export default function CatalogCompositionPanel({
    initialProductIds = [],
products,
  campaigns,
  isReady,
  onBackToProducts,
  onOpenCatalogSync,
}: CatalogCompositionPanelProps) {
  const [
    isCatalogDetailsOpen,
    setIsCatalogDetailsOpen,
  ] = useState(
    false,
  );

  const [
    isPreviewOpen,
    setIsPreviewOpen,
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
    isProductAdjusterOpen,
    setIsProductAdjusterOpen,
  ] = useState(
    false,
  );

  const [
    composition,
    setComposition,
  ] = useState<CatalogComposition>(
    () =>
      createCatalogContentSourcesComposition(
        initialProductIds,
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

  const categoryOptions =
    useMemo(
      () =>
        SELECTABLE_CATEGORIES.map(
          (category) => {
            const optionComposition =
              createCatalogContentSourcesComposition();

            optionComposition.filters
              .categoryIds = [
                category.id,
              ];

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
      ],
    );
  const campaignOptions =
    useMemo(
      () =>
        activeCampaigns
          .map(
            (campaign) => {
              const optionComposition =
                createCatalogContentSourcesComposition();

              optionComposition.filters
                .campaignIds = [
                  campaign.id,
                ];

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
              campaign.count >
              0,
          ),
      [
        products,
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

  const isContentSourcesModel =
    usesCatalogContentSources(
      composition,
    );

  const workspaceProducts =
    resolution.products;

  const compositionLabel =
    isContentSourcesModel
      ? "Fuentes acumulativas"
      : "Selección histórica";
  const categorySummary =
    selectedCategoryLabels.length > 0
      ? selectedCategoryLabels.join(
          ", ",
        )
      : isContentSourcesModel
        ? "Sin categorías añadidas"
        : "Todas las categorías";

  const campaignSummary =
    selectedCampaignLabels.length > 0
      ? selectedCampaignLabels.join(
          ", ",
        )
      : isContentSourcesModel
        ? "Sin campañas añadidas"
        : "Sin campaña específica";

  const toggleCategory =
    (
      categoryId: string,
    ) => {
      setComposition(
        (current) =>
          setCatalogContentCategoryIds(
            current,

            toggleValue(
              current.filters
                .categoryIds,
              categoryId,
            ),
          ),
      );
    };

  const toggleCampaign =
    (
      campaignId: string,
    ) => {
      setComposition(
        (current) =>
          setCatalogContentCampaignIds(
            current,

            toggleValue(
              current.filters
                .campaignIds,
              campaignId,
            ),
          ),
      );
    };

  const openProductAdjuster =
    () => {
      setIsProductAdjusterOpen(
        true,
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

          return setCatalogContentProductOverrides(
            current,
            includedProductIds,
            excludedProductIds,
          );
        },
      );
    };
  const resetComposition =
    () => {
      setComposition(
        createCatalogContentSourcesComposition(),
      );

      setIsProductAdjusterOpen(
        false,
      );

      setPublicationIdentity(
        createDefaultCatalogPublicationIdentity(),
      );
    };
  return (
    <section className="catalog-composition-panel">
      <header className="catalog-workspace__hero">
        <div className="catalog-workspace__heroCopy">
          <div className="catalog-workspace__kicker">
            <span>
              CATALOG WORKSPACE
            </span>

            <small>
              Composición comercial
            </small>
          </div>

          <h1>
            Catálogos
          </h1>

          <p>
            Combina categorías, campañas y productos. Cada fuente se acumula en una sola composición comercial.
          </p>
        </div>

        <div className="catalog-workspace__heroActions">
          <button
            type="button"
            onClick={() =>
              setIsDraftManagerOpen(
                true,
              )
            }
          >
            <FolderOpen
              size={15}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            Mis catálogos
          </button>

          {onOpenCatalogSync ? (
            <button
              type="button"
              onClick={
                onOpenCatalogSync
              }
            >
              <Database
                size={15}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              Datos
            </button>
          ) : null}

          <button
            type="button"
            onClick={
              resetComposition
            }
          >
            <Plus
              size={15}
              strokeWidth={2}
              aria-hidden="true"
            />

            Nuevo
          </button>

          {onBackToProducts ? (
            <button
              type="button"
              className="is-back"
              onClick={
                onBackToProducts
              }
            >
              <ArrowLeft
                size={15}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              Product Explorer
            </button>
          ) : null}
        </div>
      </header>

      <section
        className="catalog-workspace__metrics"
        aria-label="Resumen de la composición"
      >
        <article className="is-primary">
          <span>
            Incluidos
          </span>

          <strong>
            {isReady
              ? workspaceProducts.length
              : "—"}
          </strong>
        </article>

        <article>
          <span>
            Categorías
          </span>

          <strong>
            {
              composition.filters
                .categoryIds
                .length
            }
          </strong>
        </article>

        <article>
          <span>
            Campañas
          </span>

          <strong>
            {
              composition.filters
                .campaignIds
                .length
            }
          </strong>
        </article>

        <article>
          <span>
            Productos
          </span>

          <strong>
            {
              composition.overrides
                .includedProductIds
                .length
            }
          </strong>
        </article>
      </section>
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

            setIsProductAdjusterOpen(
              false,
            );

            setIsDraftManagerOpen(
              false,
            );
          }}
          onNewComposition={() => {
            setComposition(
              createCatalogContentSourcesComposition(),
            );

            setIsProductAdjusterOpen(
              false,
            );

            setIsDraftManagerOpen(
              false,
            );
          }}
        />
      </AdminModal>

      <AdminModal
        open={
          isPreviewOpen
        }
        size="large"
        title="Vista previa"
        description="Revisa la composición comercial sin salir del workspace."
        onClose={() =>
          setIsPreviewOpen(
            false,
          )
        }
      >
        <CatalogCompositionPreview
          products={
            workspaceProducts
          }
          isReady={
            isReady
          }
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
            compositionLabel
          }
          categorySummary={
            categorySummary
          }
          campaignSummary={
            campaignSummary
          }
        />
      </AdminModal>

      <div className="catalog-workspace__layout">
        <aside className="catalog-workspace__builder">
          <section className="catalog-workspace__scope">
            <div className="catalog-workspace__sectionHeading">
              <span>
                01
              </span>

              <div>
                <strong>
                  Define el contenido
                </strong>

                <small>
                  Combina categorías, campañas y productos.
                </small>
              </div>
            </div>

            {!isContentSourcesModel ? (
              <div className="catalog-workspace__scopeHint">
                <strong>
                  Selección histórica
                </strong>

                <span>
                  Este borrador conserva su lógica anterior. Al modificar una fuente pasará al modelo acumulativo V2.
                </span>
              </div>
            ) : null}

            <div className="catalog-workspace__scopeFilters">
              <details open>
                <summary>
                  <Tag
                    size={14}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Categorías
                  </span>

                  <small>
                    {composition.filters.categoryIds.length > 0
                      ? `${composition.filters.categoryIds.length} añadida${composition.filters.categoryIds.length === 1 ? "" : "s"}`
                      : "Sin añadir"}
                  </small>
                </summary>

                <div className="catalog-workspace__scopePopover">
                  {categoryOptions.map(
                    (category) => {
                      const isActive =
                        composition.filters.categoryIds.includes(
                          category.id,
                        );

                      return (
                        <button
                          type="button"
                          key={
                            category.id
                          }
                          disabled={
                            !isReady ||
                            category.count === 0
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
                            toggleCategory(
                              category.id,
                            )
                          }
                        >
                          <span>
                            {category.label}
                          </span>

                          <small>
                            {category.count}
                          </small>
                        </button>
                      );
                    },
                  )}
                </div>
              </details>

              <details open>
                <summary>
                  <Megaphone
                    size={14}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Campañas
                  </span>

                  <small>
                    {composition.filters.campaignIds.length > 0
                      ? `${composition.filters.campaignIds.length} añadida${composition.filters.campaignIds.length === 1 ? "" : "s"}`
                      : "Sin añadir"}
                  </small>
                </summary>

                <div className="catalog-workspace__scopePopover">
                  {campaignOptions.length > 0 ? (
                    campaignOptions.map(
                      (campaign) => {
                        const isActive =
                          composition.filters.campaignIds.includes(
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
                            className={
                              isActive
                                ? "is-active"
                                : ""
                            }
                            aria-pressed={
                              isActive
                            }
                            onClick={() =>
                              toggleCampaign(
                                campaign.id,
                              )
                            }
                          >
                            <span>
                              {campaign.label}
                            </span>

                            <small>
                              {campaign.count}
                            </small>
                          </button>
                        );
                      },
                    )
                  ) : (
                    <span className="catalog-workspace__emptyFilter">
                      No hay campañas activas.
                    </span>
                  )}
                </div>
              </details>

              <details open>
                <summary>
                  <Plus
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <span>
                    Productos
                  </span>

                  <small>
                    {composition.overrides.includedProductIds.length === 1
                      ? "1 agregado"
                      : `${composition.overrides.includedProductIds.length} agregados`}
                  </small>
                </summary>

                <div className="catalog-workspace__scopePopover">
                  <div className="catalog-workspace__customScope">
                    <div>
                      <strong>
                        Productos específicos
                      </strong>

                      <span>
                        Añade productos individuales sin borrar categorías ni campañas.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={
                        openProductAdjuster
                      }
                    >
                      Gestionar productos
                    </button>
                  </div>
                </div>
              </details>
            </div>

            <div className="catalog-workspace__scopeHint">
              <strong>
                {isReady
                  ? `${workspaceProducts.length} productos incluidos`
                  : "Calculando composición"}
              </strong>

              <span>
                Resultado acumulado de categorías + campañas + productos, sin duplicados.
              </span>
            </div>
          </section>          <section className="catalog-workspace__settings">
            <div className="catalog-workspace__sectionHeading">
              <span>
                03
              </span>

              <div>
                <strong>
                  Configuración
                </strong>

                <small>
                  Identidad del borrador comercial.
                </small>
              </div>
            </div>

            <label className="catalog-workspace__titleField">
              <span>
                Título del catálogo
              </span>

              <input
                type="text"
                value={
                  publicationIdentity.title
                }
                placeholder="Ej. Catálogo mayorista octubre"
                onChange={(event) =>
                  setPublicationIdentity(
                    (current) => ({
                      ...current,
                      title:
                        event.target.value,
                    }),
                  )
                }
              />
            </label>

            <div className="catalog-workspace__settingsMeta">
              <span>
                Borrador
              </span>

              <small>
                {compositionLabel}
              </small>
            </div>
          </section>
        </aside>

        <CatalogCompositionBoard
          products={
            workspaceProducts
          }
          isReady={
            isReady
          }
          onPreview={() =>
            setIsPreviewOpen(
              true,
            )
          }
          onPrepareOutput={() =>
            setIsCatalogDetailsOpen(
              true,
            )
          }
        />
      </div>

      <details
        id="catalog-product-adjustments"
        className="catalog-workspace__adjustments"
        open={
          isProductAdjusterOpen
        }
        onToggle={(event) => {
          setIsProductAdjusterOpen(
            event.currentTarget.open,
          );
        }}
      >
        <summary>
          Productos · agregar, retirar o excluir
        </summary>

        <div>
          <CatalogHybridAdjuster
            products={
              products
            }
            automaticProductIds={
              resolution.automaticProductIds
            }
            includedProductIds={
              composition.overrides.includedProductIds
            }
            excludedProductIds={
              composition.overrides.excludedProductIds
            }
            isReady={
              isReady
            }
            onProductAction={
              applyHybridProductAction
            }
          />
        </div>
      </details>
    </section>
  );
}
