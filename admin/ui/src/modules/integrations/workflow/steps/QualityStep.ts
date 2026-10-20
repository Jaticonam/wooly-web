import { QualityEngine } from "../../quality";
import type { WorkflowStep } from "../contracts/WorkflowStep";
import type {
  Product,
} from "@wooly/contracts/types/product";

export const QualityStep: WorkflowStep = {
  key: "quality",
  name: "Evaluar calidad",
  enabled: true,

  async execute(context) {
    const products =
      context.data as Product[];
    const quality = QualityEngine.evaluate(products);

    context.state.quality = quality;
    context.logs.push(`🏅 Quality Score: ${quality.score.percentage}/100 (${quality.score.grade})`);
    context.logs.push(`🔴 Errores: ${quality.errors}`);
    context.logs.push(`⚠️ Warnings: ${quality.warnings}`);

    if (!quality.exportable && context.metadata.force !== true) {
      throw new Error("Exportación bloqueada por errores críticos de calidad.");
    }

    return context;
  },
};
