import {
  describe,
  expect,
  it,
} from "vitest";

import {
  readCampaignCachePayload,
} from "@wooly/shared/catalog/services/campaignService";
import {
  readCategoryCachePayload,
} from "@wooly/shared/catalog/services/productService";
import {
  readProductsCachePayload,
} from "../utils/products";

const product = {
  id: "P-1",
  title: "Producto",
  description: "Descripción",
  category: "flores",
  price_1: 10,
  img: "producto.jpg",
  status: "publicado",
  stock: 1,
};

const campaign = {
  id: "C-1",
  name: "Campaña",
  icon: "star",
  themeToken: "campaign",
  colorClass: "pink",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  priority: 1,
  publicationStatus: "publicado",
  computedStatus: "finalizada",
};

describe("persistencia de cachés de catálogo", () => {
  it.each([
    ["categoría", readCategoryCachePayload, [product]],
    ["campañas", readCampaignCachePayload, [campaign]],
  ])("acepta v1 y migra legacy: %s", (_name, reader, data) => {
    expect(
      reader(JSON.stringify({
        schemaVersion: 1,
        savedAt: 100,
        data,
      })),
    ).toMatchObject({
      success: true,
      migrated: false,
      sourceVersion: 1,
    });

    expect(
      reader(JSON.stringify({
        savedAt: 100,
        items: data,
      })),
    ).toMatchObject({
      success: true,
      migrated: true,
      sourceVersion: 0,
    });
  });

  it.each([
    readCategoryCachePayload,
    readCampaignCachePayload,
  ])("rechaza versiones futuras", (reader) => {
    expect(
      reader(JSON.stringify({
        schemaVersion: 2,
        savedAt: 100,
        data: [],
      })),
    ).toEqual({
      success: false,
      reason: "UNSUPPORTED_VERSION",
    });
  });

  it("migra el formato real del caché general y acepta v1", () => {
    expect(
      readProductsCachePayload(JSON.stringify({
        data: [product],
        timestamp: 100,
        source: "sheets",
      })),
    ).toMatchObject({
      success: true,
      migrated: true,
      savedAt: 100,
    });

    expect(
      readProductsCachePayload(JSON.stringify({
        schemaVersion: 1,
        savedAt: 100,
        data: {
          products: [product],
          source: "fallback",
        },
      })),
    ).toMatchObject({
      success: true,
      migrated: false,
      sourceVersion: 1,
    });
  });

  it("rechaza payloads generales inválidos y futuros", () => {
    expect(
      readProductsCachePayload(JSON.stringify({
        schemaVersion: 1,
        savedAt: 100,
        data: {},
      })),
    ).toMatchObject({
      success: false,
      reason: "INVALID_PAYLOAD",
    });

    expect(
      readProductsCachePayload(JSON.stringify({
        schemaVersion: 2,
        savedAt: 100,
        data: {
          products: [],
          source: "sheets",
        },
      })),
    ).toMatchObject({
      success: false,
      reason: "UNSUPPORTED_VERSION",
    });
  });
});
