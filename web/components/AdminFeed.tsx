"use client";

import { useEffect, useState } from "react";
import type { Alerta } from "@/lib/tipos";
import { labelModalidad } from "@/lib/tipos";
import { fechaRelativa } from "@/lib/formato";
import { partesNegrita } from "@/lib/simulador";

// Feed de alertas del panel admin: las recibe por props (el polling vive en AdminRed).
export default function AdminFeed({
  alertas,
  nuevas,
  onSeleccionar,
  seleccionada,
  enVivo,
}: {
  alertas: Alerta[];
  nuevas: number[];
  onSeleccionar: (alerta: Alerta) => void;
  seleccionada: number | null;
  enVivo: boolean;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const reloj = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(reloj);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-linea bg-fondo">
      <div className="flex items-center justify-between border-b border-linea px-4 py-3">
        <h2 className="text-base font-semibold text-tinta">Alertas</h2>
        <span className="flex items-center gap-2 text-sm text-suave">
          <span
            className={`h-2 w-2 rounded-full ${enVivo ? "bg-emerald-600" : "bg-linea"}`}
            aria-hidden
          />
          {enVivo ? "En vivo" : "Sin conexión"}
        </span>
      </div>

      <ul className="flex-1 divide-y divide-linea overflow-y-auto">
        {alertas.length === 0 && (
          <li className="px-4 py-6 text-sm leading-relaxed text-suave">
            Todavía no hay alertas. Cuando Mula AI detecte una estafa, aparece acá en
            segundos.
          </li>
        )}
        {alertas.map((a) => {
          const esNueva = nuevas.includes(a.id);
          const riesgoAlto = (a.riesgo ?? 0) >= 70;
          const clickeable = (a.entidad_ids?.length ?? 0) > 0;
          const contenido = (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-semibold text-tinta">
                  {labelModalidad(a.modalidad)}
                </p>
                {a.riesgo != null && (
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-sm font-semibold ${
                      riesgoAlto ? "bg-alerta text-white" : "bg-panel text-tinta"
                    }`}
                  >
                    Riesgo {a.riesgo}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-suave">
                {fechaRelativa(a.created_at)}
                {a.protegido ? ` · ${a.protegido}` : ""}
              </p>
              {(a.mensaje_familia || a.mensaje_persona) && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-texto">
                  {partesNegrita(a.mensaje_familia || a.mensaje_persona || "").map((p, i) =>
                    p.negrita ? <strong key={i}>{p.texto}</strong> : <span key={i}>{p.texto}</span>,
                  )}
                </p>
              )}
            </>
          );
          const fondo = esNueva
            ? "bg-alerta-fondo"
            : seleccionada === a.id
              ? "bg-panel"
              : "bg-fondo";
          return (
            <li key={a.id} className={`${esNueva ? "animate-entrada" : ""} ${fondo}`}>
              {clickeable ? (
                <button
                  type="button"
                  onClick={() => onSeleccionar(a)}
                  className="block w-full cursor-pointer px-4 py-3 text-left hover:bg-panel"
                >
                  {contenido}
                </button>
              ) : (
                <div className="px-4 py-3">{contenido}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
