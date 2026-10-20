import { useEffect, useState } from "react";

const messages = [
  "🔥 Productos que se venden solos · Aumenta tu rotación",
  "💰 Compra por cajón · Gana más en cada venta",
  "🚀 Emprendedores ya están facturando más",
  "📦 Stock listo · Envíos a todo el Perú",
];

export default function TopBar() {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(false);

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        setAnimate(true);
      }, 200);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative z-[60] bg-gradient-to-r from-[#1d8299] to-[#30a5c0] text-white overflow-hidden">
      
      {/* glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_70%)] animate-pulse opacity-40 pointer-events-none" />

      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2.5 text-center relative z-10">
        
        <p
          className={`text-[12px] md:text-sm font-semibold tracking-wide transition-all duration-500 ${
            animate
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-3"
          }`}
        >
          {messages[index]}
        </p>

      </div>
    </div>
  );
}
