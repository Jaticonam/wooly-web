import {
  sanitizeCatalogPublicPublication,
  type CatalogPublicPublication,
} from "@wooly/contracts/catalog/domain/CatalogPublicPublication";

import type {
  CatalogPublicationProvider,
  PublishCatalogInput,
} from "../../providers/CatalogPublicationProvider";

import {
  requestJson,
  type ExternalHttpError,
} from "../../../infrastructure/http";

export type HttpCatalogPublicationProviderErrorCode =
  | "CONFIGURATION_ERROR"
  | "HTTP_TIMEOUT"
  | "HTTP_NETWORK_ERROR"
  | "HTTP_401"
  | "HTTP_403"
  | "HTTP_404"
  | "HTTP_409"
  | "HTTP_422"
  | "HTTP_429"
  | "HTTP_5XX"
  | "INVALID_PUBLICATION_RESPONSE"
  | "PUBLIC_ID_MISMATCH"
  | "UNKNOWN_ERROR";

export interface HttpCatalogPublicationProviderErrorOptions {
  readonly status?: number;
  readonly retryable: boolean;
  readonly providerCause?: unknown;
}

export class HttpCatalogPublicationProviderError
  extends Error {
  readonly code:
    HttpCatalogPublicationProviderErrorCode;

  readonly status?:
    number;

  readonly retryable:
    boolean;

  readonly providerCause?:
    unknown;

  constructor(
    code:
      HttpCatalogPublicationProviderErrorCode,

    message:
      string,

    options:
      HttpCatalogPublicationProviderErrorOptions,
  ) {
    super(message);

    this.name =
      "HttpCatalogPublicationProviderError";

    this.code =
      code;

    this.status =
      options.status;

    this.retryable =
      options.retryable;

    this.providerCause =
      options.providerCause;
  }
}

export interface HttpCatalogPublicationProviderOptions {
  readonly baseUrl:
    string;

  readonly timeoutMs?:
    number;

  readonly signal?:
    AbortSignal;

  /**
   * Solo debe habilitarse explícitamente para pruebas
   * o desarrollo local controlado.
   */
  readonly allowInsecureHttp?:
    boolean;
}

const SOURCE =
  "Catalog public publication API";

function configurationError(
  message:
    string,

  cause?:
    unknown,
): HttpCatalogPublicationProviderError {
  return new HttpCatalogPublicationProviderError(
    "CONFIGURATION_ERROR",
    message,

    {
      retryable:
        false,

      providerCause:
        cause,
    },
  );
}

function normalizeBaseUrl(
  value:
    string,

  allowInsecureHttp:
    boolean,
): string {
  const normalized =
    String(value ?? "").trim();

  if (!normalized) {
    throw configurationError(
      "La URL base de publicación pública es obligatoria.",
    );
  }

  let url:
    URL;

  try {
    url =
      new URL(normalized);
  } catch (cause: unknown) {
    throw configurationError(
      "La URL base de publicación pública no es válida.",
      cause,
    );
  }

  if (
    url.username ||
    url.password
  ) {
    throw configurationError(
      "La URL base de publicación no puede contener credenciales.",
    );
  }

  if (
    url.search ||
    url.hash
  ) {
    throw configurationError(
      "La URL base de publicación no puede contener query ni hash.",
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
      "La URL base de publicación debe usar HTTPS.",
    );
  }

  return url
    .toString()
    .replace(
      /\/+$/,
      "",
    );
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
      "timeoutMs debe ser un número positivo.",
    );
  }

  return value;
}

function normalizePublicId(
  value:
    string,
): string {
  const publicId =
    String(value ?? "").trim();

  if (!publicId) {
    throw configurationError(
      "Public ID es obligatorio.",
    );
  }

  return publicId;
}

function mapHttpStatus(
  status:
    number |
    undefined,
): HttpCatalogPublicationProviderErrorCode {
  switch (status) {
    case 401:
      return "HTTP_401";

    case 403:
      return "HTTP_403";

    case 404:
      return "HTTP_404";

    case 409:
      return "HTTP_409";

    case 422:
      return "HTTP_422";

    case 429:
      return "HTTP_429";

    default:
      return (
        status !== undefined &&
        status >= 500 &&
        status <= 599
      )
        ? "HTTP_5XX"
        : "UNKNOWN_ERROR";
  }
}

function mapExternalErrorCode(
  error:
    ExternalHttpError,
): HttpCatalogPublicationProviderErrorCode {
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
      return "INVALID_PUBLICATION_RESPONSE";

    case "ABORTED":
    default:
      return "UNKNOWN_ERROR";
  }
}

export function translateCatalogPublicationHttpError(
  error:
    ExternalHttpError,
): HttpCatalogPublicationProviderError {
  return new HttpCatalogPublicationProviderError(
    mapExternalErrorCode(
      error,
    ),

    error.message,

    {
      status:
        error.status,

      retryable:
        error.retryable,

      providerCause:
        error,
    },
  );
}

function sanitizeRemotePublication(
  value:
    unknown,
): CatalogPublicPublication {
  const publication =
    sanitizeCatalogPublicPublication(
      value,
    );

  if (!publication) {
    throw new HttpCatalogPublicationProviderError(
      "INVALID_PUBLICATION_RESPONSE",
      "La API devolvió una publicación pública inválida.",

      {
        retryable:
          false,
      },
    );
  }

  return publication;
}

export class HttpCatalogPublicationProvider
  implements CatalogPublicationProvider {
  readonly source =
    SOURCE;

  private readonly baseUrl:
    string;

  private readonly timeoutMs?:
    number;

  private readonly signal?:
    AbortSignal;

  constructor(
    options:
      HttpCatalogPublicationProviderOptions,
  ) {
    this.baseUrl =
      normalizeBaseUrl(
        options.baseUrl,
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

  async publish(
    input:
      PublishCatalogInput,
  ): Promise<CatalogPublicPublication> {
    const result =
      await requestJson<unknown>(
        this.baseUrl,

        {
          source:
            this.source,

          method:
            "POST",

          headers: {
            "content-type":
              "application/json",
          },

          body:
            JSON.stringify({
              composition:
                input.composition,

              publicationIdentity:
                input.publicationIdentity,

              resolvedProductIds:
                input.resolvedProductIds,

              ...(
                input.validityDays !==
                  undefined
                  ? {
                      validityDays:
                        input.validityDays,
                    }
                  : {}
              ),
            }),

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
      throw translateCatalogPublicationHttpError(
        result.error,
      );
    }

    return sanitizeRemotePublication(
      result.data,
    );
  }

  async getByPublicId(
    publicId:
      string,
  ): Promise<CatalogPublicPublication | null> {
    const normalizedPublicId =
      normalizePublicId(
        publicId,
      );

    const url =
      `${this.baseUrl}/${encodeURIComponent(
        normalizedPublicId,
      )}`;

    const result =
      await requestJson<unknown>(
        url,

        {
          source:
            this.source,

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
      if (
        result.error.code ===
          "HTTP_ERROR" &&
        result.error.status ===
          404
      ) {
        return null;
      }

      throw translateCatalogPublicationHttpError(
        result.error,
      );
    }

    const publication =
      sanitizeRemotePublication(
        result.data,
      );

    if (
      publication.publicId !==
        normalizedPublicId
    ) {
      throw new HttpCatalogPublicationProviderError(
        "PUBLIC_ID_MISMATCH",
        "La API devolvió un Public ID distinto al solicitado.",

        {
          retryable:
            false,
        },
      );
    }

    return publication;
  }
}
