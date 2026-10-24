import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images, Package, Tag, Send } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Campaign, Product } from "@wooly/contracts/types/product";
import { resolveProductAdminPresentation } from "@/modules/products-admin/presentation/ProductAdminPresentation";
import { resolveProductAdminOperationalState } from "@/modules/products-admin/domain/ProductAdminOperationalState";

import "./ProductDetailDrawer.css";

interface ProductDetailDrawerProps {
  product: Product | null;
  campaigns: readonly Campaign[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish?: (product: Product) => void;
  publishing?: boolean;
}

const PRICE_TIERS = [
  [1, "price_1"],
  [3, "price_3"],
  [12, "price_12"],
  [50, "price_50"],
  [100, "price_100"],
] as const;

const formatMoney = (value: number) => new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
}).format(value);

const isValidPrice = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

function getImages(product: Product): string[] {
  const candidates = [product.img, ...(product.gallery?.split("|") ?? [])];
  return [...new Set(candidates.map((url) => url.trim()).filter(Boolean))];
}

export default function ProductDetailDrawer({
  product,
  campaigns,
  open,
  onOpenChange,
  onPublish,
  publishing = false,
}: ProductDetailDrawerProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setHasImageError(false);
  }, [product?.id, product?.img, product?.gallery]);

  if (!product) return null;

  const images = getImages(product);
  const selectedIndex = Math.min(activeImageIndex, Math.max(0, images.length - 1));
  const activeImage = images[selectedIndex];
  const canPublish = Boolean(onPublish) && !["publicado", "published"].includes(String(product.status ?? "").toLowerCase());
  const presentation = resolveProductAdminPresentation(product);
  const operationalState = resolveProductAdminOperationalState(product, {
    imageLoadFailed: hasImageError,
  });
  const campaignNames = (product.campaigns ?? [])
    .map((campaignId) => campaigns.find((campaign) => campaign.id === campaignId))
    .filter((campaign): campaign is Campaign => Boolean(campaign));
  const priceTiers = PRICE_TIERS
    .map(([quantity, field]) => ({ quantity, price: product[field] }))
    .filter((tier): tier is {
      quantity: (typeof PRICE_TIERS)[number][0];
      price: number;
    } => isValidPrice(tier.price));

  const selectImage = (index: number) => {
    setActiveImageIndex(index);
    setHasImageError(false);
  };
  const moveImage = (offset: number) => {
    selectImage((selectedIndex + offset + images.length) % images.length);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="product-detail-drawer !w-[min(95vw,760px)] !max-w-[760px]">
        <SheetHeader className="product-detail-drawer__header">
          <div className="product-detail-drawer__topline">
            <span className="product-detail-drawer__heading">Detalle del producto</span>
            <span className={`product-detail-drawer__status ${presentation.policy.status === "publicado" ? "is-published" : "is-pending"}`}>
              <i aria-hidden="true" />{presentation.statusLabel}
            </span>
          </div>
          <SheetTitle>{product.title}</SheetTitle>
          <SheetDescription className="sr-only">Información y operaciones administrativas del producto</SheetDescription>
          <div className="product-detail-drawer__eyebrow">
            <code>Código: {product.code?.trim() || "Sin código"}</code>
            <span className="product-detail-drawer__category">{product.category}</span>
            <span className="product-detail-drawer__identifier">Código de barras: {product.barcode ?? "Sin asignar"}</span>
            <span className="product-detail-drawer__identifier">SUNAT: {product.sunatCode ?? "Sin asignar"}</span>
          </div>
        </SheetHeader>
        <div className="product-detail-drawer__body">
          <section className="product-detail-drawer__overview" aria-label="Resumen operativo">
            <div className="product-detail-drawer__overviewData">
              <div className="product-detail-drawer__summary">
                <div className={presentation.offerPriceLabel ? "is-offer" : undefined}>
                  <Tag size={17} aria-hidden="true" />
                  <span>{presentation.offerPriceLabel ? "Precio oferta" : "Precio unitario"}</span>
                  <strong>{presentation.offerPriceLabel ?? presentation.unitPriceLabel}</strong>
                </div>
                <div>
                  <Package size={17} aria-hidden="true" />
                  <span>Inventario</span>
                  <strong className={`is-${presentation.stockTone}`}>{presentation.stockLabel}</strong>
                </div>
              </div>
              <div className="product-detail-drawer__operations">
                <strong>Operaciones</strong>
                {canPublish ? (
                  <button type="button" disabled={publishing} onClick={() => onPublish?.(product)}>
                    <Send size={15} aria-hidden="true" />
                    {publishing ? "Preparando publicación…" : "Publicar producto"}
                  </button>
                ) : (
                  <span>{presentation.policy.status === "publicado" ? "Producto publicado" : "Sin acciones disponibles"}</span>
                )}
              </div>
            </div>
            <div className="product-detail-drawer__gallery" role="group" aria-label="Referencia visual del producto">
              <div className="product-detail-drawer__media">
                {activeImage && !hasImageError ? (
                  <img src={activeImage} alt={product.title} onError={() => setHasImageError(true)} />
                ) : (
                  <div role="img" aria-label={`Imagen no disponible para ${product.title}`}>
                    <Images size={22} aria-hidden="true" />
                    <strong>Imagen no disponible</strong>
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="product-detail-drawer__galleryNav">
                  <button type="button" aria-label="Imagen anterior" onClick={() => moveImage(-1)}>
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <span>{selectedIndex + 1} / {images.length}</span>
                  <button type="button" aria-label="Imagen siguiente" onClick={() => moveImage(1)}>
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </section>
          <section className="product-detail-drawer__section product-detail-drawer__prices">
            <h3>Listado de precios</h3>
            {priceTiers.length > 0 ? (
              <div className="product-detail-drawer__priceList">
                {priceTiers.map((tier) => (
                  <div key={tier.quantity} className="product-detail-drawer__priceRow">
                    <span>Desde {tier.quantity} un.</span>
                    <strong>{formatMoney(tier.price)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p>Este producto no tiene precios registrados.</p>
            )}
          </section>

          <section className="product-detail-drawer__section">
            <h3>Información adicional</h3>
            <div className="product-detail-drawer__additional">
              <div><span>Prioridad</span><strong>{product.priority ?? "No especificada"}</strong></div>
              <div><span>Imágenes</span><strong>{images.length}</strong></div>
            </div>
          </section>

          <section className="product-detail-drawer__section">
            <h3>Campañas</h3>
            {campaignNames.length > 0 ? (
              <div className="product-detail-drawer__campaigns">
                {campaignNames.map((campaign) => <span key={campaign.id}>{campaign.name}</span>)}
              </div>
            ) : <p>Sin campañas asociadas.</p>}
          </section>

          <section className="product-detail-drawer__section">
            <h3>Descripción</h3>
            <p>{product.description?.trim() || "Sin descripción comercial."}</p>
          </section>

          <section className="product-detail-drawer__section product-detail-drawer__twoColumns">
            <div>
              <h3>Medios</h3>
              <p>
                {hasImageError
                  ? "La imagen principal no está disponible."
                  : product.img
                    ? "Imagen principal registrada."
                    : "Sin imagen principal."}
              </p>
              {product.gallery?.trim()
                ? <p>Galería registrada.</p>
                : <p>Sin galería adicional.</p>}
            </div>
            <div>
              <h3>Observaciones</h3>
              {operationalState.observations.length > 0 ? (
                <div className="product-detail-drawer__badges">
                  {operationalState.observations.map((observation) => <span key={observation}>{observation}</span>)}
                </div>
              ) : <p>Sin observaciones comerciales.</p>}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
