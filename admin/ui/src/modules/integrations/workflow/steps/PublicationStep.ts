import fs from "node:fs/promises";
import path from "node:path";

import { PublicationEngine } from "../../publication";
import type { PublicationPlan } from "../../publication";
import type { WorkflowStep } from "../contracts/WorkflowStep";
import type {
  Product,
} from "@wooly/contracts/types/product";

const PLANS_FILE = path.resolve(process.cwd(), "ui/public/config/publication-plans.json");

async function loadPlan(planId: string): Promise<PublicationPlan> {
  const raw = await fs.readFile(PLANS_FILE, "utf8");
  const plans = JSON.parse(raw) as PublicationPlan[];
  const plan = plans.find((item) => item.id === planId);
  if (!plan) throw new Error(`No se encontró el plan de publicación: ${planId}`);
  return plan;
}

export const PublicationStep: WorkflowStep = {
  key: "publication",
  name: "Aplicar plan de publicación",
  enabled: true,

  async execute(context) {
    const planId = String(context.metadata.plan || "meta-all");
    const plan = await loadPlan(planId);
    const publication =
      PublicationEngine.apply(
        context.data as Product[],
        plan,
      );

    context.data = publication.items;
    context.state.plan = plan;
    context.state.publication = publication;

    context.logs.push(`📋 Plan aplicado: ${plan.name}`);
    context.logs.push(`🟣 Seleccionados: ${publication.selectedItems}`);
    context.logs.push(`⚪ Omitidos: ${publication.omittedItems}`);

    return context;
  },
};
