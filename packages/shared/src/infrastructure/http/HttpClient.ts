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
