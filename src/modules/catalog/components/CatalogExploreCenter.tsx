import { useEffect } from "react";
import type { Campaign, Category } from "@/shared/types/product";

import "@/shared/styles/catalog/catalog-explore-center.css";

type CatalogExploreCampaign = Pick<
  Campaign,
  "id" | "name" | "icon" | "colorClass"
>;

interface Props {
  open: boolean;

  activeCampaign: string;
  activeCategory: string;

  activeCampaignName?: string;
  activeCategoryName?: string;

  campaignCounts: Record<string, number>;
  categoryCounts: Record<string, number>;

  categories: ReadonlyArray<Category>;
  campaigns: ReadonlyArray<CatalogExploreCampaign>;

  cartCount: number;

  onClose: () => void;
  onResetCatalog?: () => void;
  onCampaignSelect: (id: string) => void;
  onCategorySelect: (id: string) => void;
  onOpenCart: () => void;
}

export function CatalogExploreCenter({
  open,
  activeCampaign,
  activeCategory,
  activeCampaignName,
  activeCategoryName,
  campaignCounts,
  categoryCounts,
  categories,
  campaigns,
  cartCount,
  onClose,
  onResetCatalog,
  onCampaignSelect,
  onCategorySelect,
  onOpenCart,
}: Props) {
  useEffect(
    () => {
      if (!open) {
        return;
      }

      const previousOverflow =
        document.body.style.overflow;

      document.body.style.overflow =
        "hidden";

      const handleKeyDown =
        (
          event:
            KeyboardEvent,
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            onClose();
          }
        };

      window.addEventListener(
        "keydown",
        handleKeyDown,
      );

      return () => {
        document.body.style.overflow =
          previousOverflow;

        window.removeEventListener(
          "keydown",
          handleKeyDown,
        );
      };
    },
    [
      open,
      onClose,
    ],
  );

  if (!open) return null;

  const visibleCampaigns = campaigns.filter((campaign) => {
    const count = campaignCounts[campaign.id] ?? 0;

    return count > 0 || activeCampaign === campaign.id;
  });

  const visibleCategories = categories.filter(
    (c) => c.id === "todas" || (categoryCounts[c.id] ?? 0) > 0,
  );

  const hasFilters = Boolean(activeCampaign || activeCategory !== "todas");

  const clearFilters = () => {
    if (onResetCatalog) {
      onResetCatalog();
    } else {
      onCampaignSelect("");
      onCategorySelect("todas");
    }

    onClose();
  };

  return (
    <div className="catalog-explore-overlay" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-explore-title"
        className="catalog-explore-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="catalog-explore-handle" />

        <header className="catalog-explore-head">
          <div>
            <h3
              id="catalog-explore-title"
              className="catalog-explore-title"
            >
              Explorar catálogo
            </h3>
            <p className="catalog-explore-subtitle">
              Campañas, categorías y accesos rápidos
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="catalog-explore-close"
            aria-label="Cerrar explorar catálogo"
          >
            Cerrar
          </button>
        </header>

        {hasFilters && (
          <div className="catalog-explore-active">
            {activeCampaign && (
              <button type="button" onClick={() => onCampaignSelect("")}>
                {activeCampaignName} ✕
              </button>
            )}

            {activeCategory !== "todas" && (
              <button type="button" onClick={() => onCategorySelect("todas")}>
                {activeCategoryName} ✕
              </button>
            )}
          </div>
        )}

        <div className="catalog-explore-campaign-grid">
          {visibleCampaigns.map((campaign) => {
            const isActive = activeCampaign === campaign.id;
            const count = campaignCounts[campaign.id] ?? 0;

            return (
              <button
                key={campaign.id}
                type="button"
                onClick={() => onCampaignSelect(isActive ? "" : campaign.id)}
                className={[
                  "catalog-explore-campaign",
                  campaign.colorClass,
                  isActive ? "active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={isActive}
                title={campaign.name}
              >
                <span>
                  <strong>{campaign.name}</strong>

                  <small>
                    {count} {count === 1 ? "producto" : "productos"}
                  </small>
                </span>

                <b aria-hidden="true">{campaign.icon}</b>
              </button>
            );
          })}
        </div>

        <section className="catalog-explore-section">
          <h4>🛍️ Categorías</h4>

          <div className="catalog-explore-category-grid">
            {visibleCategories.map((c) => {
              const count = categoryCounts[c.id] ?? 0;
              const isActive = activeCategory === c.id;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCategorySelect(c.id)}
                  className={`catalog-explore-category ${
                    isActive ? "active" : ""
                  }`}
                >
                  <span className="catalog-explore-category-icon">
                    {c.icon}
                  </span>
                  <strong>{c.name}</strong>
                  <small>({count})</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="catalog-explore-section">
          <h4>⚡ Accesos rápidos</h4>

          <div className="catalog-explore-quick-grid">
            <button type="button" onClick={clearFilters}>
              Ver todo
            </button>
            <button type="button">Más vendidos</button>
            <button type="button">Recomendados</button>
            <button type="button">Ofertas</button>
          </div>
        </section>

        <section className="catalog-explore-footer-actions">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCart();
            }}
          >
            📦 Mi Caja ({cartCount})
          </button>

          <a
            href={buildApplicationWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 Asesora
          </a>
        </section>
      </aside>
    </div>
  );
}
import { buildApplicationWhatsAppUrl } from "@/shared/config/application";
