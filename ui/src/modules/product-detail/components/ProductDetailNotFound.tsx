import {
  ArrowLeft,
} from "lucide-react";

interface ProductDetailNotFoundProps {
  onBack: () => void;
}

export function ProductDetailNotFound({
  onBack,
}: ProductDetailNotFoundProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground font-black text-lg">
        Producto no encontrado
      </p>

      <button
        onClick={onBack}
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground active:scale-95"
        aria-label="Volver"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
