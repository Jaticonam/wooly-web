import {
  ExternalHttpRequestError,
  requestJson,
} from "@wooly/shared/infrastructure/http";

import type {
  PublicationExecution,
} from "@/modules/integrations/publication/models/PublicationExecution";

export interface CommercialConnectorSummary {
  key: string;
  status: string;
  products: number;
}

export interface CommercialDashboard {
  connectors?: CommercialConnectorSummary[];
  publication?: {
    total?: number;
    last?: PublicationExecution | null;
  };
  status?: string;
}

export async function getCommercialDashboard():
  Promise<CommercialDashboard> {
  const result =
    await requestJson<CommercialDashboard>(
      "/api/dashboard/commercial.json",
      {
        source:
          "Commercial Dashboard",
      },
    );

  if (result.ok === false) {
    throw new ExternalHttpRequestError(
      result.error,
    );
  }

  return result.data;
}
