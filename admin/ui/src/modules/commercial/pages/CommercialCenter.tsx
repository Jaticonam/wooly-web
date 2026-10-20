import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Activity, Boxes, History, PlugZap, Rocket, ShieldCheck } from "lucide-react";
import {
  getCommercialDashboard,
  type CommercialDashboard,
} from "../services/getCommercialDashboard";

interface CardProps {
  icon: ReactNode;
  title: string;
  value: ReactNode;
  detail: string;
  tone?: string;
}

interface InfoProps {
  label: string;
  value: ReactNode;
}

export default function CommercialCenter() {
  const [data, setData] =
    useState<CommercialDashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCommercialDashboard().then(setData).catch((err) => setError(String(err)));
  }, []);

  const last = data?.publication?.last;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-pink-300">Commercial Center</p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">Centro Comercial Operativo</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Control de calidad, publicaciones, conectores, historial y estado comercial del catálogo.</p>
        </div>

        {error && <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-5 text-red-200">{error}</div>}

        <div className="grid gap-5 md:grid-cols-4">
          <Card icon={<ShieldCheck />} title="Estado" value="Healthy" detail="Commercial Core operativo" tone="emerald" />
          <Card icon={<Boxes />} title="Productos" value={data?.connectors?.[0]?.products ?? "..."} detail="Último feed Meta" />
          <Card icon={<History />} title="Publicaciones" value={data?.publication?.total ?? "..."} detail="Historial registrado" />
          <Card icon={<Activity />} title="Score" value={last?.averageScore ? `${last.averageScore}/100` : "..."} detail="Última publicación" />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <article className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur lg:col-span-2">
            <div className="flex items-center gap-3">
              <Rocket className="text-pink-300" />
              <h2 className="text-2xl font-black">Última publicación</h2>
            </div>

            <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
              <Info label="Plan" value={last?.planName || "Sin registro"} />
              <Info label="Conector" value={last?.connector || "Meta"} />
              <Info label="Seleccionados" value={last?.selectedItems ?? "..."} />
              <Info label="Exportados" value={last?.exportedItems ?? "..."} />
              <Info label="Omitidos" value={last?.omittedItems ?? "..."} />
              <Info label="Estado" value={last?.status || "..."} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/api/previews/publication-preview.json" target="_blank" className="rounded-full bg-pink-500 px-5 py-2 text-sm font-bold hover:bg-pink-400">Ver preview</a>
              <a href="/api/history/publications/latest.json" target="_blank" className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-950 hover:bg-slate-200">Ver historial</a>
              <a href="/api/exports/meta.csv" target="_blank" className="rounded-full border border-white/20 px-5 py-2 text-sm font-bold hover:bg-white/10">Ver feed Meta</a>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3">
              <PlugZap className="text-emerald-300" />
              <h2 className="text-2xl font-black">Conectores</h2>
            </div>

            <div className="mt-5 grid gap-3">
              {(data?.connectors || []).map((c) => (
                <div key={c.key} className="rounded-2xl bg-white/10 p-4">
                  <div className="flex justify-between">
                    <strong className="uppercase">{c.key}</strong>
                    <span className="text-emerald-300">{c.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{c.products} productos</p>
                </div>
              ))}

              {(!data?.connectors?.length) && <p className="text-slate-400">Sin conectores registrados.</p>}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

function Card({ icon, title, value, detail }: CardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
      <div className="mb-4 text-pink-300">{icon}</div>
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className="mt-1 text-3xl font-black">{value}</h3>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
    </article>
  );
}

function Info({ label, value }: InfoProps) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <strong className="mt-1 block text-lg">{value}</strong>
    </div>
  );
}
