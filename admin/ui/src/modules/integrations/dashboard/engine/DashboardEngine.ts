import fs from "node:fs/promises";
import path from "node:path";

import { CollectorRegistry } from "../registry";

const OUTPUT=
path.resolve(
process.cwd(),
"ui/public/api/dashboard/commercial.json"
);

export class DashboardEngine{

async build(){

const result:
  Record<string, unknown> = {

generatedAt:
new Date().toISOString()

};

for(

const collector

of

CollectorRegistry.getAll()

){

Object.assign(

result,

await collector.collect()

);

}

await fs.mkdir(

path.dirname(
OUTPUT
),

{

recursive:true

}

);

await fs.writeFile(

OUTPUT,

JSON.stringify(

result,

null,

2

)

);

return result;

}

}

export const dashboardEngine=
new DashboardEngine();
