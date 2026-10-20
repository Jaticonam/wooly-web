import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { fetchSheetRows } from "../../packages/shared/src/catalog/integrations/googleSheets/fetchSheets";
import { PRODUCT_SHEETS_CONFIG } from "../../packages/shared/src/catalog/integrations/googleSheets/sheetsConfig";

type ScriptOptions = {
  category?: string;
  limit?: number;
  force: boolean;
};

type PdfImageManifest = Record<string, string>;

type PdfImageReportStatus =
  | "generated"
  | "regenerated"
  | "skipped"
  | "missing-image"
  | "error";

type PdfImageReportEntry = {
  productId: string;
  category: string;
  sourceHash: string;
  pdf: string;
  sizeKb: number;
  status: PdfImageReportStatus;
  message?: string;
  updatedAt: string;
};

type PdfImageReport = Record<string, PdfImageReportEntry>;

const REQUIRED_HEADERS = ["id", "img", "status"] as const;

const OUTPUT_DIR = path.resolve("ui/public/catalog/pdf-images");

const MANIFEST_PATH = path.resolve(
  "packages/shared/src/catalog-export/data/PdfImageManifest.ts",
);

const REPORT_PATH = path.resolve(
  "reports/catalog/pdf-images-report.json",
);

const PDF_IMAGE_WIDTH = 900;
const PDF_IMAGE_HEIGHT = 1200;
const PDF_IMAGE_QUALITY = 74;

const cleanText = (value: unknown) =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeStatus = (value: unknown) =>
  cleanText(value).toLowerCase();

const isVisibleProduct = (status: unknown) => {
  const normalizedStatus = normalizeStatus(status);

  return normalizedStatus !== "oculto";
};

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeDropboxUrl = (url: string) => {
  if (!url.includes("dropbox.com")) {
    return url;
  }

  return url
    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
    .replace("?dl=0", "?raw=1")
    .replace("&dl=0", "&raw=1");
};

const normalizeImageUrl = (url: string) =>
  normalizeDropboxUrl(cleanText(url));

const createSourceHash = (url: string) =>
  createHash("sha1").update(normalizeImageUrl(url)).digest("hex");

const getReportKey = (category: string, productId: string) =>
  `${category}/${productId}`;

const parseOptions = (): ScriptOptions => {
  const args = process.argv.slice(2);

  const options: ScriptOptions = {
    force: false,
  };

  for (const arg of args) {
    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg.startsWith("--category=")) {
      options.category = arg.replace("--category=", "").trim();
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const limit = Number(arg.replace("--limit=", "").trim());

      if (Number.isFinite(limit) && limit > 0) {
        options.limit = limit;
      }
    }
  }

  return options;
};

const fileExists = async (filePath: string) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

const getFileSizeKb = async (filePath: string) => {
  const fileStat = await stat(filePath);

  return Math.round((fileStat.size / 1024) * 100) / 100;
};

const downloadImage = async (url: string) => {
  const normalizedUrl = normalizeImageUrl(url);
  const response = await fetch(normalizedUrl);

  if (!response.ok) {
    throw new Error(
      `No se pudo descargar imagen: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
};

const getOutputPath = (category: string, productId: string) => {
  const safeCategory = sanitizeFileName(category || "catalogo");
  const safeProductId = sanitizeFileName(productId);

  return path.join(
    OUTPUT_DIR,
    safeCategory,
    `${safeProductId}.jpg`,
  );
};

const getPublicPath = (category: string, productId: string) => {
  const safeCategory = sanitizeFileName(category || "catalogo");
  const safeProductId = sanitizeFileName(productId);

  return `/catalog/pdf-images/${safeCategory}/${safeProductId}.jpg`;
};

const readPreviousReport = async (): Promise<PdfImageReport> => {
  try {
    const content = await readFile(REPORT_PATH, "utf8");
    return JSON.parse(content) as PdfImageReport;
  } catch {
    return {};
  }
};

const writeReport = async (report: PdfImageReport) => {
  const sortedReport = Object.fromEntries(
    Object.entries(report).sort(([a], [b]) => a.localeCompare(b)),
  );

  await mkdir(path.dirname(REPORT_PATH), {
    recursive: true,
  });

  await writeFile(
    REPORT_PATH,
    `${JSON.stringify(sortedReport, null, 2)}\n`,
    "utf8",
  );
};

const optimizeImage = async ({
  sourceUrl,
  outputPath,
}: {
  sourceUrl: string;
  outputPath: string;
}) => {
  const inputBuffer = await downloadImage(sourceUrl);

  await mkdir(path.dirname(outputPath), {
    recursive: true,
  });

  const result = await sharp(inputBuffer, {
    failOn: "none",
  })
    .rotate()
    .resize({
      width: PDF_IMAGE_WIDTH,
      height: PDF_IMAGE_HEIGHT,
      fit: "cover",
      position: "centre",
      withoutEnlargement: true,
    })
    .flatten({
      background: "#ffffff",
    })
    .jpeg({
      quality: PDF_IMAGE_QUALITY,
      progressive: true,
      mozjpeg: true,
    })
    .toFile(outputPath);

  return {
    width: result.width,
    height: result.height,
    sizeKb: await getFileSizeKb(outputPath),
  };
};

const writeManifest = async (manifest: PdfImageManifest) => {
  const sortedEntries = Object.entries(manifest).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  const manifestBody = sortedEntries
    .map(([productId, pdfPath]) => {
      return `  ${JSON.stringify(productId)}: ${JSON.stringify(pdfPath)},`;
    })
    .join("\n");

  const content = `/**
 * Manifest generado por scripts/catalog/OptimizePdfImages.ts
 *
 * Regla:
 * - La imagen original vive en Google Sheets como img.
 * - Este manifest contiene solo derivados optimizados para PDF.
 * - No se edita manualmente.
 */
export const PDF_IMAGE_MANIFEST: Record<string, string> = {
${manifestBody}
};
`;

  await mkdir(path.dirname(MANIFEST_PATH), {
    recursive: true,
  });

  await writeFile(MANIFEST_PATH, content, "utf8");
};

const run = async () => {
  const options = parseOptions();
  const previousReport = await readPreviousReport();
  const nextReport: PdfImageReport = {};
  const manifest: PdfImageManifest = {};

  let visitedCount = 0;
  let generatedCount = 0;
  let regeneratedCount = 0;
  let skippedCount = 0;
  let missingImageCount = 0;
  let errorCount = 0;

  console.log("🧵 Wooly PDF Image Optimizer v0.2");
  console.log("Categoría:", options.category || "todas");
  console.log("Límite:", options.limit || "sin límite");
  console.log("Forzar:", options.force ? "sí" : "no");
  console.log("");

  const sources = PRODUCT_SHEETS_CONFIG.filter((source) => {
    if (!options.category) {
      return true;
    }

    return source.category === options.category;
  });

  if (sources.length === 0) {
    throw new Error(
      `No se encontró la categoría: ${options.category}`,
    );
  }

  for (const source of sources) {
    console.log(`📦 Categoría: ${source.category}`);

    const rows = await fetchSheetRows(
      source,
      REQUIRED_HEADERS,
    );

    for (const row of rows) {
      if (options.limit && visitedCount >= options.limit) {
        break;
      }

      if (!isVisibleProduct(row.status)) {
        continue;
      }

      visitedCount += 1;

      const productId = cleanText(row.id);
      const imageUrl = cleanText(row.img);
      const reportKey = getReportKey(source.category, productId);
      const now = new Date().toISOString();

      if (!productId) {
        continue;
      }

      const outputPath = getOutputPath(
        source.category,
        productId,
      );

      const publicPath = getPublicPath(
        source.category,
        productId,
      );

      if (!imageUrl) {
        missingImageCount += 1;

        nextReport[reportKey] = {
          productId,
          category: source.category,
          sourceHash: "",
          pdf: "",
          sizeKb: 0,
          status: "missing-image",
          message: "Producto sin imagen en la columna img.",
          updatedAt: now,
        };

        console.warn(`⚠️ ${productId}: sin imagen`);

        continue;
      }

      const normalizedImageUrl = normalizeImageUrl(imageUrl);
      const sourceHash = createSourceHash(normalizedImageUrl);
      const previousEntry = previousReport[reportKey];
      const alreadyExists = await fileExists(outputPath);
      const sourceChanged =
        previousEntry?.sourceHash &&
        previousEntry.sourceHash !== sourceHash;

      try {
        if (
          alreadyExists &&
          previousEntry?.sourceHash === sourceHash &&
          !options.force
        ) {
          const existingSizeKb = await getFileSizeKb(outputPath);

          manifest[productId] = publicPath;

          nextReport[reportKey] = {
            productId,
            category: source.category,
            sourceHash,
            pdf: publicPath,
            sizeKb: existingSizeKb,
            status: "skipped",
            updatedAt: now,
          };

          skippedCount += 1;

          console.log(
            `↩️  ${productId} sin cambios → ${existingSizeKb} KB`,
          );

          continue;
        }

        const result = await optimizeImage({
          sourceUrl: normalizedImageUrl,
          outputPath,
        });

        manifest[productId] = publicPath;

        const status: PdfImageReportStatus =
          alreadyExists || sourceChanged || options.force
            ? "regenerated"
            : "generated";

        nextReport[reportKey] = {
          productId,
          category: source.category,
          sourceHash,
          pdf: publicPath,
          sizeKb: result.sizeKb,
          status,
          updatedAt: now,
        };

        if (status === "regenerated") {
          regeneratedCount += 1;
        } else {
          generatedCount += 1;
        }

        console.log(
          `✅ ${productId} ${status} → ${result.width}x${result.height} · ${result.sizeKb} KB`,
        );
      } catch (error) {
        errorCount += 1;

        const message =
          error instanceof Error
            ? error.message
            : "Error desconocido";

        const hasFallbackFile = await fileExists(outputPath);

        if (hasFallbackFile) {
          const existingSizeKb = await getFileSizeKb(outputPath);
          manifest[productId] = publicPath;

          nextReport[reportKey] = {
            productId,
            category: source.category,
            sourceHash,
            pdf: publicPath,
            sizeKb: existingSizeKb,
            status: "error",
            message: `${message}. Se conserva imagen optimizada anterior.`,
            updatedAt: now,
          };
        } else {
          nextReport[reportKey] = {
            productId,
            category: source.category,
            sourceHash,
            pdf: "",
            sizeKb: 0,
            status: "error",
            message,
            updatedAt: now,
          };
        }

        console.warn(`⚠️ ${productId}: ${message}`);
      }
    }
  }

  await writeManifest(manifest);
  await writeReport(nextReport);

  console.log("");
  console.log("✅ Manifest liviano generado:");
  console.log(MANIFEST_PATH);
  console.log("");
  console.log("✅ Reporte técnico generado:");
  console.log(REPORT_PATH);
  console.log("");
  console.log("Resumen:");
  console.log(`- Visitadas: ${visitedCount}`);
  console.log(`- Generadas: ${generatedCount}`);
  console.log(`- Regeneradas: ${regeneratedCount}`);
  console.log(`- Omitidas sin cambios: ${skippedCount}`);
  console.log(`- Sin imagen: ${missingImageCount}`);
  console.log(`- Errores: ${errorCount}`);
};

run().catch((error) => {
  console.error("❌ Error generando imágenes PDF");
  console.error(error);
  process.exit(1);
});
