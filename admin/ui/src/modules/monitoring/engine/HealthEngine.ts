import fs from "node:fs/promises";
import path from "node:path";

import type {
  HealthCollector,
  HealthCollectorResult,
  HealthComponentData,
} from "@wooly/contracts/monitoring/contracts/HealthCollector";
import type {
  HealthIssue,
  HealthOverallStatus,
  HealthReport,
} from "../models/HealthReport";
import {
  HealthCollectorRegistry,
} from "@wooly/shared/monitoring/registry/HealthCollectorRegistry";

const OUTPUT = path.resolve(
  process.cwd(),
  "ui/public/api/health/commercial.json",
);

type HealthReportWriter = (
  report: HealthReport,
) => Promise<void>;

interface HealthEngineOptions {
  getCollectors?: () =>
    readonly HealthCollector[];
  writeReport?: HealthReportWriter;
  now?: () => number;
  generatedAt?: () => string;
}

function clampScore(
  score: number,
): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, score),
  );
}

function isJsonSafe(
  value: unknown,
  seen = new Set<object>(),
): boolean {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (
    typeof value === "undefined" ||
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  ) {
    return false;
  }

  if (typeof value !== "object") {
    return false;
  }

  if (seen.has(value)) {
    return false;
  }

  seen.add(value);

  const entries = Array.isArray(value)
    ? value
    : Object.values(value);
  const safe = entries.every(
    (entry) =>
      isJsonSafe(entry, seen),
  );

  seen.delete(value);

  return safe;
}

function isHealthComponentData(
  value: unknown,
): value is HealthComponentData {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as Record<string, unknown>;

  return (
    (
      candidate.status === "ok" ||
      candidate.status === "warning" ||
      candidate.status === "error"
    ) &&
    typeof candidate.score === "number" &&
    Number.isFinite(candidate.score) &&
    candidate.score >= 0 &&
    candidate.score <= 100 &&
    (
      !("details" in candidate) ||
      isJsonSafe(candidate.details)
    )
  );
}

function getDuration(
  startedAt: number,
  finishedAt: number,
): number {
  return Math.max(
    0,
    Number.isFinite(
      finishedAt - startedAt,
    )
      ? finishedAt - startedAt
      : 0,
  );
}

function createFailure(
  collectorId: string,
  code:
    | "COLLECTOR_FAILED"
    | "INVALID_COLLECTOR_RESULT",
  durationMs: number,
): HealthCollectorResult {
  return {
    ok: false,
    collectorId,
    error: {
      code,
      message:
        code ===
        "COLLECTOR_FAILED"
          ? "Collector execution failed."
          : "Collector returned an invalid result.",
      retryable:
        code ===
        "COLLECTOR_FAILED",
    },
    durationMs,
  };
}

function buildIssue(
  result: HealthCollectorResult,
): HealthIssue | null {
  if (result.ok === false) {
    return {
      collectorId:
        result.collectorId,
      code:
        result.error.code,
      message:
        result.error.message,
      retryable:
        result.error.retryable,
      durationMs:
        result.durationMs,
    };
  }

  if (result.data.status === "ok") {
    return null;
  }

  return {
    collectorId:
      result.collectorId,
    code:
      result.data.status ===
      "warning"
        ? "COLLECTOR_WARNING"
        : "COLLECTOR_ERROR",
    message:
      result.data.status ===
      "warning"
        ? "Collector reported a warning."
        : "Collector reported an error.",
    retryable:
      result.data.status ===
      "error",
    durationMs:
      result.durationMs,
  };
}

function calculateScore(
  results:
    readonly HealthCollectorResult[],
): number {
  if (results.length === 0) {
    return 0;
  }

  const score = results.reduce(
    (current, result) => {
      if (!result.ok) {
        return current - 30;
      }

      if (
        result.data.status ===
        "warning"
      ) {
        return current - 10;
      }

      if (
        result.data.status ===
        "error"
      ) {
        return current - 30;
      }

      return current;
    },
    100,
  );

  return clampScore(score);
}

function getOverallStatus(
  results:
    readonly HealthCollectorResult[],
  issues: readonly HealthIssue[],
  score: number,
): HealthOverallStatus {
  const successful =
    results.filter(
      (result) => result.ok,
    ).length;
  const hasCriticalResult =
    results.some(
      (result) =>
        result.ok &&
        result.data.status ===
          "error",
    );

  if (
    results.length === 0 ||
    successful === 0 ||
    hasCriticalResult ||
    score < 60
  ) {
    return "unhealthy";
  }

  if (
    issues.length > 0 ||
    score < 90
  ) {
    return "degraded";
  }

  return "healthy";
}

async function writeHealthReport(
  report: HealthReport,
): Promise<void> {
  await fs.mkdir(
    path.dirname(OUTPUT),
    {
      recursive: true,
    },
  );

  await fs.writeFile(
    OUTPUT,
    JSON.stringify(
      report,
      null,
      2,
    ),
  );
}

export class HealthEngine {
  private readonly getCollectors:
    () => readonly HealthCollector[];

  private readonly writeReport:
    HealthReportWriter;

  private readonly now:
    () => number;

  private readonly generatedAt:
    () => string;

  constructor(
    options:
      HealthEngineOptions = {},
  ) {
    this.getCollectors =
      options.getCollectors ??
      (() =>
        HealthCollectorRegistry
          .getAll());
    this.writeReport =
      options.writeReport ??
      writeHealthReport;
    this.now =
      options.now ??
      Date.now;
    this.generatedAt =
      options.generatedAt ??
      (() =>
        new Date()
          .toISOString());
  }

  async build():
    Promise<HealthReport> {
    const collectors = [
      ...this.getCollectors(),
    ];
    const results:
      HealthCollectorResult[] = [];

    for (
      const collector of
      collectors
    ) {
      const collectorId =
        collector.id.trim();
      const startedAt =
        this.now();

      if (!collectorId) {
        results.push(
          createFailure(
            "unknown",
            "INVALID_COLLECTOR_RESULT",
            getDuration(
              startedAt,
              this.now(),
            ),
          ),
        );
        continue;
      }

      try {
        const data =
          await collector.collect();
        const durationMs =
          getDuration(
            startedAt,
            this.now(),
          );

        results.push(
          isHealthComponentData(data)
            ? {
                ok: true,
                collectorId,
                data,
                durationMs,
              }
            : createFailure(
                collectorId,
                "INVALID_COLLECTOR_RESULT",
                durationMs,
              ),
        );
      } catch {
        results.push(
          createFailure(
            collectorId,
            "COLLECTOR_FAILED",
            getDuration(
              startedAt,
              this.now(),
            ),
          ),
        );
      }
    }

    const issues = results.flatMap(
      (result) => {
        const issue =
          buildIssue(result);

        return issue
          ? [issue]
          : [];
      },
    );
    const score =
      calculateScore(results);
    const report: HealthReport = {
      generatedAt:
        this.generatedAt(),
      overallStatus:
        getOverallStatus(
          results,
          issues,
          score,
        ),
      score,
      collectors: results,
      issues,
    };

    await this.writeReport(report);

    return report;
  }
}

export const healthEngine =
  new HealthEngine();
