import {
  FileOutput,
  ImageOff,
} from "lucide-react";

import type {
  Product,
} from "@/shared/types/product";

import "./CatalogCompositionBoard.css";

interface CatalogCompositionBoardProps {
  products: readonly Product[];
  isReady: boolean;
  onPreview: () => void;
  onPrepareOutput: () => void;
}

const formatPrice = (
  value: unknown,
) => {
  const parsed =
    Number(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return "—";
  }

  return `S/ ${parsed.toFixed(2)}`;
};

const formatStock = (
  value: unknown,
) => {
  const parsed =
    Number(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return "—";
  }

  return String(
    parsed,
  );
};

export default function CatalogCompositionBoard({
  products,
  isReady,
  onPreview,
  onPrepareOutput,
}: CatalogCompositionBoardProps) {
  const canPrepare =
    isReady &&
    products.length > 0;

  return (
    <section
      className="catalog-composition-board"
      aria-label="Composición del catálogo"
    >
      <header className="catalog-composition-board__header">
        <div>
          <span>
            02 · COMPOSICIÓN
          </span>

          <h2>
            Productos incluidos
          </h2>

          <p>
            {isReady
              ? `${products.length} productos en la composición actual`
              : "Preparando composición comercial…"}
          </p>
        </div>

        <div className="catalog-composition-board__actions">
          <button
            type="button"
            disabled={
              !canPrepare
            }
            onClick={
              onPreview
            }
          >
            Vista previa
          </button>

          <button
            type="button"
            className="is-primary"
            disabled={
              !canPrepare
            }
            onClick={
              onPrepareOutput
            }
          >
            <FileOutput
              size={15}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            Preparar salida
          </button>
        </div>
      </header>

      {!isReady ? (
        <div className="catalog-composition-board__empty">
          Esperando catálogo y campañas.
        </div>
      ) : products.length === 0 ? (
        <div className="catalog-composition-board__empty">
          <strong>
            Sin productos incluidos
          </strong>

          <span>
            Define el alcance comercial para comenzar.
          </span>
        </div>
      ) : (
        <div className="catalog-composition-board__viewport">
          <div className="catalog-composition-board__list">
            {products.map(
              (
                product,
                index,
              ) => (
                <article
                  key={
                    product.id
                  }
                  className="catalog-composition-board__row"
                >
                  <span className="catalog-composition-board__position">
                    {index + 1}
                  </span>

                  <div className="catalog-composition-board__image">
                    {product.img ? (
                      <img
                        src={
                          product.img
                        }
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <ImageOff
                        size={17}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div className="catalog-composition-board__identity">
                    <small>
                      {product.id}
                    </small>

                    <strong>
                      {product.title}
                    </strong>

                    <span>
                      {product.category}
                    </span>
                  </div>

                  <div className="catalog-composition-board__value">
                    <span>
                      Precio
                    </span>

                    <strong>
                      {formatPrice(
                        product.price_1,
                      )}
                    </strong>
                  </div>

                  <div className="catalog-composition-board__value">
                    <span>
                      Stock
                    </span>

                    <strong>
                      {formatStock(
                        product.stock,
                      )}
                    </strong>
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      )}
    </section>
  );
}
