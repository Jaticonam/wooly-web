import fs from "node:fs/promises";
import path from "node:path";

import { loadAllProducts } from "../packages/shared/src/catalog/services/fetchProducts";
import { QualityEngine } from "../admin/ui/src/modules/integrations/quality";

const OUT_DIR = path.resolve(process.cwd(), "ui/public/api/reports");
const OUT_FILE = path.join(OUT_DIR, "catalog-quality.json");

async function main() {
  console.log("🟢 Evaluando calidad del catálogo...");

  const products = await loadAllProducts();
  const report = QualityEngine.evaluate(products);

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(report, null, 2), "utf8");

  console.log(`✅ Reporte generado: ${OUT_FILE}`);
  console.log(`📦 Productos: ${report.total}`);
  console.log(`🟢 Exportables: ${report.summary.exportableItems}`);
  console.log(`🔴 Bloqueados: ${report.summary.blockedItems}`);
  console.log(`⚠️ Warnings: ${report.warnings}`);
  console.log(`🏅 Score: ${report.score.percentage}/100 (${report.score.grade})`);
  console.log(`🚀 Exportable: ${report.exportable ? "SI" : "NO"}`);
}

main().catch((error) => {
  console.error("❌ Error evaluando calidad:", error);
  process.exit(1);
});
