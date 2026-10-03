import { Menu, Package, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { HeaderCampaignFilter } from "@/modules/catalog/components/HeaderCampaignFilter";
import type { HeaderCampaignOption } from "@/modules/catalog/components/HeaderCampaignFilter";
import { HeaderCategoryFilter } from "@/modules/catalog/components/HeaderCategoryFilter";
import { SearchInput } from "@/modules/search/components/SearchInput";
import { getApplicationConfig } from "@/shared/config/application";
import type { Category, Product } from "@/shared/types/product";

import "./CatalogTopNav.css";

const applicationConfig = getApplicationConfig();

interface CatalogTopNavProps {
  products: Product[];

  searchQuery: string;
  onSearchChange: (query: string) => void;

  categories: Category[];
  activeCategory: string;
  categoryCounts?: Record<string, number>;
  onCategorySelect: (id: string) => void;

  campaigns: ReadonlyArray<HeaderCampaignOption>;
  activeCampaign: string;
  campaignCounts?: Record<string, number>;
  showCampaigns?: boolean;
  onCampaignSelect: (id: string) => void;

  cartCount: number;
  onCartClick: () => void;
  onExploreClick: () => void;

  searchPlaceholder?: string;
}

export function CatalogTopNav({
  products,
  searchQuery,
  onSearchChange,

  categories,
  activeCategory,
  categoryCounts = {},
  onCategorySelect,

  campaigns,
  activeCampaign,
  campaignCounts = {},
  showCampaigns = false,
  onCampaignSelect,

  cartCount,
  onCartClick,
  onExploreClick,

  searchPlaceholder = "Buscar productos...",
}: CatalogTopNavProps) {
  const hasCampaignSection = showCampaigns && campaigns.length > 0;
  const cartLabel =
    cartCount === 0
      ? "Sin productos"
      : `${cartCount} ${cartCount === 1 ? "producto" : "productos"}`;

  return (
    <nav
      className="catalogTopNav"
      aria-label="Navegación principal del catálogo"
    >
      <div className="catalogTopNavInner">
        <div className="catalogTopNavMain">
          <Link
            to="/"
            className="catalogTopNavBrand"
            aria-label="Ir al inicio de Wooly"
          >
            <img
              src={applicationConfig.assets.logoUrl}
              alt="Wooly Imports"
            />
          </Link>

          <section
            className="catalogTopNavSearch"
            aria-label="Buscador del catálogo"
          >
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              products={products}
              placeholder={searchPlaceholder}
            />
          </section>

          <button
            type="button"
            className="catalogTopNavCart"
            onClick={onCartClick}
            aria-label={`Abrir Mi Caja. ${cartLabel}`}
          >
            <span className="catalogTopNavCartIcon" aria-hidden="true">
              <Package />
            </span>

            <span className="catalogTopNavCartCopy">
              <strong>Mi Caja</strong>
            </span>

            <span
              className="catalogTopNavCartCount"
              aria-hidden="true"
            >
              {cartCount}
            </span>
          </button>
        </div>

        <div className="catalogTopNavDiscovery">
          <div className="catalogTopNavCategoryBar">
            <button
              type="button"
              className="catalogTopNavExplore"
              onClick={onExploreClick}
              aria-label="Explorar categorías y campañas"
            >
              <Menu aria-hidden="true" />
              <span>Explorar</span>
            </button>

            <section
              className="catalogTopNavSection catalogTopNavCategories"
              aria-label="Categorías del catálogo"
            >
              <HeaderCategoryFilter
                categories={categories}
                active={activeCategory}
                counts={categoryCounts}
                onSelect={onCategorySelect}
              />
            </section>
          </div>

          {hasCampaignSection && (
            <div className="catalogTopNavCampaignBar">
              <div className="catalogTopNavCampaignLabel">
                <Sparkles aria-hidden="true" />
                <span>Campañas</span>
              </div>

              <section
                className="catalogTopNavSection catalogTopNavCampaigns"
                aria-label="Campañas activas"
              >
                <HeaderCampaignFilter
                  campaigns={campaigns}
                  active={activeCampaign}
                  counts={campaignCounts}
                  show={hasCampaignSection}
                  onSelect={onCampaignSelect}
                />
              </section>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
