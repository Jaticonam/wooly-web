import type {
  ReactNode,
} from "react";

import {
  NavLink,
} from "react-router-dom";

import "./AdminShell.css";

interface AdminShellProps {
  children:
    ReactNode;

  title?: string;
  subtitle?: string;
}

export default function AdminShell({
  children,
  title = "Productos",
  subtitle = "Inventario comercial",
}: AdminShellProps) {
  return (
    <div className="wooly-admin-shell">
      <aside className="wooly-admin-shell__sidebar">
        <div className="wooly-admin-shell__brand">
          <strong>
            W
          </strong>

          <span>
            Wooly
          </span>
        </div>

        <nav
          className="wooly-admin-shell__navigation"
          aria-label="Wooly Admin"
        >
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive ? "is-active" : ""
            }
          >
            <span className="wooly-admin-shell__navIcon">
              ▣
            </span>

            <span>
              Productos
            </span>
          </NavLink>

          <NavLink
            to="/admin/catalogos"
            className={({ isActive }) =>
              isActive ? "is-active" : ""
            }
          >
            <span className="wooly-admin-shell__navIcon">
              ▤
            </span>

            <span>
              Catálogos
            </span>
          </NavLink>
        </nav>
      </aside>

      <div className="wooly-admin-shell__stage">
        <header className="wooly-admin-shell__topbar">
          <div className="wooly-admin-shell__context">
            <span>
              WOOLY ADMIN 2.0
            </span>

            <div>
              <strong>
                {title}
              </strong>

              <small>
                {subtitle}
              </small>
            </div>
          </div>

          <div className="wooly-admin-shell__actions">
            <a
              href="/catalogo"
              target="_blank"
              rel="noreferrer"
            >
              Ver catálogo
            </a>
          </div>
        </header>

        <div className="wooly-admin-shell__workspace">
          {children}
        </div>
      </div>
    </div>
  );
}
