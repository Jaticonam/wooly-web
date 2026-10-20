import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  HealthCollector,
  HealthComponentData,
} from "@wooly/contracts/monitoring/contracts/HealthCollector";
import {
  HealthEngine,
} from "./HealthEngine";

const fixedGeneratedAt =
  "2026-07-26T20:00:00.000Z";

function collector(
  id: string,
  data:
    HealthComponentData = {
      status: "ok",
      score: 100,
    },
): HealthCollector {
  return {
    id,
    collect: () => data,
  };
}

function createEngine(
  collectors:
    readonly HealthCollector[],
  options: {
    now?: () => number;
    writeReport?: (
      report:
        Awaited<
          ReturnType<
            HealthEngine["build"]
          >
        >,
    ) => Promise<void>;
  } = {},
) {
  return new HealthEngine({
    getCollectors:
      () => collectors,
    writeReport:
      options.writeReport ??
      vi.fn().mockResolvedValue(
        undefined,
      ),
    now:
      options.now ??
      (() => 10),
    generatedAt:
      () => fixedGeneratedAt,
  });
}

describe("HealthEngine", () => {
  it("genera healthy cuando todos los collectors son exitosos", async () => {
    const report =
      await createEngine([
        collector("http"),
        collector("sheets"),
      ]).build();

    expect(report).toMatchObject({
      generatedAt:
        fixedGeneratedAt,
      overallStatus: "healthy",
      score: 100,
      issues: [],
    });
    expect(
      report.collectors,
    ).toHaveLength(2);
  });

  it("aísla un collector que lanza y continúa", async () => {
    const failed:
      HealthCollector = {
        id: "sheets",
        collect: () => {
          throw new Error(
            "secret payload https://private.example",
          );
        },
      };
    const report =
      await createEngine([
        collector("http"),
        failed,
        collector("storage"),
      ]).build();

    expect(
      report.collectors,
    ).toHaveLength(3);
    expect(report).toMatchObject({
      overallStatus:
        "degraded",
      score: 70,
    });
    expect(
      report.issues[0],
    ).toEqual({
      collectorId: "sheets",
      code:
        "COLLECTOR_FAILED",
      message:
        "Collector execution failed.",
      retryable: true,
      durationMs: 0,
    });
    expect(
      JSON.stringify(report),
    ).not.toContain(
      "private.example",
    );
  });

  it("representa varios fallos sin rechazar el reporte", async () => {
    const failing = (
      id: string,
    ): HealthCollector => ({
      id,
      collect: () =>
        Promise.reject(
          new Error("failed"),
        ),
    });
    const report =
      await createEngine([
        collector("http"),
        failing("sheets"),
        failing("storage"),
      ]).build();

    expect(report.score).toBe(40);
    expect(
      report.overallStatus,
    ).toBe("unhealthy");
    expect(report.issues).toHaveLength(
      2,
    );
  });

  it.each([
    null,
    {
      status: "unknown",
      score: 100,
    },
    {
      status: "ok",
      score: Number.NaN,
    },
    {
      status: "ok",
      score: 101,
    },
  ])(
    "rechaza un resultado inválido: %s",
    async (value) => {
      const invalid = {
        id: "invalid",
        collect: () => value,
      } as unknown as HealthCollector;
      const report =
        await createEngine([
          collector("http"),
          invalid,
        ]).build();

      expect(
        report.collectors[1],
      ).toMatchObject({
        ok: false,
        collectorId: "invalid",
        error: {
          code:
            "INVALID_COLLECTOR_RESULT",
        },
      });
    },
  );

  it("rechaza detalles circulares y mantiene JSON serializable", async () => {
    const details:
      Record<string, unknown> = {};
    details.self = details;

    const report =
      await createEngine([
        collector("circular", {
          status: "ok",
          score: 100,
          details,
        }),
      ]).build();

    expect(
      report.collectors[0].ok,
    ).toBe(false);
    expect(() =>
      JSON.stringify(report),
    ).not.toThrow();
  });

  it("considera unhealthy una lista vacía con score finito", async () => {
    const report =
      await createEngine(
        [],
      ).build();

    expect(report).toMatchObject({
      overallStatus:
        "unhealthy",
      score: 0,
      collectors: [],
      issues: [],
    });
    expect(
      Number.isFinite(
        report.score,
      ),
    ).toBe(true);
  });

  it("registra la duración no negativa", async () => {
    const times = [
      10,
      37,
    ];
    const report =
      await createEngine(
        [collector("timed")],
        {
          now: () =>
            times.shift() ??
            37,
        },
      ).build();

    expect(
      report.collectors[0]
        .durationMs,
    ).toBe(27);
  });

  it("preserva la penalización warning existente", async () => {
    const report =
      await createEngine([
        collector("warning", {
          status: "warning",
          score: 80,
        }),
      ]).build();

    expect(report).toMatchObject({
      overallStatus:
        "degraded",
      score: 90,
    });
  });

  it("acota el score entre 0 y 100 ante muchos fallos", async () => {
    const collectors =
      Array.from(
        {
          length: 10,
        },
        (_, index):
          HealthCollector => ({
          id: `failed-${index}`,
          collect: () => {
            throw new Error(
              "failed",
            );
          },
        }),
      );
    const report =
      await createEngine(
        collectors,
      ).build();

    expect(report.score).toBe(0);
    expect(report.score).toBeGreaterThanOrEqual(
      0,
    );
    expect(report.score).toBeLessThanOrEqual(
      100,
    );
  });

  it("no muta la lista ni los resultados del collector", async () => {
    const data:
      HealthComponentData = {
      status: "ok",
      score: 100,
      details: {
        source: "local",
      },
    };
    const collectors = [
      collector("stable", data),
    ];
    const snapshot =
      structuredClone(data);

    await createEngine(
      collectors,
    ).build();

    expect(collectors).toHaveLength(
      1,
    );
    expect(data).toEqual(snapshot);
  });

  it("propaga un fallo de escritura global", async () => {
    const writeError =
      new Error(
        "filesystem unavailable",
      );
    const engine =
      createEngine(
        [collector("http")],
        {
          writeReport: () =>
            Promise.reject(
              writeError,
            ),
        },
      );

    await expect(
      engine.build(),
    ).rejects.toBe(writeError);
  });
});
