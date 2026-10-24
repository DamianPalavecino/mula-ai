"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Alerta } from "@/lib/tipos";
import { labelModalidad } from "@/lib/tipos";
import { fechaRelativa } from "@/lib/formato";

const MAX = 20;

// Últimas alertas + suscripción Realtime (INSERT en public.alertas).
export default function AlertFeed({
  onNueva,
  onSeleccionar,
  seleccionada,
}: {
  onNueva: (alerta: Alerta) => void;
  onSeleccionar: (alerta: Alerta) => void;
  seleccionada: number | null;
}) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [nuevas, setNuevas] = useState<number[]>([]);
  const [enVivo, setEnVivo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [, setTick] = useState(0);
  const onNuevaRef = useRef(onNueva);
  onNuevaRef.current = onNueva;

  useEffect(() => {
    if (!supabase) return;
    const sb = supabase;

    sb.from("alertas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(MAX)
      .then(({ data }) => {
        setAlertas((actuales) => {
          // Si entró algo por Realtime mientras cargábamos, no lo perdemos.
          const ids = new Set(actuales.map((a) => a.id));
          return [...actuales, ...((data ?? []) as Alerta[]).filter((a) => !ids.has(a.id))].slice(0, MAX);
        });
        setCargando(false);
      });

    const canal = sb
      .channel("alertas-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alertas" },
        (payload) => {
          const alerta = payload.new as Alerta;
          setAlertas((actuales) =>
            [alerta, ...actuales.filter((a) => a.id !== alerta.id)].slice(0, MAX),
          );
          setNuevas((ids) => [...ids, alerta.id]);
          setTimeout(() => setNuevas((ids) => ids.filter((id) => id !== alerta.id)), 6000);
          onNuevaRef.current(alerta);
        },
      )
      .subscribe((estado) => setEnVivo(estado === "SUBSCRIBED"));

    // Refresca las fechas relativas ("hace 2 minutos").
    const reloj = setInterval(() => setTick((t) => t + 1), 30000);

    return () => {
      clearInterval(reloj);
      sb.removeChannel(canal);
    };
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
          {enVivo ? "En vivo" : "Conectando…"}
        </span>
      </div>

      <ul className="flex-1 divide-y divide-linea overflow-y-auto">
        {!cargando && alertas.length === 0 && (
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
                  {a.mensaje_familia || a.mensaje_persona}
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
