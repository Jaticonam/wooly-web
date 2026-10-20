export type PublicationJobStatus =
  | "pending"
  | "running"
  | "success"
  | "warning"
  | "failed";

export interface PublicationJob {

  id: string;

  connector: string;

  planId: string;

  status: PublicationJobStatus;

  startedAt: string;

  finishedAt?: string;

  duration?: number;

}
