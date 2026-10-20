import { useEffect, useRef, useState } from "react";
import {
  buildApplicationWhatsAppUrl,
} from "@wooly/shared/config/application";

export default function CampaignHeroDiaPadre() {
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const COUNTDOWN_KEY = "promo_countdown_dia_padre";

    let countdownDate: Date;

    const savedDate = localStorage.getItem(COUNTDOWN_KEY);

    const parsedSavedDate =
      savedDate
        ? new Date(savedDate)
        : null;

    if (
      parsedSavedDate &&
      !Number.isNaN(
        parsedSavedDate.getTime(),
      )
    ) {
      countdownDate =
        parsedSavedDate;
    } else {
      countdownDate = new Date();
      countdownDate.setDate(countdownDate.getDate() + 10);

      localStorage.setItem(COUNTDOWN_KEY, countdownDate.toISOString());
    }

    const updateTimer = () => {
      const now = Date.now();
      const distance = countdownDate.getTime() - now;

      if (distance <= 0) {
        setTimeLeft({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
        });

        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24))
          .toString()
          .padStart(2, "0"),

        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          .toString()
          .padStart(2, "0"),

        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          .toString()
          .padStart(2, "0"),

        seconds: Math.floor((distance % (1000 * 60)) / 1000)
          .toString()
          .padStart(2, "0"),
      });
    };

    const interval = setInterval(updateTimer, 1000);

    updateTimer();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particlesArray: Particle[] = [];
    let animationFrameId: number;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedY = Math.random() * -0.5 - 0.2;
        this.speedX = (Math.random() - 0.5) * 0.3;

        const opacities = [0.1, 0.3, 0.5, 0.8];
        this.opacity = opacities[Math.floor(Math.random() * opacities.length)];
        this.color = `rgba(245, 176, 37, ${this.opacity})`;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;

        if (this.y < 0) {
          this.y = canvas!.height;
          this.x = Math.random() * canvas!.width;
        }
      }

      draw() {
        ctx!.fillStyle = this.color;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();

        if (this.size > 2 && this.opacity > 0.4) {
          ctx!.shadowBlur = 10;
          ctx!.shadowColor = "#f5b025";
        } else {
          ctx!.shadowBlur = 0;
        }
      }
    }

    const init = () => {
      particlesArray = [];
      const numberOfParticles = (canvas.width * canvas.height) / 12000;

      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

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

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b14] pb-12 pt-20 font-sans text-[#f8fafc] antialiased selection:bg-[#f5b025] selection:text-[#070b14] lg:pt-0">
      <div className="bg-pattern absolute inset-0 z-0 opacity-50"></div>

      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0"
      ></canvas>

      <div className="pointer-events-none absolute left-0 top-0 z-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1d8299]/10 blur-[120px]"></div>
      <div className="pointer-events-none absolute bottom-0 right-0 z-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-[#f5b025]/10 blur-[100px]"></div>
      <div className="pointer-events-none absolute right-1/4 top-1/2 z-0 h-[400px] w-[400px] rounded-full bg-white/5 blur-[80px]"></div>

      <div className="container relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="animate-fade-in-up flex flex-col space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="glass-panel flex items-center gap-2 rounded-full px-4 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f5b025] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f5b025]"></span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#f5b025]">
                  🔥 Temporada de alta rotación
                </span>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300">
                📦 Stock listo para campaña
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-medium text-gray-400 md:text-2xl">
                La campaña ya comenzó.
              </h2>

              <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
                Prepárate para <br />
                <span className="text-gradient-gold">
                  vender más este <br />
                  Día del Padre.
                </span>
              </h1>

              <p className="max-w-lg pt-4 text-lg font-light leading-relaxed text-gray-400 md:text-xl">
                Productos de alta rotación para emprendedores que quieren
                aprovechar esta campaña y convertirla en más ventas.
              </p>
            </div>

            <div
              className="space-y-3 pt-2"
              data-aos="zoom-in"
              data-aos-delay="250"
            >
              <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
                ⏰ La campaña no espera
              </p>

              <div className="flex gap-4">
                {[
                  { label: "Días", value: timeLeft.days, color: "text-white" },
                  {
                    label: "Horas",
                    value: timeLeft.hours,
                    color: "text-white",
                  },
                  {
                    label: "Min",
                    value: timeLeft.minutes,
                    color: "text-white",
                  },
                  {
                    label: "Seg",
                    value: timeLeft.seconds,
                    color: "text-[#f5b025]",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="glass-panel flex h-20 w-20 flex-col items-center justify-center rounded-2xl md:h-24 md:w-24"
                  >
                    <span
                      className={`text-3xl font-bold md:text-4xl ${item.color}`}
                    >
                      {item.value}
                    </span>
                    <span
                      className={`mt-1 text-xs uppercase tracking-wide ${
                        item.color === "text-white"
                          ? "text-gray-400"
                          : "text-[#f5b025]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="flex flex-col gap-4 pt-4 sm:flex-row"
              data-aos="fade-up"
              data-aos-delay="350"
            >
              <button
                onClick={() => {
                  window.location.href = "/catalogo?cpg=dia-padre";
                }}
                className="btn-premium flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5b025] to-[#d49615] px-8 py-4 text-lg font-bold text-[#070b14] shadow-[0_0_20px_rgba(245,176,37,0.3)] hover:shadow-[0_0_30px_rgba(245,176,37,0.5)]"
              >
                Ver productos de campaña
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  ></path>
                </svg>
              </button>

              <button
                onClick={() =>
                  window.open(
                    buildApplicationWhatsAppUrl(
                      "Hola Wooly, quiero información para comprar por mayor",
                    ),
                    "_blank",
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-8 py-4 text-lg font-semibold text-white shadow-[0_10px_30px_rgba(37,211,102,0.35)] transition-all duration-300 hover:bg-[#1EAD54] hover:shadow-[0_12px_35px_rgba(37,211,102,0.45)]"
              >
                Asesora WhatsApp
              </button>
            </div>

            <div className="flex items-center gap-6 border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg
                  className="h-5 w-5 text-[#1d8299]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Envíos a todo el Perú
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg
                  className="h-5 w-5 text-[#1d8299]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                Productos de alta rotación
              </div>
            </div>
          </div>

          <div
            className="relative mt-10 flex h-[500px] w-full items-center justify-center lg:mt-0 lg:h-[700px]"
            data-aos="zoom-in"
            data-aos-delay="200"
          >
            <div className="relative flex h-full w-full max-w-lg items-center justify-center">
              <div className="animate-pulse-glow absolute z-0 h-3/4 w-3/4 rounded-full bg-[#f5b025]/20 blur-[80px]"></div>

              <div
                className="balloon animate-float-slow absolute right-[10%] top-[10%] h-24 w-24"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #475569, #0f172a)",
                }}
              >
                <div className="absolute bottom-[-40px] left-1/2 h-10 w-0.5 bg-white/20"></div>
              </div>

              <div
                className="balloon animate-float-delayed absolute left-[5%] top-[25%] h-16 w-16"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #c48b1a, #452c00)",
                }}
              >
                <div className="absolute bottom-[-30px] left-1/2 h-8 w-0.5 bg-white/20"></div>
              </div>

              <div className="premium-box-container animate-float-slow relative z-10">
                <div className="absolute -bottom-10 left-1/2 h-12 w-64 -translate-x-1/2 rounded-full bg-black/60 blur-xl"></div>

                <div className="absolute left-1/2 top-[-50px] z-[11] h-48 w-48 -translate-x-1/2 rounded-full bg-[#f5b025]/40 blur-2xl"></div>

                <div className="premium-box flex items-center justify-center">
                  <div className="absolute bottom-4 left-4 h-24 w-16 -rotate-12 transform rounded-md bg-black/40 blur-[2px]"></div>
                  <div className="absolute bottom-4 right-8 h-20 w-20 rounded-full bg-black/40 blur-[2px]"></div>
                  <div className="box-glow"></div>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded border border-[#f5b025]/30 bg-black/50 px-4 py-1 text-[10px] uppercase tracking-widest text-[#f5b025] backdrop-blur-sm">
                    Wooly Exclusive
                  </div>
                </div>

                <div className="premium-box-lid">
                  <div className="box-ribbon-v"></div>
                  <div className="box-ribbon-h"></div>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold tracking-widest text-white/10">
                    W
                  </div>
                </div>
              </div>

              <div className="glass-panel animate-float-delayed absolute bottom-[10%] right-[15%] z-20 flex h-20 w-20 rotate-12 items-center justify-center rounded-xl">
                <span className="text-3xl">🥃</span>
              </div>

              <div className="glass-panel animate-float-slow absolute bottom-[20%] left-[10%] z-20 flex h-16 w-16 items-center justify-center rounded-full">
                <span className="text-2xl">⌚</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
