import type {
  LucideIcon,
} from "lucide-react";

import {
  Boxes,
  Megaphone,
  MousePointer2,
  Tag,
} from "lucide-react";

import {
  CATALOG_WORKSPACE_SCOPE_OPTIONS,
  type CatalogWorkspaceScope,
} from "@/modules/catalog-tools/domain/CatalogWorkspaceScope";

import "./CatalogCompositionModePicker.css";

interface CatalogCompositionModePickerProps {
  value:
    CatalogWorkspaceScope;

  onChange: (
    scope:
      CatalogWorkspaceScope,
  ) => void;
}

const SCOPE_ICON:
  Record<
    CatalogWorkspaceScope,
    LucideIcon
  > = {
    all:
      Boxes,

    category:
      Tag,

    campaign:
      Megaphone,

    custom:
      MousePointer2,
  };

export default function CatalogCompositionModePicker({
  value,
  onChange,
}: CatalogCompositionModePickerProps) {
  return (
    <div
      className="catalog-mode-picker"
      role="group"
      aria-label="Alcance comercial"
    >
      {CATALOG_WORKSPACE_SCOPE_OPTIONS.map(
        (scope) => {
          const Icon =
            SCOPE_ICON[
              scope.id
            ];

          return (
            <button
              type="button"
              key={
                scope.id
              }
              className={
                value ===
                scope.id
                  ? "is-active"
                  : ""
              }
              aria-pressed={
                value ===
                scope.id
              }
              onClick={() =>
                onChange(
                  scope.id,
                )
              }
            >
              <Icon
                size={15}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span>
                <strong>
                  {scope.label}
                </strong>

                <small>
                  {scope.description}
                </small>
              </span>
            </button>
          );
        },
      )}
    </div>
  );
}
