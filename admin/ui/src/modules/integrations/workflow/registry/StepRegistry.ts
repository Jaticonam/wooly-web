import type { WorkflowStep } from "../contracts/WorkflowStep";

class Registry {

  private steps: WorkflowStep[] = [];

  register(step: WorkflowStep) {

    const exists =
      this.steps.some(
        item => item.key === step.key
      );

    if(!exists){

      this.steps.push(step);

    }

  }

  get(key:string){

    return this.steps.find(
      item=>item.key===key
    );

  }

  getAll(){

    return this.steps;

  }

}

export const StepRegistry =
new Registry();
