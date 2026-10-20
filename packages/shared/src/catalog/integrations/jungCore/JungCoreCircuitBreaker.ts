import {
  shouldUseCatalogFallback,
} from "../../providers/CatalogFallbackPolicy";

export type JungCoreCircuitBreakerStatus =
  | "disabled"
  | "closed"
  | "open"
  | "half-open";

export interface JungCoreCircuitBreakerState {
  readonly status:
    JungCoreCircuitBreakerStatus;

  readonly consecutiveFailures:
    number;

  readonly openedAt:
    number | null;

  readonly nextAttemptAt:
    number | null;
}

export interface JungCoreCircuitBreakerOptions {
  readonly enabled?:
    boolean;

  readonly failureThreshold?:
    number;

  readonly cooldownMs?:
    number;

  readonly now?:
    () => number;

  readonly shouldCountFailure?:
    (
      cause:
        unknown,
    ) => boolean;
}

export class JungCoreCircuitOpenError
  extends Error {
  readonly code =
    "JUNG_CORE_CIRCUIT_OPEN" as const;

  readonly retryable =
    true;

  constructor(
    readonly openedAt:
      number,

    readonly nextAttemptAt:
      number,
  ) {
    super(
      "El circuito de JUNG CORE esta abierto temporalmente.",
    );

    this.name =
      "JungCoreCircuitOpenError";
  }
}

const DEFAULT_FAILURE_THRESHOLD =
  3;

const DEFAULT_COOLDOWN_MS =
  30_000;

function positiveInteger(
  value:
    number | undefined,

  fallback:
    number,

  field:
    string,
): number {
  const resolved =
    value ?? fallback;

  if (
    !Number.isInteger(resolved) ||
    resolved <= 0
  ) {
    throw new RangeError(
      `${field} debe ser un entero positivo.`,
    );
  }

  return resolved;
}

function positiveNumber(
  value:
    number | undefined,

  fallback:
    number,

  field:
    string,
): number {
  const resolved =
    value ?? fallback;

  if (
    !Number.isFinite(resolved) ||
    resolved <= 0
  ) {
    throw new RangeError(
      `${field} debe ser un numero positivo.`,
    );
  }

  return resolved;
}

export class JungCoreCircuitBreaker {
  private readonly enabled:
    boolean;

  private readonly failureThreshold:
    number;

  private readonly cooldownMs:
    number;

  private readonly now:
    () => number;

  private readonly shouldCountFailure:
    (
      cause:
        unknown,
    ) => boolean;

  private state:
    JungCoreCircuitBreakerState;

  constructor(
    options:
      JungCoreCircuitBreakerOptions = {},
  ) {
    this.enabled =
      options.enabled ===
        true;

    this.failureThreshold =
      positiveInteger(
        options.failureThreshold,
        DEFAULT_FAILURE_THRESHOLD,
        "failureThreshold",
      );

    this.cooldownMs =
      positiveNumber(
        options.cooldownMs,
        DEFAULT_COOLDOWN_MS,
        "cooldownMs",
      );

    this.now =
      options.now ??
      Date.now;

    this.shouldCountFailure =
      options.shouldCountFailure ??
      shouldUseCatalogFallback;

    this.state = {
      status:
        this.enabled
          ? "closed"
          : "disabled",

      consecutiveFailures:
        0,

      openedAt:
        null,

      nextAttemptAt:
        null,
    };
  }

  getState():
    JungCoreCircuitBreakerState {
    return {
      ...this.state,
    };
  }

  beforeRequest():
    void {
    if (!this.enabled) {
      return;
    }

    if (
      this.state.status !==
        "open"
    ) {
      return;
    }

    const nextAttemptAt =
      this.state.nextAttemptAt;

    const openedAt =
      this.state.openedAt;

    if (
      nextAttemptAt === null ||
      openedAt === null
    ) {
      this.close();
      return;
    }

    if (
      this.now() <
      nextAttemptAt
    ) {
      throw new JungCoreCircuitOpenError(
        openedAt,
        nextAttemptAt,
      );
    }

    this.state = {
      ...this.state,

      status:
        "half-open",
    };
  }

  recordSuccess():
    void {
    if (!this.enabled) {
      return;
    }

    this.close();
  }

  recordFailure(
    cause:
      unknown,
  ): void {
    if (!this.enabled) {
      return;
    }

    if (
      !this.shouldCountFailure(
        cause,
      )
    ) {
      this.close();
      return;
    }

    const failures =
      this.state
        .consecutiveFailures +
      1;

    if (
      this.state.status ===
        "half-open" ||
      failures >=
        this.failureThreshold
    ) {
      this.open(
        Math.max(
          failures,
          this.failureThreshold,
        ),
      );

      return;
    }

    this.state = {
      status:
        "closed",

      consecutiveFailures:
        failures,

      openedAt:
        null,

      nextAttemptAt:
        null,
    };
  }

  reset():
    void {
    if (!this.enabled) {
      this.state = {
        status:
          "disabled",

        consecutiveFailures:
          0,

        openedAt:
          null,

        nextAttemptAt:
          null,
      };

      return;
    }

    this.close();
  }

  private close():
    void {
    this.state = {
      status:
        "closed",

      consecutiveFailures:
        0,

      openedAt:
        null,

      nextAttemptAt:
        null,
    };
  }

  private open(
    failures:
      number,
  ): void {
    const openedAt =
      this.now();

    this.state = {
      status:
        "open",

      consecutiveFailures:
        failures,

      openedAt,

      nextAttemptAt:
        openedAt +
        this.cooldownMs,
    };
  }
}