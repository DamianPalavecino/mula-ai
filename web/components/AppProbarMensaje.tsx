"use client";

import { useState } from "react";
import type { RespuestaAnalizar } from "@/lib/tipos";
import { labelModalidad } from "@/lib/tipos";
import { EJEMPLOS_PROBAR, lineaRed } from "@/lib/probar";
import { IconoChat, IconoGiro, IconoOk, IconoPeligro } from "@/components/iconos";

type Estado =
  | { tipo: "inicial" }
  | { tipo: "cargando"; texto: string }
  | { tipo: "listo"; texto: string; r: RespuestaAnalizar }
  | { tipo: "error"; texto: string; mensaje: string };

const MAX = 2000;

// "Probar un mensaje": pasa por /app/api/analizar (server, con sesión). No manda WhatsApp.
export default function AppProbarMensaje() {
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });
  const cargando = estado.tipo === "cargando";

  async function analizar(t: string) {
    const limpio = t.trim().slice(0, MAX);
    if (!limpio) return;
    setTexto("");
    setEstado({ tipo: "cargando", texto: limpio });
    try {
      const res = await fetch("/app/api/analizar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: limpio }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || typeof json.riesgo !== "number") {
        setEstado({ tipo: "error", texto: limpio, mensaje: json?.error ?? "No pudimos analizar el mensaje." });
        return;
      }
      setEstado({ tipo: "listo", texto: limpio, r: json as RespuestaAnalizar });
    } catch {
      setEstado({ tipo: "error", texto: limpio, mensaje: "No pudimos analizar el mensaje." });
    }
  }

  const enviado = estado.tipo === "inicial" ? null : estado.texto;

  return (
    <section className="overflow-hidden rounded-3xl border border-linea bg-wa-fondo">
      {/* Cabecera estilo WhatsApp: número desconocido */}
      <div className="flex items-center gap-3 bg-wa-barra px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-semibold">?</span>
        <div className="leading-tight">
          <p className="font-semibold">+54 9 11 3871-2290</p>
          <p className="text-xs text-white/80">número desconocido</p>
        </div>
      </div>

      <div className="flex min-h-56 flex-col gap-3 p-4">
        {!enviado && (
          <p className="self-center rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-suave">
            Elegí un mensaje o escribí uno
          </p>
        )}
        {enviado && (
          <div className="max-w-[85%] animate-entrada self-start rounded-2xl rounded-tl-none bg-white px-3.5 py-2 text-[15px] leading-snug text-tinta shadow-sm">
            {enviado}
          </div>
        )}
        {cargando && (
          <p className="flex items-center gap-2 self-center rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-suave">
            <IconoGiro className="h-3.5 w-3.5" /> Mula AI analizando…
          </p>
        )}
        {estado.tipo === "error" && (
          <p className="flex items-center gap-2 self-center rounded-full bg-white px-3 py-1.5 text-sm font-medium text-texto">
            <IconoPeligro className="h-4 w-4 text-suave" /> {estado.mensaje}
          </p>
        )}
        {estado.tipo === "listo" && <Resultado r={estado.r} />}
      </div>

      <div className="border-t border-black/5 bg-wa-composer p-3">
        <div className="-mx-3 mb-2 flex gap-2 overflow-x-auto px-3 [scrollbar-width:none]">
          {EJEMPLOS_PROBAR.map((m) => (
            <button
              key={m.etiqueta}
              type="button"
              disabled={cargando}
              onClick={() => analizar(m.texto)}
              className={`presionable flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${
                m.normal
                  ? "border-seguro-linea bg-seguro-fondo text-seguro"
                  : "border-alerta-linea bg-alerta-fondo text-alerta"
              }`}
            >
              <IconoChat className="h-4 w-4" />
              {m.etiqueta}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            analizar(texto);
          }}
        >
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={MAX}
            rows={1}
            placeholder="Pegá un mensaje"
            aria-label="Mensaje a analizar"
            className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-3xl bg-white px-4 py-2.5 text-[15px] text-tinta placeholder:text-suave focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Analizar"
            disabled={cargando || !texto.trim()}
            className="presionable flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-wa-barra text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.1 15 12 3.4 13.9z" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}

function Resultado({ r }: { r: RespuestaAnalizar }) {
  if (!r.es_sospechoso) {
    return (
      <div className="flex animate-entrada items-center gap-3 self-center rounded-2xl border-2 border-seguro-linea bg-seguro-fondo px-4 py-3 text-seguro">
        <IconoOk className="h-7 w-7" />
        <div>
          <p className="font-bold">Sin señales de estafa</p>
          <p className="text-sm">Riesgo {r.riesgo}/100</p>
        </div>
      </div>
    );
  }
  const red = lineaRed(r.entidades ?? []);
  return (
    <div role="alert" className="w-full max-w-md animate-entrada self-center overflow-hidden rounded-2xl border-2 border-alerta bg-white shadow-lg">
      <div className="flex items-center justify-between gap-3 bg-alerta px-4 py-3 text-white">
        <span className="flex items-center gap-2 text-lg font-extrabold">
          <IconoPeligro className="h-6 w-6" /> No transfieras
        </span>
        <span className="text-3xl font-extrabold tabular-nums">
          {r.riesgo}
          <span className="text-base font-semibold opacity-80">/100</span>
        </span>
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        <p className="font-semibold text-tinta">{labelModalidad(r.modalidad)}</p>
        {red && <p className="text-sm font-semibold text-alerta">{red}</p>}
        {r.senales?.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {r.senales.map((s) => (
              <li key={s} className="rounded-full border border-alerta-linea bg-alerta-fondo px-2.5 py-0.5 text-sm text-alerta">
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
