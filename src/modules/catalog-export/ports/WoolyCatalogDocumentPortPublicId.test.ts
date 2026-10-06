import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createWoolyCatalogDocumentRequest,
  prepareWoolyCatalogDocument,
} from "./WoolyCatalogDocumentPort";

describe(
  "WoolyCatalogDocumentPort Public ID",
  () => {
    it(
      "construye la salida PDF canónica desde Public ID",
      () => {
        const request =
          createWoolyCatalogDocumentRequest(
            "wooly-catalog-public-id",
          );

        const result =
          prepareWoolyCatalogDocument(
            request,
            {
              origin:
                "https://wooly.example",
              publicId:
                "PUB-AbC123",
            },
          );

        expect(
          result,
        ).toEqual({
          request,
          status:
            "ready",
          previewUrl:
            "https://wooly.example/catalogo/pdf?id=PUB-AbC123",
          deliveryMode:
            "browser-print",
          issues:
            [],
        });
      },
    );
  },
);
