import fs from "node:fs/promises";
import path from "node:path";

import type { DashboardCollector } from "../contracts/DashboardCollector";

const STATUS=
path.resolve(
process.cwd(),
"ui/public/api/exports/meta-status.json"
);

export const ConnectorCollector:DashboardCollector={

key:"connectors",

async collect(){

try{

const raw=
await fs.readFile(
STATUS,
"utf8"
);

const status=
JSON.parse(raw);

return{

connectors:[

{

key:"meta",

status:status.status,

products:status.products_exported

}

]

};

}catch{

return{

connectors:[]

};

}

}

};
