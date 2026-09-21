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
}

export default function ProductAdminCard({
  product,
  campaignsById,
  onSelect,
}: ProductAdminCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const presentation = resolveProductAdminPresentation(product);
  const campaigns = (product.campaigns ?? [])
    .map((campaignId) => campaignsById.get(campaignId))
    .filter((campaign): campaign is Campaign => Boolean(campaign));
  const visibleCampaigns = campaigns.slice(0, 2);
  const hiddenCampaignCount = campaigns.length - visibleCampaigns.length;

  useEffect(() => {
    setHasImageError(false);
  }, [product.img]);

  return (
    <article className="product-admin-card">
      <button
        className="product-admin-card__open"
        type="button"
        aria-label={`Ver detalle de ${product.title}`}
        onClick={onSelect}
      />
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
            <span aria-hidden="true">▧</span>
            <strong>Sin imagen</strong>
          </div>
        )}
      </div>

      <div className="product-admin-card__content">
        <span className="product-admin-card__category">{product.category}</span>
        <h2>{product.title}</h2>

        <div className="product-admin-card__pricing">
          <strong>{presentation.unitPriceLabel}</strong>
          <small>{presentation.volumePriceLabel}</small>
        </div>

        <span className={`product-admin-card__stock is-${presentation.stockTone}`}>
          {presentation.stockLabel}
        </span>

        <div className="product-admin-card__meta">
          <code>{product.id}</code>

          {visibleCampaigns.length > 0 ? (
            <div className="product-admin-card__campaigns">
              {visibleCampaigns.map((campaign) => (
                <span key={campaign.id}>{campaign.name}</span>
              ))}
              {hiddenCampaignCount > 0 ? (
                <span>+{hiddenCampaignCount}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
