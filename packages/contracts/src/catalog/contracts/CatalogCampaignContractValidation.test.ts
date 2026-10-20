import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateCatalogCampaignContractV1,
} from "./CatalogCampaignContractValidation";

function validCampaign() {
  return {
    id: "dia-madre",
    slug: "dia-de-la-madre",
    name: "Día de la Madre",
    icon: "flower",
    color: "lavanda",
    themeToken:
      "campaign.lavanda",
    startsAt:
      "2026-05-01T00:00:00.000Z",
    endsAt:
      "2026-05-10T23:59:59.000Z",
    priority: 100,
    publicationStatus:
      "published",
  };
}

describe(
  "CatalogCampaignContractValidation",
  () => {
    it(
      "acepta una campaña canónica válida",
      () => {
        const result =
          validateCatalogCampaignContractV1(
            validCampaign(),
          );

        expect(result).toEqual({
          ok: true,
          data: validCampaign(),
        });
      },
    );

    it(
      "acepta fechas y metadatos opcionales en null",
      () => {
        const campaign = {
          ...validCampaign(),
          icon: null,
          color: null,
          themeToken: null,
          startsAt: null,
          endsAt: null,
        };

        expect(
          validateCatalogCampaignContractV1(
            campaign,
          ),
        ).toEqual({
          ok: true,
          data: campaign,
        });
      },
    );

    it(
      "rechaza valores que no son objetos",
      () => {
        const result =
          validateCatalogCampaignContractV1(
            [],
          );

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors[0]?.code,
          ).toBe("INVALID_OBJECT");
        }
      },
    );

    it(
      "rechaza fechas inválidas",
      () => {
        const result =
          validateCatalogCampaignContractV1({
            ...validCampaign(),
            startsAt:
              "fecha-inválida",
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code: "INVALID_DATE",
                path: "startsAt",
              }),
            ]),
          );
        }
      },
    );

    it(
      "rechaza rangos temporales invertidos",
      () => {
        const result =
          validateCatalogCampaignContractV1({
            ...validCampaign(),
            startsAt:
              "2026-05-11T00:00:00.000Z",
            endsAt:
              "2026-05-10T00:00:00.000Z",
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "INVALID_DATE_RANGE",
                path: "endsAt",
              }),
            ]),
          );
        }
      },
    );

    it(
      "rechaza textos opcionales vacíos",
      () => {
        const result =
          validateCatalogCampaignContractV1({
            ...validCampaign(),
            themeToken: "",
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code: "EMPTY_FIELD",
                path: "themeToken",
              }),
            ]),
          );
        }
      },
    );

    it(
      "rechaza prioridades negativas",
      () => {
        const result =
          validateCatalogCampaignContractV1({
            ...validCampaign(),
            priority: -1,
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code: "INVALID_PRIORITY",
                path: "priority",
              }),
            ]),
          );
        }
      },
    );

    it(
      "rechaza estados desconocidos",
      () => {
        const result =
          validateCatalogCampaignContractV1({
            ...validCampaign(),
            publicationStatus:
              "active",
          });

        expect(result.ok).toBe(false);

        if (result.ok === false) {
          expect(
            result.errors,
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                code:
                  "INVALID_PUBLICATION_STATUS",
                path:
                  "publicationStatus",
              }),
            ]),
          );
        }
      },
    );
  },
);