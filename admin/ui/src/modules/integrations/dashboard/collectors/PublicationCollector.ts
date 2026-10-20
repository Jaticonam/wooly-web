import fs from "node:fs/promises";
import path from "node:path";

import type { DashboardCollector } from "../contracts/DashboardCollector";

const HISTORY=
path.resolve(
process.cwd(),
"ui/public/api/history/publications/index.json"
);

export const PublicationCollector:DashboardCollector={

key:"publication",

async collect(){

try{

const raw=
await fs.readFile(HISTORY,"utf8");

const history=
JSON.parse(raw);

return{

publication:{

total:history.length,

last:history[0]??null

}

};

}catch{

return{

publication:{

total:0

}

};

}

}

};
