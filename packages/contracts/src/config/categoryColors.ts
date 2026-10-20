export function getCategoryColor(category: string) {

  const cat = category.toLowerCase();

  if (cat.includes("flor")) {
    return "bg-pink-100 text-pink-600";
  }

  if (cat.includes("cinta")) {
    return "bg-purple-100 text-purple-600";
  }

  if (cat.includes("caja")) {
    return "bg-amber-100 text-amber-700";
  }

  if (cat.includes("papel")) {
    return "bg-blue-100 text-blue-600";
  }

  if (cat.includes("globo")) {
    return "bg-red-100 text-red-600";
  }

  if (cat.includes("peluche")) {
    return "bg-orange-100 text-orange-600";
  }

  return "bg-slate-100 text-slate-600";

}
