export interface AdminBrandAccess {
  readonly role: string;
  readonly brand: {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly slug: string;
  };
}

export interface AdminSessionView {
  readonly authenticated: true;
  readonly user: {
    readonly id: string;
    readonly displayName: string;
  };
  readonly accesses: readonly AdminBrandAccess[];
  readonly session: {
    readonly expiresAt: string;
  };
}

export interface AdminConfigurationData {
  readonly brandId: string;
  readonly publicationPolicy: Record<string, unknown>;
  readonly publicationPolicySource: string;
  readonly defaultPriceList: unknown | null;
  readonly inventoryLocations: readonly unknown[];
}

export interface AdminConfigurationEnvelope {
  readonly success: boolean;
  readonly message: string;
  readonly data: AdminConfigurationData;
}

export interface AdminLoginCredentials {
  readonly documentType?: "DNI";
  readonly documentNumber: string;
  readonly password: string;
}

export class AdminAuthHttpError extends Error {
  readonly status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);

    this.name =
      "AdminAuthHttpError";

    this.status =
      status;
  }
}

function configuredBaseUrl(): string {
  const explicit =
    String(
      import.meta.env
        .VITE_JUNG_CORE_ADMIN_BASE_URL ??
        "",
    ).trim();

  return explicit || "/jung-core";
}

function normalizeBaseUrl(
  baseUrl: string,
): string {
  const normalized =
    String(baseUrl ?? "")
      .trim()
      .replace(/\/+$/, "");

  if (!normalized) {
    return "/jung-core";
  }

  return normalized;
}

export function resolveAdminCoreUrl(
  path: string,
  baseUrl = configuredBaseUrl(),
): string {
  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${normalizeBaseUrl(baseUrl)}${normalizedPath}`;
}

async function requestJson<T>(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
): Promise<T> {
  const headers:
    Record<string, string> = {
      Accept:
        "application/json",
    };

  const serializedBody =
    body === undefined
      ? undefined
      : JSON.stringify(body);

  if (serializedBody !== undefined) {
    headers["Content-Type"] =
      "application/json";
  }

  const response =
    await fetch(
      resolveAdminCoreUrl(path),
      {
        method,
        credentials:
          "include",
        cache:
          "no-store",
        headers,
        body:
          serializedBody,
      },
    );

  if (!response.ok) {
    throw new AdminAuthHttpError(
      response.status,
      `JUNG CORE respondió HTTP ${response.status}`,
    );
  }

  return await response.json() as T;
}

export function loginAdmin(
  credentials: AdminLoginCredentials,
): Promise<AdminSessionView> {
  return requestJson<AdminSessionView>(
    "/admin-auth/login",
    "POST",
    {
      documentType:
        credentials.documentType ??
        "DNI",
      documentNumber:
        credentials.documentNumber,
      password:
        credentials.password,
    },
  );
}

export function loadAdminSession():
  Promise<AdminSessionView> {
  return requestJson<AdminSessionView>(
    "/admin-auth/me",
    "GET",
  );
}

export async function logoutAdmin():
  Promise<void> {
  await requestJson<{
    loggedOut: boolean;
  }>(
    "/admin-auth/logout",
    "POST",
    {},
  );
}

export function loadBrandAdminConfiguration(
  brandId: string,
): Promise<AdminConfigurationEnvelope> {
  return requestJson<AdminConfigurationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(
      brandId,
    )}/admin-configuration`,
    "GET",
  );
}
