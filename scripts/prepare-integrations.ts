import { IntegrationEngine } from "../admin/ui/src/modules/integrations/engine/IntegrationEngine";
import { SourceRegistry } from "../admin/ui/src/modules/integrations/registry/SourceRegistry";

async function main() {
  console.log("🌐 Preparando integraciones registradas...");

  const source = SourceRegistry.getByKey("catalog");

  if (!source) {
    throw new Error("No se encontró la fuente catalog.");
  }

  const data = await source.load();
  const results = await IntegrationEngine.publishAll(data);

  results.forEach((result) => {
    console.log(`✅ ${result.status.name}: ${result.status.items_exported}/${result.status.items_loaded} exportados`);
    console.log(`🧾 Status: ${result.statusFile}`);
    console.log(`🔗 Feed: ${result.status.stable_feed}`);
  });

  console.log("🚀 Integraciones preparadas.");
}

main().catch((error) => {
  console.error("❌ Error preparando integraciones:", error);
  process.exit(1);
});
