import type { PublicationPlan } from "./PublicationPlan";

export interface PublicationResult<T = unknown> {
  plan: PublicationPlan;
  totalItems: number;
  selectedItems: number;
  omittedItems: number;
  items: T[];
  generatedAt: string;
}
