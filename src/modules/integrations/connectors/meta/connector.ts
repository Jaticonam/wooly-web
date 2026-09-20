import type { FeedProduct, MetaFeedItem } from "../../types/feed";
import type { IntegrationConnector } from "../../types/connector";
import { exportMetaCsv } from "./exporter";
import { mapProductToMeta } from "./mapper";
import { validateMetaProduct } from "./validator";

export * from "./exporter";
export * from "./mapper";
export * from "./types";
export * from "./validator";
export * from "./WoolyMetaChannelExport";

export const MetaConnector: IntegrationConnector<FeedProduct, MetaFeedItem> = {
  key: "meta",
  name: "Meta Commerce",
  outputFile: "meta.csv",
  validate: validateMetaProduct,
  map: mapProductToMeta,
  export: exportMetaCsv,
};


