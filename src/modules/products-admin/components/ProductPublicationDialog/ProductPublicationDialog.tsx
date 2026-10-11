import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type {
  AdminPublicationConfirmations,
  AdminPublicationReadiness,
} from "@/modules/admin-auth/services/AdminAuthClient";

interface ProductPublicationDialogProps {
  open: boolean;
  productName: string;
  readiness: AdminPublicationReadiness;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (confirmations: AdminPublicationConfirmations) => void;
}

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

export default function ProductPublicationDialog({
  open,
  productName,
  readiness,
  submitting,
  onClose,
  onConfirm,
}: ProductPublicationDialogProps) {
  const [useDefaultImage, setUseDefaultImage] = useState(false);
  const [publishWithoutStock, setPublishWithoutStock] = useState(false);

  useEffect(() => {
    if (open) {
      setUseDefaultImage(false);
      setPublishWithoutStock(false);
    }
  }, [open, readiness]);

  const needImage = readiness.requiredConfirmations.includes("useDefaultImage");
  const needStock = readiness.requiredConfirmations.includes("publishWithoutStock");
  const canConfirm =
    !submitting &&
    readiness.blockers.length === 0 &&
    (!needImage || useDefaultImage) &&
    (!needStock || publishWithoutStock);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !submitting) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revisar publicación</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        {readiness.blockers.length > 0 ? (
          <section aria-label="Problemas que impiden publicar">
            <h3 className="mb-2 font-semibold">Debes corregir lo siguiente</h3>
            <ul className="list-disc pl-5">
              {readiness.blockers.map((reason) => (
                <li key={reason}>{LABELS[reason] ?? reason}</li>
              ))}
            </ul>
          </section>
        ) : (
          <p>La información obligatoria está validada por JUNG CORE.</p>
        )}

        {readiness.warnings.length > 0 ? (
          <section aria-label="Advertencias de publicación">
            <h3 className="mb-2 font-semibold">Advertencias</h3>
            <ul className="list-disc pl-5">
              {readiness.warnings.map((reason) => (
                <li key={reason}>{LABELS[reason] ?? reason}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {needImage ? (
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={useDefaultImage}
              disabled={submitting}
              onChange={(event) => setUseDefaultImage(event.target.checked)}
            />
            Publicar con imagen predeterminada
          </label>
        ) : null}

        {needStock ? (
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={publishWithoutStock}
              disabled={submitting}
              onChange={(event) => setPublishWithoutStock(event.target.checked)}
            />
            Publicar aunque no exista stock disponible o verificado
          </label>
        ) : null}

        <DialogFooter>
          <button type="button" disabled={submitting} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm({ useDefaultImage, publishWithoutStock })}
          >
            {submitting ? "Publicando…" : "Confirmar publicación"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
