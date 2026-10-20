import type { Product } from "@wooly/contracts/types/product";
import type { QualityIssue } from "../models";
import type { QualityRule } from "../contracts/QualityRule";

export const IdRule: QualityRule<Product> = {
  key: "id",
  name: "Identificador único",
  description: "Valida que cada producto tenga un ID único, limpio y exportable.",
  category: "identity",
  weight: 25,
  required: true,
  enabled: true,

  validate(product, context) {
    const issues: QualityIssue[] = [];
    const id = String(product.id || "").trim();

    if (!id) {
      issues.push({ level: "error", code: "ID_EMPTY", field: "id", message: "El producto no tiene ID." });
      return issues;
    }

    if (id.includes(" ")) {
      issues.push({ level: "error", code: "ID_HAS_SPACES", field: "id", message: "El ID no debe contener espacios." });
    }

    if (id.length > 100) {
      issues.push({ level: "warning", code: "ID_TOO_LONG", field: "id", message: "El ID es demasiado largo para una integración comercial." });
    }

    const duplicates = context?.items?.filter((item) => String((item as Product).id || "").trim() === id) || [];
    if (duplicates.length > 1) {
      issues.push({ level: "error", code: "ID_DUPLICATED", field: "id", message: `El ID "${id}" está duplicado.` });
    }

    return issues;
  },
};
