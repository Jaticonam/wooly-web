import type { WorkflowContext } from "../models/WorkflowContext";

export interface WorkflowStep {

  key: string;

  name: string;

  enabled: boolean;

  execute(
    context: WorkflowContext
  ): Promise<WorkflowContext>;

}
