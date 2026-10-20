export interface HealthComponentData {
  status: "ok" | "warning" | "error";
  score: number;
  details?: unknown;
}

export interface HealthCollector<
  TData = HealthComponentData,
> {
  id: string;
  collect(): Promise<TData> | TData;
}

export interface HealthCollectorError {
  code:
    | "COLLECTOR_FAILED"
    | "INVALID_COLLECTOR_RESULT";
  message: string;
  retryable: boolean;
  cause?: unknown;
}

export type HealthCollectorResult<
  T = HealthComponentData,
> =
  | {
      ok: true;
      collectorId: string;
      data: T;
      durationMs: number;
    }
  | {
      ok: false;
      collectorId: string;
      error: HealthCollectorError;
      durationMs: number;
    };
