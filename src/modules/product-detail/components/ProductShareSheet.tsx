import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Copy,
  Link2,
  Share2,
  X as CloseIcon,
} from "lucide-react";

import {
  FacebookIcon,
  PinterestIcon,
  WhatsAppIcon,
  XIcon,
} from "@/shared/components/ui/SocialIcons";

interface ProductShareSheetProps {
  open: boolean;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string | null;
  imageSource?: string;
  pinterestEnabled?: boolean;
  onClose: () => void;
}

function openExternal(
  url: string,
) {
  window.open(
    url,
    "_blank",
    "noopener,noreferrer",
  );
}

function buildShareText(
  title: string,
) {
  return `Mira ${title} en Wooly`;
}

function absoluteAssetUrl(
  assetUrl: string,
  productUrl: string,
) {
  try {
    return new URL(
      assetUrl,
      productUrl,
    ).toString();
  }
  catch {
    return assetUrl;
  }
}

export function ProductShareSheet({
  open,
  title,
  description = "",
  url,
  imageUrl = null,
  imageSource,
  pinterestEnabled = false,
  onClose,
}: ProductShareSheetProps) {
  const [
    copied,
    setCopied,
  ] = useState(false);

  const shareText =
    useMemo(
      () =>
        buildShareText(
          title,
        ),
      [
        title,
      ],
    );

  const pinterestReady =
    Boolean(
      pinterestEnabled &&
      imageUrl,
    );

  useEffect(
    () => {
      if (!open) {
        setCopied(
          false,
        );

        return;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      document.body.style.overflow =
        "hidden";

      const onKeyDown =
        (
          event:
            KeyboardEvent,
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            onClose();
          }
        };

      window.addEventListener(
        "keydown",
        onKeyDown,
      );

      return () => {
        document.body.style.overflow =
          previousOverflow;

        window.removeEventListener(
          "keydown",
          onKeyDown,
        );
      };
    },
    [
      open,
      onClose,
    ],
  );

  if (!open) {
    return null;
  }

  const handleWhatsApp =
    () => {
      const message =
        `${shareText}\n${url}`;

      openExternal(
        `https://wa.me/?text=${encodeURIComponent(
          message,
        )}`,
      );
    };

  const handleFacebook =
    () => {
      openExternal(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url,
        )}`,
      );
    };

  const handleX =
    () => {
      openExternal(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText,
        )}&url=${encodeURIComponent(
          url,
        )}`,
      );
    };

  const handleCopy =
    async () => {
      try {
        await navigator.clipboard
          .writeText(
            url,
          );

        setCopied(
          true,
        );

        window.setTimeout(
          () =>
            setCopied(
              false,
            ),
          1800,
        );
      }
      catch {
        console.warn(
          "No se pudo copiar el enlace del producto",
        );
      }
    };

  const handleNativeShare =
    async () => {
      if (
        !navigator.share
      ) {
        await handleCopy();
        return;
      }

      try {
        await navigator.share({
          title,
          text:
            description ||
            shareText,
          url,
        });
      }
      catch (
        error: unknown
      ) {
        if (
          error instanceof DOMException &&
          error.name ===
            "AbortError"
        ) {
          return;
        }

        console.warn(
          "No se pudo abrir el selector de compartir",
          error,
        );
      }
    };

  const handlePinterest =
    () => {
      if (
        !pinterestReady ||
        !imageUrl
      ) {
        return;
      }

      const mediaUrl =
        absoluteAssetUrl(
          imageUrl,
          url,
        );

      openExternal(
        `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(
          url,
        )}&media=${encodeURIComponent(
          mediaUrl,
        )}&description=${encodeURIComponent(
          description ||
          title,
        )}`,
      );
    };

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-6"
      role="presentation"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-share-title"
        className="w-full max-w-[430px] animate-in rounded-t-[26px] border border-slate-200 bg-white p-4 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-2xl fade-in slide-in-from-bottom-4 duration-200 sm:rounded-[24px] sm:p-5 sm:zoom-in-95"
        data-share-image-source={
          imageSource ||
          "none"
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f6f8] text-[#1d8299]">
              <Share2 className="h-[18px] w-[18px]" />
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#1d8299]">
                Compartir producto
              </p>

              <h2
                id="product-share-title"
                className="mt-0.5 line-clamp-2 text-[15px] font-black leading-tight text-slate-900"
              >
                {title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar opciones de compartir"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-[11px] font-semibold leading-relaxed text-slate-500">
          Comparte el enlace público de este producto.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={
              handleWhatsApp
            }
            className="flex min-h-[74px] flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-2 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-50 active:scale-[.98]"
          >
            <WhatsAppIcon className="h-6 w-6" />
            WhatsApp
          </button>

          <button
            type="button"
            onClick={
              handleFacebook
            }
            className="flex min-h-[74px] flex-col items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/70 px-2 text-[10px] font-black text-blue-700 transition hover:bg-blue-50 active:scale-[.98]"
          >
            <FacebookIcon className="h-6 w-6" />
            Facebook
          </button>

          <button
            type="button"
            onClick={
              handleX
            }
            className="flex min-h-[74px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 text-[10px] font-black text-slate-700 transition hover:bg-slate-100 active:scale-[.98]"
          >
            <XIcon className="h-5 w-5" />
            X
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={
              handleCopy
            }
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-700 transition hover:bg-slate-50 active:scale-[.98]"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4 text-slate-500" />
            )}

            {copied
              ? "Enlace copiado"
              : "Copiar enlace"}
          </button>

          <button
            type="button"
            onClick={
              handleNativeShare
            }
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#b9dde4] bg-[#f4fbfc] px-3 text-[11px] font-black text-[#16697a] transition hover:bg-[#eaf8fa] active:scale-[.98]"
          >
            <Link2 className="h-4 w-4" />
            Compartir…
          </button>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={
              handlePinterest
            }
            disabled={
              !pinterestReady
            }
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2.5 text-left transition enabled:hover:bg-rose-50 enabled:active:scale-[.99] disabled:cursor-default disabled:opacity-70"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#bd081c] shadow-sm">
                <PinterestIcon className="h-5 w-5" />
              </span>

              <span>
                <strong className="block text-[11px] font-black text-slate-800">
                  Pinterest
                </strong>

                <small className="mt-0.5 block text-[9px] font-bold text-slate-500">
                  Imagen + enlace del producto
                </small>
              </span>
            </span>

            <span className="rounded-full bg-white px-2 py-1 text-[8px] font-black uppercase tracking-[0.05em] text-[#bd081c] shadow-sm">
              {pinterestReady
                ? "Compartir"
                : "Próximamente"}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
