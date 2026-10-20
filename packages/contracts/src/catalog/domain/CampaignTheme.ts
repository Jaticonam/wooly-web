const DEFAULT_CAMPAIGN_COLOR = "morado";

export function normalizeCampaignColor(
  value: unknown,
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCampaignThemeToken(
  color: unknown,
): string {
  const normalizedColor =
    normalizeCampaignColor(color) ||
    DEFAULT_CAMPAIGN_COLOR;

  return `campaign.${normalizedColor}`;
}
