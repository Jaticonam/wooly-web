import fs from "node:fs/promises";
import path from "node:path";
import type { WorkflowStep } from "../contracts/WorkflowStep";
import type {
  Product,
} from "@wooly/contracts/types/product";
import type {
  PublicationResult,
} from "../../publication";
import type {
  QualityReport,
} from "../../quality";
import {
  getBaseUnitPrice,
} from "@wooly/contracts/domain/volumePricing/VolumePricing";

const OUT_DIR = path.resolve(process.cwd(), "ui/public/api/previews");
const OUT_FILE = path.join(OUT_DIR, "publication-preview.json");

export const PreviewStep: WorkflowStep = {
  key: "preview",
  name: "Generar vista previa",
  enabled: true,

  async execute(context) {
    const publication =
      context.state.publication as
        PublicationResult<Product> |
        undefined;
    const quality =
      context.state.quality as
        QualityReport |
        undefined;

    const preview = {
      plan: publication?.plan,
      publication: {
        totalItems: publication?.totalItems ?? 0,
        selectedItems: publication?.selectedItems ?? 0,
        omittedItems: publication?.omittedItems ?? 0,
        generatedAt: publication?.generatedAt,
      },
      quality: {
        exportable: quality?.exportable,
        score: quality?.score,
        summary: quality?.summary,
        gates: quality?.gates,
        errors: quality?.errors,
        warnings: quality?.warnings,
      },
      items: (
        context.data as Product[]
      ).map((product) => ({
        id: product.id,
        title: product.title,
        category: product.category,
        status: product.status,
        stock: product.stock,
        priority: product.priority,
        price:
          getBaseUnitPrice(
            product,
          ),
      })),
      issues: quality?.issues?.slice(0, 100) ?? [],
    };

    await fs.mkdir(OUT_DIR, { recursive: true });
    await fs.writeFile(OUT_FILE, JSON.stringify(preview, null, 2), "utf8");

    context.state.previewFile = OUT_FILE;
    context.logs.push(`👀 Preview generado: ${OUT_FILE}`);

    return context;
  },
};
