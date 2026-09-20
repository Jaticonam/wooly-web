import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  Product,
} from "@/shared/types/product";

import type {
  ChannelExportRequestV1,
} from "@/shared/contracts/commercial";

import {
  executeWoolyMetaChannelExport,
} from "./WoolyMetaChannelExport";

const product = (
  id: string,
  img = `https://media.example/${id}.jpg`,
): Product => ({
  id,
  title: `Producto ${id}`,
  description: `Descripción ${id}`,
  category: "flores",
  price_1: 15,
  stock: 5,
  img,
  status: "publicado",
});

const request = (
  dryRun: boolean,
): ChannelExportRequestV1 => ({
  contractVersion: "channel-export-request.v1",
  compositionId: "wooly-meta-test",
  channel: "meta",
  profileId: "wooly-meta-peru",
  mode: "feed",
  dryRun,
});

const composition = {
  compositionId: "wooly-meta-test",
  version: 1,
  title: "Meta test",
  createdAt: "2026-09-20T15:00:00.000Z",
  productUrl: (current: Product) =>
    `https://wooly.example/producto/${current.id}`,
};

describe("executeWoolyMetaChannelExport", () => {
  it("ejecuta dry run sin escribir artifacts", async () => {
    const writeArtifact = vi.fn();

    const result = await executeWoolyMetaChannelExport({
      request: request(true),
      products: [product("FLOR-001")],
      composition,
      generatedAt: "2026-09-20T16:00:00.000Z",
      writeArtifact,
    });

    expect(result).toMatchObject({
      status: "ready",
      processed: 1,
      accepted: 1,
      rejected: 0,
      artifact: null,
    });
    expect(writeArtifact).not.toHaveBeenCalled();
  });

  it("reporta aceptación parcial por producto inválido", async () => {
    const result = await executeWoolyMetaChannelExport({
      request: request(true),
      products: [
        product("FLOR-001"),
        product("FLOR-002", "imagen-relativa.jpg"),
      ],
      composition,
    });

    expect(result).toMatchObject({
      status: "partial",
      processed: 2,
      accepted: 1,
      rejected: 1,
    });
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "INVALID_IMAGE_URL",
        itemId: "FLOR-002",
      }),
    ]));
  });

  it("escribe el CSV solo en publicación real", async () => {
    const writeArtifact = vi.fn().mockResolvedValue({
      assetId: "meta-wooly-meta-test",
      kind: "feed",
      status: "ready",
      url: "/api/exports/meta.csv",
      mimeType: "text/csv",
      version: 1,
    });

    const result = await executeWoolyMetaChannelExport({
      request: request(false),
      products: [product("FLOR-001")],
      composition,
      writeArtifact,
    });

    expect(writeArtifact).toHaveBeenCalledOnce();
    expect(writeArtifact.mock.calls[0][0]).toContain("image_link");
    expect(result.artifact).toMatchObject({
      kind: "feed",
      status: "ready",
    });
  });
});
