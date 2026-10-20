import type { PublicationExecution } from "../../models";

export interface PublicationPipelineResult {

  success: boolean;

  execution: PublicationExecution;

  qualityScore: number;

  exportedItems: number;

  warnings: number;

  errors: number;

}
