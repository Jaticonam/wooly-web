import { Product } from "@wooly/contracts/types/product";

export const sortByCommercialPriority = (items: Product[]) => {
  return [...items].sort((a, b) => {
    // 1. Mayor priority primero
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;

    // 2. Productos disponibles primero
    const aAvailable =
      a.stock !== null && a.stock !== undefined && a.stock > 0 ? 1 : 0;

    const bAvailable =
      b.stock !== null && b.stock !== undefined && b.stock > 0 ? 1 : 0;

    const availableDiff = bAvailable - aAvailable;
    if (availableDiff !== 0) return availableDiff;

    // 3. Si ambos están disponibles, stock bajo primero para urgencia
    if (aAvailable && bAvailable) {
      const stockDiff = (a.stock || 0) - (b.stock || 0);
      if (stockDiff !== 0) return stockDiff;
    }

    // 4. Desempate por nombre
    return a.title.localeCompare(b.title);
  });
};
