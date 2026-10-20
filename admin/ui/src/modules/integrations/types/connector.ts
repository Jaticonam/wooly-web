export type ConnectorValidationResult<TProduct> = {
  product: TProduct;
  errors: string[];
};

export type IntegrationConnector<TProduct, TMapped> = {
  key: string;
  name: string;
  outputFile: string;
  validate: (product: TProduct) => string[];
  map: (product: TProduct) => TMapped;
  export: (products: TProduct[]) => string;
};

