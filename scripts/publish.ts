import { workflowEngine } from "../admin/ui/src/modules/integrations/workflow";
import type { Workflow, WorkflowContext } from "../admin/ui/src/modules/integrations/workflow";
import { getCliArg } from "./utils/cli";

const plan = getCliArg("plan", "meta-all");
const connector = getCliArg("connector", "meta");
const force = getCliArg("force", "false") === "true";

const workflow: Workflow = {
  id: "commercial-publication",
  name: "Commercial Publication Workflow",
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
    connector,
    plan,
    force,
  },
  state: {},
  logs: [],
};

async function main() {
  console.log("🌐 Ejecutando Commercial Workflow...");
  console.log(`📋 Plan: ${plan}`);
  console.log(`🔌 Connector: ${connector}`);

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
