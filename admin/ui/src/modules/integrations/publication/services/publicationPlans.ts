import type { PublicationPlan } from "../models";

import {
  ExternalHttpRequestError,
  requestJson,
} from "@wooly/shared/infrastructure/http";

export async function loadPublicationPlans(): Promise<PublicationPlan[]> {
  const result =
    await requestJson<PublicationPlan[]>(
      "/config/publication-plans.json",
      {
        source:
          "Publication Plans",
      },
    );

  if (result.ok === false) {
    throw new ExternalHttpRequestError(
      result.error,
    );
  }

  return result.data;
}

export async function loadPublicationPlan(planId: string): Promise<PublicationPlan> {
  const plans = await loadPublicationPlans();
  const plan = plans.find((item) => item.id === planId);
  if (!plan) throw new Error(`No se encontró el plan de publicación: ${planId}`);
  return plan;
}
