import {
  buildApplicationWhatsAppUrl,
} from "@wooly/shared/config/application";

export default function CampaignHeroDefault() {
  return (
    <main className="relative flex min-h-[720px] items-center justify-center overflow-hidden bg-[#070b14] px-6 py-24 font-sans text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(29,130,153,0.22),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(245,176,37,0.18),_transparent_36%)]" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <section className="space-y-8">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#f5b025]">
            Wooly Import Store
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Productos mayoristas para vender más.
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Explora productos de alta rotación para emprendedores, tiendas y
              negocios que quieren comprar mejor y vender con estrategia.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => {
                window.location.href = "/catalogo";
              }}
              className="rounded-xl bg-gradient-to-r from-[#f5b025] to-[#d49615] px-8 py-4 text-lg font-black text-[#070b14] shadow-[0_0_24px_rgba(245,176,37,0.32)] transition hover:shadow-[0_0_34px_rgba(245,176,37,0.48)]"
            >
              Ver catálogo
            </button>

            <button
              onClick={() => {
                window.open(
                  buildApplicationWhatsAppUrl(
                    "Hola Wooly, quiero información para comprar por mayor",
                  ),
                  "_blank",
                );
              }}
              className="rounded-xl bg-[#25D366] px-8 py-4 text-lg font-bold text-white shadow-[0_10px_30px_rgba(37,211,102,0.35)] transition hover:bg-[#1EAD54]"
            >
              Asesora WhatsApp
            </button>
          </div>
        </section>

        <section className="relative flex min-h-[420px] items-center justify-center">
          <div className="absolute h-72 w-72 rounded-full bg-[#f5b025]/20 blur-[90px]" />

          <div className="relative z-10 rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center shadow-2xl backdrop-blur-xl">
            <div className="mb-5 text-7xl">📦</div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#f5b025]">
              Stock mayorista
            </p>
            <h2 className="mt-3 text-3xl font-black">Listo para tu negocio</h2>
          </div>
        </section>
      </div>
    </main>
  );
}
