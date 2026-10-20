export interface DashboardCollector {

  key:string;

  collect():Promise<Record<string,unknown>>;

}
