"use client";

import MeEstafaronForm from "@/components/MeEstafaronForm";
import { IconoAlerta, IconoX } from "@/components/MeEstafaronIconos";
import s from "@/components/MeEstafaronClases";

// Sección "Me estafaron" del dashboard: autocontenida (flujo, validaciones, ejemplo de un clic y
// resultado). Se monta en una página, un panel o un drawer; usa /app/api/extraer y /app/api/registrar.
//
//   <MeEstafaronPanel />                         en una página o columna
//   <MeEstafaronPanel onCerrar={() => …} />      en un drawer: muestra la X
export default function MeEstafaronPanel({
  onCerrar,
  titulo = true,
  className = "",
}: {
  onCerrar?: () => void;
  /** false si el contenedor ya pone su propio título. */
  titulo?: boolean;
  className?: string;
}) {
  return (
    <section className={`${s.panel} flex flex-col gap-6 ${className}`} aria-labelledby="me-estafaron-titulo">
      {titulo ? (
        <header className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--me-danger-soft)] text-[var(--me-danger)]">
            <IconoAlerta className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="me-estafaron-titulo" className="text-2xl leading-tight font-bold tracking-tight">
              Me estafaron
            </h2>
            <p className="text-sm text-[var(--me-muted)]">Frená la plata en minutos.</p>
          </div>
          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className={`${s.press} flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--me-muted)] hover:bg-[var(--me-paper-3)] hover:text-[var(--me-ink)]`}
            >
              <IconoX className="h-5 w-5" />
            </button>
          )}
        </header>
      ) : (
        <h2 id="me-estafaron-titulo" className="sr-only">
          Me estafaron
        </h2>
      )}
      <MeEstafaronForm />
    </section>
  );
}
