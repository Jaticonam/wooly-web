import type { Dispatch, SetStateAction } from "react";

export const quantities = [1, 3, 12, 50, 100] as const;

interface IdentityFieldsProps {
  idPrefix: string;
  categories: readonly { id: string; name: string }[];
  categoryId: string;
  name: string;
  description: string;
  setCategoryId: (value: string) => void;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  autoFocus?: boolean;
}

export function ProductIdentityFields({
  idPrefix,
  categories,
  categoryId,
  name,
  description,
  setCategoryId,
  setName,
  setDescription,
  autoFocus = false,
}: IdentityFieldsProps) {
  return (
    <>
                  <div className="create-product-panel__field">
                    <label htmlFor={`${idPrefix}-category`}>Categoría</label>
                    <select
                      id={`${idPrefix}-category`}
                      required
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="create-product-panel__field create-product-panel__field--wide">
                    <label htmlFor={`${idPrefix}-name`}>Nombre</label>
                    <input
                      id={`${idPrefix}-name`}
                      required
                      value={name}
                      placeholder="Nombre comercial del producto"
                      onChange={(event) => setName(event.target.value)}
                      autoFocus={autoFocus}
                    />
                  </div>
                  <div className="create-product-panel__field create-product-panel__field--wide">
                    <label htmlFor={`${idPrefix}-description`}>Descripción</label>
                    <textarea
                      id={`${idPrefix}-description`}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Características, presentación y detalles relevantes"
                      rows={3}
                    />
                  </div>

    </>
  );
}

interface PriceFieldsProps {
  editableQuantities?: readonly number[];
  currency: string;
  prices: Record<number, string>;
  setPrices: Dispatch<SetStateAction<Record<number, string>>>;
}

export function ProductPriceFields({
  currency,
  prices,
  setPrices,
  editableQuantities,
}: PriceFieldsProps) {
  return (
                    <div className="create-product-panel__prices">
                      {quantities.map((quantity) => (
                        <label key={quantity}>
                          {quantity === 1 ? "1 unidad" : quantity + " unidades"}
                          <span className="create-product-panel__priceInput">
                            <span aria-hidden="true">{currency === "PEN" ? "S/" : currency}</span>
                            <input
                              type="number"
                              disabled={
                                editableQuantities !== undefined &&
                                !editableQuantities.includes(quantity)
                              }
                              aria-label={quantity === 1 ? "1 unidad" : quantity + " unidades"}
                              min="0.01"
                              max="9999999999.99"
                              step="0.01"
                              value={prices[quantity] ?? ""}
                              onChange={(event) =>
                                setPrices((current) => ({
                                  ...current,
                                  [quantity]: event.target.value,
                                }))
                              }
                            />
                          </span>
                        </label>
                      ))}
                    </div>

  );
}