import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Campaign,
} from "../../types/product";

import {
  filterActiveCampaigns,
  getCampaignComputedStatus,
  isCampaignActive,
} from "./CampaignRules";

const NOW =
  new Date(2026, 6, 15, 12, 0, 0, 0);

const createCampaign = (
  overrides: Partial<Campaign> = {},
): Campaign => ({
  id: "campaign-test",
  name: "Campaña de prueba",
  icon: "✨",
  color: "rosado",
  themeToken: "campaign.rosado",
  colorClass: "catalog-campaign-pink",
  startDate: "2026-07-01",
  endDate: "2026-07-31",
  priority: 10,
  publicationStatus: "publicado",
  computedStatus: "borrador",
  ...overrides,
});

describe(
  "CampaignRules",
  () => {
    it.each([
      "publicado",
      "publicada",
      "active",
      "published",
    ])(
      "reconoce %s como publicación activa",
      (publicationStatus) => {
        expect(
          getCampaignComputedStatus(
            createCampaign({
              publicationStatus,
            }),
            NOW,
          ),
        ).toBe("activa");
      },
    );

    it.each([
      "oculto",
      "oculta",
      "hidden",
    ])(
      "normaliza %s como oculta",
      (publicationStatus) => {
        expect(
          getCampaignComputedStatus(
            createCampaign({
              publicationStatus,
            }),
            NOW,
          ),
        ).toBe("oculta");
      },
    );

    it.each([
      "borrador",
      "draft",
      "desconocido",
      "",
      null,
    ])(
      "normaliza %s como borrador",
      (publicationStatus) => {
        expect(
          getCampaignComputedStatus(
            createCampaign({
              publicationStatus:
                publicationStatus as string,
            }),
            NOW,
          ),
        ).toBe("borrador");
      },
    );

    it.each([
      {
        label: "antes del inicio",
        now: new Date(2026, 5, 30, 23, 59, 59, 999),
        expected: "programada",
      },
      {
        label: "exactamente al inicio",
        now: new Date(2026, 6, 1, 0, 0, 0, 0),
        expected: "activa",
      },
      {
        label: "durante la vigencia",
        now: NOW,
        expected: "activa",
      },
      {
        label: "exactamente al final",
        now: new Date(2026, 6, 31, 23, 59, 59, 999),
        expected: "activa",
      },
      {
        label: "después del final",
        now: new Date(2026, 7, 1, 0, 0, 0, 0),
        expected: "finalizada",
      },
    ])(
      "calcula $label para fechas calendario",
      ({ now, expected }) => {
        expect(
          getCampaignComputedStatus(
            createCampaign(),
            now,
          ),
        ).toBe(expected);
      },
    );

    it(
      "mantiene activa una campaña de un solo día hasta el final del día",
      () => {
        const campaign =
          createCampaign({
            startDate: "15/07/2026",
            endDate: "15/07/2026",
          });

        expect(
          getCampaignComputedStatus(
            campaign,
            new Date(2026, 6, 15, 23, 59, 59, 999),
          ),
        ).toBe("activa");
      },
    );

    it(
      "respeta la hora de timestamps explícitos",
      () => {
        const campaign =
          createCampaign({
            startDate:
              "2026-07-15T10:00:00-05:00",
            endDate:
              "2026-07-15T18:00:00-05:00",
          });

        expect(
          getCampaignComputedStatus(
            campaign,
            new Date("2026-07-15T14:59:59Z"),
          ),
        ).toBe("programada");

        expect(
          getCampaignComputedStatus(
            campaign,
            new Date("2026-07-15T15:00:00Z"),
          ),
        ).toBe("activa");

        expect(
          getCampaignComputedStatus(
            campaign,
            new Date("2026-07-15T23:00:00Z"),
          ),
        ).toBe("activa");

        expect(
          getCampaignComputedStatus(
            campaign,
            new Date("2026-07-15T23:00:00.001Z"),
          ),
        ).toBe("finalizada");
      },
    );

    it.each([
      {
        label: "inicio inválido",
        startDate: "fecha-invalida",
        endDate: "2026-07-31",
      },
      {
        label: "final inválido",
        startDate: "2026-07-01",
        endDate: "31/02/2026",
      },
      {
        label: "ambas fechas inválidas",
        startDate: "inicio",
        endDate: "final",
      },
      {
        label: "fecha ausente",
        startDate: "",
        endDate: "2026-07-31",
      },
      {
        label: "rango invertido",
        startDate: "2026-08-01",
        endDate: "2026-07-31",
      },
    ])(
      "trata $label como borrador seguro",
      ({ startDate, endDate }) => {
        const campaign =
          createCampaign({
            startDate,
            endDate,
          });

        expect(
          getCampaignComputedStatus(
            campaign,
            NOW,
          ),
        ).toBe("borrador");

        expect(
          isCampaignActive(
            campaign,
            NOW,
          ),
        ).toBe(false);
      },
    );

    it(
      "recalcula la misma campaña sin confiar en computedStatus",
      () => {
        const campaign =
          createCampaign({
            computedStatus: "activa",
          });

        expect(
          getCampaignComputedStatus(
            campaign,
            new Date(2026, 5, 30),
          ),
        ).toBe("programada");

        expect(
          getCampaignComputedStatus(
            campaign,
            NOW,
          ),
        ).toBe("activa");

        expect(
          getCampaignComputedStatus(
            campaign,
            new Date(2026, 7, 1),
          ),
        ).toBe("finalizada");
      },
    );

    it(
      "filtra solo campañas activas para Hero, filtros y selectores comerciales",
      () => {
        const campaigns = [
          createCampaign({
            id: "activa",
          }),
          createCampaign({
            id: "programada",
            startDate: "2026-08-01",
            endDate: "2026-08-31",
          }),
          createCampaign({
            id: "finalizada",
            startDate: "2026-06-01",
            endDate: "2026-06-30",
          }),
          createCampaign({
            id: "oculta",
            publicationStatus: "oculta",
          }),
          createCampaign({
            id: "borrador",
            publicationStatus: "borrador",
          }),
        ];

        expect(
          filterActiveCampaigns(
            campaigns,
            NOW,
          ).map(
            (campaign) => campaign.id,
          ),
        ).toEqual([
          "activa",
        ]);
      },
    );

    it(
      "tolera el índice runtime y recomienda wrapper explícito en filter",
      () => {
        const campaign =
          createCampaign();

        expect(
          [campaign].filter(
            (item) =>
              isCampaignActive(
                item,
                NOW,
              ),
          ),
        ).toEqual([
          campaign,
        ]);

        expect(() =>
          isCampaignActive(
            campaign,
            0 as unknown as Date,
          ),
        ).not.toThrow();
      },
    );

    it(
      "una fecha de referencia Date inválida no provoca crash",
      () => {
        expect(() =>
          getCampaignComputedStatus(
            createCampaign(),
            new Date("invalid"),
          ),
        ).not.toThrow();
      },
    );
  },
);
