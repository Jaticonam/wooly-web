import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getBadgeThemePresentation,
} from "./BadgeThemeMap";

describe(
  "BadgeThemeMap",
  () => {
    it(
      "aplica la paleta secundaria a Promo Flash",
      () => {
        const presentation =
          getBadgeThemePresentation(
            "promotion.flash",
          );

        expect(
          presentation.className,
        ).toContain(
          "from-fuchsia-600",
        );

        expect(
          presentation.className,
        ).toContain(
          "via-purple-600",
        );

        expect(
          presentation.className,
        ).toContain(
          "to-violet-600",
        );

        expect(
          presentation.animation,
        ).toBe(
          "animate-pulse",
        );
      },
    );

    it(
      "aplica cian y azul a Nuevo sin animación permanente",
      () => {
        const presentation =
          getBadgeThemePresentation(
            "merchandising.new",
          );

        expect(
          presentation.className,
        ).toContain(
          "from-cyan-500",
        );

        expect(
          presentation.className,
        ).toContain(
          "to-blue-600",
        );

        expect(
          presentation.animation,
        ).toBe(
          "",
        );
      },
    );

    it(
      "aplica ámbar y naranja a Más vendido",
      () => {
        const presentation =
          getBadgeThemePresentation(
            "merchandising.bestSeller",
          );

        expect(
          presentation.className,
        ).toContain(
          "from-amber-400",
        );

        expect(
          presentation.className,
        ).toContain(
          "via-orange-400",
        );

        expect(
          presentation.className,
        ).toContain(
          "to-orange-500",
        );

        expect(
          presentation.animation,
        ).toBe(
          "",
        );
      },
    );

    it(
      "aplica grafito y champagne a Premium",
      () => {
        const presentation =
          getBadgeThemePresentation(
            "merchandising.premium",
          );

        expect(
          presentation.className,
        ).toContain(
          "from-slate-950",
        );

        expect(
          presentation.className,
        ).toContain(
          "via-slate-900",
        );

        expect(
          presentation.className,
        ).toContain(
          "to-zinc-800",
        );

        expect(
          presentation.className,
        ).toContain(
          "text-amber-200",
        );

        expect(
          presentation.animation,
        ).toBe(
          "",
        );
      },
    );

    it(
      "preserva los colores propios de campañas",
      () => {
        expect(
          getBadgeThemePresentation(
            "campaign.lavanda",
          ).className,
        ).toBe(
          "catalog-campaign-lavender",
        );

        expect(
          getBadgeThemePresentation(
            "campaign.celeste",
          ).className,
        ).toBe(
          "catalog-campaign-sky",
        );

        expect(
          getBadgeThemePresentation(
            "campaign.personalizada",
          ).className,
        ).toBe(
          "catalog-campaign-purple",
        );
      },
    );
  },
);
