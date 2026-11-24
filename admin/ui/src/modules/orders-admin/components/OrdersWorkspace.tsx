import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ClipboardList,
  Inbox,
  KanbanSquare,
  PackageCheck,
  Search,
  Truck,
  Workflow,
} from "lucide-react";
import AdminShell from "@/modules/admin/components/AdminShell/AdminShell";
import "./OrdersWorkspace.css";

/** W-ORD-01: estructura visual sin fuente conectada ni datos de demostración. */
type Stage = {
  key: string;
  title: string;
  description: string;
};

const STAGES: readonly Stage[] = [
  { key: "received", title: "Recibidos", description: "Pedidos pendientes de revisión" },
  { key: "confirmed", title: "Confirmados", description: "Pedidos confirmados" },
  { key: "in_production", title: "En preparación", description: "Preparación comercial pendiente" },
  { key: "finished", title: "Listos", description: "Preparados para despacho" },
  { key: "shipped", title: "Enviados", description: "Pedidos despachados" },
];

const METRICS = [
  { title: "Total de pedidos", icon: ClipboardList },
  { title: "Recibidos", icon: Inbox },
  { title: "En preparación", icon: Workflow },
  { title: "Enviados", icon: Truck },
] as const;

export default function OrdersWorkspace() {
  const { pathname } = useLocation();
  const isBoard = pathname.endsWith("/tablero");
  // UI de W-ORD-01 sin fuente; conservar explícitamente un estado no conectado.
  const [viewNotice] = useState("Esperando integración de lectura con JUNG CORE TEST.");
  const title = useMemo(() => (isBoard ? "Tablero de pedidos" : "Pedidos"), [isBoard]);

  return (
    <AdminShell title={title}>
      <main className="wooly-orders" aria-label={title}>
        <header className="wooly-orders__header">
          <div>
            <span className="wooly-orders__eyebrow">OPERACIONES COMERCIALES</span>
            <h1>{title}</h1>
            <p>Seguimiento y organización de los pedidos comerciales de Wooly.</p>
          </div>
          <div className="wooly-orders__nav">
            {isBoard ? (
              <Link to="/admin/pedidos" className="wooly-orders__action">
                <ArrowLeft size={16} aria-hidden="true" /> Ver listado
              </Link>
            ) : (
              <Link to="/admin/pedidos/tablero" className="wooly-orders__action wooly-orders__action--primary">
                <KanbanSquare size={16} aria-hidden="true" /> Tablero de pedidos
              </Link>
            )}
          </div>
        </header>

        <section className="wooly-orders__notice" role="status" aria-label="Estado de integración">
          <AlertCircle size={18} aria-hidden="true" />
          <div>
            <strong>Solo interfaz · Sin consulta de pedidos</strong>
            <p>{viewNotice} Los indicadores no representan un inventario vacío y no hay operaciones de escritura habilitadas.</p>
          </div>
        </section>

        {!isBoard ? (
          <>
            <section className="wooly-orders__metrics" aria-label="Resumen de pedidos">
              {METRICS.map(({ title: metricTitle, icon: Icon }) => (
                <article className="wooly-orders__metric" key={metricTitle}>
                  <Icon size={19} aria-hidden="true" />
                  <span>{metricTitle}</span>
                  <strong aria-label="Dato no disponible">—</strong>
                </article>
              ))}
            </section>

            <section className="wooly-orders__panel" aria-label="Listado de pedidos">
              <div className="wooly-orders__panel-head">
                <h2>Listado de pedidos</h2>
                <span>Fuente pendiente</span>
              </div>
              <div className="wooly-orders__toolbar">
                <label className="wooly-orders__search">
                  <Search size={16} aria-hidden="true" />
                  <input type="search" disabled placeholder="Buscar por código o cliente" aria-label="Buscar pedidos, disponible al conectar CORE" />
                </label>
                <select aria-label="Filtrar por estado, disponible al conectar CORE" disabled defaultValue="all">
                  <option value="all">Todos los estados</option>
                </select>
              </div>
              <div className="wooly-orders__table-wrap">
                <table className="wooly-orders__table">
                  <thead>
                    <tr>
                      <th>Código</th><th>Fecha</th><th>Cliente</th><th>Producto(s)</th>
                      <th>Cantidad</th><th>Total</th><th>Estado</th><th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={8} className="wooly-orders__empty">
                      <PackageCheck size={25} aria-hidden="true" />
                      <strong>La consulta de pedidos aún no está conectada.</strong>
                      <span>No significa que Wooly no tenga pedidos registrados.</span>
                    </td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <section className="wooly-orders__board" aria-label="Tablero de estados de pedidos">
            {STAGES.map((stage) => (
              <article className="wooly-orders__column" key={stage.key}>
                <header>
                  <h2>{stage.title}</h2>
                  <span aria-label="Conteo no disponible">—</span>
                </header>
                <p>{stage.description}</p>
                <div className="wooly-orders__column-body">
                  <Inbox size={23} aria-hidden="true" />
                  <span>Sin datos conectados</span>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </AdminShell>
  );
}
