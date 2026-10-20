export interface Workflow {

  id: string;

  name: string;

  description?: string;

  enabled: boolean;

  steps: string[];

}
