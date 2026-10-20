import {
  Check,
  Eye,
  Package,
  Upload,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import type {
  Campaign,
  Product,
} from "@wooly/contracts/types/product";
import {
  resolveProductAdminPresentation,
} from "@/modules/products-admin/presentation/ProductAdminPresentation";

import ProductCategoryPlaceholder from "../ProductCategoryPlaceholder";

import "./ProductAdminCard.css";

interface ProductAdminCardProps {
  product: Product;
  campaignsById: ReadonlyMap<string, Campaign>;
  onSelect: () => void;
  onPublish?: (() => void) | undefined;
  publishing?: boolean;
  publishDisabled?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (() => void) | undefined;
}

export default function ProductAdminCard({
  product,
  campaignsById,
  onSelect,
  onPublish,
  publishing = false,
  publishDisabled = false,
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
        {product.img.trim() && !hasImageError ? (
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
            <ProductCategoryPlaceholder category={product.category} />
          </div>
        )}
      </div>

      <div className="product-admin-card__content">
        <div className="product-admin-card__identity">
          <code>{product.code?.trim() || "Sin código"}</code>
          <span className="product-admin-card__category">
            {product.category}
          </span>
        </div>
        <h2 title={product.title}>{product.title}</h2>
        <span className={
          "product-admin-card__status " +
          (presentation.policy.status === "publicado" ? "is-published" : "is-pending")
        }>
          <i aria-hidden="true" />{presentation.statusLabel}
        </span>

        <div className="product-admin-card__pricing">
          <span className="product-admin-card__priceCaption">
            {presentation.offerPriceLabel ? "Oferta" : "Precio unitario"}
          </span>
          <strong>{presentation.offerPriceLabel ?? presentation.unitPriceLabel}</strong>
          {presentation.offerPriceLabel && (
            <span className="product-admin-card__previousPrice">
              Precio normal <del>{presentation.unitPriceLabel}</del>
            </span>
          )}
        </div>

        <span
          className={
            `product-admin-card__stock is-${presentation.stockTone}`
          }
        >
          <Package size={13} aria-hidden="true" />
          {presentation.stockLabel}
        </span>

        <section className="product-admin-card__volume" aria-label="Precios por volumen">
          <div className="product-admin-card__volumeGrid">
            {presentation.volumeTiers.map((tier) => (
              <div key={tier.quantity} className="product-admin-card__volumeTier">
                <span>{tier.quantity === 3 ? "Mayor (3u)" : "Docena (12u)"}</span>
                <strong>{tier.priceLabel}</strong>
              </div>
            ))}
          </div>
          <small>{presentation.volumePriceLabel}</small>
        </section>
        <div className="product-admin-card__meta">
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
      <div className="product-admin-card__actions">
        <button type="button" onClick={onSelect}>
          <Eye size={15} aria-hidden="true" />Ver detalle
        </button>
        {onPublish && presentation.policy.status !== "publicado" && (
          <button type="button" className="product-admin-card__publish"
            aria-label={"Publicar " + product.title}
            disabled={publishDisabled || publishing} onClick={onPublish}>
            <Upload size={15} aria-hidden="true" />
            {publishing ? "Publicando…" : "Publicar"}
          </button>
        )}
      </div>
    </article>
  );
}