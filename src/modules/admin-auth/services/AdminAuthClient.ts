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

  readonly accesses:
    readonly AdminBrandAccess[];

  readonly session: {
    readonly expiresAt: string;
  };
}

export interface AdminReferenceMediaAsset {
  readonly id: string;
  readonly mediaCode: string;
  readonly title: string;
  readonly publicUrl: string | null;
  readonly thumbnailUrl: string | null;
  readonly mimeType: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly status: string;
}

export interface AdminCategoryDefinition {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly priority: number;
  readonly status: string;
  readonly ogMediaAssetId: string | null;
  readonly ogMediaAsset:
    AdminReferenceMediaAsset | null;
}

export interface AdminCampaignDefinition {
  readonly id: string;
  readonly code: string;
  readonly slug: string;
  readonly name: string;
  readonly icon: string | null;
  readonly color: string | null;
  readonly themeToken: string | null;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
  readonly priority: number;
  readonly publicationStatus: string;
  readonly ogMediaAssetId: string | null;
  readonly ogMediaAsset:
    AdminReferenceMediaAsset | null;
}

export interface AdminBadgeDefinition {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly icon: string | null;
  readonly kind: string;
  readonly themeToken: string | null;
  readonly priority: number;
  readonly status: string;
}

export interface AdminConfigurationData {
  readonly brandId: string;

  readonly publicationPolicy:
    Record<string, unknown>;

  readonly publicationPolicySource:
    string;

  readonly defaultPriceList:
    unknown | null;

  readonly inventoryLocations:
    readonly unknown[];

  readonly categories:
    readonly AdminCategoryDefinition[];

  readonly campaigns:
    readonly AdminCampaignDefinition[];

  readonly badgeDefinitions:
    readonly AdminBadgeDefinition[];
}

export interface AdminConfigurationEnvelope {
  readonly success: boolean;
  readonly message: string;
  readonly data:
    AdminConfigurationData;
}

export interface AdminMutationEnvelope {
  readonly success: boolean;
  readonly message: string;
  readonly data: unknown;
}

export interface AdminLoginCredentials {
  readonly documentType?: "DNI";
  readonly documentNumber: string;
  readonly password: string;
}

export interface CreateAdminCategoryInput {
  readonly code: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly priority?: number;
  readonly status?: string;
  readonly ogMediaAssetId?: string | null;
}

export type UpdateAdminCategoryInput =
  Partial<CreateAdminCategoryInput>;

export interface CreateAdminCampaignInput {
  readonly code: string;
  readonly slug: string;
  readonly name: string;
  readonly icon?: string;
  readonly color?: string;
  readonly themeToken?: string;
  readonly startsAt?: string | null;
  readonly endsAt?: string | null;
  readonly priority?: number;
  readonly publicationStatus?: string;
  readonly ogMediaAssetId?: string | null;
}

export type UpdateAdminCampaignInput =
  Partial<CreateAdminCampaignInput>;

export interface CreateAdminBadgeInput {
  readonly code: string;
  readonly label: string;
  readonly icon?: string | null;
  readonly kind: string;
  readonly themeToken?: string | null;
  readonly priority?: number;
  readonly status?: string;
}

export type UpdateAdminBadgeInput =
  Partial<CreateAdminBadgeInput>;

export class AdminAuthHttpError
  extends Error {
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

type AdminHttpMethod =
  | "GET"
  | "POST"
  | "PUT";

function configuredBaseUrl(): string {
  const explicit =
    String(
      import.meta.env
        .VITE_JUNG_CORE_ADMIN_BASE_URL ??
        "",
    ).trim();

  return explicit ||
    "/jung-core";
}

function normalizeBaseUrl(
  baseUrl: string,
): string {
  const normalized =
    String(
      baseUrl ?? "",
    )
      .trim()
      .replace(
        /\/+$/,
        "",
      );

  if (!normalized) {
    return "/jung-core";
  }

  return normalized;
}

export function resolveAdminCoreUrl(
  path: string,

  baseUrl =
    configuredBaseUrl(),
): string {
  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${normalizeBaseUrl(
    baseUrl,
  )}${normalizedPath}`;
}

async function requestJson<T>(
  path: string,

  method:
    AdminHttpMethod,

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
      : JSON.stringify(
          body,
        );

  if (
    serializedBody !==
      undefined
  ) {
    headers[
      "Content-Type"
    ] =
      "application/json";
  }

  const response =
    await fetch(
      resolveAdminCoreUrl(
        path,
      ),
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

  return (await response.json()) as T;
}

export function loginAdmin(
  credentials:
    AdminLoginCredentials,
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

export function createAdminCategory(
  brandId: string,

  input:
    CreateAdminCategoryInput,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(
      brandId,
    )}/categories`,
    "POST",
    input,
  );
}

export function updateAdminCategory(
  brandId: string,

  categoryId: string,

  input:
    UpdateAdminCategoryInput,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(
      brandId,
    )}/categories/${encodeURIComponent(
      categoryId,
    )}`,
    "PUT",
    input,
  );
}

export function createAdminCampaign(
  brandId: string,

  input:
    CreateAdminCampaignInput,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(
      brandId,
    )}/campaigns`,
    "POST",
    input,
  );
}

export function updateAdminCampaign(
  brandId: string,

  campaignId: string,

  input:
    UpdateAdminCampaignInput,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(
      brandId,
    )}/campaigns/${encodeURIComponent(
      campaignId,
    )}`,
    "PUT",
    input,
  );
}

export function createAdminBadge(
  brandId: string,

  input:
    CreateAdminBadgeInput,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(
      brandId,
    )}/badges`,
    "POST",
    input,
  );
}

export function updateAdminBadge(
  brandId: string,

  badgeId: string,

  input:
    UpdateAdminBadgeInput,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(
      brandId,
    )}/badges/${encodeURIComponent(
      badgeId,
    )}`,
    "PUT",
    input,
  );
}
