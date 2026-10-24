"use client";

import { useEffect, useRef, useState } from "react";
import { GUIONES_DEMO, type GuionDemo } from "@/lib/demo";
import { partesNegrita } from "@/lib/simulador";

// Demo programática: guiones fijos con resultado precalculado (lib/demo.ts).
// No hace ningún request: solo "reproduce" el guion con timers.
const PAUSA_MENSAJE_MS = 900;
const PAUSA_ANALISIS_MS = 1300;

type Fase = "mensajes" | "analizando" | "listo";

function ConNegrita({ texto }: { texto: string }) {
  return (
    <>
      {partesNegrita(texto).map((p, i) =>
        p.negrita ? <strong key={i}>{p.texto}</strong> : <span key={i}>{p.texto}</span>,
      )}
    </>
  );
}

function Estado({ texto, tono }: { texto: string; tono: "neutro" | "ok" }) {
  return (
    <p
      className={`shrink-0 animate-entrada self-center rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
        tono === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-white/90 text-suave"
      }`}
    >
      {texto}
    </p>
  );
}

function Burbuja({ texto, hora }: { texto: string; hora: string }) {
  return (
    <div className="max-w-[85%] shrink-0 animate-entrada self-start rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 text-[15px] leading-snug text-tinta shadow-sm">
      {texto}
      <span className="ml-2 inline-block translate-y-0.5 text-[11px] text-suave">{hora}</span>
    </div>
  );
}

function AlertaMula({ guion }: { guion: GuionDemo }) {
  const r = guion.resultado;
  return (
    <div
      role="alert"
      className="w-[94%] shrink-0 animate-entrada self-center overflow-hidden rounded-lg border-2 border-alerta bg-white shadow-md"
    >
      <div className="flex items-center justify-between gap-2 bg-alerta px-3 py-1.5 text-white">
        <span className="text-sm font-bold">⚠️ Mula AI</span>
        <span className="rounded bg-white/20 px-1.5 text-xs font-semibold">Riesgo {r.riesgo}/100</span>
      </div>
      <div className="px-3 py-2 text-[14px] leading-snug text-tinta">
        {r.red && <p className="mb-1.5 font-semibold text-alerta">{r.red}</p>}
        <p>
          <ConNegrita texto={r.alerta_persona} />
        </p>
      </div>
    </div>
  );
}

export default function DemoGuiada() {
  const [guionId, setGuionId] = useState<string | null>(null);
  const [visibles, setVisibles] = useState(0);
  const [fase, setFase] = useState<Fase>("mensajes");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cuerpo = useRef<HTMLDivElement>(null);

  const guion = GUIONES_DEMO.find((g) => g.id === guionId) ?? null;

  function limpiar() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  useEffect(() => limpiar, []);

  useEffect(() => {
    const el = cuerpo.current;
    if (!el) return;
    // Doble scroll: al render y al terminar la animación de entrada (450 ms).
    const bajar = () => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    requestAnimationFrame(bajar);
    const t = setTimeout(bajar, 500);
    return () => clearTimeout(t);
  }, [visibles, fase]);

  function reproducir(g: GuionDemo) {
    limpiar();
    setGuionId(g.id);
    setVisibles(0);
    setFase("mensajes");
    g.mensajes.forEach((_, i) => {
      timers.current.push(setTimeout(() => setVisibles(i + 1), 300 + i * PAUSA_MENSAJE_MS));
    });
    const finMensajes = 300 + g.mensajes.length * PAUSA_MENSAJE_MS;
    timers.current.push(setTimeout(() => setFase("analizando"), finMensajes - 400));
    timers.current.push(setTimeout(() => setFase("listo"), finMensajes - 400 + PAUSA_ANALISIS_MS));
  }

  const listo = guion && fase === "listo";
  const r = guion?.resultado;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-center gap-2">
        {GUIONES_DEMO.map((g) => {
          const activo = g.id === guionId;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => reproducir(g)}
              aria-pressed={activo}
              className={`h-9 cursor-pointer rounded-full border px-4 text-sm font-medium ${
                activo
                  ? "border-tinta bg-tinta text-white"
                  : "border-linea bg-fondo text-tinta hover:bg-panel"
              }`}
            >
              {g.etiqueta}
            </button>
          );
        })}
      </div>

      <div className="mx-auto grid w-full max-w-4xl items-start gap-6 md:grid-cols-[300px_1fr]">
        <figure className="flex w-full flex-col items-center gap-2">
          <figcaption className="text-sm font-semibold text-tinta">Celular de la abuela Marta</figcaption>
          <div className="flex h-[540px] w-full max-w-[300px] flex-col overflow-hidden rounded-[2rem] border-[6px] border-tinta bg-wa-fondo shadow-lg">
            <div className="flex items-center gap-2.5 bg-wa-barra px-3 py-2.5 text-white">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-sm font-semibold">
                {guion ? (guion.resultado.es_sospechoso ? "?" : guion.remitente[0]) : "?"}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold">{guion?.remitente ?? "WhatsApp"}</p>
                <p className="truncate text-xs text-white/80">{guion?.detalle ?? "esperando mensajes"}</p>
              </div>
            </div>
            <div
              ref={cuerpo}
              className="flex flex-1 flex-col gap-2 overflow-y-auto px-2.5 py-3 [scrollbar-width:none]"
            >
              {!guion && <Estado texto="🛡️ Mula AI está vigilando" tono="neutro" />}
              {guion?.mensajes.slice(0, visibles).map((m, i) => (
                <Burbuja key={`${guion.id}-${i}`} texto={m} hora={`10:4${i + 1}`} />
              ))}
              {guion && fase === "analizando" && <Estado texto="Mula AI analizando…" tono="neutro" />}
              {listo && r?.es_sospechoso && <AlertaMula guion={guion} />}
              {listo && !r?.es_sospechoso && <Estado texto="✓ Mula AI: sin señales de estafa" tono="ok" />}
            </div>
          </div>
        </figure>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-linea bg-fondo">
            <p className="border-b border-linea px-4 py-2.5 text-sm font-semibold text-tinta">
              Qué detectó Mula AI
            </p>
            {listo && r ? (
              <div className="animate-entrada px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span
                    className={`text-2xl font-semibold ${r.es_sospechoso ? "text-alerta" : "text-emerald-700"}`}
                  >
                    {r.riesgo}/100
                  </span>
                  <span className="text-sm text-texto">{r.modalidad_label}</span>
                </div>
                {r.senales.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1.5 text-sm text-texto">
                    {r.senales.map((s) => (
                      <li key={s} className="flex gap-2">
                        <span className="text-alerta" aria-hidden>
                          •
                        </span>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-texto">
                    Ninguna señal de estafa. No se avisa a nadie y no se suma a la red.
                  </p>
                )}
              </div>
            ) : (
              <p className="px-4 py-3 text-sm text-suave">
                {guion ? "Analizando el mensaje…" : "Elegí un guion para ver el análisis."}
              </p>
            )}
          </div>

          <div
            className={`rounded-lg border bg-fondo ${
              listo && r?.es_sospechoso ? "border-alerta-linea" : "border-linea"
            }`}
          >
            <div className="flex items-center gap-2 border-b border-linea px-4 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-panel text-sm" aria-hidden>
                👨‍👩‍👧
              </span>
              <p className="text-sm font-semibold text-tinta">Grupo familiar</p>
            </div>
            {listo && r?.es_sospechoso ? (
              <p className="animate-entrada whitespace-pre-line px-4 py-3 text-base leading-relaxed text-tinta">
                <ConNegrita texto={r.alerta_familia} />
              </p>
            ) : (
              <p className="px-4 py-3 text-sm text-suave">
                {listo
                  ? "Sin alerta: la familia no recibe nada."
                  : "Cuando Mula AI detecta una estafa, la familia se entera acá al mismo tiempo."}
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-suave">
        Demo con resultados precalculados. La detección real corre en el servidor.
      </p>
    </div>
  );
}
