import { AdminAuthHttpError } from "@/modules/admin-auth/services/AdminAuthClient";

const LABELS: Record<string, string> = {
  CATEGORY_MISSING: "Falta una categoría.",
  CATEGORY_NOT_PUBLIC: "La categoría no está habilitada.",
  PRICING_MISSING: "Falta el precio unitario.",
  PRICING_INVALID: "El precio unitario debe ser mayor que cero.",
  PRICING_SOURCE_UNAVAILABLE: "No se pudo verificar el precio.",
  INVENTORY_MISSING: "No hay inventario registrado.",
  INVENTORY_UNTRACKED: "El inventario no tiene seguimiento.",
  INVENTORY_OUT_OF_STOCK: "No hay existencias disponibles.",
  INVENTORY_SOURCE_UNAVAILABLE: "No se pudo consultar el inventario.",
  PUBLIC_MEDIA_MISSING: "No existe una imagen pública válida.",
  MERCHANDISING_MISSING: "Falta información comercial requerida.",
  MERCHANDISING_SOURCE_UNAVAILABLE: "No se pudo verificar la información comercial.",
  PREORDER_DESCRIPTION_MISSING: "Falta la descripción requerida.",
};

export const publicationReasonLabel = (reason: string): string => LABELS[reason] ?? reason;

export function publicationErrorMessage(error: unknown): string {
  if (error instanceof AdminAuthHttpError) {
    if (error.status === 401) return "La sesión ha caducado. Vuelve a iniciar sesión para publicar.";
    if (error.status === 403) return "No tienes permiso para publicar productos de esta marca.";
    if (error.reasons.length) return error.reasons.map(publicationReasonLabel).join(" ");
  }
  return error instanceof Error ? error.message : "No se pudo publicar el producto.";
}
