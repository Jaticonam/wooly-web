import {
  describe,
  expect,
  it,
} from "vitest";

import {
  areAllVisibleProductsSelected,
  toggleProductAdminSelection,
  toggleVisibleProductAdminSelection,
} from "./ProductAdminSelection";

describe("ProductAdminSelection", () => {
  it("alterna una selección individual sin mutar el Set original", () => {
    const original = new Set(["A"]);

    const selected = toggleProductAdminSelection(
      original,
      "B",
    );

    expect([...original]).toEqual(["A"]);
    expect([...selected]).toEqual(["A", "B"]);

    const removed = toggleProductAdminSelection(
      selected,
      "A",
    );

    expect([...removed]).toEqual(["B"]);
  });

  it("selecciona todos los productos visibles conservando selecciones previas", () => {
    const current = new Set(["FUERA"]);

    const result =
      toggleVisibleProductAdminSelection(
        current,
        ["A", "B"],
      );

    expect([...result].sort()).toEqual(
      ["A", "B", "FUERA"].sort(),
    );
  });

  it("deselecciona solamente los visibles cuando todos ya están seleccionados", () => {
    const current = new Set([
      "A",
      "B",
      "FUERA",
    ]);

    expect(
      areAllVisibleProductsSelected(
        current,
        ["A", "B"],
      ),
    ).toBe(true);

    const result =
      toggleVisibleProductAdminSelection(
        current,
        ["A", "B"],
      );

    expect([...result]).toEqual(["FUERA"]);
  });
});