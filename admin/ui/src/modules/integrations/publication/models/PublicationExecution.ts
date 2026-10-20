export type PublicationExecutionStatus = "success" | "failed" | "warning";

export interface PublicationExecution {
  id: string;
  connector: string;
  planId: string;
  planName: string;
  executedAt: string;
  totalItems: number;
  selectedItems: number;
  exportedItems: number;
  omittedItems: number;
  averageScore?: number;
  status: PublicationExecutionStatus;
  outputFile?: string;
  statusFile?: string;
  notes?: string;
}
