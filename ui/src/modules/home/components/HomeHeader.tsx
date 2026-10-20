import { Link } from "react-router-dom";
import { Menu, Search, ShoppingBag, ChevronDown } from "lucide-react";
import { useState } from "react";

import { getApplicationConfig } from "@wooly/shared/config/application";

const applicationConfig = getApplicationConfig();

const categories = [
  { name: "Flores", slug: "flores" },
  { name: "Peluches", slug: "peluches" },
  { name: "Papeles", slug: "papeles" },
  { name: "Cajas", slug: "cajas" },
  { name: "Cintas", slug: "cintas" },
  { name: "Globos", slug: "globos" },
  { name: "Accesorios", slug: "accesorios" },
  { name: "Hot Wheels", slug: "hotwheels" },
];

export default function HomeHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* LOGO */}
        <Link to="/" className="group">
          <img
            src={applicationConfig.assets.logoUrl}
            alt="Wooly Import"
            className="h-10 md:h-12 transition-transform group-hover:scale-105"
          />
        </Link>

        {/* NAV */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-bold tracking-wide text-slate-800">

          {/* CATÁLOGO CON DROPDOWN */}
          <div
            className="relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-[#1d8299] transition">
              Catálogo
              <ChevronDown size={16} />
            </button>

            {open && (
                <div className="absolute left-0 top-full pt-3">
                    <div className="w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 grid gap-2 animate-fadeIn">
                    {categories.map((cat) => (
                        <Link
                        key={cat.slug}
                        to={`/catalogo/categoria.html?cat=${cat.slug}`}
                        className="px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 hover:text-[#1d8299] transition"
                        >
                        {cat.name}
                        </Link>
                    ))}
                    </div>
                </div>
                )}
          </div>

            <a
            href="https://packs.woolyimports.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1d8299] transition"
            >
            Packs
            </a>

            <a
            href="https://preventas.woolyimports.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1d8299] transition"
            >
            Preventas
            </a>

            <a
            href="#howtobySection"
            className="hover:text-[#1d8299] transition"
            >
            Cómo comprar
            </a>
        </nav>

        {/* ACCIONES */}
        <div className="flex items-center gap-3">

          <button className="hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:text-[#1d8299] hover:border-[#1d8299] transition">
            <Search size={18} />
          </button>

          <Link
            to="/catalogo"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:text-[#f286be] hover:border-[#f286be] transition"
          >
            <ShoppingBag size={18} />
            <span className="absolute -top-1 -right-1 bg-[#f286be] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              0
            </span>
          </Link>

          <button className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-slate-200">
            <Menu size={20} />
          </button>

        </div>
      </div>

      {/* animación */}
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
