import type {
  ReactNode,
} from "react";

import {
  NavLink,
} from "react-router-dom";

import {
  Boxes,
  Files,
  Store,
} from "lucide-react";

import "./AdminShell.css";

interface AdminShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AdminShell({
  children,
  title = "Productos",
  subtitle,
}: AdminShellProps) {
  return (
    <div className="wooly-admin-shell">
      <aside className="wooly-admin-shell__sidebar">
        <div className="wooly-admin-shell__brand">
          <div
            className="wooly-admin-shell__brandMark"
            aria-hidden="true"
          >
            W
          </div>

          <div className="wooly-admin-shell__brandCopy">
            <strong>Wooly</strong>
            <small>WOOLY ADMIN 2.0</small>
          </div>
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
            <span
              className="wooly-admin-shell__navIcon"
              aria-hidden="true"
            >
              <Boxes
                size={18}
                strokeWidth={2}
              />
            </span>

            <span>Productos</span>
          </NavLink>

          <NavLink
            to="/admin/catalogos"
            className={({ isActive }) =>
              isActive ? "is-active" : ""
            }
          >
            <span
              className="wooly-admin-shell__navIcon"
              aria-hidden="true"
            >
              <Files
                size={18}
                strokeWidth={2}
              />
            </span>

            <span>Catálogos</span>
          </NavLink>
        </nav>

        <div className="wooly-admin-shell__sidebarFooter">
          <a
            className="wooly-admin-shell__storeLink"
            href="/catalogo"
            target="_blank"
            rel="noreferrer"
          >
            <Store
              size={15}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>Ver catálogo</span>
          </a>

          <div className="wooly-admin-shell__workspaceBrand">
            <small>Workspace comercial</small>
            <strong>JUNG</strong>
          </div>
        </div>
      </aside>

      <div className="wooly-admin-shell__stage">
        <header className="wooly-admin-shell__topbar">
          <div className="wooly-admin-shell__context">
            <strong>Wooly Admin</strong>
            <span>{title}</span>
          </div>

          {subtitle ? (
            <small>{subtitle}</small>
          ) : null}
        </header>

        <div className="wooly-admin-shell__workspace">
          {children}
        </div>
      </div>
    </div>
  );
}