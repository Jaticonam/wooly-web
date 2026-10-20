import { Link } from "react-router-dom";

export default function AdminNotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
      <div className="text-center text-slate-600">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Wooly Admin · 404
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">
          Ruta administrativa no encontrada
        </h1>
        <div className="mt-6 flex justify-center gap-4 text-sm font-semibold">
          <Link to="/admin" className="text-cyan-700">
            Ir al panel
          </Link>
          <a href="/" className="text-slate-500">
            Ir a Wooly
          </a>
        </div>
      </div>
    </main>
  );
}
