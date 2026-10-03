import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface ProductCardStockProps {
  stock:
    number |
    null |
    undefined;

  price:
    number;

  status?:
    string;
}

export function ProductCardStock({
  stock,
  price,
  status,
}: ProductCardStockProps) {
  const normalizedStatus =
    String(status ?? "")
      .trim()
      .toLowerCase();

  let stockText = "";
  let stockColorClass = "";
  let StockIcon:
    typeof CheckCircle =
      CheckCircle;

  /*
   * El estado comercial tiene prioridad
   * sobre el número almacenado en stock.
   */
  if (
    normalizedStatus ===
    "preventa"
  ) {
    stockText = "Preventa";
    stockColorClass =
      "bg-green-100 text-green-700";
    StockIcon = Clock;
  } else if (
    normalizedStatus ===
    "agotado"
  ) {
    stockText = "Agotado";
    stockColorClass =
      "bg-destructive/10 text-destructive";
    StockIcon = XCircle;
  } else if (
    !price ||
    price <= 0 ||
    stock == null ||
    stock <= 0
  ) {
    stockText = "No disponible";
    stockColorClass =
      "bg-muted text-muted-foreground";
    StockIcon = XCircle;
  } else if (
    stock <= 12
  ) {
    stockText =
      `Últimas ${stock}`;

    stockColorClass =
      "bg-red-100 text-red-600";

    StockIcon =
      AlertTriangle;
  } else if (
    stock <= 36
  ) {
    stockText =
      "Stock limitado";

    stockColorClass =
      "bg-orange-100 text-orange-600";

    StockIcon =
      AlertTriangle;
  } else if (
    stock <= 50
  ) {
    stockText =
      "Disponible";

    stockColorClass =
      "bg-green-100 text-green-700";

    StockIcon =
      CheckCircle;
  } else {
    stockText =
      "Alto stock";

    stockColorClass =
      "bg-emerald-100 text-emerald-700";

    StockIcon =
      CheckCircle;
  }

  return (
    <div
      className={[
        "mx-auto mt-2 flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black md:text-[11px]",
        stockColorClass,
      ].join(" ")}
    >
      <StockIcon
        className="h-3.5 w-3.5"
      />

      <span>
        {stockText}
      </span>
    </div>
  );
}
