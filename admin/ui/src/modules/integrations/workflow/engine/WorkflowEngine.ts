import type { Workflow } from "../models/Workflow";
import type { WorkflowContext } from "../models/WorkflowContext";
import type { WorkflowResult } from "../models/WorkflowResult";

import { StepRegistry } from "../registry/StepRegistry";

export class WorkflowEngine {

  async execute(
    workflow: Workflow,
    context: WorkflowContext
  ):Promise<WorkflowResult>{

    const start=Date.now();

    const executedSteps:string[]=[];

    for(const key of workflow.steps){

      const step=
      StepRegistry.get(key);

      if(!step){

        throw new Error(
          `Workflow step "${key}" no registrado.`
        );

      }

      context=
      await step.execute(context);

      executedSteps.push(key);

    }

    return{

      success:true,

      duration:Date.now()-start,

      executedSteps,

      context

    };

  }

}

export const workflowEngine=
new WorkflowEngine();
