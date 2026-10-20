import { CollectorRegistry } from "./CollectorRegistry";

import { PublicationCollector } from "../collectors";

import { ConnectorCollector } from "../collectors";

CollectorRegistry.register(
PublicationCollector
);

CollectorRegistry.register(
ConnectorCollector
);

export{
CollectorRegistry
};
