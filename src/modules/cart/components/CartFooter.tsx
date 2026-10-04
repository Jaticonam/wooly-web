import {
  useState,
} from "react";

import {
  AlertTriangle,
  LoaderCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import type {
  CartItem,
} from "@/modules/cart/types";

import type {
  CartReconciliationChange,
} from "@/modules/cart/domain/CartReconciliation";

import {
  checkoutWithProvider,
} from "@/modules/cart/utils/checkout";

import {
  catalogProvider,
} from "@/modules/catalog/providers/DefaultCatalogProvider";

interface CartFooterProps {
  cart:
    CartItem[];

  totalItems:
    number;

  totalPrice:
    number;

  savings:
    number;

  onClearCart:
    () => void;

  onReplaceCart:
    (
      items:
        readonly CartItem[],
    ) => void;

  onClose:
    () => void;
}

interface CartFooterNotice {
  tone:
    "warning" |
    "error";

  title:
    string;

  message:
    string;
}

function buildUpdateMessage(
  changes:
    readonly CartReconciliationChange[],
): string {
  const priceChanges =
    changes.filter(
      (change) =>
        change.code ===
        "PRICE_CHANGED",
    ).length;

  const removedProducts =
    changes.filter(
      (change) =>
        [
          "PRODUCT_NOT_FOUND",
          "PRODUCT_UNPUBLISHED",
          "PRODUCT_OUT_OF_STOCK",
        ].includes(
          change.code,
        ),
    ).length;

  const normalizedQuantities =
    changes.filter(
      (change) =>
        change.code ===
        "QUANTITY_NORMALIZED",
    ).length;

  const refreshedProducts =
    changes.filter(
      (change) =>
        change.code ===
        "PRODUCT_DATA_REFRESHED",
    ).length;

  const details:
    string[] = [];

  if (priceChanges > 0) {
    details.push(
      priceChanges === 1
        ? "El precio de 1 producto cambió."
        : `Los precios de ${priceChanges} productos cambiaron.`,
    );
  }

  if (removedProducts > 0) {
    details.push(
      removedProducts === 1
        ? "Retiramos 1 producto que ya no está disponible."
        : `Retiramos ${removedProducts} productos que ya no están disponibles.`,
    );
  }

  if (
    normalizedQuantities >
    0
  ) {
    details.push(
      normalizedQuantities ===
        1
        ? "Corregimos la cantidad de 1 producto."
        : `Corregimos las cantidades de ${normalizedQuantities} productos.`,
    );
  }

  if (
    refreshedProducts >
      0 &&
    priceChanges ===
      0 &&
    removedProducts ===
      0 &&
    normalizedQuantities ===
      0
  ) {
    details.push(
      refreshedProducts === 1
        ? "Actualizamos la información de 1 producto."
        : `Actualizamos la información de ${refreshedProducts} productos.`,
    );
  }

  return [
    ...details,
    "Revisa tu caja y vuelve a presionar el botón para continuar por WhatsApp.",
  ].join(
    " ",
  );
}

export function CartFooter({
  cart,
  totalItems,
  totalPrice,
  savings,
  onClearCart,
  onReplaceCart,
  onClose,
}: CartFooterProps) {
  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    notice,
    setNotice,
  ] =
    useState<CartFooterNotice | null>(
      null,
    );

  const disabled =
    cart.length ===
      0 ||
    isSubmitting;

  const handleCheckout =
    async () => {
      if (disabled) {
        return;
      }

      setIsSubmitting(
        true,
      );

      setNotice(
        null,
      );

      try {
        const result =
          await checkoutWithProvider(
            catalogProvider,
            cart,
            savings,
            onClearCart,
            onClose,
            onReplaceCart,
          );

        if (
          result.status ===
          "provider-error"
        ) {
          setNotice({
            tone:
              "error",

            title:
              "No pudimos verificar tu caja",

            message:
              "Conservamos todos tus productos. Revisa tu conexión e inténtalo nuevamente.",
          });

          return;
        }

        if (
          result.status ===
          "cart-updated"
        ) {
          setNotice({
            tone:
              "warning",

            title:
              "Actualizamos tu caja antes de enviar",

            message:
              buildUpdateMessage(
                result
                  .reconciliation
                  .changes,
              ),
          });

          return;
        }

        if (
          result.status ===
          "blocked"
        ) {
          setNotice({
            tone:
              "error",

            title:
              "WhatsApp no pudo abrirse",

            message:
              "El navegador bloqueó la nueva ventana. Habilita las ventanas emergentes y vuelve a intentarlo.",
          });

          return;
        }

        if (
          result.status ===
          "invalid"
        ) {
          setNotice({
            tone:
              "error",

            title:
              "No pudimos preparar el pedido",

            message:
              "Revisa los productos de tu caja antes de volver a enviarlo.",
          });
        }
      } catch {
        setNotice({
          tone:
            "error",

          title:
            "Ocurrió un problema inesperado",

          message:
            "Tu caja permanece intacta. Vuelve a intentarlo.",
        });
      } finally {
        setIsSubmitting(
          false,
        );
      }
    };

  return (
    <div className="cart-footer">
      {savings > 0 && (
        <div className="cart-saving-box">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-4 fill-current animate-pulse" />

            <span className="text-[11px] font-black tracking-tight">
              Ahorro Wooly aplicado
            </span>
          </div>

          <span className="text-sm font-black">
            - S/{" "}
            {savings.toFixed(
              2,
            )}
          </span>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-2">
        <div
          data-testid="cart-summary-units"
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
        >
          <span className="block text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
            Tu caja
          </span>

          <strong className="mt-0.5 block text-[18px] font-black leading-none text-[#0f172a]">
            {totalItems}{" "}
            {totalItems === 1
              ? "unidad"
              : "unidades"}
          </strong>

          <span className="mt-1 block text-[9px] font-bold text-slate-400">
            {cart.length}{" "}
            {cart.length === 1
              ? "producto"
              : "productos"}
          </span>
        </div>

        <div
          data-testid="cart-summary-total"
          className="rounded-xl border border-[#b9dde4] bg-[#f1fbfc] px-3 py-2.5 text-right"
        >
          <span className="block text-[9px] font-black uppercase tracking-[0.08em] text-[#5b8791]">
            Total estimado
          </span>

          <strong className="mt-0.5 block text-[23px] font-black leading-none tracking-[-0.04em] text-[#1d8299]">
            S/{" "}
            {totalPrice.toFixed(
              2,
            )}
          </strong>

          <span className="mt-1 block text-[9px] font-bold text-[#5b8791]">
            Antes de confirmar
          </span>
        </div>
      </div>

      {!disabled &&
      !notice ? (
        <p className="mb-2.5 mt-2 text-center text-[10px] font-semibold leading-snug text-[#64748b]">
          Verificaremos precios y disponibilidad antes de abrir WhatsApp.
        </p>
      ) : null}

      {notice ? (
        <div
          role="alert"
          aria-live="assertive"
          className={[
            "mb-3 rounded-xl border px-3 py-3",
            notice.tone ===
            "warning"
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-rose-300 bg-rose-50 text-rose-900",
          ].join(
            " ",
          )}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

            <div>
              <p className="text-[12px] font-black">
                {notice.title}
              </p>

              <p className="mt-1 text-[11px] font-semibold leading-snug">
                {notice.message}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-live="polite"
        onClick={() => {
          void handleCheckout();
        }}
        disabled={disabled}
        className={
          disabled
            ? "flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-2xl bg-[#f1f5f9] py-4 text-sm font-black tracking-wide text-[#94a3b8]"
            : "cart-checkout-btn"
        }
      >
        {isSubmitting ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}

        {isSubmitting
          ? "Verificando tu caja..."
          : notice?.tone ===
              "warning"
            ? "Revisé los cambios: enviar por WhatsApp"
            : "Enviar pedido por WhatsApp"}
      </button>
    </div>
  );
}
