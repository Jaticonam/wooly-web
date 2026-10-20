import { MetaConnector } from "../connectors/meta/connector";
import type { IntegrationConnector } from "../types/connector";
import type {
  Product,
} from "@wooly/contracts/types/product";

class Registry {
  private connectors:
    IntegrationConnector<
      Product,
      unknown
    >[] = [];

  register(
    connector:
      IntegrationConnector<
        Product,
        unknown
      >,
  ) {
    const exists = this.connectors.some((item) => item.key === connector.key);
    if (!exists) this.connectors.push(connector);
  }

  getAll() {
    return [
      ...this.connectors,
    ];
  }

  getByKey(key: string) {
    return this.connectors.find((connector) => connector.key === key);
  }
}

export const ConnectorRegistry = new Registry();

ConnectorRegistry.register(MetaConnector);
