import type {
  HealthCollectorResult,
  HealthComponentData,
} from "@wooly/contracts/monitoring/contracts/HealthCollector";

export type HealthOverallStatus =
  | "healthy"
  | "degraded"
  | "unhealthy";

export interface HealthIssue {
  collectorId: string;
  code:
    | "COLLECTOR_WARNING"
    | "COLLECTOR_ERROR"
    | "COLLECTOR_FAILED"
    | "INVALID_COLLECTOR_RESULT";
  message: string;
  retryable: boolean;
  durationMs: number;
}

export interface HealthReport {
  generatedAt: string;
  overallStatus: HealthOverallStatus;
  score: number;
  collectors:
    HealthCollectorResult<HealthComponentData>[];
  issues: HealthIssue[];
}
