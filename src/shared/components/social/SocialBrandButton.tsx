import type {
  CSSProperties,
} from "react";

import {
  SOCIAL_BRAND_META,
  SocialBrandIcon,
  type SocialBrand,
} from "./SocialBrandIcon";

interface SocialBrandButtonProps {
  brand:
    SocialBrand;
  label?: string;
  href?: string | null;
  target?: string;
  rel?: string;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  className?: string;
}

type SocialStyle =
  CSSProperties &
  Record<
    "--social-brand" |
    "--social-soft",
    string
  >;

export function SocialBrandButton({
  brand,
  label,
  href,
  target,
  rel,
  disabled = false,
  title,
  onClick,
  className = "",
}: SocialBrandButtonProps) {
  const meta =
    SOCIAL_BRAND_META[
      brand
    ];

  const style:
    SocialStyle = {
      "--social-brand":
        meta.color,
      "--social-soft":
        meta.softColor,
    };

  const accessibleLabel =
    label ||
    meta.label;

  const classes =
    [
      "social-brand-button",
      className,
    ]
      .filter(Boolean)
      .join(" ");

  if (
    href &&
    !disabled
  ) {
    return (
      <a
        href={
          href
        }
        target={
          target
        }
        rel={
          rel
        }
        className={
          classes
        }
        style={
          style
        }
        aria-label={
          accessibleLabel
        }
        title={
          title ||
          accessibleLabel
        }
        data-social-brand={
          brand
        }
      >
        <SocialBrandIcon
          brand={
            brand
          }
          className="social-brand-button-icon"
        />
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className={
        classes
      }
      style={
        style
      }
      aria-label={
        accessibleLabel
      }
      title={
        title ||
        accessibleLabel
      }
      data-social-brand={
        brand
      }
    >
      <SocialBrandIcon
        brand={
          brand
        }
        className="social-brand-button-icon"
      />
    </button>
  );
}
