import fs from "node:fs/promises";
import path from "node:path";

import { loadAllProducts } from "../packages/shared/src/catalog/services/fetchProducts";
import { PublicationEngine } from "../admin/ui/src/modules/integrations/publication";
import type { PublicationPlan } from "../admin/ui/src/modules/integrations/publication";
import { QualityEngine } from "../admin/ui/src/modules/integrations/quality";
import { getCliArg } from "./utils/cli";

const PLANS_FILE = path.resolve(process.cwd(), "ui/public/config/publication-plans.json");
const OUT_DIR = path.resolve(process.cwd(), "ui/public/api/previews");
const OUT_FILE = path.join(OUT_DIR, "publication-preview.json");

async function loadPlan(planId: string): Promise<PublicationPlan> {
  const raw = await fs.readFile(PLANS_FILE, "utf8");
  const plans = JSON.parse(raw) as PublicationPlan[];
  const plan = plans.find((item) => item.id === planId);
  if (!plan) throw new Error(`No se encontró el plan: ${planId}`);
  return plan;
}

async function main() {
  const planId = getCliArg("plan", "meta-all");

  console.log("👀 Generando vista previa de publicación...");
  console.log(`📋 Plan: ${planId}`);

  const products = await loadAllProducts();
  const plan = await loadPlan(planId);
  const publication = PublicationEngine.apply(products, plan);
  const quality = QualityEngine.evaluate(publication.items);

  const data = {
    plan: {
      id: publication.plan.id,
      name: publication.plan.name,
      connector: publication.plan.connector,
      mode: publication.plan.mode,
    },
    publication: {
      totalItems: publication.totalItems,
      selectedItems: publication.selectedItems,
      omittedItems: publication.omittedItems,
      generatedAt: publication.generatedAt,
    },
    quality: {
      exportable: quality.exportable,
      score: quality.score,
      summary: quality.summary,
      gates: quality.gates,
      errors: quality.errors,
      warnings: quality.warnings,
    },
    items: publication.items.map((product) => ({
      id: product.id,
      title: product.title,
      category: product.category,
      status: product.status,
      stock: product.stock,
      priority: product.priority,
      price: product.price_offer || product.price_1,
    })),
    issues: quality.issues.slice(0, 100),
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(data, null, 2), "utf8");

  console.log(`✅ Preview generado: ${OUT_FILE}`);
  console.log(`📦 Total catálogo: ${publication.totalItems}`);
  console.log(`🟣 Seleccionados: ${publication.selectedItems}`);
  console.log(`⚪ Omitidos: ${publication.omittedItems}`);
  console.log(`🏅 Quality Score: ${quality.score.percentage}/100 (${quality.score.grade})`);
  console.log(`🚀 Exportable: ${quality.exportable ? "SI" : "NO"}`);
  console.log(`🔴 Errores: ${quality.errors}`);
  console.log(`⚠️ Warnings: ${quality.warnings}`);
}

main().catch((error) => {
  console.error("❌ Error generando preview:", error);
  process.exit(1);
});
