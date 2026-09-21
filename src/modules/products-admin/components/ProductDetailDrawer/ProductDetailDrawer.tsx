import {
  useEffect,
  useState,
} from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import type {
  Campaign,
  Product,
} from "@/shared/types/product";
import {
  resolveProductAdminPresentation,
} from "@/modules/products-admin/presentation/ProductAdminPresentation";
import {
  resolveProductAdminOperationalState,
} from "@/modules/products-admin/domain/ProductAdminOperationalState";

import "./ProductDetailDrawer.css";

interface ProductDetailDrawerProps {
  product: Product | null;
  campaigns: readonly Campaign[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function ProductDetailDrawer({
  product,
  campaigns,
  open,
  onOpenChange,
}: ProductDetailDrawerProps) {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [product?.img]);

  if (!product) {
    return null;
  }

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="product-detail-drawer">
        <SheetHeader className="product-detail-drawer__header">
          <div className="product-detail-drawer__eyebrow">
            <code>{product.id}</code>
            <span>{product.category}</span>
          </div>
          <SheetTitle>{product.title}</SheetTitle>
          <SheetDescription>
            Detalle comercial del producto
          </SheetDescription>
        </SheetHeader>

        <div className="product-detail-drawer__body">
          <div className="product-detail-drawer__media">
            {product.img && !hasImageError ? (
              <img
                src={product.img}
                alt={product.title}
                onError={() => setHasImageError(true)}
              />
            ) : (
              <div role="img" aria-label={`Imagen no disponible para ${product.title}`}>
                <span aria-hidden="true">▧</span>
                <strong>Sin imagen principal</strong>
              </div>
            )}
          </div>

          <section className="product-detail-drawer__summary" aria-label="Resumen comercial">
            <div>
              <span>Precio unitario</span>
              <strong>{presentation.unitPriceLabel}</strong>
            </div>
            <div>
              <span>Inventario</span>
              <strong className={`is-${presentation.stockTone}`}>
                {presentation.stockLabel}
              </strong>
            </div>
            <div>
              <span>Estado</span>
              <strong className="product-detail-drawer__status">
                {presentation.statusLabel}
              </strong>
            </div>
          </section>

          <section className="product-detail-drawer__section">
            <h3>Precios por volumen</h3>
            {priceTiers.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th scope="col">Cantidad</th>
                    <th scope="col">Precio unitario</th>
                  </tr>
                </thead>
                <tbody>
                  {priceTiers.map((tier) => (
                    <tr key={tier.quantity}>
                      <td>Desde {tier.quantity} un.</td>
                      <td>{formatMoney(tier.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Este producto no tiene precios registrados.</p>
            )}
          </section>

          <section className="product-detail-drawer__section">
            <h3>Campañas</h3>
            {campaignNames.length > 0 ? (
              <div className="product-detail-drawer__campaigns">
                {campaignNames.map((campaign) => (
                  <span key={campaign.id}>{campaign.name}</span>
                ))}
              </div>
            ) : (
              <p>Sin campañas asociadas.</p>
            )}
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
              {product.gallery?.trim() ? <p>Galería registrada.</p> : <p>Sin galería adicional.</p>}
            </div>
            <div>
              <h3>Observaciones</h3>
              {operationalState.observations.length > 0 ? (
                <div className="product-detail-drawer__badges">
                  {operationalState.observations.map((observation) => (
                    <span key={observation}>{observation}</span>
                  ))}
                </div>
              ) : (
                <p>Sin observaciones comerciales.</p>
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
