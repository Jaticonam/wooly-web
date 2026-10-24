import type {
  ExternalHttpError,
  ExternalRequestOptions,
  ExternalResult,
} from "@wooly/contracts/infrastructure/http/ExternalHttpTypes";

const DEFAULT_TIMEOUT_MS =
  10_000;

const RETRYABLE_HTTP_STATUSES =
  new Set([
    408,
    425,
    429,
    500,
    502,
    503,
    504,
  ]);

/**
 * Política de normalización de `Retry-After` (P4-SEC-03):
 *
 * - Solo se interpreta en respuestas HTTP 429.
 * - Solo se acepta la forma delta-seconds: dígitos decimales, sin signo,
 *   sin decimales y sin texto adicional (se toleran espacios alrededor).
 *   JUNG CORE emite siempre un entero ≥ 1 (`Math.ceil`).
 * - El valor debe estar en 1..MAX_RETRY_AFTER_SECONDS. Cero, negativos,
 *   valores no numéricos, fechas HTTP o valores superiores al máximo se
 *   descartan (`undefined`): no se confía en ellos ni se recortan.
 * - El dato es informativo: requestText/requestJson nunca esperan ni
 *   reintentan automáticamente.
 */
export const MAX_RETRY_AFTER_SECONDS =
  3_600;

const RETRY_AFTER_PATTERN =
  /^[0-9]{1,6}$/;

export function parseRetryAfterSeconds(
  value: string | null | undefined,
): number | undefined {
  const normalized =
    String(value ?? "").trim();

  if (
    !RETRY_AFTER_PATTERN.test(
      normalized,
    )
  ) {
    return undefined;
  }

  const seconds =
    Number(normalized);

  if (
    !Number.isSafeInteger(seconds) ||
    seconds < 1 ||
    seconds > MAX_RETRY_AFTER_SECONDS
  ) {
    return undefined;
  }

  return seconds;
}

function readRetryAfterSeconds(
  response: Response,
): number | undefined {
  if (response.status !== 429) {
    return undefined;
  }

  return parseRetryAfterSeconds(
    response.headers.get(
      "retry-after",
    ),
  );
}

const JSON_CONTENT_TYPES = [
  "application/json",
  "application/*+json",
] as const;

function failure<T>(
  error: ExternalHttpError,
): ExternalResult<T> {
  return {
    ok: false,
    error,
  };
}

function normalizeContentType(
  value: string | null,
): string {
  return String(value ?? "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
}

function matchesContentType(
  actual: string,
  expected: string,
): boolean {
  const normalizedExpected =
    normalizeContentType(
      expected,
    );

  if (
    normalizedExpected ===
    actual
  ) {
    return true;
  }

  const wildcardIndex =
    normalizedExpected.indexOf("*");

  if (wildcardIndex < 0) {
    return false;
  }

  const prefix =
    normalizedExpected.slice(
      0,
      wildcardIndex,
    );

  const suffix =
    normalizedExpected.slice(
      wildcardIndex + 1,
    );

  return (
    actual.startsWith(prefix) &&
    actual.endsWith(suffix)
  );
}

function hasExpectedContentType(
  response: Response,
  expected:
    readonly string[],
): boolean {
  const actual =
    normalizeContentType(
      response.headers.get(
        "content-type",
      ),
    );

  return (
    Boolean(actual) &&
    expected.some(
      (contentType) =>
        matchesContentType(
          actual,
          contentType,
        ),
    )
  );
}

function classifyCaughtError<T>(
  cause: unknown,
  source: string,
  didTimeout: boolean,
  wasExternallyAborted: boolean,
): ExternalResult<T> {
  if (didTimeout) {
    return failure({
      code: "TIMEOUT",
      source,
      message:
        `La solicitud a "${source}" excedió el tiempo límite.`,
      retryable: true,
      cause,
    });
  }

  if (wasExternallyAborted) {
    return failure({
      code: "ABORTED",
      source,
      message:
        `La solicitud a "${source}" fue cancelada.`,
      retryable: false,
      cause,
    });
  }

  return failure({
    code: "NETWORK_ERROR",
    source,
    message:
      `No se pudo conectar con "${source}".`,
    retryable: true,
    cause,
  });
}

export async function requestText(
  url: string,
  options: ExternalRequestOptions,
): Promise<ExternalResult<string>> {
  const controller =
    new AbortController();

  const timeoutMs =
    options.timeoutMs ??
    DEFAULT_TIMEOUT_MS;

  let didTimeout =
    false;

  let wasExternallyAborted =
    options.signal?.aborted ??
    false;

  const handleExternalAbort =
    () => {
      wasExternallyAborted =
        true;

      controller.abort();
    };

  if (wasExternallyAborted) {
    return failure({
      code: "ABORTED",
      source: options.source,
      message:
        `La solicitud a "${options.source}" fue cancelada.`,
      retryable: false,
    });
  }

  options.signal?.addEventListener(
    "abort",
    handleExternalAbort,
    {
      once: true,
    },
  );

  const timeoutId =
    setTimeout(
      () => {
        didTimeout =
          true;

        controller.abort();
      },
      Math.max(
        0,
        timeoutMs,
      ),
    );

  try {
    const response =
      await fetch(
        url,
        {
          signal:
            controller.signal,

          ...(
            options.method
              ? {
                  method:
                    options.method,
                }
              : {}
          ),

          ...(
            options.headers
              ? {
                  headers:
                    options.headers,
                }
              : {}
          ),

          ...(
            options.body !==
              undefined
              ? {
                  body:
                    options.body,
                }
              : {}
          ),
        },
      );

    if (!response.ok) {
      const retryAfterSeconds =
        readRetryAfterSeconds(
          response,
        );

      return failure({
        code:
          "HTTP_ERROR",
        source:
          options.source,
        message:
          `El servicio "${options.source}" respondió HTTP ${response.status}.`,
        retryable:
          RETRYABLE_HTTP_STATUSES
            .has(
              response.status,
            ),
        status:
          response.status,

        ...(
          retryAfterSeconds !==
            undefined
            ? {
                retryAfterSeconds,
              }
            : {}
        ),
      });
    }

    if (
      options.expectedContentTypes &&
      !hasExpectedContentType(
        response,
        options.expectedContentTypes,
      )
    ) {
      return failure({
        code:
          "UNEXPECTED_CONTENT_TYPE",
        source:
          options.source,
        message:
          `El servicio "${options.source}" respondió con un Content-Type inesperado.`,
        retryable:
          false,
        status:
          response.status,
      });
    }

    const body =
      await response.text();

    if (!body.trim()) {
      return failure({
        code:
          "EMPTY_BODY",
        source:
          options.source,
        message:
          `El servicio "${options.source}" respondió sin contenido.`,
        retryable:
          false,
        status:
          response.status,
      });
    }

    return {
      ok: true,
      data: body,
    };
  } catch (cause: unknown) {
    return classifyCaughtError(
      cause,
      options.source,
      didTimeout,
      wasExternallyAborted,
    );
  } finally {
    clearTimeout(
      timeoutId,
    );

    options.signal
      ?.removeEventListener(
        "abort",
        handleExternalAbort,
      );
  }
}

export async function requestJson<T>(
  url: string,
  options: ExternalRequestOptions,
): Promise<ExternalResult<T>> {
  const textResult =
    await requestText(
      url,
      {
        ...options,
        expectedContentTypes:
          options
            .expectedContentTypes ??
          JSON_CONTENT_TYPES,
      },
    );

  if (textResult.ok === false) {
    return failure(
      textResult.error,
    );
  }

  try {
    return {
      ok: true,
      data:
        JSON.parse(
          textResult.data,
        ) as T,
    };
  } catch (cause: unknown) {
    return failure({
      code: "INVALID_JSON",
      source:
        options.source,
      message:
        `El servicio "${options.source}" respondió con JSON inválido.`,
      retryable:
        false,
      cause,
    });
  }
}
