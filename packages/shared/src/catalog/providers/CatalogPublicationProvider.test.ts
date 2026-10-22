import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  CatalogPublicationProvider,
  PublishCatalogInput,
} from "./CatalogPublicationProvider";

type ExpectedPublishInputKeys =
  | "brandId"
  | "requestId"
  | "sourceReference"
  | "composition"
  | "publicationIdentity"
  | "resolvedProductIds"
  | "validityDays";

type MissingPublishInputKeys =
  Exclude<
    ExpectedPublishInputKeys,
    keyof PublishCatalogInput
  >;

type UnexpectedPublishInputKeys =
  Exclude<
    keyof PublishCatalogInput,
    ExpectedPublishInputKeys
  >;

type ExpectedProviderKeys =
  | "source"
  | "publish"
  | "getByPublicId";

type MissingProviderKeys =
  Exclude<
    ExpectedProviderKeys,
    keyof CatalogPublicationProvider
  >;

type UnexpectedProviderKeys =
  Exclude<
    keyof CatalogPublicationProvider,
    ExpectedProviderKeys
  >;

const PUBLISH_INPUT_HAS_ALL_KEYS:
  [MissingPublishInputKeys] extends [never]
    ? true
    : false =
  true;

const PUBLISH_INPUT_HAS_NO_EXTRA_KEYS:
  [UnexpectedPublishInputKeys] extends [never]
    ? true
    : false =
  true;

const PROVIDER_HAS_ALL_KEYS:
  [MissingProviderKeys] extends [never]
    ? true
    : false =
  true;

const PROVIDER_HAS_NO_EXTRA_KEYS:
  [UnexpectedProviderKeys] extends [never]
    ? true
    : false =
  true;

describe(
  "CatalogPublicationProvider",
  () => {
    it(
      "separa la entrada de publicación de la identidad asignada por persistencia",
      () => {
        expect(
          PUBLISH_INPUT_HAS_ALL_KEYS,
        ).toBe(
          true,
        );

        expect(
          PUBLISH_INPUT_HAS_NO_EXTRA_KEYS,
        ).toBe(
          true,
        );

        const forbiddenKeys:
          readonly string[] =
        [
          "publicId",
          "publishedAt",
          "validUntil",
          "draftId",
          "name",
          "status",
          "createdAt",
          "updatedAt",
        ];

        const allowedKeys:
          readonly (keyof PublishCatalogInput)[] =
        [
          "brandId",
          "requestId",
          "sourceReference",
          "composition",
          "publicationIdentity",
          "resolvedProductIds",
          "validityDays",
        ];

        for (
          const forbiddenKey
          of forbiddenKeys
        ) {
          expect(
            allowedKeys,
          ).not.toContain(
            forbiddenKey,
          );
        }
      },
    );

    it(
      "mantiene una frontera pública mínima e independiente",
      () => {
        expect(
          PROVIDER_HAS_ALL_KEYS,
        ).toBe(
          true,
        );

        expect(
          PROVIDER_HAS_NO_EXTRA_KEYS,
        ).toBe(
          true,
        );

        const providerKeys:
          readonly (keyof CatalogPublicationProvider)[] =
        [
          "source",
          "publish",
          "getByPublicId",
        ];

        expect(
          providerKeys,
        ).toEqual(
          [
            "source",
            "publish",
            "getByPublicId",
          ],
        );

        expect(
          providerKeys,
        ).not.toContain(
          "listDrafts",
        );

        expect(
          providerKeys,
        ).not.toContain(
          "publishDraft",
        );
      },
    );
  },
);
