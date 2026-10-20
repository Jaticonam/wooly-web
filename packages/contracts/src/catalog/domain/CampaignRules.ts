import type { Campaign } from "../../types/product";

/* =========================================================
   TIPOS
   ========================================================= */

export type CampaignNameToIdMap =
  Record<string, string>;

/* =========================================================
   NORMALIZACIÓN
   ========================================================= */

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

export function normalizeCampaignLookupKey(
  value: unknown,
): string {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type CampaignDateKind =
  | "calendar"
  | "timestamp";

type ParsedCampaignDate = {
  date: Date;
  kind: CampaignDateKind;
};

function buildLocalCalendarDate(
  year: number,
  month: number,
  day: number,
): Date | null {
  const date = new Date(
    year,
    month - 1,
    day,
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function parseCampaignDate(
  value: unknown,
): ParsedCampaignDate | null {
  const clean = cleanText(value);

  if (!clean) {
    return null;
  }

  const isoCalendarDate = clean.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (isoCalendarDate) {
    const [, year, month, day] =
      isoCalendarDate;

    const date = buildLocalCalendarDate(
      Number(year),
      Number(month),
      Number(day),
    );

    return date
      ? {
          date,
          kind: "calendar",
        }
      : null;
  }

  const humanDate = clean.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/,
  );

  if (humanDate) {
    const [, day, month, year] = humanDate;

    const date = buildLocalCalendarDate(
      Number(year),
      Number(month),
      Number(day),
    );

    return date
      ? {
          date,
          kind: "calendar",
        }
      : null;
  }

  const timestamp = new Date(clean);

  return Number.isNaN(timestamp.getTime())
    ? null
    : {
        date: timestamp,
        kind: "timestamp",
      };
}

function normalizePublicationStatus(
  value: unknown,
): Campaign["computedStatus"] {
  const status =
    normalizeCampaignLookupKey(value);

  const statusMap: Record<
    string,
    Campaign["computedStatus"]
  > = {
    publicado: "activa",
    publicada: "activa",
    publicadas: "activa",
    active: "activa",
    published: "activa",

    oculto: "oculta",
    oculta: "oculta",
    hidden: "oculta",

    borrador: "borrador",
    draft: "borrador",
  };

  return statusMap[status] ?? "borrador";
}

/* =========================================================
   ESTADO OPERATIVO
   ========================================================= */

export function getCampaignComputedStatus(
  campaign: Pick<
    Campaign,
    "startDate" | "endDate" | "publicationStatus"
  >,
  now: unknown = new Date(),
): Campaign["computedStatus"] {
  const referenceNow =
    now instanceof Date &&
    Number.isFinite(now.getTime())
      ? now
      : new Date();
  const publicationStatus =
    normalizePublicationStatus(
      campaign.publicationStatus,
    );

  if (publicationStatus === "oculta") {
    return "oculta";
  }

  if (publicationStatus === "borrador") {
    return "borrador";
  }

  const parsedStart = parseCampaignDate(
    campaign.startDate,
  );

  const parsedEnd = parseCampaignDate(
    campaign.endDate,
  );

  if (
    !parsedStart ||
    !parsedEnd ||
    !Number.isFinite(referenceNow.getTime())
  ) {
    return "borrador";
  }

  const start =
    new Date(parsedStart.date);

  const end =
    new Date(parsedEnd.date);

  if (
    parsedStart.kind === "calendar"
  ) {
    start.setHours(0, 0, 0, 0);
  }

  if (
    parsedEnd.kind === "calendar"
  ) {
    end.setHours(23, 59, 59, 999);
  }

  if (start > end) {
    return "borrador";
  }

  if (referenceNow < start) {
    return "programada";
  }

  if (referenceNow > end) {
    return "finalizada";
  }

  return "activa";
}

/* =========================================================
   REGLAS DE CAMPAÑA
   ========================================================= */

export function isCampaignActive(
  campaign: Campaign,
): boolean;

export function isCampaignActive(
  campaign: Campaign,
  now: Date,
): boolean;

export function isCampaignActive(
  campaign: Campaign,
  now: unknown = new Date(),
): boolean {
  /**
   * No se confía únicamente en computedStatus porque una
   * campaña almacenada en caché puede cruzar de fecha.
   */
  return getCampaignComputedStatus(
    campaign,
    now,
  ) === "activa";
}

export function filterActiveCampaigns(
  campaigns: readonly Campaign[],
  now: Date = new Date(),
): Campaign[] {
  return campaigns.filter(
    (campaign) =>
      isCampaignActive(
        campaign,
        now,
      ),
  );
}

export function buildCampaignNameToIdMap(
  campaigns: readonly Campaign[],
): CampaignNameToIdMap {
  return campaigns.reduce<CampaignNameToIdMap>(
    (map, campaign) => {
      const normalizedName =
        normalizeCampaignLookupKey(
          campaign.name,
        );

      const normalizedId =
        normalizeCampaignLookupKey(
          campaign.id,
        );

      map[campaign.name] = campaign.id;
      map[campaign.id] = campaign.id;

      if (normalizedName) {
        map[normalizedName] = campaign.id;
      }

      if (normalizedId) {
        map[normalizedId] = campaign.id;
      }

      return map;
    },
    {},
  );
}
