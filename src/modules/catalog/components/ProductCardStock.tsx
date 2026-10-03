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
  let stockState = "";
  let StockIcon:
    typeof CheckCircle =
      CheckCircle;

  if (
    normalizedStatus ===
    "preventa"
  ) {
    stockText = "Preventa";
    stockState = "is-preorder";
    StockIcon = Clock;
  } else if (
    normalizedStatus ===
    "agotado"
  ) {
    stockText = "Agotado";
    stockState = "is-soldout";
    StockIcon = XCircle;
  } else if (
    !price ||
    price <= 0 ||
    stock == null ||
    stock <= 0
  ) {
    stockText = "No disponible";
    stockState = "is-unavailable";
    StockIcon = XCircle;
  } else if (
    stock <= 12
  ) {
    stockText =
      `Últimas ${stock}`;

    stockState = "is-critical";
    StockIcon =
      AlertTriangle;
  } else if (
    stock <= 36
  ) {
    stockText =
      "Stock limitado";

    stockState = "is-limited";
    StockIcon =
      AlertTriangle;
  } else if (
    stock <= 50
  ) {
    stockText =
      "Disponible";

    stockState = "is-available";
    StockIcon =
      CheckCircle;
  } else {
    stockText =
      "Alto stock";

    stockState = "is-high";
    StockIcon =
      CheckCircle;
  }

  return (
    <div
      className={[
        "card-product-stock",
        stockState,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <StockIcon aria-hidden="true" />
      <span>{stockText}</span>
    </div>
  );
}
