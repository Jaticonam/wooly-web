import {
  requestJson,
} from "../../../infrastructure/http";

import type {
  ExternalHttpError,
} from "@wooly/contracts/infrastructure/http/ExternalHttpTypes";

import type {
  JungCoreSnapshotLoader,
} from "./JungCoreSnapshotLoader";

export type HttpJungCoreSnapshotLoaderErrorCode =
  | "HTTP_TIMEOUT"
  | "HTTP_NETWORK_ERROR"
  | "HTTP_401"
  | "HTTP_403"
  | "HTTP_404"
  | "HTTP_502"
  | "HTTP_503"
  | "HTTP_504"
  | "JUNG_CORE_SNAPSHOT_INVALID"
  | "CONFIGURATION_ERROR"
  | "UNKNOWN_ERROR";

export interface HttpJungCoreSnapshotLoaderErrorOptions {
  readonly status?: number;
  readonly retryable: boolean;
  readonly loaderCause?: unknown;
}

export class HttpJungCoreSnapshotLoaderError
  extends Error {
  readonly code:
    HttpJungCoreSnapshotLoaderErrorCode;

  readonly status?:
    number;

  readonly retryable:
    boolean;

  readonly loaderCause?:
    unknown;

  constructor(
    code:
      HttpJungCoreSnapshotLoaderErrorCode,

    message:
      string,

    options:
      HttpJungCoreSnapshotLoaderErrorOptions,
  ) {
    super(message);

    this.name =
      "HttpJungCoreSnapshotLoaderError";

    this.code =
      code;

    this.status =
      options.status;

    this.retryable =
      options.retryable;

    this.loaderCause =
      options.loaderCause;
  }
}

export interface HttpJungCoreSnapshotLoaderOptions {
  readonly url:
    string;

  readonly timeoutMs?:
    number;

  readonly signal?:
    AbortSignal;

  /**
   * Solo debe habilitarse explicitamente para pruebas
   * o desarrollo local controlado.
   */
  readonly allowInsecureHttp?:
    boolean;
}

const SOURCE =
  "JUNG CORE catalog snapshot";

function configurationError(
  message:
    string,

  cause?:
    unknown,
): HttpJungCoreSnapshotLoaderError {
  return new HttpJungCoreSnapshotLoaderError(
    "CONFIGURATION_ERROR",
    message,

    {
      retryable:
        false,

      loaderCause:
        cause,
    },
  );
}

function normalizeUrl(
  value:
    string,

  allowInsecureHttp:
    boolean,
): string {
  const normalized =
    String(value ?? "").trim();

  if (!normalized) {
    throw configurationError(
      "La URL del snapshot de JUNG CORE es obligatoria.",
    );
  }

  let url:
    URL;

  try {
    url =
      new URL(normalized);
  } catch (cause: unknown) {
    throw configurationError(
      "La URL del snapshot de JUNG CORE no es valida.",
      cause,
    );
  }

  if (
    url.username ||
    url.password
  ) {
    throw configurationError(
      "La URL del snapshot no puede contener credenciales.",
    );
  }

  const secure =
    url.protocol ===
      "https:";

  const explicitlyAllowedHttp =
    allowInsecureHttp &&
    url.protocol ===
      "http:";

  if (
    !secure &&
    !explicitlyAllowedHttp
  ) {
    throw configurationError(
      "La URL del snapshot debe usar HTTPS.",
    );
  }

  return url.toString();
}

function normalizeTimeout(
  value:
    number |
    undefined,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw configurationError(
      "timeoutMs debe ser un numero positivo.",
    );
  }

  return value;
}

function mapHttpStatus(
  status:
    number |
    undefined,
): HttpJungCoreSnapshotLoaderErrorCode {
  switch (status) {
    case 401:
      return "HTTP_401";

    case 403:
      return "HTTP_403";

    case 404:
      return "HTTP_404";

    case 502:
      return "HTTP_502";

    case 503:
      return "HTTP_503";

    case 504:
      return "HTTP_504";

    default:
      return "UNKNOWN_ERROR";
  }
}

function mapExternalErrorCode(
  error:
    ExternalHttpError,
): HttpJungCoreSnapshotLoaderErrorCode {
  switch (error.code) {
    case "TIMEOUT":
      return "HTTP_TIMEOUT";

    case "NETWORK_ERROR":
      return "HTTP_NETWORK_ERROR";

    case "HTTP_ERROR":
      return mapHttpStatus(
        error.status,
      );

    case "EMPTY_BODY":
    case "UNEXPECTED_CONTENT_TYPE":
    case "INVALID_JSON":
      return "JUNG_CORE_SNAPSHOT_INVALID";

    case "ABORTED":
    default:
      return "UNKNOWN_ERROR";
  }
}

export function translateJungCoreHttpError(
  error:
    ExternalHttpError,
): HttpJungCoreSnapshotLoaderError {
  return new HttpJungCoreSnapshotLoaderError(
    mapExternalErrorCode(
      error,
    ),

    error.message,

    {
      status:
        error.status,

      retryable:
        error.retryable,

      loaderCause:
        error,
    },
  );
}

export class HttpJungCoreSnapshotLoader
  implements JungCoreSnapshotLoader {
  private readonly url:
    string;

  private readonly timeoutMs?:
    number;

  private readonly signal?:
    AbortSignal;

  constructor(
    options:
      HttpJungCoreSnapshotLoaderOptions,
  ) {
    this.url =
      normalizeUrl(
        options.url,
        options.allowInsecureHttp ===
          true,
      );

    this.timeoutMs =
      normalizeTimeout(
        options.timeoutMs,
      );

    this.signal =
      options.signal;
  }

  async loadSnapshot():
    Promise<unknown> {
    const result =
      await requestJson<unknown>(
        this.url,

        {
          source:
            SOURCE,

          ...(
            this.timeoutMs !==
              undefined
              ? {
                  timeoutMs:
                    this.timeoutMs,
                }
              : {}
          ),

          ...(
            this.signal
              ? {
                  signal:
                    this.signal,
                }
              : {}
          ),
        },
      );

    if (result.ok === false) {
      throw translateJungCoreHttpError(
        result.error,
      );
    }

    return result.data;
  }
}