import { CATEGORY_ALIASES } from "@/constants/searchConfig";

export function detectCategory(value: string) {
  const term = value.trim().toLowerCase();

  if (!term) return null;

  for (const [category, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.some((alias) => term.includes(alias))) {
      return category;
    }
  }

  return null;
}
