import type { IntegrationConnector, ConnectorValidationResult } from "../types/connector";

export const ValidationEngine = {
  validate<TProduct, TMapped>(
    products: TProduct[],
    connector: IntegrationConnector<TProduct, TMapped>
  ): ConnectorValidationResult<TProduct>[] {
    return products.map((product) => ({
      product,
      errors: connector.validate(product),
    }));
  },

  getInvalid<TProduct>(report: ConnectorValidationResult<TProduct>[]) {
    return report.filter((item) => item.errors.length > 0);
  },

  getValid<TProduct>(report: ConnectorValidationResult<TProduct>[]) {
    return report.filter((item) => item.errors.length === 0).map((item) => item.product);
  },
};

