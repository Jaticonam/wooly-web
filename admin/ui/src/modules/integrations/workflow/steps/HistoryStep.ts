import { savePublicationHistory } from "../../publication";
import type { PublicationExecution, PublicationSnapshot } from "../../publication";
import type { WorkflowStep } from "../contracts/WorkflowStep";
import type {
  Product,
} from "@wooly/contracts/types/product";
import type {
  PublicationPlan,
  PublicationResult,
} from "../../publication";
import type {
  QualityReport,
} from "../../quality";

interface IntegrationState {
  status: {
    items_exported: number;
    items_invalid: number;
    stable_feed: string;
  };
}

const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");

const slug = (value: string) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const HistoryStep: WorkflowStep = {
  key: "history",
  name: "Guardar historial",
  enabled: true,

  async execute(context) {
    const plan =
      context.state.plan as
        PublicationPlan;
    const publication =
      context.state.publication as
        PublicationResult<Product>;
    const integration =
      context.state.integration as
        IntegrationState;
    const quality =
      context.state.quality as
        QualityReport;
    const connector = String(context.metadata.connector || "meta");

    const executionId = `pub-${connector}-${slug(plan.id)}-${stamp()}`;

    const execution: PublicationExecution = {
      id: executionId,
      connector,
      planId: plan.id,
      planName: plan.name,
      executedAt: new Date().toISOString(),
      totalItems: publication.totalItems,
      selectedItems: publication.selectedItems,
      exportedItems: integration.status.items_exported,
      omittedItems: publication.omittedItems,
      averageScore: quality.score.percentage,
      status: integration.status.items_invalid > 0 || quality.warnings > 0 ? "warning" : "success",
      outputFile: integration.status.stable_feed,
      statusFile: `/api/exports/${connector}-status.json`,
      notes: `Publicación generada desde workflow con plan ${plan.name}.`,
    };

    const snapshot: PublicationSnapshot = {
      executionId,
      connector,
      planId: plan.id,
      productIds: (
        context.data as Product[]
      ).map(
        (product) =>
          product.id,
      ),
      createdAt: new Date().toISOString(),
    };

    const history = await savePublicationHistory(execution, snapshot);

    context.state.history = history;
    context.state.execution = execution;
    context.logs.push(`📜 Historial generado: ${history.executionFile}`);

    return context;
  },
};
