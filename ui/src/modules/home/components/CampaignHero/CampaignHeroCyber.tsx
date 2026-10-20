import { useEffect, useRef, useState } from "react";
import {
  buildApplicationWhatsAppUrl,
} from "@wooly/shared/config/application";

type CampaignTimerStatus =
  | "red"
  | "yellow"
  | "green";

interface CampaignTimer {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  status: CampaignTimerStatus;
}

type CampaignTimers = Record<
  string,
  CampaignTimer
>;

export default function App() {
  const [timers, setTimers] = useState<CampaignTimers>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Fechas objetivo de cada campaña
    const targetDates = {
      novia: new Date("2026-08-01T00:00:00").getTime(),
      flores: new Date("2026-09-21T00:00:00").getTime(),
      hotwheels: new Date("2026-09-30T00:00:00").getTime(),
      novio: new Date("2026-10-03T00:00:00").getTime(),
    };

    const updateTimers = () => {
      const now = new Date().getTime();
      const newTimers: CampaignTimers = {};

      for (const [key, target] of Object.entries(targetDates)) {
        const distance = target - now;

        if (distance <= 0) {
          newTimers[key] = { days: "00", hours: "00", minutes: "00", seconds: "00", status: "red" };
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          
          // Lógica del Semáforo
          let status: CampaignTimerStatus = "green";
          if (days <= 10) status = "red";
          else if (days <= 20) status = "yellow";

          newTimers[key] = {
            days: days.toString().padStart(2, "0"),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, "0"),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, "0"),
            seconds: Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, "0"),
            status: status,
          };
        }
      }
      setTimers(newTimers);
    };

    const interval = setInterval(updateTimers, 1000);
    updateTimers();
    return () => clearInterval(interval);
  }, []);

  // Lógica del Canvas (Partículas festivas multicolores)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const activeCanvas: HTMLCanvasElement = canvas;
    const activeContext: CanvasRenderingContext2D = ctx;

    let particlesArray: Particle[] = [];
    let animationFrameId = 0;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      color: string;
      constructor() {
        this.x = Math.random() * activeCanvas.width;
        this.y = Math.random() * activeCanvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedY = Math.random() * -0.5 - 0.2;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.5 + 0.2;
        
        // Colores que representan las 4 campañas: Rosa (Novia), Amarillo (Flores), Azul/Naranja (HotWheels/Novio)
        const colors = [
          `rgba(244, 114, 182, ${this.opacity})`, // Rosa
          `rgba(250, 204, 21, ${this.opacity})`,  // Amarillo
          `rgba(59, 130, 246, ${this.opacity})`,  // Azul
          `rgba(249, 115, 22, ${this.opacity})`   // Naranja
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        if (this.y < 0) {
          this.y = activeCanvas.height;
          this.x = Math.random() * activeCanvas.width;
        }
      }

      draw() {
        activeContext.fillStyle = this.color;
        activeContext.beginPath();
        activeContext.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        activeContext.fill();
        activeContext.shadowBlur = 5;
        activeContext.shadowColor = this.color;
      }
    }

    const init = () => {
      particlesArray = [];
      const numberOfParticles = (activeCanvas.width * activeCanvas.height) / 10000;
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    };

    const resizeCanvas = () => {
      activeCanvas.width = window.innerWidth;
      activeCanvas.height = window.innerHeight;
      init();
    };

    const animate = () => {
      activeContext.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Datos de las campañas
  const campaigns = [
    {
      id: "novia",
      title: "Día de la Novia",
      date: "1 de Agosto",
      color: "from-pink-500 to-rose-400",
      borderColor: "border-pink-500/30",
      bgLight: "bg-pink-500/10",
      icon: "💍",
      desc: "Anillos, collares y detalles románticos."
    },
    {
      id: "flores",
      title: "Flores Amarillas",
      date: "21 de Septiembre",
      color: "from-yellow-400 to-amber-500",
      borderColor: "border-yellow-400/30",
      bgLight: "bg-yellow-400/10",
      icon: "🌻",
      desc: "Regalos solares y vibrantes."
    },
    {
      id: "hotwheels",
      title: "Hot Wheels Fans",
      date: "30 de Septiembre",
      color: "from-orange-500 to-red-600",
      borderColor: "border-orange-500/30",
      bgLight: "bg-orange-500/10",
      icon: "🏎️",
      desc: "Coleccionables y regalos fierreros."
    },
    {
      id: "novio",
      title: "Día del Novio",
      date: "3 de Octubre",
      color: "from-blue-500 to-indigo-600",
      borderColor: "border-blue-500/30",
      bgLight: "bg-blue-500/10",
      icon: "🎁",
      desc: "Relojes, accesorios y tecnología."
    }
  ];

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#09090b] pt-24 pb-16 lg:pt-0 selection:bg-purple-500 selection:text-white font-sans antialiased text-slate-100">
      
      <style>{`
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .text-gradient-multi { 
          background: linear-gradient(90deg, #f472b6, #fbbf24, #f97316, #60a5fa); 
          background-size: 300% 300%;
          animation: gradient-shift 8s ease infinite;
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent; 
        }
        
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>

      {/* Fondos */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/40 via-[#09090b] to-[#09090b] opacity-80 z-0"></div>
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none"></canvas>

      {/* Luces decorativas */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-pink-600/10 rounded-full blur-[120px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-yellow-500/10 rounded-full blur-[120px] z-0 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-blue-600/5 rounded-full blur-[150px] z-0 pointer-events-none"></div>

      <div className="container relative z-10 mx-auto px-6 max-w-7xl flex flex-col items-center">
        
        {/* Cabecera Central */}
        <div className="text-center max-w-4xl mx-auto space-y-6 mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-3">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
              <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">
                Megacampaña de Temporada
              </span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Multiplica tus ventas en <br className="hidden md:block" />
            <span className="text-gradient-multi">4 fechas clave.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
            Stock unificado y productos de alta rotación para las festividades más importantes del semestre. Prepárate hoy y asegura tus ganancias.
          </p>

          <div className="flex justify-center mt-8">
            <div className="bg-white/5 border border-white/10 rounded-full px-6 py-3 flex items-center gap-3 shadow-lg">
              <span className="text-xl">🚚</span>
              <span className="text-sm md:text-base font-semibold text-slate-200 tracking-wide">
                Envíos a todo el Perú: Lunes, Miércoles y Viernes
              </span>
            </div>
          </div>
        </div>

        {/* Tarjetas de las 4 Campañas (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-12">
          {campaigns.map((camp, index) => (
            <div 
              key={camp.id} 
              className={`glass-card relative overflow-hidden rounded-2xl border ${camp.borderColor} p-6 flex flex-col group hover:-translate-y-2 transition-all duration-300 shadow-lg hover:shadow-2xl`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Brillo de fondo en hover */}
              <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[40px] opacity-0 group-hover:opacity-50 transition-opacity duration-500 bg-gradient-to-br ${camp.color}`}></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-inner ${camp.bgLight} border border-white/5`}>
                    {camp.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black/40 px-2 py-1 rounded text-slate-300">
                    {camp.date}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{camp.title}</h3>
                <p className="text-sm text-slate-400 flex-grow">{camp.desc}</p>
                
                <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                  <div className={`h-full bg-gradient-to-r ${camp.color} w-1/3 group-hover:w-full transition-all duration-500`}></div>
                </div>

                {timers[camp.id] && (
                  <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Cierra en:</span>
                      
                      {/* Luces del Semáforo */}
                      <div className="flex gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                        <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${timers[camp.id].status === 'red' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-red-500/20'}`}></div>
                        <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${timers[camp.id].status === 'yellow' ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]' : 'bg-yellow-400/20'}`}></div>
                        <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${timers[camp.id].status === 'green' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-green-500/20'}`}></div>
                      </div>
                    </div>
                    
                    {/* Contadores */}
                    <div className="flex gap-1 justify-between">
                      {[
                        { value: timers[camp.id].days, label: "DÍAS" },
                        { value: timers[camp.id].hours, label: "HRS" },
                        { value: timers[camp.id].minutes, label: "MIN" },
                        { value: timers[camp.id].seconds, label: "SEG" }
                      ].map((t, i) => (
                        <div key={i} className={`flex-1 flex flex-col items-center py-1.5 rounded-lg bg-black/30 border border-white/5 transition-colors duration-300
                          ${timers[camp.id].status === 'red' ? 'text-red-400 bg-red-500/5' : ''}
                          ${timers[camp.id].status === 'yellow' ? 'text-yellow-400 bg-yellow-500/5' : ''}
                          ${timers[camp.id].status === 'green' ? 'text-green-400 bg-green-500/5' : ''}
                          ${t.label === 'SEG' ? 'font-light' : 'font-bold'}
                        `}>
                          <span className="text-sm md:text-base">{t.value}</span>
                          <span className="text-[8px] opacity-60 tracking-wider">{t.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botones de Acción Globales */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl justify-center z-10">
          <button
            onClick={() => (window.location.href = "/catalogo")}
            className="flex-1 relative overflow-hidden bg-white text-black px-8 py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <span className="relative z-10 flex items-center gap-2">
              Ver catálogo
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </span>
          </button>

          <button
            onClick={() =>
              window.open(
                buildApplicationWhatsAppUrl(
                  "Hola Wooly, quiero información sobre el catálogo multicampaña (Novios, Flores, HotWheels)",
                ),
                "_blank"
              )
            }
            className="flex-1 bg-[#25D366] hover:bg-[#1EAD54] text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-[0_10px_30px_rgba(37,211,102,0.3)] hover:shadow-[0_10px_40px_rgba(37,211,102,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            Asesoria Whatsapp
          </button>
        </div>

      </div>
    </main>
  );
}
