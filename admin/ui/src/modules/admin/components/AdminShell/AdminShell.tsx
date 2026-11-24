import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Boxes, ChevronDown, PanelLeftClose, PanelLeftOpen, ClipboardList,
  Database, Files, Images, KanbanSquare, List, LogOut,
  Settings2, Sheet, ShieldCheck, Store, Workflow, ExternalLink,
} from "lucide-react";
import { useOptionalAdminAuth } from "@/modules/admin-auth/context/AdminAuthContext";
import "./AdminShell.css";

interface AdminShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

type Group = "pedidos" | "integraciones";

const isInSection = (path: string, section: string) =>
  path === section || path.startsWith(section + "/");

/** W-SIDEBAR-01: navegación exclusivamente visual; se conservan las rutas públicas. */
export default function AdminShell({
  children,
  title = "Productos",
  subtitle,
}: AdminShellProps) {
  const adminAuth = useOptionalAdminAuth();
  const { pathname } = useLocation();
  const inOrders = isInSection(pathname, "/admin/pedidos");
  const inIntegrations = isInSection(pathname, "/admin/integrations");
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<Group, boolean>>({
    pedidos: inOrders,
    integraciones: inIntegrations,
  });

  useEffect(() => {
    if (inOrders) setOpenGroups((prev) => ({ ...prev, pedidos: true }));
    if (inIntegrations) setOpenGroups((prev) => ({ ...prev, integraciones: true }));
  }, [inOrders, inIntegrations]);

  const toggleGroup = (group: Group) => {
    if (collapsed) setCollapsed(false);
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "is-active" : "";

  return (
    <div className={`wooly-admin-shell${collapsed ? " wooly-admin-shell--collapsed" : ""}`}>
      <aside className="wooly-admin-shell__sidebar" aria-label="Menú lateral">
        <div className="wooly-admin-shell__brand">
          <div className="wooly-admin-shell__brandMark" aria-hidden="true">W</div>
          <div className="wooly-admin-shell__brandCopy">
            <strong>Wooly Admin</strong>
            <small>GESTIÓN COMERCIAL</small>
          </div>
        </div>

        <nav className="wooly-admin-shell__navigation" aria-label="Wooly Admin">
          <div className="wooly-admin-shell__navSection">
            <p className="wooly-admin-shell__sectionTitle">OPERACIONES COMERCIALES</p>
            <NavLink to="/admin" end className={itemClass} title="Productos">
              <span className="wooly-admin-shell__navIcon"><Boxes size={19} strokeWidth={2} /></span>
              <span className="wooly-admin-shell__navLabel">Productos</span>
            </NavLink>

            <div className="wooly-admin-shell__navGroup">
              <div className="wooly-admin-shell__groupHeader">
                <NavLink
                  to="/admin/pedidos"
                  className={inOrders ? "is-active" : ""}
                  title="Pedidos"
                >
                  <span className="wooly-admin-shell__navIcon"><ClipboardList size={19} strokeWidth={2} /></span>
                  <span className="wooly-admin-shell__navLabel">Pedidos</span>
                </NavLink>
                <button
                  type="button"
                  className="wooly-admin-shell__disclosure"
                  onClick={() => toggleGroup("pedidos")}
                  aria-label="Desplegar Pedidos"
                  aria-expanded={openGroups.pedidos}
                  aria-controls="wooly-admin-pedidos-submenu"
                  title="Desplegar Pedidos"
                >
                  <ChevronDown size={16} className={openGroups.pedidos ? "is-open" : ""} />
                </button>
              </div>
              {openGroups.pedidos && !collapsed && (
                <div id="wooly-admin-pedidos-submenu" className="wooly-admin-shell__submenu">
                  <NavLink to="/admin/pedidos" end className={itemClass}>
                    <List size={16} aria-hidden="true" /> <span>Listado de pedidos</span>
                  </NavLink>
                  <NavLink to="/admin/pedidos/tablero" className={itemClass}>
                    <KanbanSquare size={16} aria-hidden="true" /> <span>Tablero Kanban</span>
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink to="/admin/catalogos" className={itemClass} title="Catálogos">
              <span className="wooly-admin-shell__navIcon"><Files size={19} strokeWidth={2} /></span>
              <span className="wooly-admin-shell__navLabel">Catálogos</span>
            </NavLink>
          </div>

          <div className="wooly-admin-shell__navSection">
            <p className="wooly-admin-shell__sectionTitle">ADMINISTRACIÓN</p>
            <div className="wooly-admin-shell__navGroup">
              <div className="wooly-admin-shell__groupHeader">
                <NavLink
                  to="/admin/integrations"
                  className={inIntegrations ? "is-active" : ""}
                  title="Integraciones"
                >
                  <span className="wooly-admin-shell__navIcon"><Workflow size={19} strokeWidth={2} /></span>
                  <span className="wooly-admin-shell__navLabel">Integraciones</span>
                </NavLink>
                <button
                  type="button"
                  className="wooly-admin-shell__disclosure"
                  onClick={() => toggleGroup("integraciones")}
                  aria-label="Desplegar Integraciones"
                  aria-expanded={openGroups.integraciones}
                  aria-controls="wooly-admin-integraciones-submenu"
                  title="Desplegar Integraciones"
                >
                  <ChevronDown size={16} className={openGroups.integraciones ? "is-open" : ""} />
                </button>
              </div>
              {openGroups.integraciones && !collapsed && (
                <div id="wooly-admin-integraciones-submenu" className="wooly-admin-shell__submenu">
                  <NavLink to="/admin/integrations/google-sheets" className={itemClass}>
                    <Sheet size={16} aria-hidden="true" /> <span>Google Sheets</span>
                  </NavLink>
                  <NavLink to="/admin/integrations/jung-core" className={itemClass}>
                    <Database size={16} aria-hidden="true" /> <span>JUNG CORE</span>
                  </NavLink>
                  <NavLink to="/admin/integrations/cloudflare-r2" className={itemClass}>
                    <Images size={16} aria-hidden="true" /> <span>Cloudflare R2</span>
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink to="/admin/configuracion/catalogo" className={itemClass} title="Configuración">
              <span className="wooly-admin-shell__navIcon"><Settings2 size={19} strokeWidth={2} /></span>
              <span className="wooly-admin-shell__navLabel">Configuración</span>
            </NavLink>
          </div>
        </nav>

        <div className="wooly-admin-shell__sidebarFooter">
          <a className="wooly-admin-shell__storeLink" href="/catalogo" target="_blank" rel="noreferrer" title="Ver catálogo público">
            <Store size={18} strokeWidth={2} aria-hidden="true" />
            <span className="wooly-admin-shell__navLabel">Ver catálogo público</span>
            <ExternalLink size={14} className="wooly-admin-shell__external" aria-hidden="true" />
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
          <button
            type="button"
            className="wooly-admin-shell__collapse"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
            <strong>Wooly Admin</strong>
            <span>{title}</span>
          </div>
          <div className="wooly-admin-shell__topbarActions">
            {subtitle ? <small>{subtitle}</small> : null}
            {adminAuth?.status === "authenticated" ? (
              <>
                <div className="wooly-admin-shell__coreStatus">
                  <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
                  <span>CORE conectado</span>
                </div>
                <div className="wooly-admin-shell__account">
                  <span>{adminAuth.session?.user.displayName}</span>
                  <button type="button" onClick={() => void adminAuth.logout()} title="Cerrar sesión" aria-label="Cerrar sesión">
                    <LogOut size={15} strokeWidth={2} />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </header>
        <div className="wooly-admin-shell__workspace">{children}</div>
      </div>
    </div>
  );
}
