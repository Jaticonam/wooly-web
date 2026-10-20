import { useEffect } from "react";

type ExternalRedirectProps = {
  to: string;
};

/*
 * Redirección de documento completo hacia otra aplicación
 * del mismo dominio (por ejemplo, Wooly Admin en /admin).
 * Un <Navigate> de React Router no puede cruzar aplicaciones.
 */
export default function ExternalRedirect({
  to,
}: ExternalRedirectProps) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] items-center justify-center px-6 text-center text-sm text-slate-500"
    >
      Redirigiendo…{" "}
      <a className="ml-1 underline" href={to}>
        Continuar
      </a>
    </div>
  );
}
