import type {
  VolumePriceDefinition,
} from "./VolumePricingTypes";

export const VOLUME_PRICES = [
  {
    qty: 1,
    key: "price_1",
    label: "1u",
    className: "volume-price-1",
  },
  {
    qty: 3,
    key: "price_3",
    label: "3u",
    className: "volume-price-3",
  },
  {
    qty: 12,
    key: "price_12",
    label: "12u",
    className: "volume-price-12",
  },
  {
    qty: 50,
    key: "price_50",
    label: "50u",
    className: "volume-price-50",
  },
  {
    qty: 100,
    key: "price_100",
    label: "100u",
    className: "volume-price-100",
  },
] as const satisfies readonly VolumePriceDefinition[];

export const DISCOUNT_VOLUME_PRICES =
  VOLUME_PRICES.filter(
    (volumePrice) => volumePrice.key !== "price_1",
  );
