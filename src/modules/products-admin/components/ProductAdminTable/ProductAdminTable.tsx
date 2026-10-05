import {
  Check,
  Eye,
  ImageOff,
} from "lucide-react";
import type {
  ProductAdminColumnVisibility,
  ProductAdminDensity,
} from "@/modules/products-admin/domain/ProductAdminDisplay";

import {
  resolveProductAdminPresentation,
} from "@/modules/products-admin/presentation/ProductAdminPresentation";

import type {
  Product,
} from "@/shared/types/product";

import "./ProductAdminTable.css";

interface ProductAdminTableProps {
  products: readonly Product[];
  selectedProductIds: ReadonlySet<string>;
  columns: ProductAdminColumnVisibility;
  density: ProductAdminDensity;
  onSelectProduct: (product: Product) => void;
  onToggleProductSelection: (product: Product) => void;
}

export default function ProductAdminTable({
  products,
  selectedProductIds,
  columns,
  density,
  onSelectProduct,
  onToggleProductSelection,
}: ProductAdminTableProps) {
  return (
    <div
      className={
        `product-admin-table is-${density}`
      }
    >
      <table>
        <thead>
          <tr>
            <th
              className="product-admin-table__selectionColumn"
              aria-label="Selección"
            />

            <th>Código</th>

            <th>Producto</th>

            {columns.image ? (
              <th>Imagen</th>
            ) : null}

            {columns.status ? (
              <th>Estado</th>
            ) : null}

            {columns.price ? (
              <th>Precio</th>
            ) : null}

            {columns.stock ? (
              <th>Stock</th>
            ) : null}

            {columns.category ? (
              <th>Categoría</th>
            ) : null}

            {columns.priority ? (
              <th>Prioridad</th>
            ) : null}

            <th className="product-admin-table__actionColumn">
              Ficha
            </th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => {
            const presentation =
              resolveProductAdminPresentation(
                product,
              );

            const isSelected =
              selectedProductIds.has(
                product.id,
              );

            return (
              <tr
                key={product.id}
                className={
                  isSelected
                    ? "is-selected"
                    : ""
                }
              >
                <td className="product-admin-table__selectionColumn">
                  <button
                    type="button"
                    className="product-admin-table__selection"
                    aria-pressed={isSelected}
                    aria-label={
                      isSelected
                        ? `Quitar ${product.title} de la selección`
                        : `Seleccionar ${product.title}`
                    }
                    onClick={() =>
                      onToggleProductSelection(
                        product,
                      )
                    }
                  >
                    {isSelected ? (
                      <Check
                        size={13}
                        strokeWidth={2.4}
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                </td>

                <td>
                  <code>
                    {product.id}
                  </code>
                </td>

                <td>
                  <strong className="product-admin-table__title">
                    {product.title}
                  </strong>
                </td>

                {columns.image ? (
                  <td>
                    <div className="product-admin-table__image">
                      {product.img ? (
                        <img
                          src={product.img}
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <ImageOff
                          size={15}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </td>
                ) : null}

                {columns.status ? (
                  <td>
                    <span className="product-admin-table__status">
                      {presentation.statusLabel}
                    </span>
                  </td>
                ) : null}

                {columns.price ? (
                  <td className="product-admin-table__price">
                    {presentation.unitPriceLabel}
                  </td>
                ) : null}

                {columns.stock ? (
                  <td>
                    <span
                      className={
                        `product-admin-table__stock is-${presentation.stockTone}`
                      }
                    >
                      {presentation.stockLabel}
                    </span>
                  </td>
                ) : null}

                {columns.category ? (
                  <td className="product-admin-table__category">
                    {product.category}
                  </td>
                ) : null}

                {columns.priority ? (
                  <td className="product-admin-table__priority">
                    {
                      typeof product.priority === "number"
                        ? product.priority
                        : "—"
                    }
                  </td>
                ) : null}

                <td className="product-admin-table__actionColumn">
                  <button
                    type="button"
                    className="product-admin-table__detail"
                    aria-label={`Ver detalle de ${product.title}`}
                    onClick={() =>
                      onSelectProduct(
                        product,
                      )
                    }
                  >
                    <Eye
                      size={15}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}