import {
  resolveProductCommercialPolicy,
  type ProductCommercialPolicyInput,
} from "@wooly/contracts/catalog/domain/ProductCommercialPolicy";

import {
  resolveProductCommercialState,
} from "@wooly/contracts/domain/commercialPolicy";

/**
 * Valida exclusivamente los datos contenidos en la línea.
 *
 * No reconcilia el snapshot con Google Sheets ni con otra
 * fuente remota.
 */
export function isCartItemCommerciallyEligible(
  item:
    ProductCommercialPolicyInput,
): boolean {
  const policy =
    resolveProductCommercialPolicy(
      item,
    );

  const commercialState =
    resolveProductCommercialState(
      item,
    );

  return (
    policy.isPurchasable &&
    commercialState.purchaseMode ===
      "CART"
  );
}
