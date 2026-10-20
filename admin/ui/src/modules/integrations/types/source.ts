export type IntegrationSource<TData = unknown> = {
  key: string;
  name: string;
  load: () => Promise<TData[]>;
};
