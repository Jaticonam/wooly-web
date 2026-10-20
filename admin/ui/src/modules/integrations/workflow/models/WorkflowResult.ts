import type { WorkflowContext } from "./WorkflowContext";

export interface WorkflowResult {

  success: boolean;

  duration: number;

  executedSteps: string[];

  context: WorkflowContext;

}
