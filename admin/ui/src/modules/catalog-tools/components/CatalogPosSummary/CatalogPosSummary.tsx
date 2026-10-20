import "./CatalogPosSummary.css";

type CatalogPosMode =
  | "automatic"
  | "hybrid"
  | "manual";

interface CatalogPosProduct {
  id: string;
  title: string;
  category?: string | null;
  img?: string | null;
}

interface CatalogPosSummaryProps {
  mode: CatalogPosMode;
  modeLabel: string;
  products: readonly CatalogPosProduct[];
  isReady: boolean;
  automaticProductIds: readonly string[];
  includedProductIds: readonly string[];
  excludedProductIds: readonly string[];
  resolvedProductIds: readonly string[];
  selectedCategoryLabels: readonly string[];
  selectedCampaignLabels: readonly string[];
  onPublish: () => void;
  onRemoveManual: (productId: string) => void;
  onRemoveIncluded: (productId: string) => void;
  onRestoreExcluded: (productId: string) => void;
}

const normalizeId = (
  value: string,
) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const resolveCategoryLabel = (
  value?: string | null,
) => {
  const normalized =
    String(value ?? "").trim();

  return normalized ||
    "Sin categoría";
};

export default function CatalogPosSummary({
  mode,
  modeLabel,
  products,
  isReady,
  automaticProductIds,
  includedProductIds,
  excludedProductIds,
  resolvedProductIds,
  selectedCategoryLabels,
  selectedCampaignLabels,
  onPublish,
  onRemoveManual,
  onRemoveIncluded,
  onRestoreExcluded,
}: CatalogPosSummaryProps) {
  const productById =
    new Map(
      products.map(
        (product) => [
          normalizeId(product.id),
          product,
        ],
      ),
    );

  const automaticIds =
    new Set(
      automaticProductIds.map(
        normalizeId,
      ),
    );

  const resolvedIds =
    new Set(
      resolvedProductIds.map(
        normalizeId,
      ),
    );

  const manuallyIncludedIds =
    includedProductIds.filter(
      (productId) =>
        !automaticIds.has(
          normalizeId(productId),
        ),
    );

  const manuallyExcludedIds =
    excludedProductIds.filter(
      (productId) =>
        automaticIds.has(
          normalizeId(productId),
        ),
    );

  const resolveProducts = (
    productIds: readonly string[],
  ) =>
    productIds
      .map(
        (productId) =>
          productById.get(
            normalizeId(productId),
          ),
      )
      .filter(
        (
          product,
        ): product is CatalogPosProduct =>
          Boolean(product),
      );

  const addedProducts =
    resolveProducts(
      [
        ...manuallyIncludedIds,
      ].reverse(),
    );

  const removedProducts =
    resolveProducts(
      [
        ...manuallyExcludedIds,
      ].reverse(),
    );

  const manualProducts =
    resolveProducts(
      [
        ...includedProductIds,
      ].reverse(),
    );

  const categoryCountMap =
    new Map<string, number>();

  products.forEach(
    (product) => {
      if (
        !resolvedIds.has(
          normalizeId(product.id),
        )
      ) {
        return;
      }

      const category =
        resolveCategoryLabel(
          product.category,
        );

      categoryCountMap.set(
        category,
        (
          categoryCountMap.get(
            category,
          ) ?? 0
        ) + 1,
      );
    },
  );

  const categoryBreakdown =
    Array.from(
      categoryCountMap.entries(),
    ).sort(
      (left, right) =>
        right[1] - left[1],
    );

  const renderProductRow = (
    product: CatalogPosProduct,
    state:
      | "added"
      | "removed"
      | "selected",
    actionLabel: string,
    onAction: (
      productId: string,
    ) => void,
  ) => (
    <article
      key={`${state}-${product.id}`}
      className={`catalog-pos-summary__product is-${state}`}
    >
      <div className="catalog-pos-summary__productImage">
        {product.img ? (
          <img
            src={product.img}
            alt={product.title}
            loading="lazy"
          />
        ) : (
          <span>
            Sin imagen
          </span>
        )}
      </div>

      <div className="catalog-pos-summary__productInfo">
        <span>
          {product.id}
        </span>

        <strong>
          {product.title}
        </strong>

        <small>
          {resolveCategoryLabel(
            product.category,
          )}
        </small>
      </div>

      <button
        type="button"
        className={`catalog-pos-summary__productAction is-${state}`}
        aria-label={`${actionLabel}: ${product.title}`}
        title={actionLabel}
        onClick={() =>
          onAction(
            product.id,
          )
        }
      >
        {state ===
        "removed"
          ? "↶"
          : "×"}
      </button>
    </article>
  );

  return (
    <aside
      className="catalog-pos-summary"
      aria-label="Resumen del catálogo en tiempo real"
    >
      <header className="catalog-pos-summary__header">
        <div>
          <span>
            Tu catálogo
          </span>

          <h3>
            {modeLabel}
          </h3>

          <p>
            Resumen en tiempo real
          </p>
        </div>

        <div className="catalog-pos-summary__totalBadge">
          <strong>
            {isReady
              ? resolvedProductIds.length
              : "—"}
          </strong>

          <small>
            productos
          </small>
        </div>
      </header>

      {mode ===
      "hybrid" ? (
        <div className="catalog-pos-summary__metrics">
          <div>
            <strong>
              {automaticIds.size}
            </strong>

            <span>
              base
            </span>
          </div>

          <div className="is-added">
            <strong>
              +{manuallyIncludedIds.length}
            </strong>

            <span>
              agregados
            </span>
          </div>

          <div className="is-removed">
            <strong>
              -{manuallyExcludedIds.length}
            </strong>

            <span>
              retirados
            </span>
          </div>
        </div>
      ) : null}

      <div className="catalog-pos-summary__rules">
        <div>
          <span>
            Categorías
          </span>

          <strong>
            {mode ===
            "manual"
              ? `${categoryBreakdown.length} en la selección`
              : selectedCategoryLabels.length >
                  0
                ? selectedCategoryLabels.join(
                    ", ",
                  )
                : "Todas"}
          </strong>
        </div>

        <div>
          <span>
            Campañas
          </span>

          <strong>
            {mode ===
            "manual"
              ? "No aplica"
              : selectedCampaignLabels.length >
                  0
                ? selectedCampaignLabels.join(
                    ", ",
                  )
                : "Sin campaña específica"}
          </strong>
        </div>
      </div>

      <div className="catalog-pos-summary__body">
        {mode ===
        "automatic" ? (
          <section className="catalog-pos-summary__section">
            <div className="catalog-pos-summary__sectionHead">
              <strong>
                Composición
              </strong>

              <span>
                {categoryBreakdown.length} categorías
              </span>
            </div>

            <div className="catalog-pos-summary__categoryList">
              {categoryBreakdown.map(
                (
                  [
                    category,
                    count,
                  ],
                ) => (
                  <div
                    key={category}
                  >
                    <span>
                      {category}
                    </span>

                    <strong>
                      {count}
                    </strong>
                  </div>
                ),
              )}
            </div>
          </section>
        ) : null}

        {mode ===
        "hybrid" ? (
          <>
            <section className="catalog-pos-summary__section">
              <div className="catalog-pos-summary__sectionHead">
                <strong>
                  Agregados
                </strong>

                <span>
                  {addedProducts.length}
                </span>
              </div>

              {addedProducts.length >
              0 ? (
                <div className="catalog-pos-summary__productList">
                  {addedProducts.map(
                    (product) =>
                      renderProductRow(
                        product,
                        "added",
                        "Quitar agregado",
                        onRemoveIncluded,
                      ),
                  )}
                </div>
              ) : (
                <p className="catalog-pos-summary__empty">
                  Sin productos agregados manualmente.
                </p>
              )}
            </section>

            <section className="catalog-pos-summary__section">
              <div className="catalog-pos-summary__sectionHead">
                <strong>
                  Retirados
                </strong>

                <span>
                  {removedProducts.length}
                </span>
              </div>

              {removedProducts.length >
              0 ? (
                <div className="catalog-pos-summary__productList">
                  {removedProducts.map(
                    (product) =>
                      renderProductRow(
                        product,
                        "removed",
                        "Restaurar producto",
                        onRestoreExcluded,
                      ),
                  )}
                </div>
              ) : (
                <p className="catalog-pos-summary__empty">
                  Sin productos retirados de la base.
                </p>
              )}
            </section>
          </>
        ) : null}

        {mode ===
        "manual" ? (
          <section className="catalog-pos-summary__section">
            <div className="catalog-pos-summary__sectionHead">
              <strong>
                Seleccionados
              </strong>

              <span>
                {manualProducts.length}
              </span>
            </div>

            {manualProducts.length >
            0 ? (
              <div className="catalog-pos-summary__productList">
                {manualProducts.map(
                  (product) =>
                    renderProductRow(
                      product,
                      "selected",
                      "Quitar del catálogo",
                      onRemoveManual,
                    ),
                )}
              </div>
            ) : (
              <p className="catalog-pos-summary__empty">
                Agrega productos para construir el catálogo.
              </p>
            )}
          </section>
        ) : null}
      </div>

      <footer className="catalog-pos-summary__footer">
        <div className="catalog-pos-summary__final">
          <span>
            Total del catálogo
          </span>

          <strong>
            {isReady
              ? resolvedProductIds.length
              : "—"}
          </strong>
        </div>

        <button
          type="button"
          className="catalog-pos-summary__publish"
          disabled={
            !isReady ||
            resolvedProductIds.length ===
              0
          }
          onClick={
            onPublish
          }
        >
          Publicar catálogo ·{" "}
          {isReady
            ? resolvedProductIds.length
            : "—"}
        </button>
      </footer>
    </aside>
  );
}
