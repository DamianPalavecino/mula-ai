"use client";

import { useActionState } from "react";
import { guardarProtegido, type EstadoSetup } from "@/app/app/setup/actions";

export interface ValoresSetup {
  nombre: string;
  telefono: string;
  provincia: string;
  contactos: string;
  familiares: string;
}

const input =
  "w-full rounded-md border border-linea bg-fondo px-3 text-base text-tinta placeholder:text-suave focus:border-tinta focus:outline-none";

function Campo({
  id,
  label,
  ayuda,
  error,
  children,
}: {
  id: string;
  label: string;
  ayuda?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-tinta">
        {label}
      </label>
      {ayuda && <p className="mt-0.5 text-sm text-suave">{ayuda}</p>}
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 text-sm text-alerta">{error}</p>}
    </div>
  );
}

export default function AppSetupForm({
  valores,
  provincias,
}: {
  valores: ValoresSetup;
  provincias: string[];
}) {
  const [estado, accion, enviando] = useActionState<EstadoSetup, FormData>(guardarProtegido, {});
  const e = estado.errores ?? {};

  return (
    <form action={accion} className="flex flex-col gap-5">
      <Campo id="nombre" label="Nombre de la persona que protegés" error={e.nombre}>
        <input id="nombre" name="nombre" required maxLength={60} defaultValue={valores.nombre} placeholder="ej. Abuela Marta" className={`${input} h-11`} />
      </Campo>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="telefono" label="Su WhatsApp" error={e.telefono}>
          <input id="telefono" name="telefono" required inputMode="tel" maxLength={30} defaultValue={valores.telefono} placeholder="ej. 341 555-1234" className={`${input} h-11`} />
        </Campo>
        <Campo id="provincia" label="Provincia">
          <select id="provincia" name="provincia" defaultValue={valores.provincia} className={`${input} h-11 cursor-pointer`}>
            <option value="">Elegí una</option>
            {provincias.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <Campo
        id="contactos"
        label="Contactos de confianza"
        ayuda="Uno por línea. Sus mensajes no se analizan."
        error={e.contactos}
      >
        <textarea id="contactos" name="contactos" rows={3} defaultValue={valores.contactos} placeholder={"341 555-0000\n11 2222-3333"} className={`${input} py-2`} />
      </Campo>
      <Campo
        id="familiares"
        label="Familiares que reciben la alerta"
        ayuda="Uno por línea. Les avisamos si detectamos un intento de estafa."
        error={e.familiares}
      >
        <textarea id="familiares" name="familiares" rows={3} defaultValue={valores.familiares} placeholder="11 4444-5555" className={`${input} py-2`} />
      </Campo>
      {estado.error && (
        <p className="rounded-md border border-linea bg-panel p-3 text-sm text-texto">{estado.error}</p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="h-11 cursor-pointer self-start rounded-md bg-tinta px-6 text-base font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
