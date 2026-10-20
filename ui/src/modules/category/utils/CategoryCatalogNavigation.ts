export function buildCategoryCatalogRoute(
  categoryId:
    string,
): string {
  if (
    !categoryId ||
    categoryId ===
      "todas"
  ) {
    return "/catalogo";
  }

  return `/catalogo/categoria.html?cat=${encodeURIComponent(
    categoryId,
  )}`;
}

export function buildCategoryCampaignRoute(
  categoryId:
    string,
  campaignId:
    string,
): string {
  const params =
    new URLSearchParams();

  if (
    categoryId &&
    categoryId !==
      "todas"
  ) {
    params.set(
      "cat",
      categoryId,
    );
  }

  if (
    campaignId
  ) {
    params.set(
      "cpg",
      campaignId,
    );
  }

  const query =
    params.toString();

  return query
    ? `/catalogo?${query}`
    : "/catalogo";
}
