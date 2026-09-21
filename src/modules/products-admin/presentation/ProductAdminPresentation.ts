import {
  resolveProductAdminOperationalState,
} from "@/modules/products-admin/domain/ProductAdminOperationalState";
import type {
  Product,
} from "@/shared/types/product";

const formatMoney = (
  value: number,
) => new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
}).format(value);

const isPositivePrice = (
  value: unknown,
): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value > 0;

export function resolveProductAdminPresentation(
  product: Product,
) {
  const operationalState = resolveProductAdminOperationalState(product);
  const policy = operationalState.policy;
  const volumePrices = [
    product.price_3,
    product.price_12,
    product.price_50,
    product.price_100,
  ].filter(isPositivePrice);
  const minimumVolumePrice = volumePrices.length > 0
    ? Math.min(...volumePrices)
    : null;
  return {
    policy,
    statusLabel: operationalState.statusLabel,
    observations: operationalState.observations,
    unitPriceLabel: isPositivePrice(product.price_1)
      ? formatMoney(product.price_1)
      : "Precio no disponible",
    volumePriceLabel: minimumVolumePrice
      ? `Desde ${formatMoney(minimumVolumePrice)} por volumen`
      : "Sin escala por volumen",
    stockLabel: operationalState.inventoryLabel,
    stockTone: operationalState.inventoryState,
  };
}
