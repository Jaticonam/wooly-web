import { useEffect, useRef, useState } from "react";
import {
  loadWoolyImageManifest,
  matchProductCodeImages,
  type IndexedMediaAsset,
  type ProductCodeImage,
} from "./WoolyProductCodeImages";

export default function ProductCodeImageMatches({ code }: { code: string }) {
  const [result, setResult] = useState<{ code: string; images: ProductCodeImage[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const manifest = useRef<IndexedMediaAsset[] | null>(null);
  const pending = useRef<Promise<IndexedMediaAsset[]> | null>(null);
  const current = code.trim().toUpperCase();
  const valid = /^[A-Z0-9-]{2,80}$/.test(current);

  useEffect(() => {
    if (!valid) {
      setLoading(false);
      setError("");
      setResult(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    setResult(null);
    const timer = window.setTimeout(async () => {
      try {
        if (!manifest.current) {
          if (!pending.current) {
            pending.current = loadWoolyImageManifest()
              .then((items) => {
                manifest.current = items;
                return items;
              })
              .finally(() => { pending.current = null; });
          }
          await pending.current;
        }
        if (active && manifest.current) {
          setResult({ code: current, images: matchProductCodeImages(manifest.current, current) });
        }
      } catch {
        if (active) setError("No fue posible consultar las fotografías disponibles.");
      } finally {
        if (active) setLoading(false);
      }
    }, 450);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [current, valid]);

  if (!current) return null;
  return (
    <div className="create-product-panel__imageMatches" aria-live="polite">
      <span className="create-product-panel__imageHeading">Fotografías del código</span>
      {!valid ? (
        <span className="create-product-panel__imageNote">Ingresa un código válido para buscar fotografías.</span>
      ) : loading ? (
        <span className="create-product-panel__imageNote" role="status">Buscando imágenes en CORE…</span>
      ) : error ? (
        <span className="create-product-panel__imageNote" role="status">{error}</span>
      ) : result?.code === current && result.images.length ? (
        <>
          <div className="create-product-panel__imageGrid">
            {result.images.map((image) => (
              <div className="create-product-panel__imageTile" key={image.id}>
                <img src={image.url} alt={`Fotografía ${image.position} del producto ${current}`} loading="lazy" />
                <span>{image.isPrimary ? "Imagen principal" : `Imagen ${image.position}`}</span>
              </div>
            ))}
          </div>
          <span className="create-product-panel__imageNote">
            {result.images.length} fotografía(s) disponibles. Consulta de solo lectura; no se vinculan al crear el producto.
          </span>
        </>
      ) : (
        <span className="create-product-panel__imageNote" role="status">
          No hay fotografías registradas para este código en CORE.
        </span>
      )}
    </div>
  );
}
