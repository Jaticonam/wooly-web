import type { Product } from "@wooly/contracts/types/product";
import type { QualityIssue } from "../models";
import type { QualityRule } from "../contracts/QualityRule";
import {
  getBaseUnitPrice,
} from "@wooly/contracts/domain/volumePricing/VolumePricing";

export const PriceRule: QualityRule<Product> = {
  key: "price",
  name: "Precio válido",
  description: "Valida que el producto tenga un precio positivo y exportable.",
  category: "pricing",
  weight: 20,
  required: true,
  enabled: true,

  validate(product) {
    const issues: QualityIssue[] = [];
    const price =
      getBaseUnitPrice(
        product,
      );

    if (!price || price <= 0) {
      issues.push({ level: "error", code: "PRICE_INVALID", field: "price_1", message: "El producto debe tener un precio mayor a cero." });
    }

    if (price > 99999) {
      issues.push({ level: "warning", code: "PRICE_TOO_HIGH", field: "price_1", message: "El precio parece demasiado alto. Revisar antes de exportar." });
    }

    return issues;
  },
};
