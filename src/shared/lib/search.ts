import { Product } from "@/shared/types/product";

export const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-_./]/g, "");

export const searchProducts = (products: Product[], query: string) => {
  const rawTerm = query.trim();

  if (!rawTerm) return products;

  const term = normalize(rawTerm);

  return products
    .map((p) => {
      const code = normalize(p.code);
      const barcode = normalize(p.barcode);
      const id = normalize(p.id);
      const title = normalize(p.title);
      const description = normalize(p.description);
      const category = normalize(p.category);
      const badges = normalize(p.badges?.join(" "));

      let score = 0;

      // Commercial identity outranks combined descriptive matches.
      if (p.code?.trim() === rawTerm) score += 10000;
      else if (code && code === term) score += 9000;
      else if (code && code.startsWith(term)) score += 800;
      else if (code && term.length >= 3 && code.includes(term)) score += 600;
      if (p.barcode?.trim() === rawTerm) score += 8000;
      else if (barcode && barcode === term) score += 7000;
      if (id === term) score += 50;

      // 🧠 NOMBRE
      if (title.includes(term)) score += 300;

      // 📄 DESCRIPCIÓN
      if (description.includes(term)) score += 180;

      // 📦 CATEGORÍA
      if (category.includes(term)) score += 100;

      // 🏷 BADGES
      if (badges.includes(term)) score += 80;

      return { product: p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.product);
};
