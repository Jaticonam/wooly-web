import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Campaign,
  Product,
} from "../../../types/product";

import {
  resolveCampaignBadges,
} from "./CampaignBadgeResolver";

const createProduct = (
  campaigns: string[],
): Product => ({
  id:
    "TEST-001",

  title:
    "Producto de prueba",

  description:
    "Producto para pruebas",

  category:
    "cajas",

  price_1:
    10,

  stock:
    10,

  img:
    "/placeholder.svg",

  badges:
    [],

  campaigns,
});

const createCampaign = (
  overrides:
    Partial<Campaign> = {},
): Campaign => ({
  id:
    "dia-madre",

  name:
    "Día de la Madre",

  icon:
    "💐",

  color:
    "lavanda",

  themeToken:
    "campaign.lavanda",

  colorClass:
    "catalog-campaign-lavender",

  startDate:
    "01/01/2000",

  endDate:
    "31/12/2999",

  priority:
    90,

  publicationStatus:
    "Publicado",

  computedStatus:
    "activa",

  ...overrides,
});

describe(
  "resolveCampaignBadges",
  () => {
    it(
      "convierte una campaña oficial activa en badge",
      () => {
        const campaign =
          createCampaign();

        const registry =
          new Map([
            [
              campaign.id,
              campaign,
            ],
          ]);

        const resolution =
          resolveCampaignBadges(
            createProduct([
              campaign.id,
            ]),
            registry,
          );

        expect(
          resolution.badges[0],
        ).toMatchObject({
          code:
            "campaign.dia-madre",

          label:
            "Día de la Madre",

          icon:
            "💐",

          themeToken:
            "campaign.lavanda",

          source:
            "campaign",

          sourceReferenceId:
            "dia-madre",
        });
      },
    );

    it(
      "no muestra una campaña programada",
      () => {
        const campaign =
          createCampaign({
            id:
              "campana-futura",

            startDate:
              "01/01/2999",

            endDate:
              "31/12/2999",
          });

        const registry =
          new Map([
            [
              campaign.id,
              campaign,
            ],
          ]);

        const resolution =
          resolveCampaignBadges(
            createProduct([
              campaign.id,
            ]),
            registry,
          );

        expect(
          resolution.badges,
        ).toHaveLength(0);
      },
    );

    it(
      "no muestra una campaña finalizada",
      () => {
        const campaign =
          createCampaign({
            id:
              "campana-antigua",

            startDate:
              "01/01/2000",

            endDate:
              "31/12/2000",
          });

        const registry =
          new Map([
            [
              campaign.id,
              campaign,
            ],
          ]);

        const resolution =
          resolveCampaignBadges(
            createProduct([
              campaign.id,
            ]),
            registry,
          );

        expect(
          resolution.badges,
        ).toHaveLength(0);
      },
    );

    it(
      "no muestra una campaña oculta",
      () => {
        const campaign =
          createCampaign({
            id:
              "campana-oculta",

            publicationStatus:
              "Oculta",

            computedStatus:
              "oculta",
          });

        const registry =
          new Map([
            [
              campaign.id,
              campaign,
            ],
          ]);

        const resolution =
          resolveCampaignBadges(
            createProduct([
              campaign.id,
            ]),
            registry,
          );

        expect(
          resolution.badges,
        ).toHaveLength(0);
      },
    );

    it(
      "no muestra una campaña en borrador",
      () => {
        const campaign =
          createCampaign({
            id:
              "campana-borrador",

            publicationStatus:
              "Borrador",

            computedStatus:
              "borrador",
          });

        const registry =
          new Map([
            [
              campaign.id,
              campaign,
            ],
          ]);

        const resolution =
          resolveCampaignBadges(
            createProduct([
              campaign.id,
            ]),
            registry,
          );

        expect(
          resolution.badges,
        ).toHaveLength(0);
      },
    );

    it(
      "registra relaciones inexistentes",
      () => {
        const resolution =
          resolveCampaignBadges(
            createProduct([
              "campana-inexistente",
            ]),
            new Map(),
          );

        expect(
          resolution.unresolvedCampaignIds,
        ).toEqual([
          "campana-inexistente",
        ]);
      },
    );

    it(
      "ordena campañas activas por prioridad",
      () => {
        const lower =
          createCampaign({
            id:
              "campana-menor",

            name:
              "Campaña menor",

            priority:
              20,
          });

        const higher =
          createCampaign({
            id:
              "campana-mayor",

            name:
              "Campaña mayor",

            priority:
              100,
          });

        const registry =
          new Map([
            [
              lower.id,
              lower,
            ],
            [
              higher.id,
              higher,
            ],
          ]);

        const resolution =
          resolveCampaignBadges(
            createProduct([
              lower.id,
              higher.id,
            ]),
            registry,
          );

        expect(
          resolution.badges.map(
            (badge) =>
              badge.code,
          ),
        ).toEqual([
          "campaign.campana-mayor",
          "campaign.campana-menor",
        ]);
      },
    );
  },
);
