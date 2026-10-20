export const CAMPAIGN_COLOR_MAP:
  Readonly<Record<string, string>> = {
    morado:
      "catalog-campaign-purple",

    rosado:
      "catalog-campaign-pink",

    azul:
      "catalog-campaign-blue",

    verde:
      "catalog-campaign-green",

    rojo:
      "catalog-campaign-red",

    dorado:
      "catalog-campaign-gold",

    turquesa:
      "catalog-campaign-teal",

    negro:
      "catalog-campaign-dark",

    naranja:
      "catalog-campaign-orange",

    coral:
      "catalog-campaign-coral",

    lavanda:
      "catalog-campaign-lavender",

    plata:
      "catalog-campaign-silver",

    cobre:
      "catalog-campaign-copper",

    esmeralda:
      "catalog-campaign-emerald",

    vino:
      "catalog-campaign-wine",

    celeste:
      "catalog-campaign-sky",

    fucsia:
      "catalog-campaign-fuchsia",

    amarillo:
      "catalog-campaign-yellow",
  };

export function getCampaignColorClass(
  color:
    string |
    undefined |
    null,
): string {
  const key =
    (color ?? "")
      .trim()
      .toLowerCase();

  return (
    CAMPAIGN_COLOR_MAP[key] ??
    "catalog-campaign-purple"
  );
}