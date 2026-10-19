import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  loadAdminProductPublicationReadiness,
  publishAdminProduct,
  type AdminPublicationReadiness,
} from "@/modules/admin-auth/services/AdminAuthClient";
import {
  publicationReasonLabel,
  publicationErrorMessage,
} from "../../domain/PublicationFeedback";
import type { Product } from "@/shared/types/product";

type Review = {
  product: Product;
  readiness?: AdminPublicationReadiness;
  error?: string;
  image: boolean;
  stock: boolean;
  result?: "published" | "error";
  resultMessage?: string;
};

interface Props {
  open: boolean;
  brandId?: string;
  products: readonly Product[];
  onClose: () => void;
  onPublished: (ids: string[]) => Promise<void>;
}

export default function BulkProductPublicationDialog({
  open,
  brandId,
  products,
  onClose,
  onPublished,
}: Props) {
  const [rows, setRows] = useState<Review[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const publishingRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setRows([]);
    setExpandedId(null);
    setLoading(true);
    setFinished(false);
    setGeneralError("");

    const load = async () => {
      const reviewed = await Promise.all(
        products.map(async (product): Promise<Review> => {
          if (!brandId) {
            return {
              product,
              image: false,
              stock: false,
              error: "Marca no configurada.",
            };
          }

          try {
            const response = await loadAdminProductPublicationReadiness(
              brandId,
              product.id
            );

            if (!response.success || response.data.productId !== product.id) {
              throw new Error(
                "CORE no confirmó los requisitos de publicación."
              );
            }

            return {
              product,
              readiness: response.data,
              image: false,
              stock: false,
            };
          } catch (error) {
            return {
              product,
              image: false,
              stock: false,
              error: publicationErrorMessage(error),
            };
          }
        })
      );

      if (active) {
        setRows(reviewed);
        setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [open, brandId, products]);

  const needsImage = (row: Review) =>
    row.readiness?.requiredConfirmations.includes("useDefaultImage") ?? false;

  const needsStock = (row: Review) =>
    row.readiness?.requiredConfirmations.includes("publishWithoutStock") ?? false;

  const blocked = (row: Review) =>
    !!row.error || (row.readiness?.blockers.length ?? 0) > 0;

  const eligible = (row: Review) =>
    !blocked(row) &&
    !row.result &&
    !!row.readiness &&
    (!needsImage(row) || row.image) &&
    (!needsStock(row) || row.stock);

  const eligibleCount = rows.filter(eligible).length;
  const publishedCount = rows.filter(
    (row) => row.result === "published"
  ).length;
  const pendingCount = rows.length - publishedCount;

  const updateCheck = (
    id: string,
    key: "image" | "stock",
    value: boolean
  ) => {
    if (publishingRef.current || finished) return;

    setRows((current) =>
      current.map((row) =>
        row.product.id === id ? { ...row, [key]: value } : row
      )
    );
  };

  const publish = async () => {
    if (
      publishingRef.current ||
      loading ||
      finished ||
      !brandId
    ) return;

    const approved = rows.filter(eligible);
    if (approved.length === 0) return;

    publishingRef.current = true;
    setPublishing(true);
    setGeneralError("");

    const publishedIds: string[] = [];
    const next = [...rows];

    try {
      for (const row of approved) {
        const index = next.findIndex(
          (item) => item.product.id === row.product.id
        );

        try {
          const response = await publishAdminProduct(
            brandId,
            row.product.id,
            {
              useDefaultImage: needsImage(row) && row.image,
              publishWithoutStock: needsStock(row) && row.stock,
            }
          );

          if (
            !response.success ||
            typeof response.data !== "object" ||
            response.data === null ||
            !("id" in response.data) ||
            response.data.id !== row.product.id ||
            !("status" in response.data) ||
            response.data.status !== "PUBLISHED"
          ) {
            throw new Error(
              "CORE no confirmó el estado publicado."
            );
          }

          publishedIds.push(row.product.id);
          next[index] = {
            ...row,
            result: "published",
            resultMessage: "Publicado por CORE",
          };
        } catch (error) {
          next[index] = {
            ...row,
            result: "error",
            resultMessage: publicationErrorMessage(error),
          };
        }

        setRows([...next]);
      }

      setFinished(true);

      if (publishedIds.length > 0) {
        try {
          await onPublished(publishedIds);
        } catch {
          setGeneralError(
            "CORE confirmó publicaciones, pero no se pudo actualizar el listado."
          );
        }
      }
    } finally {
      setPublishing(false);
      publishingRef.current = false;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !publishing) onClose();
      }}
    >
      <DialogContent
        className="flex max-h-[90vh] w-[calc(100vw-24px)] max-w-[760px] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl"
        style={{
          backgroundColor: "#ffffff",
          color: "#0f172a",
          opacity: 1,
        }}
      >
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50 px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <PackageCheck className="h-5 w-5" aria-hidden="true" />
            Publicar seleccionados
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600">
            Wooly · Revisión individual mediante JUNG CORE
          </DialogDescription>
        </DialogHeader>

        <section
          aria-label="Resumen de publicación"
          className="grid shrink-0 grid-cols-3 gap-2 border-b border-slate-100 bg-white px-5 py-3"
        >
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-center">
            <strong className="block text-lg text-slate-900">
              {rows.length || products.length}
            </strong>
            <span className="text-xs text-slate-600">
              Seleccionados
            </span>
          </div>

          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center">
            <strong className="block text-lg text-emerald-800">
              {finished ? publishedCount : eligibleCount}
            </strong>
            <span className="text-xs text-emerald-800">
              {finished ? "Publicados" : "Autorizados"}
            </span>
          </div>

          <div className="rounded-lg bg-amber-50 px-3 py-2 text-center">
            <strong className="block text-lg text-amber-800">
              {finished
                ? pendingCount
                : rows.length - eligibleCount}
            </strong>
            <span className="text-xs text-amber-800">
              Por revisar
            </span>
          </div>
        </section>

        <div
          className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-white px-5 py-3"
          aria-label="Productos seleccionados"
        >
          {loading ? (
            <div
              role="status"
              className="flex items-center gap-2 py-8 text-sm text-slate-600"
            >
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Verificando productos en JUNG CORE…
            </div>
          ) : rows.map((row) => {
            const isExpanded = expandedId === row.product.id;
            const isBlocked = blocked(row);
            const imageRequired = needsImage(row);
            const stockRequired = needsStock(row);
            const warningsCount = row.readiness?.warnings.length ?? 0;
            const blockersCount = row.readiness?.blockers.length ?? 0;
            const status =
              row.result === "published"
                ? "Publicado"
                : row.result === "error"
                  ? "Error"
                  : isBlocked
                    ? "Bloqueado"
                    : eligible(row)
                      ? "Listo"
                      : "Revisar";

            return (
              <section
                key={row.product.id}
                aria-label={`Revisión de ${row.product.title}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "Ocultar" : "Revisar"} ${row.product.title}`}
                  onClick={() =>
                    setExpandedId(
                      isExpanded ? null : row.product.id
                    )
                  }
                  className="flex w-full items-center gap-3 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {row.product.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {row.product.code ?? "Sin código"}
                      {" · "}
                      {blockersCount > 0
                        ? `${blockersCount} bloqueos`
                        : row.error
                          ? "Error de validación"
                          : `${warningsCount} advertencias`}
                    </p>
                  </div>

                  <span
                    className={
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium " +
                      (row.result === "published" || status === "Listo"
                        ? "bg-emerald-100 text-emerald-800"
                        : status === "Bloqueado" || status === "Error"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800")
                    }
                  >
                    {status}
                  </span>

                  <span className="hidden text-xs font-medium text-slate-600 sm:inline">
                    {isExpanded ? "Cerrar" : "Revisar"}
                  </span>

                  {isExpanded ? (
                    <ChevronUp
                      className="h-4 w-4 shrink-0 text-slate-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-slate-500"
                      aria-hidden="true"
                    />
                  )}
                </button>

                {isExpanded ? (
                  <div className="space-y-3 border-t border-slate-100 bg-white p-3">
                    {row.error ? (
                      <p
                        role="alert"
                        className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
                      >
                        {row.error}
                      </p>
                    ) : null}

                    {blockersCount > 0 ? (
                      <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-red-900">
                          <ShieldAlert
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          Impedimentos de publicación
                        </p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-red-800">
                          {row.readiness?.blockers.map((reason) => (
                            <li key={reason}>
                              {publicationReasonLabel(reason)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {warningsCount > 0 ? (
                      <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                        <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-900">
                          <AlertTriangle
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          Advertencias de CORE
                        </p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
                          {row.readiness?.warnings.map((reason) => (
                            <li key={reason}>
                              {publicationReasonLabel(reason)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {!isBlocked && imageRequired ? (
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 shrink-0"
                          checked={row.image}
                          disabled={publishing || finished}
                          onChange={(event) =>
                            updateCheck(
                              row.product.id,
                              "image",
                              event.target.checked
                            )
                          }
                        />
                        Autorizar imagen predeterminada para este producto
                      </label>
                    ) : null}

                    {!isBlocked && stockRequired ? (
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 shrink-0"
                          checked={row.stock}
                          disabled={publishing || finished}
                          onChange={(event) =>
                            updateCheck(
                              row.product.id,
                              "stock",
                              event.target.checked
                            )
                          }
                        />
                        Autorizar publicación sin stock verificado
                      </label>
                    ) : null}

                    {!row.error &&
                    blockersCount === 0 &&
                    warningsCount === 0 &&
                    !imageRequired &&
                    !stockRequired ? (
                      <p className="flex items-center gap-2 text-sm text-emerald-700">
                        <CheckCircle2
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        Sin advertencias ni confirmaciones pendientes.
                      </p>
                    ) : null}

                    {row.result === "published" ? (
                      <p
                        role="status"
                        className="flex items-center gap-2 text-sm text-emerald-700"
                      >
                        <CheckCircle2
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        Publicación confirmada por JUNG CORE.
                      </p>
                    ) : null}

                    {row.result === "error" && row.resultMessage ? (
                      <p
                        role="alert"
                        className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
                      >
                        {row.resultMessage}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </section>
            );
          })}

          {generalError ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {generalError}
            </p>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
            disabled={publishing}
            onClick={onClose}
          >
            {finished ? "Cerrar" : "Cancelar"}
          </button>

          {!finished ? (
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={loading || publishing || eligibleCount === 0}
              onClick={() => void publish()}
            >
              {publishing
                ? "Publicando…"
                : `Publicar ${eligibleCount} autorizados`}
            </button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}