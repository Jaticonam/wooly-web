/**
 * ============================================================
 * JUNG Candidate Module
 * Workflow Context
 * ============================================================
 */

export interface WorkflowContext<T = unknown> {

  workflowId: string;

  data: T[];

  metadata: Record<string, unknown>;

  state: Record<string, unknown>;

  logs: string[];

}
