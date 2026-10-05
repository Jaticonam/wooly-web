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
  FacebookIcon,
  PinterestIcon,
  WhatsAppIcon,
  XIcon,
} from "@/shared/components/ui/SocialIcons";

interface ProductShareActionsProps {
  title: string;
  description?: string;
  url: string;
  imageUrl?: string | null;
  imageSource?: string;
  pinterestEnabled?: boolean;
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

  const iconLinkClass =
    "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1d8299]/35 hover:text-[#1d8299] active:scale-[.96]";

  return (
    <section
      id="product-share-actions"
      aria-label="Compartir producto"
      className="flex flex-wrap items-center justify-center gap-2 border-y border-slate-100 py-2.5 md:justify-start"
      data-share-image-source={
        imageSource
      }
      data-share-image-url={
        imageUrl ||
        undefined
      }
    >
      <span className="mr-0.5 text-[11px] font-bold text-slate-600">
        Compartir en
      </span>

      <a
        href={
          facebookUrl
        }
        target="_blank"
        rel="noreferrer"
        className={iconLinkClass}
        aria-label="Compartir en Facebook"
        title="Facebook"
      >
        <FacebookIcon className="h-[18px] w-[18px]" />
      </a>

      <a
        href={
          emailUrl
        }
        className={iconLinkClass}
        aria-label="Compartir por correo"
        title="Correo"
      >
        <Mail className="h-[18px] w-[18px]" />
      </a>

      <a
        href={
          whatsappUrl
        }
        target="_blank"
        rel="noreferrer"
        className={iconLinkClass}
        aria-label="Compartir por WhatsApp"
        title="WhatsApp"
      >
        <WhatsAppIcon className="h-5 w-5" />
      </a>

      <a
        href={
          xUrl
        }
        target="_blank"
        rel="noreferrer"
        className={iconLinkClass}
        aria-label="Compartir en X"
        title="X"
      >
        <XIcon className="h-4 w-4" />
      </a>

      <button
        type="button"
        onClick={
          handleCopy
        }
        className={iconLinkClass}
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
          <Check className="h-[18px] w-[18px] text-emerald-600" />
        ) : (
          <Copy className="h-[18px] w-[18px]" />
        )}
      </button>

      {pinterestUrl ? (
        <a
          href={
            pinterestUrl
          }
          target="_blank"
          rel="noreferrer"
          className={`${iconLinkClass} text-[#bd081c]`}
          aria-label="Compartir en Pinterest"
          title="Pinterest"
        >
          <PinterestIcon className="h-[19px] w-[19px]" />
        </a>
      ) : (
        <button
          type="button"
          disabled
          className={`${iconLinkClass} cursor-default text-[#bd081c] opacity-45`}
          aria-label="Pinterest próximamente"
          title="Pinterest · Próximamente"
        >
          <PinterestIcon className="h-[19px] w-[19px]" />
        </button>
      )}
    </section>
  );
}
