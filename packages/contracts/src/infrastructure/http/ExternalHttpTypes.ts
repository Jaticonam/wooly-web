export type ExternalHttpErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "ABORTED"
  | "HTTP_ERROR"
  | "EMPTY_BODY"
  | "UNEXPECTED_CONTENT_TYPE"
  | "INVALID_JSON";

export interface ExternalHttpError {
  code: ExternalHttpErrorCode;
  source: string;
  message: string;
  retryable: boolean;
  status?: number;
  /**
   * Espera sugerida por el servidor (cabecera `Retry-After`) para HTTP 429.
   *
   * Solo se informa cuando el valor es un entero decimal de segundos dentro
   * de 1..3600 (ver `parseRetryAfterSeconds` en el cliente HTTP compartido).
   * Es informativo: el cliente nunca espera ni reintenta automáticamente.
   */
  retryAfterSeconds?: number;
  cause?: unknown;
}

export type ExternalResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: ExternalHttpError;
    };

export interface ExternalRequestOptions {
  source: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  expectedContentTypes?:
    readonly string[];

  /**
   * Opciones HTTP opcionales.
   *
   * Si no se especifican, fetch conserva el
   * comportamiento GET existente.
   */
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
}

export class ExternalHttpRequestError
  extends Error {
  readonly code:
    ExternalHttpErrorCode;

  readonly source:
    string;

  readonly retryable:
    boolean;

  readonly status?:
    number;

  readonly retryAfterSeconds?:
    number;

  readonly cause?:
    unknown;

  constructor(
    error: ExternalHttpError,
  ) {
    super(error.message);

    this.name =
      "ExternalHttpRequestError";

    this.code =
      error.code;

    this.source =
      error.source;

    this.retryable =
      error.retryable;

    this.status =
      error.status;

    this.retryAfterSeconds =
      error.retryAfterSeconds;

    this.cause =
      error.cause;
  }
}
