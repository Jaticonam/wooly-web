import {
  Check,
  Copy,
  Mail,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import {
  SocialBrandButton,
} from "@/shared/components/social";

export type ProductShareChannel =
  | "facebook"
  | "email"
  | "whatsapp"
  | "x"
  | "copy"
  | "pinterest";

interface ProductShareActionsProps {
  title: string;
  description?: string;
  url: string;
  imageUrl?: string | null;
  imageSource?: string;
  pinterestEnabled?: boolean;
  variant?:
    | "inline"
    | "header"
    | "headerCompact";
  channels?: readonly ProductShareChannel[];
  showLabel?: boolean;
}

const DEFAULT_CHANNELS:
  readonly ProductShareChannel[] = [
    "facebook",
    "email",
    "whatsapp",
    "x",
    "copy",
    "pinterest",
  ];

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

async function copyText(
  value: string,
) {
  if (
    navigator.clipboard
      ?.writeText
  ) {
    await navigator.clipboard
      .writeText(
        value,
      );

    return;
  }

  const input =
    document.createElement(
      "textarea",
    );

  input.value =
    value;

  input.style.position =
    "fixed";

  input.style.opacity =
    "0";

  document.body.appendChild(
    input,
  );

  input.select();

  document.execCommand(
    "copy",
  );

  input.remove();
}

export function ProductShareActions({
  title,
  description = "",
  url,
  imageUrl = null,
  imageSource = "none",
  pinterestEnabled = false,
  variant = "inline",
  channels = DEFAULT_CHANNELS,
  showLabel = true,
}: ProductShareActionsProps) {
  const [
    copied,
    setCopied,
  ] =
    useState(false);

  const shareText =
    useMemo(
      () =>
        `Mira ${title} en Wooly`,
      [
        title,
      ],
    );

  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(
      `${shareText}\n${url}`,
    )}`;

  const facebookUrl =
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url,
    )}`;

  const xUrl =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText,
    )}&url=${encodeURIComponent(
      url,
    )}`;

  const emailUrl =
    `mailto:?subject=${encodeURIComponent(
      title,
    )}&body=${encodeURIComponent(
      `${description || shareText}\n\n${url}`,
    )}`;

  const pinterestReady =
    Boolean(
      pinterestEnabled &&
      imageUrl,
    );

  const pinterestUrl =
    pinterestReady &&
    imageUrl
      ? `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(
          url,
        )}&media=${encodeURIComponent(
          absoluteAssetUrl(
            imageUrl,
            url,
          ),
        )}&description=${encodeURIComponent(
          description ||
          title,
        )}`
      : null;

  const handleCopy =
    async () => {
      try {
        await copyText(
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
          1600,
        );
      }
      catch {
        console.warn(
          "No se pudo copiar el enlace del producto",
        );
      }
    };

  const isHeader =
    variant ===
      "header" ||
    variant ===
      "headerCompact";

  const isCompact =
    variant ===
    "headerCompact";

  const hasChannel =
    (
      channel:
        ProductShareChannel,
    ) =>
      channels.includes(
        channel,
      );

  const brandClassName =
    isCompact
      ? "social-brand-button--compact"
      : isHeader
        ? "!h-9 !w-9"
        : "";

  const neutralActionClass =
    [
      "flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_2px_6px_rgba(15,23,42,.06)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-[.96] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200/70",
      isCompact
        ? "h-8 w-8"
        : isHeader
          ? "h-9 w-9"
          : "h-10 w-10",
    ].join(
      " ",
    );

  return (
    <section
      id={
        isHeader
          ? undefined
          : "product-share-actions"
      }
      aria-label="Compartir producto"
      className={
        isHeader
          ? "flex min-w-0 items-center gap-1.5"
          : "flex flex-wrap items-center justify-center gap-2.5 border-y border-slate-100 py-3 md:justify-start"
      }
      data-share-image-source={
        imageSource
      }
      data-share-image-url={
        imageUrl ||
        undefined
      }
    >
      {showLabel && (
        <span
          className={
            isHeader
              ? "mr-0.5 shrink-0 text-[10px] font-extrabold text-slate-500"
              : "mr-1 text-[11px] font-extrabold text-slate-700"
          }
        >
          Compartir
        </span>
      )}

      {hasChannel(
        "facebook",
      ) && (
        <SocialBrandButton
          brand="facebook"
          href={
            facebookUrl
          }
          target="_blank"
          rel="noreferrer"
          label="Compartir en Facebook"
          title="Facebook"
          className={
            brandClassName
          }
        />
      )}

      {hasChannel(
        "email",
      ) && (
        <a
          href={
            emailUrl
          }
          className={
            neutralActionClass
          }
          aria-label="Compartir por correo"
          title="Correo"
        >
          <Mail
            className={
              isCompact
                ? "h-4 w-4"
                : "h-[19px] w-[19px]"
            }
          />
        </a>
      )}

      {hasChannel(
        "whatsapp",
      ) && (
        <SocialBrandButton
          brand="whatsapp"
          href={
            whatsappUrl
          }
          target="_blank"
          rel="noreferrer"
          label="Compartir por WhatsApp"
          title="WhatsApp"
          className={
            brandClassName
          }
        />
      )}

      {hasChannel(
        "x",
      ) && (
        <SocialBrandButton
          brand="x"
          href={
            xUrl
          }
          target="_blank"
          rel="noreferrer"
          label="Compartir en X"
          title="X"
          className={
            brandClassName
          }
        />
      )}

      {hasChannel(
        "copy",
      ) && (
        <button
          type="button"
          onClick={
            handleCopy
          }
          className={
            neutralActionClass
          }
          aria-label={
            copied
              ? "Enlace copiado"
              : "Copiar enlace"
          }
          title={
            copied
              ? "Copiado"
              : "Copiar enlace"
          }
        >
          {copied ? (
            <Check
              className={
                isCompact
                  ? "h-4 w-4 text-emerald-600"
                  : "h-[19px] w-[19px] text-emerald-600"
              }
            />
          ) : (
            <Copy
              className={
                isCompact
                  ? "h-4 w-4"
                  : "h-[19px] w-[19px]"
              }
            />
          )}
        </button>
      )}

      {hasChannel(
        "pinterest",
      ) && (
        <SocialBrandButton
          brand="pinterest"
          href={
            pinterestUrl
          }
          target="_blank"
          rel="noreferrer"
          disabled={
            !pinterestUrl
          }
          label={
            pinterestUrl
              ? "Compartir en Pinterest"
              : "Pinterest próximamente"
          }
          title={
            pinterestUrl
              ? "Pinterest"
              : "Pinterest · Próximamente"
          }
          className={
            brandClassName
          }
        />
      )}
    </section>
  );
}
