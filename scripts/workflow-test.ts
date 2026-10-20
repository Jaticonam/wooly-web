import { workflowEngine } from "../admin/ui/src/modules/integrations/workflow";
import type { Workflow, WorkflowContext } from "../admin/ui/src/modules/integrations/workflow";

const workflow: Workflow = {
  id: "meta-publication",
  name: "Meta Publication Workflow",
  enabled: true,
  steps: [
    "load-products",
    "quality",
    "publication",
    "preview",
    "integration",
    "history",
  ],
};

const context: WorkflowContext = {
  workflowId: workflow.id,
  data: [],
  metadata: {
    connector: "meta",
    plan: "meta-all",
  },
  state: {},
  logs: [],
};

async function main() {
  console.log("🌐 Ejecutando workflow de prueba...");

  const result = await workflowEngine.execute(workflow, context);

  console.log(`✅ Success: ${result.success}`);
  console.log(`⏱️ Duration: ${result.duration}ms`);
  console.log(`🧩 Steps: ${result.executedSteps.join(" → ")}`);
  console.log("📜 Logs:");
  result.context.logs.forEach((log) => console.log(` - ${log}`));
}

main().catch((error) => {
  console.error("❌ Error ejecutando workflow:", error);
  process.exit(1);
});
