import type { DashboardCollector } from "../contracts/DashboardCollector";

class Registry{

  private collectors:DashboardCollector[]=[];

  register(collector:DashboardCollector){

    if(
      this.collectors.some(
        c=>c.key===collector.key
      )
    ){
      return;
    }

    this.collectors.push(
      collector
    );

  }

  getAll(){

    return this.collectors;

  }

}

export const CollectorRegistry=
new Registry();
