import fs from "node:fs/promises";
import path from "node:path";
import type { IntegrationConnector } from "../types/connector";

export const ExportEngine = {
  async write<TProduct, TMapped>(
    connector: IntegrationConnector<TProduct, TMapped>,
    products: TProduct[],
    outDir = "ui/public/api/exports"
  ) {
    const outputDir = path.resolve(process.cwd(), outDir);
    const outputFile = path.join(outputDir, connector.outputFile);
    const content = connector.export(products);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputFile, content, "utf8");

    return outputFile;
  },
};

