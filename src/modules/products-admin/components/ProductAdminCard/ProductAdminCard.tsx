import {
  Check,
  ImageOff,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import type {
  Campaign,
  Product,
} from "@/shared/types/product";
import {
  resolveProductAdminPresentation,
} from "@/modules/products-admin/presentation/ProductAdminPresentation";

import "./ProductAdminCard.css";

interface ProductAdminCardProps {
  product: Product;
  campaignsById: ReadonlyMap<string, Campaign>;
  onSelect: () => void;
  isSelected?: boolean;
  onToggleSelection?: (() => void) | undefined;
}

export default function ProductAdminCard({
  product,
  campaignsById,
  onSelect,
  isSelected = false,
  onToggleSelection,
}: ProductAdminCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const presentation = resolveProductAdminPresentation(product);

  const campaigns = (product.campaigns ?? [])
    .map((campaignId) => campaignsById.get(campaignId))
    .filter((campaign): campaign is Campaign => Boolean(campaign));

  const visibleCampaigns = campaigns.slice(0, 2);
  const hiddenCampaignCount =
    campaigns.length - visibleCampaigns.length;

  useEffect(() => {
    setHasImageError(false);
  }, [product.img]);

  return (
    <article
      className={
        isSelected
          ? "product-admin-card is-selected"
          : "product-admin-card"
      }
    >
      <button
        className="product-admin-card__open"
        type="button"
        aria-label={`Ver detalle de ${product.title}`}
        onClick={onSelect}
      />

      {onToggleSelection ? (
        <button
          className="product-admin-card__selection"
          type="button"
          aria-pressed={isSelected}
          aria-label={
            isSelected
              ? `Quitar ${product.title} de la selección`
              : `Seleccionar ${product.title}`
          }
          onClick={onToggleSelection}
        >
          {isSelected ? (
            <Check
              size={15}
              strokeWidth={2.4}
              aria-hidden="true"
            />
          ) : null}
        </button>
      ) : null}

      <div className="product-admin-card__media">
        {product.img && !hasImageError ? (
          <img
            src={product.img}
            alt={product.title}
            loading="lazy"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div
            className="product-admin-card__imageFallback"
            role="img"
            aria-label={`Imagen no disponible para ${product.title}`}
          >
            <ImageOff
              size={21}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <strong>Sin imagen</strong>
          </div>
        )}
      </div>

      <div className="product-admin-card__content">
        <span className="product-admin-card__category">
          {product.category}
        </span>

        <h2>{product.title}</h2>

        <div className="product-admin-card__pricing">
          <strong>
            {presentation.unitPriceLabel}
          </strong>

          <small>
            {presentation.volumePriceLabel}
          </small>
        </div>

        <span
          className={
            `product-admin-card__stock is-${presentation.stockTone}`
          }
        >
          {presentation.stockLabel}
        </span>

        <div className="product-admin-card__meta">
          <code>{product.sku ?? product.id}</code>

          {visibleCampaigns.length > 0 ? (
            <div className="product-admin-card__campaigns">
              {visibleCampaigns.map((campaign) => (
                <span key={campaign.id}>
                  {campaign.name}
                </span>
              ))}

              {hiddenCampaignCount > 0 ? (
                <span>
                  +{hiddenCampaignCount}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}