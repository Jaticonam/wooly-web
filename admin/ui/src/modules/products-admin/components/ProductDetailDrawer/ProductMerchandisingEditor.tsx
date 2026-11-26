import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  loadAdminProductDetail,
  loadBrandAdminConfiguration,
  updateAdminProductMerchandising,
} from "@/modules/admin-auth/services/AdminAuthClient";

type Props = {
  brandId: string;
  productId: string;
  onSaved: () => Promise<void>;
};

const merchandisingSchema = z.object({
  priority: z.number().int().nonnegative(),
  badges: z.array(z.object({
    code: z.string().min(1),
  })),
}).nullable();

const envelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string(),
    merchandising: merchandisingSchema,
  }),
});

type Merchandising = {
  priority: number;
  manualBadgeCodes: string[];
};

type Badge = {
  code: string;
  label: string;
};

function decode(value: unknown, productId: string) {
  const result = envelopeSchema.parse(value);

  if (result.data.id !== productId) {
    throw new Error("Producto incorrecto.");
  }

  const item = result.data.merchandising;

  return item === null ? null : {
    priority: item.priority,
    manualBadgeCodes: item.badges
      .map(badge => badge.code)
      .sort(),
  };
}

const same = (
  left: Merchandising | null,
  right: Merchandising | null,
) => JSON.stringify(left) === JSON.stringify(right);

export default function ProductMerchandisingEditor({
  brandId,
  productId,
  onSaved,
}: Props) {
  const [baseline, setBaseline] =
    useState<Merchandising | null | undefined>(undefined);

  const [priority, setPriority] = useState("0");
  const [codes, setCodes] = useState<string[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const submitting = useRef(false);

  async function read() {
    return decode(
      await loadAdminProductDetail(brandId, productId),
      productId,
    );
  }

  useEffect(() => {
    let active = true;

    setBaseline(undefined);
    setError("");
    setMessage("");

    Promise.all([
      loadAdminProductDetail(brandId, productId),
      loadBrandAdminConfiguration(brandId),
    ]).then(([detail, config]) => {
      if (!config.success ||
          config.data.brandId !== brandId) {
        throw new Error("Configuracion de marca invalida.");
      }

      const current = decode(detail, productId);

      const options = config.data.badgeDefinitions
        .filter(badge => badge.status === "ACTIVE")
        .map(badge => ({
          code: badge.code.toLowerCase(),
          label: badge.label,
        }));

      if (active) {
        setBaseline(current);
        setPriority(String(current?.priority ?? 0));
        setCodes(current?.manualBadgeCodes ?? []);
        setBadges(options);
      }
    }).catch(err => {
      if (active) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar merchandising.",
        );
      }
    });

    return () => { active = false; };
  }, [brandId, productId]);

  async function save() {
    if (submitting.current || baseline === undefined) return;

    setError("");
    setMessage("");

    const number = Number(priority);

    if (
      !priority.trim() ||
      !Number.isInteger(number) ||
      number < 0 ||
      number > 2147483647
    ) {
      setError("La prioridad debe ser un entero no negativo.");
      return;
    }

    const next: Merchandising = {
      priority: number,
      manualBadgeCodes: [...new Set(codes)].sort(),
    };

    if (baseline !== null && same(baseline, next)) {
      setMessage("No hay cambios.");
      return;
    }

    submitting.current = true;
    setBusy(true);

    try {
      const current = await read();

      if (!same(current, baseline)) {
        throw new Error(
          "El registro cambio. Cierra y vuelve a abrir el editor.",
        );
      }

      const saved = decode(
        await updateAdminProductMerchandising(
          brandId,
          productId,
          next,
        ),
        productId,
      );

      if (!same(saved, next)) {
        throw new Error(
          "Respuesta de escritura no verificable. Recarga el producto.",
        );
      }

      setBaseline(saved);
      setMessage("Merchandising guardado.");

      try {
        await onSaved();
      } catch {
        setError("Guardado en CORE. Recarga el panel.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const available = [
    ...badges,
    ...codes.filter(
      code => !badges.some(badge => badge.code === code),
    ).map(code => ({
      code,
      label: code + " (existente)",
    })),
  ];

  return (
    <section
      id="product-merchandising-editor"
      className="space-y-3 rounded-lg border p-4"
    >
      <h3 className="font-semibold">
        Merchandising comercial
      </h3>

      {baseline === null && (
        <p className="text-sm text-amber-700">
          Falta registrar merchandising para publicar.
        </p>
      )}

      <label className="block text-sm">
        Prioridad comercial
        <input
          type="number"
          min="0"
          step="1"
          value={priority}
          disabled={busy || baseline === undefined}
          onChange={event => setPriority(event.target.value)}
          className="mt-1 block w-full rounded border p-2"
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          Etiquetas comerciales
        </p>

        {available.length === 0 && (
          <p className="text-sm">Sin etiquetas disponibles.</p>
        )}

        {available.map(badge => (
          <label
            key={badge.code}
            className="flex items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              disabled={busy || baseline === undefined}
              checked={codes.includes(badge.code)}
              onChange={event => setCodes(previous =>
                event.target.checked
                  ? [...new Set([...previous, badge.code])]
                  : previous.filter(code => code !== badge.code)
              )}
            />
            {badge.label}
          </label>
        ))}
      </div>

      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      <button
        type="button"
        disabled={busy || baseline === undefined}
        onClick={() => void save()}
        className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Guardando..." : "Guardar merchandising"}
      </button>
    </section>
  );
}