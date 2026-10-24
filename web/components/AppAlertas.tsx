"use client";

import { useEffect, useRef, useState } from "react";
import type { Alerta } from "@/lib/tipos";
import { labelModalidad } from "@/lib/tipos";
import { fechaRelativa } from "@/lib/formato";
import { partesNegrita } from "@/lib/simulador";

const MAX = 30;
const CADA_MS = 4000;

function Negritas({ texto }: { texto: string }) {
  return (
    <>
      {partesNegrita(texto).map((p, i) =>
        p.negrita ? <strong key={i}>{p.texto}</strong> : <span key={i}>{p.texto}</span>,
      )}
    </>
  );
}

function Riesgo({ valor }: { valor: number | null }) {
  if (valor == null) return null;
  const color =
    valor >= 70 ? "bg-alerta text-white" : valor >= 40 ? "bg-orange-500 text-white" : "bg-panel text-tinta";
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-sm font-semibold ${color}`}>Riesgo {valor}</span>
  );
}

// Alertas de mis protegidos. Polling a /app/api/alertas (el browser no habla con Supabase).
export default function AppAlertas({ iniciales, nombre }: { iniciales: Alerta[]; nombre: string }) {
  const [alertas, setAlertas] = useState<Alerta[]>(iniciales);
  const [nuevas, setNuevas] = useState<number[]>([]);
  const [conectado, setConectado] = useState(true);
  const [, setTick] = useState(0);
  const maxId = useRef(iniciales.reduce((m, a) => Math.max(m, a.id), 0));

  useEffect(() => {
    let vivo = true;
    async function traer() {
      try {
        const res = await fetch(`/app/api/alertas?desde=${maxId.current}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const { alertas: llegaron } = (await res.json()) as { alertas: Alerta[] };
        if (!vivo) return;
        setConectado(true);
        if (!llegaron?.length) return;
        maxId.current = llegaron.reduce((m, a) => Math.max(m, a.id), maxId.current);
        const ids = llegaron.map((a) => a.id);
        setAlertas((actuales) =>
          [...llegaron, ...actuales.filter((a) => !ids.includes(a.id))]
            .sort((a, b) => b.id - a.id)
            .slice(0, MAX),
        );
        setNuevas((n) => [...n, ...ids]);
        setTimeout(() => setNuevas((n) => n.filter((id) => !ids.includes(id))), 6000);
      } catch {
        if (vivo) setConectado(false);
      }
    }
    const poll = setInterval(traer, CADA_MS);
    const reloj = setInterval(() => setTick((t) => t + 1), 30000);
    return () => {
      vivo = false;
      clearInterval(poll);
      clearInterval(reloj);
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-linea bg-fondo">
      <div className="flex items-center justify-between border-b border-linea px-4 py-3">
        <h2 className="text-base font-semibold text-tinta">Alertas</h2>
        <span className="flex items-center gap-2 text-sm text-suave">
          <span className={`h-2 w-2 rounded-full ${conectado ? "bg-emerald-600" : "bg-linea"}`} aria-hidden />
          {conectado ? "En vivo" : "Reconectando…"}
        </span>
      </div>
      <ul className="divide-y divide-linea">
        {alertas.length === 0 && (
          <li className="px-4 py-6 text-sm leading-relaxed text-suave">
            Sin alertas por ahora. Cuando llegue un mensaje sospechoso al WhatsApp de {nombre}, lo vas a
            ver acá.
          </li>
        )}
        {alertas.map((a) => (
          <li
            key={a.id}
            className={`px-4 py-4 ${nuevas.includes(a.id) ? "animate-entrada bg-alerta-fondo" : "bg-fondo"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold text-tinta">{labelModalidad(a.modalidad)}</p>
              <Riesgo valor={a.riesgo} />
            </div>
            <p className="mt-0.5 text-sm text-suave">
              {fechaRelativa(a.created_at)}
              {a.protegido ? ` · ${a.protegido}` : ""}
            </p>
            {a.mensaje_familia && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-texto">
                <Negritas texto={a.mensaje_familia} />
              </p>
            )}
            {a.mensaje_persona && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-suave hover:text-tinta">
                  Lo que le avisamos a {a.protegido ?? nombre}
                </summary>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-texto">
                  <Negritas texto={a.mensaje_persona} />
                </p>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
