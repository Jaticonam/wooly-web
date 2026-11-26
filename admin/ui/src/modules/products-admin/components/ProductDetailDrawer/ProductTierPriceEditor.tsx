import { useRef, useState, type FormEvent } from "react";
import { z } from "zod";

import {
  ProductPriceFields,
  quantities,
} from "../CreateProductPanel/ProductCommercialFields";

import {
  loadAdminProductPricing,
  updateAdminProductTierPrices,
} from "@/modules/admin-auth/services/AdminAuthClient";

import "../CreateProductPanel/CreateProductPanel.css";

const tierSchema = z.object({
  minimumQuantity: z.number().int().positive(),
  unitPrice: z.number().positive().max(9999999999.99),
});

const pricingSchema = z.object({
  success: z.literal(true),
  data: z.object({
    priceList: z.object({
      id: z.literal("a8960b95-a2a6-4924-94d7-698059c6457e"),
      code: z.literal("WOOLY-PEN-TEST"),
      name: z.string(),
      currency: z.literal("PEN"),
    }),
    tiers: z.array(tierSchema),
    offer: z.object({
      unitPrice: z.number(),
      startsAt: z.string().nullable(),
      endsAt: z.string().nullable(),
      status: z.string(),
    }).nullable(),
  }),
});

type Pricing = z.infer<typeof pricingSchema>["data"];

interface Props {
  brandId: string;
  productId: string;
  onSaved: () => Promise<void>;
}

function parsePricing(value: unknown): Pricing {
  const pricing = pricingSchema.parse(value).data;
  const tiers = [...pricing.tiers].sort(
    (a, b) => a.minimumQuantity - b.minimumQuantity,
  );

  const ids = tiers.map(tier => tier.minimumQuantity);

  if (
    !ids.includes(1) ||
    new Set(ids).size !== ids.length ||
    ids.some(id => !(quantities as readonly number[]).includes(id))
  ) {
    throw new Error(
      "La estructura de precios no es compatible con este editor.",
    );
  }

  return { ...pricing, tiers };
}

const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

export default function ProductTierPriceEditor({
  brandId,
  productId,
  onSaved,
}: Props) {
  const [snapshot, setSnapshot] = useState<Pricing | null>(null);
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const pending = useRef(false);

  async function start() {
    if (pending.current) return;

    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const data = parsePricing(
        await loadAdminProductPricing(brandId, productId),
      );

      setPrices(Object.fromEntries(
        data.tiers.map(tier => [
          tier.minimumQuantity,
          String(tier.unitPrice),
        ]),
      ));

      setSnapshot(data);
    } catch (cause) {
      setError(cause instanceof Error
        ? cause.message
        : "No se pudieron cargar los precios.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!snapshot || pending.current) return;

    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");

    let attempted = false;
    let confirmed = false;

    try {
      const tiers = snapshot.tiers.map(tier => {
        const value = prices[tier.minimumQuantity]?.trim() ?? "";
        const unitPrice = Number(value);

        if (
          !/^\d+(?:\.\d{1,2})?$/.test(value) ||
          !Number.isFinite(unitPrice) ||
          unitPrice <= 0 ||
          unitPrice > 9999999999.99
        ) {
          throw new Error(
            `Precio invalido para ${tier.minimumQuantity} unidades.`,
          );
        }

        return {
          minimumQuantity: tier.minimumQuantity,
          unitPrice,
        };
      });

      if (equal(tiers, snapshot.tiers)) {
        setMessage("No hay cambios de precios.");
        return;
      }

      const current = parsePricing(
        await loadAdminProductPricing(brandId, productId),
      );

      if (
        !equal(current.priceList, snapshot.priceList) ||
        !equal(current.tiers, snapshot.tiers) ||
        !equal(current.offer, snapshot.offer)
      ) {
        setSnapshot(null);
        throw new Error(
          "Los precios cambiaron. Vuelve a abrir el editor.",
        );
      }

      const base = tiers.find(tier => tier.minimumQuantity === 1)!;

      if (
        current.offer?.status === "ACTIVE" &&
        current.offer.unitPrice >= base.unitPrice
      ) {
        throw new Error(
          "El precio base debe ser superior a la oferta activa.",
        );
      }

      attempted = true;

      const saved = parsePricing(
        await updateAdminProductTierPrices(
          brandId,
          productId,
          {
            tiers,
            expectedTiers: snapshot.tiers,
          },
        ),
      );

      if (
        !equal(saved.priceList, snapshot.priceList) ||
        !equal(saved.tiers, tiers) ||
        !equal(saved.offer, snapshot.offer)
      ) {
        throw new Error(
          "CORE no confirmo el resultado esperado.",
        );
      }

      confirmed = true;
      setSnapshot(null);
      setMessage("Precios confirmados por JUNG CORE TEST.");

      await onSaved();
    } catch (cause) {
      const detail = cause instanceof Error
        ? cause.message
        : "Error inesperado.";

      if (attempted) {
        setSnapshot(null);
        setError(confirmed
          ? `Guardado confirmado. Actualiza el listado. ${detail}`
          : `Resultado no confirmado. Reabre el editor. ${detail}`);
      } else {
        setError(detail);
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <section
      className="create-product-panel"
      aria-label="Precios escalonados"
    >
      {error && (
        <p role="alert" className="create-product-panel__error">
          {error}
        </p>
      )}

      {message && <p role="status">{message}</p>}

      {!snapshot ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void start()}
        >
          {busy ? "Cargando precios..." : "Editar precios"}
        </button>
      ) : (
        <form
          className="create-product-panel"
          onSubmit={save}
          aria-busy={busy}
        >
          <fieldset
            className="create-product-panel__section"
            disabled={busy}
          >
            <legend>Precios comerciales</legend>

            <p>
              {snapshot.priceList.name} - {snapshot.priceList.currency}
            </p>

            <ProductPriceFields
              currency={snapshot.priceList.currency}
              prices={prices}
              setPrices={setPrices}
              editableQuantities={
                snapshot.tiers.map(tier => tier.minimumQuantity)
              }
            />

            <p className="create-product-panel__sectionHelp">
              Solo se modifican importes de tramos existentes.
              Los tramos vacios permanecen deshabilitados.
            </p>

            <p>
              Oferta: {snapshot.offer
                ? `S/ ${snapshot.offer.unitPrice.toFixed(2)}`
                : "Sin oferta"}
              {" - Solo lectura"}
            </p>
          </fieldset>

          <div className="create-product-panel__actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setSnapshot(null);
                setError("");
                setMessage("");
              }}
            >
              Cancelar precios
            </button>

            <button type="submit" disabled={busy}>
              {busy ? "Guardando precios..." : "Guardar precios"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}