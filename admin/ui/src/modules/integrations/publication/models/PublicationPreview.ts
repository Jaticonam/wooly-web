import type { PublicationPlan } from "./PublicationPlan";

export interface PublicationPreview<T = unknown> {
  plan: PublicationPlan;
  totalItems: number;
  selectedItems: number;
  omittedItems: number;
  averageScore?: number;
  items: T[];
  generatedAt: string;
}
