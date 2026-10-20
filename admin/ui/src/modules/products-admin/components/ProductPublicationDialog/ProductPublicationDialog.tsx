import { useEffect, useState } from "react";
import { publicationReasonLabel } from "../../domain/PublicationFeedback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  AdminPublicationConfirmations,
  AdminPublicationReadiness,
} from "@/modules/admin-auth/services/AdminAuthClient";

interface ProductPublicationDialogProps {
  open: boolean;
  productName: string;
  readiness: AdminPublicationReadiness;
  submitting: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (confirmations: AdminPublicationConfirmations) => void;
}



export default function ProductPublicationDialog({
  open,
  productName,
  readiness,
  submitting,
  error,
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
      <DialogContent className="max-h-[90vh] max-w-[520px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 bg-slate-50 px-6 py-5 text-left">
          <DialogTitle className="text-lg font-semibold text-slate-900">Revisar publicación</DialogTitle>
          <DialogDescription className="mt-1 break-words text-sm text-slate-600">{productName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">{readiness.blockers.length > 0 ? (
          <section aria-label="Problemas que impiden publicar" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <h3 className="mb-2 font-semibold">Debes corregir lo siguiente</h3>
            <ul className="list-disc pl-5">
              {readiness.blockers.map((reason) => (
                <li key={reason}>{publicationReasonLabel(reason)}</li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">La información obligatoria está validada por JUNG CORE.</p>
        )}

        {readiness.warnings.length > 0 ? (
          <section aria-label="Advertencias de publicación" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <h3 className="mb-2 font-semibold">Advertencias</h3>
            <ul className="list-disc pl-5">
              {readiness.warnings.map((reason) => (
                <li key={reason}>{publicationReasonLabel(reason)}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {needImage ? (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
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
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={publishWithoutStock}
              disabled={submitting}
              onChange={(event) => setPublishWithoutStock(event.target.checked)}
            />
            Publicar aunque no exista stock disponible o verificado
          </label>
        ) : null}

        {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

        </div><DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4 sm:justify-end">
          <button type="button" disabled={submitting} onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50">
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
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
