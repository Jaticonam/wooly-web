import type { Product } from "@/shared/types/product";

import {
  applyProductImageFallback,
  resolveProductImageSrc,
} from "@/shared/lib/productMedia";

import { getCategoryColor } from "@/shared/config/categoryColors";

import {
  getAvailableVolumePrices,
  getBaseUnitPrice,
} from "@/shared/domain/volumePricing/VolumePricing";

import { ProductCardBadges } from "./ProductCardBadges";
import { ProductCardStock } from "./ProductCardStock";

interface ProductCaptureCardProps {
  product: Product;
  available: boolean;
  isPreventa: boolean;
}

function getVolumePriceLabel(
  qty: number,
): string {
  if (qty >= 100) return "Caja";
  if (qty >= 50) return "Medio ciento";
  if (qty >= 12) return "Docena";
  if (qty >= 3) return "Por mayor";

  return "Mayorista";
}

export function ProductCaptureCard({
  product,
  available,
  isPreventa,
}: ProductCaptureCardProps) {
  const finalPrice =
    getBaseUnitPrice(product);

  const hasOffer =
    Number.isFinite(product.price_1) &&
    product.price_1 > 0 &&
    finalPrice !== product.price_1;

  const volumePrices =
    !available || isPreventa
      ? []
      : getAvailableVolumePrices(
          product,
          {
            includeBasePrice: false,
          },
        )
          .filter(
            (tier) =>
              tier.unitPrice <
              product.price_1,
          )
          .slice(0, 4);

  return (
    <article
      data-product-capture-card
      className="flex h-[640px] w-[360px] flex-col overflow-hidden bg-white text-slate-900"
    >
      <div className="relative flex h-[448px] shrink-0 items-center justify-center overflow-hidden bg-slate-100">
        <ProductCardBadges
          product={product}
        />

        <div
          data-product-capture-image-frame
          className="relative aspect-[3/4] w-[324px] overflow-hidden rounded-[26px] bg-white shadow-[0_12px_30px_rgba(15,23,42,.14)]"
        >
          <img
            src={resolveProductImageSrc(
              product.img,
            )}
            alt={product.title}
            onError={({
              currentTarget,
            }) =>
              applyProductImageFallback(
                currentTarget,
              )
            }
            className="h-full w-full object-cover object-center"
          />
        </div>
      </div>

      <div className="flex h-[192px] min-h-0 flex-col px-4 py-2">
        <div className="flex shrink-0 items-center justify-center gap-1">
          <span className="rounded-full bg-slate-100 px-2 py-[2px] text-[8px] font-black uppercase text-slate-500">
            {product.id}
          </span>

          <span
            className={[
              "rounded-full px-2 py-[2px] text-[8px] font-black uppercase",
              getCategoryColor(
                product.category,
              ),
            ].join(" ")}
          >
            {product.category}
          </span>
        </div>

        <h3 className="mt-1 line-clamp-2 shrink-0 text-center text-[13px] font-black leading-[1.1] text-slate-900">
          {product.title}
        </h3>

        <div className="mt-1 shrink-0 text-center text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
          Precio unitario
        </div>

        {isPreventa ? (
          <div className="mt-0.5 shrink-0 text-center">
            <div className="text-[9px] font-bold text-slate-500">
              Próximamente
            </div>

            <div className="text-[17px] font-black leading-none text-green-600">
              Consultar
            </div>
          </div>
        ) : (
          <div className="mt-0.5 flex shrink-0 items-end justify-center gap-1">
            <span className="text-[9px] font-bold text-slate-500">
              S/
            </span>

            <span
              className={[
                "text-[22px] font-black leading-none tracking-tight",
                hasOffer
                  ? "text-red-600"
                  : "text-[#1d8299]",
              ].join(" ")}
            >
              {finalPrice.toFixed(1)}
            </span>

            {hasOffer && (
              <span className="mb-[1px] text-[8px] font-bold text-slate-400 line-through">
                S/
                {product.price_1.toFixed(
                  1,
                )}
              </span>
            )}
          </div>
        )}

        <div className="mt-0.5 shrink-0 scale-[0.82]">
          <ProductCardStock
            stock={product.stock}
            price={product.price_1}
            status={product.status}
          />
        </div>

        {volumePrices.length > 0 && (
          <div className="mt-1 min-h-0 flex-1 border-t border-dashed border-slate-200 pt-1">
            <div className="mb-1 flex items-center justify-center gap-1 text-center">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
              <div className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                Precios mayoristas
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-[#1d8299]" />
            </div>

            <div
              data-product-capture-volume-grid
              className="grid grid-cols-2 gap-1.5"
            >
              {volumePrices.map(
                (tier) => {
                  const totalPrice =
                    tier.unitPrice *
                    tier.qty;

                  return (
                    <div
                      key={tier.key}
                      data-product-capture-volume-price
                      className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-2 py-1.5 shadow-[0_6px_14px_rgba(15,23,42,.06)]"
                    >
                      <div
                        data-product-capture-volume-label
                        className="text-[6.5px] font-black uppercase tracking-[0.08em] text-slate-400"
                      >
                        {getVolumePriceLabel(
                          tier.qty,
                        )}
                      </div>

                      <div className="mt-0.5 flex items-end justify-between gap-1">
                        <span className="rounded-full bg-slate-100 px-1.5 py-[2px] text-[7px] font-black leading-none text-slate-500">
                          {tier.qty}u
                        </span>

                        <span className="text-[13px] font-black leading-none text-[#1d8299]">
                          S/
                          {totalPrice.toFixed(
                            0,
                          )}
                        </span>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}