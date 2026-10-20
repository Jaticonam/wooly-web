export function toggleProductAdminSelection(
  current: ReadonlySet<string>,
  productId: string,
): ReadonlySet<string> {
  const next = new Set(current);

  if (next.has(productId)) {
    next.delete(productId);
  } else {
    next.add(productId);
  }

  return next;
}

export function areAllVisibleProductsSelected(
  current: ReadonlySet<string>,
  visibleProductIds: readonly string[],
): boolean {
  return (
    visibleProductIds.length > 0 &&
    visibleProductIds.every((productId) =>
      current.has(productId),
    )
  );
}

export function toggleVisibleProductAdminSelection(
  current: ReadonlySet<string>,
  visibleProductIds: readonly string[],
): ReadonlySet<string> {
  const next = new Set(current);

  const allVisibleSelected =
    areAllVisibleProductsSelected(
      current,
      visibleProductIds,
    );

  visibleProductIds.forEach((productId) => {
    if (allVisibleSelected) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
  });

  return next;
}