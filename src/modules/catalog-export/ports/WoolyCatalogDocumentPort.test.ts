import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEmptyCatalogComposition,
} from "@/modules/catalog/domain/CatalogComposition";

import {
  createWoolyCatalogCompositionId,
  createWoolyCatalogDocumentRequest,
  prepareWoolyCatalogDocument,
} from "./WoolyCatalogDocumentPort";

describe("WoolyCatalogDocumentPort", () => {
  it("conserva la URL PDF V2 detrás del contrato documental", () => {
    const composition = createEmptyCatalogComposition("automatic");
    composition.filters.categoryIds = ["peluches", "flores"];

    const request = createWoolyCatalogDocumentRequest(
      createWoolyCatalogCompositionId(composition),
    );

    const result = prepareWoolyCatalogDocument(request, {
      origin: "https://wooly.example",
      version: "2",
      categoryIds: composition.filters.categoryIds,
      campaignIds: [],
    });

    expect(request).toMatchObject({
      contractVersion: "commercial-document-request.v1",
      documentType: "catalog",
      templateId: "wooly-catalog-default",
      output: "pdf",
    });
    expect(result).toEqual({
      request,
      status: "ready",
      previewUrl: "https://wooly.example/catalogo/pdf?v=2&cats=flores,peluches",
      deliveryMode: "browser-print",
      issues: [],
    });
  });

  it("genera la misma identidad aunque cambie el orden de filtros", () => {
    const first = createEmptyCatalogComposition("hybrid");
    first.filters.categoryIds = ["flores", "cajas"];
    first.overrides.includedProductIds = ["B", "A"];

    const second = createEmptyCatalogComposition("hybrid");
    second.filters.categoryIds = ["cajas", "flores"];
    second.overrides.includedProductIds = ["A", "B"];

    expect(createWoolyCatalogCompositionId(first)).toBe(
      createWoolyCatalogCompositionId(second),
    );
  });

  it("bloquea solicitudes sin identidad de composición", () => {
    const request = createWoolyCatalogDocumentRequest("   ");
    const result = prepareWoolyCatalogDocument(request, {
      origin: "https://wooly.example",
      version: "1",
    });

    expect(result.status).toBe("blocked");
    expect(result.previewUrl).toBeNull();
    expect(result.issues[0].code).toBe("MISSING_COMPOSITION_ID");
  });
});
