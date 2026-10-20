import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isObsoleteLegacyBadgeValue,
  normalizeLegacyBadgeValue,
  resolveLegacyBadgeValue,
} from "./LegacyBadgeAliases";

describe(
  "LegacyBadgeAliases",
  () => {
    it.each([
      ["Best Seller", "best seller"],
      ["✨ Más vendido", "mas vendido"],
      ["🔥🚀 Bestseller", "bestseller"],
      ["⚡️ Favorito", "favorito"],
      ["Más Vendido", "mas vendido"],
      ["Top 10", "top 10"],
      ["best-seller", "best-seller"],
      ["", ""],
      [
        "producto clasico",
        "producto clasico",
      ],
    ])(
      "normaliza %j como %j",
      (
        input,
        expected,
      ) => {
        expect(
          normalizeLegacyBadgeValue(
            input,
          ),
        ).toBe(
          expected,
        );
      },
    );

    it.each([
      [
        "Más vendido",
        "merchandising.bestSeller",
        "Más vendido",
      ],
      [
        "Nuevo",
        "merchandising.new",
        "Nuevo",
      ],
      [
        "Nuevo ingreso",
        "merchandising.new",
        "Nuevo",
      ],
      [
        "Novedad",
        "merchandising.new",
        "Nuevo",
      ],
      [
        "Premium",
        "merchandising.premium",
        "Premium",
      ],
      [
        "Selección Premium",
        "merchandising.premium",
        "Premium",
      ],
    ])(
      "homologa %j como %j",
      (
        value,
        expectedCode,
        expectedLabel,
      ) => {
        const resolution =
          resolveLegacyBadgeValue(
            value,
          );

        expect(
          resolution?.type,
        ).toBe(
          "badge",
        );

        if (
          !resolution ||
          resolution.type !==
            "badge"
        ) {
          throw new Error(
            `No se resolvió el badge ${value}`,
          );
        }

        expect(
          resolution.badge,
        ).toMatchObject({
          code:
            expectedCode,

          label:
            expectedLabel,

          themeToken:
            expectedCode,
        });
      },
    );

    it.each([
      "Todo el Año",
      "✨Todo el Año",
      "todo-el-ano",
    ])(
      "no reconoce %j como alias válido",
      (
        value,
      ) => {
        expect(
          resolveLegacyBadgeValue(
            value,
          ),
        ).toBeNull();
      },
    );

    it.each([
      "Todo el Año",
      "✨Todo el Año",
      "todo-el-ano",
    ])(
      "identifica %j como valor legacy obsoleto",
      (
        value,
      ) => {
        expect(
          isObsoleteLegacyBadgeValue(
            value,
          ),
        ).toBe(
          true,
        );
      },
    );

    it.each([
      "Más vendido",
      "Nuevo",
      "Premium",
      "valor desconocido",
    ])(
      "no identifica %j como valor legacy obsoleto",
      (
        value,
      ) => {
        expect(
          isObsoleteLegacyBadgeValue(
            value,
          ),
        ).toBe(
          false,
        );
      },
    );
  },
);
