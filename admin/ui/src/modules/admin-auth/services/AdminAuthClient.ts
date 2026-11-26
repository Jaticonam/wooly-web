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

export interface AdminReferenceMediaAsset {
  readonly id: string;
  readonly mediaCode: string;
  readonly title: string;
  readonly originalFilename: string;
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
  readonly icon?: string | null;
  readonly slug: string;
  readonly description: string | null;
  readonly accentColor?: string | null;
  readonly priority: number;
  readonly status: string;
  readonly ogMediaAssetId: string | null;
  readonly ogMediaAsset: AdminReferenceMediaAsset | null;
}

export interface AdminCampaignDefinition {
  readonly id: string;
  readonly code: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string | null;
  readonly icon: string | null;
  readonly color: string | null;
  readonly accentColor?: string | null;
  readonly themeToken: string | null;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
  readonly priority: number;
  readonly publicationStatus: string;
  readonly ogMediaAssetId: string | null;
  readonly ogMediaAsset: AdminReferenceMediaAsset | null;
}

export interface AdminBadgeDefinition {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly icon: string | null;
  readonly accentColor?: string | null;
  readonly kind: string;
  readonly themeToken: string | null;
  readonly priority: number;
  readonly status: string;
}

export interface AdminConfigurationData {
  readonly brandId: string;

  readonly publicationPolicy: Record<string, unknown>;

  readonly publicationPolicySource: string;

  readonly defaultPriceList: unknown | null;

  readonly inventoryLocations: readonly unknown[];

  readonly categories: readonly AdminCategoryDefinition[];

  readonly campaigns: readonly AdminCampaignDefinition[];

  readonly badgeDefinitions: readonly AdminBadgeDefinition[];
}

export interface AdminConfigurationEnvelope {
  readonly success: boolean;
  readonly message: string;
  readonly data: AdminConfigurationData;
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
  readonly icon?: string | null;
  readonly slug: string;
  readonly description?: string;
  readonly accentColor?: string | null;
  readonly priority?: number;
  readonly status?: string;
  readonly ogMediaRef?: string | null;
}

export type UpdateAdminCategoryInput = Partial<CreateAdminCategoryInput>;

export interface CreateAdminCampaignInput {
  readonly code: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string | null;
  readonly icon?: string;
  readonly color?: string;
  readonly accentColor?: string | null;
  readonly themeToken?: string;
  readonly startsAt?: string | null;
  readonly endsAt?: string | null;
  readonly priority?: number;
  readonly publicationStatus?: string;
  readonly ogMediaRef?: string | null;
}

export type UpdateAdminCampaignInput = Partial<CreateAdminCampaignInput>;

export interface CreateAdminBadgeInput {
  readonly code: string;
  readonly label: string;
  readonly icon?: string | null;
  readonly accentColor?: string | null;
  readonly kind: string;
  readonly themeToken?: string | null;
  readonly priority?: number;
  readonly status?: string;
}

export type UpdateAdminBadgeInput = Partial<CreateAdminBadgeInput>;

export class AdminAuthHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string, readonly reasons: readonly string[] = []) {
    super(message);

    this.name = "AdminAuthHttpError";

    this.status = status;
  }
}

type AdminHttpMethod = "GET" | "POST" | "PUT";

function configuredBaseUrl(): string {
  const explicit = String(import.meta.env.VITE_JUNG_CORE_ADMIN_BASE_URL ?? "").trim();

  return explicit || "/jung-core";
}

function normalizeBaseUrl(baseUrl: string): string {
  const normalized = String(baseUrl ?? "")
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
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizeBaseUrl(baseUrl)}${normalizedPath}`;
}

async function requestJson<T>(
  path: string,

  method: AdminHttpMethod,

  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const serializedBody = body === undefined ? undefined : JSON.stringify(body);

  if (serializedBody !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(resolveAdminCoreUrl(path), {
    method,

    credentials: "include",

    cache: "no-store",

    headers,

    body: serializedBody,
  });

  if (!response.ok) {
    let message = `JUNG CORE respondió HTTP ${response.status}`;
    let reasons: string[] = [];
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "reasons" in body && Array.isArray(body.reasons)) {
        reasons = body.reasons.filter((reason): reason is string => typeof reason === "string");
      }
      if (body && typeof body === "object" && "message" in body) {
        if (typeof body.message === "string" && body.message.trim()) message = body.message;
        else if (
          Array.isArray(body.message) &&
          body.message.every((item) => typeof item === "string")
        )
          message = body.message.join(" · ") || message;
      }
    } catch {
      /* Keep the HTTP fallback for non-JSON errors. */
    }
    throw new AdminAuthHttpError(response.status, message, reasons);
  }

  return (await response.json()) as T;
}

export function loginAdmin(credentials: AdminLoginCredentials): Promise<AdminSessionView> {
  return requestJson<AdminSessionView>("/admin-auth/login", "POST", {
    documentType: credentials.documentType ?? "DNI",

    documentNumber: credentials.documentNumber,

    password: credentials.password,
  });
}

export function loadAdminSession(): Promise<AdminSessionView> {
  return requestJson<AdminSessionView>("/admin-auth/me", "GET");
}

export async function logoutAdmin(): Promise<void> {
  await requestJson<{
    loggedOut: boolean;
  }>("/admin-auth/logout", "POST", {});
}

export function loadBrandAdminConfiguration(brandId: string): Promise<AdminConfigurationEnvelope> {
  return requestJson<AdminConfigurationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(brandId)}/admin-configuration`,
    "GET",
  );
}

export function createAdminCategory(
  brandId: string,

  input: CreateAdminCategoryInput,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(brandId)}/categories`,
    "POST",
    input,
  );
}

export function updateAdminCategory(
  brandId: string,

  categoryId: string,

  input: UpdateAdminCategoryInput,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(brandId)}/categories/${encodeURIComponent(
      categoryId,
    )}`,
    "PUT",
    input,
  );
}

export function createAdminCampaign(
  brandId: string,

  input: CreateAdminCampaignInput,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(brandId)}/campaigns`,
    "POST",
    input,
  );
}

export function updateAdminCampaign(
  brandId: string,

  campaignId: string,

  input: UpdateAdminCampaignInput,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(
      campaignId,
    )}`,
    "PUT",
    input,
  );
}

export function createAdminBadge(
  brandId: string,

  input: CreateAdminBadgeInput,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(brandId)}/badges`,
    "POST",
    input,
  );
}

export function updateAdminBadge(
  brandId: string,

  badgeId: string,

  input: UpdateAdminBadgeInput,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(brandId)}/badges/${encodeURIComponent(
      badgeId,
    )}`,
    "PUT",
    input,
  );
}

export type AdminAttributeType = "TEXT" | "NUMBER" | "SELECT" | "MEASUREMENT" | "COLOR";
export type AdminAttributeStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type AdminAttributeValue =
  | { kind: "TEXT" | "SELECT"; text: string }
  | { kind: "NUMBER"; amount: string }
  | { kind: "MEASUREMENT"; amount: string; unitCode: string }
  | { kind: "COLOR"; label: string; hex: string | null };
export interface AdminAttributeConfig {
  allowedUnitCodes?: string[];
  defaultUnitCode?: string;
}
export interface AdminCategoryAttributeOption {
  id: string;
  code: string;
  label: string;
  value: AdminAttributeValue;
  position: number;
  status: AdminAttributeStatus;
}
export interface AdminCategoryAttributeFields {
  label: string;
  type: AdminAttributeType;
  role: "ATTRIBUTE" | "SIZE";
  required: boolean;
  multiple: boolean;
  position: number;
  status: AdminAttributeStatus;
  allowCustomValue: boolean;
  config: AdminAttributeConfig;
}
export interface AdminCategoryAttributeDefinition extends AdminCategoryAttributeFields {
  id: string;
  code: string;
  options: AdminCategoryAttributeOption[];
}
export type CreateAdminCategoryAttributeInput = Omit<
  AdminCategoryAttributeFields,
  "position" | "status"
>;
export type UpdateAdminCategoryAttributeInput = Partial<AdminCategoryAttributeFields>;
export interface CreateAdminCategoryAttributeOptionInput {
  label: string;
  amount?: string;
  unitCode?: string;
  hex?: string | null;
}
export type UpdateAdminCategoryAttributeOptionInput = Partial<
  Pick<AdminCategoryAttributeOption, "label" | "position" | "status">
>;
export interface AdminCategoryAttributesEnvelope {
  success: boolean;
  message: string;
  data: AdminCategoryAttributeDefinition[];
}
function categoryAttributesPath(brandId: string, categoryId: string) {
  return `/catalog-commercial/brands/${encodeURIComponent(brandId)}/categories/${encodeURIComponent(categoryId)}/attributes`;
}
export function loadAdminCategoryAttributes(brandId: string, categoryId: string) {
  return requestJson<AdminCategoryAttributesEnvelope>(
    categoryAttributesPath(brandId, categoryId),
    "GET",
  );
}
export function createAdminCategoryAttribute(
  brandId: string,
  categoryId: string,
  input: CreateAdminCategoryAttributeInput,
) {
  return requestJson<AdminMutationEnvelope>(
    categoryAttributesPath(brandId, categoryId),
    "POST",
    input,
  );
}
export function updateAdminCategoryAttribute(
  brandId: string,
  categoryId: string,
  attributeId: string,
  input: UpdateAdminCategoryAttributeInput,
) {
  return requestJson<AdminMutationEnvelope>(
    categoryAttributesPath(brandId, categoryId) + "/" + encodeURIComponent(attributeId),
    "PUT",
    input,
  );
}
export function createAdminCategoryAttributeOption(
  brandId: string,
  categoryId: string,
  attributeId: string,
  input: CreateAdminCategoryAttributeOptionInput,
) {
  return requestJson<AdminMutationEnvelope>(
    categoryAttributesPath(brandId, categoryId) +
      "/" +
      encodeURIComponent(attributeId) +
      "/options",
    "POST",
    input,
  );
}
export function updateAdminCategoryAttributeOption(
  brandId: string,
  categoryId: string,
  attributeId: string,
  optionId: string,
  input: UpdateAdminCategoryAttributeOptionInput,
) {
  return requestJson<AdminMutationEnvelope>(
    categoryAttributesPath(brandId, categoryId) +
      "/" +
      encodeURIComponent(attributeId) +
      "/options/" +
      encodeURIComponent(optionId),
    "PUT",
    input,
  );
}

export interface AdminPublicationConfirmations {
  readonly useDefaultImage?: boolean;
  readonly publishWithoutStock?: boolean;
}

export interface AdminPublicationReadiness {
  readonly productId: string;
  readonly ready: boolean;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
  readonly blockers: readonly string[];
  readonly requiredConfirmations: readonly (
    | "useDefaultImage"
    | "publishWithoutStock"
  )[];
}

export interface AdminPublicationReadinessEnvelope {
  readonly success: boolean;
  readonly data: AdminPublicationReadiness;
}

export function loadAdminProductPublicationReadiness(
  brandId: string,
  productId: string,
): Promise<AdminPublicationReadinessEnvelope> {
  return requestJson<AdminPublicationReadinessEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(brandId)}/products/${encodeURIComponent(productId)}/publication-readiness`,
    "GET",
  );
}

export function publishAdminProduct(
  brandId: string,
  productId: string,
  confirmations?: AdminPublicationConfirmations,
): Promise<AdminMutationEnvelope> {
  return requestJson<AdminMutationEnvelope>(
    `/catalog-commercial/brands/${encodeURIComponent(brandId)}/products/${encodeURIComponent(productId)}/publish`,
    "POST",
    confirmations === undefined ? undefined : { confirmations },
  );
}


export interface UpdateAdminProductInput {
  name?: string;
  description?: string | null;
  categoryId?: string;
}

function protectedProductEditPath(
  brandId: string,
  productId: string,
): string {
  if (
    !import.meta.env.DEV ||
    import.meta.env.VITE_WOOLY_ADMIN_PROTECTED_PRODUCTS !== "true" ||
    brandId !== "9c9db775-ad35-4f39-959c-d9c5ce9a123a" ||
    window.location.origin !== "http://localhost:8000"
  ) {
    throw new Error("Edicion no autorizada en este entorno.");
  }

  const path =
    `/catalog-commercial/brands/${encodeURIComponent(brandId)}` +
    `/products/${encodeURIComponent(productId)}`;

  const resolved = new URL(
    resolveAdminCoreUrl(path),
    window.location.origin,
  );

  if (
    resolved.origin !== window.location.origin ||
    resolved.pathname !== `/jung-core${path}` ||
    resolved.search ||
    resolved.hash
  ) {
    throw new Error("Proxy administrativo no autorizado.");
  }

  return path;
}

export function loadAdminProductDetail(
  brandId: string,
  productId: string,
): Promise<unknown> {
  return requestJson<unknown>(
    protectedProductEditPath(brandId, productId),
    "GET",
  );
}

export function updateAdminProduct(
  brandId: string,
  productId: string,
  input: UpdateAdminProductInput,
): Promise<unknown> {
  return requestJson<unknown>(
    protectedProductEditPath(brandId, productId),
    "PUT",
    input,
  );
}


export interface AdminProductPriceTier {
  minimumQuantity: number;
  unitPrice: number;
}

export function loadAdminProductPricing(
  brandId: string,
  productId: string,
): Promise<unknown> {
  return requestJson<unknown>(
    `${protectedProductEditPath(brandId, productId)}/pricing`,
    "GET",
  );
}

export function updateAdminProductTierPrices(
  brandId: string,
  productId: string,
  input: {
    tiers: AdminProductPriceTier[];
    expectedTiers: AdminProductPriceTier[];
  },
): Promise<unknown> {
  return requestJson<unknown>(
    `${protectedProductEditPath(brandId, productId)}/pricing/tiers-only`,
    "PUT",
    input,
  );
}

export type AdminInventoryOverride =
  | "AUTO"
  | "PREORDER"
  | "COMING_SOON"
  | "OUT_OF_STOCK"
  | null;

export function updateAdminProductInventoryPolicy(
  brandId: string,
  productId: string,
  input: {
    tracked: boolean;
    availabilityOverride: AdminInventoryOverride;
  },
): Promise<unknown> {
  return requestJson<unknown>(
    `${protectedProductEditPath(brandId, productId)}/inventory-policy`,
    "PUT",
    input,
  );
}
export function updateAdminProductMerchandising(
  brandId: string,
  productId: string,
  input: {
    priority: number;
    manualBadgeCodes: string[];
  },
): Promise<unknown> {
  return requestJson(
    protectedProductEditPath(brandId, productId) +
      "/merchandising",
    "PUT",
    input,
  );
}

export interface AdminInventoryBalanceExpected {
  onHand: number;
  reserved: number;
  updatedAt: string;
}

export function updateAdminProductInventoryBalance(
  brandId: string,
  productId: string,
  locationCode: string,
  input: {
    onHand: number;
    expected: AdminInventoryBalanceExpected | null;
  },
): Promise<unknown> {
  return requestJson<unknown>(
    `${protectedProductEditPath(brandId, productId)}/inventory-balances/${encodeURIComponent(locationCode)}`,
    "PUT",
    input,
  );
}