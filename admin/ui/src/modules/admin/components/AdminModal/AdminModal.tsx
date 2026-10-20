import {
  useEffect,
  useId,
  type ReactNode,
} from "react";

import "./AdminModal.css";

type AdminModalSize =
  | "compact"
  | "large"
  | "fullscreen";

interface AdminModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  size?: AdminModalSize;
}

export default function AdminModal({
  open,
  title,
  description,
  children,
  onClose,
  size = "large",
}: AdminModalProps) {
  const titleId = useId();

  useEffect(
    () => {
      if (!open) {
        return undefined;
      }

      const previousOverflow =
        document.body.style.overflow;

      document.body.style.overflow =
        "hidden";

      const handleKeyDown = (
        event: KeyboardEvent,
      ) => {
        if (event.key === "Escape") {
          onClose();
        }
      };

      window.addEventListener(
        "keydown",
        handleKeyDown,
      );

      return () => {
        document.body.style.overflow =
          previousOverflow;

        window.removeEventListener(
          "keydown",
          handleKeyDown,
        );
      };
    },
    [
      open,
      onClose,
    ],
  );

  return (
    <div
      className={
        open
          ? "admin-modal is-open"
          : "admin-modal"
      }
      aria-hidden={
        !open
      }
    >
      <button
        type="button"
        className="admin-modal__backdrop"
        aria-label="Cerrar"
        tabIndex={
          open
            ? 0
            : -1
        }
        onClick={
          onClose
        }
      />

      <section
        className={
          `admin-modal__dialog admin-modal__dialog--${size}`
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="admin-modal__header">
          <div>
            <span>
              WOOLY ADMIN
            </span>

            <h2 id={titleId}>
              {title}
            </h2>

            {description ? (
              <p>
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="admin-modal__close"
            onClick={
              onClose
            }
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </header>

        <div className="admin-modal__content">
          {children}
        </div>
      </section>
    </div>
  );
}
